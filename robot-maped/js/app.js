/*
 * app.js — інтерфейс.
 *
 * Головне вікно: редактор програми (Python), консоль виводу, списки карт
 * і прикладів. Поле з роботом відкривається в окремому вікні 800×600
 * (map.html).
 *
 * Програма виконується рушієм Skulpt; можливості робота доступні через
 * окремий модуль `robot` (web/robot/robot.py, міст до моделі світу —
 * web/robot/_robot.js).
 */

(function (global) {
  "use strict";

  var RM = global.RMApp = global.RMApp || {};
  var F = RM.files;

  // Шляхи — відносно index.html (а не відносно js/app.js!).
  // web-robot/
  //   runide.html
  //   js/      (app.js, world.js, render.js, files.js)
  //   robot/   (robot.py, _robot.js)
  //   skins/   (skins.json, dessertSkin/, ...)
  //   maps/    (map1.map, map2.map, ...)
  var MAPS_DIR = "maps/";
  var SKINS_DIR = "skins/";
  var ROBOT_DIR = "robot/";

  // Швидкість анімації: рівень 0–10 (0 — найповільніше, 10 — найшвидше).
  // З рівня обчислюються затримки: між клітинками руху та на кожну фазу
  // роботи лапки (висунути / схопити / повернути).
  var SPEED_PRESETS = { slow: 2, normal: 5, fast: 8 };
  var speedLevel = 5;

  /** Затримки (мс) для рівня швидкості 0–10. */
  function speedDelays(v) {
    var step = 40 + Math.round(4.6 * (10 - v) * (10 - v));
    return { step: step, grip: step * 3 };
  }

  var SPEED = speedDelays(speedLevel);   // { step, grip } — поточні затримки

  /** Встановлює рівень швидкості (0–10) і перераховує затримки. */
  function setSpeedLevel(v) {
    v = Math.round(Number(v));
    if (!isFinite(v)) v = 5;
    speedLevel = Math.max(0, Math.min(10, v));
    SPEED = speedDelays(speedLevel);
    return speedLevel;
  }

  var PROGRAM_NAME = "program";   // ім'я модуля для Skulpt (без розширення!)

  var state = {
    world: null,
    renderer: null,
    congratsShown: false,
    panelMoved: false,
    running: false,
    mode: "idle",            // "run" | "step"
    stepWaiters: [],
    mapName: "map1.map",
    mapText: "",
    mapNumbers: [],      // числа наявних карт map1..mapN (визначаються опитуванням)
    pickerStart: 0,      // перший номер у вікні вибору карт (вікно зсунути стрілками)
    skins: {},
    robotPy: null,
    robotJs: null,
    alive: false,        // програма ще не завершилася (Skulpt-проміс не розв'язано)
    pendingStart: null,  // режим запуску, відкладеного до завершення попередньої програми
    timers: [],          // активні таймери пауз: { id, resolve }
    mapWindowOpen: true, // чи відкрите вікно карти
    codeLimit: null,     // допустима кількість рядків коду (секція codelimit: карти)
    mapSkin: null,       // скін, заданий картою (секція skin:)
  };

  // Значення секції skin: у файлі карти → назви скінів застосунку.
  var SKIN_BY_FILE = {
    "default": "defaultSkin",
    grass: "grassSkin",
    dessert: "dessertSkin",
    lego: "legoSkin",
    starmind: "starMindSkin",
  };

  /** Перше непорожнє значення після заголовка секції ("skin:", "codelimit:"). */
  function mapSectionValue(text, name) {
    var lines = String(text).split(/\r\n|\r|\n/);
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf("map:") === 0) break;   // далі — сітка карти
      if (lines[i].indexOf(name) !== 0) continue;
      var inline = lines[i].slice(name.length).trim();
      if (inline) return inline;
      for (var j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) return lines[j].trim();
      }
    }
    return null;
  }

  /** Скін та обмеження коду, задані в карті. */
  function parseMapMeta(text) {
    var skinValue = mapSectionValue(text, "skin:");
    var skin = skinValue && SKIN_BY_FILE.hasOwnProperty(skinValue.toLowerCase())
      ? SKIN_BY_FILE[skinValue.toLowerCase()] : null;
    var limitValue = mapSectionValue(text, "codelimit:");
    var limit = limitValue && /^\d+$/.test(limitValue) ? parseInt(limitValue, 10) : 0;
    return { skin: skin, codeLimit: limit > 0 ? limit : null };
  }

  /** Кількість рядків коду (порожні рядки в кінці не рахуються). */
  function countCodeLines(text) {
    var lines = String(text).split("\n");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines.length;
  }

  function codeLinesWord(n) {
    var lastTwo = n % 100, last = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "рядків";
    if (last === 1) return "рядок";
    if (last >= 2 && last <= 4) return "рядки";
    return "рядків";
  }

  /** Показує обмеження коду в заголовку панелі програми. */
  function updateCodeInfo() {
    var limit = state.codeLimit;
    el.codeLimit.hidden = !limit;
    if (!limit) return;
    var used = countCodeLines(el.editor.value);
    el.codeLimit.textContent = "Рядків: " + used + " з " + limit;
    el.codeLimit.className = used > limit ? "status error" : "status";
    el.codeLimit.title = "Карта дозволяє не більше " + limit + " " + codeLinesWord(limit) + " коду";
  }

  /** Не дає перевищити обмеження: зайві рядки, що з'явилися при вводі, відкидаються. */
  function enforceCodeLimit() {
    var limit = state.codeLimit;
    // Рядків у полі не більше за ліміт: нижче червоного рядка «кінець коду» писати не можна.
    if (limit && el.editor.value.split("\n").length > limit) {
      el.editor.value = el.editor.value.split("\n").slice(0, limit).join("\n");
    }
    updateCodeInfo();
  }

  var el = {};

  // ---- ініціалізація ---------------------------------------------------

  function init() {
    RM.createMapWindow();

    el.editor = document.getElementById("editor");
    el.highlight = document.getElementById("highlight");
    el.status = document.getElementById("status");
    el.codeLimit = document.getElementById("code-limit");
    el.console = document.getElementById("console");
    el.run = document.getElementById("btn-run");
    el.stop = document.getElementById("btn-stop");
    el.step = document.getElementById("btn-step");
    el.reset = document.getElementById("btn-reset");
    el.loadMap = document.getElementById("file-map");
    el.skin = document.getElementById("skin");
    el.speed = document.getElementById("speed");
    el.mapPanel = document.getElementById("map-panel");
    el.mapHead = document.getElementById("map-panel-head");
    el.mapClose = document.getElementById("btn-map-close");
    el.mapPages = document.getElementById("map-pages");
    el.mapPrev = document.getElementById("map-prev");
    el.mapNext = document.getElementById("map-next");
    el.canvas = document.getElementById("field");
    el.congrats = document.getElementById("congrats");
    el.congratsOk = document.getElementById("btn-congrats-ok");

    state.renderer = new RM.Renderer(el.canvas, skinPath("dessertSkin"), {
      files: [],
      wrap: document.getElementById("field-wrap"),
      sizer: document.getElementById("field-sizer"),
    }).preload();

    configureSkulpt();
    bindEvents();
    centerPanel();
    openMapWindow();
    startAnimation();
    syncEditorSize();
    loadSkins();
    openMapWindow();
    var wanted = mapFromHash();
    var handed = readHandoff(HANDOFF_TO_APP);   // карта, передана з редактора
    if (handed) {
      state.mapName = handed.name;
      applyMap(handed.text);
    } else {
      loadMapFile(MAPS_DIR + (wanted || "map1.map"));
    }
    discoverMaps().then(function (numbers) {
      state.mapNumbers = numbers;
      renderPicker();
    });
    setStatus("Готово. Напишіть програму та натисніть «Виконати».");
  }

  // ---- обмін картою з редактором (editor.html) --------------------------
  //
  // застосунок → редактор: карта кладеться в localStorage, редактор відкривається
  //   у вкладці з іменем "robot-map-editor" (повторне натискання оновлює її).
  // редактор → застосунок: редактор надсилає карту через BroadcastChannel;
  //   якщо застосунок уже відкритий — він завантажує карту й підтверджує, інакше
  //   редактор переходить на runide.html, а карта береться з localStorage.

  var HANDOFF_TO_EDITOR = "robot.handoff.toEditor";
  var HANDOFF_TO_APP = "robot.handoff.toApp";
  var HANDOFF_TTL = 60000;   // мс; старіші передачі ігноруємо

  /** Читає й одразу видаляє передану карту; null, якщо її немає або вона застаріла. */
  function readHandoff(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      localStorage.removeItem(key);
      var data = JSON.parse(raw);
      if (!data || typeof data.text !== "string") return null;
      if (Date.now() - data.ts > HANDOFF_TTL) return null;
      return { name: data.name || "map.map", text: data.text };
    } catch (e) {
      return null;
    }
  }

  /** «Редагувати карти»: відкриває вкладку редактора з поточною картою. */
  function openEditor() {
    try {
      localStorage.setItem(HANDOFF_TO_EDITOR, JSON.stringify({
        name: state.mapName, text: state.mapText, skin: el.skin.value, ts: Date.now(),
      }));
    } catch (e) {
      // сховище недоступне — редактор відкриється з порожньою картою
    }
    global.open("editor.html", "robot-map-editor");
  }

  /** Слухає редактор: той просить показати карту, яку редагував. */
  function bindEditorChannel() {
    if (typeof global.BroadcastChannel !== "function") return;
    var channel = new global.BroadcastChannel("robot-maps");
    channel.onmessage = function (event) {
      var msg = event.data;
      if (!msg || msg.type !== "open-map" || typeof msg.text !== "string") return;
      readHandoff(HANDOFF_TO_APP);   // запасний канал більше не потрібен
      stopRun();
      state.mapName = msg.name || "map.map";
      applyMap(msg.text);
      try { global.focus(); } catch (e) { /* ignore */ }
      channel.postMessage({ type: "ack" });
    };
  }

  // ---- вікно з картою (модальна панель) ---------------------------------

  /** Показує або ховає панель з полем. */
  function openMapWindow() {
    if (el.mapPanel.hidden) {
      centerPanel();
      el.mapPanel.hidden = false;
      state.mapWindowOpen = true;
      // closeMapWindow зупиняє цикл анімації — після повторного відкриття
      // вікна його треба запустити знову (інакше Energon не блимають).
      startAnimation();
    }
    state.renderer.paint();
    return el.mapPanel;
  }

  /** Ставить панель по центру вікна (поки її не перетягли). */
  function centerPanel() {
    if (state.panelMoved) return;
    var w = el.mapPanel.offsetWidth || 800;
    var h = el.mapPanel.offsetHeight || 600;
    el.mapPanel.style.left = Math.max(0, Math.round((global.innerWidth - w) / 2)) + "px";
    el.mapPanel.style.top = Math.max(0, Math.round((global.innerHeight - h) / 2)) + "px";
  }

  function closeMapWindow() {
    el.mapPanel.hidden = true;
    state.mapWindowOpen = false;
    // Скасовуємо таймери анімації, щоб не витрачати ресурси
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  /** Перетягування панелі за заголовок. */
  function bindPanelDrag() {
    var drag = null;
    el.mapHead.addEventListener("mousedown", function (event) {
      if (event.target.tagName === "BUTTON") return;
      var rect = el.mapPanel.getBoundingClientRect();
      drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
      event.preventDefault();
    });
    global.addEventListener("mousemove", function (event) {
      if (!drag) return;
      var x = event.clientX - drag.dx;
      var y = event.clientY - drag.dy;
      // Не випускаємо панель за межі вікна.
      x = Math.max(0, Math.min(x, global.innerWidth - el.mapPanel.offsetWidth));
      y = Math.max(0, Math.min(y, global.innerHeight - el.mapPanel.offsetHeight));
      el.mapPanel.style.left = x + "px";
      el.mapPanel.style.top = y + "px";
      state.panelMoved = true;
    });
    global.addEventListener("mouseup", function () { drag = null; });
  }

  function skinPath(name) {
    return SKINS_DIR + name + "/";
  }

  /** Завантажує опис скінів (список файлів) і застосовує вибраний. */
  function loadSkins() {
    fetch(SKINS_DIR + "skins.json").then(function (res) { return res.json(); })
      .then(function (skins) {
        state.skins = skins;
        el.skin.innerHTML = "";
        Object.keys(skins).forEach(function (name) {
          var opt = document.createElement("option");
          opt.value = name;
          opt.textContent = skins[name].title || name;
          el.skin.appendChild(opt);
        });
        var saved = localStorage.getItem("app.skin");
        if (saved && skins[saved]) el.skin.value = saved;
        // Скін, заданий картою, важливіший за збережений вибір.
        if (state.mapSkin && skins[state.mapSkin]) el.skin.value = state.mapSkin;
        applySkin(el.skin.value || "dessertSkin");
      })
      .catch(function () {
        applySkin("dessertSkin");
      });
  }

  function applySkin(name) {
    var skin = state.skins[name];
    state.renderer.setSkin(skinPath(name), skin ? skin.files : []);
  }

  // Короткі назви скінів для команди skin() → теки в gfx/skins/.
  var SKIN_ALIASES = {
    grass: "grassSkin",
    desert: "dessertSkin",
    mind: "starMindSkin",
    lego: "legoSkin",
    default: "defaultSkin",
  };

  /** Команда skin(name): перемикає скін карти (grass/desert/mind/lego/default). */
  RM.setSkin = function (name) {
    var alias = SKIN_ALIASES[String(name).toLowerCase()];
    if (!alias) {
      throw new Error("Невідомий скін: " + name +
                      " (доступні: grass, desert, mind, lego, default)");
    }
    el.skin.value = alias;
    localStorage.setItem("app.skin", alias);
    applySkin(alias);
    return alias;
  };

  /** Застосовує вибрану швидкість анімації (slow / normal / fast). */
  function applySpeed(name) {
    if (!SPEED_PRESETS[name]) name = "normal";
    setSpeedLevel(SPEED_PRESETS[name]);
    localStorage.setItem("app.speed", name);
    el.speed.value = name;
  }

  // ---- Skulpt ----------------------------------------------------------

  function configureSkulpt() {
    Sk.configure({
      output: function (text) { appendOutput(text); },
      read: readHook,
      uncaughtException: function (err) { showError(err); },
      inputfun: function (prompt) {
        var value = global.prompt(prompt);
        // «Скасувати» у вікні введення зупиняє програму. Раніше воно повертало
        // порожній рядок, і цикл з input() показував вікно знову й знову без
        // виходу — браузер фактично не вдавалося закрити.
        if (value === null) {
          stopRun();
          return Promise.reject(new Error("Введення скасовано"));
        }
        return Promise.resolve(value);
      },
      inputfunTakesPrompt: true,
      // Захист від нескінченних циклів (інакше браузер «зависне»).
      // Віддаємо керування браузеру, щоб вкладка не зависала на довгих циклах.
      yieldLimit: 100,
      execLimit: 30000,
      timeoutMsg: function () {
        return "Час виконання програми вичерпано (30 секунд).";
      },
    });
  }

  /** Постачальник файлів для Skulpt: модуль robot + стандартна бібліотека. */
  function readHook(file) {
    if (file === "src/lib/robot.py") return moduleSource("robotPy", "robot.py");
    if (file === "src/lib/_robot.js") return moduleSource("robotJs", "_robot.js");
    if (Sk.builtinFiles && Sk.builtinFiles.files[file] !== undefined) {
      return Sk.builtinFiles.files[file];
    }
    throw "File not found: " + file;
  }

  function moduleSource(key, name) {
    if (state[key]) return state[key];
    return Sk.misceval.promiseToSuspension(
      fetch(ROBOT_DIR + name).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " для " + name);
        return res.text();
      }).then(function (text) {
        state[key] = text;
        return text;
      })
    );
  }

  // ---- міст для модуля robot -------------------------------------------

  /** Світ — для вікна з картою. */
  RM.getWorld = function () { return state.world; };
  RM.stopped = false;

  /** Збір Energon: оновлюємо лічильник у програмі та в статусі. */
  RM.onCollect = function (count, total) {
    setProgramCollect(count);
    setStatus("Зібрано Energon: " + count + " з " + total);
    if (total > 0 && count >= total) {
      el.congrats.hidden = false;
      state.congratsShown = true;
    }
  };

  /**
   * Пауза, яку можна скасувати: при «Зупинити» таймер знімається, а проміс
   * одразу розв'язується — програма бачить RM.stopped і завершується,
   * не залишаючи за собою живих таймерів.
   */
  function wait(ms) {
    return new Promise(function (resolve) {
      var entry = { id: null, resolve: resolve };
      entry.id = setTimeout(function () {
        var i = state.timers.indexOf(entry);
        if (i >= 0) state.timers.splice(i, 1);
        resolve();
      }, ms);
      state.timers.push(entry);
    });
  }

  function cancelTimers() {
    var list = state.timers;
    state.timers = [];
    list.forEach(function (entry) {
      clearTimeout(entry.id);
      entry.resolve();
    });
  }

  /** Пауза між клітинками руху (у покроковому режимі — без паузи). */
  RM.gate = function () {
    if (state.mode === "step") return Promise.resolve();
    return wait(SPEED.step);
  };

  /** Пауза анімації лапки (довша за звичайний крок руху). */
  RM.gripperGate = function () {
    if (state.mode === "step") return Promise.resolve();
    return wait(SPEED.grip);
  };

  /** Швидкість робота з програми: setSpeed(v) / getSpeed(). */
  RM.setSpeed = function (v) { return setSpeedLevel(v); };
  RM.getSpeed = function () { return speedLevel; };

  /** Пауза після команди: у покроковому режимі чекаємо натискання «Крок». */
  RM.commandGate = function () {
    if (state.mode !== "step") return Promise.resolve();
    return new Promise(function (res) { state.stepWaiters.push(res); });
  };

  RM.onRobotCommand = function () {
    state.renderer.paint();
  };

  /** Переміщує робота в клітинку (для зовнішнього API, не для кліку по полю). */
  RM.moveRobot = function (x, y) {
    var w = state.world;
    if (!w) return false;
    if (x < 0 || y < 0 || x >= w.width || y >= w.height) return false;
    if (w.isObstacle(x, y)) return false;
    w.robot.x = x;
    w.robot.y = y;
    w.paintUnderRobot();
    state.renderer.paint();
    return true;
  };

  /**
   * Глобальна змінка `collect` у програмі: Skulpt зберігає область імен
   * програми в __main__.$d — туди й записуємо значення.
   */
  function setProgramCollect(count) {
    try {
      var main = Sk.sysmodules.quick$lookup(new Sk.builtin.str("__main__"));
      if (main && main.$d) {
        main.$d["collect"] = new Sk.builtin.int_(count);
      }
    } catch (e) {
      // програма ще не запущена — не страшно
    }
  }

  // ---- виконання -------------------------------------------------------

  /**
   * Запуск програми. Одночасно виконується лише одна програма: якщо попередня
   * ще не завершилася після зупинки, новий запуск відкладаємо до її завершення.
   * Інакше старий ланцюжок продовжував би працювати разом з новим.
   */
  function startRun(mode) {
    if (!state.world) {
      setStatus("Спершу завантажте карту", true);
      return;
    }
    if (state.alive) {
      state.pendingStart = mode;
      stopRun();
      setStatus("Зупиняю попередню програму…");
      return;
    }
    if (state.codeLimit && countCodeLines(el.editor.value) > state.codeLimit) {
      setStatus("Програма довша за ліміт карти (" + state.codeLimit + " " +
                codeLinesWord(state.codeLimit) + ")", true);
      return;
    }
    state.pendingStart = null;
    state.alive = true;
    Sk.execLimit = 30000;   // скидаємо ліміт після попередньої зупинки
    state.mode = mode;
    RM.stopped = false;
    state.running = true;
    el.run.disabled = true;
    clearOutput();
    setStatus(mode === "step" ? "Виконання по кроках — натискайте «Крок»" : "Виконання…");
    openMapWindow();

    var code = el.editor.value;
    Sk.misceval.callsimAsync([], function () {
      return Sk.importMainWithBody(PROGRAM_NAME, false, code, true);
    }).then(function () {
      if (!RM.stopped) setStatus("Програма завершила виконання.");
      runSettled();
    }, function (err) {
      if (RM.stopped) {
        appendOutput("Програму зупинено.\n");
        setStatus("Виконання зупинено");
      } else {
        showError(err);
        setStatus("Помилка в програмі", true);
      }
      runSettled();
    });
    // Змінна collect доступна програмі з самого початку.
    setProgramCollect(0);
  }

  /** Викликається, коли програма повністю завершилася (успішно або з помилкою). */
  function runSettled() {
    state.alive = false;
    finishRun();
    var next = state.pendingStart;
    state.pendingStart = null;
    if (next) startRun(next);
  }

  function finishRun() {
    state.running = false;
    state.mode = "idle";
    el.run.disabled = false;
    state.stepWaiters = [];
  }

  function stopRun() {
    RM.stopped = true;
    // Обриває довгий цикл, що не викликає команд робота.
    if (state.alive) Sk.execLimit = 1;
    state.running = false;
    state.mode = "idle";
    el.run.disabled = false;
    // Знімаємо всі паузи, щоб призупинена програма одразу завершилася.
    cancelTimers();
    var waiters = state.stepWaiters;
    state.stepWaiters = [];
    waiters.forEach(function (resolve) { resolve(); });
  }

  /** «Крок»: якщо програма не йде — запускаємо її в покроковому режимі. */
  function stepOnce() {
    if (!state.running) {
      startRun("step");
      return;
    }
    var resolve = state.stepWaiters.shift();
    if (resolve) resolve();
  }

  /** Повертає світ до початкового стану (робот, фарба, Energon). */
  function resetWorld() {
    stopRun();
    // Якщо користувач закрив вікно карти — показуємо його знову.
    openMapWindow();
    if (!state.mapText) return;
    state.world = new RM.World(state.mapText);
    state.renderer.render(state.world);
  }

  // ---- консоль та помилки -----------------------------------------------

  function appendOutput(text) {
    var t = el.console.textContent + text;
    if (t.length > 20000) t = "…\n" + t.slice(-20000);
    el.console.textContent = t;
    el.console.scrollTop = el.console.scrollHeight;
  }

  function clearOutput() {
    el.console.textContent = "";
  }

  /** Форматує виняток Skulpt так, як це робить CPython. */
  function formatError(err) {
    var srcLines = el.editor.value.split("\n");
    var lines = [];
    var frames = err && err.traceback ? err.traceback : null;
    if (frames && frames.length) {
      lines.push("Traceback (most recent call last):");
      for (var i = frames.length - 1; i >= 0; i--) {
        var frame = frames[i];
        lines.push('  File "' + (frame.filename || PROGRAM_NAME) + '", line ' + frame.lineno +
                   ", in " + frameName(srcLines, frame.lineno));
        var src = srcLines[frame.lineno - 1];
        if (src !== undefined) lines.push("    " + src.replace(/^[ \t]+|[ \t]+$/g, ""));
      }
    }
    var typeName = "Exception";
    var message = "";
    if (err) {
      if (err.tp$name) typeName = err.tp$name;
      else if (err.name) typeName = err.name;
      try {
        if (err.tp$str) {
          var str = err.tp$str();
          message = (str && str.v !== undefined) ? String(str.v) : "";
        } else if (err.message) {
          message = String(err.message);
        }
      } catch (e) {
        message = "";
      }
    }
    lines.push(message ? typeName + ": " + message : typeName);
    return lines.join("\n");
  }

  function frameName(srcLines, lineno) {
    var idx = lineno - 1;
    if (idx < 0 || idx >= srcLines.length) return "<module>";
    var m = srcLines[idx].match(/^[ \t]*(?:def|class)\s+(\w+)/);
    if (m) return m[1];
    for (var i = idx; i >= 0; i--) {
      var mm = srcLines[i].match(/^[ \t]*(?:def|class)\s+(\w+)/);
      if (mm) return mm[1];
    }
    return "<module>";
  }

  function showError(err) {
    appendOutput(formatError(err) + "\n");
  }

  /** Запускає цикл анімації, якщо він ще не працює (повторні виклики безпечні). */
  function startAnimation() {
    if (!state.animationFrameId) animate();
  }

  /** Безперервне малювання — потрібне для мигання Energon. */
  function animate() {
    if (state.mapWindowOpen && !document.hidden) {
      // Energon міняє кадр раз на секунду — перемальовуємо лише тоді,
      // і не малюємо у прихованій вкладці.
      var f = Math.floor(Date.now() / 1000) % 2;
      if (f !== animate.last || state.renderer.sizeChanged()) {
        animate.last = f;
        state.renderer.paint();
      }
    }
    state.animationFrameId = global.requestAnimationFrame(animate);
  }

  // ---- карти та приклади ------------------------------------------------

  function loadMapFile(url) {
    return fetch(url).then(function (res) { return res.text(); })
      .then(function (text) {
        state.mapName = url.split("/").pop();
        applyMap(text);
      })
      .catch(function (err) {
        setStatus("Не вдалося завантажити карту: " + err, true);
      });
  }

  /** Карту можна задати в адресі: runide.html#map21.map */
  function mapFromHash() {
    var name = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (!name) return "";
    if (!/\.map$/i.test(name)) name += ".map";
    return name;
  }

  /** Порожній шаблон карти 16x11 (рамка). */
  var EMPTY_MAP_TEMPLATE = "map:\n" +
    "CHHHHHHHHHHHHHHD\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "G              I\n" +
    "BFFFFFFFFFFFFFFE\n";

  function applyMap(text) {
    state.mapText = text;
    state.world = new RM.World(text);

    // Секції skin: та codelimit: з файлу карти.
    var meta = parseMapMeta(text);
    state.codeLimit = meta.codeLimit;
    if (meta.skin) {
      state.mapSkin = meta.skin;
      el.skin.value = meta.skin;
      applySkin(meta.skin);
    }
    enforceCodeLimit();
    updateHighlight();
    syncEditorSize();

    state.renderer.render(state.world);
    setStatus("Карту завантажено: " + state.mapName);
    // Активна карта має бути видима у вікні вибору (інакше підтягуємо вікно).
    var idx = state.mapNumbers.indexOf(activeMapNumber());
    var start = Math.min(Math.max(0, idx - Math.floor(MAPS_PER_PAGE / 2)),
                         Math.max(0, state.mapNumbers.length - MAPS_PER_PAGE));
    state.pickerStart = idx >= 0 ? start : 0;
    renderPicker();
  }

  // ---- панель вибору карт ----------------------------------------------

  var MAPS_PER_PAGE = 10;    // кнопок карт на одній сторінці
  var MAP_PROBE_LIMIT = 60;  // скільки імен mapN.map опитуємо при старті

  /** Визначає наявні карти maps/map1.map … maps/mapN.map. */
  function discoverMaps() {
    var probes = [];
    for (var n = 1; n <= MAP_PROBE_LIMIT; n++) {
      probes.push(
        fetch(MAPS_DIR + "map" + n + ".map", { method: "HEAD" })
          .then(function (res) { return res.ok; })
          .catch(function () { return false; })
      );
    }
    return Promise.all(probes).then(function (flags) {
      var numbers = [];
      flags.forEach(function (ok, i) {
        if (ok) numbers.push(i + 1);
      });
      return numbers;
    });
  }

  /** Число активної карти (state.mapName = "map3.map" → 3) або null. */
  function activeMapNumber() {
    var m = /^map(\d+)\.map$/i.exec(state.mapName);
    return m ? parseInt(m[1], 10) : null;
  }

  /** Малює вікно з 10 кнопками карт та вмикає/вимикає стрілки.
   *  Стрілки зсувають вікно на 1 номер (прокручування, не сторінки). */
  function renderPicker() {
    var nums = state.mapNumbers;
    var active = activeMapNumber();
    var maxStart = Math.max(0, nums.length - MAPS_PER_PAGE);
    if (state.pickerStart > maxStart) state.pickerStart = maxStart;
    if (state.pickerStart < 0) state.pickerStart = 0;

    el.mapPages.innerHTML = "";
    nums.slice(state.pickerStart, state.pickerStart + MAPS_PER_PAGE)
      .forEach(function (n) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "map-btn" + (n === active ? " active" : "");
        b.textContent = n;
        b.title = "Карта map" + n + ".map";
        b.addEventListener("click", function () { loadMapNumber(n); });
        el.mapPages.appendChild(b);
      });

    var empty = nums.length === 0;
    el.mapPrev.hidden = empty;
    el.mapNext.hidden = empty;
    el.mapPrev.disabled = empty || state.pickerStart <= 0;
    el.mapNext.disabled = empty || state.pickerStart >= maxStart;
  }

  /** Завантажує карту за номером і запам'ятовує її в адресі сторінки. */
  function loadMapNumber(n) {
    location.hash = "map" + n + ".map";
    loadMapFile(MAPS_DIR + "map" + n + ".map");
  }

  // ---- події ------------------------------------------------------------

  function bindEvents() {
    el.run.addEventListener("click", function () { startRun("run"); });
    document.getElementById("btn-edit-maps").addEventListener("click", openEditor);
    bindEditorChannel();
    el.stop.addEventListener("click", stopRun);
    el.step.addEventListener("click", stepOnce);
    el.reset.addEventListener("click", resetWorld);
    el.mapPrev.addEventListener("click", function () { state.pickerStart -= 1; renderPicker(); });
    el.mapNext.addEventListener("click", function () { state.pickerStart += 1; renderPicker(); });
    //el.mapClose.addEventListener("click", closeMapWindow);
    el.congratsOk.addEventListener("click", function () { el.congrats.hidden = true; });

    // Кнопка закриття вікна карти
    var btnCloseMap = document.getElementById("btn-close-map");
    if (btnCloseMap) {
      btnCloseMap.addEventListener("click", closeMapWindow);
    }

    

    

    // Перетягування мишею — прокручування карти.
    var drag = null;
    var suppressClick = false;
    el.canvas.addEventListener("mousedown", function (event) {
      drag = { x: event.clientX, y: event.clientY, moved: false };
      suppressClick = false;
      event.preventDefault();
    });
    global.addEventListener("mousemove", function (event) {
      if (!drag) return;
      var dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      state.renderer.scrollBy(dx, dy);
      drag.x = event.clientX;
      drag.y = event.clientY;
    });
    global.addEventListener("mouseup", function () {
      // Клік після перетягування не має перемикати сітку.
      suppressClick = !!(drag && drag.moved);
      drag = null;
    });

    // Подвійний клік — вписати карту у вікно.
    el.canvas.addEventListener("dblclick", function () { state.renderer.resetView(); });

    // При зміні розміру вікна карта має перемалюватися.
    global.addEventListener("resize", function () { state.renderer.paint(); });

    bindPanelDrag();

    el.loadMap.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      F.readFile(file, "text").then(function (text) {
        state.mapName = file.name;
        applyMap(text);
      });
    });

    el.editor.addEventListener("input", function () {
      enforceCodeLimit();
      updateHighlight();
      syncEditorSize();
    });

    el.editor.addEventListener("scroll", function () {
      el.highlight.scrollTop = el.editor.scrollTop;
      el.highlight.scrollLeft = el.editor.scrollLeft;
    });

    el.skin.addEventListener("change", function () {
      localStorage.setItem("app.skin", el.skin.value);
      applySkin(el.skin.value);
    });

    el.speed.addEventListener("change", function () {
      applySpeed(el.speed.value);
    });

    var savedSpeed = localStorage.getItem("app.speed");
    applySpeed(savedSpeed && SPEED_PRESETS[savedSpeed] ? savedSpeed : "normal");
  }

  // ---- редактор ---------------------------------------------------------

  function syncEditorSize() {
    el.editor.style.height = "auto";
    // Поле має вміщати й червоний рядок «кінець коду» з підсвітки.
    el.editor.style.height = Math.max(el.editor.scrollHeight, el.highlight.scrollHeight) + "px";
  }

  var KEYWORDS = [
    "import", "from", "def", "return", "while", "for", "in", "if", "else",
    "elif", "break", "continue", "and", "or", "not", "True", "False", "None",
    "forward", "backward", "left", "right",
    "north", "south", "east", "west",
    "paintWhite", "paintBlack", "stopPainting", "clearPaint",
    "pickUp",
    "collected", "EnergonLeft", "EnergonTotal",
    "frontIsEnergon", "leftIsEnergon", "rightIsEnergon",
    "setSpeed", "getSpeed", "skin", "CollisionError",
  ];

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function updateHighlight() {
    var text = el.editor.value;
    var html = escapeHtml(text);
    html = html.replace(/#.*$/gm, function (m) {
      return '<span class="tok-comment">' + m + "</span>";
    });
    html = html.replace(/\b\d+\b/g, '<span class="tok-number">$&</span>');
    var pattern = new RegExp("\\b(" + KEYWORDS.join("|") + ")\\b", "g");
    html = html.replace(pattern, '<span class="tok-keyword">$1</span>');
    var limit = state.codeLimit;
    if (limit) {
      // Порожні рядки добивають текст до ліміту, і одразу за ним іде маркер.
      var pad = Math.max(0, limit - text.split("\n").length);
      html += new Array(pad + 2).join("\n") +
        '<span class="code-end">** кінець коду **</span>';
    } else {
      html += "\n";
    }
    el.highlight.innerHTML = html;
  }

  // ---- статус -----------------------------------------------------------

  function setStatus(text, isError) {
    el.status.textContent = text;
    el.status.className = isError ? "status error" : "status";
  }

  // ---- невеликий API для автоматичних перевірок ------------------------

  RM.app = {
    state: state,
    run: function () { startRun("run"); },
    step: function () { stepOnce(); },
    stop: stopRun,
    reset: resetWorld,
    openMap: openMapWindow,
    setProgram: function (code) {
      el.editor.value = code;
      updateCodeInfo();
      updateHighlight();
      syncEditorSize();
    },
    getConsole: function () { return el.console.textContent; },
    getWorld: function () { return state.world; },
  };

  global.addEventListener("DOMContentLoaded", init);
})(typeof window !== "undefined" ? window : this);
