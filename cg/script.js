(function() {
const CANVAS_W = 1024, CANVAS_H = 768;
const bgCanvas = document.getElementById('bgCanvas');
const gridCanvas = document.getElementById('gridCanvas');
const axisCanvas = document.getElementById('axisCanvas');
const linesCanvas = document.getElementById('linesCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const hitCanvas = document.getElementById('hitCanvas');
const codeEditor = document.getElementById('codeEditor');
const langSelect = document.getElementById('langSelect');
const editorFilename = document.getElementById('editorFilename');
const liveCoord = document.getElementById('liveCoord');
const modeBadge = document.getElementById('modeBadge');
const editStatus = document.getElementById('editStatus');
const xMinIn = document.getElementById('xMin'), xMaxIn = document.getElementById('xMax');
const yMinIn = document.getElementById('yMin'), yMaxIn = document.getElementById('yMax');
const btnClear = document.getElementById('btnClear');
const btnCopy = document.getElementById('btnCopy');

// Глобальний стан
let figures = [];
let nextId = 1;
let bgImage = null;
let bgOpacity = 0.25;
let drawMode = 'line';
let currentLineColor = '#d42020';
let currentFillColor = null;
// Стан малювання
let tempPoints = [];
let rectStart = null;
let lineActivePoint = null;
// Редагування
let editingFigureId = null;
let editingPointIndex = null;
let editingRectCorner = null;
let editingEllipseHandle = null;
let isEditing = false;
let isDragging = false;
let dragStartWorld = null;
let dragCurrentWorld = { x: 0, y: 0 };
let mouseOnCanvas = false;
// Межі
// xMax/yMax auto-computed: range = draw area in pixels (1:1 scale by default)
// They update when xMin/yMin change (range is preserved)
let W = { xMin: 0, xMax: 800, yMin: 0, yMax: 600 };
function initBounds() {
  const dw = drawW(), dh = drawH();
  W.xMax = W.xMin + dw;
  W.yMax = W.yMin + dh;
}
const PAD = { left: 46, top: 22, bottom: 22, right: 46 };
function drawW() { return CANVAS_W - PAD.left - PAD.right; }
function drawH() { return CANVAS_H - PAD.top - PAD.bottom; }
function w2c(wx, wy) {
  const dw = drawW(), dh = drawH();
  const dx = (W.xMax - W.xMin) || 1;
  const dy = (W.yMax - W.yMin) || 1;
  return {
    x: PAD.left + ((wx - W.xMin) / dx) * dw,
    y: PAD.top + ((wy - W.yMin) / dy) * dh
  };
}
function c2w(cx, cy) {
  const dw = drawW(), dh = drawH();
  const dx = W.xMax - W.xMin;
  const dy = W.yMax - W.yMin;
  let wx = W.xMin + ((cx - PAD.left) / dw) * dx;
  let wy = W.yMin + ((cy - PAD.top) / dh) * dy;
  wx = Math.min(Math.max(wx, W.xMin), W.xMax);
  wy = Math.min(Math.max(wy, W.yMin), W.yMax);
  return { x: wx, y: wy };
}
function niceStep(range) {
  if (isNaN(range) || range <= 0) return 100;
  let raw = range / 6;
  let mag = Math.pow(10, Math.floor(Math.log10(raw)));
  if (mag === 0) mag = 1;
  let n = raw / mag;
  if (n < 1.5) return mag;
  if (n < 3.5) return 2 * mag;
  if (n < 7.5) return 5 * mag;
  return 10 * mag;
}
function roundW(p) { return { x: Math.round(p.x), y: Math.round(p.y) }; }

// Генерація коду
function hexToRgb(hex) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return {r,g,b};
}
const LANG_FILENAMES = {
  canvas: 'drawing.js', p5: 'sketch.js',
  tkinter: 'drawing.py', simplegraphics: 'drawing.py', pygame: 'drawing.py',
  svg: 'drawing.svg'
};

function genCanvas(figures) {
  if (!figures.length) return '';
  let code = 'const canvas = document.getElementById("canvas");\nconst ctx = canvas.getContext("2d");\n\n';
  let lastStroke = null, lastFill = null;
  for (let fig of figures) {
    let stroke = fig.lineColor, fill = fig.fillColor || null;
    if (stroke !== lastStroke) { code += `ctx.strokeStyle = "${stroke}";\n`; lastStroke = stroke; }
    if (fill !== lastFill) { code += fill ? `ctx.fillStyle = "${fill}";\n` : `ctx.fillStyle = "transparent";\n`; lastFill = fill; }
    if (fig.type === 'line') {
      let p=fig.points;
      code += `ctx.beginPath();\nctx.moveTo(${p[0].x}, ${p[0].y});\nctx.lineTo(${p[1].x}, ${p[1].y});\nctx.stroke();\n`;
    } else if (fig.type === 'polyline') {
      let p=fig.points;
      code += `ctx.beginPath();\nctx.moveTo(${p[0].x}, ${p[0].y});\n`;
      for (let i=1;i<p.length;i++) code += `ctx.lineTo(${p[i].x}, ${p[i].y});\n`;
      code += `ctx.stroke();\n`;
    } else if (fig.type === 'polygon') {
      let p=fig.points;
      code += `ctx.beginPath();\nctx.moveTo(${p[0].x}, ${p[0].y});\n`;
      for (let i=1;i<p.length;i++) code += `ctx.lineTo(${p[i].x}, ${p[i].y});\n`;
      code += `ctx.closePath();\n`;
      if (fill) code += `ctx.fill();\n`;
      code += `ctx.stroke();\n`;
    } else if (fig.type === 'rect') {
      if (fill) code += `ctx.fillRect(${fig.x}, ${fig.y}, ${fig.w}, ${fig.h});\n`;
      code += `ctx.strokeRect(${fig.x}, ${fig.y}, ${fig.w}, ${fig.h});\n`;
    } else if (fig.type === 'ellipse') {
      code += `ctx.beginPath();\nctx.ellipse(${fig.cx}, ${fig.cy}, ${fig.rx}, ${fig.ry}, 0, 0, Math.PI*2);\n`;
      if (fill) code += `ctx.fill();\n`;
      code += `ctx.stroke();\n`;
    }
    code += '\n';
  }
  return code.trimEnd();
}
function genP5(figures) {
  if (!figures.length) return '';
  let code = 'function setup() {\n  createCanvas(800, 600);\n  background(255);\n}\n\nfunction draw() {\n';
  let lastStroke = null, lastFill = null;
  for (let fig of figures) {
    let stroke = fig.lineColor, fill = fig.fillColor || null;
    let {r:sr,g:sg,b:sb} = hexToRgb(stroke);
    if (stroke !== lastStroke) { code += `stroke(${sr}, ${sg}, ${sb});\n`; lastStroke = stroke; }
    if (fill !== lastFill) {
      if (fill) { let {r,g,b}=hexToRgb(fill); code += `fill(${r}, ${g}, ${b});\n`; }
      else code += `noFill();\n`;
      lastFill = fill;
    }
    if (fig.type === 'line') {
      let p=fig.points; code += `line(${p[0].x}, ${p[0].y}, ${p[1].x}, ${p[1].y});\n`;
    } else if (fig.type === 'polyline') {
      code += `beginShape();\n`;
      for (let pt of fig.points) code += `vertex(${pt.x}, ${pt.y});\n`;
      code += `endShape();\n`;
    } else if (fig.type === 'polygon') {
      code += `beginShape();\n`;
      for (let pt of fig.points) code += `vertex(${pt.x}, ${pt.y});\n`;
      code += `endShape(CLOSE);\n`;
    } else if (fig.type === 'rect') {
      code += `rect(${fig.x}, ${fig.y}, ${fig.w}, ${fig.h});\n`;
    } else if (fig.type === 'ellipse') {
      code += `ellipse(${fig.cx}, ${fig.cy}, ${fig.rx*2}, ${fig.ry*2});\n`;
    }
    code += '\n';
  }
  code += '}\n';
  return code.trimEnd();
}
function genTkinter(figures) {
  if (!figures.length) return '';
  let code = 'import tkinter as tk\n\nroot = tk.Tk()\ncanvas = tk.Canvas(root, width=800, height=600, bg="white")\ncanvas.pack()\n\n';
  for (let fig of figures) {
    let outline = fig.lineColor, fill = fig.fillColor || '';
    if (fig.type === 'line') {
      let p=fig.points;
      code += `canvas.create_line(${p[0].x}, ${p[0].y}, ${p[1].x}, ${p[1].y}, fill="${outline}")\n`;
    } else if (fig.type === 'polyline') {
      let pts = fig.points.map(p => `${p.x}, ${p.y}`).join(', ');
      code += `canvas.create_line(${pts}, fill="${outline}")\n`;
    } else if (fig.type === 'polygon') {
      let pts = fig.points.map(p => `${p.x}, ${p.y}`).join(', ');
      let fa = fill ? `"${fill}"` : '""';
      code += `canvas.create_polygon(${pts}, outline="${outline}", fill=${fa})\n`;
    } else if (fig.type === 'rect') {
      let fa = fill ? `"${fill}"` : '""';
      code += `canvas.create_rectangle(${fig.x}, ${fig.y}, ${fig.x+fig.w}, ${fig.y+fig.h}, outline="${outline}", fill=${fa})\n`;
    } else if (fig.type === 'ellipse') {
      let fa = fill ? `"${fill}"` : '""';
      code += `canvas.create_oval(${fig.cx-fig.rx}, ${fig.cy-fig.ry}, ${fig.cx+fig.rx}, ${fig.cy+fig.ry}, outline="${outline}", fill=${fa})\n`;
    }
  }
  code += '\nroot.mainloop()\n';
  return code.trimEnd();
}
function genSimpleGraphics(figures) {
  if (!figures.length) return '';
  let code = 'from SimpleGraphics import *\n\n';
  let lastOutline = null, lastFill = null;
  for (let fig of figures) {
    let outline = fig.lineColor, fill = fig.fillColor || 'transparent';
    if (outline !== lastOutline) { code += `setOutline("${outline}")\n`; lastOutline = outline; }
    if (fill !== lastFill) { code += `setFill("${fill}")\n`; lastFill = fill; }
    if (fig.type === 'line') {
      let p=fig.points; code += `line(${p[0].x}, ${p[0].y}, ${p[1].x}, ${p[1].y})\n`;
    } else if (fig.type === 'polyline') {
      let pts = fig.points.map(p => `${p.x}, ${p.y}`).join(', ');
      code += `lines(${pts})\n`;
    } else if (fig.type === 'polygon') {
      let pts = fig.points.map(p => `${p.x}, ${p.y}`).join(', ');
      code += `polygon(${pts})\n`;
    } else if (fig.type === 'rect') {
      code += `rect(${fig.x}, ${fig.y}, ${fig.w}, ${fig.h})\n`;
    } else if (fig.type === 'ellipse') {
      code += `ellipse(${fig.cx}, ${fig.cy}, ${fig.rx}, ${fig.ry})\n`;
    }
  }
  return code.trimEnd();
}
function genPygame(figures) {
  if (!figures.length) return '';
  let code = 'import pygame\n\npygame.init()\nscreen = pygame.display.set_mode((800, 600))\nscreen.fill((255, 255, 255)) \n\n';
  for (let fig of figures) {
    let {r:sr,g:sg,b:sb} = hexToRgb(fig.lineColor);
    let sc = `(${sr}, ${sg}, ${sb})`;
    let fc = fig.fillColor ? (() => { let {r,g,b}=hexToRgb(fig.fillColor); return `(${r}, ${g}, ${b})`; })() : null;
    if (fig.type === 'line') {
      let p=fig.points;
      code += `pygame.draw.line(screen, ${sc}, (${p[0].x}, ${p[0].y}), (${p[1].x}, ${p[1].y}))\n`;
    } else if (fig.type === 'polyline') {
      let pts = fig.points.map(p => `(${p.x}, ${p.y})`).join(', ');
      code += `pygame.draw.lines(screen, ${sc}, False, [${pts}])\n`;
    } else if (fig.type === 'polygon') {
      let pts = fig.points.map(p => `(${p.x}, ${p.y})`).join(', ');
      code += `pygame.draw.polygon(screen, ${fc||sc}, [${pts}])\n`;
      if (fc) code += `pygame.draw.polygon(screen, ${sc}, [${pts}], 1)\n`;
    } else if (fig.type === 'rect') {
      code += `pygame.draw.rect(screen, ${fc||sc}, (${fig.x}, ${fig.y}, ${fig.w}, ${fig.h}))\n`;
      if (fc) code += `pygame.draw.rect(screen, ${sc}, (${fig.x}, ${fig.y}, ${fig.w}, ${fig.h}), 1)\n`;
    } else if (fig.type === 'ellipse') {
      code += `pygame.draw.ellipse(screen, ${fc||sc}, (${fig.cx-fig.rx}, ${fig.cy-fig.ry}, ${fig.rx*2}, ${fig.ry*2}))\n`;
      if (fc) code += `pygame.draw.ellipse(screen, ${sc}, (${fig.cx-fig.rx}, ${fig.cy-fig.ry}, ${fig.rx*2}, ${fig.ry*2}), 1)\n`;
    }
  }
  code += '\npygame.display.flip()\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n pygame.quit()\n';
  return code.trimEnd();
}

function genSVG(figures) {
  if (!figures.length) return '';
  let code = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">\n`;
  for (let fig of figures) {
    let stroke = fig.lineColor;
    let fill = fig.fillColor || 'none';
    let attrs = ` stroke="${stroke}" fill="${fill}"`;
    if (fig.type === 'line') {
      let p = fig.points;
      code += `  <line x1="${p[0].x}" y1="${p[0].y}" x2="${p[1].x}" y2="${p[1].y}"${attrs} />\n`;
    } else if (fig.type === 'polyline') {
      let pts = fig.points.map(p => `${p.x},${p.y}`).join(' ');
      code += `  <polyline points="${pts}"${attrs} />\n`;
    } else if (fig.type === 'polygon') {
      let pts = fig.points.map(p => `${p.x},${p.y}`).join(' ');
      code += `  <polygon points="${pts}"${attrs} />\n`;
    } else if (fig.type === 'rect') {
      code += `  <rect x="${fig.x}" y="${fig.y}" width="${fig.w}" height="${fig.h}"${attrs} />\n`;
    } else if (fig.type === 'ellipse') {
      code += `  <ellipse cx="${fig.cx}" cy="${fig.cy}" rx="${fig.rx}" ry="${fig.ry}"${attrs} />\n`;
    }
  }
  code += `</svg>`;
  return code;
}

function regenerateCode() {
  const lang = langSelect ? langSelect.value : 'canvas';
  let code = '';
  if (lang === 'canvas') code = genCanvas(figures);
  else if (lang === 'p5') code = genP5(figures);
  else if (lang === 'tkinter') code = genTkinter(figures);
  else if (lang === 'simplegraphics') code = genSimpleGraphics(figures);
  else if (lang === 'pygame') code = genPygame(figures);
  else if (lang === 'svg') code = genSVG(figures);
  
  codeEditor.value = code;
  codeEditor.scrollTop = codeEditor.scrollHeight;
  if (editorFilename) editorFilename.textContent = LANG_FILENAMES[lang] || 'drawing.js';
}

function updateFigure(fig) {
  let idx = figures.findIndex(f => f.id === fig.id);
  if (idx !== -1) figures[idx] = fig;
  regenerateCode();
  redrawAll();
}
function addFigure(fig) {
  fig.id = nextId++;
  figures.push(fig);
  regenerateCode();
  redrawAll();
  return fig;
}

// Пошук точки для редагування
function findHitPoint(world, threshold = 8) {
  for (let fig of figures) {
    if (fig.type === 'line' || fig.type === 'polyline' || fig.type === 'polygon') {
      for (let i = 0; i < fig.points.length; i++) {
        let p = fig.points[i];
        let cp = w2c(p.x, p.y);
        let test = w2c(world.x, world.y);
        if (Math.hypot(cp.x - test.x, cp.y - test.y) < threshold) return { fig, type: 'point', pointIdx: i };
      }
    } else if (fig.type === 'rect') {
      let corners = [
        { x: fig.x, y: fig.y, corner: 'tl' },
        { x: fig.x + fig.w, y: fig.y, corner: 'tr' },
        { x: fig.x, y: fig.y + fig.h, corner: 'bl' },
        { x: fig.x + fig.w, y: fig.y + fig.h, corner: 'br' }
      ];
      for (let c of corners) {
        let cp = w2c(c.x, c.y);
        let test = w2c(world.x, world.y);
        if (Math.hypot(cp.x - test.x, cp.y - test.y) < threshold) return { fig, type: 'rectCorner', corner: c.corner };
      }
    } else if (fig.type === 'ellipse') {
      let handles = [
        { x: fig.cx - fig.rx, y: fig.cy, handle: 'w' },
        { x: fig.cx + fig.rx, y: fig.cy, handle: 'e' },
        { x: fig.cx, y: fig.cy - fig.ry, handle: 'n' },
        { x: fig.cx, y: fig.cy + fig.ry, handle: 's' }
      ];
      for (let h of handles) {
        let cp = w2c(h.x, h.y);
        let test = w2c(world.x, world.y);
        if (Math.hypot(cp.x - test.x, cp.y - test.y) < threshold) return { fig, type: 'ellipseHandle', handle: h.handle };
      }
      let center = w2c(fig.cx, fig.cy);
      let test = w2c(world.x, world.y);
      if (Math.hypot(center.x - test.x, center.y - test.y) < threshold) return { fig, type: 'ellipseCenter' };
    }
  }
  return null;
}

function applyEdit(worldDelta) {
  if (!isEditing) return;
  let fig = figures.find(f => f.id === editingFigureId);
  if (!fig) { cancelEdit(); return; }
  
  if (fig.type === 'line' || fig.type === 'polyline' || fig.type === 'polygon') {
    let pt = fig.points[editingPointIndex];
    pt.x += worldDelta.x; pt.y += worldDelta.y;
    pt.x = Math.min(Math.max(pt.x, W.xMin), W.xMax);
    pt.y = Math.min(Math.max(pt.y, W.yMin), W.yMax);
    pt.x = Math.round(pt.x);
    pt.y = Math.round(pt.y);
    updateFigure(fig);
  } else if (fig.type === 'rect') {
    let oldX = fig.x, oldY = fig.y, oldW = fig.w, oldH = fig.h;
    if (editingRectCorner === 'tl') { fig.x += worldDelta.x; fig.y += worldDelta.y; fig.w -= worldDelta.x; fig.h -= worldDelta.y; }
    else if (editingRectCorner === 'tr') { fig.y += worldDelta.y; fig.w += worldDelta.x; fig.h -= worldDelta.y; }
    else if (editingRectCorner === 'bl') { fig.x += worldDelta.x; fig.w -= worldDelta.x; fig.h += worldDelta.y; }
    else if (editingRectCorner === 'br') { fig.w += worldDelta.x; fig.h += worldDelta.y; }
    if (fig.w < 1) { fig.w = 1; if (editingRectCorner === 'tl' || editingRectCorner === 'bl') fig.x = oldX + oldW - 1; }
    if (fig.h < 1) { fig.h = 1; if (editingRectCorner === 'tl' || editingRectCorner === 'tr') fig.y = oldY + oldH - 1; }
    fig.x = Math.min(Math.max(fig.x, W.xMin), W.xMax - fig.w);
    fig.y = Math.min(Math.max(fig.y, W.yMin), W.yMax - fig.h);
    fig.x = Math.round(fig.x);
    fig.y = Math.round(fig.y);
    fig.w = Math.round(fig.w);
    fig.h = Math.round(fig.h);
    updateFigure(fig);
  } else if (fig.type === 'ellipse') {
    if (editingEllipseHandle === 'w') { let n=fig.rx-worldDelta.x; if(n>=2){fig.rx=n;fig.cx-=worldDelta.x/2;} }
    else if (editingEllipseHandle === 'e') { let n=fig.rx+worldDelta.x; if(n>=2){fig.rx=n;fig.cx+=worldDelta.x/2;} }
    else if (editingEllipseHandle === 'n') { let n=fig.ry-worldDelta.y; if(n>=2){fig.ry=n;fig.cy-=worldDelta.y/2;} }
    else if (editingEllipseHandle === 's') { let n=fig.ry+worldDelta.y; if(n>=2){fig.ry=n;fig.cy+=worldDelta.y/2;} }
    else if (editingEllipseHandle === 'center') { fig.cx += worldDelta.x; fig.cy += worldDelta.y; }
    fig.cx = Math.min(Math.max(fig.cx, W.xMin + fig.rx), W.xMax - fig.rx);
    fig.cy = Math.min(Math.max(fig.cy, W.yMin + fig.ry), W.yMax - fig.ry);
    fig.cx = Math.round(fig.cx);
    fig.cy = Math.round(fig.cy);
    fig.rx = Math.round(fig.rx);
    fig.ry = Math.round(fig.ry);
    updateFigure(fig);
  }
}

function startEdit(hit) {
  cancelEdit();
  editingFigureId = hit.fig.id;
  if (hit.type === 'point') {
    editingPointIndex = hit.pointIdx; isEditing = true;
    editStatus.innerText = `✏️ Редагування точки ${hit.pointIdx+1} фігури #${hit.fig.id}`;
  } else if (hit.type === 'rectCorner') {
    editingRectCorner = hit.corner; isEditing = true;
    editStatus.innerText = `✏️ Редагування кута прямокутника #${hit.fig.id}`;
  } else if (hit.type === 'ellipseHandle') {
    editingEllipseHandle = hit.handle; isEditing = true;
    editStatus.innerText = `✏️ Редагування еліпса #${hit.fig.id}`;
  } else if (hit.type === 'ellipseCenter') {
    editingEllipseHandle = 'center'; isEditing = true;
    editStatus.innerText = `✏️ Переміщення еліпса #${hit.fig.id}`;
  }
  modeBadge.innerText = `✏️ РЕДАГУВАННЯ`;
  redrawAll();
}
function cancelEdit() {
  editingFigureId = null; editingPointIndex = null; editingRectCorner = null; editingEllipseHandle = null;
  isEditing = false;
  editStatus.innerText = ` Клацініть по вершині/куту для редагування`;
  let modeNames = { line: '📏 Лінія', polyline: '📈 Ламана', polygon: '🔺 Багатокутник', rect: '📐 Прямокутник', ellipse: '⚪ Еліпс' };
  modeBadge.innerText = modeNames[drawMode] || drawMode;
  redrawAll();
}

// Малювання
function drawGridAndAxes() {
  const gCtx = gridCanvas.getContext('2d'); gCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const aCtx = axisCanvas.getContext('2d'); aCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const left = PAD.left, right = CANVAS_W - PAD.right, top = PAD.top, bottom = CANVAS_H - PAD.bottom;
  gCtx.save(); gCtx.beginPath(); gCtx.rect(left, top, right - left, bottom - top); gCtx.clip();
  const STEP_MINOR = 10, STEP_MAJOR = 100;

  // Minor grid (every 10)
  gCtx.strokeStyle = 'rgba(80,100,180,0.10)'; gCtx.lineWidth = 0.5;
  for (let x = Math.ceil(W.xMin / STEP_MINOR) * STEP_MINOR; x <= W.xMax; x += STEP_MINOR) {
    if (x % STEP_MAJOR === 0) continue; // drawn below
    let cx = w2c(x, W.yMin).x; gCtx.beginPath(); gCtx.moveTo(cx, top); gCtx.lineTo(cx, bottom); gCtx.stroke();
  }
  for (let y = Math.ceil(W.yMin / STEP_MINOR) * STEP_MINOR; y <= W.yMax; y += STEP_MINOR) {
    if (y % STEP_MAJOR === 0) continue;
    let cy = w2c(W.xMin, y).y; gCtx.beginPath(); gCtx.moveTo(left, cy); gCtx.lineTo(right, cy); gCtx.stroke();
  }

  // Major grid (every 100)
  gCtx.strokeStyle = 'rgba(80,100,180,0.22)'; gCtx.lineWidth = 0.9;
  for (let x = Math.ceil(W.xMin / STEP_MAJOR) * STEP_MAJOR; x <= W.xMax; x += STEP_MAJOR) {
    let cx = w2c(x, W.yMin).x; gCtx.beginPath(); gCtx.moveTo(cx, top); gCtx.lineTo(cx, bottom); gCtx.stroke();
  }
  for (let y = Math.ceil(W.yMin / STEP_MAJOR) * STEP_MAJOR; y <= W.yMax; y += STEP_MAJOR) {
    let cy = w2c(W.xMin, y).y; gCtx.beginPath(); gCtx.moveTo(left, cy); gCtx.lineTo(right, cy); gCtx.stroke();
  }

  gCtx.restore();
  aCtx.strokeStyle = '#2c4a7c'; aCtx.lineWidth = 1.5; aCtx.beginPath(); aCtx.rect(left, top, right - left, bottom - top); aCtx.stroke();
  aCtx.font = '10px "JetBrains Mono", monospace';

  // X-axis tick labels: below bottom border AND above top border
  aCtx.fillStyle = '#1a3560';
  for (let x = Math.ceil(W.xMin / STEP_MAJOR) * STEP_MAJOR; x <= W.xMax; x += STEP_MAJOR) {
    let cx = w2c(x, W.yMin).x;
    let label = String(Math.round(x));
    // bottom ticks
    aCtx.beginPath(); aCtx.moveTo(cx, bottom); aCtx.lineTo(cx, bottom + 4); aCtx.strokeStyle = '#2c4a7c'; aCtx.lineWidth = 1; aCtx.stroke();
    aCtx.textAlign = 'center'; aCtx.fillText(label, cx, bottom + 14);
    // top ticks
    aCtx.beginPath(); aCtx.moveTo(cx, top); aCtx.lineTo(cx, top - 4); aCtx.stroke();
    aCtx.fillText(label, cx, top - 6);
  }

  // Y-axis tick labels: left of left border AND right of right border
  // w2c: yMin -> canvas top, yMax -> canvas bottom
  aCtx.fillStyle = '#92520a';
  for (let y = Math.ceil(W.yMin / STEP_MAJOR) * STEP_MAJOR; y <= W.yMax; y += STEP_MAJOR) {
    let cy = w2c(W.xMin, y).y;
    let label = String(Math.round(y));
    // left ticks
    aCtx.beginPath(); aCtx.moveTo(left, cy); aCtx.lineTo(left - 4, cy); aCtx.strokeStyle = '#92520a'; aCtx.lineWidth = 1; aCtx.stroke();
    aCtx.textAlign = 'right'; aCtx.fillText(label, left - 7, cy + 4);
    // right ticks
    aCtx.beginPath(); aCtx.moveTo(right, cy); aCtx.lineTo(right + 4, cy); aCtx.stroke();
    aCtx.textAlign = 'left'; aCtx.fillText(label, right + 7, cy + 4);
  }
}

function redrawAll() {
  const bgCtx = bgCanvas.getContext('2d');
  bgCtx.fillStyle = '#f7f8fc'; bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  bgCtx.fillStyle = 'rgba(200,210,230,0.15)';
  bgCtx.fillRect(0, 0, PAD.left, CANVAS_H); bgCtx.fillRect(0, 0, CANVAS_W, PAD.top); bgCtx.fillRect(0, CANVAS_H - PAD.bottom, CANVAS_W, PAD.bottom);
  if (bgImage) {
    const left = PAD.left, top = PAD.top;
    const dw = CANVAS_W - PAD.left - PAD.right, dh = CANVAS_H - PAD.top - PAD.bottom;
    bgCtx.save(); bgCtx.globalAlpha = bgOpacity; bgCtx.drawImage(bgImage, left, top, dw, dh); bgCtx.restore();
  }
  drawGridAndAxes();
  const ctx = linesCanvas.getContext('2d'); ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  for (let fig of figures) {
    ctx.save();
    let isEditingFig = (fig.id === editingFigureId);
    if (fig.fillColor && fig.type !== 'line') {
      ctx.fillStyle = fig.fillColor;
      if (fig.type === 'rect') {
        let p1 = w2c(fig.x, fig.y), p2 = w2c(fig.x + fig.w, fig.y + fig.h);
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (fig.type === 'ellipse') {
        let center = w2c(fig.cx, fig.cy);
        let rx = Math.abs(w2c(fig.cx + fig.rx, fig.cy).x - center.x);
        let ry = Math.abs(w2c(fig.cx, fig.cy + fig.ry).y - center.y);
        ctx.beginPath(); ctx.ellipse(center.x, center.y, rx, ry, 0, 0, 2 * Math.PI); ctx.fill();
      } else {
        let pts = fig.points.map(p => w2c(p.x, p.y));
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        if (fig.type === 'polygon') ctx.closePath(); ctx.fill();
      }
    }
    ctx.strokeStyle = fig.lineColor; ctx.lineWidth = isEditingFig ? 3.5 : 2.2;
    if (isEditingFig) { ctx.shadowBlur = 8; ctx.shadowColor = '#ffaa44'; }
    if (fig.type === 'rect') {
      let p1 = w2c(fig.x, fig.y), p2 = w2c(fig.x + fig.w, fig.y + fig.h);
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (fig.type === 'ellipse') {
      let center = w2c(fig.cx, fig.cy);
      let rx = Math.abs(w2c(fig.cx + fig.rx, fig.cy).x - center.x);
      let ry = Math.abs(w2c(fig.cx, fig.cy + fig.ry).y - center.y);
      ctx.beginPath(); ctx.ellipse(center.x, center.y, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
    } else {
      let pts = fig.points.map(p => w2c(p.x, p.y));
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (fig.type === 'polygon') ctx.closePath(); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }
  const vCtx = linesCanvas.getContext('2d');
  for (let fig of figures) {
    let pts = [];
    if (fig.type === 'rect') pts = [[fig.x, fig.y], [fig.x + fig.w, fig.y], [fig.x, fig.y + fig.h], [fig.x + fig.w, fig.y + fig.h]];
    else if (fig.type === 'ellipse') pts = [[fig.cx - fig.rx, fig.cy], [fig.cx + fig.rx, fig.cy], [fig.cx, fig.cy - fig.ry], [fig.cx, fig.cy + fig.ry]];
    else pts = fig.points.map(p => [p.x, p.y]);
    for (let [x, y] of pts) {
      let cp = w2c(x, y);
      vCtx.beginPath(); vCtx.fillStyle = '#c92020'; vCtx.arc(cp.x, cp.y, 5, 0, 2 * Math.PI); vCtx.fill();
      vCtx.beginPath(); vCtx.fillStyle = 'white'; vCtx.arc(cp.x, cp.y, 2.2, 0, 2 * Math.PI); vCtx.fill();
    }
  }
  drawTemp();
}

function drawTemp() {
  const ctx = overlayCanvas.getContext('2d'); ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Crosshair: dashed lines from cursor to top and left axes, with coordinate labels
  if (mouseOnCanvas) {
    const cp = w2c(dragCurrentWorld.x, dragCurrentWorld.y);
    const left = PAD.left, right = CANVAS_W - PAD.right, top = PAD.top, bottom = CANVAS_H - PAD.bottom;
    const cx = cp.x, cy = cp.y;
    const wx = Math.round(dragCurrentWorld.x), wy = Math.round(dragCurrentWorld.y);

    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;

    // Vertical dashed line: cursor → top axis
    ctx.strokeStyle = 'rgba(26, 53, 96, 0.55)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, top); ctx.stroke();

    // Horizontal dashed line: cursor → left axis
    ctx.strokeStyle = 'rgba(146, 82, 10, 0.55)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(left, cy); ctx.stroke();

    ctx.setLineDash([]);

    // X label above top axis
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#1a3560';
    ctx.textAlign = 'center';
    const xLabel = String(wx);
    const xLabelW = ctx.measureText(xLabel).width + 6;
    ctx.fillStyle = 'rgba(230,236,248,0.92)';
    ctx.fillRect(cx - xLabelW / 2, top - 18, xLabelW, 14);
    ctx.fillStyle = '#1a3560';
    ctx.fillText(xLabel, cx, top - 7);

    // Y label left of left axis
    ctx.textAlign = 'right';
    const yLabel = String(wy);
    const yLabelW = ctx.measureText(yLabel).width + 6;
    ctx.fillStyle = 'rgba(248,237,224,0.92)';
    ctx.fillRect(left - yLabelW - 2, cy - 9, yLabelW, 14);
    ctx.fillStyle = '#92520a';
    ctx.fillText(yLabel, left - 5, cy + 4);

    // Small dot at cursor
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(80,80,80,0.5)'; ctx.fill();

    ctx.restore();
  }

  if (isEditing) return;
  if (drawMode === 'line' && lineActivePoint) {
    let from = w2c(lineActivePoint.x, lineActivePoint.y);
    let to = w2c(dragCurrentWorld.x, dragCurrentWorld.y);
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = currentLineColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = currentLineColor; ctx.beginPath(); ctx.arc(from.x, from.y, 4, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
  } else if ((drawMode === 'polyline' || drawMode === 'polygon') && tempPoints.length > 0) {
    let pts = tempPoints.map(p => w2c(p.x, p.y));
    let to = w2c(dragCurrentWorld.x, dragCurrentWorld.y);
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = currentLineColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = currentLineColor;
    for (let p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI); ctx.fill(); }
    ctx.restore();
  } else if ((drawMode === 'rect' || drawMode === 'ellipse') && rectStart) {
    let x1 = rectStart.x, y1 = rectStart.y, x2 = dragCurrentWorld.x, y2 = dragCurrentWorld.y;
    let x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = currentLineColor; ctx.lineWidth = 2;
    if (drawMode === 'rect') {
      let p1 = w2c(x, y), p2 = w2c(x + w, y + h);
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      if (currentFillColor) { ctx.fillStyle = currentFillColor + '80'; ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y); }
    } else {
      let cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
      let center = w2c(cx, cy);
      let rxCanvas = Math.abs(w2c(cx + rx, cy).x - center.x);
      let ryCanvas = Math.abs(w2c(cx, cy + ry).y - center.y);
      ctx.beginPath(); ctx.ellipse(center.x, center.y, rxCanvas, ryCanvas, 0, 0, 2 * Math.PI); ctx.stroke();
      if (currentFillColor) { ctx.fillStyle = currentFillColor + '80'; ctx.fill(); }
    }
    ctx.restore();
  }
}

function handleDrawClick(world) {
  let rw = roundW(world);
  if (drawMode === 'line') {
    if (!lineActivePoint) { lineActivePoint = rw; modeBadge.innerText = `📏 перша точка (${rw.x},${rw.y})`; }
    else { addFigure({ type: 'line', points: [{ ...lineActivePoint }, { ...rw }], lineColor: currentLineColor, fillColor: null }); lineActivePoint = rw; modeBadge.innerText = `📏 лінія (${rw.x},${rw.y})`; }
  } else if (drawMode === 'polyline' || drawMode === 'polygon') {
    tempPoints.push(rw);
    modeBadge.innerText = `${drawMode === 'polyline' ? '📈' : '🔺'} точка ${tempPoints.length}`;
  }
  redrawAll();
}
function finalizePoly() {
  if ((drawMode === 'polyline' || drawMode === 'polygon') && tempPoints.length >= 2) {
    addFigure({ type: drawMode, points: [...tempPoints], lineColor: currentLineColor, fillColor: drawMode === 'polygon' ? currentFillColor : null });
  }
  tempPoints = [];
  modeBadge.innerText = drawMode === 'polyline' ? '📈 ламана' : '🔺 багатокутник';
  redrawAll();
}
function resetDrawingState() { lineActivePoint = null; tempPoints = []; rectStart = null; }

let lastMouseX = 0, lastMouseY = 0;
function getCanvasPos(e) {
  let rect = hitCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  return { x: Math.min(Math.max(x, 0), CANVAS_W), y: Math.min(Math.max(y, 0), CANVAS_H) };
}

hitCanvas.addEventListener('mousedown', (e) => {
  let cp = getCanvasPos(e); let world = c2w(cp.x, cp.y);
  if (isEditing) { isDragging = true; dragStartWorld = world; e.preventDefault(); return; }
  let hit = findHitPoint(world, 10);
  if (hit) { startEdit(hit); isDragging = true; dragStartWorld = world; e.preventDefault(); }
  else {
    cancelEdit(); isDragging = true; dragStartWorld = world;
    if ((drawMode === 'rect' || drawMode === 'ellipse') && !rectStart) {
      let rw = roundW(world); rectStart = rw;
      modeBadge.innerText = drawMode === 'rect' ? '📐 подвійний клік для фіксації' : '⚪ подвійний клік для фіксації';
    }
    e.preventDefault();
  }
});
window.addEventListener('mousemove', (e) => {
  let cp = getCanvasPos(e); let world = c2w(cp.x, cp.y);
  dragCurrentWorld = world;
  // Check if pointer is inside the drawing area
  const left = PAD.left, right = CANVAS_W - PAD.right, top = PAD.top, bottom = CANVAS_H - PAD.bottom;
  mouseOnCanvas = (cp.x >= left && cp.x <= right && cp.y >= top && cp.y <= bottom);
  liveCoord.innerText = `(${Math.round(world.x)}, ${Math.round(world.y)})`;
  lastMouseX = e.clientX; lastMouseY = e.clientY;
  if (isDragging && dragStartWorld) {
    let delta = { x: world.x - dragStartWorld.x, y: world.y - dragStartWorld.y };
    if (isEditing) { applyEdit(delta); dragStartWorld = world; }
  }
  redrawAll();
});
window.addEventListener('mouseup', () => { isDragging = false; dragStartWorld = null; redrawAll(); });

let clickTimer = null;
hitCanvas.addEventListener('click', (e) => {
  if (isEditing) return;
  if (drawMode === 'rect' || drawMode === 'ellipse') return;
  let cp = getCanvasPos(e); let world = c2w(cp.x, cp.y);
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clickTimer = null; handleDrawClick(world); }, 50);
});
hitCanvas.addEventListener('dblclick', (e) => {
    if (isEditing) { cancelEdit(); return; }
    let cp = getCanvasPos(e); let world = c2w(cp.x, cp.y); let rw = roundW(world);
    
    if (drawMode === 'polyline' || drawMode === 'polygon') { 
        tempPoints.push(rw); // Фіксуємо точку під курсором
        finalizePoly();      // З'єднуємо з початковою точкою та створюємо фігуру
    } else if (drawMode === 'line' && lineActivePoint) {
        lineActivePoint = null; modeBadge.innerText = '📏 Лінія'; redrawAll();
    } else if ((drawMode === 'rect' || drawMode === 'ellipse') && rectStart) {
        let x1 = rectStart.x, y1 = rectStart.y, x2 = rw.x, y2 = rw.y;
        let x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
        if (w > 1 && h > 1) {
            if (drawMode === 'rect') addFigure({ type: 'rect', x, y, w, h, lineColor: currentLineColor, fillColor: currentFillColor });
            else addFigure({ type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, lineColor: currentLineColor, fillColor: currentFillColor });
        }
        rectStart = null;
        modeBadge.innerText = drawMode === 'rect' ? '📐 Прямокутник' : '⚪ Еліпс'; redrawAll();
    }
    
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; } // Запобігає подвійному спрацьовування одинарного кліку
    e.stopPropagation(); e.preventDefault();
});
hitCanvas.addEventListener('mouseleave', () => { liveCoord.innerText = '(–, –)'; mouseOnCanvas = false; redrawAll(); });

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isEditing) { cancelEdit(); return; }
    resetDrawingState();
    let modeNames = { line: '📏 Лінія', polyline: '📈 Ламана', polygon: '🔺 Багатокутник', rect: '📐 Прямокутник', ellipse: '⚪ Еліпс' };
    modeBadge.innerText = modeNames[drawMode] || drawMode; redrawAll();
  } else if (e.key === 'Delete' && isEditing && editingFigureId !== null) {
    let fig = figures.find(f => f.id === editingFigureId);
    if (fig && (fig.type === 'line' || fig.type === 'rect' || fig.type === 'ellipse')) {
      figures = figures.filter(f => f.id !== editingFigureId); cancelEdit(); regenerateCode(); redrawAll();
    } else if (fig && (fig.type === 'polyline' || fig.type === 'polygon') && editingPointIndex !== null) {
      fig.points.splice(editingPointIndex, 1);
      if (fig.points.length < 2) figures = figures.filter(f => f.id !== editingFigureId);
      else updateFigure(fig);
      cancelEdit(); regenerateCode(); redrawAll();
    }
  }
});

function setLineColor(color) {
  currentLineColor = color;
  document.getElementById('lineColorPreview').style.backgroundColor = color;
}
function setFillColor(color) {
  currentFillColor = color === 'transparent' ? null : color;
  let preview = document.getElementById('fillColorPreview');
  if (currentFillColor) { preview.style.backgroundColor = currentFillColor; preview.style.border = 'none'; }
  else { preview.style.backgroundColor = '#1a1d27'; preview.style.border = '1px dashed #aaa'; }
}
document.getElementById('lineColorBtn').onclick = () => document.getElementById('lineColorPicker').click();
document.getElementById('lineColorPicker').oninput = (e) => setLineColor(e.target.value);
document.getElementById('fillColorBtn').onclick = () => document.getElementById('fillColorPicker').click();
document.getElementById('fillColorPicker').oninput = (e) => setFillColor(e.target.value);

function setMode(mode) {
  cancelEdit(); resetDrawingState(); drawMode = mode;
  let names = { line: '📏 Лінія', polyline: '📈 Ламана', polygon: '🔺 Багатокутник', rect: '📐 Прямокутник', ellipse: '⚪ Еліпс' };
  modeBadge.innerText = names[mode]; redrawAll();
}
document.getElementById('modeLineBtn').onclick = () => setMode('line');
document.getElementById('modePolylineBtn').onclick = () => setMode('polyline');
document.getElementById('modePolygonBtn').onclick = () => setMode('polygon');
document.getElementById('modeRectBtn').onclick = () => setMode('rect');
document.getElementById('modeEllipseBtn').onclick = () => setMode('ellipse');

function updateBounds() {
  let xMin = parseInt(xMinIn.value);
  let yMin = parseInt(yMinIn.value);
  if (isNaN(xMin) || isNaN(yMin)) return;
  // xMax/yMax are auto-computed to preserve the current range
  let xRange = W.xMax - W.xMin;
  let yRange = W.yMax - W.yMin;
  W = { xMin, xMax: xMin + xRange, yMin, yMax: yMin + yRange };
  redrawAll();
}
[xMinIn, yMinIn].forEach(inp => inp.addEventListener('change', updateBounds));

btnClear.onclick = () => {
  figures = []; nextId = 1; cancelEdit(); resetDrawingState(); regenerateCode(); redrawAll(); modeBadge.innerText = '📏 Лінія';
};

// Копіювання в буфер
if (btnCopy) {
  btnCopy.addEventListener('click', () => {
    if (!codeEditor.value) return;
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      btnCopy.textContent = '✅ Скопійовано!';
      setTimeout(() => btnCopy.textContent = '📋 Копіювати', 1500);
    }).catch(() => {
      codeEditor.select(); document.execCommand('copy');
      btnCopy.textContent = '✅ Скопійовано!';
      setTimeout(() => btnCopy.textContent = '📋 Копіювати', 1500);
    });
  });
}

if (langSelect) langSelect.addEventListener('change', regenerateCode);

const bgImageBtn = document.getElementById('bgImageBtn');
const bgImageFile = document.getElementById('bgImageFile');
const bgImageClear = document.getElementById('bgImageClear');
const bgOpacitySlider = document.getElementById('bgOpacity');
if (bgImageBtn) bgImageBtn.onclick = () => bgImageFile.click();
if (bgImageFile) bgImageFile.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { const img = new Image(); img.onload = () => { bgImage = img; redrawAll(); }; img.src = ev.target.result; };
  reader.readAsDataURL(file); bgImageFile.value = '';
});
if (bgImageClear) bgImageClear.onclick = () => { bgImage = null; redrawAll(); };
if (bgOpacitySlider) bgOpacitySlider.addEventListener('input', (e) => { bgOpacity = parseInt(e.target.value) / 100; redrawAll(); });

initBounds(); redrawAll(); setMode('line'); setLineColor('#d42020'); setFillColor(null);
})();
