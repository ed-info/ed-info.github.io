class EditField {

constructor(){
	this.editblock = undefined;
	this.editfirst = true;
	this.nummask = undefined;
	this.hatmask = undefined;
	this.hatmasks = undefined;
}

setup(){
	this.nummask = Block.newBlockDiv('nummask');
	this.hatmasks = [Block.newBlockDiv('hat0'),Block.newBlockDiv('hat1'),Block.newBlockDiv('hat2')];
}

editDone(){
	var t = editfield;
	if(t.editblock==undefined) return;
	if(t.editblock.type=='number'){
		var n = Number(t.editblock.value);
		if(isNaN(n)) n=0;
		t.editblock.setText(n);
		scripts.blockcanvas.removeChild(t.nummask);
	} else if(t.editblock.type.substring(0,5)=='start'){
		t.editname (t)
		scripts.blockcanvas.removeChild(t.hatmask);
		palette.updateProcs();
	}
	t.editblock = undefined;
	window.onkeydown = UI.handleSpecialKeys;
}

editname(editfield) {	
	var b = editfield.editblock;
	var val = editfield.hatmask.value;
	var procnames = scripts.findStartNames(b);	
	if ((val.indexOf('|')!=-1)||(Tokenizer.parse(val)[0]!==val)||(val == "onplay")) { // onplay is a reserved word
			if(val!='') UI.showText("You can't name a stack " +  val);
			val = b.oldvalue; 
		};
	if (procnames.indexOf (val) > -1) {
		UI.showText(val +" is already defined");
		val = b.oldvalue; 
	};
	if (val != b.oldvalue) {
		var blks = scripts.getBlocks();
		for(var i=0;i<blks.length;i++){
			var block = blks[i];
			if(block.type.substring(0,9)!='procedure') continue;
			if(block.value!=b.value) continue;
			block.setText(val);
		}
	}
	b.setText(val);
}

/////////////////////////
//
// hat editor
//
/////////////////////////

hatEdit(b){
	scripts.saveForUndo();
	var t = editfield;
	window.onkeydown = t.hatKeyDown;
	t.editblock = b;
	t.editfirst = true;
	b.oldvalue = b.value;
	t.hatHighlight (b);
}

hatHighlight (b){
	var t = editfield;
	var nargs = b.sig.split(':').length-1;
	t.hatmask = t.hatmasks[nargs];
	t.hatSetValue(b.value);
	t.hatmask.jsobj = b;
	scripts.blockcanvas.appendChild(t.hatmask);
	if(nargs>0) scripts.blockcanvas.appendChild(b.connections[1].div);
	if(nargs>1) scripts.blockcanvas.appendChild(b.connections[2].div);
  editfield.hatmask.style.webkitTransform = 'translate3d('+b.left+ 'px,'+b.top+'px, 0)';
}

hatSetValue(s){
	var div =  editfield.hatmask;
	var ns = s.replaceAll('&','&#x0026;').replaceAll('<','&#x003c;');
	var str = div.svgstr.replace(">i</text>",">"+ns+"</text>");
	setSVG(div,str);
	div.value = s;
}

hatKeyDown(e){
 	e.preventDefault();
 	e.stopPropagation(); 
	var t = editfield;
	if(e.key=='Enter') t.editDone();
	else if(e.key=='Backspace') t.hatEditDelete();
	else if(e.key.length==1) t.hatEditChar(e.key);
}

hatEditDelete(){
	var t = editfield;
 	var val = t.hatmask.value;
	if (val.length > 0) t.hatSetValue(val.substring(0,val.length-1));
}

hatEditChar(c){	
	var t = editfield;
 	var val = t.hatmask.value;
 	if(t.editfirst){t.editfirst=false; val='';}
	if(val.length>7) return; 	
	val+=c;
	t.hatSetValue(val);
}

/////////////////////////
//
// number editor
//
/////////////////////////

numEdit(b){
	scripts.saveForUndo();
	var t = editfield;
	window.onkeydown = editfield.numKeyDown;
	t.editblock = b;
	t.editfirst = true;
	t.nummask.jsobj = b;
	scripts.blockcanvas.appendChild(t.nummask);
	var top = (b.top - 4);
  var left= (b.left - 4);
  editfield.nummask.style.webkitTransform = 'translate3d('+left+ 'px,'+top+'px, 0)';
}

numKeyDown(e){
 	e.preventDefault();
 	e.stopPropagation(); 
	var s;
	var t = editfield;
	var valid = "-.0123456789";
	var key = e.which || e.keyCode;
	if(key == 13){t.editDone(); return;}
	if(key == 8){t.numEditDelete();  return;}
	if(key==46) return;
	if(key==190) s='.';
	else if(key==189) s='-';
	else s = String.fromCharCode(key);
	if (valid.indexOf(s)< 0) return;
	t.numEditChar(s);
}

numEditDelete(){
	var t = editfield;
	var val = String(t.editblock.value);
	if (val.length > 0) val = val.substring(0,val.length-1);
	if(val.length==0) val="0";
	t.editblock.setText(val);
}


numEditChar(c){	
	var t = editfield;
 	var val = t.editblock.value;
 	if(t.editfirst){t.editfirst=false; val="0";}
 	if((c=='.')&&(val.indexOf('.')!=-1)) return;
	if((c=='-')&&(val!=0)) return;
	if((val=='0')&&(c!='.')) val=c;
	else val+=c;
	if(val.length>7) return; 	
	t.editblock.setText(val);
}


}
