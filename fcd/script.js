const BLOCK_WIDTH = 150;
const BLOCK_HEIGHT = 60;
// розміри для блоку Decision
const DECISION_WIDTH = 180;
const DECISION_HEIGHT = 80;

const canvas = document.getElementById('canvas');
const stage = new createjs.Stage(canvas);
//
// ─────────────────────────────────────────────────────────────────────────────
// A* ROUTER: Ортогональний пошук шляху по сітці координат
// ─────────────────────────────────────────────────────────────────────────────

function _round(v) { return Math.round(v); }

function _buildRoutingGraph(blocks, excludeIds, fp, tp, margin, forcedEdges = [], existingConns = [], currentToId = null, currentToPort = null, fpStub = null, tpStub = null) {
    const xSet = new Set([_round(fp.x), _round(tp.x)]);
    const ySet = new Set([_round(fp.y), _round(tp.y)]);
    for (const fe of forcedEdges) {
        xSet.add(_round(fe.from.x)); ySet.add(_round(fe.from.y));
        xSet.add(_round(fe.to.x));   ySet.add(_round(fe.to.y));
    }
    for (const b of blocks.values()) {
        if (excludeIds.has(b.id)) continue;
        xSet.add(_round(b.x - margin)); xSet.add(_round(b.x + b.w + margin)); 
        ySet.add(_round(b.y - margin)); ySet.add(_round(b.y + b.h + margin));
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity , maxY = -Infinity;
    for (const b of blocks.values()) {
        if (excludeIds.has(b.id)) continue;
        minX = Math.min(minX, _round(b.x)); maxX = Math.max(maxX, _round(b.x + b.w));
         minY = Math.min(minY, _round(b.y)); maxY = Math.max(maxY, _round(b.y + b.h));
    }
    const pad = 180;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    xSet.add(minX); xSet.add(maxX) ; ySet.add(minY); ySet.add(maxY);

    xSet.add(_round((fp.x + tp.x) / 2));
    ySet.add(_round((fp.y + tp.y) / 2));

    const xs = Array.from(xSet).sort((a, b) => a - b);
    const ys = Array.from(ySet).sort((a, b) => a - b);

    const nodes = [];
    const idxMap = new Map();
    for (let x of xs) {
        for (let y of ys) {
            const key = `${x}_${y}`;
            idxMap.set(key, nodes.length);
            nodes.push({ x, y, id: nodes.length });
        }
    } 

    // ── Будуємо карту зайнятих сегментів ──
    const occupiedMap = new Map();
    for (const c of existingConns) {
        if (!c.waypoints || c.waypoints.length < 2) continue;
        for (let k = 0; k < c.waypoints.length - 1; k++) {
            const p1 = c.waypoints[k], p2 = c.waypoints[k+1];
            const key = `${Math.min(p1.x, p2.x)}_${Math.min(p1.y, p2.y)}_${Math.max(p1.x, p2.x)}_${Math.max(p1.y, p2.y)}`;
            // Спільний порт не рахується як перетин
            const isSameDest = (currentToId !== null && c.to.id === currentToId && c.toPort === currentToPort);
            if (!isSameDest) occupiedMap.set(key, (occupiedMap.get(key) || 0) + 1);
        }
    }

    const hFree = (x1, x2, y) => {
        if (x1 === x2) return true;
        const min = Math.min(x1, x2), max = Math.max(x1, x2);
        for (const b of blocks.values()) {
            if (excludeIds.has(b.id)) continue;
             if (max > b.x - margin && min < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin) return false;
        }
        return true;
    };

    const vFree = (x, y1, y2) => {
        if (y1 === y2) return true;
        const min = Math.min(y1, y2), max = Math.max(y1, y2);
        for (const b of blocks.values()) {
            if (excludeIds.has(b.id)) continue;
             if (x > b.x - margin && x < b.x + b.w + margin && max > b.y - margin && min < b.y + b.h + margin) return false;
        }
        return true;
    };

    const edges = [];
    const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const STUB_LEN = 26; // Має збігатися з STUB_LEN у _routePath

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const xi = xs.indexOf(n.x);
        const yi = ys.indexOf(n.y);

        // Праворуч
        if (xi < xs.length - 1) {
            const nx = xs[xi + 1], key = `${nx}_${n.y}`;
            const j = idxMap.get(key);
            if (j !== undefined && hFree(n.x, nx, n.y)) {
                const w = dist(n, nodes[j]);
                // Розрахунок штрафу за перетин
                const segKey = `${Math.min(n.x, nx)}_${Math.min(n.y, nodes[j].y)}_${Math.max(n.x, nx)}_${Math.max(n.y, nodes[j].y)}`;
                let overlapCost = 0;
                if (occupiedMap.has(segKey)) {
                    // isStub = true лише якщо це точно ребро fp→fpStub або tpStub→tp
                    const isStub = (fpStub &&
                        Math.abs(n.x - fp.x) < 0.5 && Math.abs(n.y - fp.y) < 0.5 &&
                        Math.abs(nx - fpStub.x) < 0.5 && Math.abs(n.y - fpStub.y) < 0.5
                    ) || (tpStub &&
                        Math.abs(n.x - tpStub.x) < 0.5 && Math.abs(n.y - tpStub.y) < 0.5 &&
                        Math.abs(nx - tp.x) < 0.5 && Math.abs(n.y - tp.y) < 0.5
                    );
                    if (!isStub) overlapCost = occupiedMap.get(segKey) * 3000;
                }
                edges.push([i, j, w, true, overlapCost]);
                edges.push([j, i, w, true, overlapCost]);
            }
        }
        // Вниз
         if (yi < ys.length - 1) {
            const ny = ys[yi + 1], key = `${n.x}_${ny}`;
            const j = idxMap.get(key);
            if (j !== undefined && vFree(n.x, n.y, ny)) {
                const w = dist(n, nodes[j]);
                const segKey = `${Math.min(n.x, nodes[j].x)}_${Math.min(n.y, ny)}_${Math.max(n.x, nodes[j].x)}_${Math.max(n.y, ny)}`;
                let overlapCost = 0;
                if (occupiedMap.has(segKey)) {
                    // isStub = true лише якщо це точно ребро fp→fpStub або tpStub→tp
                    const isStub = (fpStub &&
                        Math.abs(n.x - fp.x) < 0.5 && Math.abs(n.y - fp.y) < 0.5 &&
                        Math.abs(n.x - fpStub.x) < 0.5 && Math.abs(ny - fpStub.y) < 0.5
                    ) || (tpStub &&
                        Math.abs(n.x - tpStub.x) < 0.5 && Math.abs(n.y - tpStub.y) < 0.5 &&
                        Math.abs(n.x - tp.x) < 0.5 && Math.abs(ny - tp.y) < 0.5
                    );
                    if (!isStub) overlapCost = occupiedMap.get(segKey) * 3000;
                }
                edges.push([i, j, w, false, overlapCost]);
                edges.push([j, i, w, false, overlapCost]);
            }
        }
    }

    // Додаємо примусові ребра (STUB) без штрафу
    for (const fe of forcedEdges) {
        const fromKey = `${_round(fe.from.x)}_${_round(fe.from.y)}`;
        const toKey   = `${_round(fe.to.x)}_${_round(fe.to.y)}`;
        const fi = idxMap.get(fromKey), ti = idxMap.get(toKey);
        if (fi !== undefined && ti !== undefined) {
            const w = Math.abs(fe.to.x - fe.from.x) + Math.abs(fe.to.y - fe.from.y);
            const isH = Math.abs(fe.to.y - fe.from.y) < 0.5;
            edges.push([fi, ti, w, isH, 0]);
            edges.push([ti, fi, w, isH, 0]);
        }
    }

    return { nodes, edges, idxMap, start: `${_round(fp.x)}_${_round(fp.y)}`, end: `${_round( tp.x)}_${_round(tp.y)}`, startForcedDir: null, endForcedDir: null };
}

function _runAStar(graph, turnPenalty = 20, opts = {}) {
    const endIdx   = graph.idxMap.get(graph.end);
    const startIdx = graph.idxMap.get(graph.start);
    const stubBackIdx  = opts.noStartStub  ? -1 : (graph.stubBackIdx  ?? -1);
    const stubFrontIdx = opts.noStartStub  ?  -1 : (graph.stubFrontIdx ?? -1);
    const stubEndIdx   = opts.noEndStub    ? -1 : (graph.stubEndIdx   ?? -1);

    const initDir = opts.noStartStub ? null : (graph.startForcedDir ?? null );
    const open = [{ idx: startIdx, g: 0, f: 0, dir: initDir, parent: -1 }];
    const gMap = new Map(), parentMap = new Map();
    gMap.set(startIdx, 0);
    const endNode = graph.nodes[endIdx] ;
    open[0].f = Math.abs(endNode.x - graph.nodes[startIdx].x) + Math.abs(endNode.y - graph.nodes[startIdx].y);

    while (open.length > 0) {
        let cur = 0;
        for (let i = 1; i < open.length; i++) if (open[i].f < open[cur].f) cur = i;
        const curr = open[cur];
        open.splice(cur, 1);

        if (curr.idx === endIdx) {
            const path = [];
            let n = curr;
            while (n.parent !== -1) {
                path.unshift(graph.nodes[n.idx]);
                n = parentMap.get(n.idx);
            }
            path.unshift(graph.nodes[startIdx]);
            return path;
        }

         for (const [from, to, w, isH, overlapCost = 0] of graph.edges) {
            if (from !== curr.idx) continue;
            if (stubBackIdx >= 0 && curr.idx === stubBackIdx && to !== stubFrontIdx) continue;
            if (stubFrontIdx >= 0 && curr.idx === stubFrontIdx && to === stubBackIdx) continue;
            if (stubEndIdx >= 0 && to === endIdx && curr.idx !== stubEndIdx) continue;

            const turnCost = (curr.dir !== null && curr.dir !== isH) ? turnPenalty : 0;
            const newG = curr.g + w + turnCost + overlapCost; // 🔽 Додано штраф
            
            if (!gMap.has(to) || newG < gMap.get(to)) {
                gMap.set(to, newG);
                parentMap.set(to, curr);
                const node = graph.nodes[to];
                const h = Math.abs(endNode.x - node.x) + Math.abs(endNode.y - node.y);
                open.push({ idx: to, g: newG, f: newG + h, dir: isH, parent: curr.idx });
            }
        }
    }
    return null;
}

// Запускає A* з повними обмеженнями stub; якщо не знаходить — знімає обмеження поступово
function _runAStarWithStubs(graph, turnPenalty) {
    // Спроба 1: повні обмеження (fp→fpStub, tpStub→tp примусово)
    let path = _runAStar(graph, turnPenalty, {});
    if (path) return path;
    // Спроба 2: знімаємо обмеження на вхід (tpStub може бути в зоні перешкод)
    path = _runAStar(graph, turnPenalty, { noEndStub: true });
    if (path) return path;
    // Спроба 3: знімаємо обмеження на вихід
    path = _runAStar(graph, turnPenalty, { noStartStub: true });
    if (path) return path;
    // Спроба 4: без будь-яких обмежень
    return _runAStar(graph, turnPenalty, { noStartStub: true, noEndStub: true });
}
function _simplifyPath(pts) {
    if (pts.length <= 2) return pts;
    const res = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i-1], b = pts[i], c = pts[i+1];
        if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) continue;
        res.push(b);
    }
    res.push(pts[pts.length - 1]);
    return res;
}
//
// ── VIEWPORT (zoom + pan) ──────────────────────────────────────────────────
const viewport = { scale: 1, offsetX: 0, offsetY: 0 };
const ZOOM_MIN = 0.25, ZOOM_MAX = 3, ZOOM_STEP = 0.15;

// Background canvas for dot grid
const bgCanvas = document.createElement('canvas');
bgCanvas.id = 'bg-canvas';
bgCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;';
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.style.position = 'relative';
canvasContainer.insertBefore(bgCanvas, canvas);
canvas.style.position = 'relative';
canvas.style.zIndex = '1';
canvas.style.background = 'transparent';

//
function drawDotGrid() {
	const ctx = bgCanvas.getContext('2d');
	ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
	ctx.fillStyle = '#1a1a2e'; // dark background
	ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
	const spacing = 24 * viewport.scale;
	const dotR = Math.max(0.8, 1.2 * viewport.scale);
	const ox = ((viewport.offsetX % spacing) + spacing) % spacing;
	const oy = ((viewport.offsetY % spacing) + spacing) % spacing;
	ctx.fillStyle = 'rgba(120,120,160,0.45)';
	for (let x = ox; x < bgCanvas.width; x += spacing) {
		for (let y = oy; y < bgCanvas.height; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, dotR, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

function applyViewport() {
	stage.x = viewport.offsetX;
	stage.y = viewport.offsetY;
	stage.scaleX = viewport.scale;
	stage.scaleY = viewport.scale;
	drawDotGrid();
	stage.update();
}

// Convert screen coords → world coords (accounting for viewport)
function screenToWorld(sx, sy) {
	return {
		x: (sx - viewport.offsetX) / viewport.scale,
		y: (sy - viewport.offsetY) / viewport.scale
	};
}

// Zoom around a center point (screen coords)
function zoomAt(cx, cy, delta) {
	const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, viewport.scale * (1 + delta)));
	const factor = newScale / viewport.scale;
	viewport.offsetX = cx - factor * (cx - viewport.offsetX);
	viewport.offsetY = cy - factor * (cy - viewport.offsetY);
	viewport.scale = newScale;
	applyViewport();
}

// Zoom buttons (injected into canvas-container)
const zoomBtnContainer = document.createElement('div');
zoomBtnContainer.style.cssText = `
	position:absolute; bottom:18px; right:18px; z-index:10;
	display:flex; flex-direction:column; gap:6px;
`;
const mkZBtn = (label, title) => {
	const b = document.createElement('button');
	b.textContent = label;
	b.title = title;
	b.style.cssText = `
		width:36px; height:36px; border-radius:50%;
		background:rgba(40,40,60,0.92); border:1.5px solid rgba(140,140,200,0.4);
		color:#ccd; font-size:20px; font-weight:bold; line-height:1;
		cursor:pointer; display:flex; align-items:center; justify-content:center;
		box-shadow:0 2px 8px rgba(0,0,0,0.45); transition:background 0.15s, transform 0.1s;
		padding:0;
	`;
	b.addEventListener('mouseenter', () => b.style.background = 'rgba(60,60,100,0.98)');
	b.addEventListener('mouseleave', () => b.style.background = 'rgba(40,40,60,0.92)');
	b.addEventListener('mousedown', () => b.style.transform = 'scale(0.92)');
	b.addEventListener('mouseup', () => b.style.transform = 'scale(1)');
	return b;
};
const zoomInBtn  = mkZBtn('+', 'Збільшити');
const zoomOutBtn = mkZBtn('−', 'Зменшити');
zoomBtnContainer.appendChild(zoomInBtn);
zoomBtnContainer.appendChild(zoomOutBtn);
canvasContainer.appendChild(zoomBtnContainer);

const zoomResetBtn = mkZBtn('⌖', 'Скинути масштаб (Ctrl+0)');
zoomResetBtn.style.fontSize = '16px';
zoomBtnContainer.appendChild(zoomResetBtn);

zoomInBtn.addEventListener('click', () => {
	const cx = canvas.width / 2, cy = canvas.height / 2;
	zoomAt(cx, cy, ZOOM_STEP);
});
zoomOutBtn.addEventListener('click', () => {
	const cx = canvas.width / 2, cy = canvas.height / 2;
	zoomAt(cx, cy, -ZOOM_STEP);
});
zoomResetBtn.addEventListener('click', () => {
	viewport.scale = 1; viewport.offsetX = 0; viewport.offsetY = 0;
	applyViewport();
});
document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key === '0') {
		e.preventDefault();
		viewport.scale = 1; viewport.offsetX = 0; viewport.offsetY = 0;
		applyViewport();
	}
});

// Mouse-wheel zoom
canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
	const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
	const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
	zoomAt(cx, cy, delta);
}, { passive: false });

// ── PAN (middle mouse or Space+drag) ──────────────────────────────────────
let _isPanning = false, _panStartX = 0, _panStartY = 0, _panOX = 0, _panOY = 0, _spaceDown = false;

document.addEventListener('keydown', (e) => {
	if (e.code === 'Space' && !e.target.matches('input,textarea')) {
		e.preventDefault();
		_spaceDown = true;
		canvas.style.cursor = 'grab';
	}
});
document.addEventListener('keyup', (e) => {
	if (e.code === 'Space') {
		_spaceDown = false;
		canvas.style.cursor = '';
	}
});

canvas.addEventListener('mousedown', (e) => {
	if (e.button === 1 || _spaceDown) {
		e.preventDefault();
		_isPanning = true;
		_panStartX = e.clientX;
		_panStartY = e.clientY;
		_panOX = viewport.offsetX;
		_panOY = viewport.offsetY;
		canvas.style.cursor = 'grabbing';
	}
});
window.addEventListener('mousemove', (e) => {
	if (!_isPanning) return;
	viewport.offsetX = _panOX + (e.clientX - _panStartX);
	viewport.offsetY = _panOY + (e.clientY - _panStartY);
	applyViewport();
});
window.addEventListener('mouseup', (e) => {
	if (_isPanning) {
		_isPanning = false;
		canvas.style.cursor = _spaceDown ? 'grab' : '';
	}
});

function resizeCanvas() {
	const container = document.getElementById('canvas-container');
	canvas.width = container.clientWidth;
	canvas.height = container.clientHeight;
	stage.canvas.width = canvas.width;
	stage.canvas.height = canvas.height;
	bgCanvas.width = canvas.width;
	bgCanvas.height = canvas.height;
	drawDotGrid();
	stage.update();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawLibraryBlock(canvasElement, type) {
	const ctx = canvasElement.getContext('2d');
	ctx.clearRect(0, 0, 180, 80);
	
	// Адаптуємо розміри для бібліотеки
	const isDecision = type === 'decision';
	const w = isDecision ? DECISION_WIDTH : 120;
	const h = isDecision ? DECISION_HEIGHT : 60;
	const x = isDecision ? 0 : 30; // Центруємо decision у канвасі 180x80
	const y = isDecision ? 0 : 10;

	ctx.strokeStyle = '#fff';
	ctx.fillStyle = getBlockColor(type);
	ctx.lineWidth = 2;

	drawBlockShape(ctx, type, x, y, w, h);

	ctx.fillStyle = '#fff';
	ctx.font = 'bold 14px Arial';
	ctx.textAlign = 'center';
	ctx.fillText(getBlockLabel(type), x + w / 2, y + h / 2 + 5); // Корекція центру тексту
}

function getBlockColor(type) {
	const colors = {
		'start': '#2ecc71',
		'end': '#2ecc71',
		'process': '#3498db',
		'decision': '#f39c12',
		'input': '#e74c3c',
		'output': '#89b573',
		'loop': '#9b59b6',
		'comment': '#7f8c8d',
		'function': '#1abc9c' // Бірюзовий для функцій
	};
	return colors[type] || '#95a5a6';
}

function getBlockLabel(type) {
	const labels = {
		'start': 'ПОЧАТОК',
		'end': 'КІНЕЦЬ',
		'process': 'ПРОЦЕС',
		'decision': 'РІШЕННЯ',
		'input': 'ВВЕДЕННЯ',
		'output': 'ВИВЕДЕННЯ',
		'loop': 'ЦИКЛ',
		'comment': 'КОМЕНТАР',
		'function': 'ФУНКЦІЯ'
	};
	return labels[type];
}

function drawBlockShape(ctx, type, x, y, w, h) {
	ctx.beginPath();
	switch (type) {
		case 'start':
		case'end':
			// Прямокутник з закругленими сторонами (capsule shape)
			const radius = h / 2;
			ctx.roundRect(x, y, w, h, radius);
			break;
		case 'process':
			ctx.rect(x, y, w, h);
			break;
		case 'decision':
			ctx.moveTo(x + w / 2, y);
			ctx.lineTo(x + w, y + h / 2);
			ctx.lineTo(x + w / 2, y + h);
			ctx.lineTo(x, y + h / 2);
			ctx.closePath();
			break;
		case 'input':
		case 'output':
			ctx.moveTo(x + 20, y);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + w - 20, y + h);
			ctx.lineTo(x, y + h);
			ctx.closePath();
			break;
		case 'loop':
			// Hexagon / loop shape: flat top and bottom, angled sides
			ctx.moveTo(x + 20, y);
			ctx.lineTo(x + w - 20, y);
			ctx.lineTo(x + w, y + h / 2);
			ctx.lineTo(x + w - 20, y + h);
			ctx.lineTo(x + 20, y + h);
			ctx.lineTo(x, y + h / 2);
			ctx.closePath();
			break;
		case 'comment':
			// Dashed rectangle
			ctx.setLineDash([5, 3]);
			ctx.rect(x, y, w, h);
			break;
		case 'function':
			ctx.rect(x, y, w, h);
			ctx.moveTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.1, y + h);
			ctx.moveTo(x + w * 0.9, y); ctx.lineTo(x + w * 0.9, y + h);
			break;	
	}
	ctx.fill();
	ctx.stroke();
	ctx.setLineDash([]); // reset
}

document.querySelectorAll('.library-canvas').forEach(canv => {
	drawLibraryBlock(canv, canv.dataset.type);
});

// --- PORT DEFINITIONS per block type ---
// Each port: { id, dx, dy } — offset from block top-left, plus branch label
function getPortDefs(type) {
    const w = type === 'decision' ? DECISION_WIDTH : BLOCK_WIDTH;
    const h = type === 'decision' ? DECISION_HEIGHT : BLOCK_HEIGHT;
    
    // dir: 0 - верх, 1 - праворуч, 2 - низ, 3 - ліворуч
    if (type === 'decision') {
        return [
            { id: 'in',    dx: w / 2, dy: 0,         dir: 0, role: 'in',  label: '' },
            { id: 'true',  dx: w / 2, dy: h,         dir: 2, role: 'out', label: 'так' },
            { id: 'false', dx: w,     dy: h / 2,     dir: 1, role: 'out', label: 'ні' }
        ];
    }
    if (type === 'loop') {
        return [
            { id: 'in',      dx: BLOCK_WIDTH / 2, dy: 0,             dir: 0, role: 'in',  label: '' },
            { id: 'in-left', dx: 0,               dy: BLOCK_HEIGHT/2,dir: 3, role: 'in',  label: '' },
            { id: 'out',     dx: BLOCK_WIDTH / 2, dy: BLOCK_HEIGHT,  dir: 2, role: 'out', label: 'тіло' },
            { id: 'done',    dx: BLOCK_WIDTH,     dy: BLOCK_HEIGHT/2,dir: 1, role: 'out', label: 'вихід' }
        ];
    }
    if (type === 'comment') return [];
    
    return [
        { id: 'in',  dx: BLOCK_WIDTH / 2, dy: 0,            dir: 0, role: 'in',  label: '' },
        { id: 'out', dx: BLOCK_WIDTH / 2, dy: BLOCK_HEIGHT, dir: 2, role: 'out', label: '' }
    ];
}


// Обчислює вираз виведення: підтримує кілька аргументів через кому (як console.log)
function evalOutputArgs(text, context) {
    // Розбиваємо по комах верхнього рівня (не всередині дужок/лапок)
    const args = [];
    let depth = 0, inStr = null, cur = '';
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inStr) {
            cur += c;
            if (c === inStr && text[i-1] !== '\\') inStr = null;
        } else if (c === '"' || c === "'" || c === '`') {
            inStr = c; cur += c;
        } else if (c === '(' || c === '[' || c === '{') {
            depth++; cur += c;
        } else if (c === ')' || c === ']' || c === '}') {
            depth--; cur += c;
        } else if (c === ',' && depth === 0) {
            args.push(cur.trim()); cur = '';
        } else {
            cur += c;
        }
    }
    if (cur.trim()) args.push(cur.trim());

    return args.map(arg => {
        try {
            const f = new Function('vars', `with(vars){ return (${arg}); }`);
            return f(context.vars);
        } catch(e) { return String(arg).replace(/^["'`]|["'`]$/g, ''); }
    }).join(' ');
}
class Block {
	constructor(id, type, x, y, text = '') {
		this.id = id;
		this.type = type;
		this.x = x;
		this.y = y;
		this.text = text || this.getDefaultText();
		
		// Зберігаємо розміри блоку
		this.w = type === 'decision' ? DECISION_WIDTH : BLOCK_WIDTH;
		this.h = type === 'decision' ? DECISION_HEIGHT : BLOCK_HEIGHT;

		this.connections = { true: null, false: null };
		this.generalConnections = [];
		this.container = new createjs.Container();
		this.shape = null;
		this.textField = null;
		this.selectionRect = null;
		this.portDots = [];
		this.isDragging = false;
		this.selected = false;

		this.createShape();
		this.createPorts();
		this.recalcHeight(); // підганяємо висоту під початковий текст

		this.container.on("mousedown", (e) => {
			if (e.nativeEvent && e.nativeEvent.button === 2) return;
			e.stopPropagation();
			flowchartManager.selectBlock(this);
			this.startDrag(e);
		});

this.container.on("dblclick", async (e) => {
    e.stopPropagation();
    const newText = await inputData("Редагувати текст блоку:", this.text);
    if (newText !== null) {
        this.text = newText;
        // Заміняємо коми на переноси рядків тільки для виведення
        this.textField.text = this.type === 'output' ? newText.replace(/,/g, '\n') : newText;
        // Оновлюємо lineWidth перед перерахунком висоти
        if (this.type === 'output') {
            this.textField.lineWidth = this.w - 30;
        }
        this.recalcHeight();
        flowchartManager.updateAllConnections();
        stage.update();
    }
});

		stage.addChild(this.container);
	}

	getDefaultText() {
		return {
			start: 'ПОЧАТОК',
			end: 'КІНЕЦЬ',
			process: 'процес',
			decision: 'умова',
			input: 'змінна',
			output: 'вираз',
			loop: 'i < n',
			comment: 'коментар'
		} [this.type] || 'Блок';
	}

	createShape() {
		const w = this.w;
		const h = this.h;

		const selG = new createjs.Graphics();
		selG.setStrokeStyle(3).beginStroke("#f1c40f").beginFill("rgba(241,196,15,0.18)");
		this._drawShapeGraphics(selG, this.type, w + 2, h + 2, 6);
		this.selectionRect = new createjs.Shape(selG);
		this.selectionRect.x = this.x - 2;
		this.selectionRect.y = this.y - 2;
		this.selectionRect.visible = false;

		const g = new createjs.Graphics();
		const strokeColor = this.type === 'comment' ? '#aaaaaa' : '#000';
		const fillColor = this.type === 'comment' ? 'rgba(127,140,141,0.5)' : getBlockColor(this.type);
		g.setStrokeStyle(this.type === 'comment' ? 1.5 : 2).beginStroke(strokeColor).beginFill(fillColor);
		this._drawShapeGraphics(g, this.type, w, h, 0);
		this.shape = new createjs.Shape(g);
		this.shape.x = this.x;
		this.shape.y = this.y;

		this.textField = new createjs.Text(this.text, "13px Arial", "#000");
		this.textField.textAlign = "center";
		this.textField.lineWidth = this.type === 'output' ? w - 30 : w - 10;
		this.textField.lineHeight = 18;
		this.textField.x = this.x + w / 2;
		this.textField.y = this.y + h / 2 - 5;
		this.container.addChild(this.selectionRect, this.shape, this.textField);
	// Іконка INPUT / OUTPUT: заміна на зображення
	if (this.type === 'input' || this.type === 'output') {
		this.iconContainer = new createjs.Container();
		
		const imgSrc = this.type === 'input' ? 'img/inp.png' : 'img/out.png';
		const bitmap = new createjs.Bitmap(imgSrc);
		
		// Функція для коректного масштабування та центрування після завантаження картинки
		const applyScale = () => {
			const targetSize = 18; // Прагнемо до розміру попереднього кола (діаметр 18px)
			const scale = targetSize / bitmap.image.width;
			bitmap.scaleX = bitmap.scaleY = scale;
			bitmap.regX = bitmap.image.width / 2;
			bitmap.regY = bitmap.image.height / 2;
			stage.update(); // Оновлюємо сцену, якщо зображення завантажилось пізніше
		};

		// Перевіряємо, чи зображення вже завантажено, чи чекаємо
		if (bitmap.image && bitmap.image.complete) {
			applyScale();
		} else if (bitmap.image) {
			bitmap.image.onload = applyScale;
		} else {
			// Fallback, якщо зображення ще не ініціалізовано
			bitmap.scaleX = bitmap.scaleY = 0.5; 
			bitmap.regX = bitmap.regY = 0; 
		}
		
		this.iconContainer.addChild(bitmap);
		
		// Позиціонування: на верхній лінії блоку, ближче до правого кута
		this.iconContainer.x = this.x + this.w - 20;
	 	this.iconContainer.y = this.y;
		
		// Тінь для контрасту
		this.iconContainer.shadow = new createjs.Shadow('rgba(0,0,0,0.5)', 1, 1, 3);
		
		this.container.addChild(this.iconContainer);
	}
	if (this.type === 'decision') {
		this.cornerIcon = new createjs.Container();
		const imgSrc = 'img/if.png';
		const bitmap = new createjs.Bitmap(imgSrc);

		const applyScale = () => {
			const targetH = 14; // Висота, що візуально замінює текст 12px bold
			const scale = targetH / bitmap.image.height;
			bitmap.scaleX = bitmap.scaleY = scale;
			bitmap.regX = bitmap.image.width / 2; // Центруємо по горизонталі
			bitmap.regY = 0;
			stage.update();
		};

		if (bitmap.image && bitmap.image.complete) {
			applyScale();
		} else if (bitmap.image) {
			bitmap.image.onload = applyScale;
		} else {
			bitmap.scaleX = bitmap.scaleY = 0.5; // Fallback
		}

		this.cornerIcon.addChild(bitmap);
		this.cornerIcon.x = this.x + this.w / 2;
		this.cornerIcon.y = this.y + 6;
		this.cornerIcon.shadow = new createjs.Shadow('rgba(0,0,0,0.6)', 1, 1, 2);
		this.container.addChild(this.cornerIcon);
	}		
	}

	_drawShapeGraphics(g, type, w, h, pad) {
		// pad expands shape outward for the selection halo
		switch (type) {
			case 'start':
			case 'end':
				// Прямокутник з закругленими сторонами (capsule shape)
				const radius = (h + pad * 2) / 2;
				g.drawRoundRect(-pad, -pad, w + pad * 2, h + pad * 2, radius);
				break;
			case 'process':
				g.drawRect(-pad, -pad, w + pad * 2, h + pad * 2);
				break;
			case 'decision':
				g.moveTo(w / 2, -pad);
				g.lineTo(w + pad, h / 2);
				g.lineTo(w / 2, h + pad);
				g.lineTo(-pad, h / 2);
				g.closePath();
				break;
			case 'input':
			case 'output':
				g.moveTo(20 - pad, -pad);
				g.lineTo(w + pad, -pad);
				g.lineTo(w - 20 + pad, h + pad);
				g.lineTo(-pad, h + pad);
				g.closePath();
				break;
			case 'loop':
				g.moveTo(20 - pad, -pad);
				g.lineTo(w - 20 + pad, -pad);
				g.lineTo(w + pad, h / 2);
				g.lineTo(w - 20 + pad, h + pad);
				g.lineTo(20 - pad, h + pad);
				g.lineTo(-pad, h / 2);
				g.closePath();
				break;
			case 'comment':
				// Dashed rectangle — simulate with solid for CreateJS (dash not supported easily)
				g.drawRect(-pad, -pad, w + pad * 2, h + pad * 2);
				break;
			case 'function':
				g.drawRect(-pad, -pad, w + pad * 2, h + pad * 2);
				const lineW = w + pad * 2;
				const lx1 = -pad + lineW * 0.15;
				const lx2 = -pad + lineW * 0.85;
				g.moveTo(lx1, -pad).lineTo(lx1, h + pad);
				g.moveTo(lx2, -pad).lineTo(lx2, h + pad);
				break;	
		}
	}

	createPorts() {
		this.portDots = [];
		const defs = getPortDefs(this.type);
		defs.forEach(def => {
			const dot = new createjs.Shape();
			dot.portDef = def;
			dot.blockRef = this;
			this._stylePort(dot, false);
			dot.x = this.x + def.dx;
			dot.y = this.y + def.dy;
			dot.visible = false; // hidden until block is selected

			dot.on("mouseover", () => this._stylePort(dot, true));
			dot.on("mouseout", () => this._stylePort(dot, false));
			dot.on("click", (e) => {
				e.stopPropagation();
				flowchartManager.handlePortClick(this, def);
			});

			this.container.addChild(dot);
			this.portDots.push(dot);
		});
	}

	// Перераховує висоту блоку відповідно до реального розміру тексту
	recalcHeight() {
		if (!['process', 'output', 'comment'].includes(this.type)) return;
		const PAD = 16; // відступ зверху і знизу
		const measured = this.textField.getMeasuredHeight();
		const minH = BLOCK_HEIGHT;
		const newH = Math.max(minH, measured + PAD * 2);
		if (Math.abs(newH - this.h) < 1) return; // нічого не змінилось

		this.h = newH;

		// Перемальовуємо форму
		this.shape.graphics.clear();
		const strokeColor = this.type === 'comment' ? '#aaaaaa' : '#000';
		const fillColor   = this.type === 'comment' ? 'rgba(127,140,141,0.5)' : getBlockColor(this.type);
		this.shape.graphics
			.setStrokeStyle(this.type === 'comment' ? 1.5 : 2)
			.beginStroke(strokeColor).beginFill(fillColor);
		this._drawShapeGraphics(this.shape.graphics, this.type, this.w, newH, 0);

		// Перемальовуємо selectionRect
		this.selectionRect.graphics.clear();
		this.selectionRect.graphics
			.setStrokeStyle(3).beginStroke("#f1c40f").beginFill("rgba(241,196,15,0.18)");
		this._drawShapeGraphics(this.selectionRect.graphics, this.type, this.w + 2, newH + 2, 6);

		// Оновлюємо lineWidth для виведення
		if (this.type === 'output') {
			this.textField.lineWidth = this.w - 30;
		}

		// Центруємо текст по вертикалі
		this.textField.y = this.y + newH / 2 - this.textField.getMeasuredHeight() / 2;

		// Переміщуємо порти (порт 'out' — завжди знизу)
		const defs = getPortDefs(this.type);
		this.portDots.forEach((dot, i) => {
			const def = defs[i];
			const dy = def.dy === BLOCK_HEIGHT ? newH : def.dy; // нижній порт слідує за висотою
			dot.y = this.y + dy;
		});

		stage.update();
	}

	_stylePort(dot, hover) {
		dot.graphics.clear();
		const r = hover ? 8 : 6;
		dot.graphics.setStrokeStyle(2).beginStroke("#fff")
			.beginFill(hover ? "#f39c12" : "#2980b9")
			.drawCircle(0, 0, r);
		if (dot.portDef && dot.portDef.label) {
			// label drawn as separate text — skip here, done in updatePortLabels
		}
	}

	setSelected(sel) {
		this.selected = sel;

		if (sel) {
			this.shape.shadow = new createjs.Shadow("#00d0ff", 0, 0, 25);
		} else {
			this.shape.shadow = null;
		}

		this.portDots.forEach(d => d.visible = sel);

		stage.update();
	}

startDrag(e) {
    this.isDragging = true;
    const startW = screenToWorld(e.stageX, e.stageY);
    this.offsetX = startW.x - this.x;
    this.offsetY = startW.y - this.y;
    let moved = false;
    let rafId = null;

    // Вимикаємо hit-testing на всіх зв'язках під час drag — прискорює рендеринг
    flowchartManager.lines.forEach(l => { l.mouseEnabled = false; });

    const onMouseMove = (ev) => {
        if (!this.isDragging) return;
        moved = true;
        const w = screenToWorld(ev.stageX, ev.stageY);
        this.updatePosition(w.x - this.offsetX, w.y - this.offsetY);

        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                // Перемальовуємо лише зв'язки цього блоку, а не всі
                flowchartManager.updateConnectionsForBlock(this);
                stage.update();
                rafId = null;
            });
        }
    };

    const onMouseUp = () => {
        this.isDragging = false;
        stage.removeEventListener("stagemousemove", moveListener);
        stage.removeEventListener("stagemouseup", upListener);
        if (rafId) cancelAnimationFrame(rafId);

        // Відновлюємо hit-testing на зв'язках
        flowchartManager.lines.forEach(l => { l.mouseEnabled = true; });

        if (moved && flowchartManager.selectedBlock === this) {
            this.setSelected(false);
            flowchartManager.selectedBlock = null;
            flowchartManager.updateStatus();
        }

        // Після відпускання — повне оновлення (маршрути могли змінитись)
        flowchartManager.updateAllConnections();
        stage.update();
    };

    const moveListener = stage.on("stagemousemove", onMouseMove);
    const upListener   = stage.on("stagemouseup",   onMouseUp);
}

	updatePosition(x, y) {
		this.x = x;
		this.y = y;
		this.shape.x = x;
		this.shape.y = y;
		this.selectionRect.x = x - 6;
		this.selectionRect.y = y - 6;
		this.textField.x = x + this.w / 2;
		this.textField.y = y + this.h / 2 - this.textField.getMeasuredHeight() / 2;

    	// Оновлюємо позицію іконки при перетягуванні
    	if (this.iconContainer) {	
    		this.iconContainer.x = this.x + this.w - 20;
    		this.iconContainer.y = this.y;
    	}
    
	// Оновлюємо позицію іконки IF для decision
	if (this.cornerIcon) {	
		this.cornerIcon.x = this.x + this.w / 2;
		this.cornerIcon.y = this.y + 6;
	}

		const defs = getPortDefs(this.type);
		this.portDots.forEach((dot, i) => {
			const def = defs[i];
			const dy = def.dy === BLOCK_HEIGHT ? this.h : def.dy;
			dot.x = x + def.dx;
			dot.y = y + dy;
		});
	}

	remove() {
		stage.removeChild(this.container);
	}

	// Returns canvas-space {x,y} for a given portId
	getPortPos(portId) {
		const def = getPortDefs(this.type).find(d => d.id === portId);
		if (!def) return {
			x: this.x + BLOCK_WIDTH / 2,
			y: this.y + this.h
		};
		// Якщо порт знизу (dy === BLOCK_HEIGHT) — підставляємо реальну висоту блоку
		const dy = def.dy === BLOCK_HEIGHT ? this.h : def.dy;
		return {
			x: this.x + def.dx,
			y: this.y + dy
		};
	}

	// Legacy helpers for execute()
	getConnectionPoints() {
		return {
			top: {
				x: this.x + BLOCK_WIDTH / 2,
				y: this.y
			},
			right: {
				x: this.x + BLOCK_WIDTH,
				y: this.y + BLOCK_HEIGHT / 2
			},
			bottom: {
				x: this.x + BLOCK_WIDTH / 2,
				y: this.y + BLOCK_HEIGHT
			},
			left: {
				x: this.x,
				y: this.y + BLOCK_HEIGHT / 2
			}
		};
	}
	getDecisionPoints() {
		return this.getConnectionPoints();
	}
}

// ── FOR-LOOP PARSER ──────────────────────────────────────────────────────────
// Розпізнає вираз виду "i=5;15" або "i=5;15;2"
// Повертає { varName, from, to, step } або null якщо не відповідає формату
function parseForLoop(text) {
    // Підтримує: i=5;15  i=5;n  i=a;b;2  i=0;n-1;step  тощо
    // fromExpr/toExpr/stepExpr — рядки-вирази, обчислюються при виконанні через vars
    const m = text.trim().match(/^([a-zA-Z_$][\w$]*)\s*=\s*([^;]+?)\s*;\s*([^;]+?)(?:\s*;\s*(.+?))?\s*$/);
    if (!m) return null;
    return {
        varName:  m[1],
        fromExpr: m[2].trim(),
        toExpr:   m[3].trim(),
        stepExpr: m[4] !== undefined ? m[4].trim() : '1',
    };
}

// Обчислює числове значення виразу for-параметра з урахуванням поточних змінних
function evalForExpr(expr, vars) {
    try {
        return Number(new Function('vars', `with(vars){ return (${expr}); }`)(vars));
    } catch(e) {
        return NaN;
    }
}

class FlowchartManager {
constructor() {
    this.blocks = new Map();
    this.connections = [];
    this.nextId = 1;
    this.lines = [];
    this.selectedBlock = null;
    this.pendingPort = null;
    this.tempLine = null;
    this.selectedConnection = null;

    this.connectionNodes = [];
    this.draggingNode = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.setupDragAndDrop();
    this.setupStageListeners();
    
    this.isStopped = false;
}

	// ── SELECTION ────────────────────────────────────────────────────────
	selectBlock(block) {
		if (this.selectedBlock && this.selectedBlock !== block) {
			this.selectedBlock.setSelected(false);
		}
		this.selectedBlock = block;
		if (block) block.setSelected(true);
		this.updateStatus();
	}

selectConnection(conn) {
    this.selectedConnection = conn;
    if (this.selectedBlock) {
        this.selectedBlock.setSelected(false);
        this.selectedBlock = null;
    }
    this.showConnectionNodes(conn); // 🔽 Показуємо вузли
    this.updateAllConnections();
    this.setStatus("🔗 Зв'язок виділено | Del — видалити | перетягуйте жовті вузли для зміни форми");
}

deselectAll() {
    this.hideConnectionNodes(); // 🔽 Ховаємо вузли
    if (this.selectedBlock) this.selectedBlock.setSelected(false);
    this.selectedBlock = null;
    const hadConn = !!this.selectedConnection;
    this.selectedConnection = null;
    this.cancelPending();
    this.updateStatus();
    if (hadConn) this.updateAllConnections();
    else stage.update();
}

updateAllConnections() {
    // Видаляємо старі лінії з сцени
    this.lines.forEach(l => {
        stage.removeChild(l);
        if (l.label) stage.removeChild(l.label);
    });
    this.lines = [];

    // Малюємо нові
    this.connections.forEach(c => this.drawArrow(c.from, c.fromPort, c.to, c.toPort, c.branch));

}

	// ── PORT CONNECTION LOGIC ─────────────────────────────────────────────
	handlePortClick(block, portDef) {
		if (!this.pendingPort) {
			// Must start from an OUT port
			if (portDef.role !== 'out') {
				this.setStatus("⚠️ З'єднання починається з вихідного порту (знизу / праворуч)");
				return;
			}
			this.pendingPort = {
				block,
				portDef
			};
			this.setStatus(`🔗 Вибрано порт «${portDef.label || 'вихід'}» блоку «${block.text}». Клацніть вхідний порт іншого блоку...`);
		} else {
			// Must end on an IN port of a different block
			if (portDef.role !== 'in') {
				this.setStatus("⚠️ З'єднання закінчується на вхідному порту (зверху)");
				return;
			}
			if (block === this.pendingPort.block) {
				this.setStatus("❌ Не можна з'єднати блок сам з собою");
				this.cancelPending();
				return;
			}
			this.addConnection(
				this.pendingPort.block, this.pendingPort.portDef.id,
				block, portDef.id
			);
			this.cancelPending();
			this.setStatus("✅ З'єднання створено! | Клік на блоці — виділити | Del — видалити");
		}
	}

	cancelPending() {
		this.pendingPort = null;
		if (this.tempLine) {
			stage.removeChild(this.tempLine);
			this.tempLine = null;
		}
	}

	// ── DRAG & DROP FROM LIBRARY ──────────────────────────────────────────
	setupDragAndDrop() {
		document.querySelectorAll('.library-item').forEach(item => {
			item.setAttribute('draggable', 'true');
			item.addEventListener('dragstart', (e) => {
				e.dataTransfer.setData('text/plain', item.dataset.type);
				e.dataTransfer.effectAllowed = 'copy';
			});
		});

		canvas.addEventListener('dragover', (e) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		});

		canvas.addEventListener('drop', (e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const sx = canvas.width / rect.width;
			const sy = canvas.height / rect.height;
			const cx = (e.clientX - rect.left) * sx;
			const cy = (e.clientY - rect.top) * sy;
			const w = screenToWorld(cx, cy);
			let x = w.x - BLOCK_WIDTH / 2;
			let y = w.y - BLOCK_HEIGHT / 2;
			const type = e.dataTransfer.getData('text/plain');
			const b = this.addBlock(type, x, y);
			this.selectBlock(b);
		});
	}

	// ── STAGE / DOM LISTENERS ─────────────────────────────────────────────
	setupStageListeners() {
		// Click on empty canvas → deselect
		stage.on("stagemousedown", (e) => {
			if (_isPanning) return;
			// If no block was hit, deselect
			const w = screenToWorld(e.stageX, e.stageY);
			const hit = stage.getObjectUnderPoint(w.x, w.y);
			if (!hit || hit === stage) this.deselectAll();
		});

		// Right-click → delete block
		canvas.addEventListener('contextmenu', async (e) => {
			e.preventDefault();
			const block = this.getBlockAtScreen(e.clientX, e.clientY);
			if (block) {
				if (await askConfirm(`Видалити блок «${block.text}»?`)) this.deleteBlock(block);
			} else {
				const conn = this.getConnectionAtScreen(e.clientX, e.clientY);
				if (conn && await askConfirm("Видалити це з'єднання?")) this.deleteConnection(conn);
			}
		});

// Delete / Backspace → delete selected block (only if not typing in an input)
document.addEventListener('keydown', async (e) => {
	// Ігноруємо, якщо фокус у полі вводу або текстовій області
	if (e.target.matches('input, textarea')) return;

	if ((e.key === 'Delete' || e.key === 'Backspace')) {
		if (this.selectedBlock) {
			if (await askConfirm(`Видалити блок «${this.selectedBlock.text}»?`)) {
				this.deleteBlock(this.selectedBlock);
				this.selectedBlock = null;
			}
		} else if (this.selectedConnection) {
			if (await askConfirm('Видалити зв\'язок?')) {
				this.deleteConnection(this.selectedConnection);
				this.selectedConnection = null;
			}
		}
	}
});

		// Live temp-line while connecting
		canvas.addEventListener('mousemove', (e) => {
			if (!this.pendingPort) return;
			const rect = canvas.getBoundingClientRect();
			const sx = canvas.width / rect.width;
			const sy = canvas.height / rect.height;
			const cx = (e.clientX - rect.left) * sx;
			const cy = (e.clientY - rect.top) * sy;
			const w = screenToWorld(cx, cy);
			this.drawTempLine(w.x, w.y);
		});
		
// 🔽 Перетягування вузлів зв'язків
stage.on("stagemousemove", (e) => {
    if (!this.draggingNode) return;
    e.nativeEvent && e.nativeEvent.preventDefault();

    const conn = this.draggingNode.connection;
    const idx  = this.draggingNode.waypointIdx;
    const wps  = conn.waypoints;
    const last = wps.length - 1;

    const _wn = screenToWorld(e.stageX, e.stageY);
    const rawX = _wn.x - this.dragOffsetX;
    const rawY = _wn.y - this.dragOffsetY;

    // ── Визначаємо характер сегментів навколо вузла ──
    // segBefore: сегмент між wps[idx-1] і wps[idx]
    // segAfter:  сегмент між wps[idx] і wps[idx+1]
    // Горизонтальний сегмент: однаковий Y у двох кінців.
    // Вертикальний сегмент: однаковий X у двох кінців.
    //
    // Правила:
    //  • якщо segBefore горизонтальний — тягнемо весь цей сегмент вгору/вниз (змінюємо Y цієї точки і попередньої)
    //  • якщо segBefore вертикальний   — тягнемо весь цей сегмент ліворуч/праворуч (змінюємо X цієї точки і попередньої)
    //  (аналогічно для segAfter, якщо потрібно тягнути ту ланку)
    //
    // Ми визначаємо dominant axis за характером сегмента ДО вузла,
    // бо саме той сегмент «обрамовує» вузол з боку попередника.

    const prev = wps[idx - 1];
    const next = wps[idx + 1];

    // Чи є ця точка якорем (перша або остання — прив'язана до порту)?
    const isPrevAnchor = (idx - 1 === 0);
    const isNextAnchor = (idx + 1 === last);

    // Характер сегмента до і після вузла
    // (перевіряємо реальні координати, не axis)
    const beforeHoriz = prev && Math.abs(prev.y - wps[idx].y) <= Math.abs(prev.x - wps[idx].x);
    // Якщо сегмент до вузла горизонтальний → цей вузол тягнеться по вертикалі (Y),
    // і разом з ним перетягується вся та горизонтальна ланка.
    // Якщо сегмент до вузла вертикальний → цей вузол тягнеться по горизонталі (X),
    // і разом з ним перетягується вся та вертикальна ланка.

    if (beforeHoriz) {
        // ── Рух по вертикалі (Y): тягнемо горизонтальний сегмент prev→cur ──
        const newY = rawY;

        // Попередня точка зберігає свій X, але отримує новий Y
        // (якщо вона — якір першої/останньої ланки від порту, то Y не міняємо — ланка
        //  до порту не відривається від нього, лише змінює довжину)
        if (isPrevAnchor) {
            // Ланка від вихідного порту — горизонтальна: prev.x фіксований, prev.y фіксований
            // Натомість поточний вузол може рухатись по Y вільно
            wps[idx].y = newY;
            // Наступна точка (якщо є і не якір) отримує той самий X що і поточна, Y свій
            // — щоб вертикальний сегмент cur→next залишився вертикальним
            if (next && !isNextAnchor) {
                next.x = wps[idx].x;
            } else if (next && isNextAnchor) {
                // Ланка до вхідного порту — вертикальна: не чіпаємо next.y, оновлюємо next.x
                next.x = wps[idx].x;
            }
        } else {
            // Звичайний проміжний горизонтальний сегмент — обидва кінці отримують новий Y
            prev.y = newY;
            wps[idx].y = newY;
            // Вертикальні сегменти до prev і після cur мають оновити свій X
            // щоб залишитися вертикальними — їхні X вже правильні (не змінюються)
        }

    } else {
        // ── Рух по горизонталі (X): тягнемо вертикальний сегмент prev→cur ──
        const newX = rawX;

        if (isPrevAnchor) {
            // Ланка від вихідного порту — вертикальна: prev.x фіксований, prev.y фіксований
            wps[idx].x = newX;
            if (next && !isNextAnchor) {
                next.y = wps[idx].y;
            } else if (next && isNextAnchor) {
                next.y = wps[idx].y;
            }
        } else {
            // Звичайний проміжний вертикальний сегмент — обидва кінці отримують новий X
            prev.x = newX;
            wps[idx].x = newX;
        }
    }

    // ── Виправляємо перший сегмент (від порту виходу) ──
    // wps[0] — фіксована точка порту. wps[1] — перший редагований вузол.
    // Сегмент wps[0]→wps[1] має бути або суто горизонтальним, або суто вертикальним.
    // Визначаємо це за початковим напрямком порту (axis першого вузла).
    if (wps.length > 2) {
        const anchor0 = wps[0];
        const node1   = wps[1];
        // Якщо перший сегмент мав бути вертикальним (axis='x' у node1 означає рух по X,
        // тобто сегмент до нього вертикальний) — фіксуємо X
        if (node1.axis === 'x') {
            node1.x = anchor0.x;
        } else {
            // Горизонтальний — фіксуємо Y
            node1.y = anchor0.y;
        }

        // ── Виправляємо останній сегмент (до порту входу) ──
        const anchorN = wps[last];
        const nodeN1  = wps[last - 1];
        if (nodeN1.axis === 'x') {
            // Сегмент до останньої точки вертикальний — фіксуємо X
            nodeN1.x = anchorN.x;
        } else {
            // Горизонтальний — фіксуємо Y
            nodeN1.y = anchorN.y;
        }
    }

    // ── Забезпечуємо ортогональність усіх сегментів ──
    // Проходимо по всіх внутрішніх точках і виправляємо,
    // щоб кожен сегмент був або суто H або суто V.
    // Пріоритет: фіксуємо координату попередньої точки.
    for (let i = 1; i < last; i++) {
        const a = wps[i - 1], b = wps[i], c = wps[i + 1];
        if (!a || !b || !c) continue;
        // Сегмент a→b: визначаємо домінуючу вісь
        const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
        if (dx >= dy) {
            // Горизонтальний: вирівнюємо Y
            b.y = a.y;
        } else {
            // Вертикальний: вирівнюємо X
            b.x = a.x;
        }
    }

    // ── Оновлюємо позиції вузлів на екрані ──
    this.connectionNodes.forEach(n => {
        const p = conn.waypoints[n.waypointIdx];
        if (p) { n.x = p.x; n.y = p.y; }
    });

    this.redrawConnection(conn);
});

stage.on("stagemouseup", () => {
    if (this.draggingNode) {
        // 🔽 Фіксуємо, що цей зв'язок тепер ручний
        this.draggingNode.connection.isCustom = true;
        this.draggingNode = null;
        stage.update();
    }
});		
		
		
	}

	// ── HELPERS ──────────────────────────────────────────────────────────
	_clientToWorld(sx, sy) {
		const rect = canvas.getBoundingClientRect();
		const cx = (sx - rect.left) * (canvas.width / rect.width);
		const cy = (sy - rect.top) * (canvas.height / rect.height);
		return screenToWorld(cx, cy);
	}

	getBlockAtScreen(sx, sy) {
		const { x, y } = this._clientToWorld(sx, sy);
		for (let b of this.blocks.values()) {
			if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)
				return b;
		}
		return null;
	}

	getConnectionAtScreen(sx, sy) {
		const { x: mx, y: my } = this._clientToWorld(sx, sy);
		// simple bounding-box test on each connection's midpoint
		for (let c of this.connections) {
			const fp = c.from.getPortPos(c.fromPort);
			const tp = c.to.getPortPos(c.toPort);
			const midX = (fp.x + tp.x) / 2,
				midY = (fp.y + tp.y) / 2;
			if (Math.abs(mx - midX) < 12 && Math.abs(my - midY) < 12) return c;
		}
		return null;
	}

	setStatus(msg) {
		document.getElementById('status').textContent = msg;
	}
	updateStatus() {
		if (this.selectedBlock)
			this.setStatus(`✏️ Виділено: «${this.selectedBlock.text}» | Del — видалити блок | клацніть порт для з'єднання`);
		else
			this.setStatus("✅ Готовий | Клік на блоці — виділити | Клік на зв'язку — виділити | Del — видалити | ПКМ — видалити");
	}

	// ── BLOCK CRUD ────────────────────────────────────────────────────────
	addBlock(type, x, y) {
		const id = this.nextId++;
		const block = new Block(id, type, x, y);
		this.blocks.set(id, block);
		stage.update();
		return block;
	}

	deleteBlock(block) {
		this.connections = this.connections.filter(
			c => c.from.id !== block.id && c.to.id !== block.id
		);
		for (let b of this.blocks.values()) {
			if (b.connections.true === block.id) b.connections.true = null;
			if (b.connections.false === block.id) b.connections.false = null;
			b.generalConnections = b.generalConnections.filter(id => id !== block.id);
		}
		if (this.selectedBlock === block) this.selectedBlock = null;
		block.remove();
		this.blocks.delete(block.id);
		this.updateAllConnections();
		this.setStatus("🗑 Блок видалено");
	}

	// ── CONNECTION CRUD ───────────────────────────────────────────────────
addConnection(fromBlock, fromPort, toBlock, toPort) {
    this.connections = this.connections.filter(
        c => !(c.from.id === fromBlock.id && c.fromPort === fromPort)
    );

    const branch = (fromPort === 'true') ? '1' : (fromPort === 'false') ? '2' :
        (fromPort === 'out' && fromBlock.type === 'loop') ? '3' :
        (fromPort === 'done') ? '4' : null;

    if (fromBlock.type === 'decision') {
        if (branch === '1') fromBlock.connections.true = toBlock.id;
        if (branch === '2') fromBlock.connections.false = toBlock.id;
    } else {
        fromBlock.generalConnections = fromBlock.generalConnections.filter(id => id !== toBlock.id);
        fromBlock.generalConnections.push(toBlock.id);
    }

    // 
    this.connections.push({
        from: fromBlock, fromPort, to: toBlock, toPort, branch,
        waypoints: null,
        isCustom: false
    });
    this.updateAllConnections();
}

	deleteConnection(conn) {
		this.hideConnectionNodes();
		if (this.selectedConnection === conn) this.selectedConnection = null;
		this.connections = this.connections.filter(c => c !== conn);
		if (conn.from.type === 'decision') {
			if (conn.branch === '1') conn.from.connections.true = null;
			if (conn.branch === '2') conn.from.connections.false = null;
		} else {
			conn.from.generalConnections = conn.from.generalConnections.filter(id => id !== conn.to.id);
		}
		this.updateAllConnections();
		this.setStatus("🗑 З'єднання видалено");
	}

	// ── DRAWING ──────────────────────────────────────────────────────────
	updateAllConnections() {
		this.lines.forEach(l => {
			stage.removeChild(l);
			if (l.label) stage.removeChild(l.label);
		});
		this.lines = [];

		// ── Прохід 1: перераховуємо waypoints для всіх НЕ-кастомних з'єднань ──
		// Це критично: кожне наступне з'єднання бачить актуальні waypoints
		// вже оброблених з'єднань при побудові occupiedMap.
		for (const c of this.connections) {
			if (c.isCustom && c.waypoints) continue; // кастомні не перераховуємо
			const fp = c.from.getPortPos(c.fromPort);
			const tp = c.to.getPortPos(c.toPort);
			const getDirName = (idx) => ['up', 'right', 'down', 'left'][idx] || 'down';
			const portDir = (block, portId) => {
				const def = getPortDefs(block.type).find(d => d.id === portId);
				return def ? getDirName(def.dir) : 'down';
			};
			const fpDir = portDir(c.from, c.fromPort);
			const tpDir = portDir(c.to, c.toPort);
			// existingConns — всі з'єднання крім поточного (з вже оновленими waypoints)
			const existingConns = this.connections.filter(x => x !== c);
			const pts = this._routePath(fp, fpDir, tp, tpDir, new Set([c.from.id, c.to.id]), existingConns, c.to.id, c.toPort);
			c.waypoints = pts.map((p, i, arr) => {
				let axis = 'y';
				if (i > 0) axis = (arr[i - 1].y === p.y) ? 'y' : 'x';
				return { x: p.x, y: p.y, axis };
			});
		}

		// ── Прохід 2: малюємо всі з'єднання з актуальними waypoints ──
		this.connections.forEach(c => this.drawArrow(c.from, c.fromPort, c.to, c.toPort, c.branch));
		stage.update();
	}

	// Оновлює лише зв'язки конкретного блоку (для використання під час drag)
	updateConnectionsForBlock(block) {
		const affected = this.connections.filter(c => c.from === block || c.to === block);

		// Прохід 1: перераховуємо waypoints для зачеплених з'єднань
		const getDirName = (idx) => ['up', 'right', 'down', 'left'][idx] || 'down';
		const portDir = (b, portId) => {
			const def = getPortDefs(b.type).find(d => d.id === portId);
			return def ? getDirName(def.dir) : 'down';
		};
		for (const c of affected) {
			if (c.isCustom && c.waypoints) continue;
			const fp = c.from.getPortPos(c.fromPort);
			const tp = c.to.getPortPos(c.toPort);
			const fpDir = portDir(c.from, c.fromPort);
			const tpDir = portDir(c.to, c.toPort);
			const existingConns = this.connections.filter(x => x !== c);
			const pts = this._routePath(fp, fpDir, tp, tpDir, new Set([c.from.id, c.to.id]), existingConns, c.to.id, c.toPort);
			c.waypoints = pts.map((p, i, arr) => {
				let axis = 'y';
				if (i > 0) axis = (arr[i - 1].y === p.y) ? 'y' : 'x';
				return { x: p.x, y: p.y, axis };
			});
		}

		// Прохід 2: малюємо
		for (const conn of affected) {
			if (conn.lineShape) {
				stage.removeChild(conn.lineShape);
				if (conn.lineShape.label) stage.removeChild(conn.lineShape.label);
				this.lines = this.lines.filter(l => l !== conn.lineShape);
				conn.lineShape = null;
			}
			this.drawArrow(conn.from, conn.fromPort, conn.to, conn.toPort, conn.branch);
		}
	}


// ─────────────────────────────────────────────────────────────────────────────
// Метод: _routePath
// ─────────────────────────────────────────────────────────────────────────────
_routePath(fp, fpDir, tp, tpDir, excludeIds, existingConns = [], currentToId = null, currentToPort = null) {
    const MARGIN = 15;
    const TURN_PENALTY = 28;
    const STUB_LEN = 26;
    const dist = Math.abs(fp.x - tp.x) + Math.abs(fp.y - tp.y);
    if (dist < 3 * STUB_LEN) {
        return [fp, tp].map((p, i, arr) => {
            const axis = (i > 0 && arr[i-1].y === p.y) ? 'y' : 'x';
            return { x: p.x, y: p.y, axis };
        });
    }
    const stubPt = (pt, dir) => {
        switch (dir) {
            case 'up':    return { x: pt.x, y: pt.y - STUB_LEN };
            case 'down':  return { x: pt.x, y: pt.y + STUB_LEN };
            case 'left':  return { x: pt.x - STUB_LEN, y: pt.y };
            case 'right': return { x: pt.x + STUB_LEN, y: pt.y };
            default:      return { x: pt.x, y: pt.y + STUB_LEN };
        }
    };
    const fpStub = stubPt(fp, fpDir);
    const tpStub = stubPt(tp, tpDir);
    const forcedEdges = [
        { from: fp, to: fpStub },
        { from: tpStub, to: tp },
    ];
    
    const graph = _buildRoutingGraph(this.blocks, excludeIds, fp, tp, MARGIN, forcedEdges, existingConns, currentToId, currentToPort, fpStub, tpStub);
    
    const fpStubIsH = (fpDir === 'left' || fpDir === 'right');
    graph.startForcedDir = fpStubIsH;
    graph.stubBackIdx    = graph.idxMap.get(`${_round(fp.x)}_${_round(fp.y)}`);
    graph.stubFrontIdx   = graph.idxMap.get(`${_round(fpStub.x)}_${_round(fpStub.y)}`);
    graph.stubEndIdx     = graph.idxMap.get(`${_round(tpStub.x)}_${_round(tpStub.y)}`);

    let path = _runAStarWithStubs(graph, TURN_PENALTY);
    if (!path) {
        const off = 200;
        path = [fp, fpStub, { x: fpStub.x, y: fpStub.y + (fpDir === 'down' ? off : -off) }, { x: tpStub.x, y: tpStub.y + (tpDir === 'down' ? -off : off) }, tpStub, tp];
    }
    path = _simplifyPath(path);
    return path.map((p, i, arr) => {
        const axis = (i > 0 && arr[i-1].y === p.y) ? 'y' : 'x';
        return { x: p.x, y: p.y, axis };
    });
}


drawArrow(from, fromPort, to, toPort, branch) {
		const fp = from.getPortPos(fromPort);
		const tp = to.getPortPos(toPort);

		// Direction a port faces outward (for 'out' ports) or inward approach (for 'in')
const getDirName = (idx) => ['up', 'right', 'down', 'left'][idx] || 'down';

const portDir = (block, portId) => {
    const def = getPortDefs(block.type).find(d => d.id === portId);
    return def ? getDirName(def.dir) : 'down';
};

const fpDir = portDir(from, fromPort); // напрямок виходу лінії
const tpDir = portDir(to, toPort);     // напрямок підходу до порту

//

let conn = this.connections.find(c => c.from === from && c.to === to && c.fromPort === fromPort && c.toPort === toPort);
let pts;

if (conn && conn.isCustom && conn.waypoints) {
    // Використовуємо відредагований користувачем шлях
    pts = conn.waypoints.map(p => ({x: p.x, y: p.y, axis: p.axis}));

    const STUB_LEN = 26;
    // ── Виправляємо вихідний stub (pts[0] і pts[1]) ──
    // pts[0] = точний порт, pts[1] = stub на STUB_LEN від порту
    pts[0] = { x: fp.x, y: fp.y, axis: pts[0] ? pts[0].axis : 'x' };
    if (pts.length >= 2) {
        switch (fpDir) {
            case 'down':  pts[1] = { x: fp.x,            y: fp.y + STUB_LEN, axis: 'x' }; break;
            case 'up':    pts[1] = { x: fp.x,            y: fp.y - STUB_LEN, axis: 'x' }; break;
            case 'right': pts[1] = { x: fp.x + STUB_LEN, y: fp.y,            axis: 'y' }; break;
            case 'left':  pts[1] = { x: fp.x - STUB_LEN, y: fp.y,            axis: 'y' }; break;
        }
    }

    // ── Виправляємо вхідний stub (pts[last] і pts[last-1]) ──
    const last = pts.length - 1;
    pts[last] = { x: tp.x, y: tp.y, axis: pts[last] ? pts[last].axis : 'x' };
    if (pts.length >= 2) {
        switch (tpDir) {
            case 'up':    pts[last-1] = { x: tp.x,            y: tp.y - STUB_LEN, axis: 'x' }; break;
            case 'down':  pts[last-1] = { x: tp.x,            y: tp.y + STUB_LEN, axis: 'x' }; break;
            case 'left':  pts[last-1] = { x: tp.x - STUB_LEN, y: tp.y,            axis: 'y' }; break;
            case 'right': pts[last-1] = { x: tp.x + STUB_LEN, y: tp.y,            axis: 'y' }; break;
        }
    }

    // Зберігаємо виправлені waypoints назад у з'єднання
    conn.waypoints = pts.map(p => ({x: p.x, y: p.y, axis: p.axis}));
} else  {
            // Автоматична маршрутизація:
            // Якщо waypoints вже обчислені у першому проході updateAllConnections — використовуємо їх.
            // Інакше (наприклад, при першому addConnection) — рахуємо зараз.
            if (conn && conn.waypoints) {
                pts = conn.waypoints;
            } else {
                const existingConns = this.connections.filter(c =>
                    !(c.from === from && c.fromPort === fromPort && c.to === to && c.toPort === toPort)
                );
                pts = this._routePath(fp, fpDir, tp, tpDir, new Set([from.id, to.id]), existingConns, to.id, toPort);
                if (conn) conn.waypoints = pts.map((p, i, arr) => {
                    let axis = 'y';
                    if (i > 0) {
                        const prev = arr[i - 1];
                        axis = (prev.y === p.y) ? 'y' : 'x';
                    }
                    return { x: p.x, y: p.y, axis };
                });
            }
        }

		// deduplicate consecutive identical points
		const wps = pts.filter((p, i) =>
			i === 0 || p.x !== pts[i-1].x || p.y !== pts[i-1].y
		);

		// arrowhead angle: direction of last segment
		const n = wps.length;
		const ang = Math.atan2(wps[n-1].y - wps[n-2].y, wps[n-1].x - wps[n-2].x);
		const AS = 11; // arrowhead size

		const isSelected = this.selectedConnection &&
			this.selectedConnection.from === from &&
			this.selectedConnection.fromPort === fromPort;
		const strokeColor = isSelected ? "#e67e22" : "#e74c3c";

		const line = new createjs.Shape();
		const g = line.graphics;

		// ── draw polyline with rounded corners, stopping AS px before tip ──
		g.setStrokeStyle(2.5, "round", "round").beginStroke(strokeColor);

		// shorten the last point by AS so stroke doesn't show behind arrowhead
		const draw = wps.map((p, i) => i === n-1
			? { x: p.x - Math.cos(ang)*AS, y: p.y - Math.sin(ang)*AS }
			: p
		);

		g.moveTo(draw[0].x, draw[0].y);
		for (let i = 1; i < draw.length; i++) {
			if (i < draw.length - 1) {
				// rounded corner radius capped at half the shorter adjacent segment
				const prev = draw[i-1], cur = draw[i], nxt = draw[i+1];
				const segIn  = Math.hypot(cur.x-prev.x, cur.y-prev.y);
				const segOut = Math.hypot(nxt.x-cur.x,  nxt.y-cur.y);
				const r = Math.min(10, segIn/2, segOut/2);
				if (r > 1) {
					const inDx = (cur.x-prev.x)/segIn,  inDy = (cur.y-prev.y)/segIn;
					const outDx= (nxt.x-cur.x)/segOut, outDy= (nxt.y-cur.y)/segOut;
					g.lineTo(cur.x - inDx*r, cur.y - inDy*r);
					g.quadraticCurveTo(cur.x, cur.y, cur.x + outDx*r, cur.y + outDy*r);
					continue;
				}
			}
			g.lineTo(draw[i].x, draw[i].y);
		}

		// ── arrowhead triangle, tip exactly at tp ──
		const tip = wps[n-1];
		g.beginFill(strokeColor).beginStroke("transparent")
			.moveTo(tip.x, tip.y)
			.lineTo(tip.x - AS*Math.cos(ang - Math.PI/6), tip.y - AS*Math.sin(ang - Math.PI/6))
			.lineTo(tip.x - AS*Math.cos(ang + Math.PI/6), tip.y - AS*Math.sin(ang + Math.PI/6))
			.closePath();

		// ── hit area (wide invisible stroke) ──
		const hit = new createjs.Shape();
		const hg = hit.graphics.setStrokeStyle(16,"round","round").beginStroke("rgba(0,0,0,0.01)");
		hg.moveTo(wps[0].x, wps[0].y);
		for (let i = 1; i < wps.length; i++) hg.lineTo(wps[i].x, wps[i].y);
		line.hitArea = hit;

		line.cursor = "pointer";
		line.on("mousedown", (e) => {
			e.stopPropagation();
			const conn = this.connections.find(c => c.lineShape === line);
			if (conn) this.selectConnection(conn);
		});

// ── branch label near source port ──
if (branch) {
    const labelMap = { '1':'так', '2':'ні', '3':'тіло',  '4':'вихід' };
    const txt = labelMap[branch] || '';
    if (txt) {
        // Зміщення залежно від напрямку вихідного порту
        let ox = 5, oy = -16;
        if (fpDir === 'down')  { ox = 5; oy = 4; } // порт знизу
        if (fpDir === 'right') { ox = 2;  oy = 4;  } // порт праворуч
        
        const lbl = new createjs.Text(txt, "bold 12px Arial", "#c0392b");
        lbl.x = fp.x + ox;
        lbl.y = fp.y + oy;
        stage.addChild(lbl);
        line.label = lbl;
    }
}

		// register before adding to stage so click handler finds it
		conn = this.connections.find(c =>
			c.from === from && c.to === to &&
			c.fromPort === fromPort && c.toPort === toPort
		);
		if (conn) conn.lineShape = line;

		stage.addChildAt(line, 0);
		this.lines.push(line);
	}

	drawTempLine(mx, my) {
		if (this.tempLine) stage.removeChild(this.tempLine);
		const fp = this.pendingPort.block.getPortPos(this.pendingPort.portDef.id);
		this.tempLine = new createjs.Shape();
		const g = this.tempLine.graphics;
		g.setStrokeStyle(2, 'round').beginStroke("#f39c12");
		g.moveTo(fp.x, fp.y).lineTo(mx, my);
		// small circle at cursor
		g.setStrokeStyle(1).beginStroke("#f39c12").beginFill("rgba(243,156,18,0.3)").drawCircle(mx, my, 5);
		stage.addChild(this.tempLine);
		stage.update();
	}

showConnectionNodes(conn) {
    this.hideConnectionNodes();
    if (!conn || !conn.waypoints || conn.waypoints.length <= 2) return;

    const wps = conn.waypoints;

    // Показуємо вузли на середині кожного внутрішнього сегмента (пропускаємо першу і останню точку)
    // Тягнучи середину сегмента, перетягуємо весь сегмент (H→вгору/вниз, V→ліворуч/праворуч)
    for (let i = 1; i < wps.length - 1; i++) {
        const p = wps[i];
        const node = new createjs.Shape();
        node.graphics.beginFill("#f39c12").beginStroke("#fff").setStrokeStyle(1.5).drawCircle(0, 0, 6);
        node.x = p.x;
        node.y = p.y;
        node.cursor = "move";
        node.waypointIdx = i;
        node.connection = conn;
        node.alpha = 0.95;
        node.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("rgba(0,0,0,0.1)").drawCircle(0,0,12));

        node.on("mousedown", (e) => {
            e.stopPropagation();
            this.draggingNode = node;
            const w = screenToWorld(e.stageX, e.stageY);
            this.dragOffsetX = w.x - node.x;
            this.dragOffsetY = w.y - node.y;
        });

        stage.addChild(node);
        this.connectionNodes.push(node);
    }
}

hideConnectionNodes() {
    this.connectionNodes.forEach(n => stage.removeChild(n));
    this.connectionNodes = [];
    this.draggingNode = null;
}

redrawConnection(conn) {
    const line = conn.lineShape;
    if (!line) return;

    // Очищаємо попередню графіку
    line.graphics.clear();
    if (line.hitArea) line.hitArea.graphics.clear();

    const pts = conn.waypoints;
    if (pts.length < 2) return;

    const isSelected = this.selectedConnection === conn;
    const strokeColor = isSelected ? "#e67e22" : "#e74c3c";
    const AS = 11;
    const n = pts.length;
    const ang = Math.atan2(pts[n-1].y - pts[n-2].y, pts[n-1].x - pts[n-2].x);

    // ── Малюємо лінію з заокругленими кутами ──
    const g = line.graphics;
    g.setStrokeStyle(2.5, "round", "round").beginStroke(strokeColor);

    // Вкорочуємо останню точку, щоб штрих не ліз під стрілку
    const draw = pts.map((p, i) => 
        i === n-1 ? { x: p.x - Math.cos(ang)*AS, y: p.y - Math.sin(ang)*AS } : p
    );

    g.moveTo(draw[0].x, draw[0].y);
    for (let i = 1; i < draw.length; i++) {
        if (i < draw.length - 1) {
            const prev = draw[i-1], cur = draw[i], nxt = draw[i+1];
            const segIn  = Math.hypot(cur.x-prev.x, cur.y-prev.y);
            const segOut = Math.hypot(nxt.x-cur.x, nxt.y-cur.y);

            // Захист від ділення на нуль та мікросегментів
            if (segIn < 0.5 || segOut < 0.5) {
                g.lineTo(cur.x, cur.y);
                continue;
            }

            const r = Math.min(10, segIn/2, segOut/2);
            if (r > 1) {
                const inDx = (cur.x-prev.x)/segIn,  inDy = (cur.y-prev.y)/segIn;
                const outDx= (nxt.x-cur.x)/segOut, outDy= (nxt.y-cur.y)/segOut;
                g.lineTo(cur.x - inDx*r, cur.y - inDy*r);
                g.quadraticCurveTo(cur.x, cur.y, cur.x + outDx*r, cur.y + outDy*r);
                continue;
            }
        }
        g.lineTo(draw[i].x, draw[i].y);
    }

    // ── Стрілка ──
    const tip = pts[n-1];
    g.beginFill(strokeColor).beginStroke("transparent")
        .moveTo(tip.x, tip.y)
        .lineTo(tip.x - AS*Math.cos(ang - Math.PI/6), tip.y - AS*Math.sin(ang - Math.PI/6))
        .lineTo(tip.x - AS*Math.cos(ang + Math.PI/6), tip.y - AS*Math.sin(ang + Math.PI/6))
        .closePath();

    // ── Оновлюємо hitArea (для кліку) ──
    if (line.hitArea) {
        const hg = line.hitArea.graphics;
        hg.setStrokeStyle(16, "round", "round").beginStroke("rgba(0,0,0,0.01)");
        hg.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) hg.lineTo(pts[i].x, pts[i].y);
    }

// ── Оновлюємо позицію мітки (якщо є) ──
if (line.label && conn.branch) {
    const labelMap = { '1':'так', '2':'ні', '3':'тіло', '4':'вихід' };
    const txt = labelMap[conn.branch] || '';
    if (txt) {
        const def = getPortDefs(conn.from.type).find(d => d.id === conn.fromPort);
        const fpDir = def ? ['up','right','down','left'][def.dir] : 'down';
        
        let ox = 5, oy = -16;
        if (fpDir === 'down')  { ox = -10; oy = 12; }
        if (fpDir === 'right') { ox = 10;  oy = 4;  }
        
        // Координати самого порту виходу
        const fp = conn.from.getPortPos(conn.fromPort);
        line.label.x = fp.x + ox;
        line.label.y = fp.y + oy;
    }
}

    stage.update();
}

	clear() {
		this.blocks.forEach(block => block.remove());
		this.lines.forEach(line => {
			stage.removeChild(line);
			if (line.label) stage.removeChild(line.label);
		});
		this.blocks.clear();
		this.connections = [];
		this.lines = [];
		this.nextId = 1;
		stage.update();
	}

	// ── VARIABLE TABLE ──────────────────────────────────────────────────
	renderVarsTable(vars) {
		const body = document.getElementById('vars-body');
		// Filter out Math built-ins (they are functions or PI, E etc. from Object.assign(context.vars, Math))
		const mathKeys = new Set(Object.getOwnPropertyNames(Math));
		const entries = Object.entries(vars).filter(([k]) => !mathKeys.has(k));
		if (entries.length === 0) {
			body.innerHTML = '<tr><td colspan="2" class="empty-vars">— немає —</td></tr>';
			return;
		}
		body.innerHTML = entries.map(([k, v]) => {
			const display = (typeof v === 'function') ? '[fn]' : JSON.stringify(v);
			return `<tr><td class="var-name">${k}</td><td class="var-val">${display}</td></tr>`;
		}).join('');
	}

	// ── BLOCK HIGHLIGHT ──────────────────────────────────────────────────
	highlightBlock(block, color = '#00e5ff') {
		if (this._lastHighlighted && this._lastHighlighted !== block) {
			this._lastHighlighted.shape.shadow = null;
			this._lastHighlighted.shape.graphics && stage.update();
		}
		if (block) {
			block.shape.shadow = new createjs.Shadow(color, 0, 0, 30);
			this._lastHighlighted = block;
			// Scroll canvas container so block is visible
			const container = document.getElementById('canvas-container');
			const blockCenterY = block.y + block.h / 2;
			const blockCenterX = block.x + block.w / 2;
			container.scrollTop = Math.max(0, blockCenterY - container.clientHeight / 2);
			container.scrollLeft = Math.max(0, blockCenterX - container.clientWidth / 2);
		}
		stage.update();
	}

	clearHighlight() {
		if (this._lastHighlighted) {
			this._lastHighlighted.shape.shadow = null;
			this._lastHighlighted = null;
			stage.update();
		}
	}

	// ── STEP-BY-STEP EXECUTION ────────────────────────────────────────────
	// Builds a flat execution plan as an array of step descriptors
	_buildStepPlan(startBlock) {
		const steps = [];
		const MAX = 2000;
		const visited = new Map(); // blockId → visit count

		const walk = (block, loopDepth = 0) => {
			if (!block || steps.length > MAX) return;
			const vid = `${block.id}:${loopDepth}`;
			visited.set(vid, (visited.get(vid) || 0) + 1);
			if (visited.get(vid) > 1000) return; // safety

			steps.push({ block, loopDepth });

			if (block.type === 'end') return;

			if (block.type === 'decision') {
				// Branch will be resolved at runtime — we mark both branches
				steps.push({ block, loopDepth, isBranchMarker: true });
				return; // actual branching is runtime
			}

			if (block.type === 'loop') {
				const loopConns = this.connections.filter(c => c.from.id === block.id);
				const bodyConn = loopConns.find(c => c.fromPort === 'out');
				const doneConn = loopConns.find(c => c.fromPort === 'done');
				steps.push({ block, loopDepth, isLoopMarker: true, bodyConn, doneConn });
				return;
			}

			if (block.generalConnections.length > 0) {
				walk(this.blocks.get(block.generalConnections[0]), loopDepth);
			}
		};

		walk(startBlock);
		return steps;
	}

	initStepExecution() {
		// Головний start — той, що НЕ є заголовком функції (текст без дужок)
		let startBlock = null;
		for (let b of this.blocks.values()) {
			if (b.type === 'start' && !b.text.trim().match(/^[a-zA-Z_$][\w$]*\s*\(/i)) {
				startBlock = b; break;
			}
		}
		if (!startBlock) {
			document.getElementById('result').innerHTML = '❌ Не знайдено блок "Початок"';
			return false;
		}

		// Реєстрація функцій (start-блоки з дужками — заголовки функцій)
		this.functions = new Map();
		for (const b of this.blocks.values()) {
			if (b.type !== 'start') continue;
			const m = b.text.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
			if (!m) continue;
			const funcName = m[1];
			const args = m[2].split(',').map(a => a.trim()).filter(Boolean);
			const bodyBlock = b.generalConnections.length > 0 ? this.blocks.get(b.generalConnections[0]) : null;
			this.functions.set(funcName, { definitionBlock: b, bodyBlock, args });
		}

		this._stepContext = {
			vars: {},
			output: [],
			currentBlock: startBlock,
			done: false,
			loopStack: [],
			callStack: [],   // для виклику функцій у покроковому режимі
		};
		Object.getOwnPropertyNames(Math).forEach(k => this._stepContext.vars[k] = Math[k]);

		document.getElementById('result').innerHTML = '';
		// Показуємо вікно виведення для покрокового режиму
		const outWin = document.getElementById('output-window');
		if (outWin) {
			outWin.style.display = 'flex';
			outWin.querySelector('#output-content').innerHTML = '';
		}
		document.getElementById('resetStepBtn').style.display = 'inline-block';
		document.getElementById('vars-panel').style.display = "inline-block";
		this.renderVarsTable(this._stepContext.vars);
		this.highlightBlock(startBlock, '#f39c12');
		this.isStopped = false;
		//document.getElementById('btn-stop-exec').style.display = 'inline-block';
		return true;
	}

	async executeStep() {
		if (this.isStopped) { this.isStopped = false; return; } //Скидаємо після зупинки
		const ctx = this._stepContext;
		if (!ctx || ctx.done) return;

		const block = ctx.currentBlock;
		if (!block) { ctx.done = true; return; }		
		const text = block.text;
const pushLog = (msg) => {
    ctx.output.push(msg);
    const outputHtml = ctx.output.join('<br>');
    
    document.getElementById('result').innerHTML = outputHtml;
    updateOutputWindow(outputHtml); // <-- Add this line
    
    // auto-scroll result (for the old div)
    const out = document.getElementById('result');
    if(out.parentElement) out.parentElement.scrollTop = out.parentElement.scrollHeight;
};

		const MATH_KEYS = new Set(Object.getOwnPropertyNames(Math));
		const varsBefore = Object.fromEntries(
			Object.entries(ctx.vars).filter(([k]) => !MATH_KEYS.has(k))
		);

		switch (block.type) {
			case 'start': {
				const isHeader = block.text.trim().match(/^[a-zA-Z_$][\w$]*\s*\([^)]*\)/i);
				if (isHeader) { ctx.done = true; return; } // не має потрапляти сюди
				pushLog('🟢 Початок виконання');
				break;
			}
			case 'end': {
				if (ctx.callStack && ctx.callStack.length > 0) {
					const frame = ctx.callStack.pop();
					let retValue = undefined;
					if (frame.returnVar && frame.funcName) {
						retValue = ctx.vars[frame.funcName];
						pushLog(`↩️ Повернення з функції "${frame.funcName}" = ${retValue}`);
					} else {
						pushLog('↩️ Повернення з процедури');
					}
					// Відновлюємо змінні
					if (frame.savedVars) {
						const MK = new Set(Object.getOwnPropertyNames(Math));
						for (const k of Object.keys(ctx.vars)) {
							if (!MK.has(k) && !(k in frame.savedVars)) delete ctx.vars[k];
						}
						for (const k of Object.keys(frame.savedVars)) {
							if (!MK.has(k)) ctx.vars[k] = frame.savedVars[k];
						}
					}
					if (frame.returnVar !== null && frame.returnVar !== undefined && retValue !== undefined) {
						ctx.vars[frame.returnVar] = retValue;
						pushLog(`📌 ${frame.returnVar} = ${retValue}`);
					}
					this.renderVarsTable(ctx.vars);
					if (frame.returnBlock) {
						ctx.currentBlock = frame.returnBlock;
						this.highlightBlock(frame.returnBlock, '#f39c12');
					} else {
						pushLog('🔵 Виконання завершено');
						this.highlightBlock(block, '#2ecc71');
						this.renderVarsTable(ctx.vars);
						ctx.done = true;
						document.getElementById('stepBtn').disabled = true;
					}
					return;
				}
				pushLog('🔵 Виконання завершено');
				this.highlightBlock(block, '#2ecc71');
				this.renderVarsTable(ctx.vars);
				ctx.done = true;
				document.getElementById('stepBtn').disabled = true;
				return;
			}
			case 'process':
				try {
				// Виконуємо кожен вираз окремо і явно записуємо у ctx.vars.
				                    // with(vars){} не створює нові ключі в об'єкті — парсимо присвоєння вручну.
				                    // Підтримуємо: "a = 5", "a = 5; b = 10", "SUM = a+b", "i++"
				                    const statements = text.split(';').map(s => s.trim()).filter(Boolean);
				                    for (const stmt of statements) {
                                        //const asgn = stmt.match(/^([a-zA-Z_$][\w$]*)\s*([+\-*\/]?=)\s*(.+)$/s);
                                        
                                        const asgnIdx = stmt.match(/^([a-zA-Z_$][\w$]*)\s*\[(.+?)\]\s*([+\-*\/]?=)\s*(.+)$/s);
                                        const asgn    = !asgnIdx && stmt.match(/^([a-zA-Z_$][\w$]*)\s*([+\-*\/]?=)\s*(.+)$/s);
                                        
                                        if (asgnIdx) {
                                            const arrName = asgnIdx[1];
                                            const idx  = new Function('vars', `with(vars){ return (${asgnIdx[2]}); }`)(ctx.vars);
                                            const op   = asgnIdx[3];
                                            const rhs  = new Function('vars', `with(vars){ return (${asgnIdx[4].trim()}); }`)(ctx.vars);
                                            const arr  = ctx.vars[arrName];
                                            if (Array.isArray(arr)) {
                                                if      (op === '=')  arr[idx] = rhs;
                                                else if (op === '+=') arr[idx] += rhs;
                                                else if (op === '-=') arr[idx] -= rhs;
                                                else if (op === '*=') arr[idx] *= rhs;
                                                else if (op === '/=') arr[idx] /= rhs;
                                            }
                                        } else if (asgn) {
				                            const lhs = asgn[1], op = asgn[2], rhs = asgn[3].trim();
				                            const rhsVal = new Function('vars', `with(vars){ return (${rhs}); }`)(ctx.vars);
				                            if      (op === '=')  ctx.vars[lhs] = rhsVal;
				                            else if (op === '+=') ctx.vars[lhs] += rhsVal;
				                            else if (op === '-=') ctx.vars[lhs] -= rhsVal;
				                            else if (op === '*=') ctx.vars[lhs] *= rhsVal;
				                            else if (op === '/=') ctx.vars[lhs] /= rhsVal;
				                        } else {
				                            // Без присвоєння (напр. i++): виконуємо і зберігаємо зміни
				                            // i++ через with не збереже — витягуємо змінну вручну
				                            const incDecMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\s*(\+\+|--)$/) ||
				                                                stmt.match(/^(\+\+|--)\s*([a-zA-Z_$][\w$]*)$/);
				                            if (incDecMatch) {
				                                const varName = incDecMatch[1].match(/^[+\-]/) ? incDecMatch[2] : incDecMatch[1];
				                                const op = stmt.includes('++') ? '++' : '--';
				                                if (op === '++') ctx.vars[varName] = (ctx.vars[varName] || 0) + 1;
				                                else             ctx.vars[varName] = (ctx.vars[varName] || 0) - 1;
				                            } else {
				                                new Function('vars', `with(vars){ ${stmt} }`)(ctx.vars);
				                            }
				                        }
				                    }
					pushLog(`📌 Виконано: ${text}`);
				} catch(e) {
					pushLog(`❌ Помилка: ${e.message}`);
					ctx.done = true;
					return;
				}
				break;
			case 'input': {
				const varName = text.trim();
				if (varName) {
					const val = await inputData(`Введіть значення для "${varName}":`);
					if (val === null) return; // cancelled — don't advance
					ctx.vars[varName] = isNaN(val) || val.trim() === '' ? val : Number(val);
					pushLog(`📥 ${varName} = ${ctx.vars[varName]}`);
				}
				break;
			}
			case 'output': {
				const result = evalOutputArgs(text, ctx);
				pushLog(`📤 ${result}`);
				break;
			}
			case 'decision': {
				try {
					const f = new Function('vars', `with(vars){ return (${text}); }`);
					const cond = f(ctx.vars);
					pushLog(`⚖️ Умова: ${text} → ${cond ? 'ТАК' : 'НІ'}`);
					let next = null;
					if (cond && block.connections.true)  next = this.blocks.get(block.connections.true);
					if (!cond && block.connections.false) next = this.blocks.get(block.connections.false);
					if (next) {
						ctx.currentBlock = next;
						this.renderVarsTable(ctx.vars);
						this.highlightBlock(next, '#f39c12');
					} else {
						pushLog(`⚠️ Немає з'єднання для вітки`);
						ctx.done = true;
					}
				} catch(e) {
					pushLog(`❌ Помилка умови: ${e.message}`);
					ctx.done = true;
				}
				return;
			}
		case 'loop': {
			const MAX_ITER = 10000;
			let loopEntry = ctx.loopStack.length > 0 && ctx.loopStack[ctx.loopStack.length-1].block === block
				? ctx.loopStack[ctx.loopStack.length-1] : null;

			if (!loopEntry) {
				const loopConns = this.connections.filter(c => c.from.id === block.id);
				const bodyConn = loopConns.find(c => c.fromPort === 'out');
				const doneConn = loopConns.find(c => c.fromPort === 'done');
				const forParams = parseForLoop(text);
				let resolvedFor = null;
				if (forParams) {
					const fromVal = evalForExpr(forParams.fromExpr, ctx.vars);
					const toVal   = evalForExpr(forParams.toExpr,   ctx.vars);
					const stepVal = evalForExpr(forParams.stepExpr, ctx.vars);
					if (isNaN(fromVal) || isNaN(toVal) || isNaN(stepVal) || stepVal === 0) {
						pushLog(`❌ For-цикл: некоректні параметри`);
						ctx.done = true; return;
					}
					resolvedFor = { varName: forParams.varName, fromVal, toVal, stepVal };
					ctx.vars[forParams.varName] = fromVal;
					pushLog(`🔢 For-цикл: ${forParams.varName} від ${fromVal} до ${toVal}, крок ${stepVal}`);
				}
				loopEntry = { block, bodyConn, doneConn, iterations: 0, forParams: resolvedFor };
				ctx.loopStack.push(loopEntry);
			}

			try {
				let cond;
				if (loopEntry.forParams) {
					// ✅ ІНКРЕМЕНТ ВИКОНУЄТЬСЯ ТІЛЬКИ ПІСЛЯ ПЕРШОЇ ІТЕРАЦІЇ
					if (loopEntry.iterations > 0) {
						ctx.vars[loopEntry.forParams.varName] += loopEntry.forParams.stepVal;
					}

					const { varName, toVal, stepVal } = loopEntry.forParams;
					cond = stepVal >= 0 ? ctx.vars[varName] <= toVal : ctx.vars[varName] >= toVal;
					loopEntry.iterations++;
					pushLog(`🔄 For [${loopEntry.iterations}]: ${varName} = ${ctx.vars[varName]} (до ${toVal}) → ${cond ? 'продовжуємо' : 'вихід'}`);
				} else {
					const f = new Function('vars', `with(vars){ return (${text}); }`);
					cond = f(ctx.vars);
					loopEntry.iterations++;
					pushLog(`🔄 Цикл [${loopEntry.iterations}]: ${text} = ${cond}`);
				}

				if (loopEntry.iterations > MAX_ITER) {
					pushLog(`⚠️ Перевищено ліміт ітерацій (${MAX_ITER})`);
					ctx.done = true; ctx.loopStack.pop(); return;
				}

				if (cond) {
					if (loopEntry.bodyConn) {
						ctx.currentBlock = this.blocks.get(loopEntry.bodyConn.to.id);
						this.renderVarsTable(ctx.vars);
						this.highlightBlock(ctx.currentBlock, '#9b59b6');
					} else { pushLog('⚠️ Немає тіла циклу'); ctx.done = true; ctx.loopStack.pop(); }
				} else {
					pushLog(`→ Вихід з циклу`);
					ctx.loopStack.pop();
					if (loopEntry.doneConn) {
						ctx.currentBlock = this.blocks.get(loopEntry.doneConn.to.id);
						this.renderVarsTable(ctx.vars);
						this.highlightBlock(ctx.currentBlock, '#f39c12');
					} else { pushLog('⚠️ Немає виходу з циклу'); ctx.done = true; }
				}
			} catch(e) { pushLog(`❌ Помилка циклу: ${e.message}`); ctx.done = true; ctx.loopStack.pop(); }
			return;
		}
			case 'function': {
				const mCall = text.match(/^([a-zA-Z_$][\w$]*)\s*=\s*([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
				const mProc = text.match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
				let returnVar = null, funcName, passedArgs;
				if (mCall) {
					returnVar = mCall[1].trim(); funcName = mCall[2].trim();
					passedArgs = mCall[3].split(',').map(a => a.trim()).filter(Boolean);
				} else if (mProc) {
					funcName = mProc[1].trim();
					passedArgs = mProc[2].split(',').map(a => a.trim()).filter(Boolean);
				} else { pushLog('❌ Некоректний виклик функції'); ctx.done = true; return; }

				if (!this.functions || !this.functions.has(funcName)) {
					pushLog(`❌ Функцію "${funcName}" не знайдено`); ctx.done = true; return;
				}
				const funcDef = this.functions.get(funcName);
				const argValues = [];
				for (let i = 0; i < funcDef.args.length; i++) {
					try {
						argValues.push(new Function('vars', `with(vars){ return (${passedArgs[i]}); }`)(ctx.vars));
					} catch(e) { pushLog(`❌ Помилка аргументу: ${e.message}`); ctx.done = true; return; }
				}
				const label = returnVar
					? `📞 Виклик функції "${funcName}" → результат у "${returnVar}"`
					: `📞 Виклик процедури "${funcName}"`;
				pushLog(label);
				// Зберігаємо стан у callStack
				const nextAfterCall = block.generalConnections.length > 0
					? this.blocks.get(block.generalConnections[0]) : null;
				ctx.callStack.push({ returnBlock: nextAfterCall, savedVars: { ...ctx.vars }, returnVar, funcName });
				// Передаємо аргументи
				for (let i = 0; i < funcDef.args.length; i++) ctx.vars[funcDef.args[i]] = argValues[i];
				// Переходимо до тіла функції
				if (funcDef.bodyBlock) {
					this.renderVarsTable(ctx.vars);
					ctx.currentBlock = funcDef.bodyBlock;
					this.highlightBlock(funcDef.bodyBlock, '#1abc9c');
				} else {
					pushLog(`⚠️ Функція "${funcName}" не має тіла`); ctx.done = true;
				}
				return;
			}
			case 'comment':
				pushLog(`💬 ${text}`);
				break;
		}

		// Update variable table and highlight changed vars
		this.renderVarsTable(ctx.vars);
		// Highlight changed values
		const MATH_KEYS2 = new Set(Object.getOwnPropertyNames(Math));
		const varsAfter = Object.fromEntries(
			Object.entries(ctx.vars).filter(([k]) => !MATH_KEYS2.has(k))
		);
		const rows = document.querySelectorAll('#vars-body tr');
		const keys = Object.keys(varsAfter);
		rows.forEach((row, i) => {
			const k = keys[i];
			if (k && JSON.stringify(varsBefore[k]) !== JSON.stringify(varsAfter[k])) {
				row.classList.add('var-changed');
				setTimeout(() => row.classList.remove('var-changed'), 800);
			}
		});

		// Advance to next block
		// If we're in the body of a loop, go back to loop block
	// ── ADVANCE TO NEXT BLOCK ──
	if (ctx.loopStack.length > 0) {
		const top = ctx.loopStack[ctx.loopStack.length - 1];
		// Якщо поточний блок явно повертає на батьківський цикл (in-left або back-arc)
		if (this.connections.some(c => c.from === block && c.to === top.block)) {
			ctx.currentBlock = top.block;
			this.highlightBlock(top.block, '#9b59b6');
			return;
		}
	}

	const getNextBlock = (blk) => {
		const conn = this.connections.find(c => c.from === blk && c.fromPort === 'out');
		return conn ? conn.to : null;
	};
	const next = getNextBlock(block);
	if (next) {
		ctx.currentBlock = next;
		this.highlightBlock(next, '#f39c12');
	} else if (block.type !== 'end') { 
		pushLog('⚠️ Немає наступного блоку');
		ctx.done = true;
	}
	}

	resetStepExecution() {
		this._stepContext = null;
		this.clearHighlight();
		document.getElementById('result').innerHTML = '';
		document.getElementById('resetStepBtn').style.display = 'none';
		document.getElementById('vars-panel').style.display = "none";
		document.getElementById('stepBtn').disabled = false;
		this.renderVarsTable({});
	}
	

stopExecution() {
    this.isStopped = true;
    const ctx = this._stepContext;
    if (ctx && !ctx.done) {
        ctx.done = true;
        const out = document.getElementById('result');
        out.innerHTML += '<br><span style="color:#e74c3c;font-weight:bold;">⛔ Виконання зупинено користувачем</span>';
        updateOutputWindow(out.innerHTML);
    }
    document.getElementById('btn-stop-exec').style.display = 'none';
    document.getElementById('stepBtn').disabled = false;
    document.getElementById('runBtn').disabled = false;
}	

	// ── SAVE / LOAD ──────────────────────────────────────────────────────────
	saveToFile(filename) {
		const blocksData = [];
		this.blocks.forEach(b => {
			blocksData.push({ id: b.id, type: b.type, x: b.x, y: b.y, text: b.text, h: b.h,
				connections: b.connections, generalConnections: b.generalConnections });
		});
		const connsData = this.connections.map(c => ({
			fromId: c.from.id, fromPort: c.fromPort,
			toId: c.to.id, toPort: c.toPort, branch: c.branch,
			isCustom: c.isCustom,
			waypoints: c.waypoints ? c.waypoints.map(p => ({ x: p.x, y: p.y, axis: p.axis })) : null
		}));
		const json = JSON.stringify({ version: 1, nextId: this.nextId, blocks: blocksData, connections: connsData }, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = filename.endsWith('.fcd') ? filename : filename + '.fcd';
		a.click();
		URL.revokeObjectURL(a.href);
	}

	loadFromJSON(json) {
		try {
			const data = JSON.parse(json);
			this.clear();
			this.nextId = data.nextId || 1;
			// Відновлюємо блоки
			data.blocks.forEach(bd => {
				const b = new Block(bd.id, bd.type, bd.x, bd.y, bd.text);
				b.connections = bd.connections || { true: null, false: null };
				b.generalConnections = bd.generalConnections || [];
				if (bd.h && bd.h !== b.h) {
					b.h = bd.h;
					b.shape.x = bd.x; b.shape.y = bd.y;
					b.shape.graphics.clear();
					const sc = b.type === 'comment' ? '#aaaaaa' : '#000';
					const fc = b.type === 'comment' ? 'rgba(127,140,141,0.5)' : getBlockColor(b.type);
					b.shape.graphics.setStrokeStyle(b.type === 'comment' ? 1.5 : 2).beginStroke(sc).beginFill(fc);
					b._drawShapeGraphics(b.shape.graphics, b.type, b.w, bd.h, 0);
					b.textField.y = bd.y + bd.h / 2 - b.textField.getMeasuredHeight() / 2;
					const defs = getPortDefs(b.type);
					b.portDots.forEach((dot, i) => {
						const def = defs[i];
						const dy = def.dy === BLOCK_HEIGHT ? bd.h : def.dy;
						dot.x = bd.x + def.dx; dot.y = bd.y + dy;
					});
				}
				this.blocks.set(bd.id, b);
			});
			// Відновлюємо з'єднання
			data.connections.forEach(cd => {
				const from = this.blocks.get(cd.fromId);
				const to   = this.blocks.get(cd.toId);
				if (!from || !to) return;
				const connObj = { from, fromPort: cd.fromPort, to, toPort: cd.toPort,
					branch: cd.branch, isCustom: cd.isCustom || false,
					waypoints: cd.waypoints || null };
				this.connections.push(connObj);
			});
			this.updateAllConnections();
			stage.update();
			return true;
		} catch(e) {
			console.error('Помилка завантаження:', e);
			return false;
		}
	}

async execute() {
    // Головний start
    this.isStopped = false;
    let startBlock = null;
    
    for (let block of this.blocks.values()) {
        if (block.type === 'start' && !block.text.trim().match(/^[a-zA-Z_$][\w$]*\s*\(/i)) {
            startBlock = block; break;
        }
    }
    if (!startBlock) {
        document.getElementById('result').innerHTML = '❌ Помилка: Не знайдено блок "Початок"';
        return;
    }

    // 1️⃣ Реєстрація допоміжних алгоритмів
    this.functions = new Map();
    {
        for (const b of this.blocks.values()) {
            if (b.type !== 'start') continue;
            const m = b.text.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
            if (!m) continue;
            const funcName = m[1];
            const args = m[2].split(',').map(a => a.trim()).filter(Boolean);
            const bodyBlock = b.generalConnections.length > 0 ? this.blocks.get(b.generalConnections[0]) : null;
            this.functions.set(funcName, { definitionBlock: b, bodyBlock, args });
        }
    }

    const context = { vars: {}, output: [], callStack: [], done: false, activeLoops: new Set() };
    Object.getOwnPropertyNames(Math).forEach(k => context.vars[k] = Math[k]);

	const getNext = (blk) => {
		const conn = this.connections.find(c => c.from === blk && c.fromPort === 'out');
		return conn ? conn.to : null;
	};
    // 🔽 ДОДАНО: Миттєве оновлення інтерфейсу при кожному виведенні
    const pushLog = (msg) => {
        context.output.push(msg);
        const html = context.output.join('<br>');
        document.getElementById('result').innerHTML = html;
        updateOutputWindow(html);
    };

    const executeSingle = async (block) => {
        if (!block) return;
        const text = block.text;
        switch (block.type) {
            case 'process':
                try {
                    const statements = text.split(';').map(s => s.trim()).filter(Boolean);
                    for (const stmt of statements) {
                        // Спочатку перевіряємо arr[idx] op= rhs (підтримка масивів)
                        const asgnIdx = stmt.match(/^([a-zA-Z_$][\w$]*)\s*\[(.+?)\]\s*([+\-*\/]?=)\s*(.+)$/s);
                        const asgn    = !asgnIdx && stmt.match(/^([a-zA-Z_$][\w$]*)\s*([+\-*\/]?=)\s*(.+)$/s);
                        if (asgnIdx) {
                            const arrName = asgnIdx[1];
                            const idx  = new Function('vars', `with(vars){ return (${asgnIdx[2]}); }`)(context.vars);
                            const op   = asgnIdx[3];
                            const rhs  = new Function('vars', `with(vars){ return (${asgnIdx[4].trim()}); }`)(context.vars);
                            const arr  = context.vars[arrName];
                            if (Array.isArray(arr)) {
                                if      (op === '=')  arr[idx] = rhs;
                                else if (op === '+=') arr[idx] += rhs;
                                else if (op === '-=') arr[idx] -= rhs;
                                else if (op === '*=') arr[idx] *= rhs;
                                else if (op === '/=') arr[idx] /= rhs;
                            }
                        } else if (asgn) {
                            const lhs = asgn[1], op = asgn[2], rhs = asgn[3].trim();
                            const rhsVal = new Function('vars', `with(vars){ return (${rhs}); }`)(context.vars);
                            if      (op === '=')  context.vars[lhs] = rhsVal;
                            else if (op === '+=') context.vars[lhs] += rhsVal;
                            else if (op === '-=') context.vars[lhs] -= rhsVal;
                            else if (op === '*=') context.vars[lhs] *= rhsVal;
                            else if (op === '/=') context.vars[lhs] /= rhsVal;
                        } else {
                            const incDecMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\s*(\+\+|--)$/) ||
                                                stmt.match(/^(\+\+|--)\s*([a-zA-Z_$][\w$]*)$/);
                            if (incDecMatch) {
                                const varName = incDecMatch[1].match(/^[+\-]/) ? incDecMatch[2] : incDecMatch[1];
                                if (stmt.includes('++')) context.vars[varName] = (context.vars[varName] || 0) + 1;
                                else                     context.vars[varName] = (context.vars[varName] || 0) - 1;
                            } else {
                                new Function('vars', `with(vars){ ${stmt} }`)(context.vars);
                            }
                        }
                    }
                    pushLog(`📌 Виконано: ${text}`);
                } catch (e) { pushLog(`❌ ${e.message}`); }
                break;
                break;
            case 'input': {
                const varName = text.trim();
                if (varName) {
                    const val = await inputData(`Введіть значення для "${varName}":`);
                    if (val === null) { pushLog(`⛔ Введення скасовано для "${varName}"`); context.done = true; return; }
                    context.vars[varName] = isNaN(val) || val.trim() === '' ? val : Number(val);
                    pushLog(`📥 ${varName} = ${val}`);
                }
                break;
            }
            case 'output': {
                const result = evalOutputArgs(text, context);
                pushLog(`📤 ${result}`);
                break;
            }
            case 'comment': pushLog(`💬 ${text}`); break;
        }
    };

    const executeBlock = async (block) => {
        if (!block || context.done || this.isStopped) return;
        const text = block.text;

        switch (block.type) {
            case 'start': {
                const isHeader = block.text.trim().match(/^[a-zA-Z_$][\w$]*\s*\([^)]*\)/i);
                if (isHeader) return;
                pushLog('🟢 Початок виконання');
                break; 
            }
            case 'end':
                if (context.callStack.length > 0) {
                    const frame = context.callStack.pop();
                    let retValue = undefined;
                    if (frame.returnVar && frame.funcName) {
                        retValue = context.vars[frame.funcName];
                        pushLog(`↩️ Повернення з функції "${frame.funcName}" = ${retValue}`);
                    } else {
                        pushLog('↩️ Повернення з процедури');
                    }
                    if (frame.savedVars) {
                        const MATH_KEYS = new Set(Object.getOwnPropertyNames(Math));
                        for (const k of Object.keys(context.vars)) {
                            if (!MATH_KEYS.has(k) && !(k in frame.savedVars)) delete context.vars[k];
                        }
                        for (const k of Object.keys(frame.savedVars)) {
                            if (!new Set(Object.getOwnPropertyNames(Math)).has(k)) context.vars[k] = frame.savedVars[k];
                        }
                    }
                    if (frame.returnVar !== null && frame.returnVar !== undefined && retValue !== undefined) {
                        context.vars[frame.returnVar] = retValue;
                        pushLog(`📌 ${frame.returnVar} = ${retValue}`);
                    }
                    if (frame.returnBlock) await executeBlock(frame.returnBlock);
                    else {
                        pushLog('🔵 Виконання завершено');
                        context.done = true;
                    }
                } else {
                    pushLog('🔵 Виконання завершено');
                    context.done = true;
                }
                return;
            case 'function': {
                const mCall = text.match(/^([a-zA-Z_$][\w$]*)\s*=\s*([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
                const mProc = text.match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
                let returnVar = null, funcName, passedArgs;
                if (mCall) {
                    returnVar = mCall[1].trim(); funcName = mCall[2].trim();
                    passedArgs = mCall[3].split(',').map(a => a.trim()).filter(Boolean);
                } else if (mProc) {
                    funcName = mProc[1].trim(); passedArgs = mProc[2].split(',').map(a => a.trim()).filter(Boolean);
                } else { pushLog('❌ Некоректний виклик функції'); return; }

                if (!this.functions.has(funcName)) { pushLog(`❌ Функцію "${funcName}" не знайдено`); return; }
                const funcDef = this.functions.get(funcName);
                const argValues = [];
                for (let i = 0; i < funcDef.args.length; i++) {
                    try { argValues.push(new Function('vars', `with(vars){ return (${passedArgs[i]}); }`)(context.vars)); }
                    catch (e) { pushLog(`❌ Помилка аргументу ${funcDef.args[i]}: ${e.message}`); return; }
                }
                const callLabel = returnVar ? `📞 Виклик функції "${funcName}" → результат у "${returnVar}"` : `📞 Виклик процедури "${funcName}"`;
                pushLog(callLabel);

                context.callStack.push({ returnBlock: getNext(block), savedVars: { ...context.vars }, returnVar, funcName });
                for (let i = 0; i < funcDef.args.length; i++) context.vars[funcDef.args[i]] = argValues[i];

                if (funcDef.bodyBlock) await executeBlock(funcDef.bodyBlock);
                else {
                    pushLog(`⚠️ Функція "${funcName}" не має тіла`);
                    const frame = context.callStack.pop();
                    if (frame) {
                        Object.assign(context.vars, frame.savedVars);
                        if (frame.returnBlock) await executeBlock(frame.returnBlock);
                    }
                }
                return;
            }
            case 'decision':
                try {
                    const func = new Function('vars', `with(vars){ return (${text}); }`);
                    const condition = func(context.vars);
                    pushLog(`⚖️ Умова: ${text} = ${condition}`);
                    let nextBlock = null;
                    if (condition && block.connections.true) { nextBlock = this.blocks.get(block.connections.true); pushLog(`╰┈➤ Вітка "ТАК"`); }
                    else if (!condition && block.connections.false) { nextBlock = this.blocks.get(block.connections.false); pushLog(`╰┈➤ Вітка "НІ"`); }
                    if (nextBlock) await executeBlock(nextBlock);
                    else pushLog(`⚠️ Немає з'єднання для вітки`);
                    return;
                } catch (e) { pushLog(`❌ Помилка умови: ${e.message}`); return; }
		case 'loop': {
			// Запобігаємо перезапуску, якщо цикл вже виконується
			if (context.activeLoops.has(block.id)) return;
			context.activeLoops.add(block.id);

			const loopConns = this.connections.filter(c => c.from === block);
			const bodyConn = loopConns.find(c => c.fromPort === 'out');
			const doneConn = loopConns.find(c => c.fromPort === 'done');
			if (!bodyConn) { context.activeLoops.delete(block.id); pushLog(`⚠️ Цикл не має тіла`); return; }

			const MAX_ITER = 10000;
			let iterations = 0;

			const executeBodyUntilLoop = async (startBlk, ancestorIds) => {
				let cur = startBlk;
				let safetyCounter = 0;
				while (cur && safetyCounter++ < 100000) {
					if (context.done) return;
					if (cur.type === 'loop' && ancestorIds.has(cur.id)) return;

					if (cur.type === 'loop') {
						// Вкладений цикл: викликаємо executeBlock, який сам обробить doneConn.
						// Після повернення — не продовжуємо (doneConn вже виконано всередині).
						await executeBlock(cur);
						return;
					} else if (cur.type === 'decision') {
						try {
							const cond = new Function('vars', `with(vars){ return (${cur.text}); }`)(context.vars);
							pushLog(`⚖️ Умова: ${cur.text} → ${cond ? 'ТАК' : 'НІ'}`);
							const nextConn = cond
								? this.connections.find(c => c.from === cur && c.fromPort === 'true')
								: this.connections.find(c => c.from === cur && c.fromPort === 'false');
							cur = nextConn ? nextConn.to : null;
							if (cur && cur.type === 'loop' && ancestorIds.has(cur.id)) return;
						} catch(e) { pushLog(`❌ Помилка умови: ${e.message}`); context.done = true; return; }
					} else if (cur.type === 'end') {
						await executeSingle(cur);
						context.done = true;
						return;
					} else {
						await executeSingle(cur);
						if (context.done) return;
						const outConn = this.connections.find(c => c.from === cur && c.fromPort === 'out');
						cur = outConn ? outConn.to : null;
						if (cur && cur.type === 'loop' && ancestorIds.has(cur.id)) return;
					}
				}
			};

			try {
				const forParams = parseForLoop(text);
				if (forParams) {
					const { varName, fromExpr, toExpr, stepExpr } = forParams;
					const fromVal = evalForExpr(fromExpr, context.vars);
					const toVal   = evalForExpr(toExpr,   context.vars);
					const stepVal = evalForExpr(stepExpr, context.vars);
					if (isNaN(fromVal) || isNaN(toVal) || isNaN(stepVal) || stepVal === 0) {
						pushLog(`❌ For-цикл: некоректні параметри`); return;
					}
					context.vars[varName] = fromVal;
					pushLog(`🔢 For-цикл: ${varName} від ${fromVal} до ${toVal}, крок ${stepVal}`);

					const condOk = () => stepVal >= 0 ? context.vars[varName] <= toVal : context.vars[varName] >= toVal;
					while (condOk() && !context.done && !this.isStopped) {
						if (iterations++ >= MAX_ITER) { pushLog(`⚠️ Ліміт ітерацій`); context.done = true; return; }
						pushLog(`🔄 [${iterations}] ${varName} = ${context.vars[varName]}`);
						await executeBodyUntilLoop(bodyConn.to, new Set([block.id]));
						if (context.done) return;
						context.vars[varName] += stepVal;
					}
					pushLog(`→ Вихід з for-циклу`);
				} else {
					const loopFunc = new Function('vars', `with(vars){ return (${text}); }`);
					let cond;
					try { cond = loopFunc(context.vars); } catch(e) { pushLog(`❌ Помилка умови`); return; }
					while (cond && !context.done && !this.isStopped) {
						if (iterations++ >= MAX_ITER) { pushLog(`⚠️ Ліміт ітерацій`); context.done = true; return; }
						pushLog(`🔄 [${iterations}] ${text} = true`);
						await executeBodyUntilLoop(bodyConn.to, new Set([block.id]));
						if (context.done) return;
						try { cond = loopFunc(context.vars); } catch(e) { return; }
					}
					pushLog(`→ Вихід з while-циклу`);
				}
			} finally {
				context.activeLoops.delete(block.id);
			}
			// Викликаємо done-гілку ПІСЛЯ видалення з activeLoops
			if (!context.done && doneConn) await executeBlock(doneConn.to);
			return;
		}
        }
        await executeSingle(block);
        const nextBlock = getNext(block);
        if (nextBlock) await executeBlock(nextBlock);
        else if (block.type !== 'end' && !context.callStack.length) pushLog('⚠️ Немає наступного блоку');
    };

    context.output = [];
    const outWin = document.getElementById('output-window');
    if (outWin) {
        outWin.style.display = 'flex';
        outWin.querySelector('#output-content').innerHTML = '';
    }
    await executeBlock(startBlock);
}
}
const flowchartManager = new FlowchartManager();

// ── EXAMPLES ────────────────────────────────────────────────────────────────

const EXAMPLES = [
	{
		title: '1. Сума двох чисел (a=123, b=654)',
		build(fm) {
			const cx = 280;
			const b0 = fm.addBlock('start',   cx, 30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження суми\na = 123 і b = 654');
			const b2 = fm.addBlock('process', cx, 120); setText(b2, 'a = 123');
			const b3 = fm.addBlock('process', cx, 210); setText(b3, 'b = 654');
			const b4 = fm.addBlock('process', cx, 300); setText(b4, 'S = a + b');
			const b5 = fm.addBlock('output',  cx, 390); setText(b5, '"S =", S');
			const b6 = fm.addBlock('end',     cx, 480);
			fm.addConnection(b0,'out',b2,'in');
			fm.addConnection(b2,'out',b3,'in'); fm.addConnection(b3,'out',b4,'in');
			fm.addConnection(b4,'out',b5,'in'); fm.addConnection(b5,'out',b6,'in');
		}
	},
	{
		title: '2. Периметр трикутника',
		build(fm) {
			const cx = 280;
			const b0 = fm.addBlock('start',   cx,  30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Периметр трикутника\nзі сторонами a, b, c');
			const b1 = fm.addBlock('input',   cx, 120); setText(b1, 'a');
			const b2 = fm.addBlock('input',   cx, 210); setText(b2, 'b');
			const b3 = fm.addBlock('input',   cx, 300); setText(b3, 'c');
			const b4 = fm.addBlock('process', cx, 390); setText(b4, 'p = a + b + c');
			const b5 = fm.addBlock('output',  cx, 480); setText(b5, '"Периметр p =", p');
			const b6 = fm.addBlock('end',     cx, 570);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',b5,'in');
			fm.addConnection(b5,'out',b6,'in');
		}
	},
	{
		title: '3. Більше з двох чисел',
		build(fm) {
			const cx = 260;
			const b0 = fm.addBlock('start',    cx,      20);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження більшого\nз двох чисел a і b');
			const b1 = fm.addBlock('input',    cx,     115); setText(b1, 'a');
			const b2 = fm.addBlock('input',    cx,     210); setText(b2, 'b');
			const b3 = fm.addBlock('decision', cx-15,  310); setText(b3, 'a > b');
			const b4 = fm.addBlock('output',   cx,     440); setText(b4, '"Більше: a =", a');
			const b5 = fm.addBlock('output',   cx+220, 440); setText(b5, '"Більше: b =", b');
			const b6 = fm.addBlock('end',      cx+100, 550);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'true', b4,'in');
			fm.addConnection(b3,'false',b5,'in');
			fm.addConnection(b4,'out',b6,'in');
			fm.addConnection(b5,'out',b6,'in');
		}
	},
	{
		title: '4. Більше з трьох чисел',
		build(fm) {
			const cx = 260;
			const b0 = fm.addBlock('start',    cx,      20);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження більшого\nз трьох чисел a, b, c');
			const b1 = fm.addBlock('input',    cx,     120); setText(b1, 'a');
			const b2 = fm.addBlock('input',    cx,     210); setText(b2, 'b');
			const b3 = fm.addBlock('input',    cx,     305); setText(b3, 'c');
			const d1 = fm.addBlock('decision', cx-15,  400); setText(d1, 'a >= b');
			const d2 = fm.addBlock('decision', cx-15,  540); setText(d2, 'a >= c');
			const d3 = fm.addBlock('decision', cx+300, 540); setText(d3, 'b >= c');
			const o1 = fm.addBlock('output',   cx,     680); setText(o1, '"Більше: a =", a');
			const o2 = fm.addBlock('output',   cx+200, 680); setText(o2, '"Більше: c =", c');
			const o3 = fm.addBlock('output',   cx+400, 680); setText(o3, '"Більше: b =", b');
			const o4 = fm.addBlock('output',   cx+600, 680); setText(o4, '"Більше: c =", c');
			const en = fm.addBlock('end',      cx+200, 790);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',d1,'in');
			fm.addConnection(d1,'true', d2,'in');
			fm.addConnection(d1,'false',d3,'in');
			fm.addConnection(d2,'true', o1,'in');
			fm.addConnection(d2,'false',o2,'in');
			fm.addConnection(d3,'true', o3,'in');
			fm.addConnection(d3,'false',o4,'in');
			fm.addConnection(o1,'out',en,'in'); fm.addConnection(o2,'out',en,'in');
			fm.addConnection(o3,'out',en,'in'); fm.addConnection(o4,'out',en,'in');
		}
	},
	{
		title: '5. Обмін значеннями двох змінних',
		build(fm) {
			const cx = 280;
			const b0 = fm.addBlock('start',   cx,  30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Обмін значеннями\nзмінних a та b');
			const b1 = fm.addBlock('input',   cx, 120); setText(b1, 'a');
			const b2 = fm.addBlock('input',   cx, 210); setText(b2, 'b');
			const b3 = fm.addBlock('process', cx, 300); setText(b3, 'tmp = a');
			const b4 = fm.addBlock('process', cx, 390); setText(b4, 'a = b');
			const b5 = fm.addBlock('process', cx, 480); setText(b5, 'b = tmp');
			const b6 = fm.addBlock('output',  cx, 570); setText(b6, '"a =", a');
			const b7 = fm.addBlock('output',  cx, 670); setText(b7, '"b =", b');
			const b8 = fm.addBlock('end',     cx, 770);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',b5,'in');
			fm.addConnection(b5,'out',b6,'in'); fm.addConnection(b6,'out',b7,'in');
			fm.addConnection(b7,'out',b8,'in'); 
		}
	},
	{
		title: '6. НСД через віднімання',
		build(fm) {
			const cx = 260;
			const b0 = fm.addBlock('start',    cx,      30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'НСД двох чисел\nметодом віднімання');
			const b1 = fm.addBlock('input',    cx,     120); setText(b1, 'a');
			const b2 = fm.addBlock('input',    cx,     210); setText(b2, 'b');
			const d1 = fm.addBlock('decision', cx-15,  310); setText(d1, 'a != b');
			const d2 = fm.addBlock('decision', cx-15,  450); setText(d2, 'a > b');
			const p1 = fm.addBlock('process',  cx,     590); setText(p1, 'a = a - b');
			const p2 = fm.addBlock('process',  cx+290, 590); setText(p2, 'b = b - a');
			const ou = fm.addBlock('output',   cx+400,     710); setText(ou, '"НСД =", a');
			const en = fm.addBlock('end',      cx,     820);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',d1,'in');
			fm.addConnection(d1,'true', d2,'in');
			fm.addConnection(d1,'false',ou,'in');
			fm.addConnection(d2,'true', p1,'in');
			fm.addConnection(d2,'false',p2,'in');
			fm.addConnection(p1,'out',d1,'in');
			fm.addConnection(p2,'out',d1,'in');
			fm.addConnection(ou,'out',en,'in');
		}
	},
	{
		title: '7. НСК двох чисел',
		build(fm) {
			const cx = 280;
			const b0 = fm.addBlock('start',    cx,      30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'НСК двох чисел\nчерез НСД');
			const b1 = fm.addBlock('input',    cx,     120); setText(b1, 'a');
			const b2 = fm.addBlock('input',    cx,     210); setText(b2, 'b');
			const b3 = fm.addBlock('process',  cx,     300); setText(b3, 'x = a; y = b');
			const d1 = fm.addBlock('decision', cx-15,  400); setText(d1, 'x != y');
			const d2 = fm.addBlock('decision', cx-15,  540); setText(d2, 'x > y');
			const p1 = fm.addBlock('process',  cx,     680); setText(p1, 'x = x - y');
			const p2 = fm.addBlock('process',  cx+290, 680); setText(p2, 'y = y - x');
			const ou = fm.addBlock('output',   cx+400,     780); setText(ou, '"НСК =", a * b / x');
			const en = fm.addBlock('end',      cx,     890);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',d1,'in');
			fm.addConnection(d1,'true', d2,'in');
			fm.addConnection(d1,'false',ou,'in');
			fm.addConnection(d2,'true', p1,'in');
			fm.addConnection(d2,'false',p2,'in');
			fm.addConnection(p1,'out',d1,'in');
			fm.addConnection(p2,'out',d1,'in');
			fm.addConnection(ou,'out',en,'in');
		}
	},
	{
		title: '8. Корінь лінійного рівняння ax = b',
		build(fm) {
			const cx = 260;
			const b0 = fm.addBlock('start',    cx,      30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Корінь лінійного\nрівняння ax = b');
			const b1 = fm.addBlock('input',    cx,     120); setText(b1, 'a');
			const b2 = fm.addBlock('input',    cx,     215); setText(b2, 'b');
			const d1 = fm.addBlock('decision', cx-15,  310); setText(d1, 'a != 0');
			const p1 = fm.addBlock('process',  cx,     450); setText(p1, 'x = b / a');
			const o1 = fm.addBlock('output',   cx,     550); setText(o1, '"x =", x');
			const o2 = fm.addBlock('output',   cx+240, 550); setText(o2, '"Рівняння не має\nєдиного кореня"');
			const en = fm.addBlock('end',      cx+100, 700);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',d1,'in');
			fm.addConnection(d1,'true', p1,'in');
			fm.addConnection(d1,'false',o2,'in');
			fm.addConnection(p1,'out',o1,'in');
			fm.addConnection(o1,'out',en,'in');
			fm.addConnection(o2,'out',en,'in');
		}
	},
	{
		title: '9. Корені квадратного рівняння ax²+bx+c=0',
		build(fm) {
			const cx = 280;
			const b0      = fm.addBlock('start',    cx,        20);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Корені квадратного\nрівняння ax²+bx+c=0');
			const inputA  = fm.addBlock('input',    cx,       120); setText(inputA, 'a');
			const inputB  = fm.addBlock('input',    cx,       210); setText(inputB, 'b');
			const inputC  = fm.addBlock('input',    cx,       300); setText(inputC, 'c');
			const calcD   = fm.addBlock('process',  cx,       390); setText(calcD,  'D = b * b - 4 * a * c');
			const decD    = fm.addBlock('decision', cx-15,    490); setText(decD,   'D >= 0');
			const decZero = fm.addBlock('decision', cx-15,    600); setText(decZero,'D == 0');
			const outTwo  = fm.addBlock('output',   cx,       710); setText(outTwo, '"x1 =", (-b + sqrt(D)) / (2 * a)');
			const outTwo2 = fm.addBlock('output',   cx,       830); setText(outTwo2,'"x2 =", (-b - sqrt(D)) / (2 * a)');
			const outOne  = fm.addBlock('output',   cx+180,   710); setText(outOne, '"x =", -b / (2 * a)');
			const outNone = fm.addBlock('output',   cx+280,   560); setText(outNone,'"Дійсних коренів немає D =", D');
			const en      = fm.addBlock('end',      cx,       960);
			fm.addConnection(b0,'out',inputA,'in');
			fm.addConnection(inputA,'out',inputB,'in'); fm.addConnection(inputB,'out',inputC,'in');
			fm.addConnection(inputC,'out',calcD,'in');  fm.addConnection(calcD,'out',decD,'in');
			fm.addConnection(decD,'true', decZero,'in');
			fm.addConnection(decD,'false',outNone,'in');
			fm.addConnection(decZero,'true', outTwo,'in');
			fm.addConnection(decZero,'false',outOne,'in');
			fm.addConnection(outTwo,'out',outTwo2,'in');
			fm.addConnection(outTwo2,'out',en,'in');
			fm.addConnection(outOne,'out',en,'in');
			fm.addConnection(outNone,'out',en,'in');
		}
	},
	{
		title: '10. Площа трикутника за формулою Герона',
		build(fm) {
			const cx = 280;
			const b0 = fm.addBlock('start',   cx,  30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Площа трикутника\nза формулою Герона');
			const b1 = fm.addBlock('input',   cx, 120); setText(b1, 'a');
			const b2 = fm.addBlock('input',   cx, 210); setText(b2, 'b');
			const b3 = fm.addBlock('input',   cx, 300); setText(b3, 'c');
			const b4 = fm.addBlock('process', cx, 390); setText(b4, 'p = (a + b + c) / 2');
			const b5 = fm.addBlock('process', cx, 480); setText(b5, 'S = sqrt(p * (p-a) * (p-b) * (p-c))');
			const b6 = fm.addBlock('output',  cx, 570); setText(b6, '"Площа S =", S');
			const b7 = fm.addBlock('end',     cx, 680);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',b5,'in');
			fm.addConnection(b5,'out',b6,'in'); fm.addConnection(b6,'out',b7,'in');
		}
	},
	{
		title: '11. Сума елементів масиву',
		build(fm) {
			const cx = 280;
			const b0  = fm.addBlock('start',   cx,  30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження суми\nелементів масиву');
			const b1  = fm.addBlock('process', cx, 120); setText(b1, 'a = [3, 7, 2, 9, 5]');
			const b2  = fm.addBlock('process', cx, 210); setText(b2, 'n = 5');
			const b3  = fm.addBlock('process', cx, 300); setText(b3, 'S = 0');
			const b4  = fm.addBlock('process', cx, 390); setText(b4, 'i = 0');
			const lp  = fm.addBlock('loop',    cx, 480); setText(lp,  'i < n');
			const b5  = fm.addBlock('process', cx, 590); setText(b5, 'S = S + a[i]');
			const b6  = fm.addBlock('process', cx, 680); setText(b6, 'i = i + 1');
			const b7  = fm.addBlock('output',  cx, 800); setText(b7, '"Сума S =", S');
			const b8  = fm.addBlock('end',     cx, 900);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',lp,'in');
			fm.addConnection(lp,'out',b5,'in');
			fm.addConnection(b5,'out',b6,'in');
			fm.addConnection(b6,'out',lp,'in-left');
			fm.addConnection(lp,'done',b7,'in');
			fm.addConnection(b7,'out',b8,'in');
		}
	},
	{
		title: '12. Середнє значення елементів масиву',
		build(fm) {
			const cx = 280;
			const b0  = fm.addBlock('start',   cx,  30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження середнього\nзначення елементів масиву');
			const b1  = fm.addBlock('process', cx, 120); setText(b1, 'a = [4, 8, 15, 16, 23]');
			const b2  = fm.addBlock('process', cx, 210); setText(b2, 'n = 5');
			const b3  = fm.addBlock('process', cx, 300); setText(b3, 'S = 0');
			const b4  = fm.addBlock('process', cx, 390); setText(b4, 'i = 0');
			const lp  = fm.addBlock('loop',    cx, 480); setText(lp,  'i < n');
			const b5  = fm.addBlock('process', cx, 590); setText(b5, 'S = S + a[i]');
			const b6  = fm.addBlock('process', cx, 680); setText(b6, 'i = i + 1');
			const b7  = fm.addBlock('process', cx, 790); setText(b7, 'avg = S / n');
			const b8  = fm.addBlock('output',  cx, 880); setText(b8, '"Середнє =", avg');
			const b9  = fm.addBlock('end',     cx, 970);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',lp,'in');
			fm.addConnection(lp,'out',b5,'in');
			fm.addConnection(b5,'out',b6,'in');
			fm.addConnection(b6,'out',lp,'in-left');
			fm.addConnection(lp,'done',b7,'in');
			fm.addConnection(b7,'out',b8,'in'); fm.addConnection(b8,'out',b9,'in');
		}
	},
	{
		title: '13. Найбільший елемент масиву',
		build(fm) {
			const cx = 260;
			const b0  = fm.addBlock('start',    cx,       30);
			fm.addBlock('comment', cx+220, 20); setText(fm.blocks.get(fm.nextId-1), 'Знаходження найбільшого\nелементу масиву');
			const b1  = fm.addBlock('process',  cx,      120); setText(b1, 'a = [3, 9, 1, 7, 5]');
			const b2  = fm.addBlock('process',  cx,      210); setText(b2, 'n = 5');
			const b3  = fm.addBlock('process',  cx,      300); setText(b3, 'max = a[0]');
			const b4  = fm.addBlock('process',  cx,      390); setText(b4, 'i = 1');
			const lp  = fm.addBlock('loop',     cx,      480); setText(lp,  'i < n');
			const d1  = fm.addBlock('decision', cx+150,   590); setText(d1, 'a[i] > max');
			const p1  = fm.addBlock('process',  cx,      730); setText(p1, 'max = a[i]');
			const b5  = fm.addBlock('process',  cx+240,  730); setText(b5, 'i = i + 1');
			const b6  = fm.addBlock('process',  cx,      840); setText(b6, 'i = i + 1');
			const b7  = fm.addBlock('output',   cx+240,  930); setText(b7, '"Максимум =", max');
			const b8  = fm.addBlock('end',      cx,     1040);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',b4,'in'); fm.addConnection(b4,'out',lp,'in');
			fm.addConnection(lp,'out',d1,'in');
			fm.addConnection(d1,'true', p1,'in');
			fm.addConnection(d1,'false',b5,'in');
			fm.addConnection(p1,'out',b6,'in');
			fm.addConnection(b5,'out',lp,'in-left');
			fm.addConnection(b6,'out',lp,'in-left');
			fm.addConnection(lp,'done',b7,'in');
			fm.addConnection(b7,'out',b8,'in');
		}
	},
	{
		title: '14. Сортування масиву методом бульбашки',
		build(fm) {
			const cx = 260;
			const b0  = fm.addBlock('start',    cx,        30);
			fm.addBlock('comment', cx+230, 20); setText(fm.blocks.get(fm.nextId-1), 'Сортування масиву\nметодом бульбашки');
			const b1  = fm.addBlock('process',  cx,       120); setText(b1, 'a = [5, 3, 8, 1, 9]');
			const b2  = fm.addBlock('process',  cx,       210); setText(b2, 'n = 5');
			const b3  = fm.addBlock('process',  cx,       300); setText(b3, 'i = 0');
			const lp1 = fm.addBlock('loop',     cx-80,       390); setText(lp1, 'i < n - 1');
			const b4  = fm.addBlock('process',  cx,       500); setText(b4, 'j = 0');
			const lp2 = fm.addBlock('loop',     cx-50,       590); setText(lp2, 'j < n - i - 1');
			const d1  = fm.addBlock('decision', cx-15,    700); setText(d1, 'a[j] > a[j+1]');
			const p1  = fm.addBlock('process',  cx,       800); setText(p1, 'tmp = a[j]');
			const p2  = fm.addBlock('process',  cx,       900); setText(p2, 'a[j] = a[j+1]');
			const p3  = fm.addBlock('process',  cx,      1000); setText(p3, 'a[j+1] = tmp');
			const b5  = fm.addBlock('process',  cx+240,   880); setText(b5, 'j = j + 1');
			const b6  = fm.addBlock('process',  cx,      1000); setText(b6, 'j = j + 1');
			const b7  = fm.addBlock('process',  cx,      1120); setText(b7, 'i = i + 1');
			const b8  = fm.addBlock('output',   cx+350,  1150); setText(b8, 'a');
			const b9  = fm.addBlock('end',      cx,      1280);
			fm.addConnection(b0,'out',b1,'in');
			fm.addConnection(b1,'out',b2,'in'); fm.addConnection(b2,'out',b3,'in');
			fm.addConnection(b3,'out',lp1,'in');
			fm.addConnection(lp1,'out',b4,'in');
			fm.addConnection(b4,'out',lp2,'in');
			fm.addConnection(lp2,'out',d1,'in');
			fm.addConnection(d1,'true', p1,'in');
			fm.addConnection(d1,'false',b5,'in');
			fm.addConnection(p1,'out',p2,'in'); fm.addConnection(p2,'out',p3,'in');
			fm.addConnection(p3,'out',b6,'in');
			fm.addConnection(b5,'out',lp2,'in-left');
			fm.addConnection(b6,'out',lp2,'in-left');
			fm.addConnection(lp2,'done',b7,'in');
			fm.addConnection(b7,'out',lp1,'in-left');
			fm.addConnection(lp1,'done',b8,'in');
			fm.addConnection(b8,'out',b9,'in');
		}
	},
	{
  title: '15. Найбільший елемент масиву (цикл FOR)',
  build(fm) {
    const cx = 280;
    const b0  = fm.addBlock('start',    cx,   30); setText(b0, 'ПОЧАТОК');
    const p1  = fm.addBlock('process',  cx,  120); setText(p1, 'a = [10, 35, 7, 22, 18]');
    const p2  = fm.addBlock('process',  cx,  210); setText(p2, 'n = 5');
    const p3  = fm.addBlock('process',  cx,  300); setText(p3, 'max = a[0]');
    const lp  = fm.addBlock('loop',     cx,  390); setText(lp, 'i = 1; n-1');
    const d1  = fm.addBlock('decision', cx-15,  540); setText(d1, 'a[i] > max');
    const p4  = fm.addBlock('process',  cx,  650); setText(p4, 'max = a[i]');
    const o1  = fm.addBlock('output',   cx,  780); setText(o1, '"Максимальний елемент: ", max');
    const b6  = fm.addBlock('end',      cx,  900);

    fm.addConnection(b0,'out', p1,'in');
    fm.addConnection(p1,'out', p2,'in');
    fm.addConnection(p2,'out', p3,'in');
    fm.addConnection(p3,'out', lp,'in');
    fm.addConnection(lp,'out', d1,'in');
    fm.addConnection(d1,'true', p4,'in');
    fm.addConnection(p4,'out', lp,'in-left');
    fm.addConnection(d1,'false', lp,'in-left');
    fm.addConnection(lp,'done', o1,'in');
    fm.addConnection(o1,'out', b6,'in');
  }
},
{
  title: '16. Кількість елементів, що > 0 (цикл FOR)',
  build(fm) {
    const cx = 280;
    const b0  = fm.addBlock('start',    cx,   30); setText(b0, 'ПОЧАТОК');
    const p1  = fm.addBlock('process',  cx,  120); setText(p1, 'a = [-3, 5, 0, 8, -1, 4, 9]');
    const p2  = fm.addBlock('process',  cx,  210); setText(p2, 'n = 7');
    const p3  = fm.addBlock('process',  cx,  300); setText(p3, 'count = 0');
    const lp  = fm.addBlock('loop',     cx,  390); setText(lp, 'i = 0; n-1');
    const d1  = fm.addBlock('decision', cx-15,  530); setText(d1, 'a[i] > 0');
    const p4  = fm.addBlock('process',  cx,  660); setText(p4, 'count = count + 1');
    const o1  = fm.addBlock('output',   cx,  770); setText(o1, '"Кількість додатних: ", count');
    const b7  = fm.addBlock('end',      cx,  880);

    fm.addConnection(b0,'out', p1,'in');
    fm.addConnection(p1,'out', p2,'in');
    fm.addConnection(p2,'out', p3,'in');
    fm.addConnection(p3,'out', lp,'in');
    fm.addConnection(lp,'out', d1,'in');
    fm.addConnection(d1,'true', p4,'in');
    fm.addConnection(p4,'out', lp,'in-left');
    fm.addConnection(d1,'false', lp,'in-left');
    fm.addConnection(lp,'done', o1,'in');
    fm.addConnection(o1,'out', b7,'in');
  }
},
{
  title: '17. Сортування бульбашкою (вкладені цикли FOR)',
  build(fm) {
    const cx = 280;
    const b0  = fm.addBlock('start',    cx,   30); setText(b0, 'ПОЧАТОК');
    const p1  = fm.addBlock('process',  cx,  110); setText(p1, 'a = [6, 3, 8, 1, 5]');
    const p2  = fm.addBlock('process',  cx,  190); setText(p2, 'n = 5');
    const lp1 = fm.addBlock('loop',     cx,  270); setText(lp1, 'i = 0; n-2');
    const lp2 = fm.addBlock('loop',     cx,  400); setText(lp2, 'j = 0; n-i-2');
    const d1  = fm.addBlock('decision', cx-15,  520); setText(d1, 'a[j] > a[j+1]');
    const s1  = fm.addBlock('process',  cx,  620); setText(s1, 'tmp = a[j]');
    const s2  = fm.addBlock('process',  cx,  700); setText(s2, 'a[j] = a[j+1]');
    const s3  = fm.addBlock('process',  cx,  800); setText(s3, 'a[j+1] = tmp');
    const o1  = fm.addBlock('output',   cx+150,  890); setText(o1, 'a');
    const b7  = fm.addBlock('end',      cx,  990);

    fm.addConnection(b0,'out', p1,'in');
    fm.addConnection(p1,'out', p2,'in');
    fm.addConnection(p2,'out', lp1,'in');
    fm.addConnection(lp1,'out', lp2,'in');
    fm.addConnection(lp2,'out', d1,'in');
    fm.addConnection(d1,'true', s1,'in');
    fm.addConnection(s1,'out', s2,'in');
    fm.addConnection(s2,'out', s3,'in');
    fm.addConnection(s3,'out', lp2,'in-left');
    fm.addConnection(d1,'false', lp2,'in-left');
    fm.addConnection(lp2,'done', lp1,'in-left');
    fm.addConnection(lp1,'done', o1,'in');
    fm.addConnection(o1,'out', b7,'in');
  }
},
];

function setText(block, text) {
	block.text = text;
	block.textField.text = block.type === 'output' ? text.replace(/,/g, '\n') : text;
	block.recalcHeight();
}

function showExamplesModal() {
	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	const items = EXAMPLES.map((ex, i) =>
		`<div class="example-item" data-idx="${i}">${ex.title}</div>`
	).join('');
	overlay.innerHTML = `
		<div class="modal-box" style="min-width:360px;max-width:500px">
			<div class="modal-title" style="font-size:15px;font-weight:bold;margin-bottom:12px">📋 Оберіть приклад</div>
			<div class="examples-list">${items}</div>
			<div class="modal-buttons" style="margin-top:14px">
				<button class="modal-btn modal-cancel secondary">Закрити</button>
			</div>
		</div>`;
	document.body.appendChild(overlay);

	overlay.querySelectorAll('.example-item').forEach(el => {
		el.addEventListener('click', async () => {
			const idx = parseInt(el.dataset.idx);
			document.body.removeChild(overlay);
			const hasBlocks = flowchartManager.blocks.size > 0;
			if (hasBlocks) {
				const ok = await askConfirm('Замінити поточну схему обраним прикладом?');
				if (!ok) return;
			}
		flowchartManager.clear();
		flowchartManager.resetStepExecution();
		flowchartManager.isStopped = false; // 🔽 Скидаємо прапорець
		
		// 🔽 Очищення вікон виведення
		document.getElementById('result').innerHTML = '';
		updateOutputWindow('');
		if (document.getElementById('output-window')) {
			document.getElementById('output-window').style.display = 'none';
		}
		
		EXAMPLES[idx].build(flowchartManager);
		stage.update();
		});
	});

	overlay.querySelector('.modal-cancel').addEventListener('click', () => document.body.removeChild(overlay));
	overlay.addEventListener('mousedown', e => { if (e.target === overlay) document.body.removeChild(overlay); });
}

document.getElementById('examplesBtn').addEventListener('click', showExamplesModal);

setTimeout(() => {
	// Завантажуємо приклад за замовчуванням — квадратне рівняння
	EXAMPLES[8].build(flowchartManager);
	stage.update();
}, 100);

document.getElementById('runBtn').addEventListener('click', () => {
	flowchartManager.resetStepExecution();
	flowchartManager.execute();
});

document.getElementById('stepBtn').addEventListener('click', async () => {
	const ctx = flowchartManager._stepContext;

	if (!ctx) {
		if (!flowchartManager.initStepExecution()) return;
	} else {
		await flowchartManager.executeStep();
	}
});

document.getElementById('resetStepBtn').addEventListener('click', () => {
	flowchartManager.resetStepExecution();
});

document.getElementById('clearBtn').addEventListener('click', async () => {
	if (await askConfirm('Очистити всі блоки?')) {
		flowchartManager.clear();
		flowchartManager.resetStepExecution();
		document.getElementById('result').innerHTML = '';
	}
});

document.getElementById('saveBtn').addEventListener('click', async () => {
	const name = await inputData('Введіть ім\'я файлу для збереження:', 'схема');
	if (name === null || name.trim() === '') return;
	flowchartManager.saveToFile(name.trim());
});

document.getElementById('openBtn').addEventListener('click', () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.fcd,application/json';
	input.addEventListener('change', async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const text = await file.text();
		const ok = flowchartManager.loadFromJSON(text);
		if (!ok) {
			const overlay = document.createElement('div');
			overlay.className = 'modal-overlay';
			overlay.innerHTML = `<div class="modal-box"><div class="modal-title">❌ Помилка читання файлу. Перевірте формат .fcd</div>
				<div class="modal-buttons"><button class="modal-btn modal-ok">OK</button></div></div>`;
			document.body.appendChild(overlay);
			overlay.querySelector('.modal-ok').addEventListener('click', () => document.body.removeChild(overlay));
		}
	});
	input.click();
});
// ── OUTPUT WINDOW ──────────────────────────────────────────────────────
function initOutputWindow() {
    if (!document.getElementById('big-output-styles')) {
        const style = document.createElement('style');
        style.id = 'big-output-styles';
        style.textContent = `
            #big-output-overlay { position:absolute; top:0; left:0; width:100%; height:100%; z-index:5; display:none; align-items:center; justify-content:flex-end; pointer-events:none; }
            #big-output-dimmer { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(10,10,20,0.65); pointer-events:auto; transition: opacity 0.3s; cursor:pointer; }
            #big-output-text { position:relative; z-index:6; color:#00ffcc; font-family:'Courier New',Consolas,monospace; font-size:38px; font-weight:800; text-shadow:0 0 15px rgba(0,255,200,0.6), 3px 3px 8px rgba(0,0,0,0.9); padding:30px 40px 30px 0; max-width:65%; text-align:right; line-height:1.5; white-space:pre-wrap; word-break:break-word; pointer-events:none; }
            .big-output-close { position:absolute; top:15px; right:20px; font-size:28px; color:rgba(255,255,255,0.4); cursor:pointer; pointer-events:auto; transition:color 0.2s; }
            .big-output-close:hover { color:#fff; }
            #output-window { position:absolute; bottom:20px; right:20px; width:320px; height:200px; min-width:200px; min-height:100px; background:#1e1e2f; border:1px solid #444; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.5); color:#e0e0e0; display:none; flex-direction:column; overflow:hidden; z-index:10; }
            #output-header { display:flex; align-items:center; padding:8px 10px; background:#2a2a3d; border-bottom:1px solid #444; user-select:none; cursor:move; }
            #output-header h3 { margin:0; flex:1; font-size:14px; pointer-events:none; }
            #output-content { flex:1; overflow-y:auto; padding:8px; font-family:monospace; font-size:12px; line-height:1.4; }
            #output-footer { background:#222236; border-top:1px solid #444; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; user-select:none; }
            #chk-full-label { display:inline-flex; align-items:center; cursor:pointer; }
            #chk-full-output { accent-color:#00ffcc; width:15px; height:15px; cursor:pointer; }
            #chk-full-label span { font-size:11px; color:#aaa; margin-left:6px; }
            .resize-handle { position:absolute; bottom:0; right:0; width:14px; height:14px; cursor:nwse-resize; background:linear-gradient(135deg, transparent 50%, #666 50%); border-bottom-right-radius:6px; z-index:10; }
            #btn-stop-exec { position:absolute; top:12px; left:50%; transform:translateX(-50%); background:#e74c3c; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-weight:bold; cursor:pointer; z-index:20; display:none; box-shadow:0 4px 10px rgba(0,0,0,0.5); font-size:13px; }
            #btn-stop-exec:hover { background:#c0392b; }
        `;
        document.head.appendChild(style);
    }

    // 🔽 Кнопка "Зупинити"
    const stopBtn = document.createElement('button');
    stopBtn.id = 'btn-stop-exec';
    stopBtn.textContent = '⏹ Зупинити виконання';
    document.getElementById('canvas-container').appendChild(stopBtn);
    stopBtn.addEventListener('click', () => flowchartManager.stopExecution());

    const win = document.createElement('div');
    win.id = 'output-window';
    win.innerHTML = `
        <div id="output-header"><h3>📤 Виведення</h3><button id="btn-close-output">×</button></div>
        <div id="output-content"></div>
        <div id="output-footer">
            <label id="chk-full-label"><input type="checkbox" id="chk-full-output" checked><span>Повний лог на екрані</span></label>
        </div>
        <div class="resize-handle"></div>
    `;

    const container = document.getElementById('canvas-container');
    container.appendChild(win);

    // 🔽 Оверлей для великого виводу (тільки поверх канвасу)
    const overlay = document.createElement('div');
    overlay.id = 'big-output-overlay';
    overlay.innerHTML = `<div id="big-output-dimmer"></div><div id="big-output-text"></div><div class="big-output-close" title="Приховати">×</div>`;
    container.appendChild(overlay);

    // Клік по затемненню ховає оверлей
    overlay.addEventListener('mousedown', e => {
        if (e.target === overlay || e.target.id === 'big-output-dimmer') overlay.style.display = 'none';
    });
    overlay.querySelector('.big-output-close').addEventListener('click', () => overlay.style.display = 'none');

    win.querySelector('#btn-close-output').addEventListener('click', () => { win.style.display = 'none'; overlay.style.display = 'none'; });

    // Чекбокс не тригерить перетягування
    win.querySelector('#chk-full-label').addEventListener('mousedown', e => e.stopPropagation());

    // Drag & Drop
    const header = win.querySelector('#output-header');
    let isDragging = false, dX, dY, iL, iT;
    header.addEventListener('mousedown', e => {
        isDragging = true; dX = e.clientX; dY = e.clientY;
        const rect = win.getBoundingClientRect(), cRect = container.getBoundingClientRect();
        iL = rect.left - cRect.left; iT = rect.top - cRect.top;
        win.style.right = 'auto'; win.style.left = iL + 'px'; win.style.top = iT + 'px';
    });
    document.addEventListener('mousemove', e => { if(!isDragging) return; win.style.left=(iL+e.clientX-dX)+'px'; win.style.top=(iT+e.clientY-dY)+'px'; });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // Resize
    const resizer = win.querySelector('.resize-handle');
    let isResizing = false, rX, rY, sW, sH;
    resizer.addEventListener('mousedown', e => {
        isResizing = true; rX = e.clientX; rY = e.clientY;
        sW = win.offsetWidth || 320; sH = win.offsetHeight || 200;
        e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener('mousemove', e => {
        if (!isResizing) return;
        win.style.width  = Math.max(200, sW + e.clientX - rX) + 'px';
        win.style.height = Math.max(100, sH + e.clientY - rY) + 'px';
    });
    document.addEventListener('mouseup', () => { isResizing = false; });
}

// Initialize the window immediately
initOutputWindow();

// Helper function to update the window
function updateOutputWindow(html) {
    const win = document.getElementById('output-window');
    const content = win ? win.querySelector('#output-content') : null;
    if (win && content) {
        content.innerHTML = html;
        content.scrollTop = content.scrollHeight;
    }

    const textEl = document.getElementById('big-output-text');
    const overlay = document.getElementById('big-output-overlay');
    if (textEl && overlay) {
        const showFull = document.getElementById('chk-full-output')?.checked ?? true;
        let rawHtml = html;

        if (!showFull) {
            const lines = rawHtml.replace(/<br\s*\/?>/gi, '\n').split('\n');
            const outputLines = lines.filter(l => l.trim().startsWith('📤'));
            rawHtml = outputLines.length > 0 ? outputLines.join('<br>') : '';
        }

        let clean = rawHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
        const lines = clean.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 10) clean = `... (${lines.length - 10} рядків раніше)\n` + lines.slice(-10).join('\n');

        textEl.textContent = clean;
        overlay.style.display = clean ? 'flex' : 'none';
    }
}
// ── CODE GENERATOR ───────────────────────────────────────────────────────────

const CODE_LANGS = {
    python:     { ext: 'py',    indent: '    ' },
    javascript: { ext: 'js',    indent: '    ' },
    typescript: { ext: 'ts',    indent: '    ' },
    c:          { ext: 'c',     indent: '    ' },
    cpp:        { ext: 'cpp',   indent: '    ' },
    rust:       { ext: 'rs',    indent: '    ' },
    scala:      { ext: 'scala', indent: '  ' },
    swift:      { ext: 'swift', indent: '    ' },
    ruby:       { ext: 'rb',    indent: '    ' },
    pascal:     { ext: 'pas',   indent: '  ' },
};

function generateCode(lang) {
    const fm = flowchartManager;
    const IND = CODE_LANGS[lang].indent;

    // ── Знаходимо головний start (без дужок) і функціональні starts ──
    let mainStart = null;
    const funcStarts = [];
    for (const b of fm.blocks.values()) {
        if (b.type !== 'start') continue;
        if (b.text.trim().match(/^[a-zA-Z_$][\w$]*\s*\(/i)) funcStarts.push(b);
        else mainStart = b;
    }

    if (!mainStart) return '// Помилка: не знайдено блок "Початок"';

    // ── Допоміжні ──
    const getNext = (block) => {
        if (block.generalConnections.length > 0) return fm.blocks.get(block.generalConnections[0]);
        return null;
    };
    const getTrueBlock  = (block) => block.connections.true  ? fm.blocks.get(block.connections.true)  : null;
    const getFalseBlock = (block) => block.connections.false ? fm.blocks.get(block.connections.false) : null;
    const getLoopBody   = (block) => {
        const c = fm.connections.find(c => c.from.id === block.id && c.fromPort === 'out');
        return c ? fm.blocks.get(c.to.id) : null;
    };
    const getLoopDone   = (block) => {
        const c = fm.connections.find(c => c.from.id === block.id && c.fromPort === 'done');
        return c ? fm.blocks.get(c.to.id) : null;
    };

    // ── Перетворення виразу: замінює ^ на ** (Python/JS), Math.sqrt → sqrt тощо ──
    const adaptExpr = (expr, lang) => {
        if (!expr) return expr;
        let e = expr.trim();
        // Pascal: квадратні дужки [] залишаємо як є (індексація масиву)
        if (['python','ruby','pascal'].includes(lang)) {
            // Python/Ruby/Pascal не мають Math.xxx
            e = e.replace(/Math\.sqrt\s*\(/g, 'sqrt(')
                 .replace(/Math\.abs\s*\(/g, 'abs(')
                 .replace(/Math\.pow\s*\(([^,]+),([^)]+)\)/g, (_, a, b) => {
                     if (lang === 'pascal') return `Power(${a.trim()},${b.trim()})`;
                     return `(${a.trim()})**${b.trim()}`;
                 })
                 .replace(/Math\.floor\s*\(/g, lang === 'pascal' ? 'Floor(' : 'floor(')
                 .replace(/Math\.ceil\s*\(/g, lang === 'pascal' ? 'Ceil(' : 'ceil(')
                 .replace(/Math\.round\s*\(/g, lang === 'pascal' ? 'Round(' : 'round(')
                 .replace(/Math\.log\s*\(/g, lang === 'pascal' ? 'Ln(' : 'log(')
                 .replace(/Math\.PI/g, lang === 'pascal' ? 'Pi' : 'pi')
                 .replace(/\*\*/g, lang === 'pascal' ? '' : '**'); // handled above for pascal
        }
        if (['c','cpp','rust','scala','swift','typescript','javascript'].includes(lang)) {
            e = e.replace(/Math\./g, lang === 'rust' ? 'f64::' : 'Math.')
                 .replace(/\*\*/g, '/* ** not supported, use pow() */');
        }
        // === vs == for JS/TS
        if (['javascript','typescript'].includes(lang)) {
            e = e.replace(/([^=!<>])={1}([^=])/g, (m, a, b) => `${a}=${b}`); // keep as-is
        }
        // Pascal: := for assignment in expressions — only for conditions, leave as-is
        return e;
    };

    // ── Адаптація літерала масиву до мови ──
    const adaptArrayLiteral = (arrLiteral, lang) => {
        // arrLiteral: "[1, 2, 3]" або "[]"
        const inner = arrLiteral.slice(1, -1).trim(); // вміст між дужками
        const elements = inner.length === 0 ? [] : inner.split(',').map(s => adaptExpr(s.trim(), lang));
        switch (lang) {
            case 'pascal': {
                // Pascal не має динамічних масивів-літералів — оголошуємо через SetLength + присвоєння
                // Повертаємо спеціальний маркер, що обробляється нижче
                return { type: '__pascal_array__', elements };
            }
            case 'c':
            case 'cpp': {
                // C/C++: ініціалізація через { ... }
                return elements.length === 0 ? '{}' : `{${elements.join(', ')}}`;
            }
            case 'rust': {
                // Rust: vec![...]
                return elements.length === 0 ? 'Vec::new()' : `vec![${elements.join(', ')}]`;
            }
            case 'scala': {
                return elements.length === 0 ? 'ArrayBuffer()' : `ArrayBuffer(${elements.join(', ')})`;
            }
            case 'swift': {
                return elements.length === 0 ? '[]' : `[${elements.join(', ')}]`;
            }
            default: {
                // Python, JS, TS, Ruby — квадратні дужки
                return elements.length === 0 ? '[]' : `[${elements.join(', ')}]`;
            }
        }
    };

    // ── Адаптація оператора присвоєння ──
    const adaptAssign = (stmt, lang) => {
        if (lang === 'rust') {
            stmt = stmt.replace(/([a-zA-Z_$][\w$]*)\s*\+\+/g, '$1 += 1')
                       .replace(/([a-zA-Z_$][\w$]*)\s*--/g, '$1 -= 1');
        }

        // Розбираємо LHS: може бути "a", "a[i]", "a[i][j]"
        // і RHS: може бути "[1,2,3]", "[]", або звичайний вираз
        const assignRe = /^([a-zA-Z_$][\w$]*(?:\s*\[[^\]]*\])*)\s*([+\-*\/]?=)\s*([\s\S]+)$/;
        const m = stmt.trim().match(assignRe);
        if (!m) return stmt; // не схоже на присвоєння — повертаємо як є

        let [, lhs, op, rhs] = m;
        rhs = rhs.trim();

        // Перевіряємо, чи RHS є масивом-літералом
        const isArrayLiteral = /^\[[\s\S]*\]$/.test(rhs);

        if (lang === 'pascal') {
            // Pascal: індексація через [] → []  (Pascal підтримує синтаксис a[i])
            // Але ініціалізація масиву — SetLength + цикл або поелементно
            if (isArrayLiteral && op === '=') {
                const parsed = adaptArrayLiteral(rhs, lang);
                if (parsed.type === '__pascal_array__') {
                    const { elements } = parsed;
                    const varName = lhs.trim();
                    if (elements.length === 0) {
                        return `SetLength(${varName}, 0)`;
                    }
                    // SetLength + присвоєння кожному елементу
                    let out = `SetLength(${varName}, ${elements.length})`;
                    elements.forEach((el, idx) => {
                        out += `;\n    ${varName}[${idx}] := ${el}`;
                    });
                    return out;
                }
            }
            // Звичайне присвоєння (включно з a[i] = val)
            return stmt.replace(/^([a-zA-Z_$][\w$]*(?:\s*\[[^\]]*\])*)\s*([+\-*\/]?)=\s*([\s\S]+)$/s,
                (_, l, compound, r) => {
                    r = adaptExpr(r, lang);
                    if (compound) return `${l} := ${l} ${compound} ${r}`;
                    return `${l} := ${r}`;
                });
        }

        // C / C++: масив — оголошення з розміром, якщо це не індексний запис
        if ((lang === 'c' || lang === 'cpp') && isArrayLiteral && op === '=') {
            const arr = adaptArrayLiteral(rhs, lang);
            const varName = lhs.trim();
            if (arr === '{}') {
                // Порожній динамічний масив через вказівник/вектор
                return lang === 'cpp'
                    ? `std::vector<double> ${varName}`
                    : `double *${varName} = NULL`;
            }
            const elCount = rhs.slice(1,-1).split(',').filter(s=>s.trim()).length;
            return lang === 'cpp'
                ? `std::vector<double> ${varName} = ${arr}`
                : `double ${varName}[] = ${arr}`;
        }

        // Rust: масив
        if (lang === 'rust' && isArrayLiteral && op === '=') {
            const arr = adaptArrayLiteral(rhs, lang);
            const varName = lhs.trim();
            return `let mut ${varName} = ${arr}`;
        }

        // Scala: ArrayBuffer
        if (lang === 'scala' && isArrayLiteral && op === '=') {
            const arr = adaptArrayLiteral(rhs, lang);
            const varName = lhs.trim();
            return `val ${varName} = scala.collection.mutable.${arr}`;
        }

        // Усі інші мови (Python, JS, TS, Ruby, Swift)
        if (isArrayLiteral && op === '=') {
            const arr = adaptArrayLiteral(rhs, lang);
            return `${lhs} ${op} ${arr}`;
        }

        // Звичайне присвоєння (не масив)
        return `${lhs} ${op} ${adaptExpr(rhs, lang)}`;
    };

    // ── Генерація оператора виведення ──
    const makePrint = (text, lang) => {
        // text може бути: "x", '"рядок"', '"текст =", x'
        const args = text.split(',').map(s => s.trim());
        const joined = args.join(' + " " + ');
        const pythonArgs = args.join(', ');
        switch(lang) {
            case 'python':     return `print(${pythonArgs})`;
            case 'javascript': return `console.log(${joined})`;
            case 'typescript': return `console.log(${joined})`;
            case 'c':          {
                // Спрощена версія — print рядки і числа через %s/%d
                const fmtArgs = args.map(a => a.startsWith('"') ? `${a}` : `${a}`).join(', ');
                return `printf("%s\\n", ${fmtArgs})`;
            }
            case 'cpp':        return `std::cout << ${args.join(' << ')} << std::endl`;
            case 'rust':       return `println!("{}", ${args.map(a => a.startsWith('"') ? a : `${a}`).join(', ')})`;
            case 'scala':      return `println(${pythonArgs})`;
            case 'swift':      return `print(${pythonArgs})`;
            case 'ruby':       return `puts ${pythonArgs}`;
            case 'pascal':     return `Writeln(${pythonArgs})`;
            default:           return `print(${pythonArgs})`;
        }
    };

    // ── Генерація оператора вводу ──
    const makeInput = (varName, lang) => {
        // varName може бути "x", "a[i]", "a[0]" тощо
        const label = varName.replace(/"/g, '\\"'); // для рядків-підказок
        switch(lang) {
            case 'python':     return `${varName} = float(input("Введіть ${label}: "))`;
            case 'javascript': return `${varName} = parseFloat(prompt("Введіть ${label}:"))`;
            case 'typescript': return `${varName} = parseFloat(prompt("Введіть ${label}:") ?? "0")`;
            case 'c': {
                // Для елемента масиву a[i] — передаємо &a[i]
                return `scanf("%lf", &${varName})`;
            }
            case 'cpp':        return `std::cin >> ${varName}`;
            case 'rust': {
                // Для Rust елемент масиву: _tmp → arr[i] = _tmp
                const isIndex = /\[/.test(varName);
                if (isIndex) {
                    return `{\n${IND}    let mut _inp = String::new();\n${IND}    std::io::stdin().read_line(&mut _inp).unwrap();\n${IND}    ${varName} = _inp.trim().parse().unwrap();\n${IND}}`;
                }
                return `let mut _input = String::new();\n${IND}std::io::stdin().read_line(&mut _input).unwrap();\n${IND}let ${varName}: f64 = _input.trim().parse().unwrap()`;
            }
            case 'scala':      return `${varName} = scala.io.StdIn.readLine("Введіть ${label}: ").toDouble`;
            case 'swift':      return `${varName} = Double(readLine()!)!`;
            case 'ruby':       return `${varName} = gets.chomp.to_f`;
            case 'pascal':     return `Readln(${varName})`;
            default:           return `input(${varName})`;
        }
    };

    // ── Рекурсивна генерація блоків ──
    const visited = new Set();

    const genBlock = (block, depth, stopAt = null) => {
        if (!block || block === stopAt) return '';
        if (block.type === 'end' && depth === 0) return '';
        if (visited.has(block.id + ':' + depth)) return '';
        visited.add(block.id + ':' + depth);

        const pad = IND.repeat(depth);
        const text = block.text ? block.text.trim() : '';
        let out = '';

        switch (block.type) {
            case 'start': {
                const funcMatch = text.match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
                if (funcMatch) {
                    // Функція — пропускаємо, генерується окремо
                    return '';
                }
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
            case 'end': {
                if (depth > 0) {
                    // return всередині функції
                    out += pad + makeReturn(lang) + '\n';
                }
                break;
            }
            case 'process': {
                const stmts = text.split(';').map(s => s.trim()).filter(Boolean);
                for (const stmt of stmts) {
                    out += pad + adaptAssign(stmt, lang) + endStmt(lang) + '\n';
                }
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
            case 'input': {
                if (text) {
                    out += pad + makeInput(text, lang) + endStmt(lang) + '\n';
                }
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
            case 'output': {
                out += pad + makePrint(text, lang) + endStmt(lang) + '\n';
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
            case 'decision': {
                const trueB  = getTrueBlock(block);
                const falseB = getFalseBlock(block);
                const cond   = adaptExpr(text, lang);

                // Знаходимо точку злиття (join) — блок після if/else
                const joinBlock = findJoin(trueB, falseB);

                out += makeIf(cond, lang, pad);
                // Гілка "так"
                const trueVisited = new Set(visited);
                out += genBlock(trueB, depth + 1, joinBlock);
                // Гілка "ні"
                if (falseB && falseB !== joinBlock) {
                    out += makeElse(lang, pad);
                    out += genBlock(falseB, depth + 1, joinBlock);
                }
                out += makeEndIf(lang, pad);
                // Продовжуємо після join
                if (joinBlock) {
                    visited.delete(joinBlock.id + ':' + depth);
                    out += genBlock(joinBlock, depth, stopAt);
                }
                break;
            }
            case 'loop': {
                const forParams = parseForLoop(text);
                const bodyB    = getLoopBody(block);
                const doneB    = getLoopDone(block);

                if (forParams) {
                    // ── For-цикл ──
                    out += makeFor(forParams, lang, pad);
                    out += genBlock(bodyB, depth + 1, block);
                    // Для pascal/rust з довільним кроком — додаємо інкремент перед закриттям
                    out += makeForInc(forParams, lang, pad + IND);
                    out += makeEndFor(forParams, lang, pad);
                } else {
                    // ── While-цикл ──
                    const cond = adaptExpr(text, lang);
                    out += makeWhile(cond, lang, pad);
                    out += genBlock(bodyB, depth + 1, block);
                    out += makeEndWhile(lang, pad);
                }
                if (doneB) out += genBlock(doneB, depth, stopAt);
                break;
            }
            case 'function': {
                // Виклик функції
                out += pad + adaptAssign(text, lang) + endStmt(lang) + '\n';
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
            case 'comment': {
                out += pad + makeComment(text, lang) + '\n';
                out += genBlock(getNext(block), depth, stopAt);
                break;
            }
        }
        return out;
    };

    // ── Знаходження точки злиття двох гілок ──
    const findJoin = (trueB, falseB) => {
        if (!trueB || !falseB) return null;
        // Пробігаємо трьома кроками — перший спільний блок
        const visited1 = new Set();
        let cur = trueB;
        for (let i = 0; i < 100 && cur; i++) {
            visited1.add(cur.id);
            if (cur.type === 'decision') { cur = getTrueBlock(cur); }
            else cur = getNext(cur);
        }
        cur = falseB;
        for (let i = 0; i < 100 && cur; i++) {
            if (visited1.has(cur.id)) return cur;
            if (cur.type === 'decision') { cur = getTrueBlock(cur); }
            else cur = getNext(cur);
        }
        return null;
    };

    // ── Мовні конструкції ──
    const endStmt = (lang) => ['c','cpp','rust','java','typescript'].includes(lang) ? ';' :
                               lang === 'pascal' ? ';' : '';
    const makeReturn = (lang) => lang === 'pascal' ? 'Exit' : lang === 'rust' ? 'return;' : 'return';
    const makeComment = (text, lang) => ['c','cpp','java','rust','scala','swift','typescript','javascript'].includes(lang)
        ? `// ${text}` : lang === 'python' || lang === 'ruby' ? `# ${text}` : lang === 'pascal' ? `{ ${text} }` : `// ${text}`;

    const makeIf = (cond, lang, pad) => {
        if (lang === 'python' || lang === 'ruby') return `${pad}if ${cond}:\n`;
        if (lang === 'pascal') return `${pad}if ${cond} then\n${pad}begin\n`;
        if (lang === 'rust')   return `${pad}if ${cond} {\n`;
        if (lang === 'scala')  return `${pad}if (${cond}) {\n`;
        return `${pad}if (${cond}) {\n`;
    };
    const makeElse = (lang, pad) => {
        if (lang === 'python' || lang === 'ruby') return `${pad}else:\n`;
        if (lang === 'pascal') return `${pad}end\n${pad}else\n${pad}begin\n`;
        return `${pad}} else {\n`;
    };
    const makeEndIf = (lang, pad) => {
        if (lang === 'python' || lang === 'ruby') return '';
        if (lang === 'pascal') return `${pad}end;\n`;
        return `${pad}}\n`;
    };
    const makeWhile = (cond, lang, pad) => {
        if (lang === 'python' || lang === 'ruby') return `${pad}while ${cond}:\n`;
        if (lang === 'pascal') return `${pad}while ${cond} do\n${pad}begin\n`;
        if (lang === 'rust')   return `${pad}while ${cond} {\n`;
        return `${pad}while (${cond}) {\n`;
    };
    const makeEndWhile = (lang, pad) => {
        if (lang === 'python' || lang === 'ruby') return '';
        if (lang === 'pascal') return `end;\n`;
        return `}\n`;
    };

    // ── For-цикл ──
    // fp містить: varName, fromExpr, toExpr, stepExpr (рядки-вирази)
    const makeFor = (fp, lang, pad) => {
        const v = fp.varName;
        const from = adaptExpr(fp.fromExpr, lang);
        const to   = adaptExpr(fp.toExpr,   lang);
        const step = adaptExpr(fp.stepExpr, lang);
        // Визначаємо "тривіальний" крок тільки якщо stepExpr є числовим літералом
        const stepNum = Number(fp.stepExpr);
        const isStep1  = fp.stepExpr === '1' || stepNum === 1;
        const isStepM1 = fp.stepExpr === '-1' || stepNum === -1;
        const isNumericStep = !isNaN(stepNum);
        const cmpOp = (isNumericStep && stepNum < 0) ? '>=' : '<=';

        switch (lang) {
            case 'python': {
                // Python range: кінцеве значення не включається → +step
                // Якщо to — вираз зі змінною, генеруємо з +1/-1; якщо числовий — рахуємо точно
                const endExpr = isNumericStep
                    ? String(Number(fp.toExpr) + (stepNum < 0 ? -1 : 1))
                    : (stepNum < 0 ? `(${to}) - 1` : `(${to}) + 1`);
                const stepArg = isStep1 ? '' : `, ${step}`;
                return `${pad}for ${v} in range(${from}, ${endExpr}${stepArg}):\n`;
            }
            case 'ruby': {
                if (isStep1)  return `${pad}${from}.upto(${to}) do |${v}|\n`;
                if (isStepM1) return `${pad}${from}.downto(${to}) do |${v}|\n`;
                return `${pad}(${from}..${to}).step(${step}) do |${v}|\n`;
            }
            case 'pascal': {
                if (isStep1)  return `${pad}for ${v} := ${from} to ${to} do\n${pad}begin\n`;
                if (isStepM1) return `${pad}for ${v} := ${from} downto ${to} do\n${pad}begin\n`;
                // Pascal не підтримує довільний крок — while
                return `${pad}${v} := ${from};\n${pad}while ${v} ${cmpOp} ${to} do\n${pad}begin\n`;
            }
            case 'rust': {
                if (isStep1) return `${pad}for ${v} in ${from}..=${to} {\n`;
                return `${pad}let mut ${v} = ${from};\n${pad}while ${v} ${cmpOp} ${to} {\n`;
            }
            default: {
                // JS, TS, C, C++, Scala, Swift
                const inc = isStep1  ? `${v}++`
                          : isStepM1 ? `${v}--`
                          : `${v} += ${step}`;
                const varDecl = lang === 'c' || lang === 'cpp' ? 'int '
                              : 'let ';
                return `${pad}for (${varDecl}${v} = ${from}; ${v} ${cmpOp} ${to}; ${inc}) {\n`;
            }
        }
    };
    const makeEndFor = (fp, lang, pad) => {
        if (lang === 'python') return '';
        if (lang === 'ruby')   return `${pad}end\n`;
        if (lang === 'pascal') return `${pad}end;\n`;
        const stepNum = Number(fp.stepExpr);
        const isStep1  = fp.stepExpr === '1' || stepNum === 1;
        const isStepM1 = fp.stepExpr === '-1' || stepNum === -1;
        if (lang === 'rust' && !isStep1) {
            // while-варіант для rust — крок вставляється перед }
            return `${pad}    ${fp.varName} += ${adaptExpr(fp.stepExpr, lang)};\n${pad}}\n`;
        }
        return `${pad}}\n`;
    };
    const makeForInc = (fp, lang, pad) => {
        // Для Pascal з довільним кроком — рядок інкременту всередині while
        const stepNum = Number(fp.stepExpr);
        const isStep1  = fp.stepExpr === '1' || stepNum === 1;
        const isStepM1 = fp.stepExpr === '-1' || stepNum === -1;
        if (lang === 'pascal' && !isStep1 && !isStepM1) {
            return `${pad}${fp.varName} := ${fp.varName} + ${adaptExpr(fp.stepExpr, lang)};\n`;
        }
        return '';
    };

    // ── Генерація функцій ──
    const genFunction = (startBlock) => {
        const m = startBlock.text.trim().match(/^([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/i);
        if (!m) return '';
        const name = m[1];
        const args = m[2].split(',').map(a => a.trim()).filter(Boolean);
        const body = genBlock(getNext(startBlock), 1, null);

        switch (lang) {
            case 'python':     return `def ${name}(${args.join(', ')}):\n${body || IND + 'pass'}\n\n`;
            case 'javascript': return `function ${name}(${args.join(', ')}) {\n${body}}\n\n`;
            case 'typescript': return `function ${name}(${args.map(a => `${a}: any`).join(', ')}): any {\n${body}}\n\n`;
            case 'c':          return `double ${name}(${args.map(a => `double ${a}`).join(', ')}) {\n${body}}\n\n`;
            case 'cpp':        return `double ${name}(${args.map(a => `double ${a}`).join(', ')}) {\n${body}}\n\n`;
            case 'rust':       return `fn ${name}(${args.map(a => `${a}: f64`).join(', ')}) -> f64 {\n${body}}\n\n`;
            case 'scala':      return `def ${name}(${args.map(a => `${a}: Double`).join(', ')}): Unit = {\n${body}}\n\n`;
            case 'swift':      return `func ${name}(${args.map(a => `_ ${a}: Double`).join(', ')}) {\n${body}}\n\n`;
            case 'ruby':       return `def ${name}(${args.join(', ')})\n${body}end\n\n`;
            case 'pascal':     return `procedure ${name}(${args.map(a => `${a}: Real`).join('; ')});\nbegin\n${body}end;\n\n`;
            default:           return `function ${name}(${args.join(', ')}) {\n${body}}\n\n`;
        }
    };

    // ── Обгортка main ──
    const wrapMain = (body, lang) => {
        switch (lang) {
            case 'python':     return body + '\n';
            case 'javascript': return body + '\n';
            case 'typescript': return body + '\n';
            case 'c':          return `#include <stdio.h>\n#include <math.h>\n\nint main() {\n${body}${IND}return 0;\n}\n`;
            case 'cpp':        return `#include <iostream>\n#include <cmath>\n\nint main() {\n${body}${IND}return 0;\n}\n`;
            case 'rust':       return `use std::io;\nuse std::io::BufRead;\n\nfn main() {\n${body}}\n`;
            case 'scala':      return `object Main extends App {\n${body}}\n`;
            case 'swift':      return `import Foundation\n\n${body}\n`;
            case 'ruby':       return body + '\n';
            case 'pascal':     return `program Main;\nuses Math, SysUtils;\n\nbegin\n${body}end.\n`;
            default:           return body;
        }
    };

    // ── Складаємо результат ──
    let result = `// Згенеровано автоматично з блок-схеми\n`;
    if (lang === 'python') result = `# Згенеровано автоматично з блок-схеми\n`;
    if (lang === 'ruby')   result = `# Згенеровано автоматично з блок-схеми\n`;
    if (lang === 'pascal') result = `{ Згенеровано автоматично з блок-схеми }\n`;

    // Функції
    for (const fs of funcStarts) {
        result += genFunction(fs);
    }

    // Головна програма
    const mainBody = genBlock(mainStart, lang === 'c' || lang === 'cpp' || lang === 'rust' || lang === 'scala' ? 1 : 0);
    result += wrapMain(mainBody, lang);

    return result;
}
// ── MODAL DIALOGS ────────────────────────────────────────────────────────────

function inputData(promptText, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-title">${promptText}</div>
                <input class="modal-input" type="text" />
                <div class="modal-buttons">
                    <button class="modal-btn modal-ok">OK</button>
                    <button class="modal-btn modal-cancel secondary">Скасувати</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        
        const input = overlay.querySelector('.modal-input');
        input.value = defaultValue; // ✅ Безпечне присвоєння (не ламається від лапок у тексті)
        input.focus();
        input.select();
        
        const close = (val) => { document.body.removeChild(overlay); resolve(val); };
        overlay.querySelector('.modal-ok').addEventListener('click', () => close(input.value));
        overlay.querySelector('.modal-cancel').addEventListener('click', () => close(null));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') close(input.value);
            if (e.key === 'Escape') close(null);
        });
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(null); });
    });
}

function askConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-title">${message}</div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-ok">Так</button>
                    <button class="modal-btn modal-cancel secondary">Ні</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const close = (val) => { document.body.removeChild(overlay); resolve(val); };
        overlay.querySelector('.modal-ok').addEventListener('click', () => close(true));
        overlay.querySelector('.modal-cancel').addEventListener('click', () => close(false));
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') close(true);
            if (e.key === 'Escape') close(false);
        });
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(false); });
        overlay.querySelector('.modal-ok').focus();
    });
}


// ── EXPORT UI ────────────────────────────────────────────────────────────────

const exportBtn  = document.getElementById('exportBtn');
const exportMenu = document.getElementById('export-menu');

// Показати/сховати меню
exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
});

// Закрити при кліку поза меню
document.addEventListener('click', () => {
    exportMenu.style.display = 'none';
});
exportMenu.addEventListener('click', (e) => e.stopPropagation());

// Вибір мови
document.querySelectorAll('.export-lang').forEach(item => {
    item.addEventListener('click', async () => {
        exportMenu.style.display = 'none';
        const lang = item.dataset.lang;
        const ext  = item.dataset.ext;

        const fileName = await inputData(`Введіть ім'я файлу для експорту (${lang}):`, `algorithm`);
        if (fileName === null || fileName.trim() === '') return;

        const code = generateCode(lang);
        const name = fileName.trim().endsWith('.' + ext) ? fileName.trim() : fileName.trim() + '.' + ext;
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
function animate() {
	stage.update();
	requestAnimationFrame(animate);
}
animate();
