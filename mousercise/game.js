/* рушій гри «Мишоловки» — графічна версія */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var G = window.G;
  var LEVELS = window.LEVELS;
  var STORE_KEY = 'mousercise-game-progress-v1';

  var idx = 0;
  var mistakes = 0;
  var levelStart = 0;
  var runStart = 0;
  var locked = false;
  var soundOn = true;
  var hintOn = false;
  var successTimer = null;
  var audioCtx = null;

  var stage = $('stage');
  var screens = ['startScreen', 'gameScreen', 'finishScreen'];

  /* ============================================================
     Допоміжні функції
     ============================================================ */

  function showScreen(id) {
    screens.forEach(function (s) { $(s).hidden = (s !== id); });
  }

  /* Зберігаємо: last — індекс останньої пройденої вправи,
     completed — перелік усіх пройдених індексів, best — найкращий час.
     Старий формат {level: N} розуміємо як «пройдено перші N вправ». */
  function loadProgress() {
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    var p = null;
    try { p = raw ? JSON.parse(raw) : null; } catch (e) { p = null; }
    if (!p || typeof p !== 'object') p = {};

    var completed = [];
    if (Array.isArray(p.completed)) {
      p.completed.forEach(function (n) {
        if (Number.isInteger(n) && n >= 0 && n < LEVELS.length && completed.indexOf(n) < 0) completed.push(n);
      });
    } else if (Number.isInteger(p.level) && p.level > 0) {
      for (var i = 0; i < Math.min(p.level, LEVELS.length); i++) completed.push(i);
    }
    var last = Number.isInteger(p.last) && p.last >= 0 && p.last < LEVELS.length
      ? p.last : (completed.length ? Math.max.apply(null, completed) : -1);
    return { last: last, completed: completed, best: p.best || null, player: p.player || null };
  }

  function savePlayer(fname, lname) {
    try {
      var p = loadProgress();
      p.player = { fname: fname, lname: lname };
      localStorage.setItem(STORE_KEY, JSON.stringify(p));
    } catch (e) { /* ignore */ }
  }

  function saveProgress(levelIndex, seconds) {
    try {
      var p = loadProgress();
      if (p.completed.indexOf(levelIndex) < 0) p.completed.push(levelIndex);
      if (levelIndex > p.last) p.last = levelIndex;
      if (seconds && (!p.best || seconds < p.best)) p.best = seconds;
      localStorage.setItem(STORE_KEY, JSON.stringify(p));
      refreshDoneBadge();
    } catch (e) { /* приватний режим — просто ігноруємо */ }
  }

  function refreshDoneBadge() {
    var n = loadProgress().completed.length;
    $('doneBadge').textContent = '✓ ' + n;
    $('doneBadge').title = 'Пройдено вправ: ' + n + ' із ' + LEVELS.length;
  }

  /* Повертає індекс вправи з параметра ?level= (номер вправи, як у грі).
     null — параметра немає, -1 — показати вітальний екран. */
  function levelFromParam() {
    var value;
    try { value = new URLSearchParams(location.search).get('level'); } catch (e) { return null; }
    if (value === null) return null;
    if (value === '' || value === '0' || value.toLowerCase() === 'start') return -1;
    var n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return -1;
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].page === n) return i;
    }
    // Якщо вправи з таким номером немає (наприклад 25) — пробуємо як порядковий номер.
    return n <= LEVELS.length ? n - 1 : -1;
  }

  function updateUrl(index) {
    try {
      var u = new URL(location.href);
      u.searchParams.set('level', LEVELS[index].page);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* file:// без історії — ігноруємо */ }
  }

  function resumeIndex() {
    var p = loadProgress();
    return p.last + 1; // наступна після останньої пройденої
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ' хв ' + (s < 10 ? '0' : '') + s + ' с';
  }

  function sfx(kind) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = kind === 'ok' ? [523, 659, 784]
        : kind === 'bad' ? [180, 140]
        : kind === 'win' ? [523, 659, 784, 1046, 1318]
        : [660];
      notes.forEach(function (f, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = kind === 'bad' ? 'sawtooth' : 'sine';
        osc.frequency.value = f;
        var t = audioCtx.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.06 : 0.09, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'bad' ? 0.13 : 0.17));
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.2);
      });
    } catch (e) { /* звук не критичний */ }
  }

  function intro(l) {
    return '<div class="exercise-intro">' +
      '<span class="exercise-badge">Вправа ' + l.page + '</span>' +
      '<p>' + l.text + '</p></div>';
  }

  var SPEECH = {
    target: 'Клацни по сиру!', precision: 'Точність — головне!',
    findLink: 'Знайди посилання 👆', button: 'Натисни кнопку!',
    findImage: 'Яка картинка — посилання?', multiClick: 'Натисни всі!',
    scroll: 'Прокрути сторінку!', alert: 'Прочитай і натисни «Гаразд»',
    maze: 'Обережно, стіни!', checkboxes: 'Познач усі прапорці!',
    radios: 'Обирай по черзі!', dropdown: 'Відкрий список!',
    name: 'Введи своє ім’я!'
  };

  function shake() {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  }

  function mistake(msg) {
    mistakes++;
    sfx('bad');
    $('speech').textContent = msg || 'Спробуй ще раз! 🙂';
    shake();
  }

  function completeLevel() {
    if (locked) return;
    locked = true;
    sfx('ok');
    saveProgress(idx, Math.round((Date.now() - runStart) / 1000));
    $('successOverlay').hidden = false;
    $('successSub').textContent = idx === LEVELS.length - 1
      ? 'Остання вправа — і вас чекає сертифікат!'
      : 'Переходимо до наступної вправи…';
    clearTimeout(successTimer);
    successTimer = setTimeout(function () {
      $('successOverlay').hidden = true;
      if (idx + 1 < LEVELS.length) { idx++; renderLevel(); }
      else finishGame();
    }, 950);
  }

  function restartLevel() {
    clearTimeout(successTimer);
    $('successOverlay').hidden = true;
    renderLevel();
  }

  /* ============================================================
     Візуалізація вправ
     ============================================================ */

  function nextButton(label) {
    return '<button class="btn btn-primary reveal-next" hidden>' +
      (label || 'Далі') + ' →</button>';
  }

  function wireNext(btn, text) {
    if (!btn) return;
    btn.hidden = false;
    btn.classList.add('pop');
    if (text) $('speech').textContent = text;
  }

  function renderTarget(l) {
    stage.innerHTML = '<div class="exercise target-ex">' + intro(l) +
      '<div class="target-zone">' +
        '<button type="button" class="target-pos ' + l.pos + '" style="--sz:' + l.size + 'px" aria-label="Ціль ' + l.label + '">' +
          G.cheese(l.size) +
          '<span class="target-num" style="font-size:' + Math.round(l.size * 0.34) + 'px">' + l.label + '</span>' +
        '</button>' +
        '<div class="zone-decor decor-1">🧀</div><div class="zone-decor decor-2">🐭</div>' +
      '</div></div>';
    stage.querySelector('.target-pos').addEventListener('click', completeLevel);
  }

  function renderPrecision(l) {
    var cells = '';
    for (var i = 0; i < 9; i++) {
      var ans = i === l.answer;
      cells += '<button type="button" class="num-link' + (ans ? ' is-answer' : '') +
        '" data-ans="' + (ans ? '1' : '0') + '" style="font-size:' + l.font + 'px">' +
        (ans ? l.page : l.decoy) + '</button>';
    }
    stage.innerHTML = '<div class="exercise">' + intro(l) +
      '<div class="num-grid align-' + l.align + '">' + cells + '</div></div>';
    Array.prototype.forEach.call(stage.querySelectorAll('.num-link'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.ans === '1') completeLevel();
        else { mistake('Ой! Це число ' + l.decoy + '. Спробуй ще раз!'); setTimeout(restartLevel, 650); }
      });
    });
  }

  function renderFindLink(l) {
    var html = l.items.map(function (it, i) {
      var style = 'color:' + it.c + ';' + (it.u ? 'text-decoration:underline;' : '') +
        (it.b ? 'font-weight:bold;' : '');
      return '<button type="button" class="text-item' + (it.link ? ' is-link' : '') +
        '" data-ans="' + (it.link ? '1' : '0') + '" style="' + style + '">' + it.t + '</button>';
    }).join('');
    stage.innerHTML = '<div class="exercise">' + intro(l) +
      '<div class="text-items ' + l.variant + '">' + html + '</div></div>';
    Array.prototype.forEach.call(stage.querySelectorAll('.text-item'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.ans === '1') completeLevel();
        else mistake('Це не посилання. Наведи курсор на інший текст!');
      });
    });
  }

  function renderButton(l) {
    var inner;
    if (l.style === 'image') {
      inner = '<button type="button" class="big-btn btn-image">' + G.star(72) +
        '<span>' + l.label + '</span></button>';
    } else {
      inner = '<button type="button" class="big-btn btn-' + l.style + '">' + l.label + '</button>';
    }
    stage.innerHTML = '<div class="exercise center-ex">' + intro(l) +
      '<div class="button-demo">' + inner + '</div></div>';
    stage.querySelector('.big-btn').addEventListener('click', completeLevel);
  }

  function renderFindImage(l) {
    var cards = l.icons.map(function (ic, i) {
      return '<button type="button" class="img-card' +
        (i === l.answer ? ' is-link' : '') +
        (l.animated && i === l.answer ? ' is-animated' : '') +
        '" data-ans="' + (i === l.answer ? '1' : '0') + '">' +
        '<span class="img-emoji">' + ic + '</span><span class="img-cap">Зображення ' + (i + 1) + '</span></button>';
    }).join('');
    stage.innerHTML = '<div class="exercise">' + intro(l) +
      '<div class="img-grid">' + cards + '</div></div>';
    Array.prototype.forEach.call(stage.querySelectorAll('.img-card'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.ans === '1') completeLevel();
        else mistake('Це звичайне зображення. Спробуй інше!');
      });
    });
  }

  var VARIED_BTNS = [
    { c: 'btn-default', t: 'Тисни тут!' },
    { c: 'btn-outline', t: 'Наступна' },
    { c: 'btn-round', t: '★' },
    { c: 'btn-wide', t: 'І тут теж!' },
    { c: 'btn-pill', t: 'Далі →' },
    { c: 'btn-image-small', t: '▶' },
    { c: 'btn-rainbow', t: 'Гей!' }
  ];

  function renderMultiClick(l) {
    var items = '';
    if (l.mode === 'small') {
      for (var i = 0; i < l.count; i++) {
        items += '<button type="button" class="mini-btn" data-k="m' + i + '">' +
          '<span class="mini-face">▣</span><span class="mini-ok">✓</span></button>';
      }
    } else if (l.mode === 'varied') {
      VARIED_BTNS.forEach(function (b, i) {
        items += '<div class="varied-wrap"><button type="button" class="varied-btn ' + b.c +
          '" data-k="v' + i + '">' + b.t + '</button><span class="var-ok">✓</span></div>';
      });
    } else {
      for (var j = 0; j < l.count; j++) {
        items += '<button type="button" class="fire-btn" data-k="f' + j + '" title="Подвійний клік">' +
          G.firecracker(70) + '<span class="fire-ok">✓</span></button>';
      }
    }
    stage.innerHTML = '<div class="exercise center-ex">' + intro(l) +
      '<div class="multi-grid mode-' + l.mode + '">' + items + '</div>' +
      '<div class="multi-count">Знайдено: <b id="doneCount">0</b> / ' + l.count + '</div>' +
      nextButton('Перейти далі') + '</div>';

    var done = Object.create(null), n = 0;
    var nodes = stage.querySelectorAll('[data-k]');
    Array.prototype.forEach.call(nodes, function (b) {
      var evt = l.mode === 'dbl' ? 'dblclick' : 'click';
      b.addEventListener(evt, function () {
        if (done[b.dataset.k]) return;
        done[b.dataset.k] = true;
        b.classList.add('is-done');
        if (l.mode === 'dbl') b.classList.add('is-exploded');
        n++;
        $('doneCount').textContent = n;
        sfx('click');
        if (n === l.count) {
          wireNext(stage.querySelector('.reveal-next'), 'Усі елементи натиснуті!');
        }
      });
    });
    stage.querySelector('.reveal-next').addEventListener('click', completeLevel);
  }

  var SCROLL_CONTENT = {
    penguin: '<div class="scroll-inner tall"><div class="scroll-pic">🐧</div>' +
      '<h3>Пінгвін — морська пташка</h3>' +
      '<p>Пінгвіни живуть у Південній півкулі. Вони не літають, але чудово плавають і пірнають.</p>' +
      '<p>Прокрутіть сторінку донизу, щоб знайти посилання.</p>' +
      '<p>' + '▁▂▃▄▅▆▇█'.repeat(18) + '</p>' +
      '<button type="button" class="btn btn-primary scroll-next">Наступне завдання →</button></div>',
    poem: '<div class="scroll-inner tall"><h3>Любіть Україну</h3><p class="poem-author">Володимир Сосюра</p>' +
      '<p>Любіть Україну, як сонце любіть,<br>як вітер, і трави, і води…<br>' +
      'В годину щасливу і в радості мить,<br>любіть у годину негоди.</p>' +
      '<p>Любіть Україну у сні й наяву,<br>вишневу свою Україну,<br>' +
      'красу її, вічно живу і нову,<br>і мову її солов’їну.</p>' +
      '<p>Без неї — ніщо ми, як порох і дим,<br>розвіяний в полі вітрами…<br>' +
      'Любіть Україну всім серцем своїм<br>і всіми своїми ділами.</p>' +
      '<p>У квітці, в пташині, в кривеньких тинах,<br>у пісні у кожній, у думі…</p>' +
      '<button type="button" class="btn btn-primary scroll-next">Наступне завдання →</button></div>',
    beowulf: '<div class="scroll-inner tall"><h3>БЕОВУЛЬФ</h3>' +
      '<p><i>Отжє — як дани здавна звитяжили,<br>конунги славні, наслухались ми,<br>як герої хоробрість являли!</i></p>' +
      '<p>' + ('Сам Скільд Скевінґ скинув чимало вражих дружин з бражної лави, навіював жах на воїв, хоч перше нужденним був знайдою — діждався розради, зріс, піднесений під небом у шані. '.repeat(24)) + '</p>' +
      '<p>Беов Скільдінґ своїм скіпетром гради об’єднав надовго, підданцям любий…</p>' +
      '<button type="button" class="btn btn-primary scroll-next">Наступне завдання →</button></div>',
    penguins: '<div class="scroll-inner wide"><div class="wide-strip">' +
      '<span>🐧</span><span>🐧</span><span>🐧</span><span>🐧</span>' +
      '<span>🐧</span><span>🐧</span><span>🐧</span><span>🐧</span>' +
      '<button type="button" class="btn btn-primary scroll-next">Наступне →</button></div></div>',
    rights: '<div class="scroll-inner huge"><h3>Загальна декларація прав людини</h3>' +
      '<p>' + ('Беручи до уваги, що визнання гідності, яка властива всім членам людської сім’ї, і рівних та невід’ємних їх прав є основою свободи, справедливості та загального миру. '.repeat(30)) + '</p>' +
      '<div class="far-corner"><button type="button" class="btn btn-primary scroll-next">Наступне завдання →</button></div></div>'
  };

  function renderScroll(l) {
    var cls = 'dir-' + l.dir;
    stage.innerHTML = '<div class="exercise">' + intro(l) +
      '<div class="scroll-hint">' + (l.dir === 'h' ? '➜ Прокручуйте вправо' :
        l.dir === 'both' ? '➜ Спочатку вниз, потім вправо' : '⬇ Прокручуйте вниз') + '</div>' +
      '<div class="scroll-box ' + cls + '">' + SCROLL_CONTENT[l.content] + '</div></div>';
    stage.querySelector('.scroll-next').addEventListener('click', completeLevel);
  }

  function renderAlert(l) {
    stage.innerHTML = '<div class="exercise center-ex">' + intro(l) +
      '<div class="alert-demo">' + G.mouse(130) + '</div>' +
      '<button type="button" class="btn btn-primary" id="openAlert">Натисніть, щоб відкрити вікно сповіщень</button>' +
      '</div>';
    $('openAlert').addEventListener('click', function () {
      $('modalTitle').textContent = 'Увага!';
      $('modalText').textContent = 'Ви успішно відкрили вікно сповіщення. Натисніть «Гаразд», щоб продовжити.';
      $('modalOverlay').hidden = false;
      sfx('click');
    });
  }

  var MAZE = [
    '#########',
    'S...#....',
    '###.#.###',
    '#...#...#',
    '#.#####.#',
    '#.......#',
    '#####.###',
    '.....#..E',
    '#########'
  ];

  function renderMaze(l) {
    var html = MAZE.map(function (row) {
      return '<div class="maze-row">' + row.split('').map(function (ch) {
        var c = ch === '#' ? 'wall' : ch === 'S' ? 'start' : ch === 'E' ? 'exit' : 'path';
        var label = c === 'start' ? 'Вхід' : c === 'exit' ? 'Вихід' : '';
        return '<div class="maze-cell ' + c + '" data-c="' + c + '">' + label + '</div>';
      }).join('') + '</div>';
    }).join('');
    stage.innerHTML = '<div class="exercise maze-ex">' + intro(l) +
      '<div class="maze">' + html + '</div>' +
      '<p class="maze-tip">Ведіть курсор (без клацання) від «Вхід» до «Вихід».</p></div>';

    var warned = Object.create(null);
    Array.prototype.forEach.call(stage.querySelectorAll('.maze-cell'), function (cell) {
      cell.addEventListener('mouseenter', function () {
        if (cell.dataset.c === 'wall') {
          cell.classList.add('touched');
          if (!warned[cell]) {
            warned[cell] = true;
            mistake('Не заходьте на зелені стіни!');
          }
        } else if (cell.dataset.c === 'exit') {
          completeLevel();
        } else {
          cell.classList.add('visited');
        }
      });
    });
  }

  var PIZZA_TOPPINGS = ['Додатковий сир', 'Цибуля', 'Зелений перець', 'Анчоуси', 'Пепероні', 'Ковбаса'];
  var PIZZA_SIZES = ['Мала', 'Середня', 'Велика', 'Гігантська'];
  var PIZZA_STYLES = ['Тонке тісто', 'Пан-піца', 'Глибока страва', 'Чиказький стиль',
    'Нью-йоркський стиль', 'Неаполітанська', 'Подвійний шар', 'Потрійний шар'];

  function renderCheckboxes(l) {
    var items = '';
    if (l.mode === 'training') {
      for (var i = 0; i < l.count; i++) {
        items += '<label class="check-row"><input type="checkbox" class="cb"><span class="box"></span>' +
          ['Перший', 'Другий', 'Третій', 'Четвертий', "П'ятий", 'Шостий', 'Сьомий', 'Восьмий', "Дев'ятий"][i] +
          '</label>';
      }
    } else {
      PIZZA_TOPPINGS.forEach(function (t) {
        items += '<label class="check-row"><input type="checkbox" class="cb"><span class="box"></span>' + t + '</label>';
      });
    }
    stage.innerHTML = '<div class="exercise form-ex">' + intro(l) +
      '<div class="form-card"><p class="form-kicker">' +
      (l.mode === 'training' ? 'Позначте всі прапорці:' : 'Виберіть бажану начинку для піци:') + '</p>' +
      items + nextButton() + '</div></div>';

    var checks = stage.querySelectorAll('.cb');
    if (l.mode === 'training') {
      Array.prototype.forEach.call(checks, function (cb) {
        cb.addEventListener('change', function () {
          sfx('click');
          var all = Array.prototype.every.call(checks, function (c) { return c.checked; });
          if (all) wireNext(stage.querySelector('.reveal-next'), 'Усі прапорці позначені!');
        });
      });
    } else {
      wireNext(stage.querySelector('.reveal-next'));
    }
    stage.querySelector('.reveal-next').addEventListener('click', completeLevel);
  }

  function renderRadios(l) {
    var items = '';
    if (l.mode === 'training') {
      for (var i = 0; i < l.count; i++) {
        items += '<label class="check-row"><input type="radio" name="train" class="rb"><span class="dot"></span>' +
          ['перший', 'другий', 'третій', 'четвертий', "п'ятий", 'шостий', 'сьомий', 'восьмий', "дев'ятий"][i] +
          '</label>';
      }
    } else {
      PIZZA_SIZES.forEach(function (t) {
        items += '<label class="check-row"><input type="radio" name="size" class="rb"><span class="dot"></span>' + t + '</label>';
      });
    }
    stage.innerHTML = '<div class="exercise form-ex">' + intro(l) +
      '<div class="form-card"><p class="form-kicker">' +
      (l.mode === 'training' ? 'Натисніть кожен перемикач по черзі:' : 'Якого розміру піца вам подобається:') + '</p>' +
      items + nextButton() + '</div></div>';

    var radios = stage.querySelectorAll('.rb');
    if (l.mode === 'training') {
      var seen = Object.create(null), n = 0;
      Array.prototype.forEach.call(radios, function (rb, k) {
        rb.addEventListener('change', function () {
          sfx('click');
          if (!seen[k]) { seen[k] = true; n++; }
          if (n === radios.length) wireNext(stage.querySelector('.reveal-next'), 'Усі перемикачі випробувані!');
        });
      });
    } else {
      Array.prototype.forEach.call(radios, function (rb) {
        rb.addEventListener('change', function () { wireNext(stage.querySelector('.reveal-next')); });
      });
    }
    stage.querySelector('.reveal-next').addEventListener('click', completeLevel);
  }

  function renderDropdown(l) {
    var opts = '', listMode = (l.mode === 'list' || l.mode === 'pizzalist');
    if (l.mode === 'delivery') {
      opts = ['Кур’єром', 'Вантажівкою', 'Кораблем', 'Літаком'];
    } else if (l.mode === 'pizzalist') {
      opts = PIZZA_STYLES;
    } else {
      opts = ['обрати...', 'Перший', 'Другий', 'Третій', 'Четвертий', 'П’ятий',
        'Шостий', 'Сьомий', 'Восьмий', 'Дев’ятий'];
    }
    var options = opts.map(function (o) { return '<option>' + o + '</option>'; }).join('');
    var kicker = l.mode === 'delivery' ? 'Надішліть обране мною замовлення:'
      : l.mode === 'pizzalist' ? 'Яку піцу ви б хотіли:'
      : 'Оберіть потрібне:';
    stage.innerHTML = '<div class="exercise form-ex">' + intro(l) +
      '<div class="form-card"><p class="form-kicker">' + kicker + '</p>' +
      '<select class="select-menu' + (listMode ? ' select-list' : '') + '"' +
      (listMode ? ' size="5"' : '') + '>' + options + '</select>' +
      nextButton(l.mode === 'delivery' ? 'Надіслати' : 'Далі') + '</div></div>';

    var sel = stage.querySelector('.select-menu');
    sel.addEventListener('change', function () {
      sfx('click');
      if (l.answer >= 0 && sel.selectedIndex !== l.answer) {
        mistake('Це не той пункт. Спробуй ще раз!');
        return;
      }
      wireNext(stage.querySelector('.reveal-next'));
    });
    // Якщо підходить будь-який пункт (замовлення, піца), перший уже обраний
    // за замовчуванням — показуємо кнопку одразу, не чекаючи на change.
    if (l.answer < 0) wireNext(stage.querySelector('.reveal-next'));
    stage.querySelector('.reveal-next').addEventListener('click', completeLevel);
  }

  function renderName(l) {
    var p = loadProgress().player || {};
    stage.innerHTML = '<div class="exercise form-ex">' + intro(l) +
      '<div class="form-card name-card">' +
      '<label class="field-label" for="levelFname">Ім’я</label>' +
      '<input id="levelFname" type="text" maxlength="24" placeholder="Наприклад, Олена" value="' +
      (p.fname || '').replace(/"/g, '&quot;') + '">' +
      '<label class="field-label" for="levelLname">Прізвище</label>' +
      '<input id="levelLname" type="text" maxlength="24" placeholder="Наприклад, Коваленко" value="' +
      (p.lname || '').replace(/"/g, '&quot;') + '">' +
      nextButton('Отримати сертифікат') + '</div></div>';
    var btn = stage.querySelector('.reveal-next');
    btn.hidden = false;
    function collect() {
      savePlayer($('levelFname').value.trim(), $('levelLname').value.trim());
      completeLevel();
    }
    btn.addEventListener('click', collect);
    stage.querySelector('.name-card').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); collect(); }
    });
  }

  var RENDERERS = {
    target: renderTarget, precision: renderPrecision, findLink: renderFindLink,
    button: renderButton, findImage: renderFindImage, multiClick: renderMultiClick,
    scroll: renderScroll, alert: renderAlert, maze: renderMaze,
    checkboxes: renderCheckboxes, radios: renderRadios, dropdown: renderDropdown,
    name: renderName
  };

  function renderLevel() {
    var l = LEVELS[idx];
    locked = false;
    levelStart = Date.now();
    stage.className = 'stage';
    stage.innerHTML = '';
    $('hintBar').hidden = true;
    hintOn = false;
    $('btnHint').classList.remove('active');
    $('speech').textContent = SPEECH[l.type] || 'Готові? Починаємо!';
    $('levelLabel').textContent = 'Вправа ' + l.page;
    $('levelCounter').textContent = (idx + 1) + ' / ' + LEVELS.length;
    $('progressFill').style.width = (idx / LEVELS.length * 100) + '%';
    updateUrl(idx);
    refreshDoneBadge();
    RENDERERS[l.type](l);
    $('hintBar').innerHTML = '<b>💡 Підказка:</b> ' + l.hint;
  }

  /* ============================================================
     Старт / фінал
     ============================================================ */

  function startAt(index) {
    runStart = Date.now();
    clearTimeout(successTimer);
    $('successOverlay').hidden = true;
    if (index >= LEVELS.length) { finishGame(); return; }
    idx = Math.max(0, Math.min(index, LEVELS.length - 1));
    mistakes = 0;
    showScreen('gameScreen');
    renderLevel();
  }

  function finishGame() {
    var seconds = Math.round((Date.now() - runStart) / 1000);
    saveProgress(LEVELS.length - 1, seconds);
    var p = loadProgress();
    if (p.player) {
      $('fname').value = p.player.fname || '';
      $('lname').value = p.player.lname || '';
    }
    $('certStats').textContent = 'Час проходження: ' + fmtTime(seconds) +
      (p && p.best ? ' • Найкращий результат: ' + fmtTime(p.best) : '');
    $('certDate').textContent = new Date().toLocaleDateString('uk-UA',
      { day: 'numeric', month: 'long', year: 'numeric' });
    $('certSerial').textContent = 'МШ-' + new Date().getFullYear() + '-№ ' +
      String(LEVELS.length).padStart(3, '0');
    showScreen('finishScreen');
    $('certificate').hidden = true;
    $('finishActions').hidden = true;
    $('nameForm').hidden = false;
    sfx('win');
    launchConfetti();
  }

  function launchConfetti() {
    var c = $('confetti'), ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    var colors = ['#f43f5e', '#fbbf24', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4'];
    var parts = [];
    for (var i = 0; i < 140; i++) {
      parts.push({
        x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.6,
        w: 6 + Math.random() * 7, h: 8 + Math.random() * 9,
        vx: (Math.random() - 0.5) * 2, vy: 1.6 + Math.random() * 2.6,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2,
        col: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    var frames = 0;
    function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (++frames < 260) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, c.width, c.height);
    }
    tick();
  }

  /* ============================================================
     Ініціалізація
     ============================================================ */

  function refreshStartScreen() {
    var p = loadProgress();
    var next = resumeIndex();
    var has = p.completed.length > 0;
    $('levelGrid').innerHTML = LEVELS.map(function (l, i) {
      var done = p.completed.indexOf(i) >= 0;
      var current = has && next < LEVELS.length && i === next;
      return '<button type="button" class="level-dot' + (done ? ' done' : '') +
        (current ? ' current' : '') + '" data-index="' + i +
        '" title="Вправа ' + l.page + (done ? ' (пройдена)' : '') +
        '" aria-label="Вправа ' + l.page + '">' + l.page + '</button>';
    }).join('');
    $('completedInfo').textContent = 'Пройдено ' + p.completed.length + ' із ' + LEVELS.length;
    $('btnContinue').hidden = !has || next >= LEVELS.length;
    $('savedInfo').hidden = !has;
    if (has) {
      $('savedInfo').textContent = 'Наступна вправа: ' +
        LEVELS[Math.min(next, LEVELS.length - 1)].page +
        (p.best ? ' • Найкращий час: ' + fmtTime(p.best) : '');
    }
    refreshDoneBadge();
  }

  function init() {
    $('startLogo').innerHTML = G.logo();
    $('mascotArt').innerHTML = G.mouse(150);
    $('trophyArt').textContent = '🏆';
    $('certLaurel').innerHTML = G.certLaurel(190);
    Array.prototype.forEach.call(document.querySelectorAll('.cert-corner'), function (c) {
      c.innerHTML = G.certCorner();
    });
    refreshStartScreen();

    $('btnStart').addEventListener('click', function () { startAt(0); });
    $('btnContinue').addEventListener('click', function () { startAt(resumeIndex()); });
    $('levelGrid').addEventListener('click', function (e) {
      var dot = e.target.closest('.level-dot');
      if (!dot) return;
      startAt(parseInt(dot.dataset.index, 10));
    });
    $('btnHome').addEventListener('click', function () {
      refreshStartScreen();
      showScreen('startScreen');
    });
    $('btnRetry').addEventListener('click', restartLevel);
    $('btnSound').addEventListener('click', function () {
      soundOn = !soundOn;
      $('btnSound').textContent = soundOn ? '🔊' : '🔇';
      $('btnSound').classList.toggle('active', !soundOn);
      if (soundOn) sfx('click');
    });
    $('btnHint').addEventListener('click', function () {
      hintOn = !hintOn;
      $('hintBar').hidden = !hintOn;
      $('btnHint').classList.toggle('active', hintOn);
    });
    $('btnModalOk').addEventListener('click', function () {
      $('modalOverlay').hidden = true;
      completeLevel();
    });
    $('nameForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fn = $('fname').value.trim(), ln = $('lname').value.trim();
      $('certName').textContent = (fn || (!ln ? 'Неназвана особа' : '')) + (fn && ln ? ' ' : '') + ln;
      $('certificate').hidden = false;
      $('finishActions').hidden = false;
      $('nameForm').hidden = true;
      sfx('win');
      launchConfetti();
    });
    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('btnAgain').addEventListener('click', function () {
      try {
        localStorage.removeItem(STORE_KEY);
        var u = new URL(location.href);
        u.searchParams.delete('level');
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) {}
      showScreen('startScreen');
      location.reload();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('modalOverlay').hidden = true;
    });

    // При наступному запуску одразу продовжуємо з вправи після останньої пройденої.
    // Параметр ?level= має найвищий пріоритет; ?level=0 — показати вітальний екран.
    var param = levelFromParam();
    if (param === -1) showScreen('startScreen');
    else if (param !== null) startAt(param);
    else {
      var next = resumeIndex();
      if (next > 0) startAt(next);
      else showScreen('startScreen');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
