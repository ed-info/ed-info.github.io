Class.subclass('Overlay', {
  
  init: function() {
    this.bgNode = $('#overlay');
    this.contentNode = $('#overlay-contents'); 
  },
  
  display: function(html, stack) {
    this.contentNode.html(html);
    this.show();
  },
  
  show: function() {
    this.bgNode.show();
    this.contentNode.show();
  },
  
  hide: function() {
    this.contentNode.hide();
    this.bgNode.hide();
  },
  
  displayPage: function(name) {
    var builder = new OverlayBuilder();
    Overlay.PAGES[name].call(this, builder);
    var html = builder.render();
    this.display(html);
  }
  
});

Class.subclass('OverlayBuilder', {
  
  init: function() {
    this.buffer = '';
  },
  
  render: function() {
    return this.buffer;
  },
  
  h1: function(txt) {
    return this.html("<h1>" + txt + "</h1>\n");
  },
  
  p: function(txt) {
    return this.html("<p>" + txt + "</p>\n");
  },
  
  indent: function(txt) {
    return this.html('<p style="margin-left:20px;">' + txt + '</p>');
  },

  text: function(name, value) {
    var html = '<input type="text" id="'+name+'" name="'+name+'"';
    if (value) { html += ' value="' + value + '"'; }
    html += '></input>';
    return this.html(html);
  },
  
  button: function(name, onclick, icon) {
    return this.html('<button onclick="'+onclick+'">'+name+'</button>');
  },
  
  html: function(txt) {
    this.buffer += txt;
    return this; 
  }
  
});

Overlay.PAGES = {
  'enter-name': function(p) {
    var saveCmd = "app.settings.set('name', $('#name').val());app.overlay.displayPage('welcome');";
    
    p.h1('Вітаємо, Командире!')
      .p('Введіть своє псевдо для початку випробовувань:')
      .text('name')
      .p('Натисніть "Зберегти" якщо закінчили.')
      .button('Зберегти', saveCmd);
  },
  
  'welcome': function(p) {
	p.h1('Вітаємо, ' + app.settings.get('name') + '!')
		.p('У цій грі ви керуєте роботом-танком, який повинен знищити базу ворожих прибульців.')
		.p('Щоб зробити це, ви маєте створити програму для переміщення  танката стрільби на кожному рівні.')
		.p('Ви можете використовувати такі команди, по одній у рядку:')
		.indent('<b>move - переміщення, left - ліворуч, right - праворуч, fire - постріл, wait - очікування</b>')
		.p('Після того, як ви написали свою програму, натисніть кнопку "Запустити програму", щоб перевірити, чи вона працює!')
		.p('Є багато рівнів. Ви можете вибрати будь-який рівень для гри за допомогою кнопки "Обрати рівень".')
		.button('Обрати рівень', "app.overlay.displayPage('select-level');");
  },
  
  'select-level': function(p) {
    var diffs = Level.difficulties();
    var levels = '<table class="indent">';
    for (var d = 0; d < diffs.length; d++) {
      var diff = diffs[d];
      var count = Level.levelCount(diff);
      levels += '<tr>';
      levels += '<td style="vertical-align: middle;width: 100px;">' + diff.toUpperCase() + '</td>';
      levels += '<td>';
      for (var num = 0; num < count; num++) {
        var klass = 'level';
        if (Level.isCompleted(Level.key(diff, num))) {
          klass += ' completed'; 
        }
        levels += '<div class="'+klass+'" onclick="app.loadLevel(\''+diff+'\', '+num+')">' + (num + 1) + '</div>'; 
      }
      levels += '</td>';
      levels += '</tr>'; 
    }
    levels += '</table>';
    
    p.h1('Оберіть рівень')
      .p('Клацніть вказівником по номеру рівня щоб обрати його.')
      .html(levels)
      .p('<i>Вищі рівні є більш складнішими</i>');
  },
  
  'win': function(p) {
    p.h1('Перемога!!!')
      .p('Вітаємо!  Тепер ви можете перейти до наступного рівня!')
      .button('Наступний рівень', "app.overlay.displayPage('select-level');");
  },
  
  'lose': function(p) {
	p.h1('Не вдалося, спробуйте ще раз...')
		.p('На жаль, ви не знищили базу - продовжуйте працювати над своєю програмою і спробуйте ще раз!')
		.button('Повторити', 'app.resetLevel()')
		.button('Обрати рівень', "app.overlay.displayPage('select-level');");
  },
  
  'help-programming': function(p) {
	p.h1('Довідка з програмування')
		.p('Щоб запрограмувати свій танк, ви повинні ввести послідовність команд, по одній у рядку, у області «Програма», що праворуч на екрані.')
		.p('Ви можете використовувати наступні команди:')
		.indent('<b>move</b>: пересуває танк на один квадрат вперед')
		.indent('<b>right</b>: повернути праворуч на 90 градусів')
		.indent('<b>left</b>: повернути ліворуч на 90 градусів')
		.indent('<b>wait</b>: зачекати певний час')
		.indent('<b>fire</b>: стріляти зі зброї - снаряд рухатиметься, доки не влучить у щось')
		.p('Команди можна повторити кілька разів, додавши в дужках кількість: <b>move(3)</b>')
		.button('Закрити', "app.overlay.hide();");
  },
  
  'about': function(p) {
	p.h1('Про Code Commander')
	.p('Ця програма є особистим проєктом Роба Морріса з <a href="http://irongaze.com" target="_blank">Irongaze Consulting</a>.')
	.p('Все написано на Javascript з використанням <a href="http://jquery.com" target="_blank">jQuery</a>, <a href="http://craftyjs.com" target="_blank">CraftyJS</a> ' +
	'і <a href="http://schillmania.com/projects/soundmanager2/" target="_blank">SoundManager 2</a>.')
	.p('Вихідний код для проєкту розміщено на <a href="https://github.com/irongaze/Code-Commander" target="_blank">GitHub</a> і ліцензовано згідно з ліцензією MIT .')
	.p('Спрайти, шрифти, піктограми, звуки та музика (де вони не були створені спочатку) були отримані від численних співавторів, і всі вони безкоштовні для комерційного використання в тій чи іншій формі.')
	.p('Запитання, коментарі чи пропозиції можна надсилати на <a href="mailto:codecommander@irongaze.com">codecommander@irongaze.com</a>.')
	.button('Закрити', "app.overlay.hide();");
  }
}
