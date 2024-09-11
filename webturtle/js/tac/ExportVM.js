class ExportVM {

constructor(exporter){
	this.timeoutid = undefined;
	this.state = this.getState()
	this.setState({boxes: {box1: 0, box2: 0, box3: 0}, seed: random.seed, startseed: random.startseed})
	this.turtle = exporter
}

restore (){
	this.turtle.restore();
	this.setState(this.state)
}

getState(){
	let res  = {}
	var obj = {}
	for (let key in runtime.boxes) obj[key] = runtime.boxes[key]
	res.boxes = obj
	res.seed = random.seed;
	return res;	
}

setState(obj){
	let boxes = obj.boxes
	for (let key in obj) runtime.boxes[key] = boxes[key] 
	random.seed = obj.seed;
	random.startseed = obj.startseed;
}

stopStack(){
	this.cancelTimeout();
	this.thisBlock = undefined;
	this.waittime = 0;	
	this.stepsize = 0;
}

cancelTimeout(){
	if (this.timeoutid) clearTimeout (this.timeoutid)
	this.timeoutid = undefined;
}

runStack(b){
	if (!b) return;
	var t = this;
	runtime.stopStack();
	t.state = t.getState()
//	random.seed = random.startseed;
	runtime.thisBlock = b;
	try {t.runSome();} catch (e) {console.log (e); t.stopStack(); runtime.stopStack();}
}

runSome(){
	var rt = Exporter.runtime;
	var endtime= now()+50;
	for(var i=0;i<500;i++){
		if(now()>endtime) break;
		while (runtime.thisBlock==undefined){
			if(runtime.stack.length==0) break;
			var cmd = runtime.stack.pop();
			rt.runprim(cmd);
		}
		if (runtime.thisBlock==undefined) break;
		var b = runtime.thisBlock;
		runtime.thisBlock = runtime.thisBlock.connections[runtime.thisBlock.connections.length-1];
		rt.runprim(b);
	}
	if (Exporter.pc && Exporter.pc.done) rt.turtle.drawSVG();
	if (runtime.stack.length>0||runtime.thisBlock!=undefined) rt.timeoutid = setTimeout(rt.runSome, 20);
	else rt.turtle.drawSVG();
}

runprim(b){
	if (typeof b  == "string") prims[b]();
	else if (this.turtle[b.type]) this.turtle[b.type](b)
	else if(prims[b.type]) prims[b.type](b);
	else console.warn(b.type+' not defined');
}

isActive(){
	return (runtime.stack.length>0||runtime.thisBlock!=undefined);
}

}
