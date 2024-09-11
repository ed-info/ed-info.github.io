var checkit;

class Project {

constructor(){
	this.name = 'untitled';
}

allBlocks(){
	return this.blocksString(scripts.getBlocks());
}

/////////////////////////
//
// Load
//
/////////////////////////

loadFile(str, name){
	localStorage.setItem("webturtleart",str);
	var t = this;
	str = str.substr(1,str.length-2);
	var list = Tokenizer.parse(str);
	t.restoreTurtle(list[3]);
	project.name = (list[4]==undefined)?name.replace(/.png\b/,''):list[4];
	var records = list[0];
	var blocks = new Array();
	t.removeAllBlocks();
	scripts.cnvx = 0;
	scripts.cnvy = 0;
	scripts.blockcanvas.style.left = "0px";
	scripts.blockcanvas.style.top =  "0px";
	scripts.undos = [];
	scripts.redos = [];
	t.addBlocks(records, blocks);
	t.connectBlocks(records, blocks);
	t.layoutBlocks(records, blocks);
	palette.updateProcs()
}

dropText(str,x,y){
	var t = this;
	str = str.substr(1,str.length-2);
	var records = Tokenizer.parse(str);
	var blocks = new Array();
	t.addBlocks(records, blocks);
	t.connectBlocks(records, blocks);
	var hat = scripts.findTopBlock(blocks[0]);
	if (x) hat.move(x, y);	
	t.layoutStack(hat);		
	if(blocks[0]){
		var tb = scripts.findTopBlock(blocks[0]);
		var isstart = (tb.type=='start') || tb.sig.indexOf("start:") > -1;
		if(isstart &&(runtime.procs[tb.value])) tb.setText('');
	}
	palette.updateProcs();
}

dropStacks(str){
	var t = this;
	t.removeAllBlocks();
	runtime.procs = {};
	str = str.substr(1,str.length-2);
	var records = Tokenizer.parse(str);
	var blocks = new Array();
	t.addBlocks(records, blocks);
	t.connectBlocks(records, blocks);
	t.layoutBlocks(records, blocks);
	palette.updateProcs();
}

removeAllBlocks(){
	var blks = scripts.getBlocks();
	for(var i=0;i<blks.length; i++) blks[i].div.parentNode.removeChild(blks[i].div);
}

addBlocks(records, blocks){	
	for(var i=0;i<records.length;i++){
		var block = records[i];
		var type = block[0], x=block[1]*.9, y=block[2]*.9, label=block[3][0];
		if (UI.digitalfab && (label == "onplay") && (type  == "start")) { // Exploratorium request
			type  = "onplay";
			label =  undefined
		}
		var b = new Block(type);
		b.move(x, y);
		scripts.blockcanvas.appendChild(b.div);
		if(label!=undefined) b.setText(label);
		else if (b.type=='start') b.setText("");
		blocks.push(b);
	}
}

connectBlocks(records, blocks){
	for(var i=0;i<records.length;i++){
		var block = blocks[i];
		var record = records[i];
		var you = blocks[record[4]];
		if (you==undefined) continue;
		var yourdock = record[5];
		block.connections[0] = you;
		you.connections[yourdock] = block;
	}
}

layoutBlocks(records, blocks){
	for(var i=0;i<records.length;i++){
		var r = records[i];
		var parent = r[4];
		var pdock = r[5];
		if(pdock=='') this.layoutStack(blocks[i]);
	}
}

layoutStack(b){
	for(var i=1;i<b.connections.length;i++) this.resetConnection(b, i, b.connections[i]);
	scripts.restack(b);
}

resetConnection(parent, i, block){
	if(!block) return;
	var x = parent.left;
	var y = parent.top;
	var pdock = parent.docks()[i];
	var bdock = block.docks()[0];
	var newx =  x+pdock[1]-bdock[1];
	var newy =  y+pdock[2]-bdock[2];
	block.move(newx, newy);
	this.layoutStack(block);
}

restoreTurtle(r){
//	console.log("restoreTurtle", r);
	turtle.setxy(Number(r[0]),Number(r[1]));
	turtle.seth(Number(r[4]));
	if(r.length>5) {
		random.seed = r[5];
		random.startseed = random.seed;
	}
	turtle.move();
}

/////////////////////////
//
// Save
//
/////////////////////////

projectString(){
	var bdata  = this.allBlocks();
	var s = '['+ bdata +' || [box1 box2 box3] ['+
	        turtle.xcor+' '+turtle.ycor+' true 16711680 '+turtle.heading+' '+random.startseed+
	        ']|'+project.name+'|]';
	return s;
}

/////////////////////////
//
// Blocks to SVG
//
/////////////////////////

blocksToSVG(){
	var blocks = scripts.getBlocks()
	var top = SVG.top(792, 612)
	var group =  SVG.addChild(top, 'g');	
	var totalrect = new Rectangle ()
	for (let i=blocks.length-1; i > -1; i--) {
		let block = blocks[i];
		var xml =  this.getBlockSVG(block, (i+1)*10)
		var b = xml.children[0]
		var rect = getRect(block.div.getBoundingClientRect());
		totalrect =  totalrect.union (rect)
		var mtx ="matrix("+ 1 +" 0 0 " + 1 +" " + rect.x + " " + rect.y+")" ;
		b.setAttribute("transform", mtx);	
		group.appendChild(b)

	}	
	this.savesvg(top)
	function getRect (r){
		return new Rectangle(r.x,r.y, r.width,r.height)
	}
}

getBlockSVG (block, n){
	var sig = block.sig
	var img  = block.div.childNodes[0];
	var base64 = img.src.split("svg+xml;base64,")[1];
	var svgstr = b64ToUtf8 (base64);	
	var m = sig.replace (/:/g, "_")
	svgstr = svgstr.replace (/SVGID_1_/g, m+"_"+n) ;
	var xmlDoc = (new DOMParser()).parseFromString(svgstr, "text/xml");
	var node = document.importNode(xmlDoc.documentElement, true);
	if (block.sig == "number")  return processNum(node, 3)
	else if (block.sig == "arg")  return processNum(node, 3)
	else if (block.sig == "global")  return processNum(node, 3)
	else if (block.sig == "setglobal")  return processNum(node, 3)
	else if (block.type == "procedure")  return processNum(node, 3)
	else if (block.type == "start")  return processNum(node, 3)
	return node;
	function b64ToUtf8 (str) {return decodeURIComponent(escape(atob(str)));}
	
	function processNum (node, n) {
		for (let i = 0 ;  i < node.children.length; i++ ){
			var kid =  node.children[i];
			var type  = kid.nodeName;
			switch (type) {
				case 'g': processNum(kid, n); break;
				case "text":
					var obj =  new Object();
					var ystr  = kid.getAttribute("y")
					var y =  ystr.split ("px")[0]
					y = Number(y);
				  kid.setAttribute("y", (y + n)+"px")
				  kid.removeAttribute ("alignment-baseline")
					break;
				default: break;
			}
		}
		return node;
	}
}

savesvg(elem, sig){
	var name = prompt('Save Image As', project.name);
	if(name==null) return;
	var str =  (new XMLSerializer()).serializeToString(elem);
	Exporter.saveSVG(name+".svg",str);
}

blocksString(blks){
	var blks = blks.reverse();
	var res = '';
	for(var i=0;i<blks.length;i++) blks[i].blocknum = i;
	for(var i=0;i<blks.length;i++){
		var b = blks[i];
		var val = (b.value==undefined) ? '[]' : '['+b.value+']';
//		var typepos = b.sig+' '+Math.round((b.left - scripts.cnvx)/.9) +' '+Math.round((b.top - scripts.cnvy)/.9);	// to be compatabile with the ios version
		var sig = b.sig;
		if  (sig  == 'onplay') { // Exploratorium request
			sig  = 'start';
			val = '[onplay]';
		}
		var typepos = sig+' '+Math.round(b.left/.9) +' '+Math.round(b.top/.9);	// to be compatabile with the ios version
		var c0 = b.connections[0];
	//	console.log (c0, c0? c0.blocknum : null,  c0? c0.connections.indexOf(b) : null)
		var upblock = (c0==undefined) ? '[]' : c0.blocknum;
		var updock = (c0==undefined) ? '[]' : c0.connections.indexOf(b);
		res += '['+typepos+' '+val+' '+upblock+' '+updock+']\n';
	}
	for(var i=0;i<blks.length;i++) delete blks[i].blocknum;
	return '[\n'+res+']\n';
}


}
