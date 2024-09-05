Class.subclass('Level', {
  
  load: function(difficulty, num) {
    var level = new Level(difficulty, num);
    return level;
  },
  
  getState: function(key) {
    var state = app.settings.get('level-'+key);
    if (!state) {
      state = {};
    }
    return state;
  },  

  setState: function(key, state) {
    app.settings.set('level-'+key, state);
  },
  
  isCompleted: function(key) {
    var state = this.getState(key);
    return state.completed;
  },
  
  complete: function(key) {
    var state = this.getState(key);
    state.completed = true;
    this.setState(key, state);
  },
  
  difficulties: function() {
    var res = [];
    for (var d in App.LEVELS) {
      res.push(d);
    }
    return res;
  },
  
  levelCount: function(difficulty) {
    return App.LEVELS[difficulty].length; 
  },
  
  key: function(difficulty, num) {
    var info = App.LEVELS[difficulty][num];
    if (info) {
      return info.key;
    } else {
      return null;
    } 
  }
  
}, {
  
  init: function(difficulty, num) {
    this.difficulty = difficulty;
    this.num = num;
    this.loadData();
  },
  
  loadData: function() {
    var data = App.LEVELS[this.difficulty][this.num];
    this.key = data.key;
    this.name = data.name;
    this.map = new Map(data.map);
    this.program = new Program(this);
    
    $('#title').html('Рівень: ' + this.name);
  },
  
  unload: function() {
    this.map.destroy();
  },
  
  win: function() {
    this.program.running = false;
    Level.complete(this.key);
    setTimeout(function() {
      app.overlay.displayPage('win'); 
    }, 1000);
  },
  
  lose: function() {
    this.program.running = false;
    setTimeout(function() {
      app.overlay.displayPage('lose'); 
    }, 1000);
  }
  
});

App.LEVELS = {
  
  intro: [
    {
      key: 'intro-0',
      name: 'Стріляй!',
      map: [
        '......T.',
        'T...B...',
        '........',
        '.....T..',
        '..T.....',
        '.T.....T',
        '....^...',
        '......T.'
      ]
    },

    {
      key: 'intro-1',
      name: 'Повернись і стріляй!',
      map: [
        '......T.',
        'T.......',
        '........',
        '.....T..',
        '..T.....',
        '.T.....T',
        '..^...B.',
        '......T.'
      ]
    },

    {
      key: 'intro-2',
      name: 'Переміщення',
      map: [
        '......T.',
        'R.......',
        '........',
        '.....T..',
        '..T.....',
        '.T....BT',
        '...R.T..',
        '..^T..T.'
      ]
    },
    
    {
      key: 'intro-3',
      name: 'Рухаємось більше',
      map: [
        '.....|..',
        '>....|R.',
        '...|.|..',
        '...|.|..',
        '...|...B',
        '.R.|R...',
        '...|.TT.',
        'T..|..T.'
      ]
    },
    
    {
      key: 'intro-4',
      name: 'Дерева - не перешкода',
      map: [
        '.R.TTTTT',
        '..TT.B.T',
        '...T...T',
        '.T.TTTTT',
        'R.......',
        '....T...',
        '..>.....',
        '.....R..'
      ]
    },
    
    {
      key: 'intro-5',
      name: 'Небезпечні міни',
      map: [
        '........',
        '...|.*<*',
        '.B.|..*T',
        '...|....',
        '---+R...',
        '......T.',
        '.T......',
        '...RT...'
      ]
    }    
  
  ],
  
  beginner: [

    {
      key: 'beginner-0',
      name: 'Міни',
      map: [
        'R...T...',
        '.RTT....',
        'TB..*T..',
        '...|....',
        '.--+^...',
        '..T....T',
        '...T....',
        '.....R..'
      ]
    },

    {
      key: 'beginner-1',
      name: 'Таємний вхід',
      map: [
        '.RvR....',
        '......T.',
        '--*.....',
        '.T..*...',
        '..TR----',
        '......+.',
        '....+.B.',
        '......+.'
      ]
    },

    {
      key: 'beginner-2',
      name: 'Лабіринт',
      map: [
        'R.......',
        '...T..<.',
        '........',
        '..R..T.R',
        'RT.R.RR.',
        '.RT.R...',
        'R.....T.',
        'TT..R.B.'
      ]
    },

    {
      key: 'beginner-3',
      name: 'Сторожові вежі - варто зачекати',
      map: [
        '....T...',
        '......T.',
        '.B....R.',
        '..TR..O.',
        '.T......',
        '..O...O.',
        'T.|...|.',
        '..|.^.|.'
      ]
    },

    {
      key: 'multi-tower',
      name: 'Небезпечні вежі',
      map: [
        '..OO.TRT',
        '>......R',
        'RROO..O.',
        '.TTO..O.',
        '.T......',
        '.....T..',
        'T...T.B.',
        '..R.....'
      ]
    }
    
  ],
   
  repeat_lessons: [

{
key: 'repeat_lessonslevel-1'
, name: 'Повторюємо дії',
map: ['|BR.....',
'|.TR....',
'+R.TR...',
'..R.TR..',
'...R.TR.',
'....R.TR',
'.....R.T',
'......R^' ] },
{
key: 'repeat_lessonslevel-2'
, name: 'Рухаємось зигзагом',
map: ['|BR.....',
'|TTR....',
'+RTTR...',
'..RTTR..',
'...RTTR.',
'....RTTR',
'.....RTT',
'......R^' ] },

	{
	key: 'repeat_lessonslevel-3'
	, name: 'Рух в лабіринті',
	map: [
		'....R.R.',
		'.+-*R.R.',
		'....R.T.',
		'.|..O.O.',
		'.|..R.R.',
		'.|..T.R.',
		'.+--+.R.',
		'...B|.R^' 
	] 
	},
{
key: 'repeat_lessonslevel-4'
, name: 'Бункер',
map: ['........',
'.+----+T',
'.|....|T',
'.|B..TTT',
'.|....|.',
'.|....+.',
'.+------',
'T......<' ] }	
    
  ],
 
  custom: [

 	{
	key: 'newlevel-0'
	, name: 'Знову лабіринт!',
	map: [
		'....R.R.',
		'.+-*R.R.',
		'....R.T.',
		'.|..R.R.',
		'.|..R.R.',
		'.|..T.R.',
		'.+--+.R.',
		'...B|.R^' 
	] 
	},	
	{
	key: 'newlevel-1'
	, name: 'Чекайте в лабіринті',
	map: [
		'....R.R.',
		'.+-*R.R.',
		'....R.T.',
		'.|..O.O.',
		'.|..R.R.',
		'.|..T.R.',
		'.+--+.R.',
		'...B|.R^' 
	] 
	}	
]
  
}
