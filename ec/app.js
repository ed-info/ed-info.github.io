(function () {
'use strict';
/* ── DOM refs ─────────────────────────────────────────────── */
var canvas = document.getElementById('sim-canvas');
if (!canvas) return; // safety
var ctx = canvas.getContext('2d');
var canvasCard = document.getElementById('canvas-card');
var simPanel = document.getElementById('sim-panel');
var palette = document.getElementById('palette');
var propsPanel = document.getElementById('props-panel');
var propsBody = document.getElementById('props-body');
var toolbarHint = document.getElementById('toolbar-hint');
var hintBanner = document.getElementById('hint-banner');
var hintDismissBtn = document.getElementById('hint-dismiss');
/* ── World / viewport transform ──────────────────────────── */
var DPR = Math.min(window.devicePixelRatio || 1, 2);
var viewOffX = 0, viewOffY = 0, viewScale = 1;
var MIN_SCALE = 0.3, MAX_SCALE = 3;
var cssW = 0, cssH = 0;
function toSX(wx) { return (wx + viewOffX) * viewScale; }
function toSY(wy) { return (wy + viewOffY) * viewScale; }
function toWX(sx) { return sx / viewScale - viewOffX; }
function toWY(sy) { return sy / viewScale - viewOffY; }
function formatV(v) {
if (v == null || isNaN(v)) return '';
var av = Math.abs(v);
if (av >= 1e6) return (v / 1e6).toFixed(av >= 1e7 ? 0 : 1) + ' МВ';
if (av >= 1e3) return (v / 1e3).toFixed(av >= 1e4 ? 0 : 1) + ' кВ';
if (av >= 1)   return v.toFixed(v % 1 ? 1 : 0) + ' В';
return (v * 1000).toFixed(0) + ' мВ';
}
function formatR(r) {
if (r == null || isNaN(r)) return '';
if (r >= 1e6) return (r / 1e6).toFixed(1) + ' МОм';
if (r >= 1000) return (r / 1000).toFixed(r >= 10000 ? 0 : 1) + ' кОм';
return r.toFixed(r % 1 ? 1 : 0) + ' Ом';
}
// Auto-scale a meter reading to a SI prefix that fits in 3-4 chars.
// Returns { val:'12.0', unit:'кВ' } so the meter draws value + unit on two lines.
// baseUnit is 'В' or 'А'.
function autoMeter(absVal, baseUnit) {
if (absVal == null || isNaN(absVal)) return { val: '0.00', unit: baseUnit } ;
var scales = [
{ thresh: 1e9,  div: 1e9,  pre: 'Г' },
{ thresh: 1e6,  div: 1e6,  pre: 'М' },
{ thresh: 1e3,  div: 1e3,  pre: 'к' },
{ thresh: 1,    div: 1,    pre: ''  },
{ thresh: 1e-3, div: 1e-3, pre: 'м' },
{ thresh: 0,    div: 1e-6, pre: 'мк' }
];
var s;
for (var i = 0; i < scales.length; i++) {
if (absVal >= scales[i].thresh) { s = scales[i]; break; }
}
if (!s) s = scales[scales.length - 1];
var v = absVal / s.div;
// pick a precision that keeps the string short (fits inside the 36p x circle face)
var str;
if (v >= 100) str = v.toFixed(0);
else if (v >= 10) str = v.toFixed(1);
else if (v >= 0.01) str = v.toFixed(2);
else if (absVal > 0) str = ' <0.01';   // non-zero but rounds to 0 at this prefix
else str = '0.00';
return { val: str, unit: s.pre + baseUnit };
}
function resizeCanvas() {
var rect = canvas.getBoundingClientRect();
cssW = rect.width;
cssH = rect.height || 460;
canvas.width = Math.round(cssW * DPR);
canvas.height = Math.round(cssH * DPR);
scheduleDraw();
}
window.addEventListener('resize', resizeCanvas);
/* ── State ────────────────────────────────────────────────── */
var state = {
components: [],      // {id, type, x, y, rot, props:{}, state:{}}
connections: [],     // added in slice 2
annStrokes: [],      // added in slice 3
annShapes: [],       // added in slice 3
nextId: 1
};
var selectedId = null;         // component id
var selectedConnId = null;     // connection id
var hoverId = null;
var hoverPort = null;          // { compId, portIdx }
var hoverConnId = null;
var tool = 'move';  // move | sketch | shape | pan
var isRunning = false;
var wasRunningBeforeFault = false; // true when sim was stopped due to a runtime fault (KZ)
var currentMode = 'simulate';
// wiring in progress
var pendingWire = null;        // { from:{compId,portIdx}, waypoints:[{x,y}], cursor:{x,y} }
// annotation state
var sketchColor = '#ffffff', sketchWidth = 2;
var shapeType = 'rect', shapeColor = '#ffffff', shapeWidth = 2, shapeFilled = false;
var selectedShape = null;  // legacy; kept only for text-edit index
var annSel = null; // {type:'shape'|'stroke', idx}
var annVisible = true;
var showNodeVoltages = false; // X4: opt-in node-voltage labels
var textEditing = null;    // shape index while editing text
// drag state
var drag = null; // {kind:'move'|'pan'|'sketch'|'shape-draw'|'shape-move', ...}
// solver dirty flag — set whenever circuit topology or component params change
var circuitDirty = true;
function markDirty(){ circuitDirty = true; if (typeof faults !== 'undefined' && faults) clearFaults(); }
// undo stack
var undoStack = [], redoStack = [];
var MAX_UNDO = 30;
function snapshot() {
return JSON.stringify({
components: state.components,
connections: state.connections,
annStrokes: state.annStrokes,
annShapes: state.annShapes,
nextId: state.nextId
});
}
function saveUndo() {
undoStack.push(snapshot());
if (undoStack.length > MAX_UNDO) undoStack.shift();
redoStack.length = 0;
markDirty();
}
function restore(snap) {
var s = JSON.parse(snap);
state.components = s.components || [];
state.connections = s.connections || [];
state.annStrokes = s.annStrokes || [];
state.annShapes = s.annShapes || [];
state.nextId = s.nextId || 1;
selectedId = null;
renderProps();
markDirty();
scheduleDraw();
}
function doUndo() {
if (!undoStack.length) return;
redoStack.push(snapshot());
restore(undoStack.pop());
}
function doRedo() {
if (!redoStack.length) return;
undoStack.push(snapshot());
restore(redoStack.pop());
}
/* ── Component definitions ───────────────────────────────── */
// ports[] are in local (unrotated) coords relative to component center
var COMP_DEFS = {
battery:    { w: 80, h: 40, label: 'V',  ports: [{x:-40,y:0,name:'+'},{x:40,y:0,name:'-'}], props: { V: 9 } },
ground:     { w: 40, h: 40, label: 'GND',ports: [{x:0,y:-20,name:'n'}], props: {} },
resistor:   { w: 80, h: 30, label: 'R',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 220 } },
rheostat:   { w: 80, h: 30, label: 'R',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 100, Rmax: 1000 } },
lamp:       { w: 60, h: 60, label: 'L',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 48 } },
led:        { w: 60, h: 40, label: 'D',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'k'}], props: { Vf: 2.0, R: 30, color:'green' } },
fan:        { w: 70, h: 70, label: 'M',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { R: 24 } },
buzzer:     { w: 60, h: 50, label: 'BZ', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 120 } },
heater:     { w: 80, h: 40, label: 'H',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 12 } },
switch:     { w: 70, h: 30, label: 'S',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { closed: false } },
pushbutton: { w: 60, h: 30, label: 'PB', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { closed: false } },
ammeter:    { w: 60, h: 60, label: 'A',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
voltmeter:  { w: 60, h: 60, label: 'V',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
junction:   { w: 20, h: 20, label: '',   ports: [{x:-10,y:0,name:'a'},{x:10,y:0,name:'b'},{x:0,y:-10,name:'c'}], props: {} },
junction4:  { w: 20, h: 20, label: '',   ports: [{x:-10,y:0,name:'a'},{x:10,y:0,name:'b'},{x:0,y:-10,name:'c'},{x:0,y:10,name:'d'}], props: {} }
};
var COMP_LABELS = {
battery:'Батарея', ground:'Земля', resistor:'Резистор', rheostat:'Реостат',
lamp:'Лампа', led:'Світлодіод', fan:'Вентилятор', buzzer:'Зумер', heater:'Нагрівач',
switch:'Вимикач', pushbutton:'Кнопка', ammeter:'Амперметр', voltmeter:'Вольтметр',
junction:'Вузол', junction4:'Вузол (4 порти)'
};
function makeComponent(type, x, y) {
var def = COMP_DEFS[type];
if (!def) return null;
var props = {};
for (var k in def.props) props[k] = def.props[k];
return {
id: state.nextId++,
type: type,
x: x, y: y,
rot: 0,
props: props,
state: {}
};
}
/* ── Rotate helper ─────────────────────────────────────────  */
function rotatePoint(px, py, rot) {
// rot in 0/90/180/270 degrees
var r = rot * Math.PI / 180;
var c = Math.cos(r), s = Math.sin(r);
return { x: px * c - py * s, y: px * s + py * c };
}
function portWorld(comp, portIdx) {
var def = COMP_DEFS[comp.type];
var p = def.ports[portIdx];
var rp = rotatePoint(p.x, p.y, comp.rot);
return { x: comp.x + rp.x, y : comp.y + rp.y };
}
function compBounds(comp) {
var def = COMP_DEFS[comp.type];
var w = def.w, h = def.h;
// after rotation, bounding box swaps if 90/270
if (comp.rot % 180 !== 0)  { var t = w; w = h; h = t; }
return { x: comp.x - w/2, y: comp.y - h/2, w: w, h: h };
}
function hitComponent(wx, wy) {
for (var i = state.components.length - 1; i >= 0; i--) {
var c = state.components[i];
var b = compBounds(c);
if (wx >= b.x && wx <= b.x+b.w && wy >= b.y && wy <= b.y+b.h) return c;
}
return null;
}
function hitPort(wx, wy, tol) {
tol = tol != null ? tol : 8;
for (var i = state.components.length - 1; i >= 0; i--) {
var c = state.components[i];
var def = COMP_DEFS[c.type];
for (var j = 0; j < def.ports.length; j++) {
var p = portWorld(c, j);
if (Math.abs(p.x - wx) < tol && Math.abs(p.y - wy) < tol) {
return { compId: c.id, portIdx: j, x: p.x, y: p.y };
}
}
}
return null;
}
// Returns {conn, end:'from'|'to', x, y} for a dangling anchor end near (wx,wy)
function hitDanglingEnd(wx, wy, tol) {
tol = tol != null ? tol : 10;
for (var i = 0; i < state.connections.length; i++) {
var conn = state.connections[i];
if (conn.from.anchor) {
var a = conn.from.anchor;
if (Math.abs(a.x - wx) < tol && Math.abs(a.y - wy) < tol) return { conn: conn, end: 'from', x: a.x, y: a.y };
}
if (conn.to.anchor) {
var b = conn.to.anchor;
if (Math.abs(b.x - wx) < tol && Math.abs(b.y - wy) < tol) return { conn: conn, end: 'to', x: b.x, y: b.y };
}
}
return null;
}
function connectionPoints(conn) {
var a, b;
// Support dangling ends: {anchor:{x,y}} when the component was deleted
if (conn.from.anchor) {
a = conn.from.anchor;
} else {
var fc = state.components.find(function(x){return x.id===conn.from.compId;});
if (!fc) return null;
a = portWorld(fc, conn.from.portIdx);
}
if (conn.to.anchor) {
b = conn.to.anchor;
} else {
var tc = state.components.find(function(x){return x.id===conn.to.compId;});
if (!tc) return null;
b = portWorld(tc, conn.to.portIdx);
}
var pts = [a];
(conn.waypoints || []).forEach(function (wp) { pts.push({x:wp.x,y:wp.y}); });
pts.push(b);
// expand each segment into orthogonal (horizontal then vertical)
var ortho = [pts[0]];
for (var i = 1; i < pts.length; i++) {
var p0 = ortho[ortho.length-1], p1 = pts[i];
if (p0.x !== p1.x && p0.y !== p1.y) {
ortho.push({x: p1.x, y: p0.y});
}
ortho.push(p1);
}
return ortho;
}
function hitConnection(wx, wy, tol) {
tol = tol || 6;
for (var i = 0; i < state.connections.length; i++) {
var conn = state.connections[i];
var pts = connectionPoints(conn);
if (!pts) continue;
for (var j = 0; j < pts.length - 1; j++) {
var a = pts[j], b = pts[j+1];
if (pointOnSegment(wx, wy, a, b, tol)) return conn;
}
}
return null;
}
function pointOnSegment(px, py, a, b, tol) {
var minX = Math.min(a.x,b.x) - tol, maxX = Math.max(a.x,b.x) + tol;
var minY = Math.min(a.y,b.y) - tol, maxY = Math.max(a.y,b.y) + tol;
if (px < minX || px > maxX || py < minY || py > maxY) return false;
if (a.x === b.x) return Math.abs(px - a.x) < tol;
if (a.y === b.y) return Math.abs(py - a.y) < tol;
return false;
}
// Splice an existing connection at point p by inserting a 4-way junction.
// Returns { jcomp, freePortIdx } so the caller can attach a wire to the perpendicular port.
// freePortIdx prefers the side closest to `approach` (a world point of the incoming wire's previous vertex).
function tapIntoConnection(conn, p, approach) {
var pts = connectionPoints(conn);
if (!pts) return null;
var bestIdx = -1, bestDist = Infinity, bestProj = null, bestOrient = null;
for (var j = 0; j < pts.length - 1; j++) {
var a = pts[j], b = pts[j+1];
if (a.x === b.x) {
var py = Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), p.y));
var d = Math.abs(p.x - a.x);
if (d < bestDist) { bestDist = d; bestIdx = j; bestProj = {x:a.x, y:py}; bestOrient = 'V'; }
} else if (a.y === b.y) {
var px = Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), p.x));
var d2 = Math.abs(p.y - a.y);
if (d2 < bestDist) { bestDist = d2; bestIdx = j; bestProj = {x:px, y:a.y}; bestOrient = 'H'; }
}
}
if (bestIdx < 0) return null;
var jx = Math.round(bestProj.x/10)*10, jy = Math.round(bestProj.y/10)*10;
var jcomp = makeComponent('junction4', jx, jy);
state.components.push(jcomp);

// junction4 ports: 0=a(left x=-10), 1=b(right x=+10), 2=c(top y=-10), 3=d(bottom y=+10)
var portFrom, portTo, freePort;
var fc = state.components.find(function(x){return x.id===conn.from.compId;});
var fromW = fc ? portWorld(fc, conn.from.portIdx) : null;
if (bestOrient === 'H') {
  // original wire is horizontal — consume left/right ports for it
  portFrom = (fromW && fromW.x < jx) ? 0 : 1;
  portTo   = portFrom === 0 ? 1 : 0;
  // perpendicular pair (top/bottom) free for tap; pick side near approach
  freePort = (approach && approach.y > jy) ? 3 : 2;
} else {
  // vertical — consume top/bottom ports
  portFrom = (fromW && fromW.y < jy) ? 2 : 3;
  portTo   = portFrom === 2 ? 3 : 2;
  freePort = (approach && approach.x > jx) ? 1 : 0;
}

var origWps = (conn.waypoints || []).slice();
var origIdx = state.connections.indexOf(conn);
if (origIdx >= 0) state.connections.splice(origIdx, 1);

state.connections.push({
  id: state.nextId++,
  from: conn.from,
  to: { compId: jcomp.id, portIdx: portFrom },
  waypoints: origWps
} );
state.connections.push({
  id: state.nextId++,
  from: { compId: jcomp.id, portIdx: portTo },
  to: conn.to,
  waypoints: []
});
return { jcomp: jcomp, freePort: freePort };
}
function removeConnectionsForComponent(compId) {
state.connections = state.connections.filter(function (c) {
return c.from.compId !== compId && c.to.compId !== compId;
});
}
/* ── Auto-routing ────────────────────────────────────────── */
// Returns the outward unit direction the wire should leave a port along.
function portDirection(comp, portIdx) {
var def = COMP_DEFS[comp.type];
var p = def.ports[portIdx];
var dx = 0, dy = 0;
if (Math.abs(p.x) >= Math.abs(p.y)) {
dx = p.x >= 0 ? 1 : -1;
} else {
dy = p.y >= 0 ? 1 : -1;
}
var r = rotatePoint(dx, dy, comp.rot || 0);
// snap to integer axis after rotation (rot is multiple of 90)
return { dx: Math.round(r.x), dy: Math.round(r.y) };
}
function snapG(v) { return Math.round(v / 10) * 10; }
// Returns inflated bounding boxes of every component except those in `exceptIds`.
function obstacleBoxes(exceptIds) {
var pad = 6;
var boxes = [];
for (var i = 0; i < state.components.length; i++) {
var c = state.components[i];
if (exceptIds && exceptIds.indexOf(c.id) >= 0) continue;
if (c.type === 'junction' || c.type === 'junction4' || c.type === 'ground') continue;
var b = compBounds(c);
boxes.push({ x: b.x - pad, y: b.y - pad, w: b.w + 2*pad, h: b.h + 2*pad });
}
return boxes;
}
// Does the orthogonal segment a→b intersect any obstacle box?
function segmentHitsBoxes(a, b, boxes) {
var minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
var minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
for (var i = 0; i < boxes.length; i++) {
var bx = boxes[i];
if (maxX < bx.x || minX > bx.x + bx.w) continue;
if (maxY < bx.y || minY > bx.y + bx.h) continue;
return bx;
}
return null;
}
function pathHitsBoxes(pts, boxes) {
for (var i = 1; i < pts.length; i++) {
if (segmentHitsBoxes(pts[i-1], pts[i], boxes)) return true;
}
return false;
}
// Build an orthogonal route between two stub points whose outgoing
// axis we know (dirA, dirB are unit vectors).
function routeBetweenStubs(p1, dirA, p2, dirB) {
var hA = dirA.dx !== 0;
var hB = dirB.dx !== 0;
if (hA && hB) {
if (p1.y === p2.y) return [];
var midX = snapG((p1.x + p2.x) / 2);
if (dirA.dx > 0 && midX < p1.x) midX = p1.x + 20;
if (dirA.dx < 0 && midX > p1.x) midX = p1.x - 20;
if (dirB.dx > 0 && midX < p2.x) midX = p2.x + 20;
if (dirB.dx < 0 && midX > p2.x) midX = p2.x - 20;
return [{ x: midX, y: p1.y }, { x: midX, y: p2.y }];
}
if (!hA && !hB) {
if (p1.x === p2.x) return [];
var midY = snapG((p1.y + p2.y) / 2);
if (dirA.dy > 0 && midY < p1.y) midY = p1.y + 20;
if (dirA.dy < 0 && midY > p1.y) midY = p1.y - 20;
if (dirB.dy > 0 && midY < p2.y) midY = p2.y + 20;
if (dirB.dy < 0 && midY > p2.y) midY = p2.y - 20;
return [{ x: p1.x, y: midY }, { x: p2.x, y: midY }];
}
// mixed: single L corner
if (hA && !hB) return [{ x: p2.x, y: p1.y }];
return [{ x: p1.x, y: p2.y }];
}
// Try a few detour candidates if the basic Z hits an obstacle.
function detourAround(p1, dirA, p2, dirB, boxes) {
var basic = routeBetweenStubs(p1, dirA, p2, dirB);
var path = [p1].concat(basic).concat([p2]);
if (!pathHitsBoxes(path, boxes)) return basic;
var ux1 = Math.min(p1.x, p2.x), uy1 = Math.min(p1.y, p2.y);
var ux2 = Math.max(p1.x, p2.x), uy2 = Math.max(p1.y, p2.y);
var hits = boxes.filter(function (b) {
  return !(b.x + b.w < ux1 || b.x > ux2 || b.y + b.h < uy1 || b.y > uy2);
});
if (!hits.length) return basic;
var ox1 = Math.min.apply(null, hits.map(function(b){return b.x;}));
var oy1 = Math.min.apply(null, hits.map(function(b){return b.y;}));
var ox2 = Math.max.apply(null, hits.map(function(b){return b.x + b.w;}));
var oy2 = Math.max.apply(null, hits.map(function(b){return b.y + b.h;}));

var candidates = [
  [{x:p1.x, y:snapG(oy1) - 10}, {x:p2.x, y:snapG(oy1) - 10}],
  [{x:p1.x, y:snapG(oy2) + 10}, {x:p2.x, y:snapG(oy2) + 10}],
  [{x:snapG(ox1) - 10, y:p1.y}, {x:snapG(ox1) - 10, y:p2.y}],
  [{x:snapG(ox2) + 10, y:p1.y}, {x:snapG(ox2) + 10, y:p2.y}]
];
for (var i = 0; i < candidates.length; i++) {
  var cp = [p1].concat(candidates[i]).concat([p2]);
  if (!pathHitsBoxes(cp, boxes)) return candidates[i];
}
return basic;
}
function autoRouteWire(fromComp, fromPort, toComp, toPort) {
var a = portWorld(fromComp, fromPort);
var b = portWorld(toComp, toPort);
var dirA = portDirection(fromComp, fromPort);
var dirB = portDirection(toComp, toPort);
var STUB = 20;
var p1 = { x: snapG(a.x + dirA.dx * STUB), y: snapG(a.y  + dirA.dy * STUB) };
var p2 = { x: snapG(b.x + dirB.dx * STUB), y: snapG(b.y + dirB.dy * STUB) };
if (a.x === b.x && (dirA.dx === 0) && (dirB.dx === 0)) return [];
if (a.y === b.y && (dirA.dy === 0) && (dirB.dy === 0)) return [];
var boxes = obstacleBoxes([fromComp.id, toComp.id]);
var mid = detourAround(p1, dirA, p2, dirB, boxes);
var wps = [p1].concat(mid).concat([p2]);
var out = [];
for (var i = 0; i < wps.length; i++) {
var w = wps[i];
if (out.length && out[out.length-1].x === w.x && out[out.length-1].y === w.y) continue;
out.push(w);
}
return out;
}
/* ── Palette icons (schematic mini-drawings) ─────────────── */
function drawPaletteIcons() {
var items = palette.querySelectorAll('.palette-item');
items.forEach(function (it) {
var type = it.getAttribute('data-type');
var cv = it.querySelector('canvas.palette-icon');
if (!cv) return;
var g = cv.getContext('2d');
var w = cv.width, h = cv.height;
g.clearRect(0,0,w,h);
g.save();
g.translate(w/2, h/2);
g.strokeStyle = '#ffa000';
g.fillStyle = '#ffa000';
g.lineWidth = 1.5;
drawComponentShape(g, type, 0.45);
g.restore();
});
}
/* ── Component drawing ───────────────────────────────────── */
function drawComponentShape(g, type, s, opts) {
s = s || 1;
opts = opts || {};
var def = COMP_DEFS[type];
var w = def.w * s, h = def.h * s;
var glow = opts.glow || 0;
g.lineWidth = Math.max(1, 2*s);

switch (type) {
  case 'battery': {
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-15*s, 0);
    g.moveTo(w/2,  0); g.lineTo( 15*s, 0);
    g.stroke();
    var cells = [
      { x : -14*s, long: true  },
      { x:  -6*s, long: false },
      { x:   6*s, long: true  },
      { x:  14*s, long: false }
    ];
    cells.forEach(function(c) {
      var hy = c.long ? 11*s : 6*s;
      g.beginPath();
      g.moveTo(c.x, -hy); g.lineTo(c.x, hy);
      if (!c.long) {g.moveTo(c.x-3, -hy); g.lineTo(c.x-3, hy); g.moveTo(c.x-2, -hy); g.lineTo(c.x-2, hy);g.moveTo(c.x-1, -hy); g.lineTo(c.x-1, hy); }
      g.stroke();
    });
    g.font = 'bold '+(9*s).toFixed(0)+'px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('+', -14*s, -13*s);
    g.fillText('−', 14*s,  -7*s);
    break;
  }
  case 'ground': {
    g.beginPath();
    g.moveTo(0, -h/2); g.lineTo(0, 0);
    g.moveTo(-14*s, 0); g.lineTo( 14*s, 0);
    g.moveTo(-9*s,  5*s); g.lineTo(9*s,  5*s);
    g.moveTo(-4*s, 10*s); g.lineTo(4*s, 10*s);
    g.stroke();
    break;
  }
  case 'resistor': {
    var rw = 22*s, rh = 9*s;
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-rw, 0);
    g.moveTo( w/2, 0); g.lineTo( rw, 0);
    g.stroke();
    g.beginPath();
    g.rect(-rw, -rh, rw*2, rh*2);
    g.stroke();
    break;
  }
  case 'rheostat': {
    var rw = 22*s, rh = 9*s;
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-rw, 0);
    g.moveTo( w/2, 0); g.lineTo( rw, 0);
     g.stroke();
    g.beginPath();
    g.rect(-rw, -rh, rw*2, rh*2);
    g.stroke();
    g.beginPath() ;
    g.moveTo(-rw + 2*s, rh + 8*s); g.lineTo(rw - 2*s-2, -rh - 8*s+2);
    g.stroke();
    var ax = rw - 2*s, ay = -rh - 8*s;
    var adx = (rw*2 - 4*s),  ady = -(rh*2 + 16*s);
    var al = Math.sqrt(adx*adx + ady*ady);
    var nx = adx/al, ny = ady/al;
    var px = -ny, py = nx;
    var al2 = 5*s;
    g.beginPath();
    g.moveTo(ax , ay);
    g.lineTo(ax - nx*al2 + px*al2*0.5, ay - ny*al2 + py*al2*0.5);
    g.lineTo(ax - nx*al2 - px*al2*0.5, ay - ny*al2 - py*al2*0.5);
    g.closePath();
    g.fill();
    break;
  }
  case 'lamp': {
    var lr = 14*s;
    if (glow > 0) {
      var rg = g.createRadialGradient(0, 0, lr * 0.5, 0, 0, lr * 2.4);
      rg.addColorStop(0, 'rgba(255,240,80,'  + (0.55 + 0.45*glow) + ')');
      rg.addColorStop(0.4, ' rgba(255,200,40,'+ (0.3  + 0.4 *glow) + ')');
      rg.addColorStop(1,   'rgba(255,160,0,0)');
      g.save();
      g.fillStyle = rg;
      g.beginPath();
      g.arc(0, 0, lr * 2.4, 0, Math.PI*2);
      g.fill();
      g.restore();
    }
    var lampColor = glow > 0
      ? 'rgba(255,' + Math.round(220 + 35*(1-glow)) + ',' + Math.round(60*glow) + ',1)'
      : g.strokeStyle;
    g.save();
    g.strokeStyle = lampColor;
    g.lineWidth = Math.max(1.5, 2*s);
    g.beginPath();
    g.arc(0, 0, lr, 0, Math.PI*2);
    g.stroke();
    var xi = lr * 0.68;
    g.beginPath();
    g.moveTo(-xi, -xi); g.lineTo(xi,  xi);
    g.moveTo( xi, -xi); g.lineTo(-xi,  xi);
    g.stroke();
    g.restore();
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-lr, 0);
    g.moveTo( w/2, 0); g.lineTo( lr, 0);
    g.stroke();
    break;
  }
case 'led': {
  var ledColor = opts.color || 'red';
  var glowColor = (ledColor === 'green')
    ? '100,220,100'
    : '255,80,80';
  var offColor = (ledColor === 'green')
    ? '#2f5a2f'
    : '#5a2f2f';
  g.beginPath();
  g.moveTo(-w/2, 0);
  g.lineTo(-10*s, 0);
  g.moveTo(w/2, 0);
  g.lineTo(10*s, 0);
  g.stroke();
    // Стрілки світла
  [
    { ox: 4*s, oy: -14*s, ex: 10*s, ey: -20*s },
    { ox: 10*s, oy: -14*s , ex: 16*s, ey: -20*s }
  ].forEach(function(arr) {
    g.beginPath();
    g.moveTo(arr.ox, arr.oy);
    g.lineTo(arr.ex-2, arr.ey+2);
    g.stroke();
    g.beginPath();
    g.moveTo(arr.ex, arr.ey);
    g.lineTo(arr.ex - 4*s, arr.ey + 1*s);
    g.lineTo(arr.ex - 1*s, arr.ey + 4*s);
    g.closePath();
    g.fill();
  });
  // Корпус LED
  g.beginPath();
  g.moveTo(-10*s, -9*s);
  g.lineTo(10*s, 0);
  g.lineTo(-10*s, 9*s);
  g.closePath();
  if (glow > 0) {
    g.save();
    g.shadowBlur = 35 + 30 * glow;
    g.shadowColor = 'rgba(' + glowColor + ', 255)';
    g.fillStyle = 'rgba(' + glowColor + ',' + 1 + ')';
    g.fill();
    g.restore();
  } else {
    g.fillStyle = offColor;
    g.fill();
  }
  g.stroke();
  // Катод
  g.beginPath();
  g.moveTo(10*s, -9*s);
  g.lineTo(10*s, 9*s);
  g.stroke();

  break;
}
  case 'fan': {
    var mr = 18*s;
    g.beginPath();
    g.arc(0, 0, mr, 0, Math.PI*2);
    g.stroke();
    g.font = 'bold '+(12*s).toFixed(0)+'px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('М', 0, 0);
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-mr, 0);
    g.moveTo( w/2, 0); g.lineTo( mr, 0);
    g.stroke();
    if (opts.rot) {
       g.save(); g.rotate(opts.rot);
      for (var k = 0; k < 3; k++) {
        g.save(); g.rotate(k * 2 * Math.PI / 3);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(13*s, 3*s); g.lineTo(13*s, -3*s); g.closePath();
        g.fill ();
        g.restore();
      }
      g.restore();
    }
    break;
  }
  case 'buzzer': {
    var bzActive = opts.buzzing;
    var bzColor = bzActive ? '#ffd740' : g.strokeStyle;
    g.save();
    g.strokeStyle = bzColor;
    g.lineWidth   = Math.max(1.5, 2*s);
    g.lineJoin    = 'round'; 
    g.lineCap     = 'round';
    var R   = 15*s;
    var legH = 9*s;
    var legW = 8*s;
    g.beginPath();
    g.moveTo(-R, -10);
    g.lineTo( R, -10);
    g.stroke();
    g.beginPath();
    g.arc(0, -10, R, Math.PI, 0, false);
    g.stroke();
    g.beginPath();
    g.moveTo(-2*R, 0);
    g.lineTo(  -R + legW, 0);
    g.lineTo(-R + legW, -legH);
    g.stroke();
    g.beginPath();
    g.moveTo(2*R, 0);
    g.lineTo(R - legW, 0);
    g.lineTo(R - legW, -legH);
    g.stroke();
    if (bzActive) {
      g.save();
      g.lineWidth = Math.max(1, 1.2*s);
      [R*0.35, R*0.55].forEach(function(r) {
        g.beginPath();
        g.arc(0, -13, r, Math.PI, 0, false);
        g.stroke();
      });
      g.restore();
    }
    g.restore();
    break;
  }
  case 'heater': {
    var hw = 26*s, hh = 10*s;
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-hw, 0);
    g.moveTo( w/2, 0); g.lineTo(  hw, 0);
    g.stroke();
    g.beginPath();
    g.rect(-hw, -hh, hw*2, hh*2);
    g.stroke();
    var coilCol = glow > 0 ? 'rgba(255,'+(80+Math.round(80*glow))+',0,'+glow+')' : g.strokeStyle;
    g.save();
    g.strokeStyle = coilCol;
    g.lineWidth = Math.max(1, 1.5*s);
    g.beginPath();
    var segments = 6, segW = (hw*2 - 6*s) / segments;
    var cx0 = -hw + 3*s;
    for (var i = 0; i <= segments; i++) {
      var cx = cx0 + i * segW;
      var cy = (i % 2 === 0) ? -5*s : 5*s;
      if (i === 0) g.moveTo(cx, cy); else g.lineTo(cx, cy);
    }
    g.stroke();
     g.restore();
    break;
  }
  case 'switch': {
    g.beginPath();
    g.moveTo(-w/2, 0);  g.lineTo(-16*s, 0);
    g.moveTo( w/2, 0); g.lineTo( 16*s, 0);
    g.stroke();
    g.beginPath();
    g.arc(-16*s, 0, 2.5*s, 0, Math.PI*2);
     g.fill();
    g.beginPath();
    g.arc( 16*s, 0, 2.5*s, 0, Math.PI*2);
    g.fill();
    g.beginPath();
    g.moveTo(-16*s, 0);
    if (opts.closed) {
      g.lineTo(16*s, 0);
    } else {
      g.lineTo(12*s, -14*s);
    }
    g.stroke();
    break;
  }
  case 'pushbutton': {
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-14*s, 0);
    g.moveTo( w/2, 0); g.lineTo(  14*s, 0);
    g.stroke();
    g.beginPath();
    g.arc(-14*s, 0, 2.5*s, 0, Math.PI*2);
    g.fill();
    g.beginPath();
    g.arc( 14*s, 0, 2.5*s, 0, Math.PI*2);
    g.fill();
    g.beginPath();
    if (opts.closed) {
      g.moveTo(-14*s, 0); g.lineTo(14*s, 0);
    } else {
      g.moveTo(-14*s, 0); g.lineTo( 14*s, -7*s);
    }
    g.stroke();
    g.beginPath();
    g.moveTo(2, opts.closed ? 0 : -5*s);
    g.lineTo(2,  opts.closed ? -9*s  :-13*s);
    g.moveTo(-2, opts.closed ? 0 : -4*s);
    g.lineTo(-2,  opts.closed ? -9*s  :-13*s);
    g.moveTo(-5*s,  opts.closed ? -9*s  :-13*s); g.lineTo(-5*s,  opts.closed ? -6*s  :-10*s);
    g.moveTo(5*s,  opts.closed ? -9*s  :-13*s); g.lineTo(5*s,  opts.closed ? -6*s  :-10*s);         
    g.moveTo(-6*s, opts.closed ? -9*s :-13*s); g.lineTo(6*s, opts.closed ? -9*s  :-13*s);
    g.stroke();
    break;
  }
  case 'ammeter':
  case 'voltmeter': {
    g.beginPath();
    g.arc(0, 0, 18*s,  0, Math.PI*2);
    g.stroke();
    var reading = opts.reading;
    if (reading != null) {
      var rVal, rUnit;
      if (typeof reading === 'object') { rVal = reading.val; rUnit = reading.unit; }
      else { rVal = String(reading); rUnit = (type === 'ammeter' ? 'A' : 'V'); }
      var valFont = rVal.length > 5 ? 7 : (rVal.length > 4 ? 8 : 9);
      g.font = 'bold '+(valFont*s).toFixed(0)+'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffa000';
      g.fillText(rVal, 0, -3*s);
      g.font = (7*s).toFixed(0)+'px sans-serif';
      g.fillStyle = g.strokeStyle;
      g.fillText(rUnit, 0, 7*s);
    } else {
      g.font = 'bold '+(13*s).toFixed(0)+'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(type === 'ammeter' ? 'А' : 'V', 0, 0);
    }
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-18*s, 0);
    g.moveTo( w/2, 0); g.lineTo( 18*s, 0);
    g.stroke();
     break;
  }
  case 'junction':{
	g.beginPath();
	g.arc(0, 0, 4*s, 0, Math.PI*2);
    g.fill();  
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(w/2, 0);
    g.moveTo( 0, 0); g.lineTo( 0,-w/2);
    g.stroke();
    break;
  }
  case 'junction4': {
	g.beginPath();
	g.arc(0, 0, 4*s, 0, Math.PI*2);
    g.fill();  
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(w/2, 0);
    g.moveTo( 0,w/2); g.lineTo( 0,-w/2);
    g.stroke();
    break;
  }
}
}
/* ── Theme-aware colors ──────────────────────────────────── */
function isLightTheme() {
return document.body.classList.contains('light-theme');
}
function themeColors() {
if (isLightTheme()) {
return {
comp:       '#1a2040',
compHover:  '#3a4070',
compSel:    '#ffa000',
label:      '#4a5580',
port:       '#1565c0',
wire:       '#1565c0',
wireHover:  '#1e88e5',
wireSel:    '#ffa000',
grid:       'rgba(60,80,120,0.10)',
};
}
return {
comp:       '#dde3f0',
compHover:  '#ffd180',
compSel:    '#ffa000',
label:      '#8b9dc3',
port:       '#64b5f6',
wire:       '#64b5f6',
wireHover:  '#ffd180',
wireSel:    '#ffa000',
grid:       'rgba(136,160,200,0.08)',
};
}
/* ── Rendering ───────────────────────────────────────────── */
var drawScheduled = false;
function scheduleDraw() {
if (drawScheduled) return;
drawScheduled = true;
requestAnimationFrame(function () { drawScheduled = false; draw(); });
}
function drawGrid() {
var step = 20;
var leftW = toWX(0), rightW = toWX(cssW);
var topW = toWY(0), botW = toWY(cssH);
var x0 = Math.floor(leftW/step)*step;
var y0 = Math.floor(topW/step)*step;
ctx.strokeStyle = themeColors().grid;
ctx.lineWidth = 1;
ctx.beginPath();
for (var x = x0; x <= rightW; x += step) {
ctx.moveTo(toSX(x)*DPR, 0);
ctx.lineTo(toSX(x)*DPR, cssH*DPR);
}
for (var y = y0; y <= botW; y += step) {
ctx.moveTo(0, toSY(y)*DPR);
ctx.lineTo(cssW*DPR, toSY(y)*DPR);
}
ctx.stroke();
}
function drawComponent(c) {
var def = COMP_DEFS[c.type];
ctx.save();
ctx.translate(toSX(c.x)*DPR, toSY(c.y)*DPR);
ctx.scale(viewScale*DPR, viewScale*DPR);
ctx.rotate(c.rot * Math.PI/180);
var isSel = c.id === selectedId;
var isHover = c.id === hoverId;
var isFault = faults && faults.compIds && faults.compIds[c.id];
if (isFault) {
  var pulseC = faultPulse();
  ctx.strokeStyle = 'rgba(255,' + Math.round(40 + pulseC*60) + ',' + Math.round(40 + pulseC*40) + ',1)';
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = (10 + pulseC * 14);
  ctx.lineWidth = (1 + pulseC * 1.2);
} else {
  ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? themeColors().compHover : themeColors().comp);
}
ctx.fillStyle = ctx.strokeStyle;

var opts = {};
if (c.type === 'led') {
  opts.color = c.props.color || 'green';
}
if (c.type === 'switch' || c.type === 'pushbutton') opts.closed = !!c.props.closed;
if (isRunning && sim) {
  var p = Math.abs(sim.compP[c.id] || 0);
  if (c.type === 'lamp' || c.type === 'led' || c.type === 'heater') {
    opts.glow = Math.max(0, Math.min(1, p / 2));
  }
  if ( c.type === 'fan' || c.type === 'buzzer') {
    var i = Math.abs(sim.compI[c.id] || 0);
    opts.rot = (performance.now() / 1000) * i * 40;
    if (c.type === 'buzzer') opts.buzzing  = i > 0.0001;
  }
  if (c.type === 'ammeter') {
    opts.reading = autoMeter(Math.abs(sim.compI[c.id] || 0), 'А');
  }
  if (c.type === 'voltmeter') {
    opts.reading = autoMeter(Math.abs(sim.compV[c.id] || 0), 'В');
  }
}

drawComponentShape(ctx, c.type, 1, opts);

if (def.label && c.type !== 'junction' && c.type !== 'junction4' && c.type !== 'ground') {
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = themeColors().label;
  var lbl = def.label + (c.id ? c.id : '');
  var paramLbl = '';
  if (c.type === 'battery') paramLbl = formatV(c.props.V);
  else if (c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') paramLbl = formatR(c.props.R);
  else if (c.type === 'led') paramLbl = formatR(c.props.R);
  if (paramLbl) lbl += ' · ' + paramLbl;
  ctx.fillText(lbl, 0, -def.h/2 - 4);
}

ctx.restore();

if (isSel) {
  var b = compBounds(c);
  ctx.save();
  ctx.strokeStyle = '#ffa000';
  ctx.setLineDash([4,3]);
  ctx.lineWidth = 1;
  ctx.strokeRect(
    toSX(b.x)*DPR - 3, toSY(b.y)*DPR - 3,
    b.w*viewScale*DPR + 6, b.h*viewScale*DPR + 6
  );
  ctx.restore();
}

ctx.save();
for (var i = 0; i < def.ports.length; i++) {
  var pw = portWorld(c, i);
  ctx.beginPath();
  ctx.arc(toSX(pw.x)*DPR, toSY(pw.y)*DPR, 4*DPR, 0, Math.PI*2);
  ctx.fillStyle = isSel ? '#ffa000' : themeColors().port;
  ctx.fill();
}
ctx.restore();
}
function draw() {
if (!cssW) return;
ctx.save();
ctx.setTransform(1,0,0,1,0,0);
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawGrid();
_hSegs = [];
for (var ci0 = 0; ci0 < state.connections.length; ci0++) {
  var pts0 = connectionPoints(state.connections[ci0]);
  if (!pts0) continue;
  for (var si0 = 1; si0 < pts0.length; si0++) {
    var a0 = pts0[si0-1], b0 = pts0[si0];
    if (a0.y === b0.y && a0.x !== b0.x) {
      _hSegs.push({ y: a0.y, x1: Math.min(a0.x,b0.x), x2: Math.max(a0.x,b0.x), connId: state.connections[ci0].id });
    }
  }
}
for (var ci = 0; ci < state.connections.length; ci++) {
  drawConnection(state.connections[ci]);
}
for (var i = 0; i < state.components.length; i++) {
  drawComponent(state.components[i]);
}
if (pendingWire) drawPendingWire();
if (showNodeVoltages && sim && sim.netOf && sim.voltages) drawNodeVoltages();
if (annVisible) drawAnnotations();
if (hoverPort && !pendingWire) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(toSX(hoverPort.x)*DPR, toSY(hoverPort.y)*DPR, 7*DPR, 0, Math.PI*2);
  ctx.strokeStyle = '#ffa000';
  ctx.lineWidth = 2* DPR;
  ctx.stroke();
  ctx.restore();
}
ctx.restore();
}
var _hSegs = [];
function drawVerticalWithHumps(x, y1, y2, connId) {
var sx = toSX(x) * DPR;
var sgn = y2 > y1 ? 1 : -1;
var crossings = [];
var lo = Math.min(y1, y2), hi = Math.max(y1, y2);
for (var i = 0; i < _hSegs.length; i++) {
var h = _hSegs[i];
if (h.connId === connId) continue;
if (h.y <= lo + 0.5 || h.y >= hi - 0.5) continue;
if (x <= h.x1 + 0.5 || x >= h.x2 - 0.5) continue;
crossings.push(h.y);
}
crossings.sort(function (p, q) { return (p - q) * sgn; });
var humpR = 5 * DPR;
var cy = toSY(y1) * DPR;
ctx.moveTo(sx, cy);
for (var k = 0; k < crossings.length; k++) {
var cyHit = toSY(crossings[k]) * DPR;
var beforeY = cyHit - sgn * humpR;
var afterY = cyHit + sgn * humpR;
ctx.lineTo(sx, beforeY);
var startA = sgn > 0 ? -Math.PI/2 : Math.PI/2;
var endA   = sgn > 0 ?  Math.PI/2 : -Math.PI/2;
var ccw = sgn < 0;
ctx.arc(sx, cyHit, humpR, startA, endA, ccw);
ctx.moveTo(sx, afterY);
}
ctx.lineTo(sx, toSY(y2) * DPR);
}
function drawConnection(conn) {
var pts = connectionPoints(conn);
if (!pts) return;
var isSel = conn.id === selectedConnId;
var isHover = conn.id === hoverConnId;
var isFault = faults && faults.wireIds && faults.wireIds[conn.id];
ctx.save();
if (isFault) {
var pulse = faultPulse();
ctx.lineWidth = (4 + pulse * 2) * DPR;
ctx.strokeStyle = 'rgba(255,' + Math.round(40 + pulse * 60) + ',' + Math.round(40 + pulse * 40) + ',1)';
ctx.shadowColor = '#ff3b3b';
ctx.shadowBlur = (8 + pulse * 12) * DPR;
} else {
ctx.lineWidth = (isSel ? 3 : 2) * DPR;
ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? themeColors().wireHover : themeColors().wire);
}
ctx.beginPath();
for (var i = 0; i < pts.length - 1; i++) {
var a = pts[i], b = pts[i+1];
if (a.x === b.x && a.y !== b.y) {
drawVerticalWithHumps(a.x, a.y, b.y, conn.id);
} else {
if (i === 0) ctx.moveTo(toSX(a.x)*DPR, toSY(a.y)*DPR);
ctx.lineTo(toSX(b.x)*DPR, toSY(b.y)*DPR);
}
}
ctx.stroke();
// Draw dangling end markers — open circle where wire has no connected component
var dangColor = isFault ? ctx.strokeStyle : (isSel ? '#ffa000' : themeColors().wire);
if (conn.from.anchor) {
var af = conn.from.anchor;
ctx.save();
ctx.strokeStyle = dangColor;
ctx.lineWidth = 2 * DPR;
ctx.beginPath();
ctx.arc(toSX(af.x)*DPR, toSY(af.y)*DPR, 5*DPR, 0, Math.PI*2);
ctx.stroke();
ctx.restore();
}
if (conn.to.anchor) {
var at = conn.to.anchor;
ctx.save();
ctx.strokeStyle = dangColor;
ctx.lineWidth = 2 * DPR;
ctx.beginPath();
ctx.arc(toSX(at.x)*DPR, toSY(at.y)*DPR, 5*DPR, 0, Math.PI*2);
ctx.stroke();
ctx.restore();
}
if (conn.waypoints && conn.waypoints.length) {
ctx.fillStyle = isSel ? '#ffa000' : themeColors().wire;
conn.waypoints.forEach(function (wp) {
ctx.beginPath();
ctx.arc(toSX(wp.x)*DPR, toSY(wp.y)*DPR, 3*DPR, 0, Math.PI*2);
ctx.fill();
});
}
if (isRunning && sim) {
var I = wireSignedCurrent(conn);
var absI = Math.abs(I);
if (absI > 1e-6) {
var segLens = [0], total = 0;
for (var si = 1; si < pts.length; si++) {
var dx = pts[si].x - pts[si-1].x, dy = pts[si].y - pts[si-1].y;
total += Math.sqrt(dx*dx + dy*dy);
segLens.push(total);
}
if (total > 2) {
var spacing = 40;
var speed = Math.min(120, 30 + absI * 200);
var dir = I > 0 ? 1 : -1;
var phase = ((performance.now() / 1000) * speed * dir) % spacing;
if (phase < 0) phase += spacing;
ctx.fillStyle = '#ffa000';
for (var d = phase; d < total; d += spacing) {
var seg = 1;
while (seg < segLens.length && segLens[seg] < d) seg++;
if (seg >= segLens.length) break;
var segLen = segLens[seg] - segLens[seg-1];
var t = segLen > 0 ? (d - segLens[seg-1]) / segLen : 0;
var px = pts[seg-1].x + (pts[seg].x - pts[seg-1].x) * t;
var py = pts[seg-1].y + (pts[seg].y - pts[seg-1].y) * t;
ctx.beginPath();
ctx.arc(toSX(px)*DPR, toSY(py)*DPR, 3*DPR, 0, Math.PI*2);
ctx.fill();
}
}
}
}
ctx.restore();
}
/* ── Annotation drawing ─────────────────────────────────── */
var selectionUI = { corners: null, delBtn: null, dupBtn: null, rotBtn: null, kind: null };
function strokeBounds(s) {
var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
for (var i=0;i<s.points.length;i++) {
if (s.points[i].x <minX) minX=s.points[i].x;
if (s.points[i].y <minY) minY=s.points[i].y;
if (s.points[i].x >maxX) maxX=s.points[i].x;
if (s.points[i].y >maxY) maxY=s.points[i].y;
}
return { x:minX, y:minY, w:maxX-minX, h:maxY-minY, cx:(minX+maxX)/2, cy:(minY+maxY)/2 };
}
function drawStrokeSingle(s) {
if (!s.points || s.points.length < 2) return;
var rot = s.rotation || 0;
ctx.save();
if (rot) {
var b = strokeBounds(s);
ctx.translate(toSX(b.cx)*DPR, toSY(b.cy)*DPR);
ctx.rotate(rot);
ctx.translate(-toSX(b.cx)*DPR, -toSY(b.cy)*DPR);
}
ctx.strokeStyle = s.color;
ctx.lineWidth = s.width * viewScale * DPR;
ctx.beginPath();
ctx.moveTo(toSX(s.points[0].x)*DPR, toSY(s.points[0].y)*DPR);
for (var i = 1; i < s.points.length; i++) {
ctx.lineTo(toSX(s.points[i].x)*DPR, toSY(s.points[i].y)*DPR);
}
ctx.stroke();
ctx.restore();
}
function drawNodeVoltages() {
var seenNets = {};
var labels = [];
for (var i = 0; i < state.components.length; i++) {
var c = state.components[i];
var def = COMP_DEFS[c.type];
if (!def || !def.ports) continue;
for (var pi = 0; pi < def.ports.length; pi++) {
var net = sim.netOf(c.id, pi);
if (net == null) continue;
var V = sim.voltages[net];
if (V == null || !isFinite(V)) continue;
var pos = portWorld(c, pi) ;
var prev = seenNets[net];
if (!prev || pos.y < prev.y - 0.001 || (Math.abs(pos.y - prev.y) <= 0.001 && pos.x < prev.x)) {
seenNets[net] = { x: pos.x, y: pos.y, V: V, net: net };
}
}
}
for (var k in seenNets) labels.push(seenNets[k]);
if (!labels.length) return;
ctx.save();
var fs = Math.max(10, 11 * viewScale) * DPR;
ctx.font = '600 ' + fs + 'px ui-sans-serif, system-ui, sans-serif';
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
for (var li = 0; li < labels.length; li++) {
var L = labels[li];
var sx = toSX(L.x) * DPR;
var sy = (toSY(L.y) - 14) * DPR;
var txt = L.V.toFixed(L.V === 0 ? 0 : (Math.abs(L.V) >= 10 ? 1 : 2)) + ' В';
var tw = ctx.measureText(txt).width;
var pad = 4 * DPR;
ctx.fillStyle = 'rgba(20,28,42,0.92)';
ctx.strokeStyle = '#ffa000';
ctx.lineWidth = 1.2 * DPR;
var bx = sx - tw/2 - pad, by = sy - fs/2 - pad*0.7;
var bw = tw + pad*2, bh = fs + pad*1.4;
ctx.beginPath();
if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4*DPR);
else ctx.rect(bx, by, bw, bh);
ctx.fill(); ctx.stroke();
ctx.fillStyle = '#ffd166';
ctx.fillText(txt, sx, sy);
}
ctx.restore();
}
function drawAnnotations() {
ctx.save();
ctx.lineCap = 'round'; ctx.lineJoin = 'round';
state.annStrokes.forEach(drawStrokeSingle);
ctx.restore();
state.annShapes.forEach(function (sh, idx) {
drawShape(sh, annSel && annSel.type === 'shape' && annSel.idx === idx);
});
drawSelectionOverlay();
}
function shapeBoundsScreen(sh) {
var x1 = toSX(sh.x)*DPR, y1 = toSY(sh.y)*DPR;
var x2 = toSX(sh.x + sh.w)*DPR, y2 = toSY(sh.y + sh.h)*DPR;
var mnX = Math.min(x1,x2), mxX = Math.max(x1,x2);
var mnY = Math.min(y1,y2), mxY = Math.max(y1,y2);
if (sh.type === 'text') {
var fs = Math.max(8, Math.abs(sh.h) || 20) * viewScale * DPR;
ctx.save(); ctx.font = fs + 'px sans-serif';
var tw = ctx.measureText(sh.text || '(text)').width;
ctx.restore();
mnX = x1; mnY = y1; mxX = x1 + tw; mxY = y1 + fs*1.15;
}
var pad = 6*DPR;
return { x: mnX-pad, y: mnY-pad, w: mxX-mnX+2*pad, h: mxY-mnY+2*pad, cx:(mnX+mxX)/2, cy:(mnY+mxY)/2 };
}
function drawSelectionOverlay() {
selectionUI = { corners: null, delBtn: null, dupBtn: null, rotBtn: null, kind: null };
if (!annSel) return;
var b, rot = 0;
if (annSel.type === 'shape') {
var sh = state.annShapes[annSel.idx]; if (!sh) return;
b = shapeBoundsScreen(sh);
rot = sh.rotation || 0;
} else {
var st = state.annStrokes[annSel.idx]; if (!st) return;
var wb = strokeBounds(st);
var sx1 = toSX(wb.x)*DPR, sy1 = toSY(wb.y)*DPR;
var sx2 = toSX(wb.x+wb.w)*DPR, sy2 = toSY(wb.y+wb.h)*DPR;
var pad = 6*DPR;
b = { x: Math.min(sx1,sx2)-pad, y: Math.min(sy1,sy2)-pad,
w: Math.abs(sx2-sx1)+2*pad, h: Math.abs(sy2-sy1)+2*pad,
cx:(sx1+sx2)/2, cy:(sy1+sy2)/2 };
rot = st.rotation || 0;
}
var c = [
{x:b.x, y:b.y}, {x:b.x+b.w, y:b.y},
{x:b.x+b.w, y:b.y+b.h}, {x:b.x, y:b.y+b.h} 
];
if (rot) {
var cosR = Math.cos(rot), sinR = Math.sin(rot);
c = c.map(function(p){
var dx = p.x-b.cx, dy = p.y-b.cy;
return { x: b.cx + dx*cosR - dy*sinR, y: b.cy + dx*sinR + dy*cosR };
});
}
selectionUI.kind = annSel.type;
selectionUI.corners = c;
ctx.save();
ctx.strokeStyle = '#ffa000'; ctx.lineWidth = 1.5*DPR; ctx.setLineDash([5*DPR, 3*DPR]);
ctx.beginPath(); ctx.moveTo(c[0].x,c[0].y);
ctx.lineTo(c[1].x,c[1].y); ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y);
ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
var hs = 5*DPR; ctx.fillStyle = '#ffa000';
for (var i=0;i<4;i++) ctx.fillRect(c[i].x-hs, c[i].y-hs, hs*2, hs*2);
var mnX = Math.min(c[0].x,c[1].x,c[2].x,c[3].x);
var mxX = Math.max(c[0].x,c[1].x,c[2].x,c[3].x);
var mnY = Math.min(c[0].y,c[1].y,c[2].y,c[3].y);
var mxY = Math.max(c[0].y,c[1].y,c[2].y,c[3].y);
var iconSize = 26*DPR, gap = 6*DPR, totalW = iconSize*3 + gap*2;
var icX = (mnX + mxX)/2 - totalW/2;
var icY = mnY - iconSize - 10*DPR;
if (icY < 2*DPR) icY = mxY + 10*DPR;
function roundRect(x,y,w,h,r){
ctx.beginPath();
ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
}
ctx.font = (13*DPR)+'px sans-serif';
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
var delBtn = { x:icX, y:icY, w:iconSize, h:iconSize };
ctx.fillStyle = 'rgba(13,17,23,0.9)';  ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1*DPR;
roundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
ctx.fillStyle = '#ff6b6b';
ctx.fillText('\u2716', delBtn.x+iconSize/2, delBtn.y+iconSize/2);
selectionUI.delBtn = delBtn;
var dupBtn =  { x:icX+iconSize+gap, y:icY, w:iconSize, h:iconSize };
ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#4fc3f7';
roundRect(dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
ctx.fillStyle = '#4fc3f7';
ctx.fillText('\u2750', dupBtn.x+iconSize/2, dupBtn.y+iconSize/2);
selectionUI.dupBtn = dupBtn;
var rotBtn = { x :icX+(iconSize+gap)*2, y:icY, w:iconSize, h:iconSize };
ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#a78bfa';
roundRect(rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
ctx.fillStyle = '#a78bfa';
ctx.fillText('\u21BB', rotBtn.x+iconSize/2, rotBtn.y+iconSize/2);
selectionUI.rotBtn = rotBtn;
ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
ctx.restore();
}
function drawShape(sh, selected) {
var rot = sh.rotation || 0;
ctx.save();
if (rot) {
var b = shapeBoundsScreen(sh);
ctx.translate(b.cx, b.cy);
ctx.rotate(rot);
ctx.translate(-b.cx, -b.cy);
}
ctx.strokeStyle = sh.color; ctx.fillStyle = sh.color;
ctx.lineWidth = sh.width * viewScale * DPR;
var x1 = toSX(sh.x)*DPR, y1 = toSY(sh.y)*DPR;
var x2 = toSX(sh.x + sh.w)*DPR, y2 = toSY(sh.y + sh.h)*DPR;
switch (sh.type) {
case 'rect':
if (sh.filled) ctx.fillRect(x1, y1, x2-x1, y2-y1);
else ctx.strokeRect(x1, y1, x2-x1, y2-y1);
break;
case 'circle': {
var cx = (x1+x2)/2, cy =  (y1+y2)/2;
var r = Math.min(Math.abs(x2-x1), Math.abs(y2-y1))/2;
ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
if (sh.filled) ctx.fill(); else ctx.stroke();
break;
}
case 'ellipse': {
var cx2 = (x1+x2)/2, cy2 = (y1+y2)/2;
ctx.beginPath();
ctx.ellipse(cx2, cy2, Math.abs(x2-x1)/2, Math.abs(y2-y1)/2, 0, 0, Math.PI*2);
if (sh.filled) ctx.fill(); else ctx.stroke();
break;
}
case 'line':
ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
break;
case 'arrow':
drawArrow(x1,y1,x2,y2, sh.width * viewScale * DPR, false);
break;
case 'dblarrow':
drawArrow(x1,y1,x2,y2, sh.width * viewScale * DPR, true);
break;
case 'text':
var _fsW = Math.max(8, Math.abs(sh.h) || 20) * viewScale * DPR;
ctx.font = _fsW + 'px sans-serif';
ctx.textBaseline = 'top';
ctx.fillText(sh.text || '(text)', x1, y1);
break;
}
ctx.restore();
}
function drawArrow(x1,y1,x2,y2,w,dbl) {
var head = Math.max(8, w*3);
ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
var ang = Math.atan2(y2-y1, x2-x1);
function arrowhead(hx, hy, a) {
ctx.beginPath();
ctx.moveTo(hx, hy);
ctx.lineTo(hx - head*Math.cos(a - Math.PI/6), hy - head*Math.sin(a - Math.PI/6));
ctx.lineTo(hx - head*Math.cos(a + Math.PI/6), hy - head*Math.sin(a + Math.PI/6));
ctx.closePath(); ctx.fill();
}
arrowhead(x2,y2,ang);
if (dbl) arrowhead(x1,y1, ang + Math.PI);
}
function hitShape(wx, wy) {
for (var i = state.annShapes.length - 1; i >= 0; i--) {
var sh = state.annShapes[i];
var x1 = sh.x, y1 = sh.y, x2 = sh.x + sh.w, y2 = sh.y + sh.h;
if (sh.type === 'text') {
var fs = Math.max(8, Math.abs(sh.h) || 20);
ctx.save(); ctx.font = fs + 'px sans-serif';
var tw = ctx.measureText(sh.text || '(text)').width / DPR;
ctx.restore();
x2 = x1 + Math.max(tw, 20);
y2 = y1 + fs * 1.15;
}
var mnx=Math.min(x1,x2)-8, mxx=Math.max(x1,x2)+8, mny=Math.min(y1,y2)-8, mxy=Math.max(y1,y2)+8;
if (wx >= mnx && wx <= mxx && wy >= mny && wy <= mxy) return i;
}
return -1;
}
function hitStroke(wx, wy) {
for (var i = state.annStrokes.length - 1; i >= 0; i--) {
var s = state.annStrokes[i];
var tol = Math.max(8, (s.width || 2) + 4);
for (var j = 1; j < s.points.length; j++) {
if (pointOnSegment(wx, wy, s.points[j-1], s.points[j], tol)) return i;
}
}
return -1;
}
function hitAnyAnnotation(wx, wy) {
var sIdx = hitShape(wx, wy);
if (sIdx >= 0) return { type:'shape', idx: sIdx };
var tIdx = hitStroke(wx, wy);
if (tIdx >= 0) return { type:'stroke', idx: tIdx };
return null;
}
function hitBtn(sx, sy, btn) {
if (!btn) return false;
var pad = 4 * DPR;
return sx >= btn.x-pad && sx <= btn.x+btn.w+pad && sy >= btn.y-pad && sy <= btn.y+btn.h+pad;
}
function hitCornerHandle(sx, sy, corners) {
if (!corners) return -1;
var t = 12 * DPR;
for (var i = 0; i < 4; i++) {
if (Math.abs(sx-corners[i].x) < t && Math.abs(sy-corners[i].y) < t) return i;
}
return -1;
}
function deleteSelectedAnn() {
if (!annSel) return;
saveUndo();
if (annSel.type === 'shape') state.annShapes.splice(annSel.idx, 1);
else state.annStrokes.splice(annSel.idx, 1);
annSel = null; selectedShape = null;
scheduleDraw();
}
function duplicateSelectedAnn() {
if (!annSel) return;
saveUndo();
if (annSel.type === 'shape') {
var sh = state.annShapes[annSel.idx]; if (!sh) return;
var c = JSON.parse(JSON.stringify(sh));
c.x += 16; c.y += 16; c.id = state.nextId++;
state.annShapes.push(c);
annSel = { type:'shape', idx: state.annShapes.length - 1 };
} else {
var st = state.annStrokes[annSel.idx]; if (!st) return;
var cs = JSON.parse(JSON.stringify(st));
cs.points = cs.points.map(function(p){ return { x:p.x+16, y:p.y+16 }; });
cs.id = state.nextId++;
state.annStrokes.push(cs);
annSel = { type:'stroke', idx: state.annStrokes.length - 1 };
}
scheduleDraw();
}
function rotateSelectedAnn() {
if (!annSel) return;
saveUndo();
var obj = annSel.type === 'shape' ? state.annShapes[annSel.idx] : state.annStrokes[annSel.idx];
if (!obj) return;
obj.rotation = (obj.rotation || 0) + Math.PI/12;
scheduleDraw();
}
function drawPendingWire() {
if (!pendingWire || !pendingWire.cursor) return;
var fc = state.components.find(function(x){return x.id===pendingWire.from.compId;});
if (!fc) return;
var pts = [portWorld(fc, pendingWire.from.portIdx)];
pendingWire.waypoints.forEach(function(wp){ pts.push({x:wp.x,y:wp.y}); });
pts.push(pendingWire.cursor);
var ortho = [pts[0]];
for (var i = 1; i < pts.length; i++) {
var p0 = ortho[ortho.length-1], p1 = pts[i];
if (p0.x !== p1.x && p0.y !== p1.y) ortho.push({x:p1.x,y:p0.y});
ortho.push(p1);
}
ctx.save();
ctx.setLineDash([6*DPR, 4*DPR]);
ctx.lineWidth = 2*DPR;
ctx.strokeStyle = '#ffa000';
ctx.beginPath();
ctx.moveTo(toSX(ortho[0].x)*DPR, toSY(ortho[0].y)*DPR);
for (var j = 1; j < ortho.length; j++) {
ctx.lineTo(toSX(ortho[j].x)*DPR, toSY(ortho[j].y)*DPR);
}
ctx.stroke();
ctx.setLineDash([]);
ctx.fillStyle = '#ffa000';
pendingWire.waypoints.forEach(function(wp){
ctx.beginPath();
ctx.arc(toSX(wp.x)*DPR, toSY(wp.y)*DPR, 3*DPR, 0, Math.PI*2);
ctx.fill();
});
ctx.restore();
}
/* ── Pointer handling ────────────────────────────────────── */
function screenToWorldFromEvent(ev) {
var rect = canvas.getBoundingClientRect();
var sx = ev.clientX - rect.left;
var sy = ev.clientY - rect.top;
return { x: toWX(sx), y: toWY(sy), sx: sx, sy: sy };
}
function onPointerDown(ev) {
if (ev.button === 2) return;
var p = screenToWorldFromEvent(ev);
if (ev.button === 1 || spaceHeld || tool === 'pan') {
  drag = { kind:'pan', startX: p.sx, startY: p.sy, startOffX: viewOffX, startOffY: viewOffY }; 
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  return;
}
if (tool === 'sketch') {
  saveUndo();
  var stroke = { color: sketchColor, width: sketchWidth, points: [ {x:p.x,y:p.y}] };
  state.annStrokes.push(stroke);
  drag = { kind:'sketch', stroke: stroke };
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  return;
}
if (tool === 'shape') {
  if (shapeType === 'text') {
    ev.preventDefault();
    startTextEdit(p.x, p.y);
    setTool('move');
    annSel = { type:'shape', idx: state.annShapes.length - 1 };
    return;
  }
  saveUndo();
  var sh = { type: shapeType, x: p.x, y: p.y, w: 0, h: 0, color: shapeColor, width: shapeWidth, filled: shapeFilled, rotation: 0 };
  state.annShapes.push(sh);
  annSel = { type:'shape', idx: state.annShapes.length - 1 };
  drag = { kind:'shape-draw', shape: sh };
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  return;
}
if (tool === 'move') {
  var sxScr = p.sx * DPR, syScr = p.sy * DPR;
  if (annSel && selectionUI) {
    if (hitBtn(sxScr,syScr,selectionUI.delBtn)) { deleteSelectedAnn(); return; }
    if (hitBtn(sxScr,syScr,selectionUI.dupBtn)) { duplicateSelectedAnn(); return; }
    if (hitBtn(sxScr,syScr,selectionUI.rotBtn)) { rotateSelectedAnn(); return; }
    var corner = hitCornerHandle(sxScr,syScr,selectionUI.corners);
    if (corner >= 0) {
      saveUndo();
      drag = { kind:'ann-resize', corner: corner };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      return;
    }
  }
  var pick = hitAnyAnnotation(p.x, p.y);
  if (pick) {
    if (annSel && annSel.type === pick.type && annSel.idx === pick.idx) {
      if (pick.type === 'shape') {
        drag = { kind:'shape-move', idx: pick.idx, dx: state.annShapes[pick.idx].x - p.x, dy: state.annShapes[pick.idx].y - p.y, moved:false };
      } else {
        drag = { kind:'stroke-move', idx: pick.idx, sx:p.x, sy:p.y, moved:false };
      }
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      return;
    }
    annSel = pick;
    selectedShape = pick.type === 'shape' ? pick.idx : null;
    selectedId = null; selectedConnId = null;
    renderProps(); scheduleDraw();
    return;
  }
  annSel = null; selectedShape = null;
}
var port = hitPort(p.x, p.y);
if (!port) {
// Check if clicking on a dangling wire end — treat it like a port
var dangle = hitDanglingEnd(p.x, p.y);
if (dangle) {
if (!pendingWire) {
// Start a new wire from this dangling end; we'll use a sentinel compId=-1 with anchor
pendingWire = { from: { anchor: dangle.anchor || (dangle.end === 'from' ? dangle.conn.from.anchor : dangle.conn.to.anchor) }, waypoints: [], cursor: { x: dangle.x, y: dangle.y }, _dangle: { conn: dangle.conn, end: dangle.end } };
} else {
// Finish pending wire by attaching its other end to this dangling end
saveUndo();
if (dangle.end === 'from') {
dangle.conn.from = pendingWire.from;
} else {
dangle.conn.to = pendingWire.from;
}
pendingWire = null;
markDirty();
}
scheduleDraw();
return;
}
}
if (port) {
  if (!pendingWire) {
    pendingWire = { from: { compId: port.compId, portIdx: port.portIdx }, waypoints: [], cursor: {x:port.x,y:port.y} };
  } else {
    if (pendingWire._dangle) {
      // Finish a wire that started from a dangling end — attach to this port
      saveUndo();
      var dc = pendingWire._dangle;
      if (dc.end === 'from') dc.conn.from = { compId: port.compId, portIdx: port.portIdx };
      else dc.conn.to = { compId: port.compId, portIdx: port.portIdx };
      pendingWire = null;
      markDirty();
    } else if (port.compId !== pendingWire.from.compId || port.portIdx !== pendingWire.from.portIdx) {
      saveUndo();
      state.connections.push({
        id: state.nextId++,
        from: pendingWire.from,
        to: { compId: port.compId, portIdx: port.portIdx },
        waypoints: pendingWire.waypoints
       });
      pendingWire = null;
    } else {
      pendingWire = null;
    }
  }
  scheduleDraw();
  return;
}
if (pendingWire) {
  var tapConn = hitConnection(p.x, p.y, 8);
  if (tapConn) {
    var approach;
    if (pendingWire.waypoints && pendingWire.waypoints.length) {
      approach = pendingWire.waypoints[pendingWire.waypoints.length - 1];
    } else {
      var fcA = state.components.find(function(x){return x.id===pendingWire.from.compId;});
      approach = fcA ? portWorld(fcA, pendingWire.from.portIdx) : null;
    }
    saveUndo();
    var tap = tapIntoConnection(tapConn, p, approach);
    if (tap) {
      state.connections.push({
        id: state.nextId++,
        from: pendingWire.from,
        to: { compId: tap.jcomp.id, portIdx: tap.freePort },
        waypoints: pendingWire.waypoints
      });
      pendingWire = null;
      scheduleDraw();
      return;
    }
  }
}
if (pendingWire) {
  pendingWire.waypoints.push({x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10});
  scheduleDraw();
  return;
}
if (selectedConnId) {
   var selConn = state.connections.find(function(x){ return x.id === selectedConnId; });
  if (selConn && selConn.waypoints) {
    for (var wi = 0; wi < selConn.waypoints.length; wi++) {
      var wp = selConn.waypoints[wi];
      if (Math.abs(p.x - wp.x) < 10 && Math.abs(p.y - wp.y) < 10) {
        saveUndo();
        drag = { kind:'waypoint-move', connId: selectedConnId, wpIdx: wi };
        canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
        return;
      }
    }
  }
}
var c = hitComponent(p.x, p.y);
if (c) {
  if ((isRunning || wasRunningBeforeFault) && (c.type === 'switch' || c.type === 'pushbutton')) {
    if (c.type === 'switch') {
      saveUndo();
      c.props.closed = !c.props.closed;
      markDirty();
      try { sfx.click(); } catch(e) {}
      // If we were paused due to a fault and switch is now open — resume simulation
      if (wasRunningBeforeFault && !c.props.closed) {
        wasRunningBeforeFault = false;
        clearFaults();
        isRunning = true;
        document.getElementById('btn-run').style.display = 'none';
        document.getElementById('btn-stop').style.display = 'block';
        animStart = 0;
        // Cancel any lingering flash loop and force-start the main animLoop
        if (animRAF) { cancelAnimationFrame(animRAF); animRAF = 0; }
        animRAF = requestAnimationFrame(animLoop);
      }
    } else {
      if (!c.props.closed) {
        c.props.closed = true;
        markDirty();
        try { sfx.click(); } catch(e) {}
      }
      drag = { kind: 'pushbutton-hold', id: c.id };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
    }
    selectedId = c.id;
    renderProps();
    scheduleDraw();
    return;
  }
  selectedId = c.id;
  selectedConnId = null;
  drag = { kind:'move', id: c.id, dx: c.x - p.x, dy: c.y - p.y, moved: false };
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  renderProps();
  showCompPopover(c);
  scheduleDraw();
  return;
}
var conn = hitConnection(p.x, p.y);
if (conn) {
  if ((ev.shiftKey || ev.detail === 2) && selectedConnId !== conn.id) {
    saveUndo();
    var tap2 = tapIntoConnection(conn, p, p);
    if (tap2) {
      pendingWire = {
        from: { compId: tap2.jcomp.id, portIdx: tap2.freePort },
        waypoints: [],
        cursor: { x: tap2.jcomp.x, y: tap2.jcomp.y }
      };
      selectedConnId = null;
      scheduleDraw();
      return;
    }
  }
  if ((ev.altKey || ev.shiftKey) && selectedConnId === conn.id) {
    saveUndo();
    conn.waypoints = conn.waypoints || [];
    conn.waypoints.push({ x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10 });
    drag = { kind:'waypoint-move', connId: conn.id, wpIdx: conn.waypoints.length - 1 };
    canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
    scheduleDraw();
    return;
  }
  selectedConnId = conn.id;
  selectedId = null;
  hideCompPopover();
  renderProps();
  scheduleDraw();
  return;
}
{
  selectedId = null;
  selectedConnId = null;
  hideCompPopover();
  drag = { kind:'pan', startX: p.sx, startY: p.sy, startOffX: viewOffX, startOffY: viewOffY };
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  renderProps();
  scheduleDraw();
}
}
function onPointerMove(ev) {
var p = screenToWorldFromEvent(ev);
if (pendingWire) {
  var sp = hitPort(p.x, p.y);
  pendingWire.cursor = sp ? { x: sp.x, y: sp.y } : { x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10 };
  hoverPort = sp;
  scheduleDraw();
  return;
}
var prevHover = hoverId, prevPort = hoverPort, prevConn = hoverConnId;
if (!drag) {
  var port = hitPort(p.x, p.y);
  hoverPort = port;
  if (port) { hoverId = null; hoverConnId = null; canvas.style.cursor = 'pointer'; }
  else if (hitDanglingEnd(p.x, p.y)) { hoverId = null; hoverConnId = null; canvas.style.cursor = 'pointer'; }
  else {
    var c = hitComponent(p.x, p.y);
    hoverId = c ? c.id : null; 
    if (!c) {
      var hc = hitConnection(p.x, p.y);
      hoverConnId = hc ? hc.id : null;
    } else hoverConnId = null;
    if (tool === 'pan') canvas.style.cursor = 'grab';
    else if (tool === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
    else if (tool === 'shape') canvas.style.cursor = 'crosshair';
    else canvas.style.cursor = (hoverId || hoverConnId) ? 'move' : 'crosshair';
    if (tool === 'move') {
      var sxScr = p.sx * DPR, syScr = p.sy * DPR;
      if (annSel && selectionUI) {
        var hCorner = hitCornerHandle(sxScr, syScr, selectionUI.corners);
        if (hCorner >= 0) {
          canvas.style.cursor = (hCorner === 0 || hCorner === 2) ? 'nwse-resize' : 'nesw-resize';
        } else if (hitBtn(sxScr,syScr,selectionUI.delBtn) || hitBtn(sxScr, syScr,selectionUI.dupBtn) || hitBtn(sxScr,syScr,selectionUI.rotBtn)) {
          canvas.style.cursor = 'pointer';
        } else if (hitAnyAnnotation(p.x, p.y)) {
          canvas.style.cursor = 'move';
        }
      } else if (hitAnyAnnotation(p.x, p.y)) {
        canvas.style.cursor = 'move';
      }
    }
  }
  if (hoverId !== prevHover || hoverPort !== prevPort || hoverConnId !== prevConn) scheduleDraw();
}
if (!drag) return;
if (drag.kind === 'pan') {
  viewOffX = drag.startOffX + (p.sx - drag.startX)/viewScale;
  viewOffY = drag.startOffY + (p.sy - drag.startY)/viewScale;
  scheduleDraw();
  return;
}
if (drag.kind === 'move') {
  var c2 = state.components.find(function(x){return x.id===drag.id;});
  if (!c2) return;
  if (!drag.moved) { saveUndo(); drag.moved = true; hideCompPopover(); }
  c2.x = Math.round((p.x + drag.dx)/10)*10;
  c2.y = Math.round((p.y + drag.dy)/10)*10;
  scheduleDraw();
}
if (drag.kind === 'sketch') {
  drag.stroke.points.push({x:p.x,y:p.y});
  scheduleDraw();
}
if (drag.kind === 'shape-draw') {
  drag.shape.w = p.x - drag.shape.x;
  drag.shape.h = p.y - drag.shape.y;
  scheduleDraw();
}
if (drag.kind === 'shape-move') {
  if (!drag.moved) { saveUndo(); drag.moved = true; }
  var sh = state.annShapes[drag.idx];
  if (sh) { sh.x = p.x + drag.dx; sh.y = p.y + drag.dy; scheduleDraw(); }
}
if (drag.kind === 'waypoint-move') {
  var cW = state.connections.find(function(x){ return x.id === drag.connId; });
  if (cW && cW.waypoints && cW.waypoints[drag.wpIdx]) {
    cW.waypoints[drag.wpIdx].x = Math.round(p.x/10)*10;
    cW.waypoints[drag.wpIdx].y = Math.round(p.y/10)*10;
    scheduleDraw();
  }
  return;
}
if (drag.kind === 'stroke-move') {
  if (!drag.moved) { saveUndo(); drag.moved = true; }
  var st = state.annStrokes[drag.idx];
  if (st) {
    var ddx = p.x - drag.sx, ddy = p.y - drag.sy;
    st.points.forEach(function(pt){ pt.x += ddx; pt.y += ddy; });
    drag.sx = p.x; drag.sy = p.y;
    scheduleDraw();
  }
}
if (drag.kind === 'ann-resize') {
  if (!annSel) return;
  if (annSel.type === 'shape') {
    var sh2 = state.annShapes[annSel.idx]; if (!sh2) return;
    var x1 = sh2.x, y1 = sh2.y, x2 = sh2.x + sh2.w, y2 = sh2.y + sh2.h;
    if (drag.corner === 0) { sh2.x = p.x; sh2.y = p.y; sh2.w = x2 - p.x; sh2.h = y2 - p.y; }
    else if (drag.corner === 1) { sh2.y = p.y; sh2.w = p.x - sh2.x; sh2.h = y2 - p.y; }
    else if (drag.corner === 2) { sh2.w = p.x - sh2.x; sh2.h = p.y - sh2.y; }
    else if (drag.corner === 3) { sh2.x = p.x; sh2.w = x2 - p.x; sh2.h = p.y - sh2.y; }
    scheduleDraw();
  } else {
    var st2 = state.annStrokes[annSel.idx]; if (!st2) return;
    var b = strokeBounds(st2);
    var opp;
    if (drag.corner === 0) opp = { x: b.x+b.w, y: b.y+b.h };
    else if (drag.corner === 1) opp = { x: b.x, y: b.y+b.h };
    else if (drag.corner === 2) opp = { x: b.x, y: b.y };
    else opp = { x: b.x+b.w, y: b.y };
    var nw = Math.abs(p.x - opp.x), nh = Math.abs(p.y - opp.y);
    var sxF = b.w > 1 ? nw / b.w : 1, syF = b.h > 1 ? nh / b.h : 1;
    if (!isFinite(sxF) || sxF < 0.05) sxF = 0.05;
    if (!isFinite(syF) || syF < 0.05) syF = 0.05;
    st2.points.forEach(function(pt){
      pt.x = opp.x + (pt.x - opp.x) * sxF * (Math.sign(p.x-opp.x)||1) / (Math.sign(b.w)||1);
      pt.y = opp.y + (pt.y - opp.y) * syF * (Math.sign(p.y-opp.y)||1) / (Math.sign(b.h)||1);
    });
    scheduleDraw();
  }
}
}
function onPointerUp(ev) {
if (drag) {
try { canvas.releasePointerCapture(ev.pointerId); } catch(e){}
if (drag.kind === 'pushbutton-hold') {
var pb = state.components.find(function(x){ return x.id === drag.id; });
if (pb && pb.props.closed) {
pb.props.closed = false;
markDirty();
try { sfx.click(); } catch(e) {}
renderProps();
scheduleDraw();
}
drag = null;
return;
}
if (drag.kind === 'shape-draw') {
if (drag.shape && Math.abs(drag.shape.w) < 3 && Math.abs(drag.shape.h) < 3) {
var idx = state.annShapes.indexOf(drag.shape);
if (idx >= 0) state.annShapes.splice(idx, 1);
annSel = null;
}
setTool('move');
}
if (drag.kind === 'move' && drag.moved) {
var cm = state.components.find(function(x){return x.id===drag.id;});
if (cm) showCompPopover(cm);
}
}
drag = null;
}
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('dblclick', function(ev){
var p = screenToWorldFromEvent(ev);
var idx = hitShape(p.x, p.y);
if (idx < 0) return;
var sh = state.annShapes[idx];
if (!sh || sh.type !== 'text') return;
var textInputEl = document.getElementById('shape-text-input');
if (!textInputEl) return;
textEditing = idx;
selectedShape = idx;
textInputEl.value = sh.text || '';
textInputEl.style.display = 'block';
textInputEl.style.left = toSX(sh.x) + 'px';
textInputEl.style.top  = toSY(sh.y) + 'px';
textInputEl.focus();
textInputEl.select();
});
/* ── Wheel zoom ──────────────────────────────────────────── */
canvas.addEventListener('wheel', function (ev) {
if (!ev.ctrlKey && !ev.metaKey) return;
ev.preventDefault();
var rect = canvas.getBoundingClientRect();
var sx = ev.clientX - rect.left, sy = ev.clientY - rect.top;
var wx = toWX(sx), wy = toWY(sy);
var factor = ev.deltaY < 0 ? 1.1 : 1/1.1;
viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
viewOffX = sx/viewScale - wx;
viewOffY = sy/viewScale - wy;
scheduleDraw();
}, { passive: false });
/* ── Palette drag & drop ────────────────────────────────── */
var paletteDragType = null;
palette.addEventListener('dragstart', function (ev) {
var item = ev.target.closest('.palette-item');
if (!item) return;
paletteDragType = item.getAttribute('data-type');
ev.dataTransfer.effectAllowed = 'copy';
ev.dataTransfer.setData('text/plain', paletteDragType);
});
canvas.addEventListener('dragover', function (ev) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
canvas.addEventListener('drop', function (ev) {
ev.preventDefault();
var type = paletteDragType || (ev.dataTransfer && ev.dataTransfer.getData('text/plain'));
if (!type || !COMP_DEFS[type]) return;
var rect = canvas.getBoundingClientRect();
var sx = ev.clientX - rect.left, sy = ev.clientY - rect.top;
saveUndo();
var c = makeComponent(type, Math.round(toWX(sx)/10)*10, Math.round(toWY(sy)/10)*10);
state.components.push(c);
selectedId = c.id;
renderProps();
scheduleDraw();
paletteDragType = null;
});
palette.addEventListener('click', function (ev) {
var item = ev.target.closest('.palette-item');
if (!item) return;
var type = item.getAttribute('data-type');
if (!COMP_DEFS[type]) return;
saveUndo();
var cx = toWX(cssW/2), cy = toWY(cssH/2);
var c = makeComponent(type, Math.round(cx/10)*10, Math.round(cy/10)*10);
state.components.push(c);
selectedId = c.id;
renderProps();
scheduleDraw();
});
/* ── Palette category collapse ──────────────────────────── */
palette.querySelectorAll('.palette-cat').forEach(function (cat) {
cat.addEventListener('click', function () { cat.classList.toggle('collapsed'); });
});
/* ── Properties panel ────────────────────────────────────── */
function renderProps() {
if (!propsPanel) return;
var c = state.components.find(function(x){return x.id===selectedId;});
if (!c) { propsPanel.style.display = 'none'; return; }
propsPanel.style.display = '';
var def = COMP_DEFS[c.type];
var html = ' <div style="font-weight:600;color:var(--text);margin-bottom:6px;">'+
(COMP_LABELS[c.type]||c.type)+' #'+c.id+' </div>';
if (c.type === 'battery') {
html += propUnitSlider(c, 'V', 'Напруга', 'V');
} else if (c.type === 'resistor') {
html += propUnitSlider(c, 'R', 'Опір', 'R');
} else if (c.type === 'rheostat') {
html += propUnitSlider(c, 'R', 'Робочий опір', 'R');
html += propNumber(c, 'Rmax', 'Макс. опір (Ом)');
} else if (c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') {
html += propUnitSlider(c, 'R', 'Опір', 'R');
} else if (c.type === 'led') {

html += propNumber(c, 'Vf', 'Пряма напруга (В)');
html += propUnitSlider(c, 'R', 'Послідовний опір', 'R');

html +=
' <label>' +
'   <span class="prop-val">Колір світлодіода</span>' +

'   <div class="led-color-picker">' +

'     <button class="led-color-btn ' + (c.props.color === 'red' ? 'active' : '') + '" ' +
'             data-led-color="red" ' +
'             style="background:#ff3b30;">' +
'     </button>' +

'     <button class="led-color-btn ' + (c.props.color === 'green' ? 'active' : '') + '" ' +
'             data-led-color="green" ' +
'             style="background:#00d26a;">' +
'     </button>' +

'   </div>' +
' </label>';
} else if (c.type === 'switch' || c.type === 'pushbutton') {
html += ' <div> <span class="prop-val" >Стан: '+(c.props.closed?'⁣⁣⁣.Замкнутий':'Розімкнено')+' </span >'+
' <button class="btn btn-ghost" data-act="toggle" style="margin-top:4px;">Переключити </button ></div> ';
}
html += ' <label > <button class="btn btn-ghost" data-act="rotate" >↻ Повернути 90° </button > '+
' <button class="btn btn-ghost" data-act="delete" >🗑 Видалити </button > </label >';
propsBody.innerHTML = html;
propsBody.querySelectorAll('input[data-prop]').forEach(function (inp) {
  inp.addEventListener('input', function () {
    var key = inp.getAttribute('data-prop');
    var val = parseFloat(inp.value);
    if (isNaN(val)) return;
    var mul = parseFloat(inp.getAttribute('data-mul'));
    if (!isNaN(mul) && mul > 0) {
      var base = val * mul;
      base = Math.round(base * 1e6) / 1e6;
      c.props[key] = base;
    } else {
      c.props[key] = val;
    }
    var span = propsBody.querySelector('[data-val="'+key+'"]');
    if (span) span.textContent = formatDispVal(val);
    markDirty();
    scheduleDraw();
  });
});
propsBody.querySelectorAll('select[data-unit]').forEach(function (sel) {
  sel.addEventListener('change', function () {
    var key = sel.getAttribute('data-unit');
    var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
    var newMul = parseFloat(sel.value);
    if (!newMul || newMul <= 0) return;
    c.props[unitKey] = newMul;
    renderProps();
    scheduleDraw();
  });
});
propsBody.querySelectorAll('.led-color-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    saveUndo();
    c.props.color = btn.getAttribute('data-led-color');
    renderProps();
    scheduleDraw();
  });
});
propsBody.querySelectorAll('button[data-act]').forEach(function (b) {
  b.addEventListener('click', function () {
    var act = b.getAttribute('data-act');
    if (act === 'toggle') { saveUndo(); c.props.closed = !c.props.closed; try{sfx.click();}catch(e){} renderProps(); scheduleDraw(); }
    else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; scheduleDraw(); }
    else if (act === 'delete') { saveUndo(); deleteSelected(); }
  });
});
}
function propSlider(c, key, label, unit, min, max, step) {
return ' <label >'+label+'  <span class="prop-val" data-val="'+key+'">'+c.props[key]+'</span > '+unit+
' <input type="range" data-prop="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+c.props[key]+'"> </label>';
}
function unitOptionsFor(kind) {
if (kind === 'R') return [{label:'Ом',mul:1},{label:'кОм',mul:1000},{label:'МОм',mul:1000000}];
return [{label:'В',mul:1},{label:'кВ',mul:1000},{label:'МВ',mul:1000000}];
}
function stepForMul(mul) {
if (mul >= 1e6) return 0.01;
if (mul >= 1e3) return 0.1;
return 1;
}
function formatDispVal(v) {
if (v == null || isNaN(v)) return '0';
if (Math.abs(v) >= 100) return v.toFixed(0);
if (Math.abs(v) >= 10)  return v.toFixed(1);
return v.toFixed(2).replace(/.?0+$/, '');
}
function propUnitSlider(c, key, label, kind) {
var unitKey = (kind === 'V') ? 'Vunit' : 'Runit';
if (c.props[unitKey] == null) {
var base = c.props[key] || 0;
if (base >= 1e6) c.props[unitKey] = 1e6;
else if (base >= 1e3) c.props[unitKey] = 1e3;
else c.props[unitKey] = 1;
}
var mul = c.props[unitKey];
var min = 1, max = 10000, step = stepForMul(mul);
var dispActual = (c.props[key] || 0) / mul;
var dispSlider = Math.round(dispActual / step) * step;
if (dispSlider < min) dispSlider = min;
if (dispSlider > max) dispSlider = max;
var opts = unitOptionsFor(kind);
var optsHtml = opts.map(function(o){
return ' <option value="'+o.mul+'"'+(o.mul===mul?' selected':'')+'>'+o.label+'</option>';
}).join('');
return ' <label >'+label+
'  <span class="prop-val" data-val="'+key+'">'+formatDispVal(dispActual)+'</span > '+
' <select data-unit="'+key+'" style="margin-left:4px;">'+optsHtml+'</select>'+
' <input type="range" data-prop="'+key+'" data-mul="'+mul+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+dispSlider+'"> </label>';
}
function propNumber(c, key, label) {
return ' <label >'+label+
' <input type="number" data-prop="'+key+'" value="'+c.props[key]+'" step="any"> </label>';
}
/* ── Component popover (in-canvas quick editor) ──────────── */
var compPopover = null;
var compPopoverFor = null;
function ensureCompPopover() {
if (compPopover) return compPopover;
compPopover = document.createElement('div');
compPopover.id = 'comp-popover';
compPopover.className = 'comp-popover';
compPopover.style.display = 'none';
if (canvasCard) canvasCard.appendChild(compPopover);
document.addEventListener('mousedown', function (ev) {
if (!compPopover || compPopover.style.display === 'none') return;
if (compPopover.contains(ev.target)) return;
if (ev.target === canvas) return;
hideCompPopover();
});
document.addEventListener('keydown', function (ev) {
if (ev.key === 'Escape' && compPopover && compPopover.style.display !== 'none') hideCompPopover();
});
return compPopover;
}
function hideCompPopover() {
if (compPopover) { compPopover.style.display = 'none'; compPopoverFor = null; }
}
function compEditField(c, key, label, kind) {
var unitKey = (kind === 'V') ? 'Vunit' : 'Runit';
if (c.props[unitKey] == null) {
var base = c.props[key] || 0;
if (base >= 1e6) c.props[unitKey] = 1e6;
else if (base >= 1e3) c.props[unitKey] = 1e3;
else c.props[unitKey] = 1;
}
var mul = c.props[unitKey];
var min = 1, max = 10000, step = stepForMul(mul);
var dispActual = (c.props[key] || 0) / mul;
var dispSlider = Math.min(max, Math.max(min, Math.round(dispActual / step) * step));
var opts = unitOptionsFor(kind);
var optsHtml = opts.map(function(o){
return ' <option value="'+o.mul+'"'+(o.mul===mul?' selected':'')+'>'+o.label+'</option>';
}).join('');
return ' <div class="cp-label">'+label+
' <div class="cp-row">'+
' <input type="number" data-cp-text="'+key+'" value="'+formatDispVal(dispActual)+'" step="'+step+'" min="0">'+
' <select data-cp-unit="'+key+'">'+optsHtml+'</select>'+
' </div>'+
' <input type="range" data-cp-slider="'+key+'" data-mul="'+mul+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+dispSlider+'">'+
' </div>';
}
function showCompPopover(c) {
if (!c) { hideCompPopover(); return; }
ensureCompPopover();
compPopoverFor = c.id;
var html = ' <div class="cp-head">'+(COMP_LABELS[c.type]||c.type)+' #'+c.id+
' <button class="cp-close" type="button" title="Закрити">×</button > </div >';
if (c.type === 'battery') html += compEditField(c, 'V', 'Напруга', 'V');
else if (c.type === 'resistor' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater')
html += compEditField(c, 'R', 'Опір', 'R');
else if (c.type === 'rheostat') {
html += compEditField(c, 'R', 'Робочий опір', 'R');
html += ' <div class="cp-label">Макс. опір (Ом) <input type="number" data-cp="Rmax" value="'+c.props.Rmax+'" step="any"> </div>';
}
else if (c.type === 'led') {
html += ' <div class="cp-label">Пряма напруга (В) <input type="number" data-cp="Vf" value="'+c.props.Vf+'" step="any"> </div>';
html += compEditField(c, 'R', 'Послідовний опір', 'R');
}
else if (c.type === 'switch' || c.type === 'pushbutton') {
html += ' <div class="cp-label">Стан:  <strong><span style="display: inline-block; width: 55px;">' + 
        (c.props.closed ? 'Замкнено' : 'Розімкнено') + '</span></strong>'+
' <button class="btn btn-ghost cp-act" data-act="toggle" type="button" style="margin-left:12px;">Переключити </button> </div>';
}

html += ' <div class="cp-actions">'+
' <button class="btn btn-ghost cp-act" data-act="rotate" type="button">↻ Повернути </button>'+
' <button class="btn btn-ghost cp-act" data-act="delete" type="button">🗑 Видалити </button>'+
' </div>';
compPopover.innerHTML = html;
compPopover.style.display = 'block';
var sx = (canvas.offsetLeft || 0) + toSX(c.x);
var sy = (canvas.offsetTop || 0) + toSY(c.y);
var pw = compPopover.offsetWidth, ph = compPopover.offsetHeight;
var def = COMP_DEFS[c.type] || { h: 40 };
var halfH = (def.h / 2) * viewScale;
var top = sy - halfH - ph - 12;
if (top < 4) top = sy + halfH + 12;
var left = sx - pw / 2;
var cardW = (canvasCard && canvasCard.clientWidth) || 800;
var cardH = (canvasCard && canvasCard.clientHeight) || 600;
if (left < 6) left = 6;
if (left + pw > cardW - 6) left = cardW - pw - 6;
if (top + ph > cardH - 6) top = Math.max(6, cardH - ph - 6);
compPopover.style.left = left + 'px';
compPopover.style.top = top + 'px';
wireCompPopoverEvents(c);
}
function wireCompPopoverEvents(c) {
var x = compPopover.querySelector('.cp-close');
if (x) x.addEventListener('click', hideCompPopover);
compPopover.querySelectorAll('input[data-cp-text]').forEach(function (inp) {
  inp.addEventListener('input', function () {
    var key = inp.getAttribute('data-cp-text');
    var v = parseFloat(inp.value); if (isNaN(v)) return;
    var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
    var mul = c.props[unitKey] || 1;
    c.props[key] = Math.round(v * mul * 1e6) / 1e6;
    var sld = compPopover.querySelector('input[data-cp-slider="'+key+'"]');
    if (sld) {
      var lo = parseFloat(sld.min), hi = parseFloat(sld.max);
      sld.value = Math.max(lo, Math.min(hi, v));
    }
    markDirty(); scheduleDraw(); renderProps();
  });
});
compPopover.querySelectorAll('input[data-cp-slider]').forEach(function (sld) {
  sld.addEventListener('input', function () {
    var key = sld.getAttribute('data-cp-slider');
    var v = parseFloat(sld.value);
    var mul = parseFloat(sld.getAttribute('data-mul')) || 1;
    c.props[key] = Math.round(v * mul * 1e6) / 1e6;
    var inp = compPopover.querySelector('input[data-cp-text="'+key+'"]');
    if (inp) inp.value = formatDispVal(v);
    markDirty(); scheduleDraw(); renderProps();
  });
});
compPopover.querySelectorAll('select[data-cp-unit]').forEach(function (sel) {
  sel.addEventListener('change', function () {
    var key = sel.getAttribute('data-cp-unit');
    var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
    var mul = parseFloat(sel.value); if (!mul || mul <= 0) return;
    c.props[unitKey] = mul;
    showCompPopover(c); renderProps(); scheduleDraw();
  });
});
compPopover.querySelectorAll('input[data-cp]').forEach(function (inp) {
   inp.addEventListener('input', function () {
    var key = inp.getAttribute('data-cp');
    var v = parseFloat(inp.value); if (isNaN(v)) return;
    c.props[key] = v;
    markDirty(); scheduleDraw(); renderProps();
  });
});
compPopover.querySelectorAll('button[data-act]').forEach(function (b) {
  b.addEventListener('click', function () {
    var act = b.getAttribute('data-act');
    if (act === 'toggle') { saveUndo(); c.props.closed = !c.props.closed; try{sfx.click();}catch(e){} showCompPopover(c); renderProps(); scheduleDraw(); }
     else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; showCompPopover(c); scheduleDraw(); }
    else if (act === 'delete') { saveUndo(); deleteSelected(); hideCompPopover(); }
  });
});
}
/* ── Delete / rotate / clear ─────────────────────────────── */
function deleteSelected() {
if (selectedShape != null) {
saveUndo();
state.annShapes.splice(selectedShape, 1);
selectedShape = null; scheduleDraw();
return;
}
if (selectedConnId != null) {
saveUndo();
state.connections = state.connections.filter(function(x){return x.id!==selectedConnId;});
selectedConnId = null;
scheduleDraw();
return;
}
if (selectedId == null) return;
saveUndo();
// Convert connections attached to this component into dangling wires
// by replacing the port reference with a fixed anchor coordinate.
var delId = selectedId;
var delComp = state.components.find(function(x){return x.id===delId;});
if (delComp) {
state.connections.forEach(function(conn) {
if (conn.from.compId === delId) {
var pw = portWorld(delComp, conn.from.portIdx);
conn.from = { anchor: { x: pw.x, y: pw.y } };
}
if (conn.to.compId === delId) {
var pw = portWorld(delComp, conn.to.portIdx);
conn.to = { anchor: { x: pw.x, y: pw.y } };
}
});
}
state.components = state.components.filter(function(x){return x.id!==selectedId;});
selectedId = null;
renderProps();
scheduleDraw();
}
function rotateSelected() {
var c = state.components.find(function(x){return x.id===selectedId;});
if (!c) return;
saveUndo();
c.rot = (c.rot + 90) % 360;
scheduleDraw();
}
function clearCanvas() {
if (!state.components.length && !state.connections.length) return;
saveUndo();
state.components = [];
state.connections = [];
selectedId = null;
renderProps();
scheduleDraw();
}
/* ── Toolbar buttons ─────────────────────────────────────── */
function on(id, ev, fn) { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
on('btn-delete', 'click', deleteSelected);
on('btn-rotate', 'click', rotateSelected);
on('btn-clear', 'click', function () {
if (state.components.length && !confirm('Очистити полотно?')) return;
clearCanvas();
});
on('btn-undo', 'click', doUndo);
on('btn-redo', 'click', doRedo);
var animRAF = 0;
var animStart = 0;
function animLoop(t) {
if (!isRunning) { animRAF = 0; return; }
if (!animStart) animStart = t;
if (circuitDirty || !sim) {
// Check for short circuits before solving (catches KZ created by switch/button toggle)
var fRuntime = checkFaults();
if (fRuntime && !fRuntime._voltmeterInSeries) {
circuitDirty = false;
sim = null;
isRunning = false;
wasRunningBeforeFault = true;
document.getElementById('btn-run').style.display = 'block';
document.getElementById('btn-stop').style.display = 'none';
stopAllBuzzerTones();
hideOpenLoopInfo();
showFaults(fRuntime);
animRAF = requestAnimationFrame(function flash(){
if (!faults) { animRAF = 0; return; }
scheduleDraw();
animRAF = requestAnimationFrame(flash);
});
return;
}
if (fRuntime && fRuntime._voltmeterInSeries) {
showFaults(fRuntime); // show warning banner but keep running
}
runSolve();
circuitDirty = false;
var f2 = checkPostSolveFaults(sim);
if (f2 && f2._onlyOpenSwitch) {
showOpenLoopInfo('Розімкнене коло — клацніть вимикач, щоб замкнути і запустити струм');
} else {
hideOpenLoopInfo();
}
}
updateBuzzerSounds();
draw();
animRAF = requestAnimationFrame(animLoop);
}
function startSim() {
var f = checkFaults();
if (f) {
showFaults(f);
if (f._voltmeterInSeries) {
// Warning only — simulation can still run
clearFaults();
showFaults(f); // keep banner visible
} else {
if (!animRAF) animRAF = requestAnimationFrame(function flash(){
if (!faults) { animRAF = 0; return; }
scheduleDraw();
animRAF = requestAnimationFrame(flash);
});
return;
}
}
clearFaults();
runSolve();
var f2 = checkPostSolveFaults(sim);
if (f2) {
var onlyOpenSwitch = f2._onlyOpenSwitch;
if (!onlyOpenSwitch) {
sim = null;
showFaults(f2);
if (!animRAF) animRAF = requestAnimationFrame(function flash(){
if (!faults) { animRAF = 0; return; }
scheduleDraw();
animRAF = requestAnimationFrame(flash);
});
return;
}
showOpenLoopInfo('Розімкнене коло — клацніть вимикач, щоб замкнути і запустити струм');
}
isRunning = true;
document.getElementById('btn-run').style.display = 'none';
document.getElementById('btn-stop').style.display = 'block';
animStart = 0;
try { sfx.start(); } catch(e){}
if (!animRAF) animRAF = requestAnimationFrame(animLoop);
}
function stopSim() {
isRunning = false;
wasRunningBeforeFault = false;
sim = null;
stopAllBuzzerTones();
hideOpenLoopInfo();
document.getElementById('btn-run').style.display = 'block';
document.getElementById('btn-stop').style.display = 'none';
updateReadouts();
try { sfx.stop(); } catch(e){}
if (animRAF) { cancelAnimationFrame(animRAF); animRAF = 0; }
scheduleDraw();
}
on('btn-run', 'click', startSim);
on('btn-stop', 'click', stopSim);
/* ── Zoom / pan toolbar ─────────────────────────────────── */
function zoomAt(factor, cx, cy) {
cx = cx == null ? cssW/2 : cx;
cy = cy == null ? cssH/2 : cy;
var wx = toWX(cx), wy = toWY(cy);
viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
viewOffX = cx/viewScale - wx;
viewOffY = cy/viewScale - wy;
scheduleDraw();
}
on('btn-zoom-in', 'click', function () { zoomAt(1.2); });
on('btn-zoom-out', 'click', function () { zoomAt(1/1.2); });
on('btn-zoom-reset', 'click', function () { viewScale = 1; viewOffX = 0; viewOffY = 0; scheduleDraw(); });
on('btn-zoom-fit', 'click', fitAll);
on('btn-pan-toggle', 'click', function () {
tool = tool === 'pan' ? 'move' : 'pan';
document.getElementById('btn-pan-toggle').classList.toggle('active', tool === 'pan');
canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
});
function fitAll() {
if (!state.components.length) { viewScale=1; viewOffX=0; viewOffY=0; scheduleDraw(); return; }
var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
state.components.forEach(function(c){
var b = compBounds(c);
if (b.x<minX) minX=b.x; if (b.y<minY) minY=b.y;
if (b.x+b.w>maxX) maxX=b.x+b.w; if (b.y+b.h>maxY) maxY=b.y+b.h;
});
var pad = 40;
var w = (maxX-minX)+pad*2, h = (maxY-minY)+pad*2;
var s = Math.min(cssW/w, cssH/h, MAX_SCALE);
viewScale = Math.max(MIN_SCALE, s);
viewOffX = (cssW/viewScale - (minX+maxX))/2;
viewOffY = (cssH/viewScale - (minY+maxY))/2;
scheduleDraw();
}
/* ── Keyboard ────────────────────────────────────────────── */
var spaceHeld = false;
window.addEventListener('keydown', function (ev) {
if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
if (ev.code === 'Space') { spaceHeld = true; ev.preventDefault(); }
if (ev.key === 'Delete' || ev.key === 'Backspace') {
if (annSel) { deleteSelectedAnn(); ev.preventDefault(); }
else if (selectedId != null || selectedConnId != null || selectedShape != null) {
deleteSelected(); ev.preventDefault();
}
}
if (ev.key === 'r' || ev.key === 'R') rotateSelected();
if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
if (ev.shiftKey) doRedo(); else doUndo();
ev.preventDefault();
}
if ((ev.ctrlKey || ev.metaKey) && (ev.key === '=' || ev.key === '+' || ev.key === 'Add')) { zoomAt(1.2); ev.preventDefault(); }
if ((ev.ctrlKey || ev.metaKey) && (ev.key === '-' || ev.key === 'Subtract')) { zoomAt(1/1.2); ev.preventDefault(); }
if ((ev.ctrlKey || ev.metaKey) && ev.key === '0') { viewScale=1; viewOffX=0; viewOffY=0; scheduleDraw(); ev.preventDefault(); }
if ((ev.ctrlKey || ev.metaKey) && ev.key === '1') { fitAll(); ev.preventDefault(); }
if (ev.key === 'h' || ev.key === 'H') {
tool = tool === 'pan' ? 'move' : 'pan';
document.getElementById('btn-pan-toggle').classList.toggle('active', tool === 'pan');
canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
}
if (ev.key === 'Escape') {
if (pendingWire) { pendingWire = null; }
selectedId = null; selectedConnId = null;
renderProps(); scheduleDraw();
}
});
window.addEventListener('keyup', function (ev) {
if (ev.code === 'Space') spaceHeld = false;
});
/* ── Hint banner dismiss ─────────────────────────────────── */
if (hintDismissBtn) hintDismissBtn.addEventListener('click', function () { hintBanner.style.display = 'none'; });
/* ── Mode switching ──────────────────────────────────────── */
var modeTabs = document.getElementById('mode-tabs');
if (modeTabs) {
modeTabs.addEventListener('click', function (ev) {
var b = ev.target.closest('.pill');
if (!b) return;
modeTabs.querySelectorAll('.pill').forEach(function(p){ p.classList.toggle('active', p===b); });
currentMode = b.getAttribute('data-mode');
applyMode();
});
}
function applyMode() {
var show = function(id, v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
show('sim-panel', currentMode === 'simulate');
}
/* ── Context menus ──────────────────────────────────────── */
var ctxConnMenu = document.getElementById('ctx-conn-menu');
var ctxCompMenu = document.getElementById('ctx-menu');
var ctxCanvasMenu = document.getElementById('ctx-canvas-menu');
function hideCtxMenus() {
if (ctxConnMenu) ctxConnMenu.style.display = 'none';
if (ctxCompMenu) ctxCompMenu.style.display = 'none';
if (ctxCanvasMenu) ctxCanvasMenu.style.display = 'none';
}
document.addEventListener('click', function(ev){
if (!ev.target.closest('#ctx-conn-menu,#ctx-menu,#ctx-canvas-menu')) hideCtxMenus();
});
function placeCtxMenu(menu, x, y) {
menu.style.display = 'block';
menu.style.left = '0px'; menu.style.top = '0px';
var rect = menu.getBoundingClientRect();
var vw = window.innerWidth, vh = window.innerHeight;
var px = Math.min(x, vw - rect.width - 8);
var py = Math.min(y, vh - rect.height - 8);
if (px < 8) px = 8;
if (py < 8) py = 8;
menu.style.left = px + 'px';
menu.style.top = py + 'px';
}
canvas.addEventListener('contextmenu', function (ev) {
ev.preventDefault();
hideCtxMenus();
var p = screenToWorldFromEvent(ev);
var conn = hitConnection(p.x, p.y);
if (conn) {
selectedConnId = conn.id; selectedId = null;
placeCtxMenu(ctxConnMenu, ev.clientX, ev.clientY);
scheduleDraw();
return;
}
var c = hitComponent(p.x, p.y);
if (c) {
if (isRunning && (c.type === 'switch' || c.type === 'pushbutton')) return;
selectedId = c.id; selectedConnId = null;
var tog = document.getElementById('ctx-toggle');
if (tog) tog.style.display = (c.type === 'switch' || c.type === 'pushbutton') ? '' : 'none';
placeCtxMenu(ctxCompMenu, ev.clientX, ev.clientY);
renderProps();
scheduleDraw();
return;
}
placeCtxMenu(ctxCanvasMenu, ev.clientX, ev.clientY);
});
on('ctx-conn-delete', 'click', function(){ hideCtxMenus(); deleteSelected(); });
on('ctx-conn-clear-wp', 'click', function(){
hideCtxMenus();
var conn = state.connections.find(function(x){return x.id===selectedConnId;});
if (conn) { saveUndo(); conn.waypoints = []; scheduleDraw(); }
});
on('ctx-delete', 'click', function(){ hideCtxMenus(); deleteSelected(); });
on('ctx-rotate', 'click', function(){ hideCtxMenus(); rotateSelected(); });
on('ctx-duplicate', 'click', function(){
hideCtxMenus();
var c = state.components.find(function(x){return x.id===selectedId;});
if (!c) return;
saveUndo();
var def = COMP_DEFS[c.type];
var nc = makeComponent(c.type, c.x + 30, c.y + 30);
for (var k in c.props) nc.props[k] = c.props[k];
nc.rot = c.rot;
state.components.push(nc);
selectedId = nc.id; renderProps(); scheduleDraw();
});
on('ctx-toggle', 'click', function(){
hideCtxMenus();
var c = state.components.find(function(x){return x.id===selectedId;});
if (!c) return;
saveUndo(); c.props.closed = !c.props.closed; try{sfx.click();}catch(e){} renderProps(); scheduleDraw();
});
on('ctx-canvas-clear', 'click', function(){ hideCtxMenus(); if (confirm('Очистити полотно?')) clearCanvas(); });
/* ══════════════════════════════════════════════════════════
MNA Solver — slice 4
══════════════════════════════════════════════════════════ */
var sim = null;
function portKey(compId, portIdx) { return compId + ':' + portIdx; }
/* ── Fault detection (short circuits, dangling sources) ── */
var faults = null;
function checkFaults() {
var parent = {};
function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
function union(a,b){ a=find(a); b=find(b); if (a!==b) parent[a]=b; }
state.components.forEach(function (c) {
var def = COMP_DEFS[c.type];
for (var i = 0; i < def.ports.length; i++) parent[portKey(c.id,i)] = portKey(c.id,i);
});
state.connections.forEach(function (conn) {
union(portKey(conn.from.compId, conn.from.portIdx), portKey(conn.to.compId, conn.to.portIdx));
});
state.components.forEach(function (c) {
if (c.type === 'junction' || c.type === 'junction4') {
var def = COMP_DEFS[c.type];
for (var i = 1; i < def.ports.length; i++) union(portKey(c.id,0), portKey(c.id,i));
}
// Closed switch / pushbutton is a near-zero-resistance wire — treat ports as same node
if ((c.type === 'switch' || c.type === 'pushbutton') && c.props.closed) {
union(portKey(c.id, 0), portKey(c.id, 1));
}
// Ammeter has near-zero resistance (0.001 Ω) — treat as wire for short-circuit detection
if (c.type === 'ammeter') {
union(portKey(c.id, 0), portKey(c.id, 1));
}
});
var wireIds = {}, compIds = {}, msgs = [];
var batteries = state.components.filter(function (c) { return c.type === 'battery'; });

// ── Voltmeter-in-series detection ──────────────────────────
// Build a second union-find that excludes voltmeters.
// If a battery's poles are NOT connected without voltmeters,
// but ARE connected with them → voltmeter(s) are wired in series.
(function() {
  var p2 = {};
  function find2(k) { while (p2[k] !== k) { p2[k] = p2[p2[k]]; k = p2[k]; } return k; }
  function union2(a,b){ a=find2(a); b=find2(b); if (a!==b) p2[a]=b; }
  state.components.forEach(function(c) {
    var def = COMP_DEFS[c.type];
    for (var i = 0; i < def.ports.length; i++) p2[portKey(c.id,i)] = portKey(c.id,i);
  });
  state.connections.forEach(function(conn) {
    union2(portKey(conn.from.compId, conn.from.portIdx), portKey(conn.to.compId, conn.to.portIdx));
  });
  state.components.forEach(function(c) {
    if (c.type === 'junction' || c.type === 'junction4') {
      var def = COMP_DEFS[c.type];
      for (var i = 1; i < def.ports.length; i++) union2(portKey(c.id,0), portKey(c.id,i));
    }
    if ((c.type === 'switch' || c.type === 'pushbutton') && c.props.closed) union2(portKey(c.id,0), portKey(c.id,1));
    if (c.type === 'ammeter') union2(portKey(c.id,0), portKey(c.id,1));
    // voltmeter intentionally excluded
  });
  batteries.forEach(function(b) {
    var noVmConnected = find2(portKey(b.id,0)) === find2(portKey(b.id,1));
    var withVmConnected = find(portKey(b.id,0)) === find(portKey(b.id,1));
    // Poles are connected only because of voltmeter(s) — voltmeter is in series
    if (!noVmConnected && withVmConnected) {
      // find which voltmeters are in the same net as the battery poles
      state.components.forEach(function(c) {
        if (c.type !== 'voltmeter') return;
        if (find(portKey(c.id,0)) === find(portKey(b.id,0))) {
          compIds[c.id] = true;
          compIds[b.id] = true;
          msgs.push('⚠ Вольтметр #' + c.id + ' увімкнено неправильно — послідовно в коло.' +
            ' Вольтметр має дуже великий опір (~1 ГОм) і розриває коло.' +
            ' Підключайте вольтметр ПАРАЛЕЛЬНО до елемента, напругу якого вимірюєте.');
        }
      });
    }
  });
})();

if (batteries.length === 0) {
  msgs.push('⚠ У колі відсутня батарея — додайте джерело напруги для запуску симуляції.');
}

batteries.forEach(function (b) {
  if (find(portKey(b.id,0)) === find(portKey(b.id,1))) {
    compIds[b.id] = true;
    // Find if a closed switch or ammeter is responsible for the short
    var shortSwitch = null;
    var shortAmmeter = null;
    state.components.forEach(function (c) {
      if ((c.type === 'switch' || c.type === 'pushbutton') && c.props.closed) {
        if (find(portKey(c.id, 0)) === find(portKey(b.id, 0))) {
          shortSwitch = c;
          compIds[c.id] = true;
        }
      }
      if (c.type === 'ammeter') {
        if (find(portKey(c.id, 0)) === find(portKey(b.id, 0))) {
          shortAmmeter = c;
          compIds[c.id] = true;
        }
      }
    });
    var cause = shortAmmeter
      ? ' Амперметр #' + shortAmmeter.id + ' підключено без навантаження — він має майже нульовий опір і створює КЗ. Підключайте амперметр ПОСЛІДОВНО з резистором або іншим навантаженням.'
      : shortSwitch
      ? ' Замкнутий ' + (shortSwitch.type === 'switch' ? 'вимикач' : 'кнопка') + ' #' + shortSwitch.id + ' з\'єднує клеми без опору між ними.'
      : ' Клеми + та − в одному вузлі без опору між ними.';
    msgs.push('⚡ Коротке замикання батареї #' + b.id + ' (' + (b.props.V||0) + 'В)!' + cause + ' Додайте резистор або навантаження в коло.');
    var sn = find(portKey(b.id,0));
    state.connections.forEach(function (conn) {
      if (find(portKey(conn.from.compId, conn.from.portIdx)) === sn || find(portKey(conn.to.compId, conn.to.portIdx)) === sn) {
        wireIds[conn.id] = true;
      }
    });
    state.components.forEach(function (cc) {
      if (cc.type === 'junction' || cc.type === 'junction4') {
        if (find(portKey(cc.id,0)) === sn) compIds[cc.id] = true;
      }
    });
  }
});

batteries.forEach(function (b) {
  var p0 = find(portKey(b.id,0)), p1 = find(portKey(b.id,1));
  var p0Conn = false, p1Conn = false;
  state.connections.forEach(function (conn) {
    var fk = find(portKey(conn.from.compId, conn.from.portIdx));
    var tk = find(portKey(conn.to.compId, conn.to.portIdx));
    if (fk === p0 || tk === p0) p0Conn = true;
    if (fk === p1 || tk === p1) p1Conn = true;
  });
  if (!p0Conn || !p1Conn) {
    compIds[b.id] = true;
    msgs.push('⚠ Батарея #' + b.id + ' підключена не повністю — обидві клеми (+ та −) мають бути з\'єднані з колом.');
  }
});

for (var bi = 0; bi < batteries.length; bi++) {
  for (var bj = bi + 1; bj < batteries.length; bj++) {
    var b1 = batteries[bi], b2 = batteries[bj];
    var b1p = find(portKey(b1.id, 0)), b1n = find(portKey(b1.id, 1));
    var b2p = find(portKey(b2.id, 0)), b2n = find(portKey(b2.id, 1));
    var sameOrient = (b1p === b2p && b1n === b2n);
    var oppOrient  = (b1p === b2n && b1n === b2p);
    if (sameOrient || oppOrient) {
      var v1 = b1.props.V || 0, v2 = b2.props.V || 0;
      var effective = oppOrient ? -v2 : v2;
      if (Math.abs(v1 - effective) > 1e-6) {
        compIds[b1.id] = true; compIds[b2.id] = true;
        msgs.push('⚠ Батарея #' + b1.id + ' (' + v1 + 'В) та #' + b2.id + ' (' + v2 + 'В) з\'єднані паралельно з різними напругами — порушення KVL. Додайте резистор між ними або вирівняйте напруги.');
      }
    }
  }
}

var ammeters = state.components.filter(function (c) { return c.type === 'ammeter'; });
var loadTypes = ['resistor','rheostat','lamp','fan','buzzer','heater','led'];
ammeters.forEach(function (a) {
  if (compIds[a.id]) return; // already flagged as short-circuit cause — skip
  var an0 = find(portKey(a.id, 0)), an1 = find(portKey(a.id, 1));
  if (an0 === an1) return;
  state.components.forEach(function (cc) {
    if (loadTypes.indexOf(cc.type) < 0) return;
    var cn0 = find(portKey(cc.id, 0)), cn1 = find(portKey(cc.id, 1));
    if ((cn0 === an0 && cn1 === an1) || (cn0 === an1 && cn1 === an0)) {
      compIds[a.id] = true; compIds[cc.id] = true;
      msgs.push('⚠ Амперметр #' + a.id + ' підключено паралельно до ' + cc.type + ' #' + cc.id + ' — амперметр має майже нульовий опір і замкне його. Підключайте амперметри ПОСЛІДОВНО з навантаженням, а не паралельно.');
    }
  });
});

var seenPairs = {};
state.connections.forEach(function (conn) {
  var a = conn.from.compId + ':' + conn.from.portIdx;
  var b = conn.to.compId + ':' + conn.to.portIdx;
  var k = a < b ? (a + '|' + b) : (b + '|' + a);
  if (seenPairs[k]) {
    wireIds[conn.id] = true; wireIds[seenPairs[k]] = true;
    msgs.push('⚠ Два дроти з\'єднують ті самі порти — видаліть зайвий, щоб уникнути спотворення показників.');
  } else {
    seenPairs[k] = conn.id;
  }
});

if (msgs.length === 0) return null;
var result = { wireIds: wireIds, compIds: compIds, messages: msgs };
// Voltmeter-in-series is a warning, not a hard stop — simulation can still run
var vmSeriesOnly = msgs.every(function(m){ return m.indexOf('Вольтметр') >= 0 && m.indexOf('послідовно') >= 0; });
if (vmSeriesOnly) result._voltmeterInSeries = true;
return result;
}
function checkPostSolveFaults(s) {
var batteries = state.components.filter(function (c) { return c.type === 'battery'; });
if (batteries.length === 0) return null;
var liveBatts = batteries.filter(function (b) { return Math.abs(b.props.V || 0) > 1e-9; });
if (liveBatts.length === 0) return null;
var wireIds = {}, compIds = {}, msgs = [];

if (!s) {
  liveBatts.forEach(function (b) { compIds[b.id] = true; });
  msgs.push('⚠ Солвер не зміг розв\'язати коло — ймовірно, жорстке замикання джерела напруги або сингулярна конфігурація. Перевірте з\'єднання.');
} else {
  var realLoadTypes = ['resistor','rheostat','lamp','fan','buzzer','heater','led'];
  var maxLoadI = 0, maxVmI = 0;
  if (s.compI) {
    state.components.forEach(function (c) {
      var i = s.compI[c.id] || 0;
      if (realLoadTypes.indexOf(c.type) >= 0 && i > maxLoadI) maxLoadI = i;
      if (c.type === 'voltmeter' && i > maxVmI) maxVmI = i;
    });
  }
  var totI = Math.abs(s.totalI || 0);
  var deadCurrent      = !isFinite(s.totalI) || totI < 1e-9;
  var voltmeterInLoop  = !deadCurrent && totI < 1e-6 && maxVmI >= 0.5 * totI;
  var loadStarved      = !deadCurrent && totI < 1e-6 && maxLoadI < 0.01 * totI;
  if (!deadCurrent && !voltmeterInLoop && !loadStarved) return null;
  liveBatts.forEach(function (b) {
    compIds[b.id] = true;
    var nA = s.netOf ? s.netOf(b.id, 0) : null;
    var nB = s.netOf ? s.netOf(b.id, 1) : null;
    state.connections.forEach(function (conn) {
      var fn = s.netOf ? s.netOf(conn.from.compId, conn.from.portIdx) : null;
      var tn = s.netOf ? s.netOf(conn.to.compId, conn.to.portIdx) : null;
      if (fn === nA || fn === nB || tn === nA || tn === nB) wireIds[conn.id] = true;
    });
  });
  var hasVm = state.components.some(function (c) { return c.type === 'voltmeter'; });
  var hasOpenSwitch = state.components.some(function (c) { 
    return (c.type === 'switch' || c.type === 'pushbutton') && !c.props.closed;
  });
  var hint = hasVm ? ' Вольтметр має дуже великий опір — він не може бути єдиним шляхом повернення; його слід підключати паралельно до того, що вимірюється.' :
              hasOpenSwitch ? ' Розімкнутий вимикач розриває коло — замкніть його або приберіть з основного шляху струму.' :
             ' Переконайтеся, що кожен компонент має повний контур назад до батареї без розривів.';
  msgs.push('⚠ Струм не тече — коло не має замкненого провідного контуру.' + hint);
}

if (msgs.length === 0) return null;
var result = { wireIds: wireIds, compIds: compIds, messages: msgs };

var hasOpenSwitch = state.components.some(function(c){
  return (c.type === 'switch' || c.type === 'pushbutton') &&
         !c.props.closed;
});

if (hasOpenSwitch) {
  result._onlyOpenSwitch = true;
}
return result;
}







function clearFaults() {
if (!faults) return;
faults = null;
var bn = document.getElementById('fault-banner');
if (bn) bn.style.display = 'none';
scheduleDraw();
}
function showFaults(f) {
faults = f;
try { if (typeof sfx !== 'undefined' && sfx) sfx.fault(); } catch(e){}
var bn = document.getElementById('fault-banner');
if (!bn) {
bn = document.createElement('div');
bn.id = 'fault-banner';
bn.className = 'fault-banner';
bn.innerHTML = ' <div class="fb-text"></div> <button class="fb-close" type="button" aria-label="Dismiss">×</button>';
if (canvasCard) canvasCard.appendChild(bn);
bn.querySelector('.fb-close').addEventListener('click', clearFaults);
}
bn.querySelector('.fb-text').innerHTML = f.messages.map(function (m) {
  return '<div>' + m.replace(/[<>&]/g, function(ch){
    return {
      '<':'&lt;',
      '>':'&gt;',
      '&':'&amp;'
    }[ch];
  }) + '</div>';
}).join('');
bn.style.display = 'block';
scheduleDraw();
}
function faultPulse() { return 0.5 + 0.5 * Math.sin(performance.now() / 180); }
var openLoopBanner = null;
function showOpenLoopInfo(msg) {
if (!openLoopBanner) {
openLoopBanner = document.createElement('div');
openLoopBanner.id = 'open-loop-banner';
openLoopBanner.style.cssText = [
'position:absolute', 'bottom:20px', 'left:20px',
'background:#1a1e2c', 'border-left:6px solid #ffb347',
'padding:12px 16px', 'border-radius:14px', 'color:#ffd180',
'font-size:12px', 'max-width:460px', 'z-index:400',
'backdrop-filter:blur(12px)', 'display:none',
'display:flex', 'align-items:flex-start', 'gap:10px'
].join(';');
openLoopBanner.innerHTML =
' <span class="olb-text" style="flex:1"></span>' +
' <button style="background:none;border:none;color:#ffd180;cursor:pointer;font-size:16px;line-height:1;padding:0 0 0 8px;" class="olb-close">×</button>';
if (canvasCard) canvasCard.appendChild(openLoopBanner);
openLoopBanner.querySelector('.olb-close').addEventListener('click', hideOpenLoopInfo);
}
openLoopBanner.querySelector('.olb-text').textContent = '🔓 ' + (msg || 'Розімкнене коло — натисніть на вимикач, щоб замкнути');
openLoopBanner.style.display = 'flex';
}
function hideOpenLoopInfo() {
if (openLoopBanner) openLoopBanner.style.display = 'none';
}
function solve() {
var parent = {};
function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
function union(a,b){ a=find(a); b=find(b); if (a!==b) parent[a]=b; }
state.components.forEach(function (c) {
var def = COMP_DEFS[c.type];
for (var i = 0; i < def.ports.length; i++) {
var k = portKey(c.id, i);
parent[k] = k;
}
});
state.connections.forEach(function (conn) {
union(portKey(conn.from.compId, conn.from.portIdx), portKey(conn.to.compId, conn.to.portIdx));
});
state.components.forEach(function (c) {
if (c.type === 'junction' || c.type === 'junction4') {
var def = COMP_DEFS[c.type];
for (var i = 1; i < def.ports.length; i++) {
union(portKey(c.id, 0), portKey(c.id, i));
}
}
});
var netIdMap = {}, nets = [];
Object.keys(parent).forEach(function (k) {
  var r = find(k);
  if (netIdMap[r] == null) { netIdMap[r] = nets.length; nets.push(r); }
});
var N = nets.length;
function netOf(compId, portIdx) { return netIdMap[find(portKey(compId, portIdx))]; }

var groundNet = -1;
for (var i = 0; i < state.components.length; i++) {
  if (state.components[i].type === 'ground') { groundNet = netOf(state.components[i].id, 0); break; }
}
if (groundNet < 0) {
  for (var j = 0; j < state.components.length; j++) {
    if (state.components[j].type === 'battery') { groundNet = netOf(state.components[j].id, 1); break; }
  }
}
if (groundNet < 0) return null;

var vSources = [];
var vSeenKeys = {};
var vAliases = {};
state.components.forEach(function (c) {
  if (c.type !== 'battery') return;
  var nplus = netOf(c.id, 0), nmin = netOf(c.id, 1);
  var V = c.props.V || 0;
  var fwdKey = nplus + '|' + nmin + '|' + V.toFixed(9);
  var revKey = nmin + '|' + nplus + '|' + (-V).toFixed(9);
  if (vSeenKeys[fwdKey] != null) {
    vAliases[c.id] = vSources[vSeenKeys[fwdKey]].id;
  } else if (vSeenKeys[revKey] != null) {
    vAliases[c.id] = vSources[vSeenKeys[revKey]].id;
  } else {
     vSeenKeys[fwdKey] = vSources.length;
    vSources.push(c);
  }
});
if (!vSources.length) return null;
var M = vSources.length;

var netIdx = new Array(N);
var idx = 0;
for (var n = 0; n < N; n++) netIdx[n] = (n === groundNet ? -1 : idx++);
var SIZE = (N - 1) + M;
if (SIZE <= 0) return null;

var A = [];
for (var r = 0; r < SIZE; r++) { var row = new Array(SIZE); for (var c2 = 0; c2 < SIZE; c2++) row[c2] = 0; A.push(row); }
var B = new Array(SIZE); for (var z = 0; z < SIZE; z++) B[z] = 0;

function stampG(na, nb, g) {
  var ia = netIdx[na], ib = netIdx[nb];
  if (ia >= 0) A[ia][ia] += g;
  if (ib >= 0) A[ib][ib] += g;
  if (ia >= 0 && ib >= 0) { A[ia][ib] -= g; A[ib][ia] -= g; }
}

function resistanceOf(c) {
  if (c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') return Math.max(0.01, c.props.R);
  if (c.type === 'led') return Math.max(5, c.props.R);
  if (c.type === 'ammeter') return 0.001;
  if (c.type === 'voltmeter') return 1e9;
  if (c.type === 'switch' || c.type === 'pushbutton') return c.props.closed ? 0.001 : null;
  return null;
}

var branches = [];
state.components.forEach(function (c) {
  var R = resistanceOf(c);
  if (R == null) return;
  branches.push({ comp: c, na: netOf(c.id, 0), nb: netOf(c.id, 1), R: R });
});
branches.forEach(function (b) { stampG(b.na, b.nb, 1/b.R); });

vSources.forEach(function (v, k) {
  var nplus = netOf(v.id, 0), nmin = netOf(v.id, 1);
  var mRow = (N - 1) + k;
  var ip = netIdx[nplus], im = netIdx[nmin];
  if (ip >= 0) { A[mRow][ip] = 1; A[ip][mRow] = 1; }
  if (im >= 0) { A[mRow][im] = -1; A[im][mRow] = -1; }
  B[mRow] = v.props.V;
});

for (var p = 0; p < SIZE; p++) {
  var maxA = Math.abs(A[p][p]); var piv = p;
  for (var pp = p+1; pp < SIZE; pp++) {
    if (Math.abs(A[pp][p]) > maxA) { maxA = Math.abs(A[pp][p]); piv = pp; }
  }
   if (!isFinite(maxA) || maxA < 1e-9) return null;
  if (piv !== p) { var tmp = A[p]; A[p] = A[piv]; A[piv] = tmp; var tb = B[p]; B[p] = B[piv]; B[piv] = tb; }
  for (var rr = p+1; rr < SIZE; rr++) {
    var f = A[rr][p] / A[p][p];
    if (f !== 0) {
      for (var cc = p; cc < SIZE; cc++) A[rr][cc] -= f * A[p][cc];
      B[rr] -= f * B[p];
    }
  }
}
var x = new Array(SIZE);
for (var bk = SIZE-1; bk >= 0; bk--) {
  var s2 = B[bk];
  for (var ck = bk+1; ck < SIZE; ck++) s2 -= A[bk][ck] * x[ck];
  var denom = A[bk][bk];
  if (!isFinite(denom) || Math.abs(denom) < 1e-15) return null;
  x[bk] = s2 / denom;
  if (!isFinite(x[bk])) return null;
}

var voltages = new Array(N);
for (var nn = 0; nn < N; nn++) voltages[nn] = (nn === groundNet) ? 0 : x[netIdx[nn]];
var compV = {}, compI = {}, compP = {}, compCurrentDir = {};
var portI = {};
state.components.forEach(function (c) {
  var def = COMP_DEFS[c.type];
  portI[c.id] = new Array(def.ports.length);
  for (var pi = 0; pi < def.ports.length; pi++) portI[c.id][pi] = 0;
});
branches.forEach(function (b) {
  var v = voltages[b.na] - voltages[b.nb];
  var i = v / b.R;
  compV[b.comp.id] = Math.abs(v);
  compI[b.comp.id] = Math.abs(i);
  compP[b.comp.id] = Math.abs(v*i);
  compCurrentDir[b.comp.id] = i;
  portI[b.comp.id][0] = i;
  portI[b.comp.id][1] = -i;
});
var maxIbAbs = 0, pNetDelivered = 0;
vSources.forEach(function (v, k) {
  var ib = x[(N - 1) + k];
  compV[v.id] = v.props.V;
  compI[v.id] = Math.abs(ib);
  compP[v.id] = Math.abs(v.props.V * ib);
  compCurrentDir[v.id] = -ib;
  portI[v.id][0] = ib;
  portI[v.id][1] = -ib;
  if (Math.abs(ib) > maxIbAbs) maxIbAbs = Math.abs(ib);
  pNetDelivered += -v.props.V * ib;
});
Object.keys(vAliases).forEach(function (aliasIdStr) {
  var aliasId = +aliasIdStr;
  var primaryId = vAliases[aliasIdStr];
  var groupSize = 1;
  Object.keys(vAliases).forEach(function (k) { if (vAliases[k] === primaryId) groupSize++; });
  var scale = 1 / groupSize;
  compV[aliasId] = compV[primaryId];
  compI[aliasId] = (compI[primaryId] || 0) * scale;
  compP[aliasId] = (compP[primaryId] || 0) * scale;
  compCurrentDir[aliasId] = (compCurrentDir[primaryId] || 0) * scale;
  var pportI = portI[primaryId];
  if (pportI) {
     portI[aliasId] = portI[aliasId] || [0, 0];
    portI[aliasId][0] = pportI[0] * scale;
    portI[aliasId][1] = pportI[1] * scale;
  }
  compI[primaryId] *= scale;
  compP[primaryId] *= scale;
  if (pportI) { pportI[0] *= scale; pportI[1] *= scale; }
});
var totalI = maxIbAbs;
var totalP = Math.abs(pNetDelivered);
var Veq = vSources[0].props.V;
var Req = totalI > 1e-9 ? Veq / totalI : Infinity;

return {
  N: N, nets: nets, voltages: voltages, groundNet: groundNet,
  compV: compV, compI: compI, compP: compP, compCurrentDir: compCurrentDir,
  portI: portI,
  totalI: totalI, totalP: totalP, Veq: Veq, Req: Req,
  netOf: netOf
};
}
var BRANCH_TYPES = ['resistor','rheostat','lamp','fan','buzzer','heater','led','ammeter','voltmeter','battery','switch','pushbutton'];
function isBranchComp(c) { return c && BRANCH_TYPES.indexOf(c.type) >= 0; }
function wireSignedCurrent(conn) {
if (!sim || !sim.portI) return 0;
return netSliceCurrent(conn);
}
var _adjCache = null, _adjCacheKey = 0;
function buildAdj() {
var key = function(c,p){ return c+'|'+p; };
var adj = {};
function addEdge(a, b, id) { (adj[a] = adj[a] || []).push({ id:id, other:b }); }
state.connections.forEach(function (cn) {
var a = key(cn.from.compId, cn.from.portIdx);
var b = key(cn.to.compId, cn.to.portIdx);
addEdge(a, b, cn.id); addEdge(b, a, cn.id);
});
state.components.forEach(function (c) {
if (c.type === 'junction' || c.type === 'junction4') {
var def = COMP_DEFS[c.type];
for (var i = 1; i < def.ports.length; i++) {
var sId = 's' + c.id + '_' + i;
addEdge(key(c.id, 0), key(c.id, i), sId);
addEdge(key(c.id, i), key(c.id, 0), sId);
}
}
});
return adj;
}
function getAdj() {
var sigKey = state.connections.length * 1000 + state.components.length;
if (!_adjCache || _adjCacheKey !== sigKey) {
_adjCache = buildAdj();
_adjCacheKey = sigKey;
}
return _adjCache;
}
function netSliceCurrent(conn) {
var key = function(c,p){ return c+'|'+p; };
var startKey = key(conn.from.compId, conn.from.portIdx);
var endKey   = key(conn.to.compId,   conn.to.portIdx);
var skipId   = conn.id;
var adj = getAdj();
var visited = {}; visited[startKey] = true; visited[endKey] = true;
var queue = [startKey];
var totalI = 0;
while (queue.length) {
var k = queue.shift();
var dot = k.indexOf('|');
var cid = parseInt(k.substr(0, dot), 10);
var pidx = parseInt(k.substr(dot+1), 10);
var c = state.components.find(function(x){ return x.id === cid; });
if (isBranchComp(c) && sim.portI[cid]) {
totalI += -sim.portI[cid][pidx];
}
var nbrs = adj[k] || [];
for (var ni = 0; ni < nbrs.length; ni++) {
var n = nbrs[ni];
if (n.id === skipId) continue;
if (!visited[n.other]) { visited[n.other] = true; queue.push(n.other); }
}
}
return totalI;
}
function runSolve() {
try { sim = solve(); }
catch (e) { console.error('Solver error', e); sim = null; }
updateReadouts();
scheduleDraw();
}
function updateReadouts() {
var rv = document.getElementById('r-v');
var rit = document.getElementById('r-it');
var rrt = document.getElementById('r-rt');
var rp = document.getElementById('r-p');
var rn = document.getElementById('r-n');
var rs = document.getElementById('r-status');
var warn = document.getElementById('warning-bar');
if (rn) rn.textContent = state.components.length;
if (!sim) {
if (rv) rv.textContent = '0.0';
if (rit) rit.textContent = '0.0';
if (rrt) rrt.textContent = '—';
if (rp) rp.textContent = '0.00';
if (rs) rs.textContent = isRunning ? 'Відкрито' : 'Очікування';
if (warn && isRunning) {
warn.style.display = '';
warn.textContent = 'Коло не замкнуте. Додайте батарею та замкніть ланцюг.';
} else if (warn) warn.style.display = 'none';
return;
}
if (warn) warn.style.display = 'none';
if (rv) rv.textContent = sim.Veq.toFixed(2);
if (rit) {
var itMeter = autoMeter(sim.totalI, 'А');
rit.textContent = itMeter.val + ' ' + itMeter.unit;
}
if (rrt) rrt.textContent = isFinite(sim.Req) ? formatR(sim.Req) : '∞';
if (rp) rp.textContent = sim.totalP.toFixed(3);
if (rs) rs.textContent = 'Симуляція';
}
/* ── Annotation toolbar ────────────────────────────────── */
var PENCIL_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3Cpath d='M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3C/svg%3E\") 2 22, crosshair";
var markBar = document.getElementById('mark-bar');
function setTool(t) {
tool = t;
markBar.querySelectorAll('.tool-btn').forEach(function (b) {
if (b.hasAttribute('data-tool')) b.classList.toggle('active', b.getAttribute('data-tool') === t);
});
if (t === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
else if (t === 'shape') canvas.style.cursor = 'crosshair';
else if (t === 'pan') canvas.style.cursor = 'grab';
else canvas.style.cursor = 'default';
hideDropdowns();
}
function hideDropdowns() {
var sd = document.getElementById('sketch-dropdown');
var shd = document.getElementById('shape-dropdown');
if (sd) sd.style.display = 'none';
if (shd) shd.style.display = 'none';
}
markBar.querySelectorAll('.tool-btn[data-tool]').forEach(function (b) {
b.addEventListener('click', function () { setTool(b.getAttribute('data-tool')); });
});
var sketchDrop = document.getElementById('sketch-dropdown');
var sketchDropToggle = document.getElementById('sketch-drop-toggle');
if (sketchDropToggle) sketchDropToggle.addEventListener('click', function (ev) {
ev.stopPropagation();
hideDropdowns();
var shown = sketchDrop.style.display === 'block';
sketchDrop.style.display = shown ? 'none' : 'block';
var r = sketchDropToggle.getBoundingClientRect();
sketchDrop.style.left = r.left + 'px';
sketchDrop.style.top = (r.bottom + 4) + 'px';
});
sketchDrop && sketchDrop.querySelectorAll('.swatch').forEach(function (s) {
s.addEventListener('click', function () {
sketchColor = s.getAttribute('data-color');
sketchDrop.querySelectorAll('.swatch').forEach(function(x){x.classList.remove('active');});
s.classList.add('active');
document.documentElement.style.setProperty('--sketch-color', sketchColor);
});
});
sketchDrop && sketchDrop.querySelectorAll('.width-btn').forEach(function (w) {
w.addEventListener('click', function () {
sketchWidth = parseInt(w.getAttribute('data-width'), 10);
sketchDrop.querySelectorAll('.width-btn').forEach(function(x){x.classList.remove('active');});
w.classList.add('active');
});
});
var shapeDrop = document.getElementById('shape-dropdown');
var shapeDropToggle = document.getElementById('shape-drop-toggle');
if (shapeDropToggle) shapeDropToggle.addEventListener('click', function (ev) {
ev.stopPropagation();
hideDropdowns();
var shown = shapeDrop.style.display === 'block';
shapeDrop.style.display = shown ? 'none' : 'block';
var r = shapeDropToggle.getBoundingClientRect();
shapeDrop.style.left = r.left + 'px';
shapeDrop.style.top = (r.bottom + 4) + 'px';
});
shapeDrop && shapeDrop.querySelectorAll('.shape-pick').forEach(function (b) {
b.addEventListener('click', function () {
shapeType = b.getAttribute('data-shape');
shapeDrop.querySelectorAll('.shape-pick').forEach(function(x){x.classList.remove('active');});
b.classList.add('active');
var si = document.getElementById('shape-icon'); if (si) si.innerHTML = b.innerHTML;
setTool('shape');
});
});
shapeDrop && shapeDrop.querySelectorAll('.shape-colors .swatch').forEach(function (s) {
s.addEventListener('click', function () {
shapeColor = s.getAttribute('data-color');
shapeDrop.querySelectorAll('.shape-colors .swatch').forEach(function(x){x.classList.remove('active');});
s.classList.add('active');
document.documentElement.style.setProperty('--shape-color', shapeColor);
});
});
shapeDrop && shapeDrop.querySelectorAll('.shape-widths .width-btn').forEach(function (w) {
w.addEventListener('click', function () {
shapeWidth = parseInt(w.getAttribute('data-width'), 10);
shapeDrop.querySelectorAll('.shape-widths .width-btn').forEach(function(x){x.classList.remove('active');});
w.classList.add('active');
});
});
shapeDrop && shapeDrop.querySelectorAll('.fill-btn').forEach(function (b) {
b.addEventListener('click', function () {
shapeFilled = b.getAttribute('data-fill') === 'true';
shapeDrop.querySelectorAll('.fill-btn').forEach(function(x){x.classList.remove('active');});
b.classList.add('active');
});
});
document.addEventListener('click', function (ev) {
if (!ev.target.closest('#sketch-dropdown,#shape-dropdown,#sketch-drop-toggle,#shape-drop-toggle,#sketch-group,#shape-group')) hideDropdowns();
});
var clearBtn = document.getElementById('btn-clear-annotations');
var clearOverlay = document.getElementById('clear-ann-confirm');
if (clearBtn) clearBtn.addEventListener('click', function () {
clearOverlay.style.display = 'flex';
});
var clearNo = document.getElementById('clear-ann-no');
var clearYes = document.getElementById('clear-ann-yes');
var clearCat = document.getElementById('clear-ann-category');
if (clearNo) clearNo.addEventListener('click', function(){ clearOverlay.style.display = 'none'; });
if (clearYes) clearYes.addEventListener('click', function () {
saveUndo();
var cat = clearCat.value;
if (cat === 'all' || cat === 'sketches') state.annStrokes = [];
if (cat === 'all' || cat === 'shapes') state.annShapes = [];
selectedShape = null;
clearOverlay.style.display = 'none';
scheduleDraw();
});
var toggleAnnBtn = document.getElementById('btn-toggle-annotations');
if (toggleAnnBtn) toggleAnnBtn.addEventListener('click', function () {
annVisible = !annVisible;
toggleAnnBtn.classList.toggle('active', !annVisible);
scheduleDraw();
});
var toggleVBtn = document.getElementById('btn-toggle-voltages');
if (toggleVBtn) toggleVBtn.addEventListener('click', function () {
showNodeVoltages = !showNodeVoltages;
toggleVBtn.classList.toggle('active', showNodeVoltages);
toggleVBtn.setAttribute('aria-pressed', showNodeVoltages ? 'true' : 'false');
scheduleDraw();
});
document.documentElement.style.setProperty('--sketch-color', sketchColor);
document.documentElement.style.setProperty('--shape-color', shapeColor);
/* ── Text label editing ────────────────────────────────── */
var textInput = document.getElementById('shape-text-input');
function startTextEdit(wx, wy) {
if (!textInput) { console.warn('[ohms-law] shape-text-input element missing'); return; }
saveUndo();
var sh = { type: 'text', x: wx, y: wy, w: 100, h: 20, color: shapeColor, width: shapeWidth, filled: false, text: '' };
state.annShapes.push(sh);
textEditing = state.annShapes.length - 1;
selectedShape = textEditing;
textInput.value = '';
textInput.style.display = 'block';
var cOffX = canvas.offsetLeft || 0, cOffY = canvas.offsetTop || 0;
textInput.style.left = (cOffX + toSX(wx)) + 'px';
textInput.style.top  = (cOffY + toSY(wy)) + 'px';
setTimeout(function () { try { textInput.focus(); textInput.select(); } catch (e) {} }, 0);
scheduleDraw();
}
if (textInput) {
textInput.addEventListener('input', function(){
if (textEditing == null) return;
state.annShapes[textEditing].text = textInput.value;
scheduleDraw();
});
textInput.addEventListener('blur', function(){
if (textEditing != null) {
if (!state.annShapes[textEditing].text) state.annShapes.splice(textEditing, 1);
textEditing = null;
}
textInput.style.display = 'none';
scheduleDraw();
});
textInput.addEventListener('keydown', function(ev){
if (ev.key === 'Enter' || ev.key === 'Escape') textInput.blur();
});
}
/* SLICE 5 — Prebuilt / Export */
/* ── Prebuilt circuits ─────────────────────────────────── */
function addComp(type, x, y, props, rot) {
var c = makeComponent(type, x, y);
if (props) for (var k in props) c.props[k] = props[k];
if (rot) c.rot = rot;
state.components.push(c);
return c;
}
function addConn(a, pa, b, pb, wps) {
state.connections.push({ id:state.nextId++, from:{compId:a.id, portIdx:pa}, to:{compId:b.id, portIdx:pb}, waypoints:wps||[] });
}
var PREBUILT = {
single: function(){
var b = addComp('battery', 50, 210, {V:9});
var a = addComp('ammeter', 250, 210);
var r = addComp('resistor', 170, 350, {R:220});
var vm = addComp('voltmeter', 170, 280);
addConn(b, 1, a, 0, []);
addConn(b, 0, r, 0, [{x:-20, y:350}]);
addConn(a, 1, r, 1, [{x:320, y:210}, {x:320, y:350}]);
addConn(vm, 0, r, 0, []);
addConn(vm, 1, r, 1, []);
},
series : function(){
var b = addComp('battery', 80, 220, {V:12});
var a = addComp('ammeter', 220, 220);
var r1 = addComp('resistor', 380, 220, {R:220});
var r2 = addComp('resistor', 560, 220, {R:330});
var vm = addComp('voltmeter', 380, 360);
var g = addComp('ground', 320, 400);
addConn(b, 0, a, 0);
addConn(a, 1, r1, 0);
addConn(r1, 1, r2, 0);
addConn(r2, 1, g, 0, [{x:620,y:220},{x:620,y:380},{x:320,y:380}]);
addConn(b, 1, g, 0, [{x:40,y:220},{x:40,y:380},{x:320,y:380}]);
addConn(r1, 0, vm, 0, [{x:340,y:220},{x:340,y:360}]);
addConn(r1, 1, vm, 1, [{x:420,y:220},{x:420,y:300},{x:410,y:300},{x:410,y:360}]);
},
parallel: function(){
var b = addComp('battery', 60, 240, {V:9});
var a = addComp('ammeter', 200, 240);
var jL = addComp('junction', 320, 240);
var r1 = addComp('resistor', 440, 180, {R:220});
var r2 = addComp('resistor', 440, 300, {R:330});
var jR = addComp('junction', 560, 240);
var vm = addComp('voltmeter', 440, 400);
var g = addComp('ground', 660, 380);
addConn(b, 0, a, 0);
addConn(a, 1, jL, 0);
addConn(jL, 1, r1, 0, [{x:340,y:240},{x:340,y:180},{x:400,y:180}]);
addConn(jL, 1, r2, 0, [{x:340,y:240},{x:340,y:300},{x:400,y:300}]);
addConn(r1, 1, jR, 0, [{x:480,y:180},{x:580,y:180},{x:580,y:240},{x:570,y:240}]);
addConn(r2, 1, jR, 0, [{x:480,y:300},{x:580,y:300},{x:580,y:240},{x:570,y:240}]);
addConn(jR, 1, g, 0, [{x:580,y:240},{x:660,y:240},{x:660,y:360}]);
addConn(b, 1, g, 0, [{x:20,y:240},{x:20,y:420},{x:660,y:420},{x:660,y:360}]);
addConn(jL, 2, vm, 0, [{x:320,y:230},{x:320,y:400},{x:400,y:400}]);
addConn(jR, 2, vm, 1, [{x:560,y:230},{x:560,y:400},{x:480,y:400}]);
},
mixed: function(){
var b = addComp('battery', 60, 220, {V:12});
var a = addComp('ammeter', 200, 220);
var r1 = addComp('resistor', 340, 220, {R:100});
var jL = addComp('junction', 440, 220);
var r2 = addComp('resistor', 560, 160, {R:220});
var r3 = addComp('resistor', 560, 280, {R:330});
var jR = addComp('junction', 680, 220);
var vm = addComp('voltmeter', 560, 400);
var g = addComp('ground', 760, 360);
addConn(b, 0, a, 0);
addConn(a, 1, r1, 0);
addConn(r1, 1, jL, 0);
addConn(jL, 1, r2, 0, [{x:460,y:220},{x:460,y:160},{x:520,y:160}]);
addConn(r2, 1, jR, 0, [{x:600,y:160},{x:700,y:160},{x:700,y:220},{x:690,y:220}]);
addConn(jL, 1, r3, 0, [{x:460,y:220},{x:460,y:280},{x:520,y:280}]);
addConn(r3, 1, jR, 0, [{x:600,y:280},{x:700,y:280},{x:700,y:220},{x:690,y:220}]);
addConn(jR, 1, g, 0, [{x:700,y:220},{x:760,y:220},{x:760,y:340}]);
addConn(b, 1, g, 0, [{x:20,y:220},{x:20,y:420},{x:760,y:420},{x:760,y:340}]);
addConn(jL, 2, vm, 0, [{x:440,y:210},{x:440,y:400},{x:520,y:400}]);
addConn(jR, 2, vm, 1, [{x:680,y:210},{x:680,y:400},{x:600,y:400}]);
},
led: function(){
var b = addComp('battery', 80, 200, {V:5});
var a = addComp('ammeter', 220, 200);
var r = addComp('resistor', 360, 200, {R:330});
var d = addComp('led', 520, 200, {R:30});
var vm = addComp('voltmeter', 520, 340);
var g = addComp('ground', 280, 380);
addConn(b, 0, a, 0);
addConn(a, 1, r, 0);
addConn(r, 1, d, 0);
addConn(d, 1, g, 0, [{x:580,y:200},{x:580,y:360},{x:280,y:360}]);
addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:360},{x:280,y:360}]);
addConn(d, 0, vm, 0, [{x:480,y:200},{x:480,y:340}]);
addConn(d, 1, vm, 1, [{x:580,y:200},{x:580,y:280},{x:560,y:280},{x:560,y:340}]);
},
'lamp-switch': function(){
var b = addComp('battery', 80, 200, {V:12});
var a = addComp('ammeter', 220, 200);
var s = addComp('switch', 360, 200, {closed:false});
var l = addComp('lamp', 500, 200);
var vm = addComp('voltmeter', 500, 360);
var g = addComp('ground', 320, 400);
addConn(b, 0, a, 0);
addConn(a, 1, s, 0);
addConn(s, 1, l, 0);
addConn(l, 1, g, 0, [{x:560,y:200},{x:560,y:380},{x:320,y:380}]);
addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:380},{x:320,y:380}]);
addConn(l, 0, vm, 0, [{x:470,y:200},{x:470,y:360}]);
addConn(l, 1, vm, 1, [{x:560,y:200},{x:560,y:300},{x:530,y:300},{x:530,y:360}]);
},
fan: function(){
var b = addComp('battery', 80, 200, {V:12});
var a = addComp('ammeter', 220, 200); 
var s = addComp('switch', 360, 200, {closed:true});
var f = addComp('fan', 500, 200, {R:50});
var vm = addComp('voltmeter', 500, 380);
var g = addComp('ground', 320, 420);
addConn(b, 0, a, 0);
addConn(a, 1, s, 0);
addConn(s, 1, f, 0);
addConn(f, 1, g, 0, [{x:570,y:200},{x:570,y:400},{x:320,y:400}]);
addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:400},{x:320,y:400}]);
addConn(f, 0, vm, 0, [{x:465,y:200},{x:465,y:380}]);
addConn(f, 1, vm, 1, [{x:570,y:200},{x:570,y:320},{x:535,y:320},{x:535,y:380}]);
},
'ammeter-voltmeter': function(){
var b = addComp('battery', 100, 200, {V:9});
var a = addComp('ammeter', 240, 200);
var r = addComp('resistor', 400, 200, {R:220});
var vm = addComp('voltmeter', 400, 320);
var g = addComp('ground', 240, 360);
addConn(b, 0, a, 0);
addConn(a, 1, r, 0);
addConn(r, 1, g, 0, [{x:460,y:200},{x:460,y:340},{x:240,y:340}]);
addConn(b, 1, g, 0, [{x:60,y:200},{x:60,y:340},{x:240,y:340}]);
addConn(r, 0, vm, 0, [{x:360,y:200},{x:360,y:320}]);
addConn(r, 1, vm, 1, [{x:460,y:200},{x:460,y:320}]);
},
divider: function(){
var b = addComp('battery', 120, 200, {V:12});
var r1 = addComp('resistor', 300, 140, {R:1000});
var r2 = addComp('resistor', 300, 260, {R:2000});
var vm = addComp('voltmeter', 460, 260);
var g = addComp('ground', 120, 360);
addConn(b, 0, r1, 0, [{x:240,y:160},{x:260,y:140}]);
addConn(r1, 1, r2, 1, [{x:360,y:140},{x:360,y:260}]);
addConn(r2, 0, b, 1, [{x:260,y:260},{x:80,y:260},{x:80,y:200}]);
addConn(r2, 1, vm, 0, [{x:360,y:260},{x:420,y:260}]);
addConn(r2, 0, vm, 1, [{x:260,y:260},{x:260,y:340},{x:500,y:340},{x:500,y:260}]);
addConn(b, 1, g, 0, [{x:80,y:260},{x:120,y:340}]);
},
bridge: function(){
var b = addComp('battery', 60, 280, {V:12});
var a = addComp('ammeter', 200, 280);
var jT = addComp('junction', 440, 160);
var jB = addComp('junction4', 440, 400);
var jL = addComp('junction', 320, 280);
var jR = addComp('junction', 560, 280);
var r1 = addComp('resistor', 380, 220, {R:1000});
var r2 = addComp('resistor', 500, 220, {R:2200});
var r3 = addComp('resistor', 380, 340, {R:1000});
var r4 = addComp('resistor', 500, 340, {R:2200});
var vm = addComp('voltmeter', 440, 280);
var g = addComp('ground', 660, 420);
addConn(b, 0, a, 0);
addConn(a, 1, jT, 2, [{x:280,y:280},{x:280,y:160},{x:440,y:160},{x:440,y:150}]);
addConn(jL, 2, r1, 0, [{x:320,y:270},{x:320,y:220},{x:340,y:220}]);
addConn(r1, 1, jT, 0, [{x:420,y:220},{x:430,y:220},{x:430,y:160}]);
addConn(jT, 1, r2, 0, [{x:450,y:160},{x:450,y:220},{x:460,y:220}]);
addConn(r2, 1, jR, 2, [{x:540,y:220},{x:560,y:220},{x:560,y:270}]);
addConn(jL, 1, r3, 0, [{x:330,y:280},{x:330,y:340},{x:340,y:340}]);
addConn(r3, 1, jB, 0, [{x:420,y:340},{x:430,y:340},{x:430,y:400}]);
addConn(jB, 1, r4, 0, [{x:450,y:400},{x:450,y:340},{x:460,y:340}]);
addConn(r4, 1, jR, 0, [{x:540,y:340},{x:550,y:340},{x:550,y:280}]);
addConn(jL, 1, vm, 0, [{x:330,y:280},{x:410,y:280}]);
addConn(jR, 0, vm, 1, [{x:550,y:280},{x:470,y:280}]);
addConn(jB, 3, g, 0, [{x:440,y:410},{x:440,y:440},{x:660,y:440},{x:660,y:400}]);
addConn(b, 1, g, 0, [{x:20,y:280},{x:20,y:460},{x:660,y:460},{x:660,y:400}]);
},
'multi-lamp': function(){
var b = addComp('battery', 60, 260, {V:12});
var aT = addComp('ammeter', 200, 260);
var jL = addComp('junction4', 320, 260);
var jR = addComp('junction4', 760, 260);
var s1 = addComp('switch', 420, 160, {closed:true});
var a1 = addComp('ammeter', 560, 160);
var l1 = addComp('lamp', 680, 160, {R:48});
var s2 = addComp('switch', 420, 260, {closed:true});
var a2 = addComp('ammeter', 560, 260);
var l2 = addComp('lamp', 680, 260, {R:48});
var s3 = addComp('switch', 420, 360, {closed:false});
var a3 = addComp('ammeter', 560, 360);
var l3 = addComp('lamp', 680, 360, {R:48});
var vm = addComp('voltmeter', 540, 460);
var g = addComp('ground', 860, 440);
addConn(b, 0, aT, 0);
addConn(aT, 1, jL, 0);
addConn(jL, 2, s1, 0, [{x:320,y:250},{x:320,y:160},{x:385,y:160}]);
addConn(s1, 1, a1, 0);
addConn(a1, 1, l1, 0);
addConn(l1, 1, jR, 2, [{x:710,y:160},{x:760,y:160},{x:760,y:250}]);
addConn(jL, 1, s2, 0);
addConn(s2, 1, a2, 0);
addConn(a2, 1, l2, 0);
addConn(l2, 1, jR, 0);
addConn(jL, 3, s3, 0, [{x:320,y:270},{x:320,y:360},{x:385,y:360}]);
addConn(s3, 1, a3, 0);
addConn(a3, 1, l3, 0);
addConn(l3, 1, jR, 3, [{x:710,y:360},{x:760,y:360},{x:760,y:270}]);
addConn(jL, 3, vm, 0, [{x:320,y:270},{x:320,y:460},{x:500,y:460}]);
addConn(jR, 3, vm, 1, [{x:760,y:270},{x:760,y:460},{x:580,y:460}]);
addConn(jR, 1, g, 0, [{x:780,y:260},{x:860,y:260},{x:860,y:420}]);
addConn(b, 1, g, 0, [{x:20,y:260},{x:20,y:480},{x:860,y:480},{x:860,y:420}]);
},
'two-loop': function(){
var b = addComp('battery', 60, 260, {V:12});
var aT = addComp('ammeter', 200, 260);
var jL = addComp('junction4', 340, 260);
var r1 = addComp('resistor', 460, 160, {R:220});
var aU = addComp('ammeter', 600, 160);
var r2 = addComp('resistor', 460, 360, {R:330});
var aD = addComp('ammeter', 600, 360);
var jR = addComp('junction4', 740, 260);
var r3 = addComp('resistor', 740, 380, {R:100});
var vm = addComp('voltmeter', 460, 480);
var g = addComp('ground', 860, 440);
addConn(b, 0, aT, 0);
addConn(aT, 1, jL, 0);
addConn(jL, 2, r1, 0, [{x:340,y:250},{x:340,y:160},{x:420,y:160}]);
addConn(r1, 1, aU, 0);
addConn(aU, 1, jR, 2, [{x:630,y:160},{x:740,y:160},{x:740,y:250}]);
addConn(jL, 3, r2, 0, [{x:340,y:270},{x:340,y:360},{x:420,y:360}]);
addConn(r2, 1, aD, 0);
addConn(aD, 1, jR, 3, [{x:630,y:360},{x:740,y:360},{x:740,y:270}]);
addConn(jR, 1, r3, 1, [{x:760,y:260},{x:790,y:260},{x:790,y:380},{x:780,y:380}]);
addConn(r3, 0, g, 0, [{x:700,y:380},{x:680,y:380},{x:680,y:440},{x:860,y:440},{x:860,y:420}]);
addConn(r1, 0, vm, 0, [{x:420,y:160},{x:400,y:160},{x:400,y:480},{x:420,y:480}]);
addConn(r1, 1, vm, 1, [{x:500,y:160},{x:520,y:160},{x:520,y:480},{x:500,y:480}]);
addConn(b, 1, g, 0, [{x:20,y:260},{x:20,y:500},{x:860,y:500},{x:860,y:420}]);
}
};
var prebuiltTabs = document.getElementById('prebuilt-tabs');
var circuitDesc = document.getElementById('circuit-desc');
var CIRCUIT_DESC = {
single:'Просте коло з одним резистором. Закон Ома V = IR в найпростішому вигляді.',
series:'Два резистори послідовно. Однаковий струм, напруги додаються.',
parallel:'Два резистори паралельно. Однакова напруга, струми додаються.',
mixed: 'R₁ послідовно з (R₂ || R₃). Змішане з\'єднання.',
led:'Світлодіод із струмообмежувальним резистором. Не підключайте LED без резистора!',
'lamp-switch':'Лампа керується вимикачем. Переключіть вимикач для увімкнення.',
fan:'Вентилятор (двигун постійного струму) керується вимикачем.',
'ammeter-voltmeter':'Амперметр послідовно, вольтметр паралельно до резистора.',
divider:'Подільник напруги: V_out = V·R₂/(R₁+R₂). Вольтметр показує V_out.',
bridge:'Міст Вітстона — 4 резистори у формі ромба. При R₁/R₃ = R₂/R₄ міст збалансований і вольтметр (гальванометр) показує нуль. Розбалансуйте один резистор, щоб побачити відхилення.',
'multi-lamp':'Три паралельні лампи, кожна зі своїм вимикачем та амперметром. Перемикайте незалежно — головний амперметр дорівнює сумі гілкових (1-й закон Кірхгофа).',
'two-loop':'Двоконтурна мережа із спільним зворотним провідником через R₃. Демонструє 1-й закон Кірхгофа: I_заг = I₁ + I₂ у лівому вузлі.'
};
if (prebuiltTabs) prebuiltTabs.addEventListener('click', function(e){
var b = e.target.closest('.pill'); if (!b) return;
var k = b.getAttribute('data-circuit');
if (!PREBUILT[k]) return;
saveUndo();
clearCanvas();
PREBUILT[k]();
prebuiltTabs.querySelectorAll('.pill').forEach(function(p){ p.classList.toggle('active', p===b); });
if (circuitDesc) { circuitDesc.style.display = ''; circuitDesc.textContent = CIRCUIT_DESC[k] || ''; }
fitAll();
});
/* ── Export PNG ─────────────────────────────────────────── */
function exportPNG(withAnnotations) {
var prev = annVisible;
if (!withAnnotations) annVisible = false;
draw();
ctx.save();
ctx.setTransform(1,0,0,1,0,0);
ctx.fillStyle = 'rgba(255,160,0,0.6)';
ctx.font = (11*DPR)+'px sans-serif';
ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
ctx.fillText('mechsimulator.com', canvas.width-8, canvas.height-6);
ctx.restore();
var url = canvas.toDataURL('image/png');
annVisible = prev;
var a = document.createElement('a');
a.href = url; a.download = 'ohms-law-circuit.png';
a.click();
scheduleDraw();
}
on('canvas-export-btn', 'click', function(){ exportPNG(true); });
on('ctx-canvas-export', 'click', function(){ hideCtxMenus(); exportPNG(true); });
on('ctx-canvas-export-clean', 'click', function(){ hideCtxMenus(); exportPNG(false); });
/* ── Export CSV (readings table) ────────────────────────── */
function csvCell(v) {
if (v == null) return '';
var s = String(v);
return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function fmtNum(n, d) {
if (n == null || !isFinite(n)) return '';
return Number(n).toFixed(d == null ? 6 : d);
}
function exportCSV() {
var rows = [];
rows.push(['Симулятор кола — показники компонентів']);
rows.push(['Експортовано', new Date().toISOString()]);
rows.push(['Source', 'mechsimulator.com/tools/ohms-law/']);
rows.push([]);
if (sim) {
rows.push(['ЗАГАЛЬНІ ДАНІ']);
rows.push(['Напруга (В)','Струм (А)','Потужність (Вт)','R_eq (Ом)']);
rows.push([fmtNum(sim.Veq,4), fmtNum(sim.totalI,6), fmtNum(sim.totalP,6),
(sim.Req === Infinity ? 'Нескінченність' : fmtNum(sim.Req,4))]);
rows.push([]);
} else {
rows.push(['(Коло не розв\'язано — показники відсутні)']);
rows.push([]);
}
rows.push(['КОМПОНЕНТИ']);
rows.push(['ID','Тип','Властивості','Напруга (В)','Струм (А)','Потужність (Вт)']);
state.components.forEach(function(c){
var V = sim && sim.compV ? sim.compV[c.id] : null;
var I = sim && sim.compI ? sim.compI[c.id] : null;
var P = sim && sim.compP ? sim.compP[c.id] : null;
rows.push([c.id, c.type, JSON.stringify(c.props||{}), fmtNum(V,6), fmtNum(I,6), fmtNum(P,6)]);
});
rows.push([]);
rows.push(['З\'ЄДНАННЯ']);
rows.push(['ID','Від (компонент:порт)','До (компонент:порт)']);
state.connections.forEach(function(conn){
rows.push([conn.id,
conn.from.compId + ':' + conn.from.portIdx,
conn.to.compId + ':' + conn.to.portIdx]);
});
var csv = rows.map(function(r){ return r.map(csvCell).join(','); }).join('\r\n');
var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url; a.download = 'ohms-law-readings.csv';
document.body.appendChild(a); a.click(); document.body.removeChild(a);
setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}
on('canvas-export-csv-btn', 'click', exportCSV);
/* ── Fullscreen ─────────────────────────────────────────── */
function toggleFullscreen() {
var p = document.getElementById('sim-panel');
if (!p) return;
p.classList.toggle('is-fullscreen');
var btn = document.getElementById('btn-fullscreen');
if (btn) {
var on = p.classList.contains('is-fullscreen');
btn.title = on ? 'Вийти з повноекранного режиму (Esc / F11)' : 'Повноекранний режим (F11)';
btn.setAttribute('aria-label', on ? 'Вийти з повноекранного' : 'Увійти в повноекранний');
}
setTimeout(resizeCanvas, 50);
}
window.addEventListener('keydown', function (e) {
if (e.key !== 'Escape') return;
var p = document.getElementById('sim-panel');
if (p && p.classList.contains('is-fullscreen')) {
toggleFullscreen();
e.preventDefault();
}
});
on('btn-fullscreen', 'click', toggleFullscreen);
window.addEventListener('keydown', function(e){
if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
if (e.key === 'F11') { toggleFullscreen(); e.preventDefault(); }
if ((e.key === 'd' || e.key === 'D') && selectedId != null && !e.ctrlKey && !e.metaKey) {
var ev = document.getElementById('ctx-duplicate');
if (ev) ev.click();
}
});
/* ── X1: Web Audio sound effects (lazy AudioContext) ────── */
var sfxMuted = false;
try { sfxMuted = localStorage.getItem('ohms-law-sfx-muted') === '1'; } catch(e){}
var _ac = null;
function ac() {
if (sfxMuted) return null;
if (!_ac) {
try {
var AC = window.AudioContext || window.webkitAudioContext;
if (!AC) return null;
_ac = new AC();
} catch (e) { return null; }
}
if (_ac.state === 'suspended') { try { _ac.resume(); } catch(e){} }
return _ac;
}
function tone(freq, dur, type, gain) {
var a = ac(); if (!a) return;
var o = a.createOscillator(), g = a.createGain();
o.type = type || 'sine';
o.frequency.value = freq;
var t = a.currentTime;
g.gain.setValueAtTime(0.0001, t);
g.gain.exponentialRampToValueAtTime(gain || 0.08, t + 0.01);
g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
o.connect(g); g.connect(a.destination);
o.start(t); o.stop(t + dur + 0.02);
}
var sfx = {
click: function () { tone(720, 0.04, 'square', 0.05); },
start: function () { tone(440, 0.06, 'sine', 0.06); setTimeout(function(){ tone(660, 0.08, 'sine', 0.06); }, 60); },
stop:  function () { tone(440, 0.06, 'sine', 0.05); },
fault: function () { tone(220, 0.12, 'sawtooth', 0.07); setTimeout(function(){ tone(160, 0.18, 'sawtooth', 0.07); }, 110); }
};
/* ── Buzzer continuous tone engine ─────────────────────── */
var _buzzerNodes = {};
function buzzerHasCurrent(compId) {
if (!isRunning || !sim || sfxMuted) return false;
var i = Math.abs((sim.compI && sim.compI[compId]) || 0);
return i > 0.0001;
}
function startBuzzerTone(compId) {
if (_buzzerNodes[compId]) return;
var a = ac(); if (!a) return;
var osc = a.createOscillator();
var gainNode = a.createGain();
osc.type = 'square';
osc.frequency.value = 380;
gainNode.gain.setValueAtTime(0.0001, a.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.07, a.currentTime + 0.04);
osc.connect(gainNode);
gainNode.connect(a.destination);
osc.start();
_buzzerNodes[compId] = { osc: osc, gainNode: gainNode };
}
function stopBuzzerTone(compId) {
var node = _buzzerNodes[compId];
if (!node) return;
var a = ac();
if (a) {
node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, a.currentTime);
node.gainNode.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.05);
node.osc.stop(a.currentTime + 0.07);
} else {
try { node.osc.stop(); } catch(e) {}
}
delete _buzzerNodes[compId];
}
function stopAllBuzzerTones() {
Object.keys(_buzzerNodes).forEach(stopBuzzerTone);
}
function updateBuzzerSounds() {
if (!isRunning || !sim || sfxMuted) { stopAllBuzzerTones(); return; }
var activeBuzzers = {};
state.components.forEach(function(c) {
if (c.type !== 'buzzer') return;
if (buzzerHasCurrent(c.id)) {
activeBuzzers[c.id] = true;
startBuzzerTone(c.id);
}
});
Object.keys(_buzzerNodes).forEach(function(id) {
if (!activeBuzzers[id]) stopBuzzerTone(id);
});
}
var sfxBtn = document.getElementById('btn-toggle-sound');
function paintSfxBtn() {
if (!sfxBtn) return;
sfxBtn.innerHTML = sfxMuted ? '🔇' : '🔊';
sfxBtn.setAttribute('aria-pressed', sfxMuted ? 'false' : 'true');
sfxBtn.classList.toggle('active', !sfxMuted);
}
paintSfxBtn();
if (sfxBtn) sfxBtn.addEventListener('click', function () {
sfxMuted = !sfxMuted;
try { localStorage.setItem('ohms-law-sfx-muted', sfxMuted ? '1' : '0'); } catch(e){}
paintSfxBtn();
if (!sfxMuted) sfx.click();
});
/* ── Hint banner localStorage ──────────────────────────── */
var HINT_KEY = 'ohms-law-hint-dismissed';
try {
if (localStorage.getItem(HINT_KEY) === '1' && hintBanner) hintBanner.style.display = 'none';
} catch(e){}
if (hintDismissBtn) hintDismissBtn.addEventListener('click', function(){
try { localStorage.setItem(HINT_KEY, '1'); } catch(e){}
});
/* ── Debug hook for automated tests (no UI side effects) ─── */
window.__OHM_DEBUG = {
state: state,
solve: function(){ return solve(); },
checkFaults: function(){ return checkFaults(); },
checkPostSolveFaults: function(s){ return checkPostSolveFaults(s); },
addComp: addComp,
addConn: addConn,
reset: function(){
state.components.length = 0;
state.connections.length = 0;
state.annStrokes.length = 0;
state.annShapes.length = 0;
state.nextId = 1;
}
};
//
// ===============================
// ЗБЕРЕЖЕННЯ / ЗАВАНТАЖЕННЯ СХЕМ
// ===============================
function exportCircuit() {
const json = snapshot();
const blob = new Blob(
[json],
{ type: 'application/json' }
);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'circuit.json';
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
}
function importCircuit(file) {
const reader = new FileReader();
reader.onload = function(e) {
try {
  restore(e.target.result);
} catch(err) {
  console.error(err);
  alert('Помилка завантаження схеми');
}
};
reader.readAsText(file);
}
// ===============================
// КНОПКИ
// ===============================
window.addEventListener('DOMContentLoaded', () => {
const saveBtn = document.getElementById('btn-save');
const loadBtn = document.getElementById('btn-load');
const fileInput = document.getElementById('file-load');
if (saveBtn) {
saveBtn.addEventListener('click', exportCircuit);
}
if (loadBtn && fileInput) {
loadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    importCircuit(file);
  }
  fileInput.value = '';
});
}
});
/* ── Init ────────────────────────────────────────────────── */
drawPaletteIcons();
resizeCanvas();
viewOffX = 40; viewOffY = 40;
try {
if (PREBUILT.single) {
PREBUILT.single();
var defPill = prebuiltTabs && prebuiltTabs.querySelector('[data-circuit="single"]');
if (defPill) defPill.classList.add('active');
if (circuitDesc) { circuitDesc.style.display = ''; circuitDesc.textContent = CIRCUIT_DESC.single || ''; }
fitAll();
}
} catch (e) { /* non-fatal — just show empty canvas */ }
scheduleDraw();
window.scheduleDraw = scheduleDraw;
window.redrawCanvas = draw;
})();
