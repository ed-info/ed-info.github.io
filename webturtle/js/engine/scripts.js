class Scripts {

constructor(){
	this.draggroup = [];
	this.cnvx = 0;
	this.cnvy = 0;
	this.dx = 0;
	this.dy = 0;
	this.isarg = false;
	this.prevhat = undefined;
	this.vscroll = undefined;
	this.hscroll = undefined;
	this.oldconnect = undefined;
	this.iframe = undefined;
	this.undos = [];
	this.redos = [];
	this.toolmode = undefined;
	this.visible = true;
	this.zoom = 1;
	this.blockcanvas = document.createElement('div');
	this.blockcanvas.className = 'blockcanvas';
	this.blockcanvas.jsobj = this;
	cnvframe.appendChild (this.blockcanvas)
	var self = this;
	cnvframe.addEventListener('wheel', self.onwheel, supportsPassive ? {passive:true} : false);
}


/////////////////////////
//
// events
//
/////////////////////////

dragstart(b, e, x, y){
	e.preventDefault(); 
	e.stopPropagation();
	if(b instanceof Block) this.blkDragstart(b,e,x,y);
	else this.cnvDragstart(b, e);
}

dragmove(t,e,x,y){
	e.preventDefault(); 
	e.stopPropagation();
	if(this.draggroup=='canvas') this.cnvDragmove(t,e,x,y);
	else this.blkDragmove(t,e,x,y);
}

dragend(t,e,x,y){
	if(this.draggroup=='canvas') this.cnvDragend(t,e,x,y);
	else this.blkDragend(t,e,x,y);
}

click(b,e){this.handleclick (b, e);}

removeStartArg (b){
	var hat = b.hat;
	hat.removeArg(hat.type.replace(':'+b.value,''), b.hatn);
	b.div.parentNode.removeChild (b.div);
	var group = scripts.getCalls(hat.value); 
	var calltype = hat.type.replace('start', 'procedure');
	for (var i=0; i < group.length; i++)  {
		var arg = group[i].connections[b.hatn];
		if(arg)scripts.removeBlocks(arg);
		group[i].removeArg(calltype, b.hatn);
		project.layoutStack(group[i]);	
	}
	project.layoutStack(hat);	
	runtime.updateProcs();
}

removeStartBlock (b){
	var group = scripts.getCalls(b.value); 
	for (var i=0; i<group.length; i++) scripts.removeCallArgs(group[i]);
}

getCalls(value){
	var res = [];
	var blks = this.getBlocks();
	for(var i in blks){
		var b = blks[i];
		if (b.basetype!='procedure') continue;
		if (b.value == value) res.push(b);
	}
	return res;
}

removeCallArgs(call){
	for(var a=1;a<call.connections.length-1;a++){
		var arg = call.connections[a];
		if(arg) scripts.removeBlocks(arg);
	}
	call.removeAllArgs();
	project.layoutStack(call);	
}

handleclick (t, e){	
	if ((t==scripts) && this.visible) return;
	if (t==scripts) {runtime.runStack(scripts.findStartingBlock()); return;}
	var top = scripts.findTopBlock(t);
	project.layoutStack(top);	
	if(t.type=='number') editfield.numEdit(t);
	else if((t.type.substring(0,5)=='start')&&(t.type != 'startfill')) editfield.hatEdit(t);
	else runtime.runStack(top);
}

/////////////////////////
//
// canvas events
//
/////////////////////////

cnvDragstart(b, e){
	if(this.noBlocks()) return;
	this.draggroup = 'canvas';
	this.scrollState("visible");
}

cnvDragmove(t,e,x,y){
	if(this.noBlocks()) return;
	x = x / this.zoom;
	y = y / this.zoom;
	this.cnvx+=x;
	this.cnvy+=y;
	this.scrollto();
}

scrollto(){
 	var minx = Math.round((-920*2) + (cnvframe.offsetWidth /this.zoom)); 
	var miny = Math.round ((-736*2)+(cnvframe.offsetHeight/this.zoom)); 	
	if(this.cnvx>=0) {this.cnvx=0;}
	if(this.cnvx<minx) {this.cnvx=minx;}
	if(this.cnvy>=0) {this.cnvy=0;}
	if(this.cnvy<miny) {this.cnvy=miny;}
	this.blockcanvas.style.left = this.cnvx+ "px";
	this.blockcanvas.style.top =  this.cnvy + "px";
	this.setScrollbars();
}

setScrollbars(){
	var scripts = this;	
	var sizew  = cnvframe.offsetWidth;
	var sizeh  = cnvframe.offsetHeight;
	var xarea = Math.round((920*2) - (sizew /this.zoom)); 
	var yarea = Math.round((736*2) - (sizeh/this.zoom)); 	
	var w = 920*2*this.zoom;  // total width
	var ratio = (cnvframe.offsetWidth / w).trim(2); //  view ratio
	
	var vsize  = ratio*sizeh;
	this.vscroll.style.height = Math.round(vsize)+'px';
	var posy = Math.round((sizeh - vsize) * (-scripts.cnvy / yarea));
	this.vscroll.style.top = posy+'px';
	this.vscroll.style.left = (sizew - 10)+'px'; // right align
	
	var hsize = ratio*cnvframe.offsetWidth;
	this.hscroll.style.width =  Math.round(hsize)+'px';
	var posx = Math.round(( - hsize) * (-scripts.cnvx / xarea));
	this.hscroll.style.left = posx+'px';
	this.hscroll.style.top = (sizeh - 10)+'px';
}


/////////////////////////
//
// Zoom
//
/////////////////////////

setzoom(n){
	this.cnvx  = this.cnvx / this.zoom * n;
	this.cnvy = this.cnvy / this.zoom * n;
	this.blockcanvas.style.zoom = n;
	this.zoom = n;
	this.scrollto();
}

cnvDragend(t,e,x,y){
	if(this.vscroll) this.scrollState("hidden");
	this.draggroup = [];
}

toggleBlocks(){
	this.visible = !this.visible;
	turtle.img.style.visibility =  this.visible  || shifKeyDown ? '' : 'hidden';
	this.blockcanvas.style.visibility = this.visible ?'':'hidden';
	gn("zoomctrl").style.visibility = this.visible ?'':'hidden';
	gn("togglebutton").className = scripts.visible ?   "blockstoggle off" :  "blockstoggle on";
}

showblocks(){
	if (this.visible) return;
	scripts.toggleBlocks();
}

/////////////////////////
//
// block events
//
/////////////////////////

blkDragstart(b, e){
	scripts.saveForUndo();
	scripts.dx = 0;
	scripts.dy = 0;
	scripts.oldconnect = b.connections[0];
	b.disconnect();
	var dg = scripts.findGroup(b);
	for(var i in dg){
		var b = dg[i];
		b.div.parentElement.removeChild(b.div);
		frame.appendChild(b.div);
		b.setzoom(this.zoom)
		b.div.style.zIndex = 7000;
		b.moveDxDy((cnvframe.offsetLeft/this.zoom) + this.cnvx, (cnvframe.offsetTop/this.zoom) + this.cnvy);
	//	b.move(b.left,b.top)
	}
	scripts.draggroup = dg;
	scripts.isarg =  b.type == "global";
	events.handler = scripts;
}

blkDragmove(t,e,x,y){
	var dg = scripts.draggroup;
	for(var i in dg) dg[i].moveDxDy(x/this.zoom,y/this.zoom);
	this.dx+=x;
	this.dy+=y;
	if (!scripts.isarg) return;
	this.removeHatBorder();
//	var hat = Block.hatDrop(e,dg);
//	if (!hat) return;
//	this.prevhat = hat;
//	editfield.hatHighlight(this.prevhat);
}

removeHatBorder (){
	if (this.prevhat && editfield.hatmask && editfield.hatmask.parentNode)  cnvframe.removeChild(editfield.hatmask);
	this.prevhat = undefined;
}
	
blkDragend(t,e,x,y){
	var self = this;
	var dg = scripts.draggroup;
	if (dg.length == 0) return;
	for(var i in dg) dg[i].div.parentElement.removeChild(dg[i].div);
	if(ptInDiv(savebutton,x,y)){
		moveBlocks(-cnvframe.offsetLeft-this.dx, -cnvframe.offsetTop-this.dy);
		saveStack(scripts.draggroup);
	} else if(ptInDiv(cnvframe,x,y)) moveBlocks((-cnvframe.offsetLeft/this.zoom) - this.cnvx,(-cnvframe.offsetTop/this.zoom)- this.cnvy);
	if (scripts.isarg) this.removeHatBorder();
	var hat = Block.hatDrop(e,dg);
	if(hat) Block.addArg(hat,dg[0]);
	else if(dg[0].type=='arg') Block.removeArg(dg[0]);
	else scripts.snapToDock(dg);
	scripts.draggroup = [];
	palette.updateProcs();

	function moveBlocks(dx,dy){	
		for(var i in dg){
			var b = dg[i];
			self.blockcanvas.appendChild(b.div);
			b.moveDxDy(dx,dy);
			b.setzoom(1);
			b.div.style.zIndex = 0;
		}
	}

	function saveStack(blocks){
		var name = 'stack';
		var tb = scripts.findTopBlock(blocks[0]);
		if((tb.type=='start')&&(tb.value!='')) name = tb.value;
		var str = project.blocksString(blocks);
		var a = document.createElement('a');
		a.href = 'data:text/plain;charset=UTF-8,'+encodeURIComponent(str);
		a.download = name+'.txt';
		frame.appendChild(a);
		a.click();
		frame.removeChild(a);
	}

} 


/////////////////////////
//
// scroll bars
//
/////////////////////////

createScrollbars(){
	this.vscroll = document.createElement('div');
	this.vscroll.className = 'vscroll';
	this.vscroll.style.left = (cnvframe.offsetWidth-15)+'px';
	cnvframe.appendChild(this.vscroll);
	this.hscroll = document.createElement('div');
	this.hscroll.className = 'hscroll';
	this.hscroll.style.top = (cnvframe.offsetHeight-15)+'px';
	cnvframe.appendChild(this.hscroll);
	this.setScrollbars();
}

onwheel(e){
//	e.preventDefault(); 
//	e.stopPropagation();
	mousedown(e);
	scripts.cnvDragmove(null,null,-e.deltaX,-e.deltaY);
}

scrollState  (state){
	this.hscroll.style.visibility = state;
	this.vscroll.style.visibility = state;
}

/////////////////////////
//
// snapping
//
/////////////////////////

snapToDock(group){
	this.snapToTopDock(group)
//	if(scripts.snapToTopDock(group)) return;
//	scripts.snapToBottomDock(group);
}

snapToTopDock(group){
	var t = this;
	var me = group[0];
	var d=15, bestxy,bestmyn,bestyou,bestyourn;
	var blks = t.getBlocks();
	for(var myn=0;myn<me.dockCount();myn++){
		for(var i in blks){	
			var you = blks[i];
			if(group.indexOf(you)!=-1) continue;
			for(var yourn=0;yourn<you.dockCount();yourn++){
//        console.log (t.dockDxDy(me, myn, you,yourn),me.type, myn, you.type,yourn);
				var thisxy = t.dockDxDy(me, myn, you,yourn);
  			if(abs(thisxy)>=d) continue;
				d = abs(thisxy);
				bestxy = thisxy;
				bestmyn = myn;
				bestyou = you, bestyourn = yourn;
			}
		}
	}
	if(d<15){
		for(var i in group) group[i].moveDxDy(bestxy[0], bestxy[1]);
		t.snapReplace(me, bestmyn, bestyou, bestyourn); 
		me.connections[bestmyn] = bestyou;
		bestyou.connections[bestyourn] = me;
	}
}

dockDxDy(me, myn, you, yourn){
	var t = this;
	if(me==you) return [100,100];
	if((myn==0)==(yourn==0)) return [100,100];
	var mydock = me.docks()[myn];
	var yourdock = you.docks()[yourn];
	if(mydock[0]!=yourdock[0])  return [100,100];
	if((myn!=0)&&(me.connections[myn]!=undefined)) return [100,100];
//	if((myn!=0)&&(you.connections[0]!=undefined)&&(me.docks()!=you.connections[0].docks())) return [100,100];
	if((myn!=0)&&(you.connections[0]!=undefined)) return [100,100];
	if(isWideShape(you)&&(!isInputShape(me))&&(yourn<3)) return [100,100];
	var l = t.findBottomBlock(me);
	if((you.connections[yourn]!=undefined)&&((l.docks()[l.dockCount()-1][0])=='unavailable')) return [100,100];
	var dx = (you.left+yourdock[1])-(me.left+mydock[1]);
	var dy = (you.top+yourdock[2])-(me.top+mydock[2]);
	return [dx,dy];

	function isInputShape(b){return b.docks()==defs.docks['input'];}

	function isWideShape(b){
		var docks = b.docks();
		if(docks==defs.docks['comp']) return true;
		if(docks==defs.docks['random']) return true;
		return false;
	}
}


snapReplace(me, myn, you, yourn){
	var t = this;
	var old = you.connections[yourn];
	if(!old) return;
	if(t.shouldInsert(me, myn, you, yourn)) t.insert(me, myn, you, yourn);
	else if(t.shouldReplace(me, old)) t.replace(me, old);
  else t.removeBlocks(old);
}

shouldReplace(me, old){
	if(old.docks()!=me.docks()) return false;
	if((me.docks()[0][0]=='flow')&&(me.docks().length==2)) return false;
	for(var myn=0;myn<me.dockCount();myn++){
		if(me.connections[myn]!=undefined) return false;
	}
	return true;
}

replace(me, old){
	for(var i=1;i<me.dockCount();i++){
		var oldarg = old.connections[i];
		if(me.connections[i]){
			if(oldarg) t.removeBlocks(oldarg);
		} else {
			me.connections[i] = oldarg;
			if(oldarg) oldarg.connections[oldarg.connections.indexOf(old)] = me;
		}
	}
 	if (old.div) old.div.parentNode.removeChild(old.div);
}

shouldInsert(me, myn, you, yourn){
	if(myn!=0) return false;
	if((me.docks()[0][0])!='flow') return false;
	if(you.connections[yourn]==undefined) return false;
	var l = scripts.findBottomBlock(me);
	if((l.docks()[l.dockCount()-1][0])!='flow') return false;
	return true;
}

insert(me, myn, you, yourn){
	var old = you.connections[yourn];
	if(scripts.shouldReplace(me, old)){scripts.replace(me, old); return;}
	old.disconnect();
	var b = scripts.findBottomBlock(me);
	b.connections[b.dockCount()-1] = old;
	old.connections[0] = b;
	project.layoutStack(me);
}


/////////////////////////
//
// undo/redo
//
/////////////////////////

saveForUndo(){
	scripts.undos.push(project.allBlocks());
	scripts.redos = [];
	//localStorage.setItem("webturtleart", project.projectString());
}

undo(){
	var str = scripts.undos.pop();	
	if (!str) {
		var str = localStorage.getItem("webturtleart");
		if (str) project.loadFile(str, "undefined")
	}
	else  {
		scripts.redos.push(project.allBlocks());
		project.dropStacks(str);	
	}
}
	
redo(){
	var str = scripts.redos.pop();
	if (!str) return;
	scripts.undos.push(project.allBlocks());
	project.dropStacks(str);		
}


/////////////////////////
//
// stacks
//
/////////////////////////


findGroup(b){
	var res = new Array();
	gatherStackBlocks(b, res);
	return res;

	function gatherStackBlocks(p, res){
		res.push(p);
		for(var i in p.connections){
			if(i==0) continue;
			var b = p.connections[i];
			if(b==undefined) continue;
			gatherStackBlocks(b,res);
		}
	}
}

findTopBlock(b){
	while(b.connections[0]!=undefined) b=b.connections[0];
	return b;
}

findBottomBlock(b){
	while(b.lastDock()!=undefined) b=b.lastDock();
	return b;
}

getBlocks(){
	var res = new Array();
	var sc = this.blockcanvas;
	for(var i=0;i< sc.children.length;i++){
		var b = sc.children[i].jsobj;
		if (!b) continue;
		if (!b.type) continue;
	//	if (b.isCaret) continue;
		res.unshift(b);  // list backwards
	}
	return res;
}

findStartBlocks(){
	var res = new Array();
	var blks = this.getBlocks();
	for(var i in blks) {
		var b = blks[i];
		if(b.type.substring(0,5)!='start') continue;
		if (b.type == 'startfill') continue;
		if(b.value=='') continue; 
		res.push(b);
	}
	return res;
}

findBlocks(type){
	var res = new Array();
	var blks = this.getBlocks();
	for(var i in blks) {
		var b = blks[i];
		if(b.type != type) continue;
		res.push(b);
	}
	return res;
}


findStartingBlock(){
	var blks = scripts.getBlocks();

	 // Exploratorium request
	 for(var i in blks){
		 var b = blks[i];
		 if (b.type=='onplay')return b;
		 if ((b.type == "start") && (b.value == "onplay")) return b;
	 }

	for(var i in blks){
		var b = blks[i];
		if(b.connections[0]!=undefined) continue;
		if(b.docks()[0][0]!='flow') continue;
		if((b.type=='clean')&&(b.connections[1]!=undefined)) return b;
		if(b.type=='fillscreen') return b;
	}
	for(var i in blks){
		var b = blks[i];
		if(b.connections[0]!=undefined) continue;
		if(b.docks()[0][0]!='flow') continue;
		if(b.type=='clean') continue;
		return b;
	}
}

findStartNames(block){
	var res = [];
	var blks = this.getBlocks();
	for(var i in blks){
		var b = blks[i];
		if (b && (block == b)) continue;
		if ((b.type.indexOf('start') == 0) && b.value)  res.push(b.value);
	}
	return res;
}

removeBlocks(b){
	b.disconnect(); 
	var g = this.findGroup(b);
	for(var i in g) g[i].div.parentNode.removeChild(g[i].div);
}

noBlocks(){
	var blks = this.getBlocks();
	if(blks.length==0) return true;
	return blks[0].div.style.visibility=='hidden';
}

restack(b){
	this.blockcanvas.appendChild(b.div)
	var c = b.connections;
	for(var i=1;i<c.length;i++){
		if(c[i]!=undefined) this.restack(c[i]);
	}
}

/////////////////////////
//
//  help
//
/////////////////////////

openHelp (b){
	var type = b.sig.split(':')[0]
	var size = {width: 540, height: 293}
 	switch(type){
	 case 'global':
	 case 'setglobal':
		size = {width: 600, height: 354}
		break;
	 case 'fillscreen':
		size = {width: 538, height: 400}
		break;
	}	
	var dx = cnvframe.offsetLeft + Math.round ((cnvframe.offsetWidth - size.width) / 2);
	var dy =  Math.round ((cnvframe.offsetHeight - size.height) / 2);

 	switch(type){
	 case 'arg':
		this.help(scripts.findTopBlock(type), dx, dy);
		break;
	 case 'global':
		this.help(b.value, dx, dy);
		break;
	 case 'setglobal':
		this.help('set'+b.value, dx, dy);
		break;
	 case 'fillscreen':
		this.help('fillscreen', dx, dy);
		break;
	 default: this.help(type, dx, dy); break;
	 }
}

help (cmd, dx, dy){
	this.closeHelp();
	this.iframe = newHTML("iframe", "helpframe", frame);
	this.iframe.style.zIndex = 1000000;
  this.iframe.src = "help/"+cmd+".html";
  let c = this.iframe;
  c.style.left = dx + "px";
	c.style.top = dy + "px";
	var test = function () {
		var div  = 	!c.contentDocument ? null :	c.contentDocument.body.childNodes[1]; 
		if (div == null) setTimeout (test, 100);
		else doNext(div);
  }
  setTimeout (test, 100);

  function doNext (div) {	
		c.style.width =  div.offsetWidth + "px";
		c.style.height = div.offsetHeight + "px";
  }
}

closeHelp(){
	if (this.iframe && this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
	this.iframe = undefined;
}

}

