class Block  {

constructor(sig){
	var t = this;
	var ts = sig.split(':');
	var basetype = ts[0];	
	var suffix = '';
	if(ts[0]=='start') suffix=ts.length-1;
	if(ts[0]=='procedure') suffix=ts.length-1;
	t.type = (suffix==0)?basetype:basetype+suffix;
	t.sig = sig;
	t.createVars(t.type);
	t.div = Block.newBlockDiv(t.type);
	t.div.jsobj = t;
}

createVars(type){
 	this.type = type;
 	this.top=0;
 	this.left=0;
	this.info = defs.blockinfo[type];
	this.connections = new Array(this.dockCount());
}

static newBlockDiv(type){
	var div = document.createElement('div');
	var img = document.createElement('img');
	var svg = defs.svgs[type];
	div.className = 'block';
	div.style.position = 'absolute';
	div.style.left = '0px';
	div.style.top = '0px';
//	div.style.width = svg.width;
//	div.style.height = svg.height;
	div.appendChild(img);
	div.svgstr = svg.str;
	img.oncontextmenu = (e)=>{e.preventDefault(); e.stopPropagation();};
	setSVG(div, svg.str);
	return div;
}

dragstart(t,e,x,y){
 	t.div.parentElement.jsobj.dragstart(t,e,x,y);
}

click(t,e){
 	t.div.parentElement.jsobj.click(t,e);
}

addDefaultArgs(){
	var t = this;
	var args  = t.info.args;
	if(args==undefined) return;
  var defaults  = [].concat(args);
	var docks = t.docks();
	var ndock = defs.docks['input'][0];
	for(var i=0;i<defaults.length;i++){
		var ax = t.left+docks[i+1][1]-ndock[1];
		var ay = t.top+docks[i+1][2]-ndock[2];
		var a = new Block('number');
		t.div.parentElement.appendChild(a.div);
		a.setzoom(scripts.zoom)
		a.div.style.zIndex = 100;
		a.setText(defaults[i]);
		a.move(ax,ay);
		t.connections[i+1] = a;
		a.connections[0] = t;
	}
}

setText(txt){
	this.value = txt;
	if (this.info.special)  {
	//	console.log (this.type)
		var str = defs.svgs[this.type].str;
		var key = this.type == "number" ? ">0</text>" : ">i</text>";
		if(typeof txt == 'string') txt = txt.replaceAll('&','&#x0026;').replaceAll('<','&#x003c;');
		str = str.replace(key, ">"+ txt+"</text>");
		setSVG(this.div,str);
	}
}

setzoom(n){
	this.div.style.transformOrigin = 'center';
	this.div.style.zoom = n;
}

move(x,y){
//	console.log ("move", x, y)
  this.top=y;
  this.left=x;
  this.div.style.webkitTransform = 'translate3d('+ this.left + 'px,' +this.top +'px, 0)';
}

moveDxDy(dx, dy){
  this.left += dx;
  this.top += dy;
  this.div.style.webkitTransform = 'translate3d('+ this.left + 'px,' +this.top +'px, 0)';
}

disconnect(){
	if(this.connections[0]==undefined) return;
	var you = this.connections[0];
	you.connections[you.connections.indexOf(this)] = undefined;
	this.connections[0] = undefined;
}

contains(x,y){
	if(x<this.left) return false;
	if(x>this.left+this.div.offsetWidth) return false;
	if(y<this.top) return false;
	if(y>this.top+this.div.offsetHeight) return false;
	return true;
}

docks(){ return defs.docks[this.info.docktype];}
dockCount(){return defs.docks[this.info.docktype].length;}
lastDock(){return this.connections[this.dockCount()-1];}

hasStop (){
	if (this.type == 'stop') return true;
	var checkinside =  ['repeat', 'if', 'ifelse', 'forever'];
	var positions = [[2],[2],[2,3], [1]];
	var next = this;
	while (next) {
		var idx = checkinside.indexOf(next.type);
		if (idx > -1) {
			var pos = positions[idx];
			for (var i=0; i < pos.length; i++){
				var n = pos[i];
				if (next.connections[n] != undefined) {
					var b  = next.connections[n];
				 	var state =  b.hasStop();
		  		if (state) return true;
				}
			}
		}
		if (next.type == "stop") return true;
		next = next.connections[next.connections.length-1];		
	}
	return next ? next.type == "stop" : false;
}

/////////////////////////
//
// proc args
//
/////////////////////////

static hatDrop(e,dg){
	var x = Math.round(e.clientX-cnvframe.offsetLeft-frame.offsetLeft-scripts.cnvx)/scripts.zoom;
	var y = Math.round(e.clientY-cnvframe.offsetTop-frame.offsetTop-scripts.cnvy)/scripts.zoom;
	if(dg.length == 0) return undefined;
	if(dg.length>1) return undefined;
	if(dg[0].type!='global') return undefined;
	var blks = scripts.getBlocks();
	for(var i=0;i<blks.length;i++){
		var b = blks[i];
		if(b.type.substring(0,5)!='start') continue;
		if(b.type=='startfill') continue;
		if(b.value=='') continue;
		if(b.sig.split(':').length>2) continue;
		if(b.sig.indexOf(dg[0].value)>-1) continue;
		if(b.contains(x,y)) return b;
	}	
}

static addArg(hat, global){
	scripts.blockcanvas.removeChild(hat.div);
	scripts.blockcanvas.removeChild(global.div);
	var def = hat.sig.split(":")
	def.shift();
	def.push (global.value);
	var newhat = new Block("start:"+ def.join(":"));
	newhat.setText(hat.value);
	var delta  = (def.length<2)? 25 : 22;
	newhat.move(hat.left, hat.top-delta);
	scripts.blockcanvas.appendChild(newhat.div);
	var arg = new Block('arg');
	arg.setText(global.value);
//	arg.div.style.zIndex = 20;
	scripts.blockcanvas.appendChild(arg.div);
	var nextblock;
	if(hat.sig.split(':').length==1){
		arg.move(newhat.left+15.8,newhat.top+48);
	  nextblock =	hat.connections[1]
		newhat.connections[2] = nextblock;
		newhat.connections[1] = arg;
	}	else {
		arg.move(newhat.left+15.8,newhat.top+70);
	 	nextblock =	hat.connections[2]
	 	var previousarg = hat.connections[1];
		newhat.connections[3] = nextblock;
		newhat.connections[2] = arg;
		newhat.connections[1] = previousarg;
		scripts.blockcanvas.appendChild(previousarg.div);
		previousarg.connections[0] = newhat;		
		newhat.connections[1].move(newhat.left+15.8,newhat.top+48);		
	}
	if (nextblock) nextblock.connections[0] = newhat; // PB important
	arg.connections[0] = newhat;
	Block.growCalls(newhat.value, newhat.sig);
}

static replaceConnection(blk, old, newcall){
	if(blk==null) return;
	var connections = blk.connections;
	for(var i in connections){
		if(connections[i]==old) connections[i]=newcall;
	}
}

static growCalls(name, sig){
	var nsig = sig.split(':').length;
	var blks = scripts.getBlocks();
	for(var i=0;i<blks.length;i++){
		var blk = blks[i];
		if((blk.value!=name)||(blk.type.substring(0,9)!='procedure')) continue;
		var mysig  = sig == 'startfill' ? sig : sig.replace('start','procedure');
		var newcall = new Block(mysig);
		newcall.setText(name);
		newcall.move(blk.left,blk.top);
		if(nsig==2) addFirstArg();
		else if(nsig==3) addSecondArg();
		scripts.blockcanvas.removeChild(blk.div);
		scripts.blockcanvas.appendChild(newcall.div);
	}

	function addFirstArg(){
		var connections = newcall.connections;
		connections[0] = blk.connections[0];
		connections[2] = blk.connections[1];
		Block.replaceConnection(connections[0], blk, newcall);
		Block.replaceConnection(connections[2], blk, newcall);
	}

	function addSecondArg(){
		var connections = newcall.connections;
		connections[0] = blk.connections[0];
		connections[1] = blk.connections[1];
		connections[3] = blk.connections[2];
		Block.replaceConnection(connections[0], blk, newcall);
		Block.replaceConnection(connections[3], blk, newcall);
		project.layoutStack(newcall);
	}
}

static removeArg(arg){
	var hat = scripts.oldconnect;
	var sig = hat.sig;
	var newsig = sig.replace(':'+arg.value, '');
	var newhat = new Block(newsig);
	scripts.blockcanvas.removeChild(hat.div);
	window.arg = arg;
	var def = hat.sig.split(":")
	var delta  = (def.length> 2)? 22 : 25;
	if(arg.div.parentElement) scripts.blockcanvas.removeChild(arg.div);
	scripts.blockcanvas.appendChild(newhat.div);
	newhat.setText(hat.value);
	newhat.move(hat.left, hat.top+delta);
	if(newsig.split(':').length==1){
		newhat.connections[1] = hat.connections[2];
		if(hat.connections[2]) hat.connections[2].connections[0] = newhat;
	} else {
		newhat.connections[2] = hat.connections[3];
		if(hat.connections[3]) hat.connections[3].connections[0] = newhat;
		if(hat.connections[1]){
			newhat.connections[1] = hat.connections[1];
			scripts.blockcanvas.appendChild(hat.connections[1].div);
			newhat.connections[1].move(newhat.left+15.8,newhat.top+newhat.div.offsetHeight-28);		
			newhat.connections[1].connections[0] = newhat;
		} else { // PB this case should never happen
			newhat.connections[1] = hat.connections[2];
			scripts.blockcanvas.appendChild(newhat.connections[1].div);
			newhat.connections[1].connections[0] = newhat;
		}
	}
	Block.shrinkCalls(newhat.value, newhat.sig);
}

removeAllArgs(){
 	this.connections.splice(1, this.connections.length-2);
	this.setBlockSpecs('procedure', this.div);
	this.setText(this.value);
}

setBlockSpecs (type, div){
	var t = this;
	var ts = sig.split(':');
	var basetype = ts[0];	
	var suffix = '';
	if(ts[0]=='start') suffix=ts.length-1;
	if(ts[0]=='procedure') suffix=ts.length-1;
	t.type = (suffix==0)?basetype:basetype+suffix;
	t.sig = sig;
	t.createVars(t.type);
	t.div = Block.newBlockDiv(t.type);
	t.div.jsobj = t;
}

static shrinkCalls(name, sig){
	var nsig = sig.split(':').length;
	var blks = scripts.getBlocks();
	for(var i=0;i<blks.length;i++){
		var blk = blks[i];
		if((blk.value!=name)||(blk.type.substring(0,9)!='procedure')) continue;
		var newcall = new Block(sig.replace('start','procedure'));
		newcall.setText(name);
		newcall.move(blk.left,blk.top);
		if(nsig==1) removeArg();
		else if(nsig==2) removeSecondArg();
		scripts.blockcanvas.removeChild(blk.div);
		scripts.blockcanvas.appendChild(newcall.div);
	}

	function removeArg(){
		var connections = newcall.connections;
		connections[0] = blk.connections[0];
		connections[1] = blk.connections[2];
		Block.replaceConnection(connections[0], blk, newcall);
		Block.replaceConnection(connections[1], blk, newcall);
		if(blk.connections[1]) scripts.blockcanvas.removeChild(blk.connections[1].div);
	}

	function removeSecondArg(){
		var connections = newcall.connections;
		connections[0] = blk.connections[0];
		connections[1] = blk.connections[1];
		connections[2] = blk.connections[3];
		Block.replaceConnection(connections[0], blk, newcall);
		Block.replaceConnection(connections[2], blk, newcall);
		if(blk.connections[2]) scripts.blockcanvas.removeChild(blk.connections[2].div);
		project.layoutStack(newcall);
	}
}

onhold() {	
	var self = this;
	var showhelp = function () {
 		events.clearEvents();
	 	scripts.openHelp(self)
	}
	events.timeoutEvent = setTimeout(showhelp, 1000);
}
}
