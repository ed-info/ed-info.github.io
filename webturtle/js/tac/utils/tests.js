
function domask (name){
	var path = "http://localhost/TAC/testimages/masks/"
	let url  = path+name+".png";
	binaryArrayServer(url, function (d) {loadData (url, d)}, doError)
	
  function doError(e){
    e.preventDefault();
    e.stopPropagation();
    console.log ("Failed Loading", url);
  }
  
	function loadData (imgname, data) {
		var data = Array.from(new Uint8Array(data));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, imgname, runIt);
  	project.name  = imgname
  }

	function runIt(){
		Exporter.pc = undefined
		Exporter.prepareSvg ()
		var whilecond = function (){return Exporter.pc == undefined};
		var timeout = setTimeout(function (){ waituntil (whilecond, doReady) }, 500);
	}
	
	function doReady(){
		Exporter.preview("outlinemask")
		var whilecond = function (){return gn('loader').className != "loader off"};
		var timeout = setTimeout(function (){ waituntil (whilecond, doSave) }, 500);	
	}

	function doSave(el){
	
			Exporter.save (1)
	}
  	
  /*	
	function doFinal(){
		let self  =  Exporter.pc;
		self.optimizer = new Optimizer ();
		let rect  = new Rectangle (0,0,700, 560)
		self.tstsvg = SVG.top(rect.width, rect.height);
		self.getSegments(gotSegments)
	}

	function gotSegments (segments) {	
		let self  =  Exporter.pc;
		// done rect fuctions
		var rect = new Rectangle (0,0,700, 560)
		tracetime("prep done"); 
		segments = self.cropToCanavas(segments)
		rect = self.optimizer.getRectangle(segments);
		let el = SVG.top(rect.width, rect.height); 
		Exporter.pc.el = el;
		Exporter.pc.partsToPath(el, self.optimizer.getPartsFrom (segments),  "#0093ff", "original");
		Exporter.showImagePreview (el);
		self.processOutline (rect, segments, function (str) {saveTest(el, str)})
	}

	function saveTest (el, str){
		tracetime('path finder done');
		var attr = {"fill": settings.outline.fill, "stroke": settings.outline.stroke, "stroke-width": 1, 
		"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round", name: "combined paths"};		
		attr["d"] = str;	
		SVG.addChild(el, "path", attr)
		var str  = SVG.toString(el);		
		Exporter.saveSVG(name+"2.svg",str, console.log);
	}	
	*/

}

function saveit(name){
	let str  = SVG.toString(Exporter.pc.tstsvg)
	Exporter.saveSVG(name+".svg",str, console.log);
}

function bulktest (val){
	var files  = ["sun.png", "fillsquares.PNG", "notches.PNG", "triangles.PNG", "flagsCard.PNG", 
		"onecolorpetalgrid.PNG",	"us6.png", "flower.PNG", "openfill.PNG", "ASTurtle.png", "flowers.PNG", 
		"peace.PNG", "IMG_8285.png", "gears.PNG", "penta.PNG", "allarcsdirs.PNG", "gingerman.PNG",
		"random_sqrs.PNG", "arc2.png", "got.PNG", "spinning2.png", "atest.png", "growingsquares.PNG",
		"spiral.PNG", "bug.png", "jayStar.png", "squares.PNG", "cantdo.PNG", "kamon.png", 
		"squiral.PNG", "complexfill.PNG", "largeCircle.PNG", "stickman.png", "curvy.PNG", "mickey.PNG"]
 
//	console.log (files)
//	files  = ["got.PNG"]
	var path = "http://localhost/TAC/testimages/test/"
	var n = 0;
	var size  = val;
	doOne (n)
	
	function doOne(n){
		if (n < files.length) binaryArrayServer(path+files[n], function (d) {loadData (files[n], d)}, doError)
		else console.log ("done")
	}

  function doError(e){
    e.preventDefault();
    e.stopPropagation();
    console.log ("Failed Loading", url);
    n++; doOne(n);
  }
  
	function loadData (imgname, data) {
		var data = Array.from(new Uint8Array(data));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, imgname, doTAC);
  	project.name  = imgname
  	console.log (project.name )
  }
  
	function doTAC(){
		Exporter.pc = undefined
		Exporter.prepareSvg ()
		var whilecond = function (){return Exporter.pc == undefined};
		var timeout = setTimeout(function (){ waituntil (whilecond, doReady) }, 500);
	}
	
	function doReady(){
		Exporter.preview("outline")
		var whilecond = function (){return gn('loader').className != "loader off"};
		var timeout = setTimeout(function (){ waituntil (whilecond, doFinal) }, 500);	
	}
	
	function doFinal(){
		console.log (project.name )
		if (!size) doSave()
		else {
			Exporter.margin = size;
			Exporter.addFrame()
			var whilecond = function (){return gn('loader').className != "loader off"};
			var timeout = setTimeout(function (){ waituntil (whilecond, doSave) }, 500);	
		}
	
	}
	
	function doSave(){
		Exporter.save (1)
		setTimeout(function (){ n++; doOne(n) }, 10);	
	}
  	
}

	function base64(data) {
    var str = '';
    for (var i=0; i<data.length; i++) str+=String.fromCharCode(data[i]);
    return btoa(str);
	}
	
	
function binaryArrayServer(url, whenDone, onError){
  var xmlrequest=new XMLHttpRequest();
  xmlrequest.responseType = "arraybuffer";
  xmlrequest.addEventListener("error", onError, false);
  xmlrequest.onreadystatechange=  function(){
    if (xmlrequest.readyState == 4)  whenDone(xmlrequest.response);
    }
  xmlrequest.open("GET", url, true);
  xmlrequest.send(null);    
}


function bulkstitch (file, size){
	size = !size ? 10 : size
	stitchme (file, 'hairline', size, doNext)
	
	function doNext (){
		stitchme (file, 'outline', size)
	}
}


function stitchme (name, type, ss,  whenDone){
	var path = "http://localhost/TAC/testimages/test/"
	let url  = path+name+".png";
	binaryArrayServer(url, function (d) {loadData (url, d)}, doError)
	
  function doError(e){
    e.preventDefault();
    e.stopPropagation();
    console.log ("Failed Loading", url);
  }
  
	function loadData (imgname, data) {
		var data = Array.from(new Uint8Array(data));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, imgname, runIt);
  	project.name  = imgname
  }

	function runIt(){
		Exporter.pc = undefined
		Exporter.prepareDST ()
		Exporter.stitchsize = ss;
		var whilecond = function (){return Exporter.pc == undefined};
		var timeout = setTimeout(function (){ waituntil (whilecond, doReady) }, 500);
	}
	
	function doReady(){
		Exporter.preview(type, gotStitches);
	}
	
	function gotStitches (el){
		Exporter.getDSTInfo (el)
		Exporter.saveDST(name+"_"+type)
		if (whenDone) whenDone()
	}

}

function readstitch(name) {
		var path = "http://localhost/TAC/testimages/stitchDST/"
	 DST.readfile(path+name+".dst")
}

function fillstitch (name, dir){
//
	var path = dir ? dir : "http://localhost/TAC/testimages/stitch/"
	let url  = path+name+".png";
	binaryArrayServer(url, function (d) {loadData (url, d)}, doError)
	
  function doError(e){
    e.preventDefault();
    e.stopPropagation();
    console.log ("Failed Loading", url);
  }
  
	function loadData (imgname, data) {
		var data = Array.from(new Uint8Array(data));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, imgname, runIt);
  	project.name  = imgname
  }

	function runIt(){
		Exporter.pc = undefined
		Exporter.prepareSvg ()
		var whilecond = function (){return Exporter.pc == undefined};
		var timeout = setTimeout(function (){ waituntil (whilecond, doReady) }, 500);
	}
	
	function doReady(){
		Exporter.preview("fillstitch")
	//	Exporter.pc.run("stitch", SVG.getClone(Exporter.runtime.turtle.svg), console.log); 
	}

}

function savestitches (name){
		var a = SVG.toString(gn("dstimage").childNodes[0]); 
	 Exporter.saveSVG(name+".svg",a);
}

function tt(list){
	var res  = [];
	let asso = [];
	for (let i = 0; i <  list.length; i++) {
		var item = list [i];
		addTo(item.index1, item)
		addTo(item.index2, item)
	}
	
	let mark = []
	for (let i = 0; i <  asso.length; i++){
	 		skip = false;
			var elems = asso[i]
			if (!elems) continue;
			if (elems.length < 2) continue;
			elems = elems.sort(function(a, b) {return  (a.pt.diff(b.pt)).len()});
			var prev = elems[0]
			for (let j = 1; j < elems.length; j++) {
				let next  = elems[j]
				let dist  = prev.pt.diff(next.pt).len();
				if (dist == 0) {
					let remove = [prev.index1, prev.index2, next.index1, next.index2]
					var unique = [...new Set(remove)];
					if (unique.length > 2) {
						
					}
					else console.log (prev, next)
				}
				prev = next;
			}
	}
	
	return 
	function addTo(pos, item){
		let data = asso[pos] ?  asso[pos] : [];
		data.push (item);
		asso[pos] = data;
	}
	
	
}


function tt2(list){
	var res  = [];
	let asso = {}
	for (let i = 0; i <  list.length; i++) {
		var item = list [i];
		addTo(item)
	}
	
	var change = new Object()
	for (let key in asso) {
		let choices = asso[key]
		if (choices.length < 2) continue;
		var mostcount = new Object()
		for (let m=0; m < choices.length; m++) {
			let choice  = choices[m]
			let c = "idx_"+choice.index1
			let data  = mostcount[c] ? mostcount[c] : []
			data.push (choice)
			mostcount[c] =  data;
			c = "idx_"+choice.index2
			data  = mostcount[c] ? mostcount[c] : []
			data.push (choice)
			mostcount[c] =  data;		
		}
		let count  = -1;
		let item  = null;
		for (let val in mostcount) {
			let amount  = mostcount[val].length;
			if (amount > count) {count = amount; item = val}
		}
		let most = item.split ("_")[1]
		change[key] = {index: most, hasone: false}
	}
	
	for (let i = 0; i <  list.length; i++) {
		var item = list [i];
		let key  = item.pt.toString (Geom.dp)
		let choices = asso[key]
		if (choices.length < 2) res.push (item)
		else {
			let onlyone = change[key]
			if (!onlyone.hasone) change[key].hasone = true;
			else {
				if (item.index1 == onlyone.index) item.index1 = undefined;
				if (item.index2 == onlyone.index) item.index2 = undefined;
			}
			res.push (item)
		}
	}
	return res;
	
	function addTo(item){
		let key  = item.pt.toString (Geom.dp)
		let data = asso[key] ?  asso[key] : [];
		data.push (item);
		asso[key] = data;
	}

}

function doit (name, type){
	type = !type ? "outline" : type;
	var path = "http://localhost/TAC/testimages/masks/"
	let url  = path+name+".png";
	binaryArrayServer(url, function (d) {loadData (url, d)}, doError)
	
  function doError(e){
    e.preventDefault();
    e.stopPropagation();
    console.log ("Failed Loading", url);
  }
  
	function loadData (imgname, data) {
		var data = Array.from(new Uint8Array(data));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, imgname, runIt);
  	project.name  = imgname
  }

	function runIt(){
		Exporter.pc = undefined
		Exporter.prepareSvg ()
		var whilecond = function (){return Exporter.pc == undefined};
		var timeout = setTimeout(function (){ waituntil (whilecond, doReady) }, 500);
	}
	
	function doReady(){
		let svg  = SVG.getClone(Exporter.runtime.turtle.svg)
		let self = Exporter.pc;
		self.removeBkg(svg);
		Exporter.pc.optimizer = new Optimizer();
		// expand each individual part
		let segments = self.getExpandedPathsSegments(self.getPaths(svg));
		tracetime("expanded"); 
		// set rect
		segments = self.cropToCanavas(segments)
		// done rect fuctions
		var rect = Exporter.pc.optimizer.getRectangle(segments);
		tracetime("prep done"); 
	
		Exporter.pc.el = SVG.top(rect.width, rect.height); 
		
		console.log (type)
		Exporter.preview(type)
		var whilecond = function (){return gn('loader').className != "loader off"};
		var timeout = setTimeout(function (){ waituntil (whilecond, doSave) }, 500);	
	}
	
	function doSave(){
		var name  = project.name +"_"+Exporter.mode + ".svg";
	//	console.log (name, Exporter.pc.el)		
		var str  = SVG.toString(gn("svgimage").childNodes[0]);
	//	console.log (str)
		Exporter.saveSVG(name,str);
	}
}

function decodeDST(name){
 DST.readfile("http://localhost/TAC/testimages/stitch/" + name,doNext)
  
 function doNext (buffer) {
  	let info  = DST.dataToParts(buffer)
  	console.log (info)
  	let el = SVG.top(info.rect.width, info.rect.height);
  	let pc = new PathConverter();
		var attr = {id: "DST", "fill": 'none', "stroke": "#0093ff", "stroke-width":  1, 	"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};		
		attr["d"] = pc.getSVGPath(info.parts);
		SVG.addChild(el, "path", attr)
  	var str  = SVG.toString(el);
  	let myname = (name.split (".dst")[0])+".svg"
		Exporter.saveSVG(myname,str)		
 }
 
 
}
