/*
 * editor.js — редактор карт для застосунку WebRobot.
 *
 * Карта редагується як сітка символів:
 *   A..Z — блоки-перешкоди, @ — старт робота, * — Energon,
 *   пробіл — порожня клітинка.
 *
 * Файл .map зберігає також секції paint:, extra:, direction:, skin: і
 * codelimit:. direction: (north / east / south / west) задає початковий
 * напрям робота, skin: (default / grass / dessert / lego / starmind) —
 * дизайн карти, codelimit: — допустиму кількість рядків коду (якщо задано).
 * Редактор записує ці секції перед рядками карти.
 */

(function (global) {
  "use strict";

  var SKINS_DIR = "skins/";
  var MAPS_DIR = "maps/";
  var ROBOT_IMG = "img/robot.png";

  var DEFAULT_WIDTH = 16;
  var DEFAULT_HEIGHT = 11;
  var MAP_PROBE_LIMIT = 60;   // скільки maps/mapN.map перевіряємо
  var HISTORY_LIMIT = 200;

  // Напрям робота: 0 — north (вгору), далі за годинниковою стрілкою.
  var DIR_NAMES = ["north", "east", "south", "west"];
  var DIR_LABELS = { north: "північ", east: "схід", south: "південь", west: "захід" };
  var DIR_ANGLE = [0, 90, 180, 270];   // robot.png намальований роботом, що дивиться вгору

  /*
   * Геометрія карти така сама, як у застосунку (js/render.js):
   * крок сітки — 200×200 px, а зображення блока малюється в натуральному
   * розмірі (225×225 px у більшості скінів). Тому блоки накладаються на
   * сусідні клітинки на 25 px, а не вписуються в клітинку.
   */
  var TILE_STEP = 200;
  var BLOCK_NOMINAL = 225;
  var CANVAS_OVERFLOW = 32;   // запас для блоків, більших за крок сітки

  var SKINS = {
    defaultSkin: { label: "metal (default)", short: "metal", file: "default" },
    grassSkin: { label: "grass", short: "grass", file: "grass" },
    dessertSkin: { label: "desert", short: "desert", file: "dessert" },
    legoSkin: { label: "lego", short: "lego", file: "lego" },
    starMindSkin: { label: "star", short: "star", file: "starmind" },
  };

  // Назви дизайнів у файлі карти (секція skin:).
  var SKIN_BY_FILE = {
    default: "defaultSkin",
    grass: "grassSkin",
    dessert: "dessertSkin",
    lego: "legoSkin",
    starmind: "starMindSkin",
  };

  var state = {
    skin: "defaultSkin",
    head: [],              // рядки .map до "map:"
    grid: [],              // [y][x] — символи карти
    cols: DEFAULT_WIDTH,
    rows: DEFAULT_HEIGHT,
    selected: null,        // символ блока, "delete" або null
    available: [],         // блоки, наявні в поточному скіні
    dir: 0,                // напрям робота: 0 north, 1 east, 2 south, 3 west
    hover: null,           // { x, y } клітинка під курсором
    cell: 32,              // крок сітки на екрані (200 px * scale)
    scale: 0.16,           // екранних пікселів на піксель карти
    dpr: 1,
    mapName: "нова-карта.map",
    codeLimit: null,       // допустима кількість рядків коду; null — без обмеження
    dirty: false,
    history: [],
    future: [],
    mapNumbers: null,      // кеш списку maps/mapN.map
    mapDiscovery: null,
    skinBlocks: null,      // манифест блоків зі skins/skins.json
  };

  var el = {};
  var assetCache = {};     // "skin|символ" -> { img, ready, failed, promise }
  var robotInfo = null;    // зображення робота img/robot.png
  var availabilityCache = {};  // "skin|символ" -> Promise<boolean>
  var modal = null;
  var worldDialog = null;  // стан відкритого вікна «Створити світ»
  var toastTimer = null;
  var drawPending = false;
  var resizePending = false;
  var mouseDown = false;

  // ---- допоміжні функції ------------------------------------------------

  function skinPath(name) {
    return SKINS_DIR + name + "/";
  }

  function tileFile(ch) {
    if (ch === "*") return "ecell_a.png";
    return "tile-" + ch + ".png";
  }

  function isBlockChar(ch) {
    return ch === "@" || ch === "*" || (ch >= "A" && ch <= "Z");
  }

  function blockLabel(ch) {
    if (ch === "@") return "Старт";
    if (ch === "*") return "Energon";
    return ch;
  }

  function blockTitle(ch) {
    if (ch === "@") return "Старт робота (@)";
    if (ch === "*") return "Energon (*)";
    return "Блок " + ch;
  }

  function readStorage(key) {
    try { return global.localStorage.getItem(key); } catch (e) { return null; }
  }

  function writeStorage(key, value) {
    try { global.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /** М'яке повідомлення внизу екрана. */
  function toast(message, isError) {
    var old = document.querySelector(".toast");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var node = document.createElement("div");
    node.className = "toast" + (isError ? " error" : "");
    node.textContent = message;
    document.body.appendChild(node);
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      node.classList.add("hide");
      global.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 220);
    }, isError ? 4500 : 2300);
  }

  // ---- ресурси скіна ----------------------------------------------------

  function assetInfo(skin, ch) {
    var key = skin + "|" + ch;
    if (assetCache[key]) return assetCache[key];

    var img = new global.Image();
    var info = { img: img, ready: false, failed: false, promise: null };
    info.promise = new Promise(function (resolve) {
      img.onload = function () {
        info.ready = true;
        resolve(true);
        scheduleDraw();
      };
      img.onerror = function () {
        info.failed = true;
        resolve(false);
      };
    });
    img.src = skinPath(skin) + tileFile(ch);
    assetCache[key] = info;
    return info;
  }

  /** Фонове зображення скіна (skins/<скін>/bg.png) для заливки поля карти. */
  function bgInfo(skin) {
    var key = skin + "|bg";
    if (assetCache[key]) return assetCache[key];

    var img = new global.Image();
    var info = { img: img, ready: false, failed: false, promise: null };
    info.promise = new Promise(function (resolve) {
      img.onload = function () {
        info.ready = true;
        resolve(true);
        scheduleDraw();
      };
      img.onerror = function () {
        info.failed = true;
        resolve(false);
        scheduleDraw();
      };
    });
    img.src = skinPath(skin) + "bg.png";
    assetCache[key] = info;
    return info;
  }

  /**
   * Зображення робота (img/robot.png). Воно не залежить від скіна і для
   * стартової клітинки замінює tile-@.png.
   */
  function robotAsset() {
    if (robotInfo) return robotInfo;

    var img = new global.Image();
    robotInfo = { img: img, ready: false, failed: false, promise: null };
    robotInfo.promise = new Promise(function (resolve) {
      img.onload = function () {
        robotInfo.ready = true;
        resolve(true);
        scheduleDraw();
      };
      img.onerror = function () {
        robotInfo.failed = true;
        resolve(false);
        scheduleDraw();
      };
    });
    img.src = ROBOT_IMG;
    return robotInfo;
  }

  var bgPatternCache = { key: "", pattern: null };

  /** Патерн фону в масштабі карти; null, якщо bg.png недоступний. */
  function getBgPattern(ctx) {
    var info = bgInfo(state.skin);
    if (!info.ready || !info.img.naturalWidth) return null;

    var key = state.skin + "|" + state.scale + "|" + state.dpr;
    if (bgPatternCache.key === key && bgPatternCache.pattern) {
      return bgPatternCache.pattern;
    }

    var pattern = ctx.createPattern(info.img, "repeat");
    if (!pattern) return null;
    if (pattern.setTransform && global.DOMMatrix) {
      pattern.setTransform(new global.DOMMatrix().scale(state.scale));
    }
    bgPatternCache = { key: key, pattern: pattern };
    return pattern;
  }

  /**
   * Чи існує зображення блока в скіні. Для HTTP-сторінки достатньо HEAD-
   * запиту (він не засмічує консоль 404-помилками, як <img>); для file://
   * перевіряємо саме завантаження зображення.
   */
  function isBlockAvailable(skin, ch) {
    if (ch === "@") return robotAsset().promise;

    var key = skin + "|" + ch;
    if (availabilityCache[key]) return availabilityCache[key];

    var promise;
    if (global.fetch && global.location.protocol !== "file:") {
      promise = global.fetch(skinPath(skin) + tileFile(ch), { method: "HEAD" })
        .then(function (response) {
          if (response.ok) return true;
          if (response.status === 405 || response.status === 501) {
            return assetInfo(skin, ch).promise;
          }
          return false;
        })
        .catch(function () { return assetInfo(skin, ch).promise; });
    } else {
      promise = assetInfo(skin, ch).promise;
    }

    availabilityCache[key] = promise;
    return promise;
  }

  /**
   * Манифест skins.json містить точний перелік блоків кожного скіна.
   * Якщо його не вдалося прочитати (наприклад, сторінку відкрито з file://),
   * панель блоків визначає наявні зображення сама.
   */
  function loadSkinManifest() {
    if (!global.fetch || global.location.protocol === "file:") {
      return Promise.resolve(null);
    }
    return global.fetch(SKINS_DIR + "skins.json")
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (json) {
        var manifest = {};
        Object.keys(json).forEach(function (name) {
          var list = json[name] && json[name].blocks;
          if (!list || !list.length) return;
          var filtered = list.filter(isBlockChar);
          if (filtered.length) manifest[name] = filtered;
        });
        state.skinBlocks = manifest;
        return manifest;
      })
      .catch(function () {
        state.skinBlocks = null;
        return null;
      });
  }

  /** Розмір квадратного сегмента зображення (смугові тайли беремо з початку). */
  function blockImageSide(img) {
    if (!img || !img.complete || !img.naturalWidth) return 0;
    return Math.min(img.naturalWidth, img.naturalHeight);
  }

  /**
   * Малює блок у натуральному розмірі (225×225 у типових скінах) із кроком
   * сітки 200×200. Саме так це робить render.js у застосунку.
   */
  function drawBlockImage(ctx, img, cellX, cellY) {
    var side = blockImageSide(img);
    if (!side) return false;
    var size = side * state.scale;
    ctx.drawImage(img, 0, 0, side, side,
      cellX * state.cell, cellY * state.cell, size, size);
    return true;
  }

  /**
   * Малює робота (img/robot.png) по центру клітинки та повертає його на
   * заданий кут. Зображення вище за ширину (200×250): корпус займає нижній
   * квадрат, а лапка/антена виступає вперед — тому обертаємо навколо центра
   * корпусу, а не всього зображення.
   */
  function drawRobotImage(ctx, img, cellX, cellY, angle) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var w = img.naturalWidth;
    var h = img.naturalHeight;
    var s = state.scale;
    var pivotY = h - w / 2;   // корпус — це квадрат w×w у нижній частині
    var cx = (cellX + 0.5) * state.cell;
    var cy = (cellY + 0.5) * state.cell;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle * Math.PI / 180);
    ctx.drawImage(img, 0, 0, w, h, -w * s / 2, -pivotY * s, w * s, h * s);
    ctx.restore();
    return true;
  }

  /** Екранний розмір блока в клітинці (для підсвічування та курсора). */
  function blockScreenSize(ch) {
    if (ch === "@") return state.cell;
    if (isBlockChar(ch)) {
      var info = assetInfo(state.skin, ch);
      var side = blockImageSide(info.img);
      if (side) return side * state.scale;
    }
    return BLOCK_NOMINAL * state.scale;
  }

  function refreshPalette() {
    var skin = state.skin;

    if (state.skinBlocks && state.skinBlocks[skin]) {
      var known = state.skinBlocks[skin].slice();
      state.available = known;
      if (state.selected && state.selected !== "delete" &&
          known.indexOf(state.selected) < 0) {
        state.selected = null;
      }
      renderPalette(known);
      return;
    }

    var chars = ["@", "*"];
    for (var i = 0; i < 26; i++) chars.push(String.fromCharCode(65 + i));

    el.blockList.innerHTML = '<p class="palette-empty">Завантаження блоків…</p>';

    var probes = chars.map(function (ch) {
      return isBlockAvailable(skin, ch).then(function (ok) {
        return { ch: ch, ok: ok };
      });
    });

    Promise.all(probes).then(function (results) {
      if (skin !== state.skin) return;      // скін уже перемкнули
      var available = [];
      results.forEach(function (result) {
        if (result.ok) available.push(result.ch);
      });
      state.available = available;
      if (state.selected && state.selected !== "delete" &&
          available.indexOf(state.selected) < 0) {
        state.selected = null;
      }
      renderPalette(available);
    });
  }

  function renderPalette(chars) {
    el.blockList.innerHTML = "";

    if (!chars.length) {
      el.blockList.innerHTML =
        '<p class="palette-empty">У цьому скіні не знайдено зображень блоків.</p>';
      updatePaletteSelection();
      updateStatus();
      return;
    }

    var fragment = document.createDocumentFragment();
    chars.forEach(function (ch) {
      var robot = ch === "@";
      var info = robot ? robotAsset() : assetInfo(state.skin, ch);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "block-item";
      button.setAttribute("data-block", ch);
      button.title = robot
        ? "Старт робота (@) — напрям: " + DIR_LABELS[DIR_NAMES[state.dir]]
        : blockTitle(ch);

      var img = document.createElement("img");
      img.className = "block-thumb" + (robot ? " robot-thumb" : "");
      img.src = info.img.src;
      img.alt = "";
      img.draggable = false;
      if (robot) img.style.transform = "rotate(" + DIR_ANGLE[state.dir] + "deg)";

      var name = document.createElement("span");
      name.className = "block-name";
      name.textContent = blockLabel(ch);

      button.appendChild(img);
      button.appendChild(name);
      button.addEventListener("click", function () { selectBlock(ch); });
      fragment.appendChild(button);
    });

    el.blockList.appendChild(fragment);
    updatePaletteSelection();
    updateStatus();
  }

  function updatePaletteSelection() {
    var items = el.blockList.querySelectorAll(".block-item");
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.classList.toggle("selected",
        item.getAttribute("data-block") === state.selected);
    }
    el.deleteBlock.classList.toggle("selected", state.selected === "delete");
  }

  function selectBlock(value) {
    state.selected = value;
    updatePaletteSelection();
    updateStatus();
    scheduleDraw();
  }

  /** Оновлює підписи, прев'ю та мініатюру «Старт» під поточний напрям. */
  function updateDirectionUI() {
    var name = DIR_NAMES[state.dir];
    var angle = DIR_ANGLE[state.dir];

    if (el.directionName) el.directionName.textContent = DIR_LABELS[name] || name;
    if (el.directionPreview) {
      el.directionPreview.style.transform = "rotate(" + angle + "deg)";
    }
    if (el.blockList) {
      var thumbs = el.blockList.querySelectorAll(".robot-thumb");
      for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].style.transform = "rotate(" + angle + "deg)";
        var item = thumbs[i].parentNode;
        if (item) {
          item.title = "Старт робота (@) — напрям: " + (DIR_LABELS[name] || name);
        }
      }
    }
  }

  /** Повертає робота на 90°: -1 — ліворуч, +1 — праворуч. */
  function rotateRobot(step) {
    applyChange(function () {
      state.dir = (state.dir + step + 4) % 4;
      return true;
    });
    updateDirectionUI();
  }

  function updateSkinMenu() {
    var items = document.querySelectorAll(".skin-item");
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var active = item.getAttribute("data-skin") === state.skin;
      item.classList.toggle("active", active);
      item.querySelector(".menu-check").textContent = active ? "✓" : "";
    }
    el.paletteSkin.textContent = SKINS[state.skin].short;
  }

  function setSkin(name, options) {
    options = options || {};
    if (!SKINS[name]) return;
    if (state.skin === name) {
      updateSkinMenu();
      return;
    }
    state.skin = name;
    writeStorage("mapEditor.skin", name);
    updateSkinMenu();
    refreshPalette();
    // Скін тепер є частиною файлу карти, тому його зміна робить карту зміненою.
    if (options.markDirty !== false) {
      state.dirty = true;
      updateTitle();
      updateStatus();
    }
    scheduleDraw();
    if (!options.silent) toast("Вигляд: " + SKINS[name].label);
  }

  // ---- обмеження коду ----------------------------------------------------

  function updateCodeLimitMenu() {
    var items = document.querySelectorAll(".code-limit-item[data-codelimit]");
    var presetActive = false;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var limit = normalizeCodeLimit(item.getAttribute("data-codelimit"));
      var active = limit === state.codeLimit;
      item.classList.toggle("active", active);
      item.querySelector(".menu-check").textContent = active ? "✓" : "";
      if (active) presetActive = true;
    }

    var custom = document.querySelector(".code-limit-item[data-codelimit-custom]");
    if (custom) {
      var customActive = !!state.codeLimit && !presetActive;
      custom.classList.toggle("active", customActive);
      custom.querySelector(".menu-check").textContent = customActive ? "✓" : "";
      var label = custom.querySelector("span:last-child");
      if (label) {
        label.textContent = customActive
          ? "Інша кількість (" + codeLimitLabel(state.codeLimit) + ")…"
          : "Інша кількість…";
      }
    }
  }

  function setCodeLimit(limit, options) {
    options = options || {};
    var next = normalizeCodeLimit(limit);
    if (state.codeLimit === next) {
      updateInfo();
      updateCodeLimitMenu();
      return;
    }

    state.codeLimit = next;
    updateInfo();
    updateCodeLimitMenu();
    if (options.markDirty !== false) {
      state.dirty = true;
      updateTitle();
      updateStatus();
    }
    if (!options.silent) {
      toast(next ? "Обмеження коду: " + codeLimitLabel(next) : "Обмеження коду знято");
    }
  }

  // ---- полотно ----------------------------------------------------------

  function computeScale() {
    var wrap = el.canvasWrap;
    var availableW = Math.max(1, wrap.clientWidth - 34);
    var availableH = Math.max(1, wrap.clientHeight - 34);
    var worldW = state.cols * TILE_STEP + CANVAS_OVERFLOW;
    var worldH = state.rows * TILE_STEP + CANVAS_OVERFLOW;
    var scale = Math.min(availableW / worldW, availableH / worldH);
    if (!isFinite(scale) || scale <= 0) scale = 0.16;
    // Крок сітки на екрані — від 10 до 100 px.
    return Math.max(0.05, Math.min(0.5, scale));
  }

  function resizeCanvas() {
    state.scale = computeScale();
    state.cell = TILE_STEP * state.scale;
    state.dpr = global.devicePixelRatio || 1;

    var w = (state.cols * TILE_STEP + CANVAS_OVERFLOW) * state.scale;
    var h = (state.rows * TILE_STEP + CANVAS_OVERFLOW) * state.scale;
    el.canvas.width = Math.max(1, Math.round(w * state.dpr));
    el.canvas.height = Math.max(1, Math.round(h * state.dpr));
    el.canvas.style.width = w + "px";
    el.canvas.style.height = h + "px";
  }

  function scheduleDraw() {
    if (drawPending) return;
    drawPending = true;
    global.requestAnimationFrame(function () {
      drawPending = false;
      draw();
    });
  }

  function scheduleResize() {
    if (resizePending) return;
    resizePending = true;
    global.requestAnimationFrame(function () {
      resizePending = false;
      resizeCanvas();
      scheduleDraw();
    });
  }

  function drawPlaceholder(ctx, ch, dx, dy, size) {
    ctx.save();
    ctx.fillStyle = "#3a2830";
    ctx.fillRect(dx, dy, size, size);
    ctx.fillStyle = "#e8b4b4";
    ctx.font = Math.max(10, Math.round(size * 0.5)) + "px " +
      'Consolas, "DejaVu Sans Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, dx + size / 2, dy + size / 2 + 1);
    ctx.restore();
  }

  function draw() {
    if (!state.cols || !state.rows) return;
    var ctx = el.canvas.getContext("2d");
    var cell = state.cell;
    var width = state.cols * cell;
    var height = state.rows * cell;
    var canvasW = (state.cols * TILE_STEP + CANVAS_OVERFLOW) * state.scale;
    var canvasH = (state.rows * TILE_STEP + CANVAS_OVERFLOW) * state.scale;

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#141820";
    ctx.fillRect(0, 0, canvasW, canvasH);

    var x, y, ch;

    // Внутрішня область карти — патерн bg.png поточного скіна.
    var bgPattern = getBgPattern(ctx);
    if (bgPattern) {
      ctx.save();
      ctx.fillStyle = bgPattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else {
      // Запасний варіант: шахівниця, поки bg.png завантажується або відсутній.
      for (y = 0; y < state.rows; y++) {
        for (x = 0; x < state.cols; x++) {
          ctx.fillStyle = ((x + y) % 2 === 0) ? "#1d222b" : "#1a1f27";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }

    // Блоки карти. Малюємо в натуральному розмірі (225×225) із кроком
    // 200×200 — тому сусідні блоки трохи перекриваються, як у застосунку.
    // Стартову клітинку (@) пропускаємо: робота малюємо поверх усіх блоків.
    for (y = 0; y < state.rows; y++) {
      for (x = 0; x < state.cols; x++) {
        ch = state.grid[y][x];
        if (ch === " " || ch === "@") continue;
        if (!isBlockChar(ch)) {
          drawPlaceholder(ctx, ch, x * cell, y * cell,
            BLOCK_NOMINAL * state.scale);
          continue;
        }
        var info = assetInfo(state.skin, ch);
        if (!drawBlockImage(ctx, info.img, x, y)) {
          drawPlaceholder(ctx, ch, x * cell, y * cell,
            BLOCK_NOMINAL * state.scale);
        }
      }
    }

    // Сітка клітинок (крок 200 px, а не розмір зображення блока).
    ctx.beginPath();
    for (x = 0; x <= state.cols; x++) {
      var px = x * cell + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (y = 0; y <= state.rows; y++) {
      var py = y * cell + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    // Робот на стартовій клітинці: img/robot.png, повернутий за напрямом.
    var robot = robotAsset();
    for (y = 0; y < state.rows; y++) {
      for (x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== "@") continue;
        if (!drawRobotImage(ctx, robot.img, x, y, DIR_ANGLE[state.dir])) {
          drawPlaceholder(ctx, "@", x * cell, y * cell, state.cell);
        }
      }
    }

    // Блок під курсором.
    var hover = state.hover;
    if (hover && hover.x >= 0 && hover.x < state.cols &&
        hover.y >= 0 && hover.y < state.rows) {
      var hx = hover.x * cell;
      var hy = hover.y * cell;

      if (state.selected === "delete") {
        var current = state.grid[hover.y][hover.x];
        var removeSize = blockScreenSize(current);
        ctx.fillStyle = "rgba(224, 90, 90, 0.30)";
        ctx.fillRect(hx, hy, removeSize, removeSize);
        ctx.strokeStyle = "rgba(224, 90, 90, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, removeSize - 2, removeSize - 2);
        ctx.beginPath();
        ctx.moveTo(hx + removeSize * 0.28, hy + removeSize * 0.28);
        ctx.lineTo(hx + removeSize * 0.72, hy + removeSize * 0.72);
        ctx.moveTo(hx + removeSize * 0.72, hy + removeSize * 0.28);
        ctx.lineTo(hx + removeSize * 0.28, hy + removeSize * 0.72);
        ctx.stroke();
      } else if (state.selected) {
        var ghostSize = blockScreenSize(state.selected);
        var ghostRobot = state.selected === "@";
        var selectedInfo = ghostRobot ? robotAsset() : assetInfo(state.skin, state.selected);
        ctx.save();
        ctx.globalAlpha = 0.62;
        if (ghostRobot) {
          if (!drawRobotImage(ctx, selectedInfo.img, hover.x, hover.y,
              DIR_ANGLE[state.dir])) {
            drawPlaceholder(ctx, state.selected, hx, hy, ghostSize);
          }
        } else if (!drawBlockImage(ctx, selectedInfo.img, hover.x, hover.y)) {
          drawPlaceholder(ctx, state.selected, hx, hy, ghostSize);
        }
        ctx.restore();
        ctx.fillStyle = "rgba(230, 191, 39, 0.10)";
        ctx.fillRect(hx, hy, ghostSize, ghostSize);
        ctx.strokeStyle = "rgba(230, 191, 39, 0.95)";
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, ghostSize - 2, ghostSize - 2);
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(hx + 0.5, hy + 0.5, cell - 1, cell - 1);
      }
    }
  }

  function eventToCell(event) {
    var rect = el.canvas.getBoundingClientRect();
    var x = Math.floor((event.clientX - rect.left) / state.cell);
    var y = Math.floor((event.clientY - rect.top) / state.cell);
    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return null;
    return { x: x, y: y };
  }

  function updateCursorInfo() {
    if (!state.hover) {
      el.cursorInfo.textContent = "Клітинка: —";
    } else {
      el.cursorInfo.textContent = "Клітинка: " + state.hover.x + ", " + state.hover.y;
    }
  }

  // ---- редагування карти -------------------------------------------------

  function snapshot() {
    return {
      grid: state.grid.map(function (row) { return row.slice(); }),
      dir: state.dir,
    };
  }

  function restoreSnapshot(snap) {
    state.grid = snap.grid;
    state.dir = snap.dir;
    updateDirectionUI();
  }

  function applyChange(mutator) {
    var before = snapshot();
    if (!mutator()) return false;

    state.history.push(before);
    if (state.history.length > HISTORY_LIMIT) state.history.shift();
    state.future.length = 0;
    state.dirty = true;
    updateTitle();
    updateStatus();
    scheduleDraw();
    return true;
  }

  function placeAt(x, y) {
    var ch = state.selected;
    if (!ch || ch === "delete") return;
    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return;

    applyChange(function () {
      var changed = false;

      // Старт на карті може бути лише один — переносимо його.
      if (ch === "@") {
        for (var yy = 0; yy < state.rows; yy++) {
          for (var xx = 0; xx < state.cols; xx++) {
            if (state.grid[yy][xx] === "@" && !(xx === x && yy === y)) {
              state.grid[yy][xx] = " ";
              changed = true;
            }
          }
        }
      }

      if (state.grid[y][x] !== ch) {
        state.grid[y][x] = ch;
        changed = true;
      }
      return changed;
    });
  }

  function eraseAt(x, y) {
    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return;
    applyChange(function () {
      if (state.grid[y][x] === " ") return false;
      state.grid[y][x] = " ";
      return true;
    });
  }

  function undo() {
    if (!state.history.length) {
      toast("Немає дій для скасування");
      return;
    }
    state.future.push(snapshot());
    restoreSnapshot(state.history.pop());
    state.dirty = true;
    updateTitle();
    scheduleDraw();
    toast("Скасовано");
  }

  function redo() {
    if (!state.future.length) {
      toast("Немає дій для повторення");
      return;
    }
    state.history.push(snapshot());
    restoreSnapshot(state.future.pop());
    state.dirty = true;
    updateTitle();
    scheduleDraw();
    toast("Повторено");
  }

  // ---- модель і файли ----------------------------------------------------

  function makeBlank(cols, rows) {
    var grid = [];
    for (var y = 0; y < rows; y++) {
      var row = [];
      for (var x = 0; x < cols; x++) row.push(" ");
      grid.push(row);
    }
    return grid;
  }

  /** Рамка з блоків C/H/D, G/I, B/F/E — як у зразку шаблону. */
  function makeTemplate(cols, rows) {
    var grid = [];
    for (var y = 0; y < rows; y++) {
      var row = [];
      for (var x = 0; x < cols; x++) {
        var ch = " ";
        if (y === 0) {
          ch = x === 0 ? "C" : (x === cols - 1 ? "D" : "H");
        } else if (y === rows - 1) {
          ch = x === 0 ? "B" : (x === cols - 1 ? "E" : "F");
        } else {
          ch = x === 0 ? "G" : (x === cols - 1 ? "I" : " ");
        }
        row.push(ch);
      }
      grid.push(row);
    }
    return grid;
  }

  function normalizeGrid(grid) {
    var width = 0;
    grid.forEach(function (row) {
      if (row.length > width) width = row.length;
    });
    if (!width) width = 1;
    return grid.map(function (row) {
      var chars = row.slice();
      while (chars.length < width) chars.push(" ");
      return chars;
    });
  }

  /** Перетворює слово з файлу в індекс напряму; -1 — невідоме слово. */
  function directionIndex(word) {
    var key = String(word || "").trim().toLowerCase();
    var aliases = {
      north: 0, up: 0,
      east: 1, right: 1,
      south: 2, down: 2,
      west: 3, left: 3,
    };
    return aliases.hasOwnProperty(key) ? aliases[key] : -1;
  }

  /**
   * Витягує секцію "key:" із заголовка карти. Значення може бути в тому ж
   * рядку або на наступному непорожньому рядку (як у файлах карт).
   * parse(value) має повернути розпізнане значення або null.
   * Повертає заголовок без секції та останнє розпізнане значення
   * (null, якщо секції немає або значення невідоме).
   */
  function extractSection(head, key, parse) {
    var lines = (head || []).slice();
    var value = null;

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf(key) !== 0) continue;

      var candidate = lines[i].slice(key.length).trim();
      var nextIndex = -1;
      if (!candidate) {
        var j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        if (j < lines.length && /^[A-Za-z]+$/.test(lines[j].trim())) {
          candidate = lines[j].trim();
          nextIndex = j;
        }
      }

      var parsed = parse(candidate);
      if (parsed !== null) value = parsed;
      if (nextIndex >= 0) lines.splice(nextIndex, 1);
      lines.splice(i, 1);
      i--;
    }

    return { head: lines, value: value };
  }

  function extractDirection(head) {
    var section = extractSection(head, "direction:", function (value) {
      var index = directionIndex(value);
      return index >= 0 ? index : null;
    });
    return { head: section.head, dir: section.value === null ? 0 : section.value };
  }

  function extractSkin(head) {
    var section = extractSection(head, "skin:", function (value) {
      var key = String(value || "").trim().toLowerCase();
      return SKIN_BY_FILE.hasOwnProperty(key) ? SKIN_BY_FILE[key] : null;
    });
    return { head: section.head, skin: section.value };
  }

  /** Додатне ціле з файлу або поля вводу; null — обмеження немає. */
  function normalizeCodeLimit(value) {
    var text = String(value == null ? "" : value).trim();
    if (!/^\d+$/.test(text)) return null;
    var limit = parseInt(text, 10);
    if (!isFinite(limit) || limit <= 0) return null;
    return Math.min(limit, 100000);
  }

  /** Українське слово для числа рядків: 1 рядок, 2 рядки, 5 рядків. */
  function codeLinesWord(n) {
    var lastTwo = n % 100;
    var last = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "рядків";
    if (last === 1) return "рядок";
    if (last >= 2 && last <= 4) return "рядки";
    return "рядків";
  }

  function codeLimitLabel(limit) {
    return limit ? limit + " " + codeLinesWord(limit) : "необмежено";
  }

  /**
   * Витягує секцію "codelimit:" із заголовка карти та прибирає її, щоб під
   * час збереження записати значення в єдиному канонічному вигляді.
   */
  function extractCodeLimit(head) {
    var lines = (head || []).slice();
    var value = null;

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("codelimit:") !== 0) continue;

      var candidate = lines[i].slice("codelimit:".length).trim();
      var nextIndex = -1;
      if (!candidate) {
        var j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        if (j < lines.length && /^\d+$/.test(lines[j].trim())) {
          candidate = lines[j].trim();
          nextIndex = j;
        }
      }

      var parsed = normalizeCodeLimit(candidate);
      if (parsed !== null) value = parsed;
      if (nextIndex >= 0) lines.splice(nextIndex, 1);
      lines.splice(i, 1);
      i--;
    }

    return { head: lines, value: value };
  }

  function parseMapText(text) {
    var lines = String(text).replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
    if (lines.length && lines[lines.length - 1] === "") lines.pop();

    var mapIndex = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("map:") === 0) { mapIndex = i; break; }
    }

    var head = [];
    var rows = [];
    var j;

    if (mapIndex >= 0) {
      head = lines.slice(0, mapIndex);
      // Якщо після "map:" у тому ж рядку щось є — це перший рядок карти.
      var rest = lines[mapIndex].slice(4);
      if (rest.trim() !== "") rows.push(rest);
      for (j = mapIndex + 1; j < lines.length; j++) {
        if (lines[j].charAt(0) === "#") continue;
        rows.push(lines[j]);
      }
    } else {
      for (j = 0; j < lines.length; j++) {
        if (lines[j].charAt(0) === "#") continue;
        rows.push(lines[j]);
      }
    }

    var width = 0;
    rows.forEach(function (row) {
      if (row.length > width) width = row.length;
    });

    if (!rows.length || !width) {
      return { head: head, grid: [] };
    }

    var grid = rows.map(function (row) {
      var chars = row.split("");
      while (chars.length < width) chars.push(" ");
      return chars;
    });

    return { head: head, grid: grid };
  }

  function serialize() {
    var output = state.head.slice();
    // Прибираємо хвостові порожні рядки, щоб напрям завжди був перед map:.
    while (output.length && output[output.length - 1] === "") output.pop();
    if (output.length) output.push("");
    output.push("direction:");
    output.push(DIR_NAMES[state.dir]);
    output.push("");
    output.push("skin:");
    output.push(SKINS[state.skin].file);
    if (state.codeLimit) {
      output.push("");
      output.push("codelimit:");
      output.push(String(state.codeLimit));
    }
    output.push("");
    output.push("map:");
    for (var y = 0; y < state.rows; y++) {
      output.push(state.grid[y].join(""));
    }
    return output.join("\n") + "\n";
  }

  function setMap(head, grid, name, dirty) {
    grid = normalizeGrid(grid);
    var direction = extractDirection(head);
    var skin = extractSkin(direction.head);
    var codeLimit = extractCodeLimit(skin.head);
    state.head = codeLimit.head;
    state.dir = direction.dir;
    state.codeLimit = codeLimit.value;
    state.grid = grid;
    state.rows = grid.length;
    state.cols = grid.length ? grid[0].length : 0;
    state.mapName = String(name || "нова-карта.map").split(/[\\/]/).pop();
    state.hover = null;
    state.history = [];
    state.future = [];
    state.dirty = !!dirty;

    // Якщо у файлі немає секції skin:, лишаємо поточний вигляд.
    if (skin.skin) {
      setSkin(skin.skin, { silent: true, markDirty: false });
    }

    resizeCanvas();
    updateCursorInfo();
    updateInfo();
    updateTitle();
    updateStatus();
    updateDirectionUI();
    updateCodeLimitMenu();
    scheduleDraw();
  }

  function loadMapText(text, name) {
    var parsed = parseMapText(text);
    var grid = parsed.grid;
    if (!grid.length) grid = makeBlank(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    setMap(parsed.head, grid, name, false);
  }

  function newMap() {
    if (!confirmDiscard()) return;
    setMap([], makeBlank(DEFAULT_WIDTH, DEFAULT_HEIGHT), "нова-карта.map", true);
    toast("Створено нову карту " + DEFAULT_WIDTH + " × " + DEFAULT_HEIGHT);
  }

  function applyTemplate(key) {
    var match = /^(\d+)x(\d+)$/.exec(String(key));
    if (!match) return;
    var cols = parseInt(match[1], 10);
    var rows = parseInt(match[2], 10);
    if (!confirmDiscard()) return;
    setMap([], makeTemplate(cols, rows), "шаблон-" + cols + "x" + rows + ".map", true);
    toast("Шаблон " + cols + " × " + rows + " блоків");
  }

  function confirmDiscard() {
    if (!state.dirty) return true;
    return global.confirm("Незбережені зміни буде втрачено. Продовжити?");
  }

  function normalizeFileName(value) {
    var name = String(value || "").trim();
    if (!name) return "";
    name = name.replace(/[\\/:*?"<>|]+/g, "-");
    if (!/\.map$/i.test(name)) name += ".map";
    return name;
  }

  /** Ім'я архіву світу: прибирає недопустимі символи та додає .world. */
  function normalizeWorldName(value) {
    var name = String(value || "").trim();
    if (!name) return "";
    name = name.replace(/[\\/:*?"<>|]+/g, "-");
    if (!/\.world$/i.test(name)) name += ".world";
    return name;
  }

  function triggerDownload(blob, name) {
    var url = global.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    global.setTimeout(function () { global.URL.revokeObjectURL(url); }, 1000);
  }

  function downloadMap(name) {
    var text = serialize();
    var blob = new global.Blob([text], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, name);

    state.mapName = name;
    state.dirty = false;
    updateTitle();
    toast("Карту збережено: " + name);
  }

  function readFileText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new global.FileReader();
      reader.onload = function () { resolve(String(reader.result)); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsText(file, "utf-8");
    });
  }

  /** Читає файл як байти, щоб у ZIP потрапила точна копія карти. */
  function readFileBytes(file) {
    return new Promise(function (resolve, reject) {
      var reader = new global.FileReader();
      reader.onload = function () {
        resolve(new Uint8Array(reader.result));
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsArrayBuffer(file);
    });
  }

  function bytesToText(bytes) {
    return new global.TextDecoder("utf-8").decode(bytes);
  }

  // ---- світ (ZIP з картами) ----------------------------------------------

  var crcTable = null;

  function getCrcTable() {
    if (crcTable) return crcTable;
    crcTable = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c >>> 0;
    }
    return crcTable;
  }

  function crc32(bytes) {
    var table = getCrcTable();
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function utf8Bytes(text) {
    return new global.TextEncoder().encode(String(text));
  }

  function pushU16(out, value) {
    out.push(value & 0xff, (value >>> 8) & 0xff);
  }

  function pushU32(out, value) {
    value = value >>> 0;
    out.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff
    );
  }

  function concatBytes(parts) {
    var length = 0;
    var i;
    for (i = 0; i < parts.length; i++) length += parts[i].length;
    var out = new Uint8Array(length);
    var offset = 0;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], offset);
      offset += parts[i].length;
    }
    return out;
  }

  /**
   * Мінімальний ZIP без стиснення (method 0). Для карт цього достатньо,
   * а залежність від сторонньої бібліотеки не потрібна.
   */
  function buildZip(entries) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) |
      Math.floor(now.getSeconds() / 2);
    var dosDate = ((now.getFullYear() - 1980) << 9) |
      ((now.getMonth() + 1) << 5) | now.getDate();

    entries.forEach(function (entry) {
      var nameBytes = utf8Bytes(entry.name);
      var data = entry.data;
      var crc = crc32(data);
      var localOffset = offset;

      var local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20);          // version needed
      pushU16(local, 0x0800);      // UTF-8 names
      pushU16(local, 0);           // stored, no compression
      pushU16(local, dosTime);
      pushU16(local, dosDate);
      pushU32(local, crc);
      pushU32(local, data.length);
      pushU32(local, data.length);
      pushU16(local, nameBytes.length);
      pushU16(local, 0);           // extra length
      var localHeader = new Uint8Array(local);

      localParts.push(localHeader, nameBytes, data);
      offset += localHeader.length + nameBytes.length + data.length;

      var central = [];
      pushU32(central, 0x02014b50);
      pushU16(central, 20);        // version made by
      pushU16(central, 20);        // version needed
      pushU16(central, 0x0800);
      pushU16(central, 0);
      pushU16(central, dosTime);
      pushU16(central, dosDate);
      pushU32(central, crc);
      pushU32(central, data.length);
      pushU32(central, data.length);
      pushU16(central, nameBytes.length);
      pushU16(central, 0);         // extra
      pushU16(central, 0);         // comment
      pushU16(central, 0);         // disk
      pushU16(central, 0);         // internal attributes
      pushU32(central, 0);         // external attributes
      pushU32(central, localOffset);
      var centralHeader = new Uint8Array(central);

      centralParts.push(centralHeader, nameBytes);
    });

    var centralSize = 0;
    for (var i = 0; i < centralParts.length; i++) {
      centralSize += centralParts[i].length;
    }

    var end = [];
    pushU32(end, 0x06054b50);
    pushU16(end, 0);               // disk number
    pushU16(end, 0);               // central directory disk
    pushU16(end, entries.length);
    pushU16(end, entries.length);
    pushU32(end, centralSize);
    pushU32(end, offset);
    pushU16(end, 0);               // comment length

    return concatBytes(localParts.concat(centralParts, [new Uint8Array(end)]));
  }

  /** Пакує вибрані карти та maps.json у ZIP-архів світу. */
  function buildWorldZip(maps) {
    var names = [];
    var entries = maps.map(function (map) {
      names.push(map.name);
      return {
        name: map.name,
        data: map.bytes ? map.bytes : utf8Bytes(map.text),
      };
    });
    entries.push({
      name: "maps.json",
      data: utf8Bytes(JSON.stringify(names, null, 2) + "\n"),
    });
    return buildZip(entries);
  }

  /** Повертає текст помилки для файлу карти або порожній рядок. */
  function validateMapFile(name, text) {
    if (!/\.map$/i.test(String(name || ""))) return "файл не має розширення .map";

    var lines = String(text).replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
    var hasMapSection = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("map:") === 0) {
        hasMapSection = true;
        break;
      }
    }
    if (!hasMapSection) return "немає секції map:";

    var parsed = parseMapText(text);
    if (!parsed.grid.length) return "порожня карта";

    for (var y = 0; y < parsed.grid.length; y++) {
      for (var x = 0; x < parsed.grid[y].length; x++) {
        var ch = parsed.grid[y][x];
        if (ch === " " || ch === "@" || ch === "*" ||
            (ch >= "A" && ch <= "Z")) continue;
        return "недопустимий символ «" + ch + "»";
      }
    }
    return "";
  }

  function discoverMaps() {
    if (state.mapNumbers) return Promise.resolve(state.mapNumbers);
    if (state.mapDiscovery) return state.mapDiscovery;

    var probes = [];
    for (var n = 1; n <= MAP_PROBE_LIMIT; n++) {
      probes.push(
        global.fetch(MAPS_DIR + "map" + n + ".map", { method: "HEAD" })
          .then(function (response) { return response.ok; })
          .catch(function () { return false; })
      );
    }

    state.mapDiscovery = Promise.all(probes).then(function (flags) {
      var numbers = [];
      flags.forEach(function (ok, index) {
        if (ok) numbers.push(index + 1);
      });
      state.mapNumbers = numbers;
      state.mapDiscovery = null;
      return numbers;
    });

    return state.mapDiscovery;
  }

  function openServerMap(number) {
    if (!confirmDiscard()) return;
    closeModal();
    global.fetch(MAPS_DIR + "map" + number + ".map")
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (text) {
        loadMapText(text, "map" + number + ".map");
        toast("Карту map" + number + ".map завантажено");
      })
      .catch(function (error) {
        toast("Не вдалося завантажити карту: " + error.message, true);
      });
  }

  // ---- назви та статус ---------------------------------------------------

  function updateTitle() {
    var mark = state.dirty ? "● " : "";
    el.docName.textContent = mark + state.mapName;
    el.docName.classList.toggle("dirty", state.dirty);
    el.docName.title = state.mapName;
    document.title = mark + "Редактор карт — " + state.mapName;
  }

  function updateInfo() {
    el.sizeInfo.textContent = state.cols + " × " + state.rows + " блоків";
    if (el.codeInfo) {
      el.codeInfo.textContent = "Код: " + codeLimitLabel(state.codeLimit);
      el.codeInfo.title = state.codeLimit
        ? "Допустимо рядків коду: " + state.codeLimit
        : "Кількість рядків коду не обмежена";
    }
  }

  function updateStatus() {
    var direction = " Напрям робота: " +
      (DIR_LABELS[DIR_NAMES[state.dir]] || DIR_NAMES[state.dir]) + ".";
    if (state.selected === "delete") {
      el.status.textContent =
        "Режим видалення: клікніть по блоку на карті, щоб прибрати його." +
        direction;
    } else if (state.selected) {
      el.status.textContent = "Обрано: " + blockLabel(state.selected) +
        ". Клікніть на карті, щоб поставити блок." + direction;
    } else {
      el.status.textContent = "Виберіть блок на панелі ліворуч." + direction;
    }
  }

  // ---- меню --------------------------------------------------------------

  function closeMenus() {
    var menus = document.querySelectorAll(".menu.open");
    for (var i = 0; i < menus.length; i++) menus[i].classList.remove("open");
  }

  function anyMenuOpen() {
    return !!document.querySelector(".menu.open");
  }

  function runAction(name) {
    if (name === "new") newMap();
    else if (name === "open") openMapDialog();
    else if (name === "save") openSaveDialog();
    else if (name === "world") openWorldDialog();
    else if (name === "help") showHelp();
  }

  function bindMenus() {
    var titles = document.querySelectorAll(".menu > .menu-title");
    for (var i = 0; i < titles.length; i++) {
      (function (title) {
        var menu = title.parentNode;
        title.addEventListener("click", function (event) {
          event.stopPropagation();
          var wasOpen = menu.classList.contains("open");
          closeMenus();
          if (!wasOpen) menu.classList.add("open");
        });
        title.addEventListener("mouseenter", function () {
          if (anyMenuOpen() && !menu.classList.contains("open")) {
            closeMenus();
            menu.classList.add("open");
          }
        });
      })(titles[i]);
    }

    var standalone = document.querySelector(".menu-title.standalone[data-action]");
    if (standalone) {
      standalone.addEventListener("click", function (event) {
        event.stopPropagation();
        closeMenus();
        runAction(standalone.getAttribute("data-action"));
      });
    }

    var items = document.querySelectorAll(".menu-item");
    for (var j = 0; j < items.length; j++) {
      (function (item) {
        item.addEventListener("click", function () {
          closeMenus();
          if (item.hasAttribute("data-action")) {
            runAction(item.getAttribute("data-action"));
          } else if (item.hasAttribute("data-template")) {
            applyTemplate(item.getAttribute("data-template"));
          } else if (item.hasAttribute("data-skin")) {
            setSkin(item.getAttribute("data-skin"));
          } else if (item.hasAttribute("data-codelimit")) {
            setCodeLimit(item.getAttribute("data-codelimit"));
          } else if (item.hasAttribute("data-codelimit-custom")) {
            openCodeLimitDialog();
          }
        });
      })(items[j]);
    }

    document.addEventListener("click", function () {
      closeMenus();
    });
  }

  // ---- модальні вікна ----------------------------------------------------

  function closeModal() {
    worldDialog = null;
    if (!modal) return;
    if (modal.overlay.parentNode) modal.overlay.parentNode.removeChild(modal.overlay);
    modal = null;
  }

  function showModal(options) {
    closeModal();

    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    var dialog = document.createElement("div");
    dialog.className = "modal";

    var head = document.createElement("div");
    head.className = "modal-head";

    var title = document.createElement("h2");
    title.textContent = options.title || "";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "modal-close";
    close.innerHTML = "&times;";
    close.title = "Закрити";
    close.addEventListener("click", closeModal);

    head.appendChild(title);
    head.appendChild(close);

    var body = document.createElement("div");
    body.className = "modal-body";
    if (typeof options.body === "string") {
      body.innerHTML = options.body;
    } else if (options.body) {
      body.appendChild(options.body);
    }

    dialog.appendChild(head);
    dialog.appendChild(body);

    if (options.actions && options.actions.length) {
      var footer = document.createElement("div");
      footer.className = "modal-actions";
      options.actions.forEach(function (action) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn" + (action.primary ? " primary" : "") +
          (action.danger ? " danger" : "");
        button.textContent = action.label;
        button.addEventListener("click", function () {
          var keepOpen = action.onClick ? action.onClick() : false;
          if (!keepOpen) closeModal();
        });
        footer.appendChild(button);
      });
      dialog.appendChild(footer);
    }

    overlay.appendChild(dialog);
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) closeModal();
    });
    el.modalRoot.appendChild(overlay);
    modal = { overlay: overlay, dialog: dialog };

    global.setTimeout(function () {
      var focus = dialog.querySelector("input[type=text], input, button.primary");
      if (focus) focus.focus();
    }, 0);

    return dialog;
  }

  function openCodeLimitDialog() {
    var body = document.createElement("div");
    body.innerHTML =
      "<p>Скільки рядків коду можна використати для розв'язання завдання " +
      "з Роботом?</p>" +
      '<div class="field">' +
      '<label for="codelimit-input">Кількість рядків ' +
      "(порожнє поле — без обмеження)</label>" +
      '<input type="text" id="codelimit-input" inputmode="numeric" ' +
      'autocomplete="off" value="' + (state.codeLimit || "") + '">' +
      "</div>" +
      '<p class="field-note">Значення зберігається у файлі карти секцією ' +
      "<code>codelimit:</code>. Якщо обмеження не задано, секція не " +
      "записується.</p>";

    var dialog = showModal({
      title: "Обмеження коду",
      body: body,
      actions: [
        { label: "Скасувати" },
        {
          label: "Застосувати",
          primary: true,
          onClick: function () {
            var input = dialog.querySelector("#codelimit-input");
            var text = String(input.value || "").trim();
            if (!text) {
              setCodeLimit(null);
              return false;
            }
            if (!/^\d+$/.test(text) || parseInt(text, 10) <= 0) {
              toast("Вкажіть додатне число рядків або залиште поле порожнім", true);
              input.focus();
              input.select();
              return true;
            }
            setCodeLimit(text);
            return false;
          },
        },
      ],
    });

    var input = dialog.querySelector("#codelimit-input");
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      var apply = dialog.querySelector(".modal-actions .btn.primary");
      if (apply) apply.click();
    });
  }

  function renderMapList(container, numbers) {
    container.innerHTML = "";
    if (!numbers.length) {
      container.innerHTML =
        '<span class="map-list-note">Карт не знайдено. Якщо сторінку відкрито ' +
        'не через веб-сервер, скористайтеся вибором файлу.</span>';
      return;
    }

    numbers.forEach(function (number) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "map-chip";
      button.textContent = "map" + number;
      button.title = "Відкрити maps/map" + number + ".map";
      button.addEventListener("click", function () { openServerMap(number); });
      container.appendChild(button);
    });
  }

  function openMapDialog() {
    var body = document.createElement("div");
    body.innerHTML =
      "<p>Виберіть файл <code>.map</code> на комп'ютері або карту з теки " +
      "<code>maps/</code> застосунку.</p>" +
      '<button type="button" class="btn primary" id="modal-open-file">' +
      "Вибрати файл .map…</button>" +
      '<div class="section-title">Карти застосунку</div>' +
      '<div class="map-list" id="modal-map-list">' +
      '<span class="map-list-note">Пошук карт…</span></div>';

    var dialog = showModal({
      title: "Отримати карту",
      body: body,
      actions: [{ label: "Скасувати" }],
    });

    body.querySelector("#modal-open-file").addEventListener("click", function () {
      el.fileInput.click();
    });

    var list = dialog.querySelector("#modal-map-list");
    discoverMaps().then(function (numbers) {
      if (!document.body.contains(body)) return;
      renderMapList(list, numbers);
    }).catch(function () {
      if (!document.body.contains(body)) return;
      renderMapList(list, []);
    });
  }

  function openSaveDialog() {
    var body = document.createElement("div");
    body.innerHTML =
      '<div class="field"><label for="save-name">Назва файлу</label>' +
      '<input type="text" id="save-name" spellcheck="false"></div>' +
      '<p class="map-list-note" style="margin-top:10px">Файл буде завантажено ' +
      'у теку завантажень. Щоб карта з\'явилася в застосунку, покладіть її ' +
      'у теку <code>maps/</code>.</p>';

    var input = body.querySelector("#save-name");
    input.value = state.mapName;

    function save() {
      var name = normalizeFileName(input.value);
      if (!name) {
        input.focus();
        return true;
      }
      downloadMap(name);
      return false;
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!save()) closeModal();
      }
    });

    showModal({
      title: "Зберегти карту",
      body: body,
      actions: [
        { label: "Скасувати" },
        { label: "Зберегти", primary: true, onClick: save },
      ],
    });
  }

  // ---- вікно створення світу --------------------------------------------

  function setWorldMessage(text, isError) {
    if (!worldDialog) return;
    worldDialog.message.textContent = text || "";
    worldDialog.message.classList.toggle("error", !!isError);
  }

  function renderWorldList() {
    if (!worldDialog) return;
    var list = worldDialog.list;
    list.innerHTML = "";

    if (!worldDialog.maps.length) {
      var empty = document.createElement("p");
      empty.className = "world-empty";
      empty.textContent = "Список порожній. Натисніть «Додати карту».";
      list.appendChild(empty);
      return;
    }

    worldDialog.maps.forEach(function (map, index) {
      var row = document.createElement("div");
      row.className = "world-map-row";

      var info = document.createElement("div");
      info.className = "world-map-info";

      var name = document.createElement("span");
      name.className = "world-map-name";
      name.textContent = map.name;

      var meta = document.createElement("span");
      meta.className = "world-map-meta";
      meta.textContent = map.cols + " × " + map.rows + " блоків";

      info.appendChild(name);
      info.appendChild(meta);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn world-remove";
      remove.textContent = "Видалити";
      remove.title = "Прибрати " + map.name + " зі списку";
      remove.addEventListener("click", function () {
        if (!worldDialog) return;
        worldDialog.maps.splice(index, 1);
        setWorldMessage("");
        renderWorldList();
      });

      row.appendChild(info);
      row.appendChild(remove);
      list.appendChild(row);
    });
  }

  function addWorldFiles(files) {
    if (!worldDialog || !files || !files.length) return;

    var existing = {};
    worldDialog.maps.forEach(function (map) {
      existing[map.name.toLowerCase()] = true;
    });

    var readers = [];
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        readers.push(
          readFileBytes(file)
            .then(function (bytes) { return { file: file, bytes: bytes }; })
            .catch(function (error) { return { file: file, error: error }; })
        );
      })(files[i]);
    }

    setWorldMessage("Читання файлів…");
    Promise.all(readers).then(function (results) {
      if (!worldDialog) return;

      var added = 0;
      var rejected = [];

      results.forEach(function (result) {
        var fileName = result.file.name;
        if (result.error) {
          rejected.push(fileName + " — не вдалося прочитати");
          return;
        }

        var text = bytesToText(result.bytes);
        var error = validateMapFile(fileName, text);
        if (error) {
          rejected.push(fileName + " — " + error);
          return;
        }

        var key = fileName.toLowerCase();
        if (existing[key]) {
          rejected.push(fileName + " — вже є у списку");
          return;
        }

        var parsed = parseMapText(text);
        existing[key] = true;
        worldDialog.maps.push({
          name: fileName,
          bytes: result.bytes,
          cols: parsed.grid.length ? parsed.grid[0].length : 0,
          rows: parsed.grid.length,
        });
        added++;
      });

      renderWorldList();

      if (rejected.length) {
        setWorldMessage(
          (added ? "Додано карт: " + added + ". " : "") +
          "Пропущено: " + rejected.join("; "),
          true
        );
      } else if (added) {
        setWorldMessage("Додано карт: " + added + ".", false);
      }
    });
  }

  function openWorldDialog() {
    var body = document.createElement("div");
    body.innerHTML =
      "<p>Світ — це ZIP-архів із картами та файлом <code>maps.json</code>, " +
      "який містить перелік цих карт.</p>" +
      '<div class="field"><label for="world-name">Назва світу</label>' +
      '<input type="text" id="world-name" spellcheck="false" value="новий-світ.world"></div>' +
      '<div class="world-toolbar">' +
      '<button type="button" class="btn" id="world-add-map">Додати карту</button>' +
      '<span class="world-hint">Можна вибрати кілька файлів одразу.</span>' +
      "</div>" +
      '<div class="world-list" id="world-list"></div>' +
      '<p class="world-message" id="world-message"></p>';

    var nameInput = body.querySelector("#world-name");
    var list = body.querySelector("#world-list");
    var message = body.querySelector("#world-message");

    function createWorld() {
      if (!worldDialog) return false;

      var name = normalizeWorldName(worldDialog.nameInput.value);
      if (!name) {
        worldDialog.nameInput.focus();
        setWorldMessage("Вкажіть назву світу.", true);
        return true;
      }

      if (!worldDialog.maps.length) {
        setWorldMessage("Додайте хоча б одну карту.", true);
        return true;
      }

      var bytes = buildWorldZip(worldDialog.maps);
      var blob = new global.Blob([bytes], { type: "application/zip" });
      triggerDownload(blob, name);
      toast("Світ збережено: " + name + " (карт: " + worldDialog.maps.length + ")");
      return false;
    }

    showModal({
      title: "Створити світ",
      body: body,
      actions: [
        { label: "Скасувати" },
        { label: "Створити світ", primary: true, onClick: createWorld },
      ],
    });

    worldDialog = {
      maps: [],
      list: list,
      message: message,
      nameInput: nameInput,
    };

    body.querySelector("#world-add-map").addEventListener("click", function () {
      el.worldFileInput.click();
    });

    renderWorldList();
  }

  function showHelp() {
    var body =
      '<p>Редактор створює карти у форматі <code>.map</code> для застосунку ' +
      "WebRobot.</p>" +

      '<div class="section-title">Меню «Файл»</div>' +
      '<ul class="help-list">' +
      "<li><b>Нова карта</b> — порожнє поле 16 × 11.</li>" +
      "<li><b>Отримати карту</b> — відкрити файл з комп'ютера або карту з " +
      "теки <code>maps/</code>.</li>" +
      "<li><b>Зберегти карту</b> — завантажити файл <code>.map</code>.</li>" +
      "<li><b>Створити світ</b> — зібрати одну або кілька карт у ZIP-архів " +
      "<code>.world</code> разом із переліком <code>maps.json</code>.</li>" +
      "<li><b>Шаблон</b> — готова рамка розміром 16 × 11, 16 × 16, " +
      "18 × 16 або 18 × 18 блоків.</li>" +
      "</ul>" +

      '<div class="section-title">Створити світ</div>' +
      "<p>У вікні створення світу натисніть <b>«Додати карту»</b> і виберіть " +
      "один або кілька файлів <code>.map</code>. Коректні карти з'являться у " +
      "списку; їх можна видаляти. Потім вкажіть назву світу та натисніть " +
      "<b>«Створити світ»</b>.</p>" +
      "<p>Архів <code>.world</code> містить вибрані карти та файл " +
      "<code>maps.json</code> з їхнім переліком.</p>" +

      '<div class="section-title">Меню «Вигляд»</div>' +
      "<p>Перемикає набір зображень: <b>metal</b> (типовий), <b>grass</b>, " +
      "<b>desert</b>, <b>lego</b>, <b>star</b>. Панель блоків показує лише ті " +
      "блоки, які є в обраному скіні.</p>" +

      '<div class="section-title">Панель блоків</div>' +
      "<p><code>@</code> — старт робота, <code>*</code> — Energon, " +
      "<code>A</code>…<code>Z</code> — блоки-перешкоди. Виберіть блок кліком; " +
      "він підсвітиться рамкою, а його зображення рухатиметься за курсором по " +
      "клітинках. Клік по карті ставить блок.</p>" +
      "<p>Блоки малюються в натуральному розмірі <b>225 × 225 px</b> із кроком " +
      "сітки <b>200 × 200 px</b> — так само, як у застосунку, тому сусідні " +
      "блоки трохи перекриваються.</p>" +
      "<p>Блок <b>«Видалити»</b> прибирає блок із клітинки. Те саме робить " +
      "правий клік по карті.</p>" +

      '<div class="section-title">Робот і напрям</div>' +
      "<p>Стартова клітинка <code>@</code> малюється зображенням " +
      "<code>img/robot.png</code>. Кнопки зі стрілками над панеллю блоків " +
      "повертають робота на 90° ліворуч або праворуч; мініатюра «Старт» і " +
      "робот на карті показують поточний напрям.</p>" +
      "<p>Напрям записується у файл карти двома рядками перед " +
      "<code>map:</code>:</p>" +
      "<p><code>direction:</code><br><code>north</code></p>" +
      "<p><code>north</code> — вгору (за замовчуванням), <code>east</code> — " +
      "праворуч, <code>south</code> — вниз, <code>west</code> — ліворуч.</p>" +

      '<div class="section-title">Дизайн карти</div>' +
      "<p>Вигляд карти зберігається у файлі секцією <code>skin:</code>:</p>" +
      "<p><code>skin:</code><br><code>default</code></p>" +
      "<p>Доступні значення: <code>default</code>, <code>grass</code>, " +
      "<code>dessert</code>, <code>lego</code>, <code>starmind</code>. " +
      "Поточний дизайн можна змінити в меню «Вигляд».</p>" +

      '<div class="section-title">Обмеження коду</div>' +
      "<p>Меню <b>«Обмеження»</b> задає, скільки рядків коду дозволено для " +
      "розв'язання завдання з Роботом. Типово кількість не обмежена; її " +
      "показано в заголовку панелі редактора поруч із розміром карти.</p>" +
      "<p>Якщо обмеження задано, воно зберігається у файлі карти:</p>" +
      "<p><code>codelimit:</code><br><code>43</code></p>" +
      "<p>Коли карту завантажено в ЄPython, редактор коду не дозволяє " +
      "перевищити цю кількість рядків. Без обмеження секція " +
      "<code>codelimit:</code> у файл не записується.</p>" +

      '<div class="section-title">Клавіші</div>' +
      "<ul class=\"help-list\">" +
      "<li><kbd>Ctrl</kbd>+<kbd>Z</kbd> — скасувати дію.</li>" +
      "<li><kbd>Ctrl</kbd>+<kbd>Y</kbd> або <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+" +
      "<kbd>Z</kbd> — повторити дію.</li>" +
      "<li><kbd>Ctrl</kbd>+<kbd>S</kbd> — зберегти карту.</li>" +
      "<li><kbd>Esc</kbd> — зняти виділення або закрити вікно.</li>" +
      "</ul>" +

      '<div class="section-title">Для застосунку</div>' +
      "<p>Покладіть збережений файл у теку <code>maps/</code> (наприклад, " +
      "<code>map28.map</code>) — після оновлення сторінки він з'явиться у " +
      "вікні вибору карт.</p>";

    showModal({
      title: "Довідка",
      body: body,
      actions: [{ label: "Закрити", primary: true }],
    });
  }

  // ---- події -------------------------------------------------------------

  function bindCanvas() {
    el.canvas.addEventListener("mousemove", function (event) {
      var pos = eventToCell(event);
      var same = (pos === null && state.hover === null) ||
        (pos && state.hover && pos.x === state.hover.x && pos.y === state.hover.y);
      if (!same) {
        state.hover = pos;
        updateCursorInfo();
        scheduleDraw();
      }

      if (mouseDown && pos) {
        if (state.selected === "delete") eraseAt(pos.x, pos.y);
        else if (state.selected) placeAt(pos.x, pos.y);
      }
    });

    el.canvas.addEventListener("mouseleave", function () {
      state.hover = null;
      updateCursorInfo();
      scheduleDraw();
    });

    el.canvas.addEventListener("mousedown", function (event) {
      var pos = eventToCell(event);
      if (event.button === 0) {
        mouseDown = true;
        if (pos) {
          if (state.selected === "delete") eraseAt(pos.x, pos.y);
          else if (state.selected) placeAt(pos.x, pos.y);
        }
        event.preventDefault();
      } else if (event.button === 2) {
        if (pos) eraseAt(pos.x, pos.y);
        event.preventDefault();
      }
    });

    global.addEventListener("mouseup", function () { mouseDown = false; });
    global.addEventListener("blur", function () { mouseDown = false; });

    el.canvas.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
  }

  function bindEvents() {
    bindMenus();
    bindCanvas();

    el.rotateLeft.addEventListener("click", function () { rotateRobot(-1); });
    el.rotateRight.addEventListener("click", function () { rotateRobot(1); });

    el.deleteBlock.addEventListener("click", function () {
      selectBlock("delete");
    });

    el.fileInput.addEventListener("change", function () {
      var file = this.files && this.files[0];
      this.value = "";
      if (!file) return;
      if (!confirmDiscard()) return;
      readFileText(file)
        .then(function (text) {
          closeModal();
          loadMapText(text, file.name);
          toast("Карту завантажено: " + file.name);
        })
        .catch(function (error) {
          toast("Не вдалося прочитати файл: " + error, true);
        });
    });

    el.worldFileInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(this.files || []);
      this.value = "";
      if (!files.length) return;
      addWorldFiles(files);
    });

    global.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (modal) {
          closeModal();
          return;
        }
        closeMenus();
        state.selected = null;
        updatePaletteSelection();
        updateStatus();
        scheduleDraw();
        return;
      }

      var target = event.target;
      var tag = (target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;

      if (event.ctrlKey || event.metaKey) {
        var key = String(event.key).toLowerCase();
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        } else if (key === "y") {
          event.preventDefault();
          redo();
        } else if (key === "s") {
          event.preventDefault();
          openSaveDialog();
        }
      }
    });

    global.addEventListener("resize", scheduleResize);

    if (global.ResizeObserver) {
      var observer = new global.ResizeObserver(scheduleResize);
      observer.observe(el.canvasWrap);
    }

    var appLink = document.querySelector(".app-link");
    if (appLink) {
      appLink.addEventListener("click", function (event) {
        event.preventDefault();
        goToApp(appLink.getAttribute("href") || "runide.html");
      });
    }

    global.addEventListener("beforeunload", function (event) {
      // Карту передано в застосунок — попередження про незбережене не потрібне.
      if (state.leavingToApp || !state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  // ---- обмін картою із застосунком (runide.html) --------------------------

  var HANDOFF_TO_EDITOR = "robot.handoff.toEditor";
  var HANDOFF_TO_APP = "robot.handoff.toApp";
  var HANDOFF_TTL = 60000;   // мс; старіші передачі ігноруємо
  var ACK_TIMEOUT = 400;     // мс очікування відповіді відкритого застосунку

  /** Читає й одразу видаляє карту, передану із застосунку. */
  function takeAppMap() {
    try {
      var raw = global.localStorage.getItem(HANDOFF_TO_EDITOR);
      if (!raw) return null;
      global.localStorage.removeItem(HANDOFF_TO_EDITOR);
      var data = JSON.parse(raw);
      if (!data || typeof data.text !== "string") return null;
      if (Date.now() - data.ts > HANDOFF_TTL) return null;
      return { name: data.name || "map.map", text: data.text, skin: data.skin };
    } catch (e) {
      return null;
    }
  }

  /**
   * «До застосунку»: передає поточну (навіть незбережену) карту в застосунок
   * «Робот». Якщо застосунок уже відкрито в іншій вкладці — карта завантажується
   * там, а ця вкладка закривається; інакше відбувається перехід на runide.html.
   */
  function goToApp(url) {
    var payload = { name: state.mapName, text: serialize() };
    try {
      global.localStorage.setItem(HANDOFF_TO_APP,
        JSON.stringify({ name: payload.name, text: payload.text, ts: Date.now() }));
    } catch (e) { /* ignore */ }

    function navigate() {
      state.leavingToApp = true;
      global.location.href = url;
    }

    if (typeof global.BroadcastChannel !== "function") { navigate(); return; }

    var channel = new global.BroadcastChannel("robot-maps");
    var answered = false;
    channel.onmessage = function (event) {
      if (answered || !event.data || event.data.type !== "ack") return;
      answered = true;
      channel.close();
      state.leavingToApp = true;
      global.close();   // спрацює, якщо вкладку відкрив сам застосунок
      global.setTimeout(function () {
        state.leavingToApp = false;
        toast("Карту передано в застосунок. Цю вкладку можна закрити.");
      }, 300);
    };
    channel.postMessage({ type: "open-map", name: payload.name, text: payload.text });
    global.setTimeout(function () {
      if (answered) return;
      answered = true;
      channel.close();
      navigate();
    }, ACK_TIMEOUT);
  }

  // ---- запуск ------------------------------------------------------------

  function init() {
    el.menuBar = document.getElementById("menu-bar");
    el.blockList = document.getElementById("block-list");
    el.paletteSkin = document.getElementById("palette-skin");
    el.rotateLeft = document.getElementById("rotate-left");
    el.rotateRight = document.getElementById("rotate-right");
    el.directionName = document.getElementById("direction-name");
    el.directionPreview = document.getElementById("direction-preview");
    el.deleteBlock = document.getElementById("delete-block");
    el.canvasWrap = document.getElementById("canvas-wrap");
    el.canvas = document.getElementById("map-canvas");
    el.cursorInfo = document.getElementById("cursor-info");
    el.sizeInfo = document.getElementById("size-info");
    el.codeInfo = document.getElementById("code-info");
    el.status = document.getElementById("editor-status");
    el.docName = document.getElementById("doc-name");
    el.fileInput = document.getElementById("file-input");
    el.worldFileInput = document.getElementById("world-file-input");
    el.modalRoot = document.getElementById("modal-root");

    var savedSkin = readStorage("mapEditor.skin");
    if (savedSkin && SKINS[savedSkin]) state.skin = savedSkin;

    bindEvents();
    updateSkinMenu();
    setMap([], makeTemplate(DEFAULT_WIDTH, DEFAULT_HEIGHT), "нова-карта.map", false);
    var fromApp = takeAppMap();
    if (fromApp) {
      loadMapText(fromApp.text, fromApp.name);
      // Скін, який зараз вибрано в застосунку, переходить у редактор.
      if (fromApp.skin && SKINS[fromApp.skin]) {
        setSkin(fromApp.skin, { silent: true, markDirty: false });
      }
    }
    loadSkinManifest().then(refreshPalette);
  }

  // Невеликий API для перевірок із консолі.
  global.RMEditor = {
    state: state,
    serialize: serialize,
    loadMapText: loadMapText,
    applyTemplate: applyTemplate,
    selectBlock: selectBlock,
    setSkin: setSkin,
    setCodeLimit: setCodeLimit,
    rotateRobot: rotateRobot,
    placeAt: placeAt,
    eraseAt: eraseAt,
    undo: undo,
    redo: redo,
    newMap: newMap,
    buildWorldZip: buildWorldZip,
    validateMapFile: validateMapFile,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
