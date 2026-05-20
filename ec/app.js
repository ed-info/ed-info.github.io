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
connections: [],     // {id, from:{compId,portIdx}, to:{compId,portIdx}, waypoints:[]}
junctions: [],       // {id, x, y}  — topological merge-points, NOT components
annStrokes: [],      // added in slice 3
annShapes: [],       // added in slice 3
nextId: 1
};
var selectedId = null;         // component id
var selectedConnId = null;     // connection id
var hoverId = null;
var hoverPort = null;          // { compId, portIdx }
var hoverDangle = null;        // { conn, end } — dangling anchor being hovered
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
function purgeFullyDanglingWires() {
    var before = state.connections.length;
    
    // Допоміжна функція: перевіряє, чи є в цій точці існуючий Junction
    function isAnchorValidJunction(anchor) {
        if (!anchor) return false;
        for (var i = 0; i < state.junctions.length; i++) {
            var j = state.junctions[i];
            if (Math.abs(j.x - anchor.x) < 2 && Math.abs(j.y - anchor.y) < 2) return true;
        }
        return false;
    }

    state.connections = state.connections.filter(function(conn) {
        var fAnchor = conn.from.anchor;
        var tAnchor = conn.to.anchor;
        
        // Якщо дріт має якорі на обох кінцях
        if (fAnchor && tAnchor) {
            var j1 = isAnchorValidJunction(fAnchor);
            var j2 = isAnchorValidJunction(tAnchor);
            
            // Якщо обидва кінці вказують на реальні junctions — ЗАЛИШАЄМО дріт
            if (j1 && j2) return true;
            
            // Якщо хоча б один "сирота" (немає junction) — видаляємо
            return false;
        }
        
        // В інших випадках (дріт від компонента до чогось) залишаємо
        return true;
    });
    
    if (state.connections.length !== before) scheduleDraw();
}
//
function purgeOrphanedJunctions() {
    var changed = false;    
    // Знаходимо всі координати і скільки разів до них підключені дроти
    var anchorCount = {};
    state.connections.forEach(function(conn) {
        if (conn.from.anchor) {
            var key = Math.round(conn.from.anchor.x) + ',' + Math.round(conn.from.anchor.y);
            anchorCount[key] = (anchorCount[key] || 0) + 1;
        }
        if (conn.to.anchor) {
            var key2 = Math.round(conn.to.anchor.x) + ',' + Math.round(conn.to.anchor.y);
            anchorCount[key2] = (anchorCount[key2] || 0) + 1;
        }
    });    
    // Видаляємо вузли, до яких нічого не підключено або підключено лише один дріт
    // (вузол-"артефакт" — без підключених дротів або з одним дротом є осиротілим)
    state.junctions = state.junctions.filter(function(junc) {
        var key = Math.round(junc.x) + ',' + Math.round(junc.y);
        var count = anchorCount[key] || 0;
        if (count < 2) {
            changed = true;
            // Якщо цей вузол був виділений - знімаємо виділення
            if (selectedId === junc.id) {
                selectedId = null;
            }
            // Скидаємо pendingWire якщо він вів до/від цього вузла
            if (pendingWire && pendingWire.from && pendingWire.from.anchor) {
                var ax = Math.round(pendingWire.from.anchor.x);
                var ay = Math.round(pendingWire.from.anchor.y);
                if (ax === Math.round(junc.x) && ay === Math.round(junc.y)) {
                    pendingWire = null;
                }
            }
            return false;
        }
        return true;
    });
    
    if (changed) {
        renderProps();
        scheduleDraw();
    }
}
// When a dangling anchor on one wire is connected to a port/anchor on another,
// merge the two wires into one to avoid invisible mid-wire "joints".
function mergeConnectedDanglingWires() {
// Build a set of junction anchor coords — these must NOT be merged,
// they are intentional branch points.
function isJunctionAnchor(anchor) {
  if (!anchor) return false;
  for (var ji = 0; ji < state.junctions.length; ji++) {
    var jj = state.junctions[ji];
    if (Math.abs(anchor.x - jj.x) < 2 && Math.abs(anchor.y - jj.y) < 2) return true;
  }
  return false;
}
var changed = true;
while (changed) {
changed = false;
outer: for (var i = 0; i < state.connections.length; i++) {
var ca = state.connections[i];
for (var j = 0; j < state.connections.length; j++) {
if (i === j) continue;
var cb = state.connections[j];
// Check if ca.to is an anchor that matches cb.from (same coords)
if (ca.to.anchor && cb.from.anchor &&
Math.abs(ca.to.anchor.x - cb.from.anchor.x) < 2 &&
Math.abs(ca.to.anchor.y - cb.from.anchor.y) < 2 &&
!isJunctionAnchor(ca.to.anchor)) {
ca.to = cb.to;
ca.waypoints = (ca.waypoints||[]).concat(cb.waypoints||[]);
state.connections.splice(j, 1);
changed = true; break outer;
}
// ca.to anchor matches cb.to anchor → reverse cb and merge
if (ca.to.anchor && cb.to.anchor &&
Math.abs(ca.to.anchor.x - cb.to.anchor.x) < 2 &&
Math.abs(ca.to.anchor.y - cb.to.anchor.y) < 2 &&
!isJunctionAnchor(ca.to.anchor)) {
ca.to = cb.from;
ca.waypoints = (ca.waypoints||[]).concat((cb.waypoints||[]).slice().reverse());
state.connections.splice(j, 1);
changed = true; break outer;
}
// ca.from anchor matches cb.from anchor → reverse ca and merge
if (ca.from.anchor && cb.from.anchor &&
Math.abs(ca.from.anchor.x - cb.from.anchor.x) < 2 &&
Math.abs(ca.from.anchor.y - cb.from.anchor.y) < 2 &&
!isJunctionAnchor(ca.from.anchor)) {
ca.from = cb.to;
ca.waypoints = (cb.waypoints||[]).slice().reverse().concat(ca.waypoints||[]);
state.connections.splice(j, 1);
changed = true; break outer;
}
// ca.from anchor matches cb.to anchor
if (ca.from.anchor && cb.to.anchor &&
Math.abs(ca.from.anchor.x - cb.to.anchor.x) < 2 &&
Math.abs(ca.from.anchor.y - cb.to.anchor.y) < 2 &&
!isJunctionAnchor(ca.from.anchor)) {
ca.from = cb.from;
ca.waypoints = (cb.waypoints||[]).concat(ca.waypoints||[]);
state.connections.splice(j, 1);
changed = true; break outer;
}
}
}
}
}
function markDirty(){
    circuitDirty = true;
    _adjCache = null; 
    _adjCacheKey = 0;
    mergeConnectedDanglingWires();
    purgeFullyDanglingWires();
    purgeOrphanedJunctions(); 
    if (typeof faults !== 'undefined' && faults)
        clearFaults();
	if (isRunning && sim) {
        buildWireCurrents();
        scheduleDraw();
    }
}
// undo stack
var undoStack = [], redoStack = [];
var MAX_UNDO = 30;
function snapshot() {
return JSON.stringify({
_ecd: 'Electrical Circuit Designer',
components: state.components,
connections: state.connections,
junctions: state.junctions,
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
// Clean up vsource sliders before restoring
Object.keys(_vsourceSliders).forEach(function(id){ removeVsourceSlider(+id); });
state.components = (s.components || []).filter(function(c){ return c.type !== 'junction'; });
state.connections = s.connections || [];
state.junctions = s.junctions || [];
state.annStrokes = s.annStrokes || [];
state.annShapes = s.annShapes || [];
state.nextId = s.nextId || 1;
selectedId = null;
renderProps();
markDirty();
checkIsolatedComponents();
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
battery:    { w: 80, h: 40, label: 'GB', ports: [{x:-40,y:0,name:'+'},{x:40,y:0,name:'-'}], props: { V: 9 } },
vsource:    { w: 80, h: 60, label: 'VS', ports: [{x:-40,y:0,name:'+'},{x:40,y:0,name:'-'}], props: { V: 5, Vmin: 0, Vmax: 20 } },
ground:     { w: 40, h: 40, label: 'GND',ports: [{x:0,y:-20,name:'n'}], props: {} },
resistor:   { w: 80, h: 30, label: 'R',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 220 } },
rheostat:   { w: 80, h: 30, label: 'VR', ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 100, Rmax: 1000 } },
lamp: 		{ w: 60, h: 60, label: 'HL', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 48, color: 'yellow' } },
led:        { w: 60, h: 40, label: 'VD', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'k'}], props: { Vf: 2.0, R: 30, color:'green' } },
fan:        { w: 70, h: 70, label: 'M',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { R: 24 } },
buzzer:     { w: 60, h: 50, label: 'HA', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 120 } },
heater:     { w: 80, h: 40, label: 'H',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 12 } },
switch:     { w: 70, h: 30, label: 'SA', ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { closed: false } },
spdt:       { w: 70, h: 60, label: 'SA', ports: [{x:-35,y:0,name:'c'},{x:35,y:-10,name:'a'},{x:35,y:10,name:'b'}], props: { state: 0 } },
pushbutton: { w: 60, h: 30, label: 'SB', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { closed: false, normallyOpen: true } },
flasher:    { w: 70, h: 60, label: 'KT', ports: [{x:-35,y:0,name:'c'},{x:35,y:-10,name:'a'},{x:35,y:10,name:'b'}], props: { state: 0, tOn: 0.5, tOff: 0.5 } },
ammeter:    { w: 60, h: 60, label: 'PA', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
voltmeter:  { w: 60, h: 60, label: 'PV', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
junction:   { w: 20, h: 20, label: '',   ports: [], props: {} }, // legacy — junctions are now in state.junctions
fuse:       { w: 80, h: 30, label: 'FU', ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { Imax: 1.0, blown: false } }
};
var COMP_LABELS = {
battery:'Батарея', vsource:'Рег. джерело', ground:'Земля', resistor:'Резистор', rheostat:'Реостат',
lamp:'Лампа', led:'Світлодіод', fan:'Вентилятор', buzzer:'Зумер', heater:'Нагрівач',
switch:'Вимикач', spdt:'Перемикач', pushbutton:'Кнопка', flasher:'Реле-переривник', ammeter:'Амперметр', voltmeter:'Вольтметр',
junction:'Вузол', fuse:'Запобіжник'
};
// Returns the display sequential number for a component (same-label order in state.components)
function getCompDisplayNum(comp) {
  var def = COMP_DEFS[comp.type];
  if (!def || !def.label || comp.type === 'ground') return comp.id;
  var lbl = def.label;
  var count = 0;
  for (var _i = 0; _i < state.components.length; _i++) {
    var _c2 = state.components[_i];
    var _d2 = COMP_DEFS[_c2.type];
    if (_d2 && _d2.label === lbl && _c2.type !== 'ground') {
      count++;
      if (_c2.id === comp.id) return count;
    }
  }
  return comp.id;
}
// Кеш порядкових номерів для відображення мітки: compId → порядковий номер серед однотипних.
// Оновлюється перед кожним малюванням через buildCompDisplayNum().
var _compDisplayNum = {};
function buildCompDisplayNum() {
  _compDisplayNum = {};
  var labelCounters = {};
  for (var _ci = 0; _ci < state.components.length; _ci++) {
    var _c = state.components[_ci];
    var _def = COMP_DEFS[_c.type];
    if (!_def || !_def.label || _c.type === 'ground') continue;
    var _lbl = _def.label;
    labelCounters[_lbl] = (labelCounters[_lbl] || 0) + 1;
    _compDisplayNum[_c.id] = labelCounters[_lbl];
  }
}
// ── SPDT/Flasher effective-port helper ───────────────────────
// Returns info about which output ports of an spdt/flasher are connected.
// {out1Ok, out2Ok, singlePort: 1|2|null}
// singlePort != null means the component operates in degraded 2-port mode:
//   spdt  → acts as a simple switch: closed when state points to singlePort, open otherwise
//   flasher → oscillates on/off on singlePort only (no port switching)
function spdtPortStatus(c) {
  var out1Ok = state.connections.some(function(conn) {
    return (conn.from.compId === c.id && conn.from.portIdx === 1 && !conn.from.anchor) ||
           (conn.to.compId   === c.id && conn.to.portIdx   === 1 && !conn.to.anchor);
  });
  var out2Ok = state.connections.some(function(conn) {
    return (conn.from.compId === c.id && conn.from.portIdx === 2 && !conn.from.anchor) ||
           (conn.to.compId   === c.id && conn.to.portIdx   === 2 && !conn.to.anchor);
  });
  var singlePort = null;
  if (out1Ok && !out2Ok) singlePort = 1;
  if (out2Ok && !out1Ok) singlePort = 2;
  return { out1Ok: out1Ok, out2Ok: out2Ok, singlePort: singlePort };
}
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
function hitJunction(wx, wy, tol) {
tol = tol != null ? tol : 8;
for (var i = state.junctions.length - 1; i >= 0; i--) {
var j = state.junctions[i];
if (Math.abs(j.x - wx) < tol && Math.abs(j.y - wy) < tol) return j;
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
//
/**
 * Шукає найближчий дріт до вузла (junc), прив'язує вузол до дроту
 * і розрізає дріт у цій точці.
 */
function trySnapJunctionToWire(junc) {
    var TOL = 22;
    var found = false, connIdx = -1, bestDist = Infinity, bestProj = null;

    // 1. Знаходимо найближчий сегмент дроту
    for (var ci = 0; ci < state.connections.length; ci++) {
        var conn = state.connections[ci];
        var cpts = connectionPoints(conn);
        if (!cpts) continue;

        for (var si = 0; si < cpts.length - 1; si++) {
            var a = cpts[si], b = cpts[si+1];
            
            var dist = 0, proj = null;
            
            // Перевірка вертикального сегмента
            if (Math.abs(a.x - b.x) < 3) { 
                if (Math.abs(junc.x - a.x) <= TOL && 
                    junc.y >= Math.min(a.y,b.y)-TOL && 
                    junc.y <= Math.max(a.y,b.y)+TOL) {
                     dist = Math.abs(junc.x - a.x);
                     proj = { x: a.x, y: junc.y };
                }
            } 
            // Перевірка горизонтального сегмента
            else if (Math.abs(a.y - b.y) < 3) { 
                if (Math.abs(junc.y - a.y) <= TOL && 
                    junc.x >= Math.min(a.x,b.x)-TOL && 
                    junc.x <= Math.max(a.x,b.x)+TOL) {
                     dist = Math.abs(junc.y - a.y);
                     proj = { x: junc.x, y: a.y };
                }
            }

            if (proj && dist < bestDist) {
                bestDist = dist;
                connIdx = ci;
                found = true;
                bestProj = proj;
            }
        }
    }

    if (!found) return false;

    // 2. Прив'язка до сітки
    var snappedX = Math.round(bestProj.x / 10) * 10;
    var snappedY = Math.round(bestProj.y / 10) * 10;
    
    // 3. Розрізаємо дріт (tapIntoConnection створить новий правильний вузол)
    var conn = state.connections[connIdx];
    var tap = tapIntoConnection(conn, { x: snappedX, y: snappedY }, bestProj);
    
    if (tap) {
        // Видаляємо старий "падаючий" вузол, оскільки tapIntoConnection створив новий
        state.junctions = state.junctions.filter(function(j) { return j.id !== junc.id; });
        if (selectedId === junc.id) selectedId = tap.junc.id;
        return true;
    }
    return false;
}
// Split a wire when a junction is dropped onto it.
// Snaps junction to the nearest segment, splits the wire into two halves,
// both ending at an anchor at the junction coords.
function trySnapComponentToWire(comp) {
	console.log("trySnapComponentToWire")
    var def = COMP_DEFS[comp.type];
    if (!def || def.ports.length !== 2 || comp.type === 'junction') return false;

    var TOL = 22;
    var PORT_TOL = 16;

    var found = false, connIdx = -1, segIdx = -1, segA, segB, pts;

    // 1. Знаходимо сегмент
    for (var ci = 0; ci < state.connections.length; ci++) {
        var conn = state.connections[ci];
        var cpts = connectionPoints(conn);
        if (!cpts) continue;

        for (var si = 0; si < cpts.length - 1; si++) {
            var a = cpts[si], b = cpts[si+1];
            var cx = comp.x, cy = comp.y;

            if (Math.abs(a.x - b.x) < 3) { // вертикальний дріт
                if (Math.abs(cx - a.x) <= TOL && cy >= Math.min(a.y,b.y)-TOL && cy <= Math.max(a.y,b.y)+TOL) {
                    comp.x = Math.round(a.x / 10) * 10;
                    connIdx = ci; segIdx = si; segA = a; segB = b; pts = cpts;
                    found = true; break;
                }
            } else if (Math.abs(a.y - b.y) < 3) { // горизонтальний дріт
                if (Math.abs(cy - a.y) <= TOL && cx >= Math.min(a.x,b.x)-TOL && cx <= Math.max(a.x,b.x)+TOL) {
                    comp.y = Math.round(a.y / 10) * 10;
                    connIdx = ci; segIdx = si; segA = a; segB = b; pts = cpts;
                    found = true; break;
                }
            }
        }
        if (found) break;
    }

    if (!found) return false;

    // 2. Прив'язка
    if (Math.abs(segA.x - segB.x) < 3) comp.x = segA.x;
    else comp.y = segA.y;

    var origConn = state.connections[connIdx];

    // 3. Waypoints
    var wpsFirst = [], wpsSecond = [];
    (origConn.waypoints || []).forEach(wp => {
        var wpIdx = -1;
        for (var pi = 1; pi < pts.length - 1; pi++) {
            if (Math.abs(pts[pi].x - wp.x) < 6 && Math.abs(pts[pi].y - wp.y) < 6) {
                wpIdx = pi; break;
            }
        }
        if (wpIdx === -1) {
            var d1 = Math.hypot(wp.x - pts[segIdx].x, wp.y - pts[segIdx].y);
            var d2 = Math.hypot(wp.x - pts[segIdx+1].x, wp.y - pts[segIdx+1].y);
            (d1 <= d2 ? wpsFirst : wpsSecond).push(wp);
        } else if (wpIdx <= segIdx) wpsFirst.push(wp);
        else wpsSecond.push(wp);
    });

    // === 4. ПОРТИ З ПОВОРОТОМ ===
    var portWorldPos = def.ports.map((p, idx) => {
        var rp = rotatePoint(p.x, p.y, comp.rot || 0);
        return {
            idx: idx,
            wx: comp.x + rp.x,
            wy: comp.y + rp.y
        };
    });

    var isVerticalWire = Math.abs(segA.x - segB.x) < 3;

    console.log('Snap debug:', { 
        compRot: comp.rot, 
        isVerticalWire, 
        ports: portWorldPos,
        wireStart: segA,
        wireEnd: segB 
    });

    // Фільтруємо порти, близькі до лінії дроту
    var alignedPorts = portWorldPos.filter(pp => {
        if (isVerticalWire) return Math.abs(pp.wx - segA.x) < PORT_TOL;
        else return Math.abs(pp.wy - segA.y) < PORT_TOL;
    });

    if (alignedPorts.length < 2) alignedPorts = portWorldPos;

    // Сортуємо вздовж дроту
    alignedPorts.sort((a, b) => isVerticalWire ? (a.wy - b.wy) : (a.wx - b.wx));

    var nearPort = alignedPorts[0];
    var farPort  = alignedPorts[alignedPorts.length - 1];

    // 5. Розрізання
    state.connections.splice(connIdx, 1);

    state.connections.push({
        id: state.nextId++,
        from: origConn.from,
        to: { compId: comp.id, portIdx: nearPort.idx },
        waypoints: wpsFirst
    });

    state.connections.push({
        id: state.nextId++,
        from: { compId: comp.id, portIdx: farPort.idx },
        to: origConn.to,
        waypoints: wpsSecond
    });

    console.log('Switch snapped successfully! Ports:', nearPort.idx, '→', farPort.idx);
    return true;
}
/**
 * Розрізає існуючий дріт у точці p, вставляючи вузол (junction).
 * Усі три дроти (від початку, до кінця, новий "відвід") підключаються
 * до єдиної точки вузла через anchor: {x, y}.
 * Повертає { junc: {id, x, y} } для подальшого приєднання нового дроту.
 * 
 * @param {Object} conn - оригінальний об'єкт з'єднання (connection)
 * @param {Object} p - точка кліку/скидання у світових координатах {x, y}
 * @param {Object} approach - точка підходу (остання точка дроту або порт)
 * @returns {Object|null} - { junc: {id, x, y} } або null, якщо не вдалося
 */
function tapIntoConnection(conn, p, approach) {
  // Отримуємо всі точки дроту: початок → waypoints → кінець
  // Для вертикальних/горизонтальних сегментів додає проміжні кутові точки
  var pts = connectionPoints(conn);
  if (!pts) return null; // якщо дрот не має коректних точок — вихід

  // Змінні для пошуку найближчого сегмента до точки p
  var bestIdx = -1, bestDist = Infinity, bestProj = null;

  // Перебираємо всі сегменти дроту (між сусідніми точками)
  for (var j = 0; j < pts.length - 1; j++) {
    var a = pts[j], b = pts[j+1];
    
    // 🔹 Вертикальний сегмент (x однаковий)
    if (a.x === b.x) {
      // Проекція точки p на відрізок по осі Y (обмежуємо межами сегмента)
      var py = Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), p.y));
      // Відстань — горизонтальне відхилення від сегмента
      var d = Math.abs(p.x - a.x);
      // Оновлюємо найкращий варіант, якщо відстань менша
      if (d < bestDist) { bestDist = d; bestIdx = j; bestProj = {x:a.x, y:py}; }
    } 
    // 🔹 Горизонтальний сегмент (y однаковий)
    else if (a.y === b.y) {
      // Проекція по осі X
      var px = Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), p.x));
      // Відстань — вертикальне відхилення
      var d2 = Math.abs(p.y - a.y);
      if (d2 < bestDist) { bestDist = d2; bestIdx = j; bestProj = {x:px, y:a.y}; }
    }
  }

  // Якщо жоден сегмент не знайдено — вихід
  if (bestIdx < 0) return null;

  // 🔹 Прив'язка координат вузла до сітки 10×10 пікселів
  var jx = Math.round(bestProj.x/10)*10, jy = Math.round(bestProj.y/10)*10;

  // 🔹 Створення нового вузла (junction) — це ТОПОЛОГІЧНА точка, не компонент!
  // Вузли зберігаються в окремому масиві state.junctions
  var junc = { id: state.nextId++, x: jx, y: jy };
  state.junctions.push(junc);

  // 🔹 Розподіл waypoints між двома новими дротами
  var wpsFirst = [], wpsSecond = [];
  (conn.waypoints || []).forEach(function(wp) {
    var wpIdx = -1;
    // Шукаємо індекс точки wp у масиві pts (з допуском 2.0 пікселя замість 0.5)
    for (var pi = 1; pi < pts.length - 1; pi++) {
      if (Math.abs(pts[pi].x - wp.x) < 2 && Math.abs(pts[pi].y - wp.y) < 2) {
        wpIdx = pi; break;
      }
    }

    // ✅ FIX: Гарантоване збереження кожної точки повороту
    if (wpIdx === -1) {
      // Якщо точку не знайдено (через проміжні ортогональні точки або округлення),
      // призначаємо її до тієї половини, до якої вона геометрично ближче.
      var dStart = Math.hypot(wp.x - pts[bestIdx].x, wp.y - pts[bestIdx].y);
      var dEnd   = Math.hypot(wp.x - pts[bestIdx+1].x, wp.y - pts[bestIdx+1].y);
      if (dStart <= dEnd) wpsFirst.push(wp);
      else wpsSecond.push(wp);
    } else if (wpIdx <= bestIdx) {
      wpsFirst.push(wp); // Точки до місця врізання
    } else {
      wpsSecond.push(wp); // Точки після місця врізання
    }
  });

  // 🔹 Видалення оригінального дроту з масиву з'єднань
  var origIdx = state.connections.indexOf(conn);
  if (origIdx >= 0) state.connections.splice(origIdx, 1);

  // 🔹 Створення ДВОХ нових дротів:
  
  // Дріт 1: від початкового компонента → до вузла (через anchor)
  state.connections.push({
    id: state.nextId++,
    from: conn.from,                          // початок залишається як compId:portIdx
    to:   { anchor: { x: jx, y: jy } },      // кінець — anchor на координатах вузла
    waypoints: wpsFirst                       // waypoints до точки розрізу
  });

  // Дріт 2: від вузла → до кінцевого компонента (через anchor)
  state.connections.push({
    id: state.nextId++,
    from: { anchor: { x: jx, y: jy } },      // початок — anchor на координатах вузла
    to:   conn.to,                            // кінець залишається як compId:portIdx
    waypoints: wpsSecond                      // waypoints після точки розрізу
  });

  // 🔹 Повертаємо об'єкт вузла, щоб викликаючий код міг приєднати до нього новий дріт
  return { junc: junc };
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
if (c.type === 'ground') continue;
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
        // 🔑 ВИПРАВЛЕННЯ: для вертикально розташованих портів 
        // краще спочатку рухатись по Y, потім по X
        var midY = snapG((p1.y + p2.y) / 2);
        if (dirA.dy > 0 && midY < p1.y) midY = p1.y + 20;
        if (dirA.dy < 0 && midY > p1.y) midY = p1.y - 20;
        if (dirB.dy > 0 && midY < p2.y) midY = p2.y + 20;
        if (dirB.dy < 0 && midY > p2.y) midY = p2.y - 20;
        // Спочатку вниз/вгору, потім вбік
        return [{ x: p1.x, y: midY }, { x: p2.x, y: midY }];
    }
    
    if (!hA && !hB) {
        if (p1.x === p2.x) return [];
        var midX = snapG((p1.x + p2.x) / 2);
        if (dirA.dx > 0 && midX < p1.x) midX = p1.x + 20;
        if (dirA.dx < 0 && midX > p1.x) midX = p1.x - 20;
        if (dirB.dx > 0 && midX < p2.x) midX = p2.x + 20;
        if (dirB.dx < 0 && midX > p2.x) midX = p2.x - 20;
        // Спочатку вбік, потім вниз/вгору
        return [{ x: midX, y: p1.y }, { x: midX, y: p2.y }];
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
function autoRouteWire(fromComp, fromPort, toComp, toPort, existingWaypoints) {	
    // Якщо є ручні waypoints (користувач їх встановив), не перезаписуємо їх
    if (existingWaypoints && existingWaypoints.length > 0) {
        // Перевіряємо чи це дійсно ручні точки (не згенеровані автоматично)
        var hasManual = false;
        for (var i = 0; i < existingWaypoints.length; i++) {
            if (existingWaypoints[i]._manual) {
                hasManual = true;
                break;
            }
        }
        if (hasManual) {
            // Повертаємо існуючі waypoints без змін
            return existingWaypoints.filter(function(wp) {
                return !wp._temp; // видаляємо тільки тимчасові точки
            });
        }
    }
    
    var a = portWorld(fromComp, fromPort);
    var b = portWorld(toComp, toPort);
    var dirA = portDirection(fromComp, fromPort);
    var dirB = portDirection(toComp, toPort);
    var STUB = 20;
    var p1 = { x: snapG(a.x + dirA.dx * STUB), y: snapG(a.y + dirA.dy * STUB) };
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
//  Palette icons (schematic mini-drawings) 
function drawPaletteIcons() {
    var items = palette.querySelectorAll('.palette-item');
    items.forEach(function(it) {
        var type = it.getAttribute('data-type');
        var cv = it.querySelector('canvas.palette-icon');
        if (!cv) return;
        var g = cv.getContext('2d');
        var w = cv.width,
            h = cv.height;
        g.clearRect(0, 0, w, h);
        g.save();
        g.translate(w / 2, h / 2);
        g.strokeStyle = '#ffa000';
        g.fillStyle = '#ffa000';
        g.lineWidth = 1.5;
        drawComponentShape(g, type, 0.45);
        g.restore();
    });
}
// Component drawing
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
    g.fillText('+', -20*s, -7*s);
    g.fillText('−', 17*s,  -7*s);
    break;
  }
  case 'vsource': {
    // Leads
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-18*s, 0);
    g.moveTo( w/2, 0); g.lineTo(  18*s, 0);
    g.stroke();
    // Circle body
    var vr = 18*s;
    g.beginPath();
    g.arc(0, 0, vr, 0, Math.PI*2);
    g.stroke();
    // + and - signs
    g.font = 'bold '+(9*s).toFixed(0)+'px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('+', -10*s, 0);
    g.fillText('−',  10*s, 0);
    // Arrow (diagonal inside circle — регульований символ)
    g.lineWidth = Math.max(1, 1.5*s);
    g.beginPath();
    g.moveTo(-10*s,  12*s);
    g.lineTo( 10*s-2, -12*s+2);
    g.stroke();
    g.lineWidth = Math.max(1, 2*s);
    // Arrowhead
    var ax = 10*s, ay = -12*s-0.5, adx = 20*s, ady = -24*s;
    var al = Math.sqrt(adx*adx+ady*ady), nx = adx/al, ny = ady/al;
    var px2 = -ny, py2 = nx, asz = 4*s;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ax - nx*asz + px2*asz*0.5, ay - ny*asz + py2*asz*0.5);
    g.lineTo(ax - nx*asz - px2*asz*0.5, ay - ny*asz - py2*asz*0.5);
    g.closePath();
    g.fill();
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
  case 'fuse': {
    var fw = 20*s, fh = 9*s;
    // Lead wires
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-fw, 0);
    g.moveTo( w/2, 0); g.lineTo(  fw, 0);
    g.stroke();
    // Outer body (same as resistor)
    g.beginPath();
    g.rect(-fw, -fh, fw*2, fh*2);
    g.stroke();
    // Inner wire filament
    var blown = opts.blown || false;
    var blinkOn = opts.blinkOn !== false; // for blink animation
    g.save();
    if (blown) {
      // Broken filament — draw two halves with a gap in the middle
      if (blinkOn) {
        g.strokeStyle = 'rgba(255,80,40,1)';
        g.shadowColor = '#ff5522';
        g.shadowBlur = 8 * s;
      } else {
        g.strokeStyle = 'rgba(180,60,30,0.6)';
        g.shadowBlur = 0;
      }
      g.lineWidth = Math.max(0.5, 0.8 * s);
      // Left half
      g.beginPath();
      g.moveTo(-fw + s, 0);
      g.lineTo(-4*s, 0);
      g.stroke();
      // Right half
      g.beginPath();
      g.moveTo(4*s, 0);
      g.lineTo(fw - s, 0);
      g.stroke();
      // Break marks (short angled lines at break points)
      g.beginPath();
      g.moveTo(-4*s, 0); g.lineTo(-3*s, 3*s);
      g.moveTo( 3*s, -3*s); g.lineTo( 4*s, 0);
      g.stroke();
    } else {
      // Intact filament
      g.lineWidth = Math.max(0.5, 0.8 * s);
      g.beginPath();
      g.moveTo(-fw + s, 0);
      g.lineTo( fw - s, 0);
      g.stroke();
    }
    g.restore();
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
    var lr = 14 * s;
    var baseColor = opts.color || 'yellow';
    var colorMap = {
        'yellow': { r: 255, g: 230, b: 80  },
        'white':  { r: 255, g: 255, b: 255 },
        'red':    { r: 255, g: 70,  b: 70  },
        'green':  { r: 80,  g: 255, b: 110 },
        'blue':   { r: 70,  g: 150, b: 255 }
    };
    var rgb = colorMap[baseColor] || colorMap['yellow'];
    var cr = rgb.r, cg = rgb.g, cb = rgb.b;

    if (glow > 0) {
        var rg = g.createRadialGradient(0, 0, lr * 0.5, 0, 0, lr * 2.4);
        rg.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.55 + 0.45 * glow) + ')');
        rg.addColorStop(0.4, 'rgba(' + Math.max(0,cr-30) + ',' + Math.max(0,cg-30) + ',' + Math.max(0,cb-30) + ',' + (0.3 + 0.4 * glow) + ')');
        rg.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        g.save();
        g.fillStyle = rg;
        g.beginPath();
        g.arc(0, 0, lr * 2.4, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }
    var lampColor = glow > 0
        ? 'rgba(' + cr + ',' + cg + ',' + cb + ',1)'
        : g.strokeStyle;
    g.save();
    g.strokeStyle = lampColor;
    g.lineWidth = Math.max(1.5, 2 * s);
    g.beginPath();
    g.arc(0, 0, lr, 0, Math.PI * 2);
    g.stroke();
    var xi = lr * 0.68;
    g.beginPath();
    g.moveTo(-xi, -xi); g.lineTo(xi, xi);
    g.moveTo( xi, -xi); g.lineTo(-xi, xi);
    g.stroke();
    g.restore();
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-lr, 0);
    g.moveTo( w/2, 0); g.lineTo( lr, 0);
    g.stroke();
    break;
}
case 'led': {
  var ledColor = opts.color || 'green';
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

  var R    = 15*s;
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

  // Анімація звуку
  if (bzActive) {

    // Час для анімації
    var t = performance.now() * 0.005;

    g.save();
    g.lineWidth = Math.max(1, 1.2*s);
    // Три хвилі
    [0, 1, 2].forEach(function(i) {
      // Фаза хвилі
      var phase = (t + i * 0.45) % 1;
      // Радіус розширення
      var r = (R * 0.15) + phase * (R * 0.5);
      // Прозорість згасає
      g.globalAlpha = 1 - phase;

      g.beginPath();
      g.arc(0, -13, r, Math.PI + 0.4, -0.4, false);
      g.stroke();
    });

    g.restore();
  }

  g.restore();
  break;
}
case 'heater': {
  var hw = 26 * s, hh = 10 * s;
  var glowVal = opts.glow || 0;

  // 1. Малюємо підведення
  g.beginPath();
  g.moveTo(-w/2, 0); g.lineTo(-hw, 0);
  g.moveTo( w/2, 0); g.lineTo(  hw, 0);
  g.stroke();

  // 2. Кольори залежно від струму (glowVal від 0 до 1)
  // Прямокутник: від стандартного до темно-оранжевого
  var rectColor = glowVal > 0 
    ? 'rgba(210, ' + Math.round(60 + 30 * (1 - glowVal)) + ', 0, ' + (0.4 + 0.6 * glowVal) + ')' 
    : g.strokeStyle;
  
  // Зигзаг: від стандартного до яскраво-червоного/білого
  var coilColor = glowVal > 0 
    ? 'rgba(255, ' + Math.round(120 * (1 - glowVal)) + ', 0, 1)' 
    : g.strokeStyle;

  // 3. Малюємо корпус (прямокутник)
  g.save();
  g.strokeStyle = rectColor;
  if (glowVal > 0) {
    g.shadowColor = 'rgba(255, 60, 0, ' + (glowVal * 0.5) + ')';
    g.shadowBlur = glowVal * 12 * s;
  }
  g.beginPath();
  g.rect(-hw, -hh, hw * 2, hh * 2);
  g.stroke();
  g.restore();

  // 4. Малюємо нагрівальний елемент (зигзаг)
  g.save();
  g.strokeStyle = coilColor;
  g.lineWidth = Math.max(1, 1.8 * s);
  if (glowVal > 0) {
    g.shadowColor = 'rgba(255, 40, 0, ' + glowVal + ')';
    g.shadowBlur = glowVal * 10 * s;
  }
  g.beginPath();
  var segments = 6, segW = (hw * 2 - 6 * s) / segments;
  var cx0 = -hw + 3 * s;
  for (var i = 0; i <= segments; i++) {
    var cx = cx0 + i * segW;
    var cy = (i % 2 === 0) ? -5 * s : 5 * s;
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
case 'spdt': {
  g.beginPath(); g.moveTo(-w/2, 0); g.lineTo(-16*s, 0); g.stroke();
  g.beginPath(); g.arc(-16*s, 0, 2.5*s, 0, Math.PI*2); g.fill();
  g.beginPath(); g.moveTo(w/2, -10*s); g.lineTo(12*s, -10*s); g.stroke();
  g.beginPath(); g.arc(12*s, -10*s, 2.5*s, 0, Math.PI*2); g.fill();
  g.beginPath(); g.moveTo(w/2, 10*s); g.lineTo(12*s, 10*s); g.stroke();
  g.beginPath(); g.arc(12*s, 10*s, 2.5*s, 0, Math.PI*2); g.fill();
  g.beginPath(); g.moveTo(-16*s, 0);
  if (opts.state === 0) g.lineTo(12*s, -10*s);
  else g.lineTo(12*s, 10*s);
  g.stroke();
  break;
}  
  case 'pushbutton': {
    var pbNO = (opts.normallyOpen !== false);
    var pbContactsClosed = opts.closed;
    // Зовнішні дроти
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-14*s, 0);
    g.moveTo( w/2, 0); g.lineTo(  14*s, 0);
    g.stroke();
    // Контактні точки
    g.beginPath();
    g.arc(-14*s, 0, 2.5*s, 0, Math.PI*2); g.fill();
    g.beginPath();
    g.arc( 14*s, 0, 2.5*s, 0, Math.PI*2); g.fill();
    // Контактна перемичка
    g.beginPath();
    if (pbContactsClosed) {
      g.moveTo(-14*s, 0); g.lineTo(14*s, 0);          // замкнено — рівна
    } else if (pbNO) {
      g.moveTo(-14*s, 0); g.lineTo(14*s, -7*s);        // НР розімкнено — вгору
    } else {
      g.moveTo(-14*s, 0); g.lineTo(14*s, 7*s);         // НЗ розімкнено — вниз
    }
    g.stroke();
    // Штовхач — завжди "шапка" зверху (-y)
    // НР: спокій=піднятий (platY=-13), натиск=опущений (platY=-9)
    // НЗ: спокій=опущений (platY=-9, шток довгий — торкається контакту), натиск=піднятий (platY=-13)
var pressed = pbContactsClosed === pbNO; // true коли кнопка фізично натиснута
var platY   = pressed ? -9*s : -13*s;

var rodBotY;

if (pbContactsClosed) {
  // коли контакти замкнені — торкаємось горизонтального контакту
  rodBotY = 0;
} else {
  // коли розімкнені
  rodBotY = pbNO ? -4*s : 4*s;
}
    g.beginPath();
    // Шток (два паралельних стержні)
    g.moveTo( 2, rodBotY); g.lineTo( 2, platY+1);
    g.moveTo(-2, rodBotY); g.lineTo(-2, platY+1);
    // Платформа ("шапка")
    g.moveTo(-6*s, platY); g.lineTo(6*s, platY);
    // Бічні "вушка" платформи
    g.moveTo(-5*s, platY); g.lineTo(-5*s, platY + 3*s);
    g.moveTo( 5*s, platY); g.lineTo( 5*s, platY + 3*s);
    g.stroke();
    break;
  }
case 'flasher': {
    var flState = opts.state || 0; // 0=порт A, 1=порт B
    // Зовнішній дріт: спільний вхід (лівий порт c)
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-16 * s, 0);
    g.stroke();
    // Зовнішні дроти: вихід A (правий верхній) і B (правий нижній)
    g.beginPath();
    g.moveTo(w/2, -10 * s); g.lineTo(12 * s, -10 * s);
    g.stroke();
    g.beginPath();
    g.moveTo(w/2, 10 * s); g.lineTo(12 * s, 10 * s);
    g.stroke();
    // Корпус реле (прямокутник)
    g.beginPath();
    g.rect(-20 * s, -20 * s, 40 * s, 40 * s);
    g.stroke();
    // Точки контактів
    g.beginPath(); g.arc(-16 * s, 0, 2.5 * s, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(12 * s, -10 * s, 2.5 * s, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(12 * s,  10 * s, 2.5 * s, 0, Math.PI * 2); g.fill();
    // Контактний важіль (перемикається між A і B)
    g.beginPath();
    g.moveTo(-16 * s, 0);
    if (flState === 0) g.lineTo(12 * s, -10 * s); // -> A
    else               g.lineTo(12 * s,  10 * s); // -> B
    g.stroke();
    break;
}

  case 'ammeter':
  case 'voltmeter': {
    g.beginPath();
    g.arc(0, 0, 18*s,  0, Math.PI*2);
    g.stroke();
    var reading = opts.reading;
    // Counter-rotate so text is always horizontal regardless of component rotation
    var counterRot = opts.counterRot || 0;
    g.save();
    if (counterRot) g.rotate(counterRot);
    if (reading != null) {
      var rVal, rUnit;
      if (typeof reading === 'object') { rVal = reading.val; rUnit = reading.unit; }
      else { rVal = String(reading); rUnit = (type === 'ammeter' ? 'A' : 'V'); }
      var valFont = rVal.length > 5 ? 7 : (rVal.length > 4 ? 8 : 9);
      g.font = 'bold '+(valFont*s).toFixed(0)+'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ff4000';
      if (isLightTheme()) { g.fillStyle = '#880000' }
      g.fillText(rVal, 0, -3*s);
      g.font = (7*s).toFixed(0)+'px sans-serif';
      g.fillStyle = g.strokeStyle;
      g.fillText(rUnit, 0, 7*s);
    } else {
      g.font = 'bold '+(13*s).toFixed(0)+'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(type === 'ammeter' ? 'А' : 'V', 0, 0);
    }
    g.restore();
    g.beginPath();
    g.moveTo(-w/2, 0); g.lineTo(-18*s, 0);
    g.moveTo( w/2, 0); g.lineTo( 18*s, 0);
    g.stroke();
     break;
  }
  case 'junction':{ break; } // junctions are now in state.junctions, drawn separately
}
}
// Theme-aware colors 
function isLightTheme() {
return document.body.classList.contains('light-theme');
}
function themeColors() {
if (isLightTheme()) {
return {
comp:       '#1a2040',
compHover:  '#3a4070',
compSel:    '#cca000',
label:      '#4a5580',
port:       '#1565c0',
wire:       '#1565c0',
wireHover:  '#1e88e5',
wireSel:    '#cca000',
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
// Rendering 
var drawScheduled = false;
function scheduleDraw() {
    if (drawScheduled) return;
    drawScheduled = true;
    requestAnimationFrame(function() {
        drawScheduled = false;
        draw();
    });
}
function drawGrid() {
    var step = 20;
    var leftW = toWX(0),
        rightW = toWX(cssW);
    var topW = toWY(0),
        botW = toWY(cssH);
    var x0 = Math.floor(leftW / step) * step;
    var y0 = Math.floor(topW / step) * step;
    ctx.strokeStyle = themeColors().grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = x0; x <= rightW; x += step) {
        ctx.moveTo(toSX(x) * DPR, 0);
        ctx.lineTo(toSX(x) * DPR, cssH * DPR);
    }
    for (var y = y0; y <= botW; y += step) {
        ctx.moveTo(0, toSY(y) * DPR);
        ctx.lineTo(cssW * DPR, toSY(y) * DPR);
    }
    ctx.stroke();
}
function drawComponent(c) {
    var def = COMP_DEFS[c.type];
    ctx.save();
    ctx.translate(toSX(c.x) * DPR, toSY(c.y) * DPR);
    ctx.scale(viewScale * DPR, viewScale * DPR);
    ctx.rotate(c.rot * Math.PI / 180);
    var isSel = c.id === selectedId;
    var isHover = c.id === hoverId;
    var isFault = faults && faults.compIds && faults.compIds[c.id];
    var isIsolated = !isFault && isolatedFaults && isolatedFaults.compIds && isolatedFaults.compIds[c.id];
    if (isFault) {
        var pulseC = faultPulse();
        ctx.strokeStyle = 'rgba(255,' + Math.round(40 + pulseC * 60) + ',' + Math.round(40 + pulseC * 40) + ',1)';
        ctx.shadowColor = '#ff3b3b';
        ctx.shadowBlur = (10 + pulseC * 14);
        ctx.lineWidth = (1 + pulseC * 1.2);
    } else if (isIsolated) {
        var pulseI = faultPulse();
        // Помаранчево-жовтий пульс — відмінний від червоного КЗ, але так само помітний
        ctx.strokeStyle = 'rgba(255,' + Math.round(130 + pulseI * 80) + ',' + Math.round(pulseI * 30) + ',1)';
        ctx.shadowColor = '#ff9800';
        ctx.shadowBlur = (10 + pulseI * 16);
        ctx.lineWidth = (1 + pulseI * 1.2);
    } else {
        ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? themeColors().compHover : themeColors().comp);
    }
    ctx.fillStyle = ctx.strokeStyle;
    var opts = {};
    if (c.type === 'led') {
        opts.color = c.props.color || 'green';
    } else if (c.type === 'lamp') {
        opts.color = c.props.color || 'yellow';
    }
    if (c.type === 'switch' || c.type === 'pushbutton') opts.closed = !!c.props.closed;
    if (c.type === 'pushbutton') opts.normallyOpen = (c.props.normallyOpen !== false);
    if (c.type === 'spdt' || c.type === 'flasher') opts.state = c.props.state || 0;
    if (c.type === 'fuse') {
        opts.blown = !!c.props.blown;
        opts.blinkOn = !opts.blown || (Math.floor(performance.now() / 250) % 2 === 0);
    }
    if (isRunning && sim) {
        var p = Math.abs(sim.compP[c.id] || 0);
        if (c.type === 'lamp' || c.type === 'led' || c.type === 'heater') {
            var iLamp = Math.abs(sim.compI[c.id] || 0);
            opts.glow = iLamp > 0.001 ? Math.max(0, Math.min(1, p / 2)) : 0;
        }
        if (c.type === 'led') {
            var dir = sim.compCurrentDir[c.id] || 0;
            var i = sim.compI[c.id] || 0;
            // ✅ FIX: LED світить тільки при прямому струмі > 0.5 мА
            if (dir > 0 && i > 0.0005) {
                opts.glow = Math.max(0, Math.min(1, p / 2));
            } else {
                opts.glow = 0; // Явно вимикаємо світіння
            }
        }
        if (c.type === 'fan' || c.type === 'buzzer') {
            var i = Math.abs(sim.compI[c.id] || 0);
            opts.rot = (performance.now() / 1000) * i * 40;
            if (c.type === 'buzzer') opts.buzzing = i > 0.0001;
        }
        if (c.type === 'ammeter') {
            opts.reading = autoMeter(Math.abs(sim.compI[c.id] || 0), 'А');
        }
        if (c.type === 'voltmeter') {
            opts.reading = autoMeter(Math.abs(sim.compV[c.id] || 0), 'В');
        }
    }
    if (c.type === 'ammeter' || c.type === 'voltmeter') {
        opts.counterRot = -(c.rot || 0) * Math.PI / 180;
    }
    drawComponentShape(ctx, c.type, 1, opts);
    if (def.label && c.type !== 'ground') {
        ctx.save(); // Зберігаємо трансформ компонента (з поточним поворотом)
        if (c.rot === 180) {
            ctx.rotate(-Math.PI); // Скасовуємо поворот 180° лише для тексту
        }
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = themeColors().label;
        var lbl = def.label + ((_compDisplayNum && _compDisplayNum[c.id] != null) ? _compDisplayNum[c.id] : (c.id ? c.id : ''));
        var paramLbl = '';
        if (c.type === 'battery' || c.type === 'vsource') paramLbl = formatV(c.props.V);
        else if (c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') paramLbl = formatR(c.props.R);
        else if (c.type === 'led') paramLbl = formatR(c.props.R);
        else if (c.type === 'fuse') {
            if (c.props.blown) {
                paramLbl = '❌' // ПЕРЕГОРІВ
                ctx.fillStyle = 'rgba(255,80,40,1)';
            } else {
                var imaxA = c.props.Imax || 1;
                var imaxDisp = imaxA >= 1 ? imaxA.toFixed(imaxA % 1 ? 1 : 0) + ' А' : (imaxA * 1000).toFixed(0) + ' мА';
                paramLbl = 'max ' + imaxDisp;
            }
        }
        if (paramLbl) lbl += ' · ' + paramLbl;
        ctx.fillText(lbl, 0, -def.h / 2 - 1);
        ctx.restore(); // Повертаємо контекст до стану компонента
    }
    ctx.restore(); // Завершуємо контекст компонента
    if (isSel) {
        var b = compBounds(c);
        ctx.save();
        ctx.strokeStyle = '#ffa000';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.strokeRect(toSX(b.x) * DPR - 3, toSY(b.y) * DPR - 3, b.w * viewScale * DPR + 6, b.h * viewScale * DPR + 6);
        ctx.restore();
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to screen coords — use toSX/toSY explicitly
    for (var i = 0; i < def.ports.length; i++) {
        var pw = portWorld(c, i);
        var pk = c.id + ':' + i;
        var isConnected = !!(_connectedPorts && _connectedPorts[pk]);
        var sx = toSX(pw.x) * DPR;
        var sy = toSY(pw.y) * DPR;
        ctx.beginPath();
        if (isConnected) {
            // Підключений порт — великий
            ctx.arc(sx, sy, 6 * DPR, 0, Math.PI * 2);
            ctx.fillStyle = isSel ? '#ffa000' : themeColors().wire;
            ctx.fill();
            // невеликий внутрішній кружок
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5 * DPR, 0, Math.PI * 2);
            ctx.fillStyle = isLightTheme() ? '#f0f4ff' : '#0d1120';
            ctx.fill();
        } else {
            // Вільний порт — малий
            ctx.arc(sx, sy, 3 * DPR, 0, Math.PI * 2);
            ctx.fillStyle = isSel ? '#ffa000' : '#ff9800';
            ctx.fill();
        }
    }
    ctx.restore();
}

function draw() {
if (!cssW) return;
ctx.save();
ctx.setTransform(1,0,0,1,0,0);
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawGrid();
// Build connected-port lookup for port rendering
_connectedPorts = {};
for (var cpi = 0; cpi < state.connections.length; cpi++) {
  var cp0 = state.connections[cpi];
  if (!cp0.from.anchor) _connectedPorts[cp0.from.compId + ':' + cp0.from.portIdx] = true;
  if (!cp0.to.anchor)   _connectedPorts[cp0.to.compId   + ':' + cp0.to.portIdx]   = true;
}
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
// Кеш оновлюється перед малюванням через buildCompDisplayNum()
buildCompDisplayNum();
for (var i = 0; i < state.components.length; i++) {
  drawComponent(state.components[i]);
}
// Draw junctions (topological merge-points, not components)
(function() {
  var tc = themeColors();
  var isRunningNow = isRunning || wasRunningBeforeFault;
  for (var ji = 0; ji < state.junctions.length; ji++) {
    var jj = state.junctions[ji];
    var sx = toSX(jj.x) * DPR, sy = toSY(jj.y) * DPR;
    var isSel = (selectedId === jj.id);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 5 * DPR, 0, Math.PI * 2);
    ctx.fillStyle = isSel ? tc.compSel : (isRunningNow ? '#4fc3f7' : tc.comp);
    ctx.fill();
    if (isSel) { ctx.strokeStyle = tc.compSel; ctx.lineWidth = 1.5 * DPR; ctx.stroke(); }
    ctx.restore();
  }
})();
if (pendingWire) drawPendingWire();
if (showNodeVoltages && sim && sim.netOf && sim.voltages) drawNodeVoltages();
if (annVisible) drawAnnotations();

if (hoverPort || (pendingWire && pendingWire.from && !pendingWire.from.anchor)) {
  ctx.save();
  ctx.beginPath();
  
  let portToHighlight = hoverPort;
  
  // Якщо йде прокладання дроту — підсвічуємо вихідний порт
  if (pendingWire && pendingWire.from && !pendingWire.from.anchor) {
    const fromComp = state.components.find(c => c.id === pendingWire.from.compId);
    if (fromComp) {
      const p = portWorld(fromComp, pendingWire.from.portIdx);
      portToHighlight = { x: p.x, y: p.y };
    }
  }  
  if (portToHighlight) {
    ctx.arc(toSX(portToHighlight.x)*DPR, toSY(portToHighlight.y)*DPR, 7*DPR, 0, Math.PI*2);
    ctx.strokeStyle = '#ffa000';
    ctx.lineWidth = 2.5 * DPR;
    ctx.shadowColor = '#ffa000';
    ctx.shadowBlur = 8 * DPR;
    ctx.stroke();
  }
  ctx.restore();
}
ctx.restore();
updateVsourceSliders();
}
var _hSegs = [];
var _connectedPorts = {};
function drawVerticalWithHumps(x, y1, y2, connId, skipInitialMove) {
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
var humpR = 8 * DPR;
var cy = toSY(y1) * DPR;
if (!skipInitialMove) ctx.moveTo(sx, cy);
for (var k = 0; k < crossings.length; k++) {
var cyHit = toSY(crossings[k]) * DPR+2;
var beforeY = cyHit - sgn * humpR;
var afterY = cyHit + sgn * humpR;
ctx.lineTo(sx, beforeY-8);
var startA = sgn > 0 ? -Math.PI/2 : Math.PI/2;
var endA   = sgn > 0 ?  Math.PI/2 : -Math.PI/2;
var ccw = sgn < 0;
ctx.arc(sx, cyHit, humpR, startA, endA, ccw);
ctx.moveTo(sx, afterY-2);
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
ctx.lineWidth = (isSel ? 3 : 2) * viewScale * DPR;
ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? themeColors().wireHover : themeColors().wire);
}
ctx.lineJoin = 'miter';
ctx.miterLimit = 10;
ctx.beginPath();
var _needMove = true;
for (var i = 0; i < pts.length - 1; i++) {
var a = pts[i], b = pts[i+1];
if (a.x === b.x && a.y !== b.y) {
// skipInitialMove when pen is already at (a.x,a.y) from a preceding horizontal segment
drawVerticalWithHumps(a.x, a.y, b.y, conn.id, !_needMove);
_needMove = false; // pen ends at (a.x, y2) — continue from there
} else {
if (_needMove) ctx.moveTo(toSX(a.x)*DPR, toSY(a.y)*DPR);
ctx.lineTo(toSX(b.x)*DPR, toSY(b.y)*DPR);
_needMove = false;
}
}
ctx.stroke();
// Draw dangling end markers — open circle where wire has no connected component
var dangColor = isFault ? ctx.strokeStyle : (isSel ? '#ffa000' : themeColors().wire);
if (conn.from.anchor) {
var af = conn.from.anchor;
var isHoverDangle = hoverDangle && hoverDangle.conn === conn && hoverDangle.end === 'from';
var isPendingTarget = pendingWire && !pendingWire._dangle;
ctx.save();
ctx.strokeStyle = (isHoverDangle || (isHoverDangle && isPendingTarget)) ? '#ffa000' : dangColor;
ctx.lineWidth = (isHoverDangle ? 3 : 2) * viewScale * DPR;
ctx.beginPath();
ctx.arc(toSX(af.x)*DPR, toSY(af.y)*DPR, (isHoverDangle ? 7 : 5)*DPR, 0, Math.PI*2);
ctx.stroke();
ctx.restore();
}
if (conn.to.anchor) {
var at2 = conn.to.anchor;
var isHoverDangle2 = hoverDangle && hoverDangle.conn === conn && hoverDangle.end === 'to';
ctx.save();
ctx.strokeStyle = isHoverDangle2 ? '#ffa000' : dangColor;
ctx.lineWidth = (isHoverDangle2 ? 3 : 2) * viewScale * DPR;
ctx.beginPath();
ctx.arc(toSX(at2.x)*DPR, toSY(at2.y)*DPR, (isHoverDangle2 ? 7 : 5)*DPR, 0, Math.PI*2);
ctx.stroke();
ctx.restore();
}
if (conn.waypoints && conn.waypoints.length) {
  var wpSize = 8 * DPR; // Розмір квадрата (фіксований на екрані)
  var halfSize = wpSize / 2;
  ctx.fillStyle = isSel ? '#ffa000' : themeColors().wire;
  conn.waypoints.forEach(function (wp) {
    var sx = toSX(wp.x) * DPR;
    var sy = toSY(wp.y) * DPR;
    ctx.fillRect(sx - halfSize, sy - halfSize, wpSize, wpSize);
  });
}
if (isRunning && sim) {

// Не показуємо анімацію на дротах вольтметра (майже нескінченний опір — реального струму немає)
var _skipFlow = false;
(function() {
  var ends = [conn.from, conn.to];
  for (var _ei = 0; _ei < ends.length; _ei++) {
    var _ep = ends[_ei];
    if (_ep.compId !== undefined) {
      var _ec = state.components.find(function(x){ return x.id === _ep.compId; });
      if (_ec && _ec.type === 'voltmeter') { _skipFlow = true; return; }
    }
  }
})();

var I = _skipFlow ? 0 : wireSignedCurrent(conn);
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
        ctx.fillStyle = isLightTheme() ? '#a26600' : '#ffa000';
        for (var d = phase; d < total; d += spacing) {
            var seg = 1;
            while (seg < segLens.length && segLens[seg] < d) seg++;
            if (seg >= segLens.length) break;
            var segLen = segLens[seg] - segLens[seg-1];
            var t = segLen > 0 ? (d - segLens[seg-1]) / segLen : 0;
            var px = pts[seg-1].x + (pts[seg].x - pts[seg-1].x) * t;
            var py = pts[seg-1].y + (pts[seg].y - pts[seg-1].y) * t;
            ctx.beginPath();
            ctx.arc(toSX(px)*DPR, toSY(py)*DPR, 2*viewScale*DPR, 0, Math.PI*2);
            ctx.fill();
        }
    }
}
}
ctx.restore();
}
// Annotation drawing 
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
var startPt;
if (pendingWire.from.anchor) {
  // Anchor-based start (from junction or dangling end)
  // Verify the anchor still exists as a valid junction; cancel if not
  var anchorValid = state.junctions.some(function(j) {
    return Math.abs(j.x - pendingWire.from.anchor.x) < 2 && Math.abs(j.y - pendingWire.from.anchor.y) < 2;
  });
  if (!anchorValid) {
    // The junction was deleted — cancel the pending wire silently
    pendingWire = null;
    return;
  }
  startPt = { x: pendingWire.from.anchor.x, y: pendingWire.from.anchor.y };
} else {
  var fc = state.components.find(function(x){return x.id===pendingWire.from.compId;});
  if (!fc) { pendingWire = null; return; }
  startPt = portWorld(fc, pendingWire.from.portIdx);
}
var pts = [startPt];
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
// Check junction hit first (junctions are in state.junctions, not components)
var jHit = hitJunction(p.x, p.y);
console.log("jHit = ",jHit)
if (jHit && !pendingWire) {
  selectedId = jHit.id;
  selectedConnId = null;
  hideCompPopover();
  drag = { kind: 'junction-pending', id: jHit.id, startX: p.x, startY: p.y, moved: false };
  canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
  renderProps();
  scheduleDraw();
  return;
}
var port = hitPort(p.x, p.y);
console.log("port = ",port)
if (!port) {
	console.log("port11 ")
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
	console.log("if port ")
      // Оригінальна логіка для інших портів (залишається без змін)
      if (!pendingWire) {
        pendingWire = { from: { compId: port.compId, portIdx: port.portIdx }, waypoints: [], cursor: {x:port.x,y:port.y} };
      } else {
        if (pendingWire._dangle) {
			console.log("Dangle")
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
    //Allow snapping wire end to a Junction
    var jHit = hitJunction(p.x, p.y);
    if (jHit) {
        saveUndo();
        state.connections.push({
            id: state.nextId++,
            from: pendingWire.from,
            to: { anchor: { x: jHit.x, y: jHit.y } },
            waypoints: pendingWire.waypoints
        });
        pendingWire = null;
        markDirty();
        scheduleDraw();
        return;
    }	
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
                to: { anchor: { x: tap.junc.x, y: tap.junc.y } },
                waypoints: pendingWire.waypoints
            });
            pendingWire = null;
            scheduleDraw();
            return;
        }
    }
    
    // Логіка створення вузла через Shift+Click або подвійний клік
    // Тепер вона виконується ТІЛЬКИ якщо ми вже малюємо дріт (pendingWire існує).
    // Це запобігає випадковому створенню вузлів при простому кліку на дріт.
    var connTap = hitConnection(p.x, p.y);
    if (connTap && (ev.shiftKey || ev.detail === 2) && selectedConnId !== connTap.id) {
        saveUndo();
        var tap2 = tapIntoConnection(connTap, p, p);
        if (tap2) {
            pendingWire = {
                from: { anchor: { x: tap2.junc.x, y: tap2.junc.y } },
                waypoints: [],
                cursor: { x: tap2.junc.x, y: tap2.junc.y }
            };
            selectedConnId = null;
            scheduleDraw();
            return;
        }
    }
}

// Якщо pendingWire немає, цей блок просто виділяє дріт або додає точку повороту (Alt/Shift)
if (pendingWire) {
    pendingWire.waypoints.push({x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10});
    scheduleDraw();
    return;
}

// --- Далі йде обробка кліку по дроту БЕЗ pendingWire ---
var conn = hitConnection(p.x, p.y);
console.log("conn=",conn)
if (conn) {
    // ❌ ВИДАЛЕНО: Блок, який створював вузол і починав новий дріт без pendingWire.
    // Раніше тут було:
    // if ((ev.shiftKey || ev.detail === 2) && selectedConnId !== conn.id) { ... }
    
    // Залишаємо тільки логіку виділення дроту та додавання точок повороту через Alt/Shift
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
console.log("hitComponent=",c)
if (c) {
      if ((isRunning || wasRunningBeforeFault) && (c.type === 'switch' || c.type === 'pushbutton' || c.type === 'spdt')) {
        if (c.type === 'switch') {
          saveUndo(); c.props.closed = !c.props.closed; markDirty();
          try { sfx.click(); } catch(e) {}
          if (wasRunningBeforeFault && !c.props.closed) {
            wasRunningBeforeFault = false; clearFaults(); isRunning = true;
            document.getElementById('btn-run').style.display = 'none';
            document.getElementById('btn-stop').style.display = 'block';
            animStart = 0;
            if (animRAF) { cancelAnimationFrame(animRAF); animRAF = 0; }
            animRAF = requestAnimationFrame(animLoop);
          }
        } else if (c.type === 'pushbutton') {
          var pbIsNO = (c.props.normallyOpen !== false);
          var pbPressedState = pbIsNO ? true : false; // NO: натиск = замкнено; NC: натиск = розімкнено
          if (c.props.closed !== pbPressedState) { c.props.closed = pbPressedState; markDirty(); try { sfx.click(); } catch(e) {} }
          drag = { kind: 'pushbutton-hold', id: c.id };
          canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
        } else if (c.type === 'spdt') {
          saveUndo();
          c.props.state = c.props.state === 0 ? 1 : 0;
          markDirty();
          try { sfx.click(); } catch(e) {}
          // Якщо симуляцію було зупинено через КЗ, спробуємо відновити її
          if (wasRunningBeforeFault) {
            wasRunningBeforeFault = false; clearFaults(); isRunning = true;
            document.getElementById('btn-run').style.display = 'none';
            document.getElementById('btn-stop').style.display = 'block';
            animStart = 0;
            if (animRAF) { cancelAnimationFrame(animRAF); animRAF = 0; }
            animRAF = requestAnimationFrame(animLoop);
          }
        }
        selectedId = c.id; renderProps(); scheduleDraw(); return;
      }
      selectedId = c.id; selectedConnId = null;
      drag = { kind:'move', id: c.id, dx: c.x - p.x, dy: c.y - p.y, moved: false };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      renderProps(); showCompPopover(c); scheduleDraw(); return;
}
var conn = hitConnection(p.x, p.y);
console.log("hitComponent2=",c)
if (conn) {
  if ((ev.shiftKey || ev.detail === 2) && selectedConnId !== conn.id) {
    saveUndo();
    var tap2 = tapIntoConnection(conn, p, p);
    if (tap2) {
      pendingWire = {
        from: { anchor: { x: tap2.junc.x, y: tap2.junc.y } },
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
  console.log("tap")	
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
  
  // 1. Обробка проводки дроту
  if (pendingWire) {
    var sp = hitPort(p.x, p.y);
    pendingWire.cursor = sp ? { x: sp.x, y: sp.y } : { x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10 };
    hoverPort = sp;
    scheduleDraw();
    return;
  }
  
  // 2. Оновлення hover-станів (коли НЕ тягнемо)
  var prevHover = hoverId, prevPort = hoverPort, prevConn = hoverConnId;
  if (!drag) {
    var port = hitPort(p.x, p.y);
    hoverPort = port;
    hoverDangle = port ? null : hitDanglingEnd(p.x, p.y);
    if (port) { hoverId = null; hoverConnId = null; canvas.style.cursor = 'pointer'; }
    else if (hoverDangle) { hoverId = null; hoverConnId = null; canvas.style.cursor = 'pointer'; }
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
  
  // 3. ⬅️ ГАРАНТ: якщо не тягнемо — виходимо (drag може бути null)
  if (!drag) return;
  
  // 4. ⬅️ Тепер БЕЗПЕЧНО перевіряти drag.kind:
  if (drag.kind === 'junction-pending') {
    var jc = state.junctions.find(function(j){return j.id===drag.id;});
    if (!jc) { drag = null; scheduleDraw(); return; }
    var ddx = p.x - drag.startX;
    var ddy = p.y - drag.startY;
    if (Math.abs(ddx) > 3 || Math.abs(ddy) > 3) {
      // Switch to junction-move mode
      drag.kind = 'junction-move';
      drag.dx = jc.x - p.x;
      drag.dy = jc.y - p.y;
      drag.moved = true;
      hideCompPopover();
      saveUndo();
    }
    scheduleDraw();
    return;
  }
  if (drag.kind === 'junction-move') {
    var jcm = state.junctions.find(function(j){return j.id===drag.id;});
    if (!jcm) { drag = null; return; }
    var nx = Math.round((p.x + drag.dx)/10)*10;
    var ny = Math.round((p.y + drag.dy)/10)*10;
    // Update all anchor endpoints that point to this junction
    state.connections.forEach(function(conn) {
      if (conn.from.anchor && Math.round(conn.from.anchor.x)===jcm.x && Math.round(conn.from.anchor.y)===jcm.y) {
        conn.from.anchor.x = nx; conn.from.anchor.y = ny;
      }
      if (conn.to.anchor && Math.round(conn.to.anchor.x)===jcm.x && Math.round(conn.to.anchor.y)===jcm.y) {
        conn.to.anchor.x = nx; conn.to.anchor.y = ny;
      }
    });
    jcm.x = nx; jcm.y = ny;
    scheduleDraw();
    return;
  }
  
  // 5. Решта обробників drag (оригінальний код)
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
    if (drag.kind === 'junction-pending' || drag.kind === 'junction-move') {
        // Перевіряємо, чи існує вузол досі (могли видалити через Delete під час drag або кліку)
        var jcUp = state.junctions.find(function(j){return j.id===drag.id;});
        
        if (!drag.moved && jcUp) {
            // Тільки якщо НЕ перетягували І вузол ще існує — починаємо малювати дріт
            pendingWire = {
                from: { anchor: { x: jcUp.x, y: jcUp.y } },
                waypoints: [],
                cursor: { x: jcUp.x, y: jcUp.y }
            };
        }
        
        drag = null;
        scheduleDraw();
        return;
    }
if (drag.kind === 'pushbutton-hold') {
var pb = state.components.find(function(x){ return x.id === drag.id; });
if (pb) {
var pbNO2 = (pb.props.normallyOpen !== false);
var pbRestState = pbNO2 ? false : true; // повернення у нормальний стан
if (pb.props.closed !== pbRestState) {
pb.props.closed = pbRestState;
markDirty();
try { sfx.click(); } catch(e) {}
renderProps();
scheduleDraw();
}
}

//
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

// В onPointerUp, коли drag.kind === 'move':
if (drag.kind === 'move' && drag.moved) {
    var cm = state.components.find(function(x){return x.id===drag.id;});
    if (cm) {
        // НЕ викликаємо trySnapComponentToWire при русі, тільки при drop
        // trySnapComponentToWire(cm); // закоментувати цю лінію
        
        // Замість цього просто оновлюємо позицію
        // waypoints залишаються незмінними
        markDirty();
        showCompPopover(cm);
    }
}

if (drag.kind === 'move' && drag.moved) {
    var cm = state.components.find(function(x){return x.id===drag.id;});
    if (cm) {
        var def = COMP_DEFS[cm.type];
        
        // === ВРІЗАННЯ В ДРІТ (для всіх 2-портових компонентів) ===
        if (def && def.ports && def.ports.length === 2 && cm.type !== 'junction') {
            console.log(`[Snap on drop] Trying for ${cm.type}, rot=${cm.rot}`);
            
            const snapped = trySnapComponentToWire(cm);
            
            if (snapped) {
                console.log(`[Snap on drop] SUCCESS for ${cm.type}`);
            }
        }

        markDirty();
        showCompPopover(cm);
        scheduleDraw();           // ← важливо
    }
}


}
drag = null;
//

}

canvas.addEventListener('pointerdown',   onPointerDown);
canvas.addEventListener('pointermove',   onPointerMove);
canvas.addEventListener('pointerup',     onPointerUp);
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
var wx = Math.round(toWX(sx)/10)*10, wy = Math.round(toWY(sy)/10)*10;
saveUndo();
if (type === 'junction') {
  var jd = { id: state.nextId++, x: wx, y: wy };
  state.junctions.push(jd);
  selectedId = jd.id;
  // Try snap to wire
  trySnapJunctionToWire(jd);
  markDirty(); renderProps(); scheduleDraw();
  paletteDragType = null;
  return;
}
var c = makeComponent(type, wx, wy);
state.components.push(c);
selectedId = c.id;
renderProps();
scheduleDraw();
paletteDragType = null;
});

// Pointer-based drag from palette — full-viewport ghost canvas follows cursor seamlessly
palette.addEventListener('pointerdown', function (ev) {
	console.log("pointerdown")
var item = ev.target.closest('.palette-item');
if (!item) return;
var type = item.getAttribute('data-type');
if (!COMP_DEFS[type]) return;
ev.preventDefault();

// Create a full-viewport transparent overlay so the ghost component follows
// the cursor everywhere — across sidebar and main canvas — without any gap.
var DPR2 = window.devicePixelRatio || 1;
var oc = document.createElement('canvas');
oc.width  = window.innerWidth  * DPR2;
oc.height = window.innerHeight * DPR2;
oc.style.cssText = 'position:fixed;left:0;top:0;'
  + 'width:'+window.innerWidth+'px;height:'+window.innerHeight+'px;'
  + 'pointer-events:none;z-index:9998;';
document.body.appendChild(oc);
var og = oc.getContext('2d');

// Ghost scale: match the visual size used on the main canvas at current zoom
var ghostScale =  viewScale * DPR2;

function drawOverlay(clientX, clientY) {
  og.clearRect(0, 0, oc.width, oc.height);
  og.save();
  og.translate(clientX * DPR2, clientY * DPR2);
  og.strokeStyle = '#ffa000';
  og.fillStyle   = '#ffa000';
  //og.globalAlpha = 0.75;
  drawComponentShape(og, type, ghostScale);
  og.restore();
}
drawOverlay(ev.clientX, ev.clientY);

// Pre-create the real component immediately so it's visible on the main
// canvas as soon as the cursor enters it — no jarring appearance delay.
saveUndo();
var canvasRect = canvas.getBoundingClientRect();
var initWX = Math.round(toWX(ev.clientX - canvasRect.left) / 10) * 10;
var initWY = Math.round(toWY(ev.clientY - canvasRect.top)  / 10) * 10;
var placedJunc = null;
var placedComp = null;
if (type === 'junction') {
  placedJunc = { id: state.nextId++, x: initWX, y: initWY };
  state.junctions.push(placedJunc);
  selectedId = placedJunc.id;
  drag = { kind: 'junction-move', id: placedJunc.id, dx: 0, dy: 0, moved: true };
} else {
  placedComp = makeComponent(type, initWX, initWY);
  state.components.push(placedComp);
  selectedId = placedComp.id;
  drag = { kind: 'move', id: placedComp.id, dx: 0, dy: 0, moved: true };
}
renderProps();
markDirty();

// Track whether cursor is currently over the main canvas
var overCanvas = false;

function onMove(e) {
  var r = canvas.getBoundingClientRect();
  var nowOverCanvas = e.clientX >= r.left && e.clientX <= r.right
                   && e.clientY >= r.top  && e.clientY <= r.bottom;

  // Update ghost position on the full-viewport overlay
  if (nowOverCanvas) {
    // Hide ghost when over canvas — the real component renders there
    og.clearRect(0, 0, oc.width, oc.height);
  } else {
    drawOverlay(e.clientX, e.clientY);
  }

  overCanvas = nowOverCanvas;

  var wx = Math.round(toWX(e.clientX - r.left) / 10) * 10;
  var wy = Math.round(toWY(e.clientY - r.top)  / 10) * 10;
  if (placedJunc) {
    // Move all anchor endpoints tied to this junction
    state.connections.forEach(function(conn) {
      if (conn.from.anchor && conn.from.anchor.x === placedJunc.x && conn.from.anchor.y === placedJunc.y) { conn.from.anchor.x = wx; conn.from.anchor.y = wy; }
      if (conn.to.anchor   && conn.to.anchor.x   === placedJunc.x && conn.to.anchor.y   === placedJunc.y) { conn.to.anchor.x   = wx; conn.to.anchor.y   = wy; }
    });
    placedJunc.x = wx; placedJunc.y = wy;
  } else if (placedComp) {
    placedComp.x = wx;
    placedComp.y = wy;
  }
  scheduleDraw();
}

function onUp(e) {
	console.log("onUp")
  cleanup();
  oc.remove();
  if (!placedComp) return;

  var r = canvas.getBoundingClientRect();
  var releasedOverCanvas = e.clientX >= r.left && e.clientX <= r.right
                        && e.clientY >= r.top  && e.clientY <= r.bottom;

  if (!releasedOverCanvas) {
    doUndo();
    drag = null;
    scheduleDraw();
    return;
  }

  if (placedJunc) {
	  console.log("placedJunc")
    trySnapJunctionToWire(placedJunc);
    markDirty();
    drag = null;
    scheduleDraw();
  } else if (placedComp) {
	  console.log("placedComp")
    trySnapComponentToWire(placedComp);
    var def2 = COMP_DEFS[placedComp.type];
    var TOL_SNAP = 14;
    for (var pi = 0; pi < def2.ports.length; pi++) {
      var pw2 = portWorld(placedComp, pi);
      state.connections.forEach(function(conn2) {
        if (conn2.from.anchor && Math.abs(conn2.from.anchor.x - pw2.x) < TOL_SNAP && Math.abs(conn2.from.anchor.y - pw2.y) < TOL_SNAP) conn2.from = { compId: placedComp.id, portIdx: pi };
        if (conn2.to.anchor   && Math.abs(conn2.to.anchor.x   - pw2.x) < TOL_SNAP && Math.abs(conn2.to.anchor.y   - pw2.y) < TOL_SNAP) conn2.to   = { compId: placedComp.id, portIdx: pi };
      });
    }
    markDirty();
    drag = null;
    showCompPopover(placedComp);
    scheduleDraw();
  }
}

function cleanup() {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup',   onUp);
  window.removeEventListener('pointercancel', onUp);
}

window.addEventListener('pointermove', onMove);
window.addEventListener('pointerup',   onUp);
window.addEventListener('pointercancel', onUp);

});
palette.addEventListener('click', function (ev) {
var item = ev.target.closest('.palette-item');
if (!item) return;
var type = item.getAttribute('data-type');
if (!COMP_DEFS[type]) return;
saveUndo();
var cx = Math.round(toWX(cssW/2)/10)*10, cy = Math.round(toWY(cssH/2)/10)*10;
if (type === 'junction') {
  var jc = { id: state.nextId++, x: cx, y: cy };
  state.junctions.push(jc);
  selectedId = jc.id;
  markDirty(); renderProps(); scheduleDraw();
  return;
}
var c = makeComponent(type, cx, cy);
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
var html = ' <div style="font-weight:600;color:var(--text);margin-bottom:6px;margin-left: 12px;">'+
(COMP_LABELS[c.type]||c.type)+' #'+getCompDisplayNum(c)+' </div>';
if (c.type === 'battery') {
html += propUnitSlider(c, 'V', 'Напруга', 'V');
} else if (c.type === 'vsource') {
html += propUnitSlider(c, 'V', 'Напруга', 'V');
html += propNumber(c, 'Vmin', 'Мін. напруга (В)');
html += propNumber(c, 'Vmax', 'Макс. напруга (В)');
} else if (c.type === 'resistor') {
html += propUnitSlider(c, 'R', 'Опір', 'R');
} else if (c.type === 'rheostat') {
html += propUnitSlider(c, 'R', 'Робочий опір', 'R');
html += propNumber(c, 'Rmax', 'Макс. опір (Ом)');
} else if (c.type === 'lamp') {
    html += propUnitSlider(c, 'R', 'Опір', 'R');
    var lampColors = [
        { name: 'yellow', hex: '#ffcc00' },
        { name: 'white',  hex: '#ffffff' },
        { name: 'red',    hex: '#ff3b30' },
        { name: 'green',  hex: '#00d26a' },
        { name: 'blue',   hex: '#007aff' }
    ];
    html += ' <label><span class="prop-val">Колір лампи</span><div class="led-color-picker">';
    lampColors.forEach(function(clr){
        html += ' <button class="lamp-color-btn ' + (c.props.color === clr.name ? 'active' : '') + '" data-lamp-color="' + clr.name + '" style="background:' + clr.hex + ';border: 1px solid #555555;"></button>';
    });
    html += '</div></label>';
} else if (c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') {
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
} else if (c.type === 'fuse') {
    html += '<label><span class="prop-val">Макс.струм</span> ' +
            '<input type="range" data-prop="Imax" min="0.5" max="10" step="0.1" value="'+c.props.Imax+'">' +
            ' <span data-val="Imax">'+c.props.Imax.toFixed(1)+'</span> А</label>';
} else if (c.type === 'switch' || c.type === 'pushbutton') {
if (c.type === 'pushbutton') {
var pbNOcur = (c.props.normallyOpen !== false);
html += '<label><span class="prop-val">Тип контактів</span>' +
'<select data-act="pb-contact-type" style="margin-left:6px;padding:2px 4px;">' +
'<option value="no"' + (pbNOcur ? ' selected' : '') + '>НР (нормально розімкнені)</option>' +
'<option value="nc"' + (!pbNOcur ? ' selected' : '') + '>НЗ (нормально замкнені)</option>' +
'</select></label>';
html += '<div><span class="prop-val">Стан: ' + (c.props.closed ? 'Замкнутий' : 'Розімкнено') + '</span>' +
'<button class="btn btn-ghost" data-act="pb-press" style="margin-top:4px;margin-left:6px;">▶ Натиснути кнопку</button></div>';
} else {
html += ' <div> <span class="prop-val" >Стан: '+(c.props.closed?'⁣⁣⁣.Замкнутий':'Розімкнено')+' </span >'+
' <button class="btn btn-ghost" data-act="toggle" style="margin-top:4px;margin-left: 20px;">↕ Змінити </button ></div> ';
}
} else if (c.type === 'spdt') {
  html += '<div><span class="prop-val">Положення: '+(c.props.state===0?'Вихід A':'Вихід B')+'</span>'+
          '<button class="btn btn-ghost" data-act="toggle-spdt" style="margin-top:4px;margin-left: 20px;">↕ Змінити</button></div>';
} else if (c.type === 'flasher') {
    var flCurState = c.props.state || 0;
    html += '<label><span class="prop-val">Початковий вихід</span>'+
            '<button class="btn btn-ghost" data-act="toggle-init" style="margin:4px 0;">'+ (flCurState === 0 ? 'Вихід A' : 'Вихід B') +'</button></label>';
    html += propNumber(c, 'tOn', 'Час на A (с)');
    html += propNumber(c, 'tOff', 'Час на B (с)');
}

html += ' <div class="cp-actions"> <button class="btn btn-ghost" data-act="rotate" >↻ Поворот на 90° </button > '+
' <button class="btn btn-ghost" data-act="delete" >🗑 Видалити </button > </div>';
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
    // Re-render props panel when vsource bounds change so V slider updates its range
    if (key === 'Vmin' || key === 'Vmax') { markDirty(); renderProps(); scheduleDraw(); return; }
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
propsBody.querySelectorAll('select[data-act="pb-contact-type"]').forEach(function(sel){
  sel.addEventListener('change', function(){
    saveUndo();
    var isNO = sel.value === 'no';
    c.props.normallyOpen = isNO;
    // Скидаємо стан до нормального
    c.props.closed = isNO ? false : true;
    markDirty(); renderProps(); scheduleDraw();
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
propsBody.querySelectorAll('.lamp-color-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
        saveUndo();
        c.props.color = btn.getAttribute('data-lamp-color');
        console.log("lamp color=",c.props.color)
        renderProps();
        scheduleDraw();
    });
});

propsBody.querySelectorAll('button[data-act]').forEach(function (b) {
  b.addEventListener('click', function () {
    var act = b.getAttribute('data-act');
    if (act === 'toggle') { saveUndo(); if (c.type === 'flasher') { c.props.state = (c.props.state || 0) === 0 ? 1 : 0; c.state._flInit = false; } else { c.props.closed = !c.props.closed; } try{sfx.click();}catch(e){} renderProps(); scheduleDraw(); }
    else if (act === 'pb-press') {
      // Симуляція натискання: замкнути НР, розімкнути НЗ, потім через 300мс відпустити
      var pbIsNO3 = (c.props.normallyOpen !== false);
      saveUndo();
      c.props.closed = pbIsNO3 ? true : false;
      try{sfx.click();}catch(e){}
      markDirty(); renderProps(); scheduleDraw();
      var pbId3 = c.id;
      setTimeout(function(){
        var pbComp = state.components.find(function(x){ return x.id === pbId3; });
        if (pbComp) {
          var no3 = (pbComp.props.normallyOpen !== false);
          pbComp.props.closed = no3 ? false : true;
          try{sfx.click();}catch(e){}
          markDirty(); renderProps(); scheduleDraw();
        }
      }, 300);
    }
    else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; scheduleDraw(); }
    else if (act === 'delete') { saveUndo(); deleteSelected(); }
    else if (act === 'toggle-spdt') { saveUndo(); c.props.state = c.props.state === 0 ? 1 : 0; renderProps(); scheduleDraw(); }
        else if (act === 'toggle-init') {
		saveUndo();
		c.props.state = (c.props.state || 0) === 0 ? 1 : 0;
		c.state._flInit = false; // скидаємо відлік часу
		renderProps(); scheduleDraw();
	}
    
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
// For vsource voltage slider use Vmin/Vmax bounds (converted to current unit)
var min, max;
if (c.type === 'vsource' && kind === 'V') {
  min = (c.props.Vmin != null ? c.props.Vmin : 0) / mul;
  max = (c.props.Vmax != null ? c.props.Vmax : 20) / mul;
  if (min < 0) min = 0;
  if (max <= min) max = min + 1;
} else {
  min = 1; max = 10000;
}
var step = stepForMul(mul);
var dispActual = (c.props[key] || 0) / mul;
var dispSlider = Math.round(dispActual / step) * step;
if (dispSlider < min) dispSlider = min;
if (dispSlider > max) dispSlider = max;
var opts = unitOptionsFor(kind);
var optsHtml = opts.map(function(o){
return ' <option value="'+o.mul+'"'+(o.mul===mul?' selected':'')+'>'+o.label+'</option>';
}).join('');
return ' <label >'+label+
' <span style="display:inline-flex;align-items:center;gap:4px;">'+
'  <span class="prop-val" data-val="'+key+'">'+formatDispVal(dispActual)+'</span>'+
' <select data-unit="'+key+'">'+optsHtml+'</select>'+
'</span>'+
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
var min, max;
if (c.type === 'vsource' && kind === 'V') {
  min = (c.props.Vmin != null ? c.props.Vmin : 0) / mul;
  max = (c.props.Vmax != null ? c.props.Vmax : 20) / mul;
  if (min < 0) min = 0;
  if (max <= min) max = min + 1;
} else {
  min = 1; max = 10000;
}
var step = stepForMul(mul);
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
var html = ' <div class="cp-head">'+(COMP_LABELS[c.type]||c.type)+' #'+getCompDisplayNum(c)+
' <button class="cp-close" type="button" title="Закрити">×</button > </div >';
if (c.type === 'battery') html += compEditField(c, 'V', 'Напруга', 'V');
else if (c.type === 'vsource') html += compEditField(c, 'V', 'Напруга', 'V');
else if (c.type === 'resistor' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater')
	html += compEditField(c, 'R', 'Опір', 'R');
else if (c.type === 'rheostat') {
	html += compEditField(c, 'R', 'Робочий опір', 'R');
	html += ' <div class="cp-label">Макс. опір (Ом) <input type="number" data-cp="Rmax" value="'+c.props.Rmax+'" step="any"> </div>';
} else if (c.type === 'led') {
	html += ' <div class="cp-label">Пряма напруга (В) <input type="number" data-cp="Vf" value="'+c.props.Vf+'" step="any"> </div>';
	html += compEditField(c, 'R', 'Послідовний опір', 'R');
} else if (c.type === 'spdt') {
	html += '<div class="cp-label">Положення: <strong>' + (c.props.state === 0 ? 'Вихід A' : 'Вихід B') + '</strong>' +
          '<button class="btn btn-ghost cp-act" data-act="toggle-spdt" type="button" style="margin-left:20px;">↕ Змінити</button></div>';
} else if (c.type === 'fuse') {
    html += '<div class="cp-label">Макс. струм: <span class="cp-val">'+c.props.Imax.toFixed(1)+' А</span><br>' +
            '<input type="range" data-cp-slider="Imax" min="0.5" max="10" step="0.1" value="'+c.props.Imax+'" style="width:100%;margin-top:4px;"></div>';
} else if (c.type === 'switch' || c.type === 'pushbutton' || c.type === 'flasher') {
	if (c.type === 'pushbutton') {
		var pbNOpop = (c.props.normallyOpen !== false);
		html += '<div class="cp-label">Тип контактів<br>' +
			'<select data-cp-act="pb-contact-type" style="margin-top:4px;padding:3px 6px;width:100%;">' +
			'<option value="no"' + (pbNOpop ? ' selected' : '') + '>НР (нормально розімкнені)</option>' +
			'<option value="nc"' + (!pbNOpop ? ' selected' : '') + '>НЗ (нормально замкнені)</option>' +
			'</select></div>';
		html += '<div class="cp-label">Стан: <strong><span style="display:inline-block;width:60px;">' +
			(c.props.closed ? 'Замкнено' : 'Розімкнено') + '</span></strong>' +
			'<button class="btn btn-ghost cp-act" data-act="pb-press" type="button" style="margin-left:6px;">▶ Натиснути</button></div>';
	} else if (c.type === 'flasher') {
		var flPopState = c.props.state || 0;
		html += ' <div class="cp-label">Вихід: <strong><span style="display:inline-block;width:55px;">' +
		(flPopState === 0 ? 'A' : 'B') + '</span></strong>'+
		' <button class="btn btn-ghost cp-act" data-act="toggle" type="button" style="margin-left:20px;">↕ Змінити</button></div>';
        html += '<div class="cp-label">Час на A (с) <input type="number" data-cp="tOn" value="'+c.props.tOn+'" step="0.1"></div>';
        html += '<div class="cp-label">Час на B (с) <input type="number" data-cp="tOff" value="'+c.props.tOff+'" step="0.1"></div>';
	} else {
		html += ' <div class="cp-label">Стан:  <strong><span style="display: inline-block; width: 55px;">' +
		(c.props.closed ? 'Замкнено' : 'Розімкнено') + '</span></strong>'+
		' <button class="btn btn-ghost cp-act" data-act="toggle" type="button" style="margin-left:20px;">↕ Змінити </button> </div>';
	}

}

html += ' <div class="cp-actions">'+
' <button class="btn btn-ghost cp-act" data-act="rotate" type="button">↻ Поворот на 90°</button>'+
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
        
        // миттєве оновлення текстового значення для fuse (та інших компонентів з .cp-val)
        var spanVal = compPopover.querySelector('.cp-val');
        if (spanVal && key === 'Imax') spanVal.textContent = v.toFixed(1) + ' А';

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
    if (act === 'toggle') { saveUndo(); if (c.type === 'flasher') { c.props.state = (c.props.state || 0) === 0 ? 1 : 0; c.state._flInit = false; } else { c.props.closed = !c.props.closed; } try{sfx.click();}catch(e){} showCompPopover(c); renderProps(); scheduleDraw(); }
    else if (act === 'pb-press') {
      var pbIsNOpop = (c.props.normallyOpen !== false);
      saveUndo();
      c.props.closed = pbIsNOpop ? true : false;
      try{sfx.click();}catch(e){}
      markDirty(); showCompPopover(c); renderProps(); scheduleDraw();
      var pbIdPop = c.id;
      setTimeout(function(){
        var pbC = state.components.find(function(x){ return x.id === pbIdPop; });
        if (pbC) {
          var noPop = (pbC.props.normallyOpen !== false);
          pbC.props.closed = noPop ? false : true;
          try{sfx.click();}catch(e){}
          markDirty(); showCompPopover(pbC); renderProps(); scheduleDraw();
        }
      }, 300);
    }
     else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; showCompPopover(c); scheduleDraw(); }
     else if (act === 'toggle-spdt') { saveUndo(); c.props.state = c.props.state === 0 ? 1 : 0; showCompPopover(c); scheduleDraw(); }
     else if (act === 'delete') { saveUndo(); deleteSelected(); hideCompPopover(); }
  });
});
compPopover.querySelectorAll('select[data-cp-act="pb-contact-type"]').forEach(function(sel){
  sel.addEventListener('change', function(){
    saveUndo();
    var isNOpop2 = sel.value === 'no';
    c.props.normallyOpen = isNOpop2;
    c.props.closed = isNOpop2 ? false : true;
    markDirty(); showCompPopover(c); renderProps(); scheduleDraw();
  });
});
}
// == Delete / rotate / clear===============================
function deleteSelected() {
  console.log("deleteSelected=",selectedId)	
  // 1. Видалення фігур (анотацій)
  if (selectedShape != null) {
    saveUndo();
    state.annShapes.splice(selectedShape, 1);
    selectedShape = null; 
    scheduleDraw();
    return;
  }
  // 2. Видалення окремого дроту
  if (selectedConnId  != null) {
    saveUndo();
    state.connections = state.connections.filter(function(x){return x.id!==selectedConnId;});
    selectedConnId = null;
    pendingWire = null;
    markDirty(); // calls purgeOrphanedJunctions internally
    scheduleDraw();
    return;
  }

  if (selectedId ==  null) return;
  saveUndo();
  var delId = selectedId;
  
  // 3. Видалення вузла (Junction) — ВИПРАВЛЕНА ЛОГІКА З ЗЛИТТЯМ ДРОТІВ
  var delJunc = state.junctions.find(function(j){ return j.id === delId; }); 
  console.log("state.junctions0=",state.junctions)
    if (delJunc) {
        saveUndo();
        
        // Просто видаляємо вузол.
        // Дроти, що вели до нього, залишаться з {anchor: {x,y}}.
        // Функція purgeFullyDanglingWires потім прибере ті, що ведуть у нікуди,
        // але залишить ті, що з'єднують два існуючі junctions.
        state.junctions = state.junctions.filter(function(j){ return j.id !== delJunc.id; });
        
        // ✅ КРИТИЧНО: скидаємо pendingWire, щоб уникнути "дротів-привидів"
        pendingWire = null;
        
        // Скидаємо виділення
        selectedId = null;
        selectedConnId = null;
        hoverId = null;
        hoverPort = null;
        hoverConnId = null;
        
        hideCompPopover();
        renderProps();
        markDirty(); // Це викличе purgeFullyDanglingWires
        scheduleDraw();
        return;
    }

  // 4. Видалення компонента (оригінальна логіка)
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
  purgeFullyDanglingWires();
  
  // Скидаємо pendingWire якщо він вів від видаленого компонента
  if (pendingWire && pendingWire.from && pendingWire.from.compId === delId) {
    pendingWire = null;
  }
  
  // Clean up vsource slider if deleted
  if (delComp && delComp.type === 'vsource') removeVsourceSlider(delId);
  
  selectedId = null;
  hideCompPopover();
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
    if (!state.components.length && !state.connections.length && !state.junctions.length) return;
    saveUndo();
    // Clean up vsource sliders
    Object.keys(_vsourceSliders).forEach(function(id){ removeVsourceSlider(+id); });
    state.components = [];
    state.connections = [];
    state.junctions = [];
    state.nextId = 1; // Скидаємо лічильник ID, щоб нумерація починалась спочатку
    selectedId = null;
    selectedConnId = null;
    pendingWire = null;
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

function updateFlashers(t) {
    if (!isRunning || !sim || !sim.compI) return;
    var changed = false;
    var TH = 0.0001; // 0.1 мА
    for (var i = 0; i < state.components.length; i++) {
        var c = state.components[i];
        if (c.type !== 'flasher') continue;
        if (!c.state._flInit) {
            c.state._flInit = true;
            c.state._lastT = t;
            // state=0 → фаза 'a' (tOn), state=1 → фаза 'b' (tOff)
            c.state._phase = (c.props.state || 0) === 0 ? 'a' : 'b';
            c.state._powered = false;
            c.state._pauseStart = null;
        }

        // Визначаємо живлення: є струм через спільний порт (0) або потенціал між c і будь-яким виходом
        var iVal = Math.abs(sim.compI[c.id] || 0);
        var poweredByCurrent = iVal > TH;

        var hasPotential = false;
        if (sim.netOf && sim.voltages) {
            var netC = sim.netOf(c.id, 0);
            var netA = sim.netOf(c.id, 1);
            var netB = sim.netOf(c.id, 2);
            var vC = (netC != null && sim.voltages[netC] != null) ? sim.voltages[netC] : 0;
            var vA = (netA != null && sim.voltages[netA] != null) ? sim.voltages[netA] : 0;
            var vB2 = (netB != null && sim.voltages[netB] != null) ? sim.voltages[netB] : 0;
            hasPotential = Math.abs(vC - vA) > 0.05 || Math.abs(vC - vB2) > 0.05;
        }

        var powered = poweredByCurrent || hasPotential;

        if (powered && !c.state._powered) {
            // Flasher отримав живлення після паузи — зміщуємо _lastT на час паузи,
            // щоб накопичений до паузи час не скинувся.
            var pausedFor = t - (c.state._pauseStart || t);
            c.state._lastT = (c.state._lastT || t) + pausedFor;
            c.state._pauseStart = null;
            c.state._powered = true;
        } else if (!powered) {
            // Немає живлення — зберігаємо момент початку паузи, але НЕ скидаємо таймер
            if (c.state._powered) c.state._pauseStart = t;
            c.state._powered = false;
            continue;
        }

        var elapsed = (t - c.state._lastT) / 1000;
        var dur = c.state._phase === 'a'
            ? (parseFloat(c.props.tOn)  || 0.5)
            : (parseFloat(c.props.tOff) || 0.5);
        if (dur < 0.01) dur = 0.01;

        if (elapsed >= dur) {
            var ps = spdtPortStatus(c);
            if (ps.singlePort !== null) {
                // Деградований режим: перемикаємо замкнено/розімкнено на одному порту
                // state=0 → активна фаза 'a' (замкнено на singlePort якщо singlePort===1, інакше розімкнено)
                // Для спрощення: просто перемикаємо state між 0 і 1,
                // але в MNA це означає: якщо activeFase вказує на singlePort → замкнено, інакше → розімкнено
                c.props.state = c.state._phase === 'a' ? 1 : 0;
                c.state._phase = c.props.state === 0 ? 'a' : 'b';
            } else {
                // Нормальний режим: перемикаємо між портом A (state=0) і портом B (state=1)
                c.props.state = c.state._phase === 'a' ? 1 : 0;
                c.state._phase = c.props.state === 0 ? 'a' : 'b';
            }
            c.state._lastT = t;
            changed = true;
        }
    }
    if (changed) markDirty();
}

var animRAF = 0;
var animStart = 0;
function animLoop(t) {
if (!isRunning) { animRAF = 0; return; }
if (!animStart) animStart = t;
updateFlashers(t);
if (circuitDirty || !sim) {
// Check for short circuits before solving (catches KZ created by switch/button toggle)
var fRuntime = checkFaults();
if (fRuntime && !fRuntime._voltmeterInSeries) {
circuitDirty = false;
sim = null; _wireCurrent = {};
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

// Check fuses: blow any whose current exceeds Imax
if (sim && sim.compI) {
    var fuseBlewNow = false;
    state.components.forEach(function(fc) {
        if (fc.type !== 'fuse' || fc.props.blown) return;
        var fi = Math.abs(sim.compI[fc.id] || 0);
        if (fi > (fc.props.Imax || 1)) {
            fc.props.blown = true;
            fuseBlewNow = true;
        }
    });
    if (fuseBlewNow) {
        var blownFuses = state.components.filter(function(c){ return c.type==='fuse' && c.props.blown; });
        var compIds = {};
        blownFuses.forEach(function(f){ compIds[f.id] = true; });
        
        // Формуємо об'єкт помилки
        faults = {
            wireIds: {},
            compIds: compIds,
            messages: blownFuses.map(function(f){
                return '⚡ Запобіжник #' + f.id + ' перегорів! Струм перевищив встановлене обмеження ' + f.props.Imax.toFixed(1) + ' А.';
            })
        };
        
        // ⚠️ НЕ викликаємо markDirty(), бо воно автоматично очищує faults!
        circuitDirty = true; 
        scheduleDraw(); // Оновлюємо вигляд одразу
        showFaults(faults); // Показуємо банер

        // Запускаємо анімацію миготіння
        if (animRAF) cancelAnimationFrame(animRAF);
        (function flashFault(){
            if (!faults) { animRAF = 0; return; }
            scheduleDraw();
            animRAF = requestAnimationFrame(flashFault);
        })();
        
        isRunning = false;
        wasRunningBeforeFault = true;
        document.getElementById('btn-run').style.display = 'block';
        document.getElementById('btn-stop').style.display = 'none';
        stopAllBuzzerTones();
        
        return; //КРИТИЧНО: виходимо з animLoop, щоб він не перезатер animRAF і не зупинив миготіння
    }
}
var f2 = checkPostSolveFaults(sim);
if (f2 && f2._onlyOpenSwitch) {
var hasSpdtOpen = state.components.some(function(c){ return c.type === 'spdt' || c.type === 'flasher'; });
showOpenLoopInfo('Розімкнене коло — клацніть вимикач/перемикач, щоб замкнути коло і запустити струм');
} else {
hideOpenLoopInfo();
}
}
updateBuzzerSounds();
draw();
animRAF = requestAnimationFrame(animLoop);
}
function startSim() {
	state.components.forEach(function(c){ if(c.type==='flasher') c.state._flInit = false; });
	// Перевірка ізольованих компонентів перед запуском симуляції
    checkIsolatedComponents();
    
    if (isolatedFaults) {
    
      // Підсвічування вже виконується через drawComponent()
      // Просто запускаємо анімацію миготіння
      if (!animRAF) {
        animRAF = requestAnimationFrame(function flash(){
          if (!isolatedFaults) {
            animRAF = 0;
            return;
          }
    
          scheduleDraw();
          animRAF = requestAnimationFrame(flash);
        });
      }
  
      // Симуляцію НЕ запускаємо
      return;
    }

	const wrapper = document.getElementById('sidebarWrapper');
	const toggleBtn = document.getElementById('sidebarToggleBtn');
	let sbIsCollapsed = localStorage.getItem('sidebarCollapsedFixed') === 'true';
	if (!sbIsCollapsed) {
        wrapper.classList.add('collapsed');
        if (toggleBtn) toggleBtn.innerHTML = '»';
        localStorage.setItem('sidebarCollapsedFixed', true);
		setTimeout(() => {
		if (window.dispatchEvent) {
			window.dispatchEvent(new Event('resize'));
		}
		if (typeof resizeCanvas === 'function') {
			resizeCanvas();
		}
		if (typeof scheduleDraw === 'function') {
			scheduleDraw();
		}
		if (typeof redrawCanvas === 'function') {
			redrawCanvas();
			}
		}, 150); 
	}
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
	_clearIsolatedFaults();
	clearFaults();
	runSolve();
  var f2 = checkPostSolveFaults(sim);
  console.log('[DBG startSim] sim=', sim ? 'OK totalI='+sim.totalI : 'NULL', 'f2=', f2 ? JSON.stringify({msgs:f2.messages.map(function(m){return m.substr(0,60);}), onlyOpen:f2._onlyOpenSwitch}) : null);
  if (f2) {
    // якщо солвер повернув результат, але струм ~0 — це розімкнене коло,
    // а не критична помилка. Дозволяємо симуляції працювати далі.
    var isOpenCircuit = sim && sim.totalI < 1e-6;
    var isHardFault = !isOpenCircuit && !f2._onlyOpenSwitch;

    if (isHardFault) {
      sim = null;
      showFaults(f2);
      if (!animRAF) animRAF = requestAnimationFrame(function flash(){
        if (!faults) { animRAF = 0; return; }
        scheduleDraw();
        animRAF = requestAnimationFrame(flash);
      });
      return; // Зупиняємо ТІЛЬКИ при реальних помилках (КЗ, висячі компоненти тощо)
    }
    
    // М'яке попередження (розімкнене коло) — показуємо підказку, але НЕ викликаємо return
    showOpenLoopInfo(state.components.some(function(c){ return c.type === 'spdt' || c.type === 'flasher'; })
      ? 'Розімкнене коло — клацніть вимикач/перемикач, щоб замкнути і запустити струм'
      : 'Розімкнене коло — клацніть вимикач, щоб замкнути і запустити струм');
  }
isRunning = true;
updateEditButtonsVisibility();
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
updateEditButtonsVisibility();
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
/* ═══════════════════ MNA Solver ════════════════════════════ */
var sim = null;
function portKey(compId, portIdx) { return compId + ':' + portIdx; }
/* ── Fault detection (short circuits, dangling sources) ── */
var faults = null;

/* ── Isolated component detection ────────────────────────
   Компоненти, жоден порт яких не підключений до жодного дроту,
   є повністю ізольованими від кола — солвер не може їх врахувати.
   Ця перевірка виконується постійно (не лише при запуску), щоб
   користувач бачив попередження одразу після розміщення компонента.
─────────────────────────────────────────────────────────── */
var isolatedFaults = null;
var _isolatedFlashRAF = 0;

function checkIsolatedComponents() {

  var isolated = [];

  // Компоненти, які ОБОВ'ЯЗКОВО мають бути повністю підключені
  var circuitTypes = [
    'battery',
    'vsource',
    'resistor',
    'rheostat',
    'lamp',
    'led',
    'fan',
    'buzzer',
    'heater',
    'ammeter',
    'voltmeter',
    'switch',
    'pushbutton',
    'flasher',
    'ground',
    'spdt'
  ];

  state.components.forEach(function(c) {

    if (circuitTypes.indexOf(c.type) < 0)
      return;

    var def = COMP_DEFS[c.type];
    if (!def || !def.ports)
      return;

    var connectedPorts = 0;
    var danglingPorts = [];

    // Перевіряємо КОЖЕН порт
    for (var pi = 0; pi < def.ports.length; pi++) {

      var hasWire = state.connections.some(function(conn) {
        return (
          (conn.from.compId === c.id && conn.from.portIdx === pi) ||
          (conn.to.compId   === c.id && conn.to.portIdx   === pi)
        );
      });

      if (hasWire) {
        connectedPorts++;
      } else {
        danglingPorts.push(pi);
      }
    }

    // Для spdt та flasher: вхідний порт (0) обов'язковий,
    // але достатньо хоча б одного з вихідних портів (1 або 2).
    // Якщо лише один вихід підключений — це деградований режим (дозволено).
    if (c.type === 'spdt' || c.type === 'flasher') {
      var inputConnected  = danglingPorts.indexOf(0) < 0;   // порт 'c' підключений
      var out1Connected   = danglingPorts.indexOf(1) < 0;   // порт 'a' підключений
      var out2Connected   = danglingPorts.indexOf(2) < 0;   // порт 'b' підключений
      // Помилка лише якщо вхід не підключений, АБО жоден з виходів не підключений
      var hasError = !inputConnected || (!out1Connected && !out2Connected);
      if (hasError) {
        var badPorts = [];
        if (!inputConnected) badPorts.push(0);
        if (!out1Connected && !out2Connected) { badPorts.push(1); badPorts.push(2); }
        isolated.push({ comp: c, dangling: badPorts });
      }
      // Якщо лише один вихід підключений — деградований режим, помилки немає
      return; // пропускаємо загальну перевірку нижче
    }

    // Помилка якщо:
    // - жоден порт не підключений
    // - АБО хоча б один порт не підключений
    if (
      connectedPorts === 0 ||
      danglingPorts.length > 0
    ) {
      isolated.push({
        comp: c,
        dangling: danglingPorts
      });
    }
  });

  if (isolated.length === 0) {
    _clearIsolatedFaults();
    return;
  }

  var compIds = {};

  isolated.forEach(function(item) {
    compIds[item.comp.id] = true;
  });

  var names = isolated.map(function(item) {

    var c = item.comp;

    var label =
      (COMP_LABELS[c.type] || c.type) +
      '\u00a0#' + c.id;

    if (item.dangling.length > 0) {
      label += ' (не підключені порти: ' +
               item.dangling.join(', ') + ')';
    }

    return label;

  }).join(', ');

  var newFault = {

    wireIds: {},

    compIds: compIds,

    messages: [
      '\u26a0\ufe0f Виявлено неповністю підключені компоненти: ' +
      names +
      '. Симуляцію неможливо виконати, доки всі порти компонентів не будуть підключені.'
    ],

    _isolated: true
  };

  // Якщо список не змінився — банер не оновлюємо
  var sameIds =
    isolatedFaults &&
    Object.keys(isolatedFaults.compIds).sort().join(',') ===
    Object.keys(newFault.compIds).sort().join(',');

  if (!sameIds) {
    isolatedFaults = newFault;
    _showIsolatedBanner();
  }

  // Миготіння проблемних компонентів
  if (!_isolatedFlashRAF) {

    (function flash() {

      if (!isolatedFaults) {
        _isolatedFlashRAF = 0;
        return;
      }

      scheduleDraw();

      _isolatedFlashRAF =
        requestAnimationFrame(flash);

    })();
  }
}

function _clearIsolatedFaults() {
  if (!isolatedFaults) return;
  isolatedFaults = null;
  if (_isolatedFlashRAF) { cancelAnimationFrame(_isolatedFlashRAF); _isolatedFlashRAF = 0; }
  var bn = document.getElementById('isolated-fault-banner');
  if (bn) bn.style.display = 'none';
  scheduleDraw();
}

function _showIsolatedBanner() {
  if (!isolatedFaults) return;
  var bn = document.getElementById('isolated-fault-banner');
  if (!bn) {
    bn = document.createElement('div');
    bn.id = 'isolated-fault-banner';
    bn.className = 'fault-banner fault-banner--isolated';
    bn.style.cssText = [
      'position:absolute', 'bottom:12px', 'left:12px',
      'background:rgba(30,24,8,0.97)',
      'border-left:5px solid #ff9800',
      'padding:10px 14px 10px 12px',
      'border-radius:10px',
      'color:#ffe082',
      'font-size:12px',
      'max-width:500px',
      'z-index:500',
      'backdrop-filter:blur(10px)',
      'display:flex',
      'align-items:flex-start',
      'gap:10px',
      'box-shadow:0 4px 24px rgba(0,0,0,0.5)'
    ].join(';');
    if (canvasCard) canvasCard.appendChild(bn);
  }
  var msg = isolatedFaults.messages.map(function(m) {
    return '<div>' + m.replace(/[<>&]/g, function(ch){
      return {'<':'&lt;','>':'&gt;','&':'&amp;'}[ch];
    }) + '</div>';
  }).join('');
  bn.innerHTML =
    '<div style="flex:1">' + msg + '</div>' +
    '<button style="background:none;border:none;color:#ffe082;cursor:pointer;font-size:18px;line-height:1;padding:0 0 0 8px;flex-shrink:0" id="isolated-fault-close">\u00d7</button>';
  bn.querySelector('#isolated-fault-close').addEventListener('click', function() {
    _clearIsolatedFaults();
  });
  bn.style.display = 'flex';
}
function buildUnionFind(excludeVoltmeter) {
  var parent = {};
  function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
  function union(a,b){ a=find(a); b=find(b); if (a!==b) parent[a]=b; }
  function connKey(ep) {
    if (ep.anchor) return 'xy:' + ep.anchor.x + ',' + ep.anchor.y;
    return portKey(ep.compId, ep.portIdx);
  }
  // Register component ports
  state.components.forEach(function(c) {
    if (excludeVoltmeter && c.type === 'voltmeter') return;
    var def = COMP_DEFS[c.type];
    for (var i = 0; i < def.ports.length; i++) parent[portKey(c.id,i)] = portKey(c.id,i);
  });
  // Register anchor keys and union wire ends
  state.connections.forEach(function(conn) {
    if (conn.from.anchor) { var k = connKey(conn.from); parent[k] = k; }
    if (conn.to.anchor)   { var k = connKey(conn.to);   parent[k] = k; }
  });
  state.connections.forEach(function(conn) {
    var ka = connKey(conn.from), kb = connKey(conn.to);
    if (parent[ka] == null || parent[kb] == null) return;
    union(ka, kb);
  });
  // Union anchor keys with coincident component ports
  state.components.forEach(function(c) {
    if (excludeVoltmeter && c.type === 'voltmeter') return;
    var def = COMP_DEFS[c.type];
    for (var i = 0; i < def.ports.length; i++) {
      var pw = portWorld(c, i);
      var ck = 'xy:' + Math.round(pw.x) + ',' + Math.round(pw.y);
      if (parent[ck] != null) union(portKey(c.id,i), ck);
    }
  });
  // Union via junctions
  state.junctions.forEach(function(j) {
    var ck = 'xy:' + j.x + ',' + j.y;
    if (parent[ck] == null) parent[ck] = ck;
    state.connections.forEach(function(conn) {
      var ka = connKey(conn.from), kb = connKey(conn.to);
      if (ka === ck && parent[kb] != null) union(ck, kb);
      if (kb === ck && parent[ka] != null) union(ck, ka);
    });
    state.components.forEach(function(c) {
      if (excludeVoltmeter && c.type === 'voltmeter') return;
      var def = COMP_DEFS[c.type];
      for (var i = 0; i < def.ports.length; i++) {
        var pw = portWorld(c, i);
        if (Math.round(pw.x) === j.x && Math.round(pw.y) === j.y) union(ck, portKey(c.id,i));
      }
    });
  });
  // Component-level unions (switch, ammeter, spdt)
  state.components.forEach(function(c) {
    if ((c.type === 'switch' || c.type === 'pushbutton') && c.props.closed) union(portKey(c.id,0), portKey(c.id,1));
    if (c.type === 'ammeter') union(portKey(c.id,0), portKey(c.id,1));
    if (c.type === 'spdt') {
      var _ps = spdtPortStatus(c);
      if (_ps.singlePort !== null) {
        // Деградований режим: як простий вимикач.
        // Замкнено лише якщо активний стан вказує на підключений порт.
        var _activePort = (c.props.state === 0) ? 1 : 2;
        if (_activePort === _ps.singlePort) {
          union(portKey(c.id,0), portKey(c.id,_ps.singlePort));
        }
        // Інакше — розімкнено, union не робимо
      } else {
        union(portKey(c.id,0), portKey(c.id,(c.props.state===0)?1:2));
      }
    }
  });
  return { find: find, parent: parent };
}
function checkFaults() {
var uf = buildUnionFind(false);
var find = uf.find;
var parent = uf.parent;
function union(a,b){ a=find(a); b=find(b); if (a!==b) parent[a]=b; }
var wireIds = {}, compIds = {}, msgs = [];
var batteries = state.components.filter(function (c) { return c.type === 'battery' || c.type === 'vsource'; });

// ── Voltmeter-in-series detection ──────────────────────────
// Build a second union-find that excludes voltmeters.
// If a battery's poles are NOT connected without voltmeters,
// but ARE connected with them → voltmeter(s) are wired in series.
(function() {
  var uf2 = buildUnionFind(true); // excludeVoltmeter = true
  var find2 = uf2.find;
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
      ? ' Амперметр #' + shortAmmeter.id + ' підключено без навантаження — він має майже нульовий опір і створює коротке замикання. Підключайте амперметр ПОСЛІДОВНО з резистором або іншим навантаженням.'
      : shortSwitch
      ? ' Замкнутий ' + (shortSwitch.type === 'switch' ? 'вимикач' : 'кнопка') + ' #' + shortSwitch.id + ' з\'єднує клеми без опору між ними.'
      : ' Клеми + та − в одному вузлі без опору між ними.';
    msgs.push('⚡ Коротке замикання батареї #' + b.id + ' (' + (b.props.V||0) + 'В)!' + cause + ' Додайте резистор або навантаження в коло.');
    var sn = find(portKey(b.id,0));
    state.connections.forEach(function (conn) {
      if (conn.from.anchor || conn.to.anchor) return;
      if (find(portKey(conn.from.compId, conn.from.portIdx)) === sn || find(portKey(conn.to.compId, conn.to.portIdx)) === sn) {
        wireIds[conn.id] = true;
      }
    });
    // Junctions are now in state.junctions (not components) — no per-junction highlight needed
  }
});

// Замість простої перевірки, потрібно будувати зв'язність через union-find
batteries.forEach(function (b) {
    var p0 = find(portKey(b.id,0)), p1 = find(portKey(b.id,1));
    
    // Перевіряємо чи є хоча б один дріт (включаючи anchor) що з'єднаний з кожною клемою
    var p0Conn = false, p1Conn = false;
    
    state.connections.forEach(function (conn) {
        // ✅ FIX: Тепер перевіряємо ВСІ дроти, включаючи anchor
        var fk, tk;
        if (conn.from.anchor) {
            var anchorKey = 'xy:' + conn.from.anchor.x + ',' + conn.from.anchor.y;
            fk = find(anchorKey);
        } else {
            fk = find(portKey(conn.from.compId, conn.from.portIdx));
        }
        
        if (conn.to.anchor) {
            var anchorKey2 = 'xy:' + conn.to.anchor.x + ',' + conn.to.anchor.y;
            tk = find(anchorKey2);
        } else {
            tk = find(portKey(conn.to.compId, conn.to.portIdx));
        }
        
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
      // Skip wires with anchor endpoints (junction wires) — anchors are merge-points, not ports
      if (conn.from.anchor || conn.to.anchor) return;

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
var batteries = state.components.filter(function (c) { return c.type === 'battery' || c.type === 'vsource'; });
if (batteries.length === 0) return null;
var liveBatts = batteries.filter(function (b) { return Math.abs(b.props.V || 0) > 1e-9; });
if (liveBatts.length === 0) return null;
var wireIds = {}, compIds = {}, msgs = [];

if (!s) {
  // Перевіряємо, чи є вимикачі/кнопки/SPDT, які розривають коло
  var hasOpenSwitch2 = state.components.some(function(c) {
    if (c.type === 'switch' || c.type === 'pushbutton') return !c.props.closed;
if (c.type === 'spdt' || c.type === 'flasher') {
    // ✅ FIX: Перевіряємо, чи підключений хоча б один вихід (1 або 2)
    var out1Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 1) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 1);
    });
    var out2Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 2) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 2);
    });
    // "Відкритий" (розриває коло) тільки якщо ОБИДВА виходи не підключені
    return !(out1Connected || out2Connected);
}
    return false;
  });
  var hasClosedSwitch2 = state.components.some(function(c) {
    if (c.type === 'switch' || c.type === 'pushbutton') return c.props.closed;
if (c.type === 'spdt' || c.type === 'flasher') {
    // ✅ FIX: Перевіряємо, чи підключений хоча б один вихід (1 або 2)
    var out1Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 1) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 1);
    });
    var out2Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 2) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 2);
    });
    // "Відкритий" (розриває коло) тільки якщо ОБИДВА виходи не підключені
    return !(out1Connected || out2Connected);
}
    return false;
  });

  // Виявляємо "висячі" елементи — підключені менш ніж двома дротами
  // (для 2-портових) або жодним (для 1-портових)
  var danglingComps = [];
  state.components.forEach(function(c) {
    var def = COMP_DEFS[c.type];
    if (!def) return;
    // Пропускаємо не-гілкові елементи
    if (BRANCH_TYPES.indexOf(c.type) < 0) return;
    // Пропускаємо батареї — вони вже діагностуються окремо
    if (c.type === 'battery' || c.type === 'vsource') return;
    // Рахуємо скільки портів підключені хоча б до одного дроту
    var connectedPorts = 0;
    for (var pi = 0; pi < def.ports.length; pi++) {
      var hasConn = state.connections.some(function(conn) {        
        return (conn.from.compId === c.id && conn.from.portIdx === pi) ||
               (conn.to.compId === c.id && conn.to.portIdx === pi);
      });
      if (hasConn) connectedPorts++;
    }
    // Для spdt та flasher: неактивний вихід — НОРМА конструкції, не висячий порт.
    // Якщо лише один вихід підключений — деградований режим (дозволено).
    // Помилка лише якщо common (0) або обидва виходи не підключені взагалі.
if (c.type === 'spdt' || c.type === 'flasher') {
    var _hasWireOnPort = function(pi2) {
        return state.connections.some(function(conn) {
            if (conn.from.anchor || conn.to.anchor) return false;
            return (conn.from.compId === c.id && conn.from.portIdx === pi2) ||
                   (conn.to.compId   === c.id && conn.to.portIdx   === pi2);
        });
    };
    var _inOk  = _hasWireOnPort(0);
    var _out1Ok = _hasWireOnPort(1);
    var _out2Ok = _hasWireOnPort(2);
    // Помилка: немає входу, або жоден вихід не підключений
    if (!_inOk || (!_out1Ok && !_out2Ok)) {
        danglingComps.push(c);
    }
    // Якщо лише один вихід підключений — деградований режим, не помилка
    return;
}
else if (connectedPorts < def.ports.length) {
    danglingComps.push(c);
}
  });

  console.log('[DBG !s] danglingComps='+danglingComps.map(function(c){return c.type+'#'+c.id;})+ ' hasOpenSwitch2='+hasOpenSwitch2);
  if (danglingComps.length > 0) {
    // Є реально непідключені елементи
    danglingComps.forEach(function(c) { compIds[c.id] = true; });
    var names = danglingComps.map(function(c) {
      return (COMP_LABELS[c.type] || c.type) + ' #' + c.id;
    }).join(', ');
    msgs.push('⚠ Деякі компоненти не повністю підключені до кола: ' + names + '. Підключіть усі порти або видаліть зайві елементи.');
    // Якщо при цьому всі вимикачі замкнені — не показуємо помилку про розімкнене коло
    if (!hasOpenSwitch2) {
      liveBatts.forEach(function(b) { compIds[b.id] = true; });
    }
  } else {
    // Солвер не зміг розрахувати з іншої причини
    liveBatts.forEach(function (b) { compIds[b.id] = true; });
    if (hasOpenSwitch2) {
      // Основна причина — розімкнутий перемикач/SPDT
      msgs.push('⚠ Коло розімкнене — перемкніть вимикач або SPDT, щоб замкнути контур.');
    } else {
      msgs.push('⚠ Система не може розрахувати цю схему — ймовірно, є неприєднані компоненти або сингулярна конфігурація. Перевірте з\'єднання.');
    }
  }
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
      if (conn.from.anchor || conn.to.anchor) return;
      var fn = s.netOf ? s.netOf(conn.from.compId, conn.from.portIdx) : null;
      var tn = s.netOf ? s.netOf(conn.to.compId, conn.to.portIdx) : null;
      if (fn === nA || fn === nB || tn === nA || tn === nB) wireIds[conn.id] = true;
    });
  });
  var hasVm = state.components.some(function (c) { return c.type === 'voltmeter'; });
  var hasOpenSwitch = state.components.some(function (c) { 
    if (c.type === 'switch' || c.type === 'pushbutton') return !c.props.closed;
    if (c.type === 'spdt' || c.type === 'flasher') {
      // SPDT "відкритий" якщо активний вихід взагалі не підключений до жодного дроту
      var sp2 = c.props.state || 0;
      var ap2 = sp2 === 0 ? 1 : 2;
      return !state.connections.some(function(conn) {
        return !conn.from.anchor && !conn.to.anchor &&
          ((conn.from.compId === c.id && conn.from.portIdx === ap2) ||
           (conn.to.compId   === c.id && conn.to.portIdx   === ap2));
      });
    }
    return false;
  });
  var hasSpdt = state.components.some(function(c) { return c.type === 'spdt' || c.type === 'flasher'; });
  var hint = hasVm ? ' Вольтметр має дуже великий опір — він не може бути єдиним шляхом проходження струму, його слід підключати паралельно до вимірюваної ділянки.' :
              (hasOpenSwitch && hasSpdt) ? ' SPDT-перемикач направлений на непідключену гілку — переключіть його.' :
              hasOpenSwitch ? ' Розімкнутий вимикач розриває коло — замкніть його або приберіть з основного шляху струму.' :
             ' Переконайтеся, що кожен компонент поєднаний у спільне коло з батареєю без розривів.';
  msgs.push('⚠ Струм не проходить по колу, оскільки воно не має замкненого провідного контуру.' + hint);
}

if (msgs.length === 0) return null;
var result = { wireIds: wireIds, compIds: compIds, messages: msgs };

  //перевірка відкритих перемикачів
// перевіряємо ВСІ дроти, включаючи anchor
// ✅ ВИПРАВЛЕННЯ: hasOpenSwitch має перевіряти СТАН перемикача, а не підключення дротів
var hasOpenSwitch = state.components.some(function(c){
  if (c.type === 'switch' || c.type === 'pushbutton') {
    // Перемикач розімкнений якщо closed === false
    return !c.props.closed;
  }
if (c.type === 'spdt' || c.type === 'flasher') {
    // ✅ FIX: Перевіряємо, чи підключений хоча б один вихід (1 або 2)
    var out1Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 1) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 1);
    });
    var out2Connected = state.connections.some(function(conn) {
        return (conn.from.compId === c.id && conn.from.portIdx === 2) ||
               (conn.to.compId   === c.id && conn.to.portIdx   === 2);
    });
    // "Відкритий" (розриває коло) тільки якщо ОБИДВА виходи не підключені
    return !(out1Connected || out2Connected);
}
  return false;
});

// Перевіряємо чи є реально непідключені компоненти (висячі порти)
var hasDangling = state.components.some(function(c) {
  var def = COMP_DEFS[c.type];
  if (!def || BRANCH_TYPES.indexOf(c.type) < 0 || c.type === 'battery' || c.type === 'vsource') return false;
  if (c.type === 'spdt' || c.type === 'flasher') return false; // не "висячі" — це перемикачі
  for (var pi = 0; pi < def.ports.length; pi++) {
    var hasConn = state.connections.some(function(conn) {
      return (conn.from.compId === c.id && conn.from.portIdx === pi) ||
             (conn.to.compId === c.id && conn.to.portIdx === pi);
    });
    if (!hasConn) return true;
  }
  return false;
});

console.log('[DBG checkPost] hasOpenSwitch='+hasOpenSwitch+' hasDangling='+hasDangling+' msgs='+JSON.stringify(msgs.map(function(m){return m.substr(0,60);})));

// _onlyOpenSwitch = true ТІЛЬКИ якщо є розімкнені перемикачі І немає висячих компонентів
if (hasOpenSwitch && !hasDangling) {
  result._onlyOpenSwitch = true;
}
// Допоміжні функції:
function isSpdtClosed(c) {
    var s = c.props.state || 0;
    var activePort = s === 0 ? 1 : 2;
    return state.connections.some(conn => 
        !conn.from.anchor && !conn.to.anchor &&
        ((conn.from.compId === c.id && conn.from.portIdx === activePort) ||
         (conn.to.compId === c.id && conn.to.portIdx === activePort))
    );
}

// Перевіряємо, чи є непідключені елементи (висячі порти).
// SPDT/flasher виключаємо повністю — їх "розімкненість" обробляється через hasOpenSwitch.
var hasDangling = state.components.some(function(c) {
  var def = COMP_DEFS[c.type];
  if (!def || BRANCH_TYPES.indexOf(c.type) < 0 || c.type === 'battery' || c.type === 'vsource') return false;
  if (c.type === 'spdt' || c.type === 'flasher') return false; // не "висячі" — це перемикачі
  for (var pi = 0; pi < def.ports.length; pi++) {
    var hasConn = state.connections.some(function(conn) {
      return (conn.from.compId === c.id && conn.from.portIdx === pi) ||
             (conn.to.compId === c.id && conn.to.portIdx === pi);
    });
    if (!hasConn) return true;
  }
  return false;
});

console.log('[DBG checkPost] hasOpenSwitch='+hasOpenSwitch+' hasDangling='+hasDangling+' msgs='+JSON.stringify(msgs.map(function(m){return m.substr(0,60);})));
if (hasOpenSwitch && !hasDangling) {
  result._onlyOpenSwitch = true;
}
return result;
}

window.clearFaults = function() {
    faults = null;
    wasRunningBeforeFault = false; // повертає інтерактивність полотну

    // Скидаємо стан перегорілих запобіжників
    state.components.forEach(function(c) {
        if (c.type === 'fuse' && c.props.blown) {
            c.props.blown = false;
        }
    });
    circuitDirty = true; // змусить солвер перерахувати коло з відновленими дротами

    // Зупиняємо цикл миготіння, якщо він ще працює
    if (typeof animRAF !== 'undefined' && animRAF) {
        cancelAnimationFrame(animRAF);
        animRAF = 0;
    }
    var bn = document.getElementById('fault-banner');
    if (bn) bn.style.display = 'none';
    scheduleDraw();
}

function showFaults(f) {
  console.log('[showFaults] Викликано');

  faults = f;

  let bn = document.getElementById('fault-banner');

  if (!bn) {
    bn = document.createElement('div');
    bn.id = 'fault-banner';
    bn.className = 'fault-banner';

    if (canvasCard) {
      canvasCard.appendChild(bn);
    }
  }

  bn.innerHTML = `
    <div class="fb-text">
      ${f.messages.map(function (m) {
        return '<div>' + m.replace(/[<>&]/g, function(ch){
          return {'<':'&lt;', '>':'&gt;', '&':'&amp;'}[ch];
        }) + '</div>';
      }).join('')}
    </div>

    <button class="fb-close" type="button">×</button>
  `;

  bn.querySelector('.fb-close').addEventListener('click', function () {
    console.log('close click');
    clearFaults();
    isRunning = false;
    updateEditButtonsVisibility();
  });

  bn.style.display = 'flex';

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

// ── Step 1: register every component port as its own net ──────────────────
function portHasWire(compId, portIdx) {
    return state.connections.some(function(conn) {
        // Пряме з'єднання
        if ((conn.from.compId === compId && conn.from.portIdx === portIdx) ||
            (conn.to.compId   === compId && conn.to.portIdx   === portIdx)) {
            return true;
        }
        // З'єднання через anchor
        if ((conn.from.anchor && conn.to.compId === compId && conn.to.portIdx === portIdx) ||
            (conn.to.anchor   && conn.from.compId === compId && conn.from.portIdx === portIdx)) {
            return true;
        }
        return false;
    });
}
// Визначаємо неактивні порти SPDT/flasher — їх не реєструємо в MNA
var _spdtInactivePorts = {}; // "compId:portIdx" → true
state.components.forEach(function(c) {
  if (c.type !== 'spdt' && c.type !== 'flasher') return;
  var ps = spdtPortStatus(c);
  if (ps.singlePort !== null) {
    // Деградований режим: непідключений вихід — неактивний
    var disconnectedPort = ps.singlePort === 1 ? 2 : 1;
    _spdtInactivePorts[c.id + ':' + disconnectedPort] = true;
  } else {
    // Нормальний режим: неактивний = протилежний від поточного state
    var sp = c.props.state || 0;
    var inactivePort = sp === 0 ? 2 : 1;
    _spdtInactivePorts[c.id + ':' + inactivePort] = true;
  }
});
state.components.forEach(function (c) {
  var def = COMP_DEFS[c.type];
  for (var i = 0; i < def.ports.length; i++) {
    // Неактивний порт SPDT не реєструємо — він не бере участі в MNA
    if (_spdtInactivePorts[c.id + ':' + i]) continue;
    if ((c.type === 'spdt' || c.type === 'flasher') && !portHasWire(c.id, i)) continue;
    var k = portKey(c.id, i);
    parent[k] = k;
  }
});

// ── Step 2: collect every wire endpoint as a coordinate key ──────────────
// Wire endpoints that reference compId:portIdx → use portKey.
// Wire endpoints that are anchors {x,y} → use coord key "x,y".
// Then union the two ends of every wire.
function connKey(ep) {
  if (ep.anchor) return 'xy:' + ep.anchor.x + ',' + ep.anchor.y;
  return portKey(ep.compId, ep.portIdx);
}
// Register anchor keys
state.connections.forEach(function(conn) {
  if (conn.from.anchor) { var k = connKey(conn.from); parent[k] = k; }
  if (conn.to.anchor)   { var k = connKey(conn.to);   parent[k] = k; }
});
// Union wire endpoints (пропускаємо дроти до неактивних портів SPDT)
state.connections.forEach(function(conn) {
  // Якщо один з кінців — неактивний порт SPDT — не union-имо
  if (!conn.from.anchor && _spdtInactivePorts[conn.from.compId + ':' + conn.from.portIdx]) return;
  if (!conn.to.anchor   && _spdtInactivePorts[conn.to.compId   + ':' + conn.to.portIdx  ]) return;
  var ka = connKey(conn.from), kb = connKey(conn.to);
  if (parent[ka] == null || parent[kb] == null) return;
  union(ka, kb);
});

// ── Step 3: union anchor keys with any component port at the same coords ──
state.components.forEach(function(c) {
  var def = COMP_DEFS[c.type];
  for (var i = 0; i < def.ports.length; i++) {
    var pw = portWorld(c, i);
    var coordKey = 'xy:' + Math.round(pw.x) + ',' + Math.round(pw.y);
    if (parent[coordKey] != null) {
      union(portKey(c.id, i), coordKey);
    }
  }
});

// ── Step 4: union junctions — покращена версія ─────────────────────────────
state.junctions.forEach(function(j) {
  var coordKey = 'xy:' + Math.round(j.x) + ',' + Math.round(j.y);
  if (parent[coordKey] == null) parent[coordKey] = coordKey;

  state.connections.forEach(function(conn) {
    var pts = connectionPoints(conn);
    if (!pts) return;

    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      if (Math.abs(p.x - j.x) < 4 && Math.abs(p.y - j.y) < 4) {   // збільшив толеранс
        var ka = connKey(conn.from);
        var kb = connKey(conn.to);
        if (parent[ka] != null) union(coordKey, ka);
        if (parent[kb] != null) union(coordKey, kb);
      }
    }
  });

  // Порти компонентів біля junction
  state.components.forEach(function(c) {
    var def = COMP_DEFS[c.type];
    for (var i = 0; i < def.ports.length; i++) {
      var pw = portWorld(c, i);
      if (Math.abs(pw.x - j.x) < 4 && Math.abs(pw.y - j.y) < 4) {
        union(coordKey, portKey(c.id, i));
      }
    }
  });
});

state.components.forEach(function (c) {
    if ((c.type === 'switch' || c.type === 'pushbutton') && !c.props.closed) {
        // Не додавати цей компонент до гілок - він розриває коло
        return;
    }	
// junction має 1 порт — union не потрібен
if ((c.type === 'switch' || false) && false) {} // placeholder
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
    if (state.components[j].type === 'battery' || state.components[j].type === 'vsource') { groundNet = netOf(state.components[j].id, 1); break; }
  }
}
if (groundNet < 0) return null;

var vSources = [];
var vSeenKeys = {};
var vAliases = {};
state.components.forEach(function (c) {
  if (c.type !== 'battery' && c.type !== 'vsource') return;
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
  if (c.type === 'fuse') return c.props.blown ? null : 0.001; // blown fuse = open circuit
  return null;
}

var branches = [];
var voltages = new Array(N);

// 2 проходи: 1-й для оцінки напрямку, 2-й для фіксації розімкнених LED
for (var iter = 0; iter < 2; iter++) {
  branches = [];
  state.components.forEach(function (c) {


// === ОБРОБКА SPDT / FLASHER ===
// Активна гілка: common (0) → активний вихід, R=0.001.
// Якщо активний вихід не підключений дротом — гілку не додаємо (розімкнено).
// ========================================
// SPDT / FLASHER
// ========================================

if (c.type === 'spdt' || c.type === 'flasher') {

    var ps = spdtPortStatus(c);

    // ------------------------------------
    // Деградований режим: лише один вихід підключений
    // ------------------------------------
    if (ps.singlePort !== null) {
        var _sp = ps.singlePort;
        var _na = netOf(c.id, 0);
        var _nb = netOf(c.id, _sp);
        if (_na == null || _nb == null) return;

        if (c.type === 'spdt') {
            // Деградований режим як простий вимикач:
            // замкнено лише якщо активний стан вказує на підключений порт
            var _spdtActive = (c.props.state === 0) ? 1 : 2;
            if (_spdtActive === _sp) {
                branches.push({ comp: c, na: _na, nb: _nb, R: 0.001, portA: 0, portB: _sp });
            }
            // Інакше розімкнено — нічого не додаємо
        } else {
            // flasher: залежно від state — може бути замкнено або розімкнено,
            // але перемикається тільки через цей один вихід
            var _flState = c.props.state || 0;
            // state=0 → активна фаза 'a' → підключаємо якщо singlePort===1
            // state=1 → активна фаза 'b' → підключаємо якщо singlePort===2
            var _flActive = (_flState === 0) ? 1 : 2;
            if (_flActive === _sp) {
                branches.push({ comp: c, na: _na, nb: _nb, R: 0.001, portA: 0, portB: _sp });
            }
            // Якщо активна фаза вказує на непідключений порт — розімкнено (нічого не додаємо)
        }
        return;
    }

    // ------------------------------------
    // Нормальний режим: обидва виходи підключені
    // ------------------------------------
    var s = c.props.state || 0;
    var pActive = (s === 0) ? 1 : 2;

    var na = netOf(c.id, 0);
    var nb = netOf(c.id, pActive);

    var activeConnected = state.connections.some(function(conn) {
        return (
            (!conn.from.anchor &&
             conn.from.compId === c.id &&
             conn.from.portIdx === pActive)
            ||
            (!conn.to.anchor &&
             conn.to.compId === c.id &&
             conn.to.portIdx === pActive)
        );
    });

    if (!activeConnected) {
        return;
    }

    branches.push({
        comp: c,
        na: na,
        nb: nb,
        R: 0.001,
        portA: 0,
        portB: pActive
    });

    return;
}
  
    var R = resistanceOf(c);
    if (c.type === 'led') {
      var na = netOf(c.id, 0); // anode
      var nb = netOf(c.id, 1); // cathode
      // У першому проході вважаємо напругу позитивною (LED відкритий)
      // У другому використовуємо обчислені потенціали
      var Vak = (iter === 1 && voltages[na] != null && isFinite(voltages[na]))
                ? (voltages[na] - voltages[nb])
                : 5;
      
      // Якщо зворотна полярність -> розрив.
      // Перевірку Vak < Vf прибрано, бо лінійний солвер дає Vak = I*R, що завжди < Vf.
      if (Vak < 0) R = 1e9;
    }
    if (R == null) return;
    branches.push({ comp: c, na: netOf(c.id, 0), nb: netOf(c.id, 1), R: R });
  });

  // Перевірка зв'язності графу гілок.
  // Якщо якийсь нет не досягається від groundNet через гілки+джерела
  // (наприклад, через розімкнутий вимикач), матриця технічно не сингулярна,
  // але результат фізично безглуздий — лампа "світить" без струму.
  var netAdj = {};
  for (var ni = 0; ni < N; ni++) netAdj[ni] = {};
  branches.forEach(function(b) { 
      if (b.na != null && b.nb != null && b.na >= 0 && b.nb >= 0) {
          netAdj[b.na][b.nb] = true; 
          netAdj[b.nb][b.na] = true; 
      }
  });
  vSources.forEach(function(v) { 
      var np = netOf(v.id,0), nm = netOf(v.id,1);
      if (np != null && nm != null && np >= 0 && nm >= 0) {
          netAdj[np][nm] = true; 
          netAdj[nm][np] = true; 
      }
  });
  var bfsVisited = {}; var bfsQueue = [groundNet]; bfsVisited[groundNet] = true;
  while (bfsQueue.length) {
      var bfsCur = bfsQueue.shift();
      if (netAdj[bfsCur]) {  // ← Додано перевірку
          Object.keys(netAdj[bfsCur]).forEach(function(nb){ 
              var nbn = +nb; 
              if (!bfsVisited[nbn]) { 
                  bfsVisited[nbn] = true; 
                  bfsQueue.push(nbn); 
              } 
          });
      }
  }
// ========================================
// ПЕРЕВІРКА РОЗІМКНЕНОГО КОЛА
// ========================================

var disconnected = false;
var controllableOpen = false;

branches.forEach(function(b) {

    if (b.na == null || b.nb == null) return;
    if (b.na < 0 || b.nb < 0) return;

    var aVisited = !!bfsVisited[b.na];
    var bVisited = !!bfsVisited[b.nb];

    // Гілка підключена нормально
    if (aVisited && bVisited) return;

    // ====================================
    // ДОЗВОЛЕНІ РОЗРИВИ
    // ====================================

    if (b.comp) {

        var t = b.comp.type;

        // Звичайний вимикач
        if (t === 'switch') {
            controllableOpen = true;
            return;
        }

        // Кнопка
        if (t === 'pushbutton') {
            controllableOpen = true;
            return;
        }

        // SPDT перемикач
        if (t === 'spdt') {
            controllableOpen = true;
            return;
        }

        // Flasher (переривник)
        if (t === 'flasher') {
            controllableOpen = true;
            return;
        }
    }

    // ====================================
    // СПРАВЖНІЙ ОБРИВ
    // ====================================

    disconnected = true;
});

// ========================================
// ОБРОБКА РЕЗУЛЬТАТУ
// ========================================

// Реальний обрив
if (disconnected) {

    showToast(
        "🔓 Розімкнене коло — клацніть вимикач/перемикач, щоб замкнути коло і запустити струм"
    );

    return null;
}

// Якщо є лише керований розрив —
// симуляцію НЕ зупиняємо

  // Очищаємо та заново штампуємо матрицю
  A = []; for (var r = 0; r < SIZE; r++) { A[r] = new Array(SIZE); for (var c2 = 0; c2 < SIZE; c2++) A[r][c2] = 0; }
  B = new Array(SIZE); for (var z = 0; z < SIZE; z++) B[z] = 0;

  branches.forEach(function (b) { stampG(b.na, b.nb, 1/b.R); });
  vSources.forEach(function (v, k) {
    var nplus = netOf(v.id, 0), nmin = netOf(v.id, 1);
    var mRow = (N - 1) + k;
    var ip = netIdx[nplus], im = netIdx[nmin];
    if (ip >= 0) { A[mRow][ip] = 1; A[ip][mRow] = 1; }
    if (im >= 0) { A[mRow][im] = -1; A[im][mRow] = -1; }
    B[mRow] = v.props.V;
  });

  // Гаус (без змін)
  for (var p = 0; p < SIZE; p++) {
    var maxA = Math.abs(A[p][p]); var piv = p;
    for (var pp = p+1; pp < SIZE; pp++) { if (Math.abs(A[pp][p]) > maxA) { maxA = Math.abs(A[pp][p]); piv = pp; } }
    if (!isFinite(maxA) || maxA < 1e-9) return null;
    if (piv !== p) { var tmp = A[p]; A[p] = A[piv]; A[piv] = tmp; var tb = B[p]; B[p] = B[piv]; B[piv] = tb; }
    for (var rr = p+1; rr < SIZE; rr++) { var f = A[rr][p] / A[p][p]; if (f !== 0) { for (var cc = p; cc < SIZE; cc++) A[rr][cc] -= f * A[p][cc]; B[rr] -= f * B[p]; } }
  }

  var x = new Array(SIZE);
  for (var bk = SIZE-1; bk >= 0; bk--) {
    var s2 = B[bk]; for (var ck = bk+1; ck < SIZE; ck++) s2 -= A[bk][ck] * x[ck];
    var denom = A[bk][bk];
    if (!isFinite(denom) || Math.abs(denom) < 1e-15) return null;
    x[bk] = s2 / denom; if (!isFinite(x[bk])) return null;
  }

  for (var nn = 0; nn < N; nn++) voltages[nn] = (nn === groundNet) ? 0 : x[netIdx[nn]];
}

// ⬇️ Далі залишаємо оригінальний код розрахунку струмів/потужностей без змін:
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
  // Для spdt/flasher: гілка з'єднує порт 0 (c) з активним виходом (1 або 2).
  // Визначаємо індекси з гілки щоб правильно записати portI для 3-портових компонентів.
  if ((b.comp.type === 'spdt' || b.comp.type === 'flasher') && b.portA != null && b.portB != null) {
    portI[b.comp.id][b.portA] = i;
    portI[b.comp.id][b.portB] = -i;
  } else {
    portI[b.comp.id][0] = i;
    portI[b.comp.id][1] = -i;
  }
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
var BRANCH_TYPES = ['resistor','rheostat','lamp','fan','buzzer','heater','led','ammeter','voltmeter','battery','vsource','switch','pushbutton','flasher', 'spdt', 'fuse'];
function isBranchComp(c) { return c && BRANCH_TYPES.indexOf(c.type) >= 0; }
// Мапа wireId → signedCurrent, заповнюється після кожного solve()
var _wireCurrent = {};

// Будує _wireCurrent для ВСІХ дротів після solve().
// Використовує nets solver'а — НЕ поширює струм "заразно" через junction.
function buildWireCurrents() {
    _wireCurrent = {};
    if (!sim || !sim.portI) return;

    // --- Крок 1: будуємо карту "координата anchor → net" через BFS по сітці дротів ---
    // Для кожної унікальної anchor-точки знаходимо її net, обходячи ланцюжок
    // дротів поки не дійдемо до compId-кінця (де sim.netOf() дає відповідь).
    // Це вирішує проблему ланцюжків: compPort→anchor1→anchor2→anchor3→...

    // Збираємо всі унікальні anchor-координати
    var anchorNetCache = {}; // "x,y" → net index

    function anchorKey(x, y) { return Math.round(x) + ',' + Math.round(y); }

    function coordsMatch(ax, ay, bx, by) {
        return Math.abs(ax - bx) < 4 && Math.abs(ay - by) < 4;
    }

    // BFS від anchor-точки: обходимо сусідні дроти поки не знайдемо compId-кінець
    function resolveAnchorNet(startX, startY, visitedKeys) {
        if (!visitedKeys) visitedKeys = {};
        var key = anchorKey(startX, startY);
        if (visitedKeys[key]) return null;
        visitedKeys[key] = true;

        // Перевіряємо, чи є компонентний порт прямо в цій точці
        for (var ci = 0; ci < state.components.length; ci++) {
            var c = state.components[ci];
            var def = COMP_DEFS[c.type];
            for (var pi = 0; pi < def.ports.length; pi++) {
                var pw = portWorld(c, pi);
                if (coordsMatch(pw.x, pw.y, startX, startY)) {
                    var n = sim.netOf(c.id, pi);
                    if (n != null) return n;
                }
            }
        }

        // Шукаємо дроти, що мають anchor-кінець у цій точці
        for (var wi = 0; wi < state.connections.length; wi++) {
            var conn = state.connections[wi];

            // Якщо from-anchor збігається з нашою точкою
            if (conn.from.anchor &&
                coordsMatch(conn.from.anchor.x, conn.from.anchor.y, startX, startY)) {
                // to-кінець цього дроту — компонент?
                if (conn.to.compId !== undefined) {
                    var n2 = sim.netOf(conn.to.compId, conn.to.portIdx);
                    if (n2 != null) return n2;
                }
                // to-кінець — anchor? Рекурсивно йдемо далі
                if (conn.to.anchor) {
                    var n3 = resolveAnchorNet(conn.to.anchor.x, conn.to.anchor.y, visitedKeys);
                    if (n3 != null) return n3;
                }
            }

            // Якщо to-anchor збігається з нашою точкою
            if (conn.to.anchor &&
                coordsMatch(conn.to.anchor.x, conn.to.anchor.y, startX, startY)) {
                // from-кінець цього дроту — компонент?
                if (conn.from.compId !== undefined) {
                    var n4 = sim.netOf(conn.from.compId, conn.from.portIdx);
                    if (n4 != null) return n4;
                }
                // from-кінець — anchor? Рекурсивно йдемо далі
                if (conn.from.anchor) {
                    var n5 = resolveAnchorNet(conn.from.anchor.x, conn.from.anchor.y, visitedKeys);
                    if (n5 != null) return n5;
                }
            }
        }
        return null;
    }

    // Повертає net для будь-якого кінця з'єднання
    function endNet(ep) {
        if (ep.compId !== undefined) {
            return sim.netOf(ep.compId, ep.portIdx);
        }
        if (ep.anchor) {
            var k = anchorKey(ep.anchor.x, ep.anchor.y);
            if (anchorNetCache[k] !== undefined) return anchorNetCache[k];
            var n = resolveAnchorNet(ep.anchor.x, ep.anchor.y, {});
            anchorNetCache[k] = (n != null) ? n : null;
            return anchorNetCache[k];
        }
        return null;
    }

    // --- Крок 2: для кожного дроту визначаємо струм ---
    // Правило: струм дроту = portI компонента на його кінці.
    // Для anchor→anchor: знаходимо net обох кінців, і шукаємо струм через компонент
    // між цими nets, АЛЕ тільки якщо nets різні (інакше — провід у рамках одного
    // потенціального вузла, струм = 0 у провіднику без опору).
    // КЛЮЧОВА відмінність від старого коду: ми НІКОЛИ не копіюємо струм між дротами —
    // тільки беремо його з portI (яке solver встановив у 0 для розімкнених гілок).

    state.connections.forEach(function(conn) {
        var I = 0;
        var fromIsComp = conn.from.compId !== undefined;
        var toIsComp   = conn.to.compId   !== undefined;

        if (fromIsComp && toIsComp) {
            // Обидва кінці — компоненти. Напряму з portI.
            I = -(sim.portI[conn.from.compId]?.[conn.from.portIdx] || 0);

        } else if (fromIsComp) {
            // from — компонент, to — anchor (junction).
            // portI from-компонента вже = 0 якщо гілка розімкнена — просто беремо його.
            I = -(sim.portI[conn.from.compId]?.[conn.from.portIdx] || 0);

        } else if (toIsComp) {
            // to — компонент, from — anchor (junction).
            I = (sim.portI[conn.to.compId]?.[conn.to.portIdx] || 0);

        } else {
            // Обидва кінці — anchors (junction→junction дріт).
            // Використовуємо nets для знаходження струму.
            var netA = endNet(conn.from);
            var netB = endNet(conn.to);

            if (netA !== null && netB !== null) {
                if (netA === netB) {
                    // Той самий net — провідник між двома точками одного вузла.
                    // Шукаємо через який компонент тече струм "через" цей дріт
                    // за допомогою перевірки сусідніх дротів.
                    // Знаходимо дріт-сусід у точці from.anchor з compId-кінцем
                    var ax = conn.from.anchor.x, ay = conn.from.anchor.y;
                    for (var ni = 0; ni < state.connections.length; ni++) {
                        var nb = state.connections[ni];
                        if (nb.id === conn.id) continue;
                        // Сусід торкається нашого from-anchor?
                        var touchFrom = (nb.from.anchor && coordsMatch(nb.from.anchor.x, nb.from.anchor.y, ax, ay));
                        var touchTo   = (nb.to.anchor   && coordsMatch(nb.to.anchor.x,   nb.to.anchor.y,   ax, ay));
                        if (!touchFrom && !touchTo) continue;
                        // Цей сусідній дріт має compId-кінець?
                        if (nb.from.compId !== undefined) {
                            var candI = -(sim.portI[nb.from.compId]?.[nb.from.portIdx] || 0);
                            if (Math.abs(candI) > 1e-9) { I = candI; break; }
                        }
                        if (nb.to.compId !== undefined) {
                            var candI2 = (sim.portI[nb.to.compId]?.[nb.to.portIdx] || 0);
                            if (Math.abs(candI2) > 1e-9) { I = candI2; break; }
                        }
                    }
                } else {
                    // Різні nets — дріт перетинає межу між двома вузлами схеми.
                    // Знаходимо компонент між netA і netB.
                    for (var bi = 0; bi < state.components.length; bi++) {
                        var bc = state.components[bi];
                        if (!sim.portI[bc.id]) continue;
                        var bdef = COMP_DEFS[bc.type];
                        if (bdef.ports.length < 2) continue;
                        var n0 = sim.netOf(bc.id, 0);
                        var n1 = sim.netOf(bc.id, 1);
                        if ((n0 === netA && n1 === netB) || (n0 === netB && n1 === netA)) {
                            var rawI = sim.portI[bc.id][0] || 0;
                            // Знак: якщо струм тече від netA до netB (n0=netA, rawI>0 → витікає з порту 0)
                            I = (n0 === netA) ? -rawI : rawI;
                            break;
                        }
                    }
                }
            }
        }

        _wireCurrent[conn.id] = I;
    });
}
function wireSignedCurrent(conn) {
    if (!isRunning || !sim) return 0;
    return _wireCurrent[conn.id] !== undefined ? _wireCurrent[conn.id] : 0;
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
// junction має 1 порт — внутрішні ребра не потрібні

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
if (conn.from.anchor || conn.to.anchor) return 0;
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
  try { 
    sim = solve(); 
  } catch (e) { 
    console.error('Solver error', e); 
    sim = null; _wireCurrent = {};
  }
  buildWireCurrents();
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
// Annotation toolbar
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

// Вбудовані приклади (compact JSON) ─────────────────── */
window.ExampleLoader = {
    load: function(compactJson) {
        saveUndo(); // додати в стек undo для можливості скасувати
        console.log("ex:",decode(compactJson));
        restore(decode(compactJson));
        return;
    }
};
window.Examples = [
// 1 lamp
'{"components":[{"id":1,"_t":"battery","x":40,"y":300,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":2,"_t":"switch","x":150,"y":300,"_r":0,"_p":{"closed":false},"_s":{}},{"id":3,"_t":"lamp","x":100,"y":180,"_r":0,"_p":{"R":48,"color":"yellow","Runit":1},"_s":{}}],"connections":[{"id":4,"_f":{"_ci":1,"_pi":0},"to":{"_ci":3,"_pi":0},"_w":[{"x":-20,"y":300},{"x":-20,"y":180}]},{"id":5,"_f":{"_ci":1,"_pi":1},"to":{"_ci":2,"_pi":0},"_w":[]},{"id":6,"_f":{"_ci":2,"_pi":1},"to":{"_ci":3,"_pi":1},"_w":[{"x":220,"y":300},{"x":220,"y":180}]}],"junctions":[],"annStrokes":[],"annShapes":[],"nextId":7}',
// 2 lamp
'{"components":[{"id":1,"_t":"battery","x":110,"y":320,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":2,"_t":"switch","x":70,"y":180,"_r":0,"_p":{"closed":false},"_s":{}},{"id":3,"_t":"lamp","x":160,"y":180,"_r":0,"_p":{"R":48,"color":"yellow","Runit":1},"_s":{}},{"id":7,"_t":"lamp","x":160,"y":240,"_r":0,"_p":{"R":48,"color":"yellow","Runit":1},"_s":{}},{"id":8,"_t":"switch","x":70,"y":240,"_r":0,"_p":{"closed":false},"_s":{}}],"connections":[{"id":11,"_f":{"_ci":1,"_pi":0},"to":{"_a":{"x":0,"y":240}},"_w":[{"x":0,"y":320}]},{"id":12,"_f":{"_a":{"x":0,"y":240}},"to":{"_ci":2,"_pi":0},"_w":[{"x":0,"y":180}]},{"id":13,"_f":{"_ci":8,"_pi":0},"to":{"_a":{"x":0,"y":240}},"_w":[]},{"id":14,"_f":{"_ci":2,"_pi":1},"to":{"_ci":3,"_pi":0},"_w":[]},{"id":15,"_f":{"_ci":8,"_pi":1},"to":{"_ci":7,"_pi":0},"_w":[]},{"id":18,"_f":{"_ci":1,"_pi":1},"to":{"_a":{"x":240,"y":240}},"_w":[{"x":240,"y":320}]},{"id":19,"_f":{"_a":{"x":240,"y":240}},"to":{"_ci":3,"_pi":1},"_w":[{"x":240,"y":180}]},{"id":20,"_f":{"_ci":7,"_pi":1},"to":{"_a":{"x":240,"y":240}},"_w":[]}],"junctions":[{"id":10,"x":0,"y":240},{"id":17,"x":240,"y":240}],"annStrokes":[],"annShapes":[],"nextId":21}',
//Ohm law
'{"components":[{"id":1,"_t":"vsource","x":110,"y":320,"_r":0,"_p":{"V":5,"Vmin":0,"Vmax":20,"Vunit":1},"_s":{}},{"id":2,"_t":"resistor","x":110,"y":230,"_r":0,"_p":{"R":220,"Runit":1},"_s":{}},{"id":3,"_t":"voltmeter","x":110,"y":160,"_r":0,"_p":{},"_s":{}},{"id":4,"_t":"ammeter","x":200,"y":230,"_r":0,"_p":{},"_s":{}},{"id":5,"_t":"switch","x":200,"y":320,"_r":0,"_p":{"closed":false},"_s":{}}],"connections":[{"id":6,"_f":{"_ci":1,"_pi":1},"to":{"_ci":5,"_pi":0},"_w":[]},{"id":7,"_f":{"_ci":5,"_pi":1},"to":{"_ci":4,"_pi":1},"_w":[{"x":260,"y":320},{"x":260,"y":230}]},{"id":8,"_f":{"_ci":4,"_pi":0},"to":{"_ci":2,"_pi":1},"_w":[]},{"id":9,"_f":{"_ci":2,"_pi":0},"to":{"_ci":1,"_pi":0},"_w":[{"x":0,"y":230},{"x":0,"y":320}]},{"id":10,"_f":{"_ci":3,"_pi":0},"to":{"_ci":2,"_pi":0},"_w":[{"x":70,"y":160}]},{"id":11,"_f":{"_ci":3,"_pi":1},"to":{"_ci":2,"_pi":1},"_w":[{"x":150,"y":160}]}],"junctions":[],"annStrokes":[],"annShapes":[],"nextId":12}',
// flasher
'{"components":[{"id":1,"_t":"battery","x":10,"y":200,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":26,"_t":"lamp","x":190,"y":220,"_r":0,"_p":{"R":48,"color":"red","Runit":1},"_s":{}},{"id":27,"_t":"lamp","x":190,"y":290,"_r":0,"_p":{"R":48,"color":"green","Runit":1},"_s":{}},{"id":36,"_t":"flasher","x":110,"y":260,"_r":0,"_p":{"_s":1,"tOn":0.5,"tOff":0.5},"_s":{"_flInit":true,"_lastT":732443.48,"_phase":"b","_powered":false}},{"id":50,"_t":"switch","x":60,"y":360,"_r":0,"_p":{"closed":false},"_s":{}}],"connections":[{"id":28,"_f":{"_ci":36,"_pi":2},"to":{"_ci":27,"_pi":0},"_w":[{"x":160,"y":270}]},{"id":29,"_f":{"_ci":36,"_pi":1},"to":{"_ci":26,"_pi":0},"_w":[{"x":160,"y":250}]},{"id":31,"_f":{"_ci":1,"_pi":1},"to":{"_ci":36,"_pi":0},"_w":[{"x":50,"y":260}]},{"id":48,"_f":{"_a":{"x":240,"y":290}},"to":{"_ci":26,"_pi":1},"_w":[{"x":240,"y":220}]},{"id":49,"_f":{"_ci":27,"_pi":1},"to":{"_a":{"x":240,"y":290}},"_w":[]},{"id":51,"_f":{"_ci":1,"_pi":0},"to":{"_ci":50,"_pi":0},"_w":[{"x":-60,"y":200},{"x":-60,"y":360}]},{"id":52,"_f":{"_ci":50,"_pi":1},"to":{"_a":{"x":240,"y":290}},"_w":[{"x":240,"y":360}]}],"junctions":[{"id":46,"x":240,"y":290}],"annStrokes":[],"annShapes":[],"nextId":53}',
// garland
'{"components":[{"id":1,"_t":"lamp","x":-20,"y":220,"_r":0,"_p":{"R":48,"color":"yellow","Runit":1},"_s":{}},{"id":2,"_t":"lamp","x":50,"y":220,"_r":0,"_p":{"R":48,"color":"green","Runit":1},"_s":{}},{"id":3,"_t":"lamp","x":120,"y":220,"_r":0,"_p":{"R":48,"color":"blue","Runit":1},"_s":{}},{"id":4,"_t":"lamp","x":190,"y":220,"_r":0,"_p":{"R":48,"color":"white","Runit":1},"_s":{}},{"id":5,"_t":"lamp","x":-90,"y":220,"_r":0,"_p":{"R":48,"color":"red","Runit":1},"_s":{}},{"id":10,"_t":"battery","x":-80,"y":320,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":11,"_t":"switch","x":50,"y":320,"_r":0,"_p":{"closed":true},"_s":{}}],"connections":[{"id":6,"_f":{"_ci":5,"_pi":1},"to":{"_ci":1,"_pi":0},"_w":[]},{"id":7,"_f":{"_ci":1,"_pi":1},"to":{"_ci":2,"_pi":0},"_w":[]},{"id":8,"_f":{"_ci":2,"_pi":1},"to":{"_ci":3,"_pi":0},"_w":[]},{"id":9,"_f":{"_ci":3,"_pi":1},"to":{"_ci":4,"_pi":0},"_w":[]},{"id":12,"_f":{"_ci":10,"_pi":0},"to":{"_ci":5,"_pi":0},"_w":[{"x":-140,"y":320},{"x":-140,"y":220}]},{"id":13,"_f":{"_ci":10,"_pi":1},"to":{"_ci":11,"_pi":0},"_w":[]},{"id":14,"_f":{"_ci":11,"_pi":1},"to":{"_ci":4,"_pi":1},"_w":[{"x":240,"y":320},{"x":240,"y":220}]}],"junctions":[],"annStrokes":[],"annShapes":[],"nextId":15}',
// buzzer
'{"components":[{"id":1,"_t":"battery","x":100,"y":200,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":11,"_t":"buzzer","x":200,"y":320,"_r":0,"_p":{"R":120,"Runit":1},"_s":{}},{"id":13,"_t":"pushbutton","x":100,"y":320,"_r":0,"_p":{"closed":false,"normallyOpen":true},"_s":{}}],"connections":[{"id":4,"_f":{"_ci":1,"_pi":0},"to":{"_ci":13,"_pi":0},"_w":[{"x":0,"y":200},{"x":0,"y":320}]},{"id":12,"_f":{"_ci":1,"_pi":1},"to":{"_ci":11,"_pi":1},"_w":[{"x":260,"y":200},{"x":260,"y":320}]},{"id":14,"_f":{"_ci":13,"_pi":1},"to":{"_ci":11,"_pi":0},"_w":[]}],"junctions":[],"annStrokes":[],"annShapes":[],"nextId":15}',
// fan
'{"components":[{"id":1,"_t":"battery","x":100,"y":200,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":15,"_t":"fan","x":200,"y":320,"_r":0,"_p":{"R":24,"Runit":1},"_s":{}},{"id":16,"_t":"switch","x":100,"y":320,"_r":0,"_p":{"closed":false},"_s":{}}],"connections":[{"id":4,"_f":{"_ci":1,"_pi":0},"to":{"_ci":16,"_pi":0},"_w":[{"x":0,"y":200},{"x":0,"y":320}]},{"id":12,"_f":{"_ci":1,"_pi":1},"to":{"_ci":15,"_pi":1},"_w":[{"x":260,"y":200},{"x":260,"y":320}]},{"id":14,"_f":{"_ci":16,"_pi":1},"to":{"_ci":15,"_pi":0},"_w":[]}],"junctions":[],"annStrokes":[],"annShapes":[],"nextId":17}',
// fuse
'{"components":[{"id":1,"_t":"battery","x":50,"y":210,"_r":0,"_p":{"V":9},"_s":{}},{"id":2,"_t":"ammeter","x":250,"y":210,"_r":0,"_p":{},"_s":{}},{"id":3,"_t":"resistor","x":170,"y":350,"_r":0,"_p":{"R":1,"Runit":1},"_s":{}},{"id":4,"_t":"voltmeter","x":170,"y":280,"_r":0,"_p":{},"_s":{}},{"id":10,"_t":"fuse","x":140,"y":210,"_r":0,"_p":{"Imax":1,"blown":false},"_s":{}}],"connections":[{"id":6,"_f":{"_ci":1,"_pi":0},"to":{"_ci":3,"_pi":0},"_w":[{"x":-20,"y":350}]},{"id":7,"_f":{"_ci":2,"_pi":1},"to":{"_ci":3,"_pi":1},"_w":[{"x":320,"y":210},{"x":320,"y":350}]},{"id":8,"_f":{"_ci":4,"_pi":0},"to":{"_ci":3,"_pi":0},"_w":[]},{"id":9,"_f":{"_ci":4,"_pi":1},"to":{"_ci":3,"_pi":1},"_w":[]},{"id":11,"_f":{"_ci":1,"_pi":1},"to":{"_ci":10,"_pi":0},"_w":[]},{"id":12,"_f":{"_ci":10,"_pi":1},"to":{"_ci":2,"_pi":0},"_w":[]}],"annStrokes":[],"annShapes":[],"nextId":13}',
// series
'{"components":[{"id":1,"_t":"battery","x":-10,"y":380,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":26,"_t":"resistor","x":50,"y":220,"_r":0,"_p":{"R":220,"Runit":1},"_s":{}},{"id":27,"_t":"ammeter","x":-30,"y":220,"_r":0,"_p":{},"_s":{}},{"id":28,"_t":"ammeter","x":130,"y":220,"_r":0,"_p":{},"_s":{}},{"id":29,"_t":"resistor","x":210,"y":220,"_r":0,"_p":{"R":880,"Runit":1},"_s":{}},{"id":33,"_t":"switch","x":100,"y":380,"_r":0,"_p":{"closed":true},"_s":{}},{"id":34,"_t":"voltmeter","x":50,"y":280,"_r":0,"_p":{},"_s":{}},{"id":35,"_t":"voltmeter","x":210,"y":280,"_r":0,"_p":{},"_s":{}},{"id":41,"_t":"ammeter","x":210,"y":380,"_r":0,"_p":{},"_s":{}},{"id":45,"_t":"voltmeter","x":130,"y":320,"_r":0,"_p":{},"_s":{}}],"connections":[{"id":30,"_f":{"_ci":27,"_pi":1},"to":{"_ci":26,"_pi":0},"_w":[]},{"id":31,"_f":{"_ci":26,"_pi":1},"to":{"_ci":28,"_pi":0},"_w":[]},{"id":32,"_f":{"_ci":28,"_pi":1},"to":{"_ci":29,"_pi":0},"_w":[]},{"id":36,"_f":{"_ci":34,"_pi":0},"to":{"_ci":26,"_pi":0},"_w":[{"x":10,"y":280}]},{"id":37,"_f":{"_ci":34,"_pi":1},"to":{"_ci":26,"_pi":1},"_w":[{"x":90,"y":280}]},{"id":38,"_f":{"_ci":35,"_pi":0},"to":{"_ci":29,"_pi":0},"_w":[{"x":170,"y":280}]},{"id":39,"_f":{"_ci":35,"_pi":1},"to":{"_ci":29,"_pi":1},"_w":[{"x":250,"y":280}]},{"id":40,"_f":{"_ci":33,"_pi":0},"to":{"_ci":1,"_pi":1},"_w":[]},{"id":42,"_f":{"_ci":33,"_pi":1},"to":{"_ci":41,"_pi":0},"_w":[]},{"id":47,"_f":{"_ci":27,"_pi":0},"to":{"_a":{"x":-80,"y":320}},"_w":[{"x":-80,"y":220}]},{"id":48,"_f":{"_a":{"x":-80,"y":320}},"to":{"_ci":1,"_pi":0},"_w":[{"x":-80,"y":380}]},{"id":49,"_f":{"_ci":45,"_pi":0},"to":{"_a":{"x":-80,"y":320}},"_w":[]},{"id":51,"_f":{"_ci":29,"_pi":1},"to":{"_a":{"x":290,"y":320}},"_w":[{"x":290,"y":220}]},{"id":52,"_f":{"_a":{"x":290,"y":320}},"to":{"_ci":41,"_pi":1},"_w":[{"x":290,"y":380}]},{"id":53,"_f":{"_ci":45,"_pi":1},"to":{"_a":{"x":290,"y":320}},"_w":[]}],"junctions":[{"id":46,"x":-80,"y":320},{"id":50,"x":290,"y":320}],"annStrokes":[],"annShapes":[],"nextId":54}',
// paralel
'{"components":[{"id":1,"_t":"battery","x":-40,"y":390,"_r":0,"_p":{"V":9,"Vunit":1},"_s":{}},{"id":2,"_t":"resistor","x":160,"y":220,"_r":0,"_p":{"R":220,"Runit":1},"_s":{}},{"id":3,"_t":"voltmeter","x":160,"y":170,"_r":0,"_p":{},"_s":{}},{"id":4,"_t":"resistor","x":160,"y":330,"_r":0,"_p":{"R":220,"Runit":1},"_s":{}},{"id":5,"_t":"voltmeter","x":160,"y":280,"_r":0,"_p":{},"_s":{}},{"id":6,"_t":"ammeter","x":70,"y":220,"_r":0,"_p":{},"_s":{}},{"id":7,"_t":"ammeter","x":70,"y":330,"_r":0,"_p":{},"_s":{}},{"id":8,"_t":"switch","x":60,"y":390,"_r":0,"_p":{"closed":true},"_s":{}},{"id":9,"_t":"ammeter","x":150,"y":390,"_r":0,"_p":{},"_s":{}},{"id":10,"_t":"voltmeter","x":240,"y":360,"_r":0,"_p":{},"_s":{}}],"connections":[{"id":12,"_f":{"_ci":6,"_pi":1},"to":{"_ci":2,"_pi":0},"_w":[]},{"id":13,"_f":{"_ci":7,"_pi":1},"to":{"_ci":4,"_pi":0},"_w":[]},{"id":14,"_f":{"_ci":4,"_pi":0},"to":{"_ci":5,"_pi":0},"_w":[{"x":120,"y":280}]},{"id":15,"_f":{"_ci":2,"_pi":0},"to":{"_ci":3,"_pi":0},"_w":[{"x":120,"y":170}]},{"id":17,"_f":{"_ci":9,"_pi":0},"to":{"_ci":8,"_pi":1},"_w":[]},{"id":18,"_f":{"_ci":8,"_pi":0},"to":{"_ci":1,"_pi":1},"_w":[]},{"id":20,"_f":{"_ci":6,"_pi":0},"to":{"_a":{"x":40,"y":270}},"_w":[]},{"id":21,"_f":{"_a":{"x":40,"y":270}},"to":{"_ci":7,"_pi":0},"_w":[]},{"id":24,"_f":{"_ci":2,"_pi":1},"to":{"_a":{"x":300,"y":330}},"_w":[{"x":300,"y":220}]},{"id":26,"_f":{"_ci":4,"_pi":1},"to":{"_a":{"x":300,"y":330}},"_w":[]},{"id":27,"_f":{"_ci":5,"_pi":1},"to":{"_ci":4,"_pi":1},"_w":[{"x":200,"y":280}]},{"id":28,"_f":{"_ci":3,"_pi":1},"to":{"_ci":2,"_pi":1},"_w":[{"x":200,"y":170}]},{"id":30,"_f":{"_ci":1,"_pi":0},"to":{"_a":{"x":-100,"y":360}},"_w":[{"x":-100,"y":390}]},{"id":31,"_f":{"_a":{"x":-100,"y":360}},"to":{"_a":{"x":40,"y":270}},"_w":[{"x":-100,"y":270}]},{"id":32,"_f":{"_ci":10,"_pi":0},"to":{"_a":{"x":-100,"y":360}},"_w":[]},{"id":34,"_f":{"_a":{"x":300,"y":330}},"to":{"_a":{"x":300,"y":360}},"_w":[]},{"id":35,"_f":{"_a":{"x":300,"y":360}},"to":{"_ci":9,"_pi":1},"_w":[{"x":300,"y":390}]},{"id":36,"_f":{"_ci":10,"_pi":1},"to":{"_a":{"x":300,"y":360}},"_w":[]}],"junctions":[{"id":19,"x":40,"y":270},{"id":23,"x":300,"y":330},{"id":29,"x":-100,"y":360},{"id":33,"x":300,"y":360}],"annStrokes":[],"annShapes":[],"nextId":37}'
]
// Export PNG
function showSaveImageModal(defaultChecked) {
  // Якщо модальне вікно вже відкрите — нічого не робимо
  if (document.getElementById('save-image-modal')) return;

  const light = isLightTheme();
  const bg = light ? '#f8fafc' : '#1e293b';
  const text = light ? '#0f172a' : '#ffffff';
  const inputBg = light ? '#ffffff' : '#0f172a';
  const inputBorder = light ? '#cbd5e1' : '#475569';
  const inputText = light ? '#0f172a' : '#ffffff';
  const cancelBg = light ? '#e2e8f0' : '#334155';
  const cancelText = light ? '#1e293b' : '#ffffff';
  const overlayBg = light ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)';

  const modal = document.createElement('div');
  modal.id = 'save-image-modal';
  modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:${overlayBg};z-index:10000;display:flex;align-items:center;justify-content:center;`;

  const box = document.createElement('div');
  box.style.cssText = `background:${bg};color:${text};padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,${light ? 0.15 : 0.4});width:340px;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-direction:column;gap:16px;`;

  const title = document.createElement('h3');
  title.textContent = 'Зберегти зображення';
  title.style.cssText = `margin:0;font-size:18px;font-weight:600;color:${text};`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Введіть назву файлу...';
  input.value = 'circuit';
  input.style.cssText = `padding:10px 12px;border:1px solid ${inputBorder};border-radius:6px;background:${inputBg};color:${inputText};font-size:14px;outline:none;`;
  input.onfocus = () => input.style.borderColor = '#3b82f6';
  input.onblur  = () => input.style.borderColor = inputBorder;

  // Чекбокс "Зберегти з анотаціями"
  const cbRow = document.createElement('div');
  cbRow.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:14px;';
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.id = 'save-img-ann-cb'; cb.checked = (defaultChecked !== false);
  cb.style.cssText = 'width:16px;height:16px;cursor:pointer;accent-color:#3b82f6;';
  const cbLabel = document.createElement('label');
  cbLabel.textContent = 'Зберегти з анотаціями';
  cbLabel.style.cursor = 'pointer';
  cbLabel.style.color = text;
  cbLabel.prepend(cb);
  cbRow.appendChild(cbLabel);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:8px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Скасувати';
  cancelBtn.style.cssText = `padding:8px 16px;background:${cancelBg};color:${cancelText};border:none;border-radius:6px;cursor:pointer;font-size:14px;`;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Зберегти';
  saveBtn.style.cssText = `padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;`;

  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(saveBtn);
  box.appendChild(title);
  box.appendChild(input);
  box.appendChild(cbRow);
  box.appendChild(btnContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);

  input.focus();
  input.select();

  function closeModal() { document.body.removeChild(modal); }

  cancelBtn.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') doSave();
    if (e.key === 'Escape') closeModal();
  };

  function doSave() {
    let filename = input.value.trim();
    if (!filename) filename = 'circuit';
    if (!filename.toLowerCase().endsWith('.png')) filename += '.png';
    
    const withAnnotations = document.getElementById('save-img-ann-cb').checked;
    exportPNG(filename, withAnnotations);
    closeModal();
  }

  saveBtn.onclick = doSave;
}

function exportPNG(filename, withAnnotations) {
  // 1. Створюємо ізольований канвас того ж розміру
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  var tCtx = tempCanvas.getContext('2d');

  // 2. Зберігаємо поточні функції та контекст, щоб відновити їх після експорту
  var savedCtx = ctx;
  var origDrawGrid = drawGrid;
  drawGrid = function() {}; // Тимчасово вимикаємо сітку

  // 3. Переключаємо контекст малювання на тимчасовий канвас
  ctx = tCtx;
  var prevAnn = annVisible;
  annVisible = withAnnotations;

  // Тимчасово вимикаємо clearRect, щоб не стерти зафарбований фон
  var origClearRect = tCtx.clearRect.bind(tCtx);
  tCtx.clearRect = function() {};

  // 4. Малюємо фон відповідно до активної теми
  var bgColor = isLightTheme() ? '#f8fafc' : '#0f172a';
  tCtx.fillStyle = bgColor;
  tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // 5. Рендеримо схему (компоненти, дроти, анотації) поверх фону
  draw();

  // 6. Повертаємо оригінальний clearRect
  tCtx.clearRect = origClearRect;

  // 7. Додаємо водяний знак (колір також адаптується до теми)
  tCtx.save();
  tCtx.setTransform(1, 0, 0, 1, 0, 0);
  tCtx.fillStyle = isLightTheme() ? 'rgba(0,0,0,0.4)' : 'rgba(255,160,0,0.6)';
  tCtx.font = (11 * DPR) + 'px sans-serif';
  tCtx.textAlign = 'right';
  tCtx.textBaseline = 'bottom';
  tCtx.fillText('ЕЛЕКТРОКОНСТРУКТОР', tempCanvas.width - 8, tempCanvas.height - 6);
  tCtx.restore();

  // 8. Відновлюємо стан додатка
  annVisible = prevAnn;
  ctx = savedCtx;
  drawGrid = origDrawGrid;

  // 9. Завантажуємо зображення
  var url = tempCanvas.toDataURL('image/png');
  var a = document.createElement('a');
  a.href = url;
  a.download = filename || 'circuit.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  scheduleDraw();
}

// Оновлюємо слухачі подій
on('canvas-export-btn', 'click', function(){ showSaveImageModal(true); });
on('ctx-canvas-export', 'click', function(){ hideCtxMenus(); showSaveImageModal(true); });
on('ctx-canvas-export-clean', 'click', function(){ hideCtxMenus(); showSaveImageModal(false); });

on('btn-print', 'click', printCircuit);
on('ctx-canvas-print', 'click', function(){ hideCtxMenus(); printCircuit(); });

/* ── Print Circuit ──────────────────────────────────────── */
function printCircuit() {
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  var tCtx = tempCanvas.getContext('2d');
  // 1. Зберігаємо поточну тему і примусово вмикаємо світлу для друку
  var wasLight = isLightTheme();
  if (!wasLight) document.body.classList.add('light-theme');
  // 2. Малюємо схему на тимчасовий канвас з "правильними" кольорами
  var savedCtx = ctx;
  ctx = tCtx;
  draw();
  ctx = savedCtx;
  // 3. Відновлюємо оригінальну тему
  if (!wasLight) document.body.classList.remove('light-theme');

  var dataURL = tempCanvas.toDataURL('image/png');
  var printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Браузер заблокував спливаюче вікно. Дозвольте pop-ups для цього сайту, щоб роздрукувати схему.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="utf-8">
      <title>Друк схеми</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
          img { width: 100%; height: auto; }
          .controls { display: none; }
        }
        @media screen {
          body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #e5e7eb; font-family: system-ui, sans-serif; }
          img { max-width: 95vw; max-height: 90vh; box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 6px; background: #fff; padding: 8px; }
          .controls { margin-top: 20px; display: flex; gap: 12px; }
          button { padding: 10px 20px; font-size: 15px; cursor: pointer; border: none; border-radius: 8px; background: #3b82f6; color: white; font-weight: 500; }
          button:hover { background: #2563eb; }
          button.secondary { background: #6b7280; }
          button.secondary:hover { background: #4b5563; }
        }
      </style>
    </head>
    <body>
      <img src="${dataURL}" alt="Електрична схема">
      <div class="controls">
        <button onclick="window.print()">🖨 Роздрукувати</button>
        <button class="secondary" onclick="window.close()">Закрити</button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}


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
conn.from.anchor ? ('anchor:'+conn.from.anchor.x+','+conn.from.anchor.y) : conn.from.compId + ':' + conn.from.portIdx,
conn.to.anchor   ? ('anchor:'+conn.to.anchor.x+','+conn.to.anchor.y)     : conn.to.compId   + ':' + conn.to.portIdx]);
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
checkIsolatedComponents: checkIsolatedComponents,
reset: function(){
state.components.length = 0;
state.connections.length = 0;
state.annStrokes.length = 0;
state.annShapes.length = 0;
state.nextId = 1;
_clearIsolatedFaults();
}
};

// ЗБЕРЕЖЕННЯ / ЗАВАНТАЖЕННЯ СХЕМ
function showSaveModal() {
  if (document.getElementById('save-circuit-modal')) return;

  // Динамічні кольори залежно від теми
  const light = isLightTheme();
  const bg = light ? '#f8fafc' : '#1e293b';
  const text = light ? '#0f172a' : '#ffffff';
  const inputBg = light ? '#ffffff' : '#0f172a';
  const inputBorder = light ? '#cbd5e1' : '#475569';
  const inputText = light ? '#0f172a' : '#ffffff';
  const cancelBg = light ? '#e2e8f0' : '#334155';
  const cancelText = light ? '#1e293b' : '#ffffff';
  const saveBg = '#3b82f6';
  const saveText = '#ffffff';
  const overlayBg = light ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)';

  const modal = document.createElement('div');
  modal.id = 'save-circuit-modal';
  modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:${overlayBg};z-index:10000;display:flex;align-items:center;justify-content:center;`;

  const box = document.createElement('div');
  box.style.cssText = `background:${bg};color:${text};padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,${light ? 0.15 : 0.4});width:340px;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-direction:column;gap:16px;`;

  const title = document.createElement('h3');
  title.textContent = 'Зберегти схему';
  title.style.cssText = `margin:0;font-size:18px;font-weight:600;color:${text};`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Введіть назву схеми...';
  input.value = 'circuit';
  input.style.cssText = `padding:10px 12px;border:1px solid ${inputBorder};border-radius:6px;background:${inputBg};color:${inputText};font-size:14px;outline:none;transition:border-color 0.2s;`;
  input.onfocus = () => input.style.borderColor = '#3b82f6';
  input.onblur  = () => input.style.borderColor = inputBorder;

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:8px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Скасувати';
  cancelBtn.style.cssText = `padding:8px 16px;background:${cancelBg};color:${cancelText};border:none;border-radius:6px;cursor:pointer;font-size:14px;`;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Зберегти';
  saveBtn.style.cssText = `padding:8px 16px;background:${saveBg};color:${saveText};border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;`;

  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(saveBtn);
  box.appendChild(title);
  box.appendChild(input);
  box.appendChild(btnContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);

  input.focus();
  input.select();

  function closeModal() { 
    document.body.removeChild(modal); 
  }

  cancelBtn.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') doSave();
    if (e.key === 'Escape') closeModal();
  };

  function doSave() {
    let filename = input.value.trim();
    if (!filename) filename = 'circuit';
    if (!filename.toLowerCase().endsWith('.ecd')) filename += '.ecd';
    exportCircuit(filename);
    closeModal();
  }

  saveBtn.onclick = doSave;
}

function exportCircuit(filename) {
  const json = snapshot();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'circuit.ecd';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// КНОПКИ
window.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('btn-save');
  const loadBtn = document.getElementById('btn-load');
  const fileInput = document.getElementById('file-load');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', showSaveModal);
  }
  if (loadBtn && fileInput) {
    fileInput.setAttribute('accept', '.ecd');
    loadBtn.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) { importCircuit(file); }
      fileInput.value = '';
    });
  }
});
function importCircuit(file) {
const reader = new FileReader();
reader.onload = function(e) {
try {
  var text = e.target.result;
  var parsed = JSON.parse(text);
  if (!parsed._ecd || parsed._ecd !== 'Electrical Circuit Designer') {
    alert('Файл не належить Electrical Circuit Designer і не може бути відкритий.');
    return;
  }
  restore(text);
} catch(err) {
  console.error(err);
  alert('Помилка завантаження схеми');
}
};
reader.readAsText(file);
}

/* ── Керування кнопками редагування під час симуляції ───── */
function updateEditButtonsVisibility() {   
    const buttonsToToggle = [
        'btn-undo',
        'btn-redo',
        'btn-rotate',
        'btn-delete',
        'btn-clear',
        'btn-annotate',
        'btn-save',
        'btn-load',
        'btn-print',
        'canvas-export-btn'
    ];

    buttonsToToggle.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = isRunning  ? 'none' : '';
        }
    });
}
// Відновлення упакованого json
function decode(text) {
    const reverseDictionary = {
        "_p": "props",
        "_t": "type",
        "_w": "waypoints",
        "_ci": "compId",
        "_pi": "portIdx",
        "_s": "state",
        "_r": "rot",
        "_a": "anchor",
        "_f": "from"
    };
    
    let result = text;
    
    for (const [code, original] of Object.entries(reverseDictionary)) {
        // Відновлюємо код назад у слово в подвійних лапках
        const regex = new RegExp(`"${code}"`, 'g');
        result = result.replace(regex, `"${original}"`);
    }
    
    return result;
}

/* ── Init ────────────────────────────────────────────────── */
// VSSource overlay sliders 
// Inject CSS for vsource slider thumb
(function() {
  var st = document.createElement('style');
  st.textContent = [
    '.vsource-sld::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#ffa000;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5);cursor:pointer;}',
    '.vsource-sld::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#ffa000;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5);cursor:pointer;border:none;}',
    '.vsource-slider-wrap{transition:opacity 0.15s;}',
  ].join('');
  document.head.appendChild(st);
})();
var _vsourceSliders = {}; // compId → DOM element

function getOrCreateVsourceSlider(c) {
  if (_vsourceSliders[c.id]) return _vsourceSliders[c.id];

  var wrap = document.createElement('div');
  wrap.className = 'vsource-slider-wrap';
  wrap.setAttribute('data-vsid', c.id);
  wrap.style.cssText = [
    'position:absolute',
    'display:flex',
    'align-items:center',
    'pointer-events:auto',
    'z-index:200',
    'transform:translate(-50%,-50%)',
    'user-select:none'
  ].join(';');

  var sld = document.createElement('input');
  sld.type = 'range';
  sld.className = 'vsource-sld';
  sld.style.cssText = [
    'width:68px',
    'height:6px',
    'cursor:pointer',
    '-webkit-appearance:none',
    'appearance:none',
    'background:linear-gradient(to right,#ffa000 0%,#ffa000 50%,rgba(255,160,0,0.25) 50%,rgba(255,160,0,0.25) 100%)',
    'border-radius:3px',
    'outline:none',
    'margin:0'
  ].join(';');

  function updateSliderBg() {
    var mn = parseFloat(sld.min)||0, mx = parseFloat(sld.max)||20;
    var pct = mx > mn ? ((parseFloat(sld.value)-mn)/(mx-mn)*100).toFixed(1) : 50;
    sld.style.background = 'linear-gradient(to right,#ffa000 0%,#ffa000 '+pct+'%,rgba(255,160,0,0.25) '+pct+'%,rgba(255,160,0,0.25) 100%)';
  }

  function syncFromComp() {
    var mn = c.props.Vmin != null ? c.props.Vmin : 0;
    var mx = c.props.Vmax != null ? c.props.Vmax : 20;
    sld.min = mn; sld.max = mx;
    sld.step = mx - mn <= 5 ? 0.1 : (mx - mn <= 20 ? 0.5 : 1);
    sld.value = Math.max(mn, Math.min(mx, c.props.V || 0));
    updateSliderBg();
  }

  syncFromComp();
  wrap._syncFromComp = syncFromComp;

  sld.addEventListener('input', function(e) {
    e.stopPropagation();
    var v = parseFloat(sld.value);
    if (isNaN(v)) return;
    c.props.V = v;
    updateSliderBg();
    markDirty();
    scheduleDraw();
    renderProps();
  });

  // Prevent canvas pan/drag from firing on slider
  sld.addEventListener('mousedown', function(e) { e.stopPropagation(); });
  sld.addEventListener('touchstart', function(e) { e.stopPropagation(); }, {passive:true});

  wrap.appendChild(sld);
  if (canvasCard) canvasCard.appendChild(wrap);
  _vsourceSliders[c.id] = wrap;
  return wrap;
}

function removeVsourceSlider(compId) {
  var el = _vsourceSliders[compId];
  if (el && el.parentNode) el.parentNode.removeChild(el);
  delete _vsourceSliders[compId];
}

function updateVsourceSliders() {
  var seen = {};
  state.components.forEach(function(c) {
    if (c.type !== 'vsource') return;
    seen[c.id] = true;
    var wrap = getOrCreateVsourceSlider(c);
    // Sync range in case Vmin/Vmax changed
    if (wrap._syncFromComp) wrap._syncFromComp();
    // Position: centre of component in CSS pixels relative to canvasCard
    var cardRect = canvasCard ? canvasCard.getBoundingClientRect() : {left:0,top:0};
    var canvRect = canvas ? canvas.getBoundingClientRect() : cardRect;
    var sx = toSX(c.x) + (canvRect.left - cardRect.left);
    var sy = toSY(c.y) + (canvRect.top  - cardRect.top);
    // Always place slider directly below the component centre in screen space, never rotated
    var sliderOffsetY = 22 * viewScale + 14;
    wrap.style.left = sx + 'px';
    wrap.style.top  = (sy + sliderOffsetY) + 'px';
    wrap.style.display = '';
    wrap.style.transform = 'translate(-50%,-50%)';
  });

  // Remove sliders for deleted vsource components
  Object.keys(_vsourceSliders).forEach(function(id) {
    if (!seen[+id]) removeVsourceSlider(+id);
  });
}

// Clean up when component is deleted
var _origDeleteSelected = null;

drawPaletteIcons();
resizeCanvas();
viewOffX = 40; viewOffY = 40;

// Auto-load example via ?example=N (default: 1)
    try {
        var params = new URLSearchParams(window.location.search);
        // Якщо параметр відсутній або некоректний → використовуємо 1
        var index = parseInt(params.get('example'), 10) || 1;
        // Обмеження діапазону
        index = Math.min(Math.max(index, 1), window.Examples.length);
        // Перевірка доступності loader
        if (!window.ExampleLoader?.load || !window.Examples?.length) {
            console.warn('ExampleLoader або Examples недоступні');
            return;
        }
        // Завантаження після ініціалізації інтерфейсу
        setTimeout(function () {
            window.ExampleLoader.load(window.Examples[index - 1]);
            fitAll?.();

            console.log('Loaded example #' + index);
        }, 50);

    } catch (e) {
        console.warn('Failed to load example:', e);
    }
scheduleDraw();
window.scheduleDraw = scheduleDraw;
window.redrawCanvas = draw;
})();
