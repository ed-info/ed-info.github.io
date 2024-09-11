class Runtime {

constructor(){
	this.thisBlock = undefined;
	this.stack = [];
	this.boxes = {box1: 0, box2: 0, box3: 0};
	this.procs = {};
	this.stack = [];
	this.waittime = 0;
	this.stepsize = 0;
	this.steptime = 5000;
	this.timeoutid = undefined;
}

stopStack(){
	this.cancelTimeout();
	if ((this.stack.length > 0)  && (this.stepsize != 0)) this.stopStepping();
	this.thisBlock = undefined;
	this.stack = [];
	this.waittime = 0;	
	this.stepsize = 0;
	gn('playbutton').className =  "playicon on";
}

stopStepping (){
	var t = this;
	var cmd = t.stack.pop();
	if (cmd != 'doStep') return;
	var t = runtime;
	var b = t.stack.pop();
	var n = t.stack.pop();
	if (b.stepping) turtle [b.stepping.fcn](b.stepping.end);
	turtle.move();
}

cancelTimeout(){
	if (this.timeoutid) clearTimeout (this.timeoutid)
	this.timeoutid = undefined;
}

isRunning (){return this.stack.length>0||this.thisBlock!=undefined;}

runStack(b){
	if (!b) return;
	var t = this;
	t.stopStack();
	random.startseed = random.seed;
	var boxes = JSON.stringify(runtime.boxes);
	var n = UI.getTimming(b);
	t.stepsize = n;
	t.stack = new Array();
	t.thisBlock = b;
	if(b.info.docktype=='input') this.display(this.evalNumberBlock(b));
	else {
		playbutton.className =  "playicon off";
		random.seed = random.startseed;
		runtime.boxes = JSON.parse(boxes);
		t.runSome();
	}
}

runSome(){
	var t = runtime;
	var endtime= now()+50;
	for(var i=0;i<500;i++){
		if(now()<t.waittime) break;
		if(now()>endtime) break;
		while (t.thisBlock==undefined){
			if(t.stack.length==0) break;
			var cmd = t.stack.pop();
	//		console.log (cmd)
			prims[cmd]();
		}
		if (t.thisBlock==undefined) break;
		var b = t.thisBlock;
		t.thisBlock = t.thisBlock.connections[t.thisBlock.connections.length-1];
	//	console.log (b.type)
		if(prims[b.type]) prims[b.type](b);
		else console.warn(b.type+' not defined');
	}
	turtle.move();
	if (t.stack.length>0||t.thisBlock!=undefined) t.timeoutid = setTimeout(t.runSome, 20);
	else {
		playbutton.className =  "playicon on";
	//	console.log (project.name, timer()/1000, "sec");
	} 
}

display(n){
	if(isNaN(n)) return;
	footer.innerHTML=runtime.trimNum(n);
	footer.style.visibility='visible';
}

getnum(p,dockn){
	var b = p.connections[dockn];
	if (!b) return runtime.getDefaultArg(p, dockn);
	return runtime.evalNumberBlock(b);
}

getbool(p,dockn){
	var b = p.connections[dockn];
	if (!b) return false;
	return prims[b.type](b);
}

evalNumberBlock(b){
	var n = 0;
	if(prims[b.type]) n = prims[b.type](b);
	else console.log(b.type+' not defined');
	while(true){
		var infixop = runtime.numAfter(b);
		if(infixop==undefined) return n;
		if(infixop.type=='cpar') return n;
		b = infixop.connections[1];
		if(b==undefined) return prims[infixop.type](n,0);
		else n=prims[infixop.type](n,prims[b.type](b));
	}
}

numAfter (b){
	var opened = 1;
	if(b.type!='opar') return b.connections[b.connections.length-1];
	while(true){
		b = b.connections[b.connections.length-1];
		if(b==undefined) return b;
		if(b.type=='opar') opened++;
		if((b.type=='cpar')&&(opened--==1)) return b.connections[1];
	}
}

getDefaultArg(b,dockn){
	var arg = b.info.args;
	if(typeof(arg)=='number') return arg;
	if(typeof(arg)=='object') return arg[dockn-1];
	return 0;
}

repeat(b){
	var t = runtime;
	var n = Math.floor(t.getnum(b,1));
	if(n<1) return;
	t.stack.push(t.thisBlock);
	t.stack.push(n);
	t.thisBlock = b.connections[2];
	t.stack.push(t.thisBlock);
	t.stack.push('repeatAgain');
}

repeatAgain(){
	var t = runtime;
	var b = t.stack.pop();
	var n = t.stack.pop();
	n--;
	if(n>0){
		t.stack.push(n);
		t.thisBlock = b;
		t.stack.push(t.thisBlock);
		t.stack.push('repeatAgain');
	}
	else t.thisBlock = t.stack.pop();
}

forever(b){
	var t = runtime;
	if(b.connections[1]==undefined) return;
	t.thisBlock = b.connections[1];
	t.stack.push(t.thisBlock);
	t.foreverAgain();
}

foreverAgain(){
	var t = runtime;
	var b = t.stack.pop();
	t.thisBlock = b;
	t.stack.push(t.thisBlock);
	t.stack.push('foreverAgain');
}

prim_if(b){
	var t = runtime;
	var bool = t.getbool(b,1);
	if(bool){
		t.stack.push(t.thisBlock);
		t.stack.push('ifDone');
		t.thisBlock = b.connections[2];	
	}
}

ifDone(){runtime.thisBlock=runtime.stack.pop();}

prim_print(b){
	var n = runtime.getnum(b,1);
	footer.innerHTML=runtime.trimNum(n);
	footer.style.visibility='visible';
}

procedure(b){
	var t = runtime;
	var sig = b.sig.split(':');
	var vals = [];
	for(var a=0;a<sig.length-1;a++) vals.push(t.getnum(b, a+1));
	for(var i=1;i<sig.length;i++){
		var v = sig[i];
		t.stack.push(t.boxes[v]);
		t.stack.push(v);
		t.boxes[v] = vals[i-1];
	}
	t.stack.push(sig.length-1);
	t.stack.push(t.thisBlock);
	t.stack.push('procDone');
	t.thisBlock = t.procs[b.value];
	if (t.thisBlock  ==  undefined) t.errormessage("I don't know how to "+ b.value);
}

errormessage (str){
	footer.innerHTML=str;
	footer.style.visibility='visible';
}

procDone(){
	var t = runtime;
	t.thisBlock = t.stack.pop();
	var argn = t.stack.pop();
	for(var i=0;i<argn;i++){
		var v = t.stack.pop();
		var val = t.stack.pop();
		t.boxes[v] = val;
	}
//	console.log ("procedure", t.boxes)
}

procStop(b){
	var t = runtime;
	t.thisBlock = undefined;
	while((t.stack.length>0)&&(t.stack[t.stack.length-1]!='procDone')) t.stack.pop();
}

updateProcs(){
	this.procs = {};
	var starts = scripts.findStartBlocks();
	for (var i=0;i<starts.length;i++)  {
		var start = starts[i];
		this.procs[start.value] = start;
	}
	var list  = scripts.findBlocks('onplay');
	if (list.length > 0 )  this.procs['onplay'] = list[0]; // Exploratorium request
}

trimNum(x){
	if(typeof x=='boolean') return x.toString();
	return Math.round(x*100)/100;
}

forwardstep(b, n){	
	var t = runtime;
	var count = t.stepsize;
	if (n == 0) {turtle.forward(0); runtime.waittime = now()+ (count * 15); return;} 
	var block = new Block('forward');
	var obj = {}
	for (let item in block.info) obj[item] = block.info[item]
	obj.args =  n/count;	
	block.info = obj;
	block.stepping = {start: turtle.getpos(0), end: turtle.getpos(n), fcn: 'forwarddone'}
	block.type = 'forwardslow';
	t.stack.push(t.thisBlock);
	t.stack.push(count);
	t.stack.push(block);
	t.thisBlock = block;
	t.stack.push('doStep');
}

turnstep(b, n){
	var t = runtime;
	var count = t.stepsize;
	if (n == 0) {runtime.waittime = now()+ (count * 15); return;} 
	var block = new Block('right');
	var obj = {}
	for (let item in block.info) obj[item] = block.info[item]
	obj.args =  n/count;
	block.info = obj;
	block.stepping = {start: turtle.heading, end: turtle.heading+n, fcn: 'turndone'}
	block.type = 'rightslow';
	t.stack.push(t.thisBlock);
	t.stack.push(count);
	t.stack.push(block);
	t.thisBlock = block;
	t.stack.push('doStep');
}

arcstep(b, a, r){
	var t = runtime;
	var count = t.stepsize;
	var block = new Block('arc');
	var obj = {}
	for (let item in block.info) obj[item] = block.info[item]
	obj.args =  [a/count, r];
	block.info = obj;
	block.type = 'arcslow';
	t.stack.push(t.thisBlock);
	t.stack.push(count);
	t.stack.push(block);
	t.thisBlock = block;
	t.stack.push('doStep');
}

doStep(){
	var t = runtime;
	var b = t.stack.pop();
	var n = t.stack.pop();
	n--;
	if(n>0){	
		t.stack.push(n);
		t.stack.push(b);
		t.waittime = now()+10;
		t.thisBlock = b;
		t.stack.push('doStep');	
	}
	else  {
		if (b.stepping) turtle [b.stepping.fcn](b.stepping.end);
		t.thisBlock = t.stack.pop();
		t.waittime = 0;
	}
}



}

var prims = {};

prims['clean'] = function(b){turtle.clean();}
prims['onplay'] = function(b){turtle.clean();} // Exploratorium request


prims['forward'] = function(b){ 
//	console.log ("forward", runtime.getnum(b,1))
	if (runtime.stepsize !=0) runtime.forwardstep (b, runtime.getnum(b,1));
	else turtle.forward(runtime.getnum(b,1));
}

prims['back'] = function(b){
	if (runtime.stepsize !=0) runtime.forwardstep (b, -runtime.getnum(b,1));
	else turtle.forward(-runtime.getnum(b,1));
}

prims['right'] = function(b){
	if (runtime.stepsize !=0) runtime.turnstep (b, runtime.getnum(b,1));
	else turtle.seth(turtle.heading+runtime.getnum(b,1));
}

prims['left'] = function(b){
	if (runtime.stepsize !=0) runtime.turnstep (b, -runtime.getnum(b,1));
	else turtle.seth(turtle.heading-runtime.getnum(b,1));
}

prims['arc'] = function(b){ 
	if (runtime.stepsize !=0) runtime.arcstep (b, runtime.getnum(b,1),  runtime.getnum(b,2));
	else turtle.arc(runtime.getnum(b,1), runtime.getnum(b,2));
}

prims['doStep'] = function(b){runtime.doStep();}

prims['forwardslow'] = function(b){ turtle.forward(runtime.getnum(b,1));}
prims['rightslow'] = function(b){turtle.seth(turtle.heading+runtime.getnum(b,1));}
prims['arcslow'] = function(b){
	turtle.arc(runtime.getnum(b,1), runtime.getnum(b,2));
}


prims['seth'] = function(b){turtle.seth(runtime.getnum(b,1));}
prims['setxy'] = function(b){turtle.setxy(runtime.getnum(b,1),runtime.getnum(b,2));}
prims['xcor'] = function(b){return turtle.xcor;}
prims['ycor'] = function(b){return turtle.ycor;}
prims['heading'] = function(b){return turtle.heading;}

prims['setpensize'] = function(b){turtle.setpensize(runtime.getnum(b,1));}
prims['setcolor'] = function(b){turtle.setcolor(runtime.getnum(b,1));}
prims['setshade'] = function(b){turtle.setshade(runtime.getnum(b,1));}
prims['pendown'] = function(){turtle.pendown=true;}
prims['penup'] = function(){turtle.pendown=false;}
prims['startfill'] = function(b){turtle.startfill();}
prims['endfill'] = function(b){turtle.endfill();}
prims['fillscreen'] = function(b){turtle.fillscreen(runtime.getnum(b,1),runtime.getnum(b,2));}
prims['color'] = function(b){return turtle.color;}
prims['shade'] = function(b){return turtle.shade;}
prims['pensize'] = function(b){return turtle.pensize;}

prims['number'] = function(b){return parseFloat(b.value);}
prims['plus'] = function(a,b){return a+b;}
prims['minus'] = function(a,b){return a-b;}
prims['product'] = function(a,b){return a*b;}
prims['division'] = function(a,b){return (b!=0)?a/b:0;}
prims['remainder'] = function(a,b){if(isNaN(Number(a))) a=0; if(isNaN(a.mod(b))) return 0; return a.mod(b);}
prims['random'] = function(b){return random.pickRandom(runtime.getnum(b, 1), runtime.getnum(b, 2));}
prims['oneof'] = function(b){return random.oneof(runtime.getnum(b, 1), runtime.getnum(b, 2));}
prims['print'] = function(b){runtime.prim_print(b);}

prims['less'] = function(b){return runtime.getnum(b,1)<runtime.getnum(b,2);}
prims['greater'] = function(b){return runtime.getnum(b,1)>runtime.getnum(b,2);}
prims['equal'] = function(b){return Math.abs(runtime.getnum(b,1)-runtime.getnum(b,2))<1e-9;}

prims['opar'] = function(b){return runtime.getnum(b,1);}
prims['cpar'] = function(b){}

prims['repeat'] = function(b){runtime.repeat(b);}
prims['repeatAgain'] = function(b){runtime.repeatAgain();}
prims['forever'] = function(b){runtime.forever(b);}
prims['foreverAgain'] = function(b){runtime.foreverAgain();}
prims['if'] = function(b){runtime.prim_if(b);}
prims['ifDone'] = function(b){runtime.ifDone();}
prims['wait'] = function(b){runtime.waittime = now()+runtime.getnum(b, 1)*100;}

prims['hspace'] = function(b){}
prims['vspace'] = function(b){}

prims['setglobal'] = function(b){runtime.boxes[b.value] = runtime.getnum(b,1);}
prims['global'] = function(b){return runtime.boxes[b.value];}

prims['start'] = function(b){if (b.value == "onplay") {turtle.clean();};}
prims['start1'] = function(b){}
prims['start2'] = function(b){}
prims['procedure'] = function(b){runtime.procedure(b);}
prims['procedure1'] = function(b){runtime.procedure(b);}
prims['procedure2'] = function(b){runtime.procedure(b);}
prims['procDone'] = function(b){runtime.procDone();}
prims['stop'] = function(b){runtime.procStop();}
