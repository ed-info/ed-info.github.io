class Palette {

constructor(){
	this.cnames = ['green', 'cyan', 'pink', 'orange', 'yellow'];
	this.catnames = ['turtle', 'pen', 'number', 'flow', 'mystuff']; 
	this.selected = '';
	paldiv.jsobj = this;
}

setup(){
	for(var i=0;i<this.cnames.length;i++){
		var color = this.cnames[i];
		window[color].onclick = this.selectCategory;
	}	
	this.setCategory("green");
}


/////////////////////////
//
// Events
//
/////////////////////////

dragstart(proto, e){
	if (!proto.div) return;
	e.preventDefault(); 
	e.stopPropagation();
	scripts.showblocks();
	scripts.saveForUndo();
	var dx = events.dragx-palframe.offsetLeft-proto.div.offsetLeft;
	var dy = events.dragy-palframe.offsetTop-proto.div.offsetTop + paldiv.scrollTop; // added scrolling
	var b = new Block(proto.type);
	b.setzoom(scripts.zoom)
	b.sig = proto.sig;
	if(proto.value!=undefined) b.setText(proto.value);
	if(proto.type=='number') b.setText(0);
	frame.appendChild(b.div);
	b.div.style.zIndex = 7000;
	b.move(((events.dragx-dx)/scripts.zoom), ((events.dragy-dy)/scripts.zoom));
	b.addDefaultArgs();
	events.jsobj = b;
	events.handler = scripts;
	scripts.draggroup = scripts.findGroup(b);
	scripts.isarg = b.type == "global";
}

click(t,e){
	runtime.stopStack();
	if(t.type==undefined) return;
	runtime.runStack(t);
}


/////////////////////////
//
// Categories
//
/////////////////////////

selectCategory(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var color = e.target.id;
	mousedown(e);
	palette.setCategory(color);
}

setCategory(color){
	var t = this;
	t.selected = t.catnames[t.cnames.indexOf(color)];
	t.selectTab(color)
	paldiv.scrollTop = 0;
	t.open(t.selected);
}

selectTab(color){
	var pal =  gn("categories");
	for(var i=0;i< this.cnames.length;i++){
		var cat  = gn(this.cnames[i])
		if (cat.id ==  color) cat.className = "selector " + color + " on";
		else cat.className = "selector " + cat.id + " off";
	}	
}

open(name){
	while(paldiv.firstChild) paldiv.removeChild(paldiv.firstChild);
  var blocks = defs.palette[name];
	for(var i in blocks) this.addBlocks(blocks[i]);
	if (name=='mystuff') this.addMyStuff();
	var bdiv = paldiv.childNodes[Math.max(0, paldiv.childElementCount - 2)];
	if ((palframe.offsetHeight - 18) <  (bdiv.offsetTop + bdiv.offsetHeight)) { // 18 css padding
		paldiv.className = 'paldiv scroll';
		this.addSpacer(); // add bigger margin after the BR
	} 
	else paldiv.className = 'paldiv';
}

addBlocks(types){
	if(!(types instanceof Array)) types=new Array(types);
	if(types.length==0) {
		this.addHR();
		return;
	}
	for(var i in types) this.addBlock(types[i]);
	this.addBR();
}

addBlock(type){
	var b = new Block(type);
	var blk = b.div;
	blk.style.position = 'relative';
	blk.style.display = 'inline-block';
	var margins =  b.info.docktype == "input" ? '5px' :  '0px 5px';
	blk.style.margin = margins;
	blk.style.padding = "3px";
	paldiv.appendChild(b.div);
	return b;
}


/////////////////////////
//
// My Stuff
//
/////////////////////////

updateProcs(){
	if(this.selected=='mystuff') {
		var top = paldiv.scrollTop
		this.open('mystuff');
		paldiv.scrollTop = top;
	}
	runtime.updateProcs();
}

addMyStuff(){
	if (UI.digitalfab) { // Exploratorium request
		var list  = scripts.findBlocks('onplay');
		if (list.length == 0)  this.addBlock('onplay');
	}
	var b = this.addBlock('start');
	b.setText('');
	this.addHR();
	this.addGlobal ('box1');
	this.addGlobal ('box2');
	this.addGlobal ('box3');
	var starts = scripts.findStartBlocks();
	if (starts.length == 0) return;
	this.addHR();
	for (var i=0;i<starts.length;i++)  {
		var start = starts[i];
		var type =  start.type.replace('start', 'procedure');
		var b = this.addBlock(type);
		b.setText(start.value);
		b.sig = start.sig.replace('start', 'procedure');
		if ((i%2)==1) this.addBR();
	}
	 this.addBR()
}

addGlobal(name){	
  var b = this.addBlock('setglobal');
	b.setText(name);
  var b = this.addBlock('global');
	b.setText(name);
	b.div.style.verticalAlign = 'top';
	b.div.style.margin = "10px 5px";
	b.div.style.padding = "3px";
	this.addBR();
}

addHR(){
	var hr = document.createElement('hr');
	hr.setAttribute('class', 'blockshr');
	paldiv.appendChild(hr);
}

addBR(){	paldiv.appendChild(document.createElement('br'));}
addSpacer(){var spr = newHTML('div', 'spacer', paldiv);}

}