/*
 * render.js — малювання поля на <canvas>.
 *
 * Малюємо просто на екрані у «світових» координатах (200px на клітинку),
 * а масштаб та зсув задаємо трансформацією — так карта лишається чіткою на
 * будь-якому зумі і не потребує величезного буфера.
 *
 * Правила запозичені з оригінального 7:
 *   - тайли малюються в натуральний розмір (225×225 в «об'ємних», 200×200
 *     у плоских) лівим верхнім кутом у клітинку;
 *   - смугові тайли (O, R) — береться перший сегмент смуги;
 *   - мазки фарби — натуральним розміром (1, 2 або 2 клітинки);
 *   - шар Extra (пальми) малюється поверх тайлів.
 */

(function (global) {
  "use strict";

  var RM = global.RMApp = global.RMApp || {};

  var TILE = 200;          // GridSize зі skin.properties
  var DIR_ANGLE = { 0: 0, 1: 90, 2: 180, 3: 270 };
  var EXTRA_LEVELS = [0, 1, 2];   // шари Extra: під тайлами, з тайлами, поверх

  /**
   * @param {HTMLCanvasElement} canvas  полотно
   * @param {string} skinPath           тека ресурсів скіну
   * @param {Object} parts              files — список файлів скіну,
   *                                    wrap/sizer — контейнер прокручування
   */
  function Renderer(canvas, skinPath, parts) {
    parts = parts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.skinPath = skinPath || "skins/dessertSkin/";
    this.files = parts.files || [];
    // Контейнер зі смугами прокручування та «смуга» (розмір прокручуваної області).
    this.wrap = parts.wrap || null;
    this.sizer = parts.sizer || null;
    this.images = {};
    this.world = null;
    this.gridVisible = false;      // напівпрозора сітка клітинок
    this.zoom = 0;                 // 0 — вписати у вікно
    this.offset = { x: 0, y: 0 };
    this.view = { scale: 1, ox: 0, oy: 0 };
    this.pending = false;
    var self = this;
    this.schedule = function () {
      if (self.pending) return;
      self.pending = true;
      global.requestAnimationFrame(function () {
        self.pending = false;
        self.paint();
      });
    };
    // Розмір вікна перегляду може змінитися без події resize (завантажилися
    // шрифти, з'явилися смуги прокручування) — тоді полотно треба підігнати.
    // Полотно — блоковий елемент: інакше під ним з'являється рядковий проміжок
    // (baseline gap) у кілька пікселів, який породжує смуги прокручування, а
    // вони міняють розмір вікна перегляду й знову запускають ResizeObserver.
    canvas.style.display = "block";
    if (this.wrap && typeof global.ResizeObserver === "function") {
      // Перемальовуємо лише коли розмір справді відрізняється від того, з яким
      // малювали востаннє (зайві спрацьовування не запускають малювання).
      this.resizeObserver = new global.ResizeObserver(function () {
        if (self.sizeChanged()) self.schedule();
      });
      this.resizeObserver.observe(this.wrap);
    }
  }

  /** Чи змінився розмір вікна перегляду відтоді, як ми малювали востаннє. */
  Renderer.prototype.sizeChanged = function () {
    var wrap = this.wrap;
    if (!wrap) return false;
    return wrap.clientWidth !== this._cw || wrap.clientHeight !== this._ch;
  };

  /** Завантажує зображення скіну; коли воно готове — перемальовуємо поле. */
  Renderer.prototype.image = function (key, file) {
    if (this.images[key]) return this.images[key];
    var img = new Image();
    this.images[key] = img;
    var self = this;
    img.onload = function () { self.schedule(); };
    img.onerror = function () { self.schedule(); };
    img.src = this.skinPath + file;
    return img;
  };

  Renderer.prototype.preload = function () {
    this.image("bg", "bg.png");
    // Energon має два кадри, які міняються щосекунди.
    this.image("energon-a", "ecell_a.png");
    this.image("energon-b", "ecell_b.png");
    this.image("tile-@", "tile-@.png");
    this.image("robotBody", "robotBody.png");
    this.image("robotHead", "robotHead.png");
    this.image("robotShadow", "robotShadow.png");
    this.image("robotGripperOpen", "robotGripperOpen.png");
    this.image("paintWhite", "paintWhite.png");
    this.image("paintBlack", "paintBlack.png");
    this.image("strokeWhiteDot", "strokeWhiteDot.png");
    this.image("strokeWhiteRight", "strokeWhiteRight.png");
    this.image("strokeWhiteDown", "strokeWhiteDown.png");
    this.image("strokeBlackDot", "strokeBlackDot.png");
    this.image("strokeBlackRight", "strokeBlackRight.png");
    this.image("strokeBlackDown", "strokeBlackDown.png");
    return this;
  };

  /** Змінює скін (перезавантажує ресурси й перемальовує поле). */
  Renderer.prototype.setSkin = function (path, files) {
    this.skinPath = path;
    this.files = files || [];
    this.images = {};
    this._pattern = null;
    this._patImg = null;
    this.preload();
    this.paint();
  };

  /** Файл додаткового об'єкта для шару (0 — під тайлами, 2 — поверх). */
  Renderer.prototype.extraFile = function (name, level) {
    var prefix = "extra-" + name + level;
    for (var i = 0; i < this.files.length; i++) {
      if (this.files[i].indexOf(prefix) === 0) return this.files[i];
    }
    return null;
  };

  Renderer.prototype.ready = function (img) {
    return img && img.complete && img.naturalWidth > 0;
  };

  /**
   * Малює зображення тайла. Смугові тайли (O, R) — це картинка в N клітинок
   * шириною, беремо з неї перший сегмент.
   */
  Renderer.prototype.drawTile = function (ctx, img, x, y) {
    if (!this.ready(img)) return;
    var w = img.naturalWidth, h = img.naturalHeight;
    if (w > h) {
      ctx.drawImage(img, 0, 0, h, h, x * TILE, y * TILE, h, h);
    } else {
      ctx.drawImage(img, x * TILE, y * TILE);
    }
  };

  /** Додаткові об'єкти (пальми тощо): шар 0 — під тайлами, 2 — поверх. */
  Renderer.prototype.drawExtras = function (ctx, world, level) {
    for (var i = 0; i < world.extras.length; i++) {
      var extra = world.extras[i];
      var file = this.extraFile(extra.name, level);
      if (!file) continue;
      var img = this.images[file];
      if (!img) img = this.image(file, file);
      if (!this.ready(img)) continue;
      ctx.drawImage(img, extra.x * TILE, extra.y * TILE);
    }
  };

  /**
   * Розмір області, яку треба вписати у вікно, у світових пікселях:
   * сітка карти плюс те, наскільки за неї виступають зображення extra.
   */
  Renderer.prototype.extent = function (world) {
    var w = world.width * TILE, h = world.height * TILE;
    for (var i = 0; i < world.extras.length; i++) {
      var extra = world.extras[i];
      for (var level = 0; level < EXTRA_LEVELS.length; level++) {
        var file = this.extraFile(extra.name, level);
        if (!file) continue;
        var img = this.images[file];
        if (!this.ready(img)) continue;
        w = Math.max(w, extra.x * TILE + img.naturalWidth);
        h = Math.max(h, extra.y * TILE + img.naturalHeight);
      }
    }
    return { w: w, h: h };
  };

  /** Поточний кадр Energon: a або b (міняються щосекунди). */
  Renderer.prototype.energonFrame = function () {
    var a = this.images["energon-a"];
    var b = this.images["energon-b"];
    var useA = Math.floor(Date.now() / 1000) % 2 === 0;
    if (useA && this.ready(a)) return a;
    if (!useA && this.ready(b)) return b;
    return this.ready(a) ? a : b;
  };

  /** Малює все поле. */
  Renderer.prototype.render = function (world) {
    this.world = world;
    this.paint();
  };

  Renderer.prototype.paint = function () {
    var world = this.world;
    var wrap = this.wrap;
    var cw = wrap ? wrap.clientWidth : this.canvas.clientWidth;
    var ch = wrap ? wrap.clientHeight : this.canvas.clientHeight;
    if (!cw || !ch) return;

    var dpr = global.devicePixelRatio || 1;
    // Обмежуємо буфер полотна (≈16 млн пікселів = 64 МБ): надто велике полотно
    // вичерпує пам'ять відеокарти й може зависити весь браузер.
    var MAX_PIXELS = 16e6;
    if (cw * ch * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (cw * ch));
    var pw = Math.floor(cw * dpr), ph = Math.floor(ch * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    // Полотно завжди розміром вікна перегляду (липає до краю, але прокручується).
    if (this._cw !== cw || this._ch !== ch) {
      this._cw = cw; this._ch = ch;
      this.canvas.style.width = cw + "px";
      this.canvas.style.height = ch + "px";
    }

    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    if (!world) return;

    var ext = this.extent(world);
    var ww = ext.w;
    var wh = ext.h;
    if (!ww || !wh) return;

    var fit = Math.min(cw / ww, ch / wh);
    var scale = fit * (this.zoom > 0 ? this.zoom : 1);
    var sw = ww * scale, sh = wh * scale;

    // Прокручувана область: розміром з карту (або не менше за вікно).
    if (this.sizer) {
      // Похибка в 1px не повинна викликати смуги прокручування.
      var szw = (sw <= cw + 1 ? cw : sw) + "px";
      var szh = (sh <= ch + 1 ? ch : sh) + "px";
      if (this._szw !== szw) { this._szw = szw; this.sizer.style.width = szw; }
      if (this._szh !== szh) { this._szh = szh; this.sizer.style.height = szh; }
    }

    // Позиція карти в межах прокручуваної області.
    var ox = sw >= cw ? 0 : (cw - sw) / 2;
    var oy = sh >= ch ? 0 : (ch - sh) / 2;

    // Зсув прокручування: полотно липле до краю вікна перегляду.
    var scrollX = wrap ? wrap.scrollLeft : 0;
    var scrollY = wrap ? wrap.scrollTop : 0;
    var dx = ox - scrollX + this.offset.x;
    var dy = oy - scrollY + this.offset.y;

    this.view = { scale: scale, ox: dx, oy: dy, scrollX: scrollX, scrollY: scrollY };

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * dx, dpr * dy);
    ctx.imageSmoothingEnabled = scale < 1;

    // Тло (пісок/трава скіну) — на весь видимий світ.
    var bg = this.images["bg"];
    var vx0 = -ox / scale, vy0 = -oy / scale;
    var vw = cw / scale, vh = ch / scale;
    if (this.ready(bg)) {
      // Патерн кешуємо: створювати його щокадру дорого.
      if (this._patImg !== bg) {
        this._pattern = ctx.createPattern(bg, "repeat");
        this._patImg = bg;
      }
      var pattern = this._pattern;
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(vx0, vy0, vw, vh);
      }
    } else {
      ctx.fillStyle = "#c8a05a";
      ctx.fillRect(vx0, vy0, vw, vh);
    }

    // Видимий діапазон клітинок (щоб не малювати всю карту).
    var x0 = Math.max(0, Math.floor(vx0 / TILE) - 1);
    var y0 = Math.max(0, Math.floor(vy0 / TILE) - 1);
    var x1 = Math.min(world.width - 1, Math.ceil((vx0 + vw) / TILE) + 1);
    var y1 = Math.min(world.height - 1, Math.ceil((vy0 + vh) / TILE) + 1);
    if (x1 < x0 || y1 < y0) return;

    var i, x, y, ch2;

    // Додаткові об'єкти нижнього шару — під тайлами.
    this.drawExtras(ctx, world, 0);

    // Стартова клітинка — під роботом.
    var startChar = world.tileAt(world.start.x, world.start.y);
    if (startChar === "@") {
      this.drawTile(ctx, this.images["tile-@"], world.start.x, world.start.y);
    }

    // Тайли.
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        ch2 = world.tileAt(x, y);
        if (!ch2 || ch2 === " " || ch2 === "@" || ch2 === "*") continue;
        var img = this.images["tile-" + ch2];
        if (!img) {
          img = this.image("tile-" + ch2, "tile-" + ch2 + ".png");
        }
        this.drawTile(ctx, img, x, y);
      }
    }

    // Додаткові об'єкти середнього та верхнього шару.
    this.drawExtras(ctx, world, 1);
    this.drawExtras(ctx, world, 2);

    // Мазки фарби: з карти та слід, який залишив робот.
    for (i = 0; i < world.strokes.length; i++) {
      var s = world.strokes[i];
      if (s.x < x0 - 1 || s.x > x1 + 1 || s.y < y0 - 1 || s.y > y1 + 1) continue;
      var color = s.color === "w" ? "White" : "Black";
      var type = s.type === "." ? "Dot" : (s.type === "-" ? "Right" : "Down");
      var strokeImg = this.images["stroke" + color + type];
      if (!this.ready(strokeImg)) continue;
      ctx.drawImage(strokeImg, s.x * TILE, s.y * TILE);
    }

    // Energon блимають: кадри ecell_a / ecell_b міняються щосекунди.
    var frame = this.energonFrame();
    if (this.ready(frame)) {
      for (i = 0; i < world.energons.length; i++) {
        var b = world.energons[i];
        if (b.x < x0 || b.x > x1 || b.y < y0 || b.y > y1) continue;
        ctx.drawImage(frame, b.x * TILE, b.y * TILE);
      }
    }

    // Напівпрозора сітка клітинок (вмикається кліком по карті).
    if (this.gridVisible) {
      this.drawGrid(ctx, x0, y0, x1, y1);
    }

    // Пензель (малює клітинку під роботом).
    if (world.robot.paintMode !== "off") {
      var brush = this.images["paint" + (world.robot.paintMode === "w" ? "White" : "Black")];
      if (this.ready(brush)) {
        ctx.drawImage(brush, 0, 0, TILE, TILE / 2,
                     world.robot.x * TILE, world.robot.y * TILE + TILE / 2, TILE, TILE / 2);
      }
    }

    // Робот.
    this.drawRobot(ctx, world);
  };

  /**
   * Напівпрозора сітка: кожна клітинка карти — квадрат із тонкою рамкою.
   * Малюємо лише видимий діапазон, щоб не перевантажувати полотно.
   */
  Renderer.prototype.drawGrid = function (ctx, x0, y0, x1, y1) {
    var line = 1 / (this.view.scale || 1);
    ctx.save();
    ctx.beginPath();
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        ctx.rect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fill();
    ctx.lineWidth = line;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.stroke();
    ctx.restore();
  };

  /** Показує або ховає сітку клітинок. Повертає новий стан. */
  Renderer.prototype.toggleGrid = function () {
    this.gridVisible = !this.gridVisible;
    this.paint();
    return this.gridVisible;
  };

  Renderer.prototype.drawRobot = function (ctx, world) {
    var r = world.robot;
    var x = r.x * TILE, y = r.y * TILE;
    var cx = x + TILE / 2, cy = y + TILE / 2;
    // Кут повороту: 0° — на північ, 90° — на схід (за годинниковою стрілкою).
    var angle = (DIR_ANGLE[r.dir] || 0) * Math.PI / 180;

    // Тінь не обертається.
    if (this.ready(this.images["robotShadow"])) {
      ctx.drawImage(this.images["robotShadow"], x, y);
    }

    // Корпус, голова і лапка обертаються разом із напрямком робота.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    if (this.ready(this.images["robotBody"])) {
      ctx.drawImage(this.images["robotBody"], -TILE / 2, -TILE / 2);
    }

    var head = this.images["robotHead"];
    if (this.ready(head)) {
      ctx.drawImage(head, -TILE / 2, -TILE / 2);
    }

    // Лапка — перед роботом: у звичайному стані ближче до корпусу,
    // під час взяття Energon — висунута вперед.
    var reach = r.gripper === "reach" ? TILE * 0.72 : TILE * 0.42;

    // Сама лапка.
    var gripper = this.images["robotGripperOpen"];
    if (this.ready(gripper)) {
      ctx.drawImage(gripper, -TILE / 4, -reach - TILE / 4, TILE / 2, TILE / 2);
    }

    ctx.restore();
  };

  /** Переводить позицію миші у клітинку карти. */
  Renderer.prototype.pixelToWorld = function (px, py) {
    var v = this.view;
    if (!v.scale) return null;
    return {
      x: Math.floor((px - v.ox) / v.scale / TILE),
      y: Math.floor((py - v.oy) / v.scale / TILE),
    };
  };

  /** Прокручує карту (у вікні перегляду). */
  Renderer.prototype.scrollBy = function (dx, dy) {
    if (!this.wrap) return;
    this.wrap.scrollLeft += dx;
    this.wrap.scrollTop += dy;
    this.paint();
  };

  Renderer.prototype.resetView = function () {
    this.zoom = 0;
    this.offset = { x: 0, y: 0 };
    if (this.wrap) { this.wrap.scrollLeft = 0; this.wrap.scrollTop = 0; }
    this.paint();
  };

  /** Збільшує або зменшує карту (1 — вписана у вікно). */
  Renderer.prototype.zoomBy = function (factor) {
    var current = this.zoom > 0 ? this.zoom : 1;
    this.zoom = Math.max(0.25, Math.min(8, current * factor));
    this.paint();
  };

  RM.Renderer = Renderer;
  RM.TILE_SIZE = TILE;
})(typeof window !== "undefined" ? window : this);
