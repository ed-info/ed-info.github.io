class Events {

constructor(){
	this.dragged=false;
	this.dragx=0;
	this.dragy=0;
	this.jsobj= undefined;
	this.handler= undefined;
	this.startPt = undefined;
	this.mouseDownTime= 0;
	this.timeoutEvent =  undefined;
//	var istouchscreen = window.navigator.maxTouchPoints > 0;
	this.dispatch = {};	
	this.dispatch["start"] = "onmousedown";
	this.dispatch["move"] = "onmousemove";
	this.dispatch["end"] = "onmouseup";
	this.dispatch["cancel"] = "onmouseout";
}

setup(el){	
	var self = this;
	el[self.dispatch["start"]] = this.mouseDown;
	el[self.dispatch["move"]] = this.mouseMove;
	el[self.dispatch["end"]] = this.mouseUp;
	el.draggable = true;
	el.ondragstart = events.dragout;
}

dragout(e){
	var b = events.findJSObj(e.target);
	var g = scripts.findGroup(b);
	var str = project.blocksString(g);
	e.dataTransfer.setData("text", str);
}

mouseDown(e){
	events.deleteTimeout();
	if(e.shiftKey) return;
	e.preventDefault(); 
	e.stopPropagation();
	if (e.button == 2) return;
	var t = events;
	var tg = t.getTarget (e);
	var obj = t.findJSObj(tg);
	if(obj==undefined) return;
	t.jsobj = obj;
	t.handler = obj;
	t.dragx = Math.round(e.clientX);
	t.dragy = Math.round(e.clientY);
	if(mousedown) mousedown(e);
	if (obj.onhold) obj.onhold()
}

mouseMove(e){
	if (e.shiftKey) return;
	var t = events;
	if(t.jsobj==undefined) return;
	var obj = t.jsobj;
	var ptx = Math.round(e.clientX);
	var pty = Math.round(e.clientY);
	var dx = ptx-t.dragx; 
	var dy = pty-t.dragy;
	if (!t.dragged) {
		if(abs(dx,dy)<7) return;
		events.deleteTimeout()
		if (t.handler.dragstart) t.handler.dragstart(obj,e,t.dragx,t.dragy);
		t.dragged = true;
	} else {
		if (t.handler.dragmove) t.handler.dragmove(obj,e,dx,dy);
		t.dragx = ptx;
		t.dragy = pty;
	}
	
	function abs(dx, dy){ return Math.round(Math.sqrt((dx*dx)+(dy*dy)));}
}

deleteTimeout(){
	if (this.timeoutEvent) clearTimeout(this.timeoutEvent);
	this.timeoutEvent =  undefined;
}
		
clearEvents (){
	this.deleteTimeout();
	this.jsobj=undefined;
}

mouseUp(e){
	events.deleteTimeout();
	var t = events;
	var obj = t.jsobj;
	e.preventDefault(); 
	e.stopPropagation();
	if(t.jsobj==undefined) return;
	if (t.dragged){
		if (t.handler.dragend) t.handler.dragend(obj,e,t.dragx, t.dragy);
	} else {
		if (t.handler.click) t.handler.click(obj,e);
	}
	t.handler = undefined;
	t.jsobj = undefined;
	t.dragged = false;
}

findJSObj(e){
	while(true){
		if(e==undefined) return e;
		if(e.jsobj) return e.jsobj;
		e = e.parentElement;
	}
}

getTarget (e){
	var targobj = events.findJSObj(e.target); 
	if(!(targobj instanceof Scripts)) return e.target
	var x = Math.round(e.clientX);
	var y = Math.round(e.clientY);
	var rect = turtle.element.getClientRects()[0]
	var r = new Rectangle (rect.x, rect.y, rect.width, rect.height)
	var pt =  new Vector (x, y)
	if (r.hitRect(pt)) return turtle.element;
	return e.target
}

}
