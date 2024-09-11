class Exporter {

static init (e){
	e.preventDefault();
	e.stopPropagation();
	Exporter.prepareSvg()
}

static prepareSvg (){
	Exporter.error = undefined;
	var b = scripts.findStartingBlock();
	if (!b) {
		 Exporter.openAlert( "Nothing to run");
		 return;
	}
	if (Exporter.pc) Exporter.pc.done = false;
	gn('loader').className = "loader off";
	Exporter.runtime = new ExportVM (new SVGTurtle())
	let exturtle = Exporter.runtime.turtle;
	Exporter.runtime.runStack(b);	
	Exporter.waitForEndDraw(doNext)
	function doNext (){
		Exporter.runtime.restore();
		if (!exturtle.svg.getElementById('imagepaths')) Exporter.error = "No image";
		if (exturtle.svg.getElementById('imagepaths').childElementCount == 0) Exporter.error = "No image";
		if (Exporter.error)  Exporter.openAlert(Exporter.error);
		else {
			Exporter.pc = new PathConverter();
			Exporter.openBox();
			Exporter.showImagePreview (Exporter.runtime.turtle.svg);
		}
	} 
}

static waitForEndDraw (doNext){
	let self = this;
	var cond = function (){return Exporter.runtime.isActive();};
	if (self.timeout != undefined) clearTimeout(self.timeout);
	self.timeout = setTimeout(function (){ waituntil (cond, doNext); }, 500);
}

static showImagePreview (el) {
	while	(gn("svgimage").childElementCount > 0) gn("svgimage").removeChild(gn("svgimage").childNodes[0]);
	if (!el) return;
	var w =  Number(el.getAttribute ('width'));
	var h =  Number(el.getAttribute ('height'));
	gn("svgimage").appendChild (el);
	var zoom =  (w > 700) ||  (h > 560) ?  Math.round (Math.min (700 / w, 560 / h) * 1000) / 1000  : 1;
	var dx =  (w < 700) ? Math.floor (((700 - w) / 2 )/ zoom) :  0;
	var dy =  (h < 560) ? Math.floor (((560 - h) / 2) / zoom) : 0;
	gn("svgimage").style.zoom =  zoom;
	gn("svgimage").style.left = dx +"px";
	gn("svgimage").style.top = dy +"px";
	gn("svgimage").style.width = w +"px";
	gn("svgimage").style.height = h +"px";
} 

static openBox  (){
	let self  = this;
	Exporter.svgImageData = {};
	Exporter.hideall();
	var doch = getDocumentHeight() * 0.9;
	var docw = getDocumentWidth() * 0.9;
	gn("backdrop").setAttribute("class","modal-backdrop fade in");
	setProps(gn("backdrop").style, {display: 'block'});
	var factor  = getscale(720, 580, 220);
	let margin = Math.max (0,  Math.round((docw -  720*factor - 210 - 10) / 2))
	var attr = {}
	if (factor !=1) attr['zoom'] = factor; 
	attr['left'] = margin+ "px";
	attr['top'] =  Math.floor ((doch - 560*factor)/ 2) + "px";
	setProps(gn("svgstatus").style, attr);
	gn("svgpanel").style.left = Math.ceil(margin + 10 + Math.ceil(720*factor))  + "px"
/*	gn("svgpanel").style.width =  Math.min(220, (docw - 720*factor)) + "px";*/
	gn("dialogbox").setAttribute("class","dialogbox fade in");	
	gn("image").onmousedown = function (e) {Exporter.preview('image');};
	gn("outline").onmousedown = function (e) {Exporter.preview('outline');};
	gn("hairline").onmousedown = function (e) {Exporter.preview('hairline');};
	gn("imageplain").onmousedown = function (e) {
		e.preventDefault();
		e.stopPropagation();
		Exporter.noBorder();
	};
	gn("imageborder").onmousedown = function (e) {Exporter.addBorder(e);};
	gn("imageframed").onmousedown = function (e) {Exporter.addFrame();};
	gn("savesvg").onmousedown = function (e) { Exporter.save();};
	gn("closebox").onmousedown = function (e) {Exporter.closeDialogBox(e);};
	Exporter.setEditableField(gn("marginsize"), 10, Exporter.unfocusMargin)
	
	function getscale(w,h, dx){
		if (((doch - h) > 0) && ((docw - dx - w) > 0)) return 1;
		if (((doch - h) < 0) && ((docw - dx - w) < 0)) return Math.min ( Math.round (doch / h * 100) / 100, Math.round ((docw - dx) / w * 100) / 100);
		if ((doch - h) < 0) return Math.round (doch / h * 100) / 100;
		return Math.round ((docw - dx) / w * 100) / 100;
	}
}

static setEditableField (ti, value, fcn) {
	Exporter.margin = value;
	ti.value = value;
	ti.autocomplete = "off";
  ti.autocapitalize = "off";
  ti.maxLength = 25;
  ti.onclick = function (e) {ti.focus(); ti.select();}
  ti.autocorrect = false;
  ti.onfocus = function(evt){
  	ti.oldname=ti.value; ti.className =  "numericinput select";
  	var n = ti.value.length;	
  	ti.setSelectionRange(n, n);
  }; 
  ti.onblur = function(evt){fcn(evt);}; 
  ti.onkeypress = function(evt) {Exporter.handleWrite(evt);};
  ti.onsubmit= function(evt) {fcn(evt);};
}

static handleWrite (e){
  var key=e.keyCode || e.which;
  var ti = e.target;
  if (key==13) {
    e.preventDefault();
    	e.stopPropagation();
    e.target.blur();
  }
}

static unfocusMargin (e){ 	
	e.preventDefault();
	e.stopPropagation();
	var ti = e.target;
	ti.className = "numericinput";
	Exporter.margin = ti.value;
	var el = SVG.getClone (Exporter.svgImageData[Exporter.mode]);	 
	var result  = Exporter.pc.setMargin (el,  Number(Exporter.margin));
	switch (Exporter.layout) {
		case "border":  
			var el = Exporter.layoutBorder(result)
			Exporter.showImagePreview(el);
			break;
		case "framed": 
			Exporter.addFrame();
			break;
		default: 
			Exporter.showImagePreview(result);
			break;
		}
}

//////////////////////
//
// Mode processing
//
//////////////////////

static preview (mode){
	resett();
	let self = this;
	_debug = true;
	Exporter.mode = mode;
	self.layout = undefined;
	Exporter.hideall();
	Exporter.selectButton(mode);	
	gn('loader').className = "loader on";
	while	(gn("svgimage").childElementCount > 0) gn("svgimage").removeChild(gn("svgimage").childNodes[0]);
	setTimeout (function () {convert();}, 50);
	function convert(){
		if (Exporter.svgImageData[Exporter.mode]) doNext(Exporter.svgImageData[Exporter.mode]);
		else Exporter.pc.run(Exporter.mode, SVG.getClone(Exporter.runtime.turtle.svg), doNext);
	}
	
	function doNext(el) {
		if (!el)	{
			if (Exporter.pc.done) return;
			gn('loader').className = "loader off";
			Exporter.openAlert(Exporter.error);
			Exporter.showImagePreview(exturtle.svg);
			return;
		} 
		if (!Exporter.svgImageData[Exporter.mode]) Exporter.svgImageData[Exporter.mode] =  SVG.getClone(el);
		if (Exporter.mode == "image")	Exporter.showImagePreview(el)
		else Exporter.noBorder();
		setTimeout (function () {gn('loader').className = "loader off";}, 50);
	}	
}

static selectButton(str) {
	Exporter.clearButtons();
	gn(str).className = 'imagebutton on';
	Exporter.showOption (str);
}

static showOption(mode){
	switch (mode) {
		case "image":  Exporter.savestep(); break;
		case "outline": outlineoptions(); break;
		case "hairline": hairlineoptions(); break;
	}

	function outlineoptions(){
		gn("imageframed").className="imagebutton";	 // restore
		gn("optionshr").className="divider";
		gn("svgframingoptions").className="svgbuttons";
		gn("bordersize").style.display="block";
		Exporter.savestep();
	}
	
	function hairlineoptions(){
		gn("imageframed").className="imagebutton off";	 // hide
		gn("bordersize").style.display="none";
		gn("optionshr").className="divider";
		gn("svgframingoptions").className="svgbuttons";
		Exporter.savestep();
	}
}

 static hideall(){
	 gn("optionshr").className="divider off";
	 	gn("svgframingoptions").className="svgbuttons off";
	 gn("savehr").className="divider off";
	 gn("savestep").className="svgbuttons centered off";
	 gn("imageframed").className="imagebutton";	 // restore
 }

 static savestep(){
	 gn("savehr").className="divider";
	 gn("savestep").className="svgbuttons centered";
 }

 static hidesavestep(){
	 gn("savehr").className="divider off";
	 gn("savestep").className="svgbuttons centered off";
 }
 
static noBorder(e){
	var self = this;
	Exporter.setSubCategory("imageplain");
	Exporter.hidesavestep();
	function doNext (){
		var el = SVG.getClone (Exporter.svgImageData[Exporter.mode]);
		var result  = Exporter.pc.setMargin (el,  Number(Exporter.margin));
		Exporter.layout = undefined;
		Exporter.showImagePreview(result);
		Exporter.savestep();
	}
	setTimeout (doNext, 50);	
}
 	
static addBorder(e){
	var self = this;
	e.preventDefault();
	e.stopPropagation();
	Exporter.setSubCategory("imageborder");
	Exporter.layout = "border";
	Exporter.hidesavestep();
	function doNext (){
		var el = SVG.getClone (Exporter.svgImageData[Exporter.mode]);
		var result  = Exporter.pc.setMargin (el,  Number(Exporter.margin));
		var el = Exporter.layoutBorder(result)
		Exporter.showImagePreview(el);
		Exporter.savestep();
	}
	setTimeout (doNext, 50);	
}

static layoutBorder(el){
	var w =  Number(el.getAttribute ('width'));
	var h =  Number(el.getAttribute ('height'));
	var rect =  new Rectangle (0,0, w,  h);	 
	Exporter.pc.setBorder (el, rect);
	return el;
}

static addFrame(){	
	Exporter.layout = "framed";
	Exporter.setSubCategory("imageframed");
	var option  = Exporter.svgImageData["framed_"+Exporter.margin];
	if (option) {
		Exporter.showImagePreview(option);
		Exporter.savestep();
	}
	else Exporter.addFrameSize(Exporter.margin);
}

static setSubCategory (type) {
	Exporter.clearFrameButtons();
	Exporter.pc.attr =  settings[Exporter.mode];
	gn(type).className = 'imagebutton on';	
}

static clearButtons(){
	gn("image").className = 'imagebutton';
	gn("outline").className = 'imagebutton';
	gn("hairline").className = 'imagebutton';
}
	
static clearFrameButtons(){
	if (document.activeElement && document.activeElement.nodeName == "INPUT") document.activeElement.blur();
	gn("imageplain").className = 'imagebutton';
	gn("imageborder").className = 'imagebutton';
	if (Exporter.mode == "outline") gn("imageframed").className = 'imagebutton';
	else gn("imageframed").className = 'imagebutton off';
}

//////////////////////
//
// Frame Processing
//
//////////////////////

static addFrameSize (size){
	Exporter.hidesavestep();Exporter.svgImageData
	var self = this;
	gn('loader').className = "loader on"; 
	Exporter.showImagePreview(null);
	setTimeout (function (){processFrame(size)}, 20);
	function processFrame (size) {
		Exporter.pc.setFrame (SVG.getClone (Exporter.svgImageData[Exporter.mode]), size, doNext);
	}

	function doNext (el) {
		gn('loader').className = "loader off";
		if (!el)	{		
			if (Exporter.pc.done) return;
			Exporter.showImagePreview(exturtle.svg);
			Exporter.openAlert("Couldn't add frame");
		}
		else {
			Exporter.svgImageData["framed_"+Exporter.margin] = el;
			Exporter.showImagePreview(el);
			Exporter.savestep();
		}
	}
}	


/////////////////////////
//
// Alerts and Dialogs
//
/////////////////////////

static openAlert  (message){
	let self  = this;
	gn("alertmessage").textContent = message;
	gn("backdrop").setAttribute("class","modal-backdrop fade in");
	setProps(gn("backdrop").style, {display: 'block'})
	gn("Cancel").className = "button hidden";
	gn("alertdialog").setAttribute("class","alertdialog fade in");	
	gn("OK").onmousedown = function(e) {Exporter.skipFile(e);};
}

static openDialog  (name, svg, message){
	let self  = this;
	gn("alertmessage").textContent = message;
	gn("backdrop").setAttribute("class","modal-backdrop fade in");
	setProps(gn("backdrop").style, {display: 'block'});
	gn("Cancel").className = "button";
	gn("alertdialog").setAttribute("class","alertdialog fade in");	
	gn("OK").onmousedown = function (e) {Exporter.saveAnyway(e, name, svg);};
	gn("Cancel").onmousedown = function (e) {Exporter.skipFile(e, name, svg);};
}

static skipFile  (e){
	e.preventDefault();
	e.stopPropagation();
	Exporter.closeDialog();
}

static saveAnyway  (e, name, str){
	e.preventDefault();
	e.stopPropagation();
	Exporter.closeDialog();
	Exporter.saveSVG(name,str);
}

static closeDialog  (){
	gn("backdrop").setAttribute("class","modal-backdrop fade out");
	setProps(gn("backdrop").style, {display: 'none'});
	gn("alertdialog").setAttribute("class","alertdialog fade out");	
//	gn("pdfwrapper").setAttribute("class","pdfwrapper fade out");	
}

static closeDialogBox  (e){
	if (e){
		e.preventDefault();
		e.stopPropagation();
	}
	if (Exporter.pc) Exporter.pc.stop();
	gn("backdrop").setAttribute("class","modal-backdrop fade out");
	setProps(gn("backdrop").style, {display: 'none'});
	gn("dialogbox").setAttribute("class","dialogbox fade out");	
	Exporter.clearButtons();
}

//////////////////////////////
//
// Save in SVG dialog
//
////////////////////////////////

static save (ps){
	var name = project.name;
	if  (name.toLowerCase() == 'untitled') {
		name = prompt('Save Image As', project.name);
		if(name==null) return;
		turtle.saveproject (name, doNext)
	}
	else doNext();
	
	function doNext (){
		name = project.name;	
		var name = project.name +"_"+ Exporter.mode+".svg";
		var str  = getSVGstr (Exporter.mode, gn("svgimage").childNodes[0])
		console.log (name, str.length, (Date.now() - t0) /1000, "sec")
		var msg =  name +" approximate size is " + (Math.floor(str.length / 100000) / 10 )+"MB. Do you still want to save it?";
		if (str.length > 500000) Exporter.openDialog (name, str,msg);
		else if (Exporter.error) Exporter.addAlert(Exporter.error ?  Exporter.error : 'Image has too many strokes');
		else Exporter.saveSVG(name,str);
	}
	
	function getSVGstr(mode, svg) {
		switch(mode) {
			case 'image': return SVG.toString(svg);
			default: 
				var el = SVG.getClone (svg);
				for (var i=0; i < el.childElementCount; i++) {
					var path = el.childNodes[i];
					if (path.getAttribute('stroke-width')) path.setAttribute('stroke-width', ps ? ps : 0.001)
				}
				return SVG.toString(el);
		}
	}
}

static saveSVG (name, str, fcn){
//	tracetime('saveSVG ' + name +" " + str.length)
	var a = document.createElement('a');
	a.href = 'data:text/html;charset=UTF-8,'+encodeURIComponent(str);
	a.download = name;
	a.click();
	if(fcn) fcn();
}
	
	
}