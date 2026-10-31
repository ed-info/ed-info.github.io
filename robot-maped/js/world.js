/*
 * world.js — модель світу: карта, фарбування, Energon та робот.
 *
 * Формат карти (.map) — той самий, як у оригінального 7:
 *   # коментарі
 *   paint:
 *   (w,|,10,2)(w,-,10,4)      — мазки: колір w/b, тип ./-/|, координати
 *   extra:
 *   palm@8,2                    — додаткові об'єкти
 *   direction:
 *   north                       — початковий напрям робота: north | east | south | west
 *                                 (також приймаються up | right | down | left;
 *                                 за замовчуванням — north/up)
 *   map:
 *   CHHHHHH...                  — сітка тайлів; @ — старт, * — Energon
 *
 * Важливо (як в оригіналі): рядки карти не обрізаються — пробіли на краях і
 * порожні рядки є частиною сітки, а літери A..Z — це перешкоди.
 * Поза межами сітки (як і в оригіналі) — вільний простір.
 */

(function (global) {
  "use strict";

  var RM = global.RMApp = global.RMApp || {};

  var NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;
  var DX = [0, 1, 0, -1];
  var DY = [-1, 0, 1, 0];

  /**
   * Витягує вміст секції ("paint:", "extra:") — рядки після заголовка
   * до першого порожнього рядка (як у оригіналі).
   */
  function section(lines, name) {
    var from = -1, to = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf(name) === 0) { from = i + 1; continue; }
      if (from > 0 && lines[i].trim() === "") { to = i; break; }
    }
    if (from < 0) return "";
    if (to < 0) to = lines.length;
    return lines.slice(from, to).join("\n");
  }

  var DIR_NAMES = {
    up: NORTH, north: NORTH,
    right: EAST, east: EAST,
    down: SOUTH, south: SOUTH,
    left: WEST, west: WEST,
  };
  var DIR_OUT = ["north", "east", "south", "west"];

  /** Початковий напрям із секції "direction:" (перше непорожнє слово); інакше — вгору. */
  function parseDirection(text) {
    var m = /[A-Za-z]+/.exec(String(text || ""));
    if (!m) return NORTH;
    var d = DIR_NAMES[m[0].toLowerCase()];
    return d === undefined ? NORTH : d;
  }

  function parseExtras(text) {
    var out = [];
    var re = /(\w+)@(\d+),(\d+)/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      out.push({ name: m[1], x: parseInt(m[2], 10), y: parseInt(m[3], 10) });
    }
    return out;
  }

  function parseStrokes(text) {
    var out = [];
    var re = /\(([wb]),([.\-|]),(-?\d+),(-?\d+)\)/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      out.push({
        color: m[1], type: m[2],
        x: parseInt(m[3], 10), y: parseInt(m[4], 10),
      });
    }
    return out;
  }

  /** Ключ мазка: однакові колір, тип і координати дають однаковий ключ. */
  function strokeKey(s) {
    return s.color + s.type + s.x + "," + s.y;
  }

  function World(mapText) {
    this.rows = [];
    this.width = 0;
    this.height = 0;
    this.start = { x: 0, y: 0 };
    this.startDir = NORTH;
    this.extras = [];
    this.strokes = [];
    this.strokeIndex = {};  // ключ мазка -> об'єкт мазка (щоб не копити повтори)
    this.painted = [];      // [y][x] = true, коли клітинку пофарбовано
    this.paintColor = [];   // [y][x] = 'w' | 'b'
    this.paintedList = [];  // список пофарбованих клітинок (для малювання)
    this.energons = [];       // список {x, y} — Energon на полі
    this.collect = 0;       // скільки Energon уже зібрано
    this.totalEnergons = 0;   // скільки Energon було на карті при завантаженні
    this.robot = {
      x: 0, y: 0, dir: NORTH, paintMode: "off", gripper: "rest", outOfBounds: false,
    };
    if (mapText) this.load(mapText);
  }

  // ---- карта -----------------------------------------------------------

  World.prototype.load = function (text) {
    var raw = String(text).split(/\r\n|\r|\n/);
    // Фінальний перенос рядка не створює ще одного рядка карти.
    if (raw.length && raw[raw.length - 1] === "") raw.pop();
    var lines = [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].charAt(0) === "#") continue;   // коментарі відкидаємо
      lines.push(raw[i]);
    }

    // секція "map:" — усі рядки після заголовка (до кінця файлу)
    var rows = [];
    for (i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("map:") === 0) {
        for (var j = i + 1; j < lines.length; j++) rows.push(lines[j]);
        break;
      }
    }

    var width = 0;
    for (i = 0; i < rows.length; i++) width = Math.max(width, rows[i].length);
    var height = rows.length;

    this.extras = parseExtras(section(lines, "extra:"));
    this.strokes = parseStrokes(section(lines, "paint:"));
    this.startDir = parseDirection(section(lines, "direction:"));

    // Розмір сітки визначають лише рядки карти. Додаткові об'єкти (extra)
    // розмір не змінюють — їхні габарити враховує рендерер (render.js).

    this.rows = rows;
    this.width = width;
    this.height = height;
    this.energons = [];
    this.collect = 0;
    this.painted = [];
    this.paintColor = [];
    this.paintedList = [];
    this.start = { x: 0, y: 0 };

    for (var y = 0; y < height; y++) {
      var pRow = [];
      var cRow = [];
      for (var x = 0; x < width; x++) {
        pRow.push(false);
        cRow.push(null);
      }
      this.painted.push(pRow);
      this.paintColor.push(cRow);
    }

    // Energon та стартова позиція.
    for (y = 0; y < rows.length; y++) {
      var row = rows[y];
      for (x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch === "@") {
          this.start = { x: x, y: y };
        } else if (ch === "*") {
          this.energons.push({ x: x, y: y });
        }
      }
    }

    // Скільки Energon було на карті — за цим числом визначається, чи виконано завдання.
    this.totalEnergons = this.energons.length;

    // Мазки малюються поверх сітки.
    this.strokeIndex = {};
    for (var s = 0; s < this.strokes.length; s++) {
      this.applyStroke(this.strokes[s]);
      this.strokeIndex[strokeKey(this.strokes[s])] = this.strokes[s];
    }

    this.robot = {
      x: this.start.x, y: this.start.y, dir: this.startDir,
      paintMode: "off", bumped: false, gripper: "rest", outOfBounds: false,
    };
  };

  World.prototype.applyStroke = function (stroke) {
    if (stroke.type === ".") {
      this.setPaint(stroke.x, stroke.y, stroke.color);
    } else if (stroke.type === "-") {
      this.setPaint(stroke.x, stroke.y, stroke.color);
      this.setPaint(stroke.x + 1, stroke.y, stroke.color);
    } else if (stroke.type === "|") {
      this.setPaint(stroke.x, stroke.y, stroke.color);
      this.setPaint(stroke.x, stroke.y + 1, stroke.color);
    }
  };

  /**
   * Додає мазок до сліду робота. На відміну від крапки, мазки "-" та "|"
   * малюються на дві клітинки й з'єднують сусідні кроки в суцільну лінію.
   */
  World.prototype.addStroke = function (color, type, x, y) {
    var stroke = { color: color, type: type, x: x, y: y };
    // Робот може безліч разів фарбувати ті самі клітинки (цикли туди-сюди).
    // Без цього список мазків ріс би без меж, а кожне перемальовування
    // проходило б по всіх них — програма гальмувала б дедалі більше.
    // Повтор знімаємо зі старого місця й ставимо в кінець — порядок
    // накладання мазків лишається тим самим.
    var key = strokeKey(stroke);
    var old = this.strokeIndex[key];
    if (old) {
      var at = this.strokes.lastIndexOf(old);
      if (at >= 0) this.strokes.splice(at, 1);
    }
    this.strokes.push(stroke);
    this.strokeIndex[key] = stroke;
    this.applyStroke(stroke);
    return stroke;
  };

  World.prototype.setPaint = function (x, y, color) {
    if (!this.painted[y] || this.painted[y][x] === undefined) return;
    if (!this.painted[y][x]) {
      this.painted[y][x] = true;
      this.paintedList.push({ x: x, y: y });
    }
    this.paintColor[y][x] = color;
  };

  /** Символ клітинки; null — за межами наявних рядків. */
  World.prototype.tileAt = function (x, y) {
    if (y < 0 || y >= this.rows.length) return null;
    var row = this.rows[y];
    if (x < 0 || x >= row.length) return null;
    return row.charAt(x);
  };

  // ---- запитання про світ -----------------------------------------------

  /**
   * Перешкода — це будь-яка літера A..Z (як в оригіналі: скін містить
   * зображення для кожної літери, тому кожна клітинка з літерою — стіна).
   * Пробіл, '@' та '*' — прохідні.
   */
  /** True, якщо клітинка (x, y) лежить поза межами карти. */
  World.prototype.isOutOfBounds = function (x, y) {
    return this.tileAt(x, y) === null;
  };

  World.prototype.isObstacle = function (x, y) {
    var ch = this.tileAt(x, y);
    if (ch === null) return true;   // поза межами карти — теж перешкода
    return ch >= "A" && ch <= "Z";
  };

  World.prototype.isEnergon = function (x, y) {
    for (var i = 0; i < this.energons.length; i++) {
      if (this.energons[i].x === x && this.energons[i].y === y) return true;
    }
    return false;
  };

  World.prototype.isPainted = function (x, y) {
    return !!(this.painted[y] && this.painted[y][x]);
  };

  World.prototype.paintColorAt = function (x, y) {
    return (this.paintColor[y] && this.paintColor[y][x]) || null;
  };

  World.prototype.isWhite = function (x, y) {
    return this.paintColorAt(x, y) === "w";
  };

  World.prototype.isBlack = function (x, y) {
    return this.paintColorAt(x, y) === "b";
  };

  // ---- рух -------------------------------------------------------------

  World.prototype.pointInFront = function (x, y, dir) {
    return { x: x + DX[dir], y: y + DY[dir] };
  };

  World.prototype.lookAt = function (dir) {
    var p = this.pointInFront(this.robot.x, this.robot.y, dir);
    return {
      obstacle: this.isObstacle(p.x, p.y),
      energon: this.isEnergon(p.x, p.y),
      white: this.isWhite(p.x, p.y),
      black: this.isBlack(p.x, p.y),
    };
  };

  /** Крокує вперед на n клітин, повертає фактично пройдену кількість. */
  World.prototype.moveForward = function (n) {
    var moved = 0;
    this.robot.bumped = false;
    this.robot.outOfBounds = false;
    for (var i = 0; i < n; i++) {
      var p = this.pointInFront(this.robot.x, this.robot.y, this.robot.dir);
      if (this.isOutOfBounds(p.x, p.y)) {
        this.robot.outOfBounds = true;
        this.robot.bumped = true;
        break;
      }
      if (this.isObstacle(p.x, p.y)) {
        this.robot.bumped = true;
        break;
      }
      var fromX = this.robot.x, fromY = this.robot.y;
      this.robot.x = p.x;
      this.robot.y = p.y;
      moved += 1;
      this.paintTrail(fromX, fromY, p.x, p.y);
    }
    return moved;
  };

  /** Крокує назад на n клітин, повертає фактично пройдену кількість. */
  World.prototype.moveBackward = function (n) {
    var moved = 0;
    this.robot.bumped = false;
    this.robot.outOfBounds = false;
    for (var i = 0; i < n; i++) {
      var p = this.pointInFront(this.robot.x, this.robot.y, (this.robot.dir + 2) % 4);
      if (this.isOutOfBounds(p.x, p.y)) {
        this.robot.outOfBounds = true;
        this.robot.bumped = true;
        break;
      }
      if (this.isObstacle(p.x, p.y)) {
        this.robot.bumped = true;
        break;
      }
      var fromX = this.robot.x, fromY = this.robot.y;
      this.robot.x = p.x;
      this.robot.y = p.y;
      moved += 1;
      this.paintTrail(fromX, fromY, p.x, p.y);
    }
    return moved;
  };

  World.prototype.turnLeft = function () {
    this.robot.dir = (this.robot.dir + 3) % 4;
  };

  World.prototype.turnRight = function () {
    this.robot.dir = (this.robot.dir + 1) % 4;
  };

  /** Повертає робота у вказаний напрямок (0=N, 1=E, 2=S, 3=W). */
  World.prototype.faceTo = function (dir) {
    this.robot.dir = ((dir % 4) + 4) % 4;
  };

  // ---- фарбування ------------------------------------------------------

  /** Ставить крапку пензля в клітинці під роботом. */
  World.prototype.paintUnderRobot = function () {
    if (this.robot.paintMode === "off") return;
    this.addStroke(this.robot.paintMode, ".", this.robot.x, this.robot.y);
  };

  /**
   * Малює слід між двома сусідніми клітинками: горизонтальний крок — "-",
   * вертикальний — "|". Так окремі кроки утворюють суцільну лінію.
   */
  World.prototype.paintTrail = function (fromX, fromY, toX, toY) {
    if (this.robot.paintMode === "off") return;
    if (fromX === toX && fromY === toY) return;
    if (fromY === toY) {
      this.addStroke(this.robot.paintMode, "-", Math.min(fromX, toX), fromY);
    } else {
      this.addStroke(this.robot.paintMode, "|", fromX, Math.min(fromY, toY));
    }
  };

  World.prototype.setPaintMode = function (mode) {
    var previous = this.robot.paintMode;
    this.robot.paintMode = mode;
    // На початку малювання (або при зміні кольору) ставимо крапку під роботом.
    if (mode !== "off" && mode !== previous) this.paintUnderRobot();
  };

  /**
   * Видаляє фарбування у клітинці, де стоїть робот.
   * Повертає true, якщо фарбування було і його видалено.
   */
  World.prototype.clearPaint = function () {
    var x = this.robot.x, y = this.robot.y;
    if (this.painted[y] && this.painted[y][x]) {
      this.painted[y][x] = false;
      this.paintColor[y][x] = null;
      // Видаляємо з paintedList
      for (var i = this.paintedList.length - 1; i >= 0; i--) {
        if (this.paintedList[i].x === x && this.paintedList[i].y === y) {
          this.paintedList.splice(i, 1);
          break;
        }
      }
      // Видаляємо відповідні strokes (dot/right/down) що охоплюють цю клітинку
      for (var i = this.strokes.length - 1; i >= 0; i--) {
        var s = this.strokes[i];
        var covers = false;
        if (s.type === "." && s.x === x && s.y === y) covers = true;
        else if (s.type === "-" && s.y === y && (s.x === x || s.x + 1 === x)) covers = true;
        else if (s.type === "|" && s.x === x && (s.y === y || s.y + 1 === y)) covers = true;
        if (covers) {
          var removedKey = strokeKey(s);
          if (this.strokeIndex[removedKey] === s) delete this.strokeIndex[removedKey];
          this.strokes.splice(i, 1);
        }
      }
      return true;
    }
    return false;
  };

  // ---- Energon ------------------------------------------------------------

  /** Збирає Energon, що стоїть перед роботом. Повертає True/False. */
  World.prototype.pickUp = function () {
    var p = this.pointInFront(this.robot.x, this.robot.y, this.robot.dir);
    for (var i = 0; i < this.energons.length; i++) {
      if (this.energons[i].x === p.x && this.energons[i].y === p.y) {
        this.energons.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  // ---- збереження -------------------------------------------------------

  /** Формує текст карти у форматі .map. */
  World.prototype.toMapText = function () {
    var out = [];
    out.push("# generated map");
    out.push("");
    out.push("");

    if (this.strokes.length) {
      out.push("paint:");
      var line = "";
      for (var i = 0; i < this.strokes.length; i++) {
        var s = this.strokes[i];
        line += "(" + s.color + "," + s.type + "," + s.x + "," + s.y + ")";
        if (line.length > 70) { out.push(line); line = ""; }
      }
      if (line) out.push(line);
      out.push("");
    }

    if (this.extras.length) {
      out.push("extra:");
      for (var e = 0; e < this.extras.length; e++) {
        out.push(this.extras[e].name + "@" + this.extras[e].x + "," + this.extras[e].y);
      }
      out.push("");
    }

    if (this.robot.dir !== NORTH) {
      out.push("direction:");
      out.push(DIR_OUT[this.robot.dir]);
      out.push("");
    }

    out.push("map:");
    for (var y = 0; y < this.rows.length; y++) {
      var chars = this.rows[y].split("");
      if (this.robot.x >= 0 && this.robot.y === y && this.robot.x < chars.length) {
        chars[this.robot.x] = "@";
      }
      for (var b = 0; b < this.energons.length; b++) {
        if (this.energons[b].y === y && this.energons[b].x < chars.length) {
          chars[this.energons[b].x] = "*";
        }
      }
      out.push(chars.join(""));
    }
    return out.join("\n") + "\n";
  };

  RM.World = World;
  RM.DIRS = { NORTH: NORTH, EAST: EAST, SOUTH: SOUTH, WEST: WEST };

  /**
   * Створює модальне вікно карти (панель #map-panel) динамічно.
   * Викликається при завантаженні бібліотеки robot і при старті додатку.
   */
  RM.createMapWindow = function () {
    if (document.getElementById("map-panel")) return;
    var panel = document.createElement("div");
    panel.id = "map-panel";
    panel.className = "map-panel";
    panel.innerHTML =
      '<div id="map-panel-head" class="map-panel-head">' +
        '<div class="map-toolbar-left">' +
          '<button id="btn-run" class="btn tiny icon-btn primary" title="Виконати програму" aria-label="Виконати">▶️</button>' +
          '<button id="btn-step" class="btn tiny icon-btn" title="Виконати один крок" aria-label="Крок">⏯️️</button>' +
          '<button id="btn-stop" class="btn tiny icon-btn" title="Зупинити" aria-label="Зупинити">⏹️</button>' +
          '<button id="btn-reset" class="btn tiny icon-btn" title="Повернути робота на старт" aria-label="Скинути">🔁</button>' +
        '</div>' +
        '<div class="map-toolbar-center">' +
          '<div class="map-picker">' +
            '<button id="map-prev" class="map-arrow" type="button" title="Попередні карти" aria-label="Попередні карти">❮</button>' +
            '<span id="map-pages" class="map-pages"></span>' +
            '<button id="map-next" class="map-arrow" type="button" title="Наступні карти" aria-label="Наступні карти">❯</button>' +
          '</div>' +
        '</div>' +
        '<div class="map-toolbar-right">' +
          '<button id="btn-close-map" class="btn tiny icon-btn" title="Закрити вікно карти" aria-label="Закрити">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="field-wrap" id="field-wrap">' +
        '<div class="field-sizer" id="field-sizer">' +
          '<canvas id="field"></canvas>' +
        '</div>' +
        '<div id="congrats" class="congrats" hidden>' +
          '<div class="congrats-box">' +
            '<div class="medals">🥇🥈🥉</div>' +
            '<h1>Вітаю! Завдання виконано</h1>' +
            '<div class="trophy">🏆</div>' +
            '<p class="congrats-note">Усі енергокристали зібрано!</p>' +
            '<button id="btn-congrats-ok" class="btn primary">Чудово</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);
  };
})(typeof window !== "undefined" ? window : this);
