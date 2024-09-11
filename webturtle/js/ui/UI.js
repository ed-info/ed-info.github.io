class UI {

//////////////////
//
// zoom
//
/////////////////

static zoomout (e){
	return;
	e.preventDefault();
	e.stopPropagation();
	var minzoom = (cnvframe.offsetWidth / scripts.blockcanvas.offsetWidth).trim(2)
	scripts.setzoom(Math.max(minzoom, scripts.zoom*0.9));
}   
	
static zoomin (e){
	return;
	e.preventDefault();
	e.stopPropagation();
	scripts.setzoom(Math.min(2, scripts.zoom*1.1));
}   

static zoomreset (e){
	return;
	e.preventDefault();
	e.stopPropagation();
	scripts.setzoom(1);
}   

//////////////////
//
// Toggle Blocks
//
/////////////////

static toggleBlocks (e){
	e.preventDefault();
	e.stopPropagation();
	mousedown(e)
	scripts.toggleBlocks();
}

/////////////////////////
//
// File Menu
//
/////////////////////////

static toggleMenu  (e){
	e.preventDefault();
	e.stopPropagation();
	var state =	gn('appmenu')!=undefined
	mousedown(e);
	if (state) return;
	else {
	  UI.openMenu(frame, ["new project", "save copy", "save as svg", "help", "samples"])
		gn('appmenu').onmousedown = UI.doMenuAction;
	}
}

static closeDropdown(){if (gn('appmenu')) gn('appmenu').parentNode.removeChild(gn('appmenu'))}

static openMenu (p, labels) {	
	var mylabels = ["новий проєкт", "зберегти копію", "зберегти як svg", "допомога", "приклади"];
	var icon  = gn ('openmenu');
	var top = icon.offsetTop ;
	var left = icon.offsetLeft;
	var mm = newHTML("div", 'dropdownballoon', p);
	var barrow = newHTML("div", "menuarrow", mm);;
	var mdd= newHTML("div","dropdown", mm);
	mm.setAttribute('id', 'appmenu');
	for (var i=0; i < labels.length; i++) {
		var ul =  newHTML("ul", undefined, mdd);
		var li = newHTML("li", undefined, ul);
		li.setAttribute("key", labels[i]);
		li.textContent =  mylabels[i];
		li.fcn = labels[i].replace(/\s*/g,'');
  	if (i < labels.length - 1)  var div = newHTML("li", 'divider', ul); 
	}
	mm.style.width = (mdd.offsetWidth + 7) + "px";
	mm.style.height = mdd.offsetHeight + 'px';
	mm.style.top = (top - mdd.offsetHeight + 45) + 'px';
	mm.style.left = (left -  mdd.offsetWidth ) + 'px';
}	

static doMenuAction (e){
	var t = e.target;
	t.className = "selectmenu";
	if (t.fcn) UI [t.fcn](e);
	var endfcn = function () {UI.closeDropdown();}
 	setTimeout(endfcn, 100);
}

static newproject (e){
	e.preventDefault();
	e.stopPropagation();
	runtime.stopStack();
	turtle.clean();
	turtle.move();
	project.removeAllBlocks()
	scripts.showblocks()
	gn("togglebutton").className = scripts.visible ?   "blockstoggle off" :  "blockstoggle on";
	scripts.cnvx = 0;
	scripts.cnvy = 0;
	scripts.undos = [];
	scripts.redos = [];
	runtime.boxes = {box1: 0, box2: 0, box3: 0};
	palette.updateProcs()
	project.name = 'untitled';
	if (UI.digitalfab) UI.addOnPlayBlock(); // Exploratorium request
}

static addOnPlayBlock() { // Exploratorium request
	var b = new Block("onplay");
	b.move(50, 20);
	scripts.blockcanvas.appendChild(b.div);
}

static save(e){
	if(e.shiftKey){
		footer.innerHTML=project.name;
		footer.style.visibility='visible';
	}
	else turtle.savepng();
}

static savecopy (e){
	e.preventDefault();
	e.stopPropagation();
	var name = project.name;
	if  (name.toLowerCase() == 'untitled') {turtle.savepng(); return;}
	var r = name.match(/^(.*?)(\d+)$/);
	if (!r) {
		name += ' 2';
	} else  name = r[1]+(parseInt(r[2], 10) + 1);
  turtle.saveproject (name);
//  turtle.saveproject (name, doNext)
//  function doNext(str) {UI.showText(str + " saved");}
}

static showText (str){
	footer.innerHTML=str;
	footer.style.visibility='visible';
}
		
static isUniqueName (name){
	var topblocks = this.blocksContainer.getScripts()
	for (let i=0; i < topblocks.length; i++) {
		let blockID =  topblocks[i]
		let block = this.blocksContainer.getBlock(blockID)
		if (!block) continue;
		if  (block.opcode != "myblocks_definition") continue;
		if (block.mutation.arg0 == name) return false
	}
	return true
}


/////////////////////////
//
// SVG Modal Panel
//
/////////////////////////

static saveassvg (e){
	e.preventDefault();
	e.stopPropagation();
	Exporter.prepareSvg()
}

//////////////////////
//
// Show PDF
//
//////////////////////

static help (evt) { 
	evt.preventDefault(); 
	evt.stopPropagation();
	var a = document.createElement('a');
	a.href = "webhelp/reference.html"
	a.target = "_blank"
	a.click();
}


//////////////////////
//
// Show Samples
//
//////////////////////

static samples (evt) { 
	evt.preventDefault(); 
	evt.stopPropagation();
	var a = document.createElement('a');
	a.href = "webhelp/samples.html"
	a.target = "_blank"
	a.click();
}


/////////////////////////
//
// play button
//
/////////////////////////

static runOrStop(e){
	UI.closeDropdown();
	if (runtime.isRunning())runtime.stopStack();
	else {
		if (e.shiftKey) UI.fastmode = !UI.fastmode;
		runtime.runStack(scripts.findStartingBlock());
	}
}

/////////////////////////
//
// UI keys
//
/////////////////////////


static handleSpecialKeys (e){
	shifKeyDown = e.shiftKey;
	var code  = e.keyCode;
	var ismac = window.navigator.userAgent.indexOf ("Macintosh") > -1;
	if (ismac) {
		if (!e.metaKey) return;
		if ((code == 90) && !e.shiftKey) scripts.undo();
		else  if ((code == 90) && e.shiftKey) scripts.redo();
	}
	else {
		if (!e.ctrlKey) return;
		if (code == 90) scripts.undo();
		else if (code == 89) scripts.redo();
	}
}

static handleSpecialKeysUp (e){
	var code  = e.keyCode;
	if (code == 16) shifKeyDown = false;
}

/////////////////////////
//
// get timing
//
/////////////////////////

static getTimming (b){
	if (UI.fastmode) return 0;
	if (!scripts.visible) return 0;
	var count = 0;
	var t = runtime;	
	t.stack = new Array();
	var special = ["forward", "back", "right", "left", "arc"];
	var checkinside = ['repeat', 'if']
	var proclist  = [];
	while (true) {
		b = getnextBlock(b);
		if (b == undefined) break;
		if (count  == Infinity) break;
//		if (b) console.log (count, b.type ? b.type  : b)
		if (b.type == 'forever') {
			count = Infinity;
			break;
		}
		else if (b.type.indexOf ('procedure') > -1) b =  doProcedure(b);
		else if (b.type == 'setglobal') {
			runtime.boxes[b.value] = runtime.getnum(b,1);
			b =  b.connections[b.connections.length-1]
		}
		else if (special.indexOf(b.type)> -1) {	
			count++;
			if (b.type == 'arc') count++;
			b =  b.connections[b.connections.length-1]		
		} 
		else if (checkinside.indexOf(b.type)> -1) {
			t.stack.push (b.connections[b.connections.length-1])
			t.stack.push (count)
			t.stack.push (b.type == "repeat" ?  Math.floor(runtime.getnum(b,1)) : 1)
			b = b.connections[2];
			count = 0;
		}
		else b =  b.connections[b.connections.length-1]
	
	}
	return calculateStepTime (count, t.steptime)
	
	function calculateStepTime (count, time) {
		if (count == Infinity) return 0;
		var max = (time / 20) / count;
		var val = Math.round (max < 1 ?  0 : max);
		val  =  Math.floor (val / 2) != (val / 2) ?  val + 1 : val;
//		console.log (project.name, "count", count, "max", max, "val", val, "delivered", Math.max (0, Math.min (50, val)));
		return Math.max (0, Math.min (20, val));
	}
	
	function doProcedure(b){
		var t = runtime;
		if ((t.procs[b.value] == undefined)  || (proclist.indexOf (b.value) >  -1)){
			count = Infinity;
			return b.connections[b.connections.length-1];
		}
		var sig = b.sig.split(':');
		var vals = [];
		for(var a=0;a<sig.length-1;a++) vals.push(t.getnum(b, a+1));
	
		for(var i=1;i<sig.length;i++){
			var v = sig[i];
			t.stack.push(t.boxes[v]);
			t.stack.push(v);
			t.boxes[v] = vals[i-1];
		}
		proclist.push (b.value)
		t.stack.push(sig.length-1);	
		t.stack.push(b);
		t.stack.push('procDone');
		var hat = t.procs[b.value]
		return hat.connections[hat.connections.length-1];
	}

function procDone(){
	var block = t.stack.pop();
	var argn = t.stack.pop();
	var indx = proclist.indexOf (block.value);
	if (indx > -1) proclist.splice(indx, 1);
	for(var i=0;i<argn;i++){
		var v = t.stack.pop();
		var val = t.stack.pop();
		t.boxes[v] = val;
	}
	return block.connections[block.connections.length-1];
}

function getnextBlock(b){
	if (b) return b;
	while (b == undefined) {
		if (t.stack.length==0) return b;
		var arg = t.stack.pop();
		if (arg == 'procDone') b = procDone();
		else {
				var prevcount = t.stack.pop();
				count =  prevcount +  count * arg;		
		 		b = t.stack.pop();
			}
		}
		return b;
	}
}
	

	
	
}
