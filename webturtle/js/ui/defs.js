class Defs {

constructor(){
	this.mediaCount = 0;
	this.svgs = {};
	this.blockinfo = {};
	this.dockdefs = {
		cmd0:			[["flow",28.8,3.6],["flow",28.8,38.7]],
		cmd:			[["flow",28.8,3.6],["num",54,18],["flow",28.8,38.7]],
		cmd2:			[["flow",28.8,3.6],["num",54,18],["num",54,54],["flow",28.8,74.7]],
		vspace:		[["flow",28.8,3.6],["flow",28.8,57.6]],
		hspace:		[["flow",30.6,9],["flow",94.5,9.45]],
		input:		[["num",0,10.8],["numend",65.7,10.8]],
		math:			[["numend",10.8,15.3],["num",28.8,15.3]],
		random:		[["num",0,23.4],["num",14.4,24.3],["num",83.7,24.3],["numend",162,23.4]],
		comp:			[["bool",0,15.3],["num",9,15.3],["num",90.9,15.3]],
		bracket1:	[["num",0,15.3],["num",27,15.3]],
		bracket2:	[["numend",11.7,15.3],["numend",36.9,15.3]],
		forever:	[["flow",28.8,3.6],["flow",85.5,13.5],["unavailable",0,0]],
		repeat:		[["flow",28.8,3.6],["num",54,18],["flow",94.5,42.3],["flow",28.8,80.1]],
		'if':			[["flow",28.8,3.6],["bool",54.45,23.85],["flow",94.5,46.8],["flow",28.8,82.8]],
		stopall:	[["flow",28.8,3.6],["unavailable",0,0]],
		hat0:			[["unavailable",0,0],["flow",41.4,49]],
		hat1:			[["unavailable",0,0],["local",15.8,56],["flow",41.4,73]],
		hat2:			[["unavailable",0,0],["local",15.8,56],["local",15.8,80],["flow",41.4,96.5]],
		arg:			[["unavailable",0,0],["unavailable",0,0]],
		local:		[["num",0,10.8],["numend",65.7,10.8]]
		}
}

get docks(){return this.dockdefs}


get palette(){return {
turtle: ['clean', [],['forward', 'back'], ['right', 'left'], 
         'arc', [], 'setxy', 'seth', [],
         'xcor', 'ycor', 'heading'],
pen:	  [['penup', 'pendown'], 'setpensize', 'setcolor', 'setshade', [],
	       ['startfill','endfill'], 'fillscreen', [],
	       'pensize', 'color', 'shade'],
number: ['number', [], ['plus',  'minus'], ['product','division'],
         'remainder', [], 'random', 'oneof', [],
         'greater', 'less' ,'equal', [],
         ['opar', 'cpar'], [], 'print'],
flow:   ['repeat', 'if', 'stop', 'forever', [],'vspace', 'hspace', [], 'wait'],
mystuff: []
}}

get blocks(){return [
 ['clean', 'cmd0'],
 ['forward', 'cmd',  100],
 ['back', 'cmd', 100],
 ['right', 'cmd', 90],
 ['left', 'cmd', 90],
 ['arc', 'cmd2',  [180, 100]],
 ['setxy', 'cmd2', [0, 0]],
 ['seth', 'cmd', 0],
 ['xcor', 'input'],
 ['ycor', 'input'],
 ['heading', 'input'],

 ['penup', 'cmd0'],
 ['pendown', 'cmd0'],
 ['setpensize', 'cmd', 4],
 ['setcolor', 'cmd', 0],
 ['setshade', 'cmd',  50],
 ['startfill', 'cmd0'],
 ['endfill', 'cmd0'],
 ['fillscreen', 'cmd2', [60, 70]],
 ['pensize', 'input'],
 ['color', 'input'],
 ['shade', 'input'],

 ['plus', 'math'],
 ['minus', 'math'],
 ['product', 'math'],
 ['division', 'math'],
 ['remainder', 'math'],
 ['random', 'random', [0, 100]],
 ['oneof', 'random', [0,100]],
 ['greater', 'comp'],
 ['less', 'comp'],
 ['equal', 'comp'],
 ['opar', 'bracket1'],
 ['cpar', 'bracket2'],
 ['print', 'cmd'],

 ['wait', 'cmd', 10],
 ['forever', 'forever'],
 ['repeat', 'repeat', 4],
 ['if', 'if'],
 ['stop', 'stopall'],
 ['vspace', 'vspace'],
 ['hspace', 'hspace']
]};

get special(){return [
 ['number', 'input'],
 ['nummask', 'input'],
 ['global', 'input'],
 ['arg', 'local'],
 ['setglobal', 'cmd', 100],
 ['onplay', 'hat0'], // Exploratorium request
 ['start', 'hat0'],
 ['start0', 'hat0'],
 ['start1', 'hat1'],
 ['start2', 'hat2'],
 ['hat0', 'hat0'],
 ['hat1', 'hat1'],
 ['hat2', 'hat2'],
 ['procedure', 'cmd0'],
 ['procedure0', 'cmd0'],
 ['procedure1', 'cmd', 100],
 ['procedure2', 'cmd2',[100, 100]]
]}

	

get helpsvgs(){return [
	'arc.svg', 'color.svg', 'opar.svg', 'setshade.svg',
	'back.svg', 'division.svg', 'pendown.svg', 'setxy.svg',
	'bigcircle.svg', 'equal.svg', 'pensize.svg', 'shade.svg',
	'block.svg', 'fillscreen.svg', 'penup.svg', 'start.svg',
	'bluearrow.svg', 'forever.svg', 'plus.svg', 'startfill.svg',
	'bluearrow1.svg', 'forward.svg', 'product.svg', 'stop.svg',
	'bluearrowf.svg', 'greater.svg', 'remainder.svg', 'turtled.svg',
	'bluearrowup.svg', 'greater2.svg', 'repeat.svg', 'turtleu.svg',
	'bluearrowup2.svg',	'heading.svg', 'right.svg', 'uistop.svg',
	'bluearrowupf.svg',	'if.svg', '	setcolor.svg', 'wait.svg',
	'bluewigglyarrow.svg',	'left.svg', 'seth.svg',
	'circle.svg', 'less.svg', 'pensize.svg',
	'circle2.svg', 'minus.svg', 'setpensize.svg'
]}

get blockshapesvgs(){return [
	'bracket1-pink.svg', 'cmd2-yellow.svg', 'input-green.svg',
	'bracket2-pink.svg', 'comp-pink.svg', 'input-pink.svg',
	'cmd-cyan.svg', 'forever-orange.svg', 'input-pinkhighlight.svg',
	'cmd-green.svg', 'hat0-yellow.svg', 'input-yellow.svg',
	'cmd-orange.svg', 'hat0-yellowhighlight.svg',	'local-yellow.svg',
	'cmd-pink.svg', 'hat1-yellow.svg', 'math-pink.svg',
	'cmd-yellow.svg', 'hat1-yellowhighlight.svg',	'random-pink.svg',
	'cmd0-cyan.svg', 'hat2-yellow.svg', 'repeat-orange.svg',
	'cmd0-green.svg', 'hat2-yellowhighlight.svg',	'stopall-orange.svg',
	'cmd0-yellow.svg', 'hspace-orange.svg', 'vspace-orange.svg',
	'cmd2-cyan.svg', 'if-orange.svg',
	'cmd2-green.svg', 'input-cyan.svg', 
	'starup-yellow.svg' // Exploratorium request
]}


/////////////////////////
//
// Image Preload
//
/////////////////////////

preloadImages (callback){
	var t = this;
	var l = [].concat(t.blocks, t.special);
	t.mediaCount = l.length;
	var res = [];
	for(var i=0;i<l.length;i++) {
		preload(l[i][0]);
	}

	function preload(name){
		t.svgs[name] = {};
		res.push(name);
		t.loadResource("assets/blocks/"+name+'.svg', function (str) {next1(str,name);});
	}
	
	function next1(str,name){
		if (str == '') console.log ("File not Found "  + name);
		str = str.replace (/></g, ">\n<");
		str = str.replace("&amp;","&");
		t.svgs[name].str = str;
//		var img = document.createElement('img');;
//		img.onload = next2;
//		img.src = 'assets/blocks/'+name+'.svg';
		t.mediaCount--;
		if (t.mediaCount==0) callback();
		
		function next2(){
//			t.svgs[name].width = img.naturalWidth+'px';
//			t.svgs[name].height = img.naturalHeight+'px';
			t.mediaCount--;
			if (t.mediaCount==0) callback();
		}		
	}
}

preloadHelpImages(){
	var t = this;
	for(var i=0;i<t.helpsvgs.length;i++) preloadHelpImage('help/'+t.helpsvgs[i]);
	for(var i=0;i<t.blockshapesvgs.length;i++)
		preloadHelpImage('assets/blockshapes/'+t.blockshapesvgs[i]);

	function preloadHelpImage(name){
		var img = document.createElement('img');	
		img.src = name;	
	}
}

preloadTabImages(){
	var t = this;
	var colors = ['Green','Cyan','Pink','Orange','Yellow'];
	for(var i in colors){
		var c = colors[i];
		preloadTabImage('assets/categories/Open'+c+'.svg');
		preloadTabImage('assets/categories/Closed'+c+'.svg');
	}

	function preloadTabImage(name){
		var img = document.createElement('img');	
		img.src = name;	
	}
}

/////////////////////////
//
// Block Defining
//
/////////////////////////


defineBlocks(){
	var t = this;
	for(var i=0;i<defs.blocks.length;i++) defineBlock.apply(null, t.blocks[i]);
	for(var i=0;i<defs.special.length;i++) defineSpecial.apply(null, t.special[i]);

	function defineBlock(prim, docks, args){
		var res = new Object();
		res['args'] = args;
		res['special'] =  false;
		res['docktype'] = docks;
		t.blockinfo[prim] = res;
	}

	function defineSpecial(prim, docks, args){
		var res = new Object();	
		res['args'] = args;
		res['docktype'] = docks;
		res['special'] =  true;
		t.blockinfo[prim] = res;
	}
}


/////////////////////////
//
// etc.
//
/////////////////////////
loadResource(filename, fcn){
	var req=new XMLHttpRequest();
	req.onreadystatechange= loaded;
	req.open('GET',filename,true)
	req.send(null);

	function loaded(){
		if (req.readyState!=4) return;
		if (req.status!=200) return;
		fcn(req.responseText);
	}
}


}

