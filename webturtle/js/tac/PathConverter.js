/* © 2021 Playful Invention Company - Paula Bontá */

const settings = {
	 image: {},
	 hairline: {pensize: 0.001, fill: 'none', stroke: "#FF0000"},	
	 outline: {pensize: 0.001, fill: 'none', stroke: "#FF0000"}
 }

class PathConverter {
	constructor() {
		this.areafactor = 1.2
		this.artboard  = new Rectangle (0,0,700, 560)
		this.done = false;
	}
	
	run (type, svg, whenDone){
		this.svg = svg;
		this.attr =  settings[type];
		this.modetype  = type;
		this.optimizer = new Optimizer();
		Exporter.pad = 1;
		switch (type){
			case "hairline": this.getHairline(whenDone); break;
			case "outline": this.getOutline(whenDone); break;
			default: this.getOriginal(whenDone); break;
		}	
	}
	
	stop (){
		this.done = true;
	}
	
	getOriginal  (whenDone) {
	 this.removeBkg(this.svg, true);
		this.addClipPath (this.svg, new Rectangle (0,0, 700, 560))
	 whenDone (this.svg);
	}	

	addClipPath (svg, r) {
		let ip = svg.getElementById("imagepaths")
		if (!ip) {
			var group =  SVG.addChild(undefined, 'g', {id: "imagepaths"});	
			while (svg.childElementCount > 0) group.appendChild (svg.childNodes [0])
			svg.appendChild (group)
		}
		let d  = "M"+r.x+","+r.y+"h"+r.width+"v"+r.height+"H0V0z";
		var clippath = SVG.addChild(svg, 'clipPath', {id: "clip_image", clipPathUnits: "userSpaceOnUse"});
		let pathmask = SVG.addChild (clippath, "path", {id: "pathmask_image", d: d});
	 	svg.getElementById("imagepaths").setAttribute('clip-path', "url(#clip_image)");	
	}
	
	getHairline (whenDone) {
		let self = this;
		this.removeBkg(this.svg);
		let paths = this.getPaths(this.svg);	
	 	let optimizer = this.optimizer;
		let parts = optimizer.getParts(paths);	
		let segments = this.getHairlineSegments(this.getPaths(this.svg));
		let rect = optimizer.getRectangle(segments);
		let framearea = this.getFrameArea()
		self.isCropped = rect.getArea() > this.getFrameArea()
		if (self.isCropped) {
			rect = this.getFrameRect()
			segments = self.crop(self.optimizer, segments, rect);	
			parts = optimizer.getPartsFrom(segments);
		} 
	
		let delta = new Vector(rect.x, rect.y);
		if (delta.len() != 0) optimizer.moveBy(parts, delta);
		this.optimizer.setSections(parts, rect);
		rect.zeroTopLeft(); 
		tracetime("prep done"); 
		this.eliminateDuplicates(rect, parts, false, function (pieces) {doNext(pieces);});
		
		function doNext (pieces) {
			tracetime("eliminateDuplicates"); 
			if (self.done) whenDone (null)
			else  {
				let el  = self.partsToSVG(rect, pieces);
				whenDone (el);	
			}
		}
	}
	
	getFrameArea(){return this.artboard.getArea()*this.areafactor;}
	
	getFrameRect(){return this.artboard.clone()}
	
	svgToParts (svg){
		let optimizer  = this.optimizer ? this.optimizer : new Optimizer();
		let paths = this.getPaths(svg);
		return optimizer.getParts(paths);	
	}
	
	setBorder(svg, rect, c, s){
		let val = _debug && !s ? 1 : !s ? this.attr.pensize : s;
		rect.expandBy(-val);
		var attr = {"fill": this.attr.fill, "stroke": c ? c : this.attr.stroke, "stroke-width": val, 
			"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};		
		attr["d"] = rect.svgPath();
		SVG.addChild(svg, "path", attr)
	}

	setMargin(svg, margin){
		var segments = this.getHairlineSegments(this.getPaths(svg));
		let rect = this.optimizer.getRectangle(segments);
		let oriparts = this.optimizer.getPartsFrom(segments);	
		this.optimizer.trim(oriparts, Geom.dp);
	  rect.expandBy(margin);		
		let delta = new Vector(rect.x, rect.y);	
		this.optimizer.moveBy(oriparts, delta);
		this.optimizer.trim(oriparts, Geom.dp);
		let el = SVG.top(rect.width, rect.height);
		var str  = this.getSVGPath(oriparts);
		var attr = {"fill": this.attr.fill, "stroke": this.attr.stroke, "stroke-width": _debug ? 1 : this.attr.pensize, 
			"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round", name: "combined paths"};		
		attr["d"] = str;	
		SVG.addChild(el, "path", attr)
		return el;	
	}
	
	setFrame(svg, margin, whenDone){
		var w =  Number(svg.getAttribute ('width'));
		var h =  Number(svg.getAttribute ('height'));
		var rect =  new Rectangle (0,0, w,  h);
		let self = this; 
		let half = margin / 2;
		let delta  = (_debug ? 0.5 : this.attr.pensize) + half;
		rect.expandBy(-delta);
		let border = this.getBorder(margin*2, rect);
		let segments = this.getHairlineSegments(this.getPaths(svg));
		segments = border.concat(segments);	
		segments = this.cropToCanvas(segments)
		// done Varialbes
	  rect = this.optimizer.getRectangle(segments);
		rect =  new Rectangle (0,0,rect.width, rect.height);	
		this.processFrame (rect, border, segments, whenDone) 	
	}
	
	processFrame (rect, border, segments, whenDone) {
		let self = this; 
		this.optimizer.setIds(segments)
		let sparts = this.optimizer.getCloneParts(segments);
		self.optimizer.setSections(sparts, rect); // classify per area so finding the crossings is faster
		tracetime("set Sections"); 
		let el = SVG.top(rect.width,rect.height);
		let preview = SVG.top(rect.width, rect.height);
		self.partsToPath(preview, sparts,  "#0093ff", "original");
		Exporter.showImagePreview (preview);
		self.optimizer.findCrossings(sparts, self.optimizer.areas, function (myparts, xsings) { 
				tracetime("found Crossings"); 
				var parts = self.optimizer.splitParts(myparts, xsings);  
				tracetime("splitted Parts"); 
			//	self.partsToPath(el, parts,  "#8800ff", "removeInBorder");
				self.eliminateDuplicates(rect, parts, false, function (pieces) {				
					tracetime("eliminateDuplicates"); 
					if (self.done) whenDone (null)
					else  {
						var list = self.optimizer.removeInBorder(rect, border,  pieces, segments);
			//		self.partsToPath(el, list,  "#8800ff", "removeInBorder");
						let connected = self.keepConnected (list);
						tracetime("keep Connected");	
				//	self.partsToPath(el, connected,  "#0093ff", "connected");
						let cutter = new PathFinder(connected, lastStep); 				
					}
				})	
			});

		function lastStep (list){	
			if (list.length == 0) {
			 	Exporter.error = "Couldn't process this image";
				whenDone (null);
				}
			else {
				var str  = self.getSVGPath(list);
				tracetime('path finder done');
				var attr = {"fill": self.attr.fill, "stroke": self.attr.stroke, "stroke-width": _debug ? 1 : self.attr.pensize, 
				"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round", name: "combined paths"};		
				attr["d"] = str;	
				SVG.addChild(el, "path", attr)
				whenDone (el);
			}
		};
	}
 
	prepareToSew(whenDone) {
		resett()
		let self = this;
		this.basecolor = self.getBkgColor(this.svg)
		self.removeBkg(this.svg);
		let newsvg  = this.trimBlankSpace(this.svg, 0)
		whenDone (newsvg)
	}
	
	scaleToFit(whenDone) {
		resett()
		let svg  = this.svg
		let indent = Exporter.stitchsize*2;
		let w = Number (svg.getAttribute("width"))
		let h = Number (svg.getAttribute("height"))
		let size  = 500 - Math.ceil(Math.sqrt (indent * indent +  indent * indent))
		let scale =  Math.min (size / w, size / h).trim(2)
		let paths  = this.getPaths(this.svg);
		for (let i=0;  i < paths.length; i++) paths[i].scaleby (scale)
		let valw = Math.min (size, Math.ceil (w*scale))
		let valh = Math.min (size, Math.ceil (h*scale))
		let rect = new Rectangle(0, 0, valw, valh)
		let newsvg = this.recombineSVG(rect, paths)
		self.isCropped = w*h >= this.artboard.getArea();
		if (self.isCropped) this.addClipPath(newsvg, new Rectangle(0, 0, valw, valh))	
		else	newsvg  = this.trimBlankSpace(newsvg, 0)
		whenDone (newsvg)
	}
	
	trimBlankSpace (svg, indent){
		let self = this;
		let segments = this.getExpandedPathsSegments(this.getPaths(svg));
		var rect = this.optimizer.getRectangle(segments).trim(0)
		let delta = new Vector(rect.x, rect.y);
		let paths = this.getPaths(svg);
		let newsvg=undefined
		self.isCropped = rect.getArea() > this.artboard.getArea()*self.areafactor;
		if (!self.isCropped)	{
			rect  = indent == 0 ? rect  : rect.expandBy(indent); 
			delta = new Vector(rect.x, rect.y);
			for (let i=0;  i < paths.length; i++) paths[i].moveby (delta)
			newsvg =	this.recombineSVG(rect, paths)
		}	
		else {
			rect = this.artboard.clone();
			newsvg = this.recombineSVG(rect, paths)
			this.addClipPath(newsvg, rect)			
		}
		return newsvg
	}
	
	getMaxStrokeSize (list) {
		let max  = 0;
		for (let i = 0; i < list.length ; i++){
			if (!list[i].strokesize) continue;
			if (list[i].strokesize > max) max = list[i].strokesize
		} 
		return max;
	}
	
	recombineSVG(rect, paths) {
		let mainsvg = SVG.top(rect.width, rect.height);
		for (let i=0;  i < paths.length; i++) {
			let p = paths[i]
			let w  = p.strokewidth
			let c = p.color
			c = (c == "#ffffff") || !c ? "#ff0000" : c;
			var attr =  p.hasfill ? {"fill": c, "stroke": "none"} : {"fill": 'none', "stroke": c, "stroke-width": w, 
				"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};		
			attr["d"] = p.getSVGpath();	
			SVG.addChild(mainsvg, "path", attr)
		}
		return mainsvg
	}
	
	recreateFromParts (parts){
  	let paths  = []
  	let styles  = []
  	var color, size;
  	let pervpart = parts [0]
  	let prevcolor = pervpart.color
  	let presize =  pervpart.oldstrokesize || pervpart.strokesize
  	let group = [pervpart]
  	for (let i =1 ; i < parts.length; i++)  {
  		let p = parts [i];
  		color = p.color
  		size =  p.oldstrokesize || p.strokesize
  		if ((color==prevcolor) &&(size==presize)) group.push (p)
  		else {
  			let path = new Path (presize*2, presize==0, color)
  			path.recalculateSegments(group)
  			paths.push(path)
  			color = p.color
  			size =  p.oldstrokesize || p.strokesize
  			group = [p]
  		}
  	}
  	if (group.length > 0) {
  		let path = new Path (presize*2, presize==0, color)
  		path.recalculateSegments(group)
  		paths.push(path)
  	}
  	return paths;
	}	 
	
	getOutline(whenDone){
		resett()
		let self = this;
		this.basecolor = self.getBkgColor(this.svg)
		self.removeBkg(this.svg);
		let paths  = self.getPaths(this.svg)
		let parts  = this.optimizer.getParts(paths)
		let rect = this.optimizer.getRectFromParts(parts);
		self.isCropped = rect.getArea() > this.getFrameArea()
//		self.isCropped = rect.getArea() >= self.artboard.getArea()*self.areafactor;
		this.eliminateDuplicates(rect, parts, false, function (pieces) {self.getSVGOutline (rect, pieces, whenDone)})
	}
		
	getSVGOutline (rect, pieces, whenDone) {
		tracetime("paths deleted"); 
		let self  = this;
		let svg  = self.convertPartsToSVG(rect, pieces)
		// expand each individual part
		let segments = this.getExpandedPathsSegments(this.getPaths(this.svg));
		tracetime("expanded"); 
		// set rect
		segments = this.cropToCanvas(segments)
		// done rect fuctions
		var rect = this.optimizer.getRectangle(segments);
		var preview = SVG.top(rect.width, rect.height);
	//	Exporter.pc.tstsvg = SVG.top(rect.width, rect.height);
		Exporter.pc.partsToPath(preview, this.optimizer.getPartsFrom (segments),  "#0093ff", "original");
		Exporter.showImagePreview (preview);
		let el = SVG.top(rect.width, rect.height); 
		this.processOutline (rect, segments, function (list) {doLast(el, list);})
		
		function doLast (el, parts){
				if (parts) {		
					let str  =	self.getSVGPath(parts);	
				tracetime('path finder done');
				var attr = {"fill": self.attr.fill, "stroke": self.attr.stroke, "stroke-width": _debug ? 1 : self.attr.pensize, 
				"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round", name: "combined paths"};		
				attr["d"] = str;	
				SVG.addChild(el, "path", attr)
					SVG.addChild(Exporter.pc.tstsvg , "path", attr)
				whenDone (el);
			//		Exporter.saveSVG("test.svg",SVG.toString(Exporter.pc.tstsvg));		
				}
				else whenDone(null)
		}
	}
	
	convertPartsToSVG(rect, pieces) {
		var el = SVG.top(rect.width,rect.height);
		let parts  = this.splitLargeArcs(pieces)
		let pathparts = []
		let segment = []
		let size  = undefined;
		let color  = undefined;
		for (let i=0; i < parts.length;  i++) {
			let p = parts[i]
			if ((size!=p.strokesize) ||(color != p.color)) {
				if (segment.length > 0) pathparts.push (segment)
				size  = p.strokesize;
				color = p.color
				segment = [p]
			}
			else segment.push (p)
		}
		if (segment.length > 0) pathparts.push (segment)

		var strattr = {"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};		
		
		for (let i=0; i < pathparts.length;  i++) {	
			let seg = pathparts[i]
			let first  = seg[0]
			let isFill = first.strokesize == 0 
			let attr = isFill ? {"fill": first.color} :  {"fill": 'none', "stroke": first.color, "stroke-width": first.strokesize*2}
			if (!isFill) setProps(attr, strattr)
			attr["d"] = this.getSVGPath(seg);
			SVG.addChild(el, "path", attr)		
		}
		return el;
	}

	getOutlineMask(whenDone) { // delete
		resett();
		let self = this;
		this.basecolor = this.getBkgColor(this.svg)
		this.removeBkg(this.svg);
		let list = this.getPaths(this.svg)
		list  = this.removeDuplicatePaths(list)
		self.getSegmentsGroups(self.basecolor, list, gotGroups)
		function gotGroups (groups) {	
			var segments = flatten(groups)
			self.optimizer.setIds(segments, "legacyID")
			self.originalSegments = self.optimizer.getCloneSegments(segments)
		//	var rect = self.optimizer.getRectangle(self.originalSegments);
			var rect  = self.artboard 
			self.tstsvg = SVG.top(rect.width, rect.height);	
			console.clear()
			self.processGroupMasks(self.basecolor, groups, gotMaskedSegments)	
		}
		
		function gotMaskedSegments(segments){	
			var rect = self.optimizer.getRectangle(self.originalSegments);
			self.originalSegments = self.cropToCanvas(self.originalSegments)	
			rect = self.isCropped ? self.artboard.clone() : rect
			segments = self.cropToRect(rect, segments)
			let el = SVG.top(rect.width, rect.height);
			let preview = SVG.top(rect.width, rect.height);
			Exporter.pc.partsToPath(preview, self.optimizer.getPartsFrom (segments),  "#3393ff", "original");
			Exporter.showImagePreview (preview);
			whenDone(preview)
			// do last step
			// process outline doesn't work properly. 
			// need a special case for deleting inner paths
		//	self.processOutline (rect, segments, function (str) {doLast(el, str)})
		}
		
		function doLast (el, str){
				if (str) {
					tracetime('path finder done');
					var attr = {"fill": "none", "stroke": self.attr.stroke, "stroke-width": _debug ? 1 : self.attr.pensize, 
					"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round", name: "combined paths"};		
					attr["d"] = str;	
					SVG.addChild(el, "path", attr)
					whenDone (el);
				}
				else whenDone(null)
		}
	}

	cropToCanvas(segments) {
		var rect = this.optimizer.getRectangle(segments);
		let oriparts = this.optimizer.getPartsFrom(segments);	
		this.optimizer.trim(oriparts, Geom.dp);
		this.isCropped = rect.getArea() > this.getFrameArea()
		if (this.isCropped) {
			rect = this.getFrameRect()
			segments = this.crop(this.optimizer, segments, rect);
			oriparts = this.optimizer.getPartsFrom(segments);	
		}	
		let delta = new Vector(rect.x, rect.y);	
		this.cropdelta = delta;
		this.optimizer.moveBy(oriparts, delta);
		this.optimizer.trim(oriparts, Geom.dp);
		for (let i=0; i < segments.length; i++) segments[i].setRect(); // recalculate rect after moving
		rect.zeroTopLeft(); 
		return segments;
	}
	
	cropToRect(rect, segments) {		
		let oriparts = this.optimizer.getPartsFrom(segments);	
		if (this.isCropped) {
			segments = this.crop(this.optimizer, segments, rect);
			oriparts = this.optimizer.getPartsFrom(segments);		
		}		
		let delta = new Vector(rect.x, rect.y);	
		this.optimizer.moveBy(oriparts, delta);
		this.optimizer.trim(oriparts, Geom.dp);		
		for (let i=0; i < segments.length; i++) segments[i].setRect();
		return segments;
	}
	
	processOutline (rect, segments, whenDone) {
		let self = this;
		self.optimizer.setIds(segments)
		let sparts = this.optimizer.getCloneParts(segments);
		self.optimizer.setSections(sparts, rect); // classify per area so finding the crossings is faster
		tracetime("set Sections"); 
		
		self.optimizer.findCrossings(sparts, self.optimizer.areas, function (myparts, xsings) { 
			tracetime("found Crossings"); 
				if (self.done)  {
					if (Exporter.pc.el) whenDone(Exporter.pc.el)
					else whenDone (null); 
					return;
				}
				var parts = self.optimizer.splitParts(myparts, xsings);  	
				tracetime("splitted Parts"); 
				Exporter.pc.partsToPath(Exporter.pc.tstsvg, parts,  "#9300f0", "splitted Parts");	
				var list = self.optimizer.removeInnerPaths(rect, parts, segments);
				Exporter.pc.partsToPath(Exporter.pc.tstsvg, list,  "#bfff7b", "remove Inner Paths");	
		 		tracetime("remove Inner Parts"); 
				self.eliminateDuplicates(rect, list, false, function (pieces) {
					tracetime("eliminate Duplicates");	
					if (self.done) whenDone (null);
					else {
						self.adjustIfNeeded(pieces)	
						Exporter.pc.partsToPath(Exporter.pc.tstsvg, pieces,  "#b37dff", "send to path finder");	
						var cutter = new PathFinder(pieces, lastStep); 
					}
				});
		});

		function lastStep (list){	
			if (self.done) {whenDone (null); return;}
			if (list.length == 0) {
			 	Exporter.error = "Couldn't process this image";
			 		tracetime(Exporter.error);	
				whenDone (null);
				}
			else {
				var simplified =  self.simplify(list)
				whenDone (simplified)
			}
		};
	}
	
	getBorder (n,rect) {
		let svgpath = rect.svgPath();
		var p = new Path(n, false, settings.outline.stroke, svgpath);
		return this.getExpandedPathsSegments([p]);		
	}
	
	adjustIfNeeded(parts) { // pts that are classify as different when they should be equal
		var list = parts;
		var count = 0
		while (true) {
	  let joints = {} 
			var reconsider = []
			registerVertices(list, joints);
			var newcount  = Object.keys(joints).length;
			if (newcount ==  count) break;
			for (let key in joints){
				let items = joints[key];
				if (items.length < 2) reconsider.push(key)
			}	
			if (reconsider.length < 2) break;
			var compared = []
			var doAdjust = [];
			var merged  = []
			for (let i=0; i < reconsider.length; i++) {	 
				if (merged.indexOf (i) > -1) continue;
				for (var j=0; j < reconsider.length; j++) {
					if (i == j) continue;
					if (merged.indexOf (i) > -1) continue;
					if (compared.indexOf(i+"_"+j) > -1) continue;			 
					compared.push(i+"_"+j); compared.push(j+"_"+i);
					let l1 = reconsider[i].split ("_")
					let p1 = new Vector (Number(l1[0]), Number(l1[1]))
					let l2 = reconsider[j].split ("_")
					let p2 = new Vector (Number(l2[0]), Number(l2[1]))		
					if (p1.diff(p2).len().trim(0) == 0) {
						merged.push (i)
						merged.push (j)
						var partn1 = joints[reconsider[i]]
						var partn2 = joints[reconsider[j]]
						doAdjust.push ([{part: list[partn1], pt: p1}, {part: list[partn2], pt: p2}])
					}	 
				}
			}
			if (doAdjust.length == 0) break;
			for (let i=0; i < doAdjust.length; i++) {
				let pair  = doAdjust[i]
				let pt1 = pair[0].pt
				let part = pair[1].part
				let pt2 = pair[1].pt
				if (part.start.diff (pt2).len().trim(Geom.dp) == 0) part.start =  pt1;
				if (part.end.diff (pt2).len().trim(Geom.dp) == 0)  part.end =  pt1;
			}	
			count  = newcount;
		}
		return list;
	}
		
	eliminateDuplicates(rect, list, withColor, whenDone){	
	  let self = this;
	  let joints = {} 
		registerVertices(list, joints);
		var res = [];	
		var compared = []	
		var duplicates = {}
		var relations = {}
		let comparisons = []
		let zones =  [];
		let maxrect  = this.artboard.clone()
		
		for (var key in joints) zones.push(joints[key]);
		tracetime("vertices registration " + zones.length);		
		doLoop(list, zones, 0, whenDone);
		
	 function doLoop(list, zones, start, doNext) {
	 		let count = 0;
		 	for (var m=start; m <  zones.length; m++) {
				var indexes = zones[m];
				if (indexes.length < 2) continue;
				for (var k=0; k <  indexes.length; k++) {
					var i = indexes[k];
					if (!list[i]) continue;
					if (relations[i]) continue;	
					var p1  = list[i];
					if (self.isCropped && !p1.rect.intersects(maxrect)) continue;
					for (var n=indexes.length - 1;  n >= 0; n--) {	
						var j = indexes[n];
						if (!list[j]) continue;
						if (i == j) continue;
						if (compared.indexOf(i+"_"+j) > -1) continue;
						count++;						
						var p2  = list[j];
						compared.push(i+"_"+j);
						compared.push(j+"_"+i)
						if (withColor && (p1.color != p2.color)) continue;
						if (p1.equalTo(p2))  {
							let n =  (p1.strokesize < p2.strokesize) ? j : i; // n i replacement
							let k =  (p1.strokesize < p2.strokesize) ? i : j;// k i replacement
							let entry = duplicates[n] ? duplicates[n] : [];
							let other = relations[k] ?  relations[k] : [];	
							if (entry.indexOf(k) < 0) entry.push(k)
							if (other.indexOf(n) < 0) other.push(n)
						//	list[k] =  list[n].clone();	
							relations[k] = other	
							duplicates[n] = entry;	
						}		
					}		
				}
			 	if (count > 1000) break;
			}
			var fcn  = function (){doLoop(list, zones, m +1, doNext);}
			if (self.done) doNext (null)
			else if (m < zones.length) self.timeout = setTimeout(fcn, 20);
			else  {
				let removes  = [];
				for (let num in duplicates) {
					removes = removes.concat(duplicates[num])
				}
				for (let i=0; i <  list.length; i++) {
					if (removes.indexOf (i) < 0) res.push (list[i]);
				}
				doNext(res);
			}
		}
	}
	
	keepConnected (parts){
		let state = true;
		var list = parts;
		while (state) {
			let joints = {} 
			registerVertices(list, joints);
			let changed = false;
			for (let key in joints){
				let items = joints[key];
				if (items.length < 2)  {
			//		console.log (key)
					list[items[0]] = null;
					changed = true;
				}
			}
			let res = [];
			for (let i=0; i<list.length; i++) {
				if (list[i]) res.push(list[i])
			}
			list = res;
			state = changed;
		}
		return list;
	}
	
	stripLooseEnds(list, starts){
		var state = false;
		for (let i=0; i < list.length; i++) {	
			var part  = list[i]
			if (!part) continue;
			let astart = starts[part.end.toString(Geom.dp)]
			let anend = starts[part.start.toString(Geom.dp)]
			if (!astart || !anend) {
				list[i] = null
				state = true
			}
		}
		return state
	}
 	
 	simplify (list){
 		var precision = Geom.precision;
		var j = 0;
		var res = [];
		var prev =  list[j];
		j++
		for (var i=j; i <  list.length; i++){
			var part = list[i];
			if (!part) continue;
			var state = isConnected (prev, part)
			if (state) {
			 switch (part.type) {
				 case "line":
					 prev = new Part({type: "line", start: prev.start , end: part.end, strokesize: 0});		 
					 break;
				 case "arc":	
				 	 var size = prev.size + part.size;
					 prev = new Part({type: "arc", start: prev.start, end: part.end,  r: prev.r, strokesize: 0, CCW: prev.CCW, large: size > 180});	
					 break;
				 default:
				 	console.log ("not defined", part.type)
				 	res.push(prev);
					prev = part;
				 	break;
			 }
			 prev.updatePart() 			 	
			}
			else {
				res.push(prev);
				prev = part;
			}
		}
		res.push(prev);
		return res;
		
		function isConnected(prev, part) {
			if (prev.end.diff(part.start).len() > Geom.precision) return false;
			else if (part.type != prev.type) return false;
			var p;
		 	switch (part.type) {
		 		case "line":
		 			p = new Part({type: "line", start: prev.start , end: part.end, strokesize: 0});
		 			return Geom.ptInLine(prev.getMidPoint(), p);
			 	case "arc":
					if (prev.center.diff(part.center).len() > Geom.precision) return false;
					if (prev.CCW != part.CCW) return false;
					if (prev.r != part.r) return false;
					if (prev.size + part.size > 350) return false;
					let size = prev.size + part.size;
					p = new Part({type: "arc", start: prev.start, end: part.end,  r: prev.r, strokesize: 0, CCW: prev.CCW, large: size > 180});	
					p.updatePart() 			 	
					return Geom.ptInArc(prev.getMidPoint(), p);
				default: return false;
		 	}	 			 	
		}
 	}
 	
 	getHairlineSegments(paths){ 
		let optimizer = this.optimizer;
		var res = [] ;
		for (let i=0; i < paths.length; i++) {
			let p = paths[i];
			let list = this.splitLargeArcs(optimizer.getPartsFrom(p.segments));
			p.recalculateSegments(list);
			res =res.concat(p.segments);
		}
		return res;
	}
 	 
 	getExpandedPathsSegments(paths){ 
		let self = this;
		var res = [] ;
		for (let i=0; i < paths.length; i++) res = res.concat (paths[i].expand())
		return res;
	}
	
	partsToSVG (rect, list){
		var el = SVG.top(rect.width,rect.height);
		this.partsToPath(el, list);
		return el;
	}

	splitLargeArcs (parts){ // to simplify algorithms
		let res = [];
 		for (let i=0; i<parts.length; i++) {
 				let p = parts[i];
 				if (p.type!= 'arc') res.push (p);
 				else 	res = res.concat(p.split());
 		}
 		return res;
	}
			
	partsToPath(svg, list, c, name){
		if (list.length == 0) return;
		var attr = {"fill": this.attr.fill, "stroke": c ? c : this.attr.stroke, "stroke-width": _debug ? 1 : this.attr.pensize, 
			"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};		
		if (name)	attr.id = name;
		attr["d"] = this.getSVGPath(list);
		SVG.addChild(svg, "path", attr)
	}
	
	getSVGPath(list){
		var precision = Geom.precision;
		var j = 0;
		while (!list[j]) j++
		var start = list[j].start.trim(Geom.dp)
		var d = "M"+start.x+","+start.y;
		var lastpos;
		for (var i=j; i <  list.length; i++){
			var part = list[i];
			if (!part) continue
			var cmd = "";
			if (lastpos) {
				if (lastpos.diff(part.start).len() > precision) {
					var pstart = part.start.trim(Geom.dp)
					if (lastpos && lastpos.diff(start).len() < precision) cmd+="z";
					cmd+="M"+pstart.x+","+pstart.y;
					start = part.start.trim(Geom.dp);
				}
			}
			lastpos = part.end.trim(Geom.dp)
			cmd+= part.getCmd(Geom.dp);
			d+=cmd;
		}	
		if (lastpos && lastpos.diff(start).len() < precision) d+="z";
		return d;
	}

	removeBkg (xml, state) {
		let elem = xml.getElementById("background")
		if (!elem) return;
		if (state &&  (elem.getAttribute('fill') != '#fafafa')) return;
		else return elem.parentNode.removeChild(elem);
	}
	
	getBkgColor (svg) {
		let elem = svg.getElementById("background")
		if (!elem) return ""
		else return elem.getAttribute("fill")
	}
	
	getPaths (svg) {
		let res  = []
		for (var i = 0; i <  svg.childElementCount; i++) {
		var elem = svg.childNodes[i];
			if (elem.id == "background") continue;
			switch (elem.tagName.toLowerCase()) {
				case "g": res = res.concat(this.getPaths(elem)); break;			
				case "circle": res.push(this.circleGetPath(elem));  break;
				case "path": res = res.concat(this.getCompoundPaths(elem)); break;
			}		
		}
		return res;
		
		function curate(l){
				let res  = [];
				for (let i=0; i < l.length; i++) {
					if (!l[i].isEmpty ()) res.push (l[i])
					else console.log ("empty path")
				}
				return res;
			}
		}

	getCompoundPaths(elem){
		let res = []
					var d = elem.getAttribute("d");
		if (!d) return res;
					var sw = elem.getAttribute("stroke-width")
					var isfill = elem.getAttribute("fill") != "none"
		var color  = isfill ?   elem.getAttribute("fill") :  elem.getAttribute("stroke")
					sw = !sw ? 0 : sw
		var p = new Path(sw, isfill, color, d);
					  res.push(p);
		return p;
					}
	
	circleGetPath(p){
		var fillstate = p.getAttribute("fill") != "none"
		var color = fillstate ?  p.getAttribute("fill") : p.getAttribute("stroke")
		let cx =  Number(p.getAttribute('cx'));
		let cy = Number(p.getAttribute('cy'));
		let r = Number(p.getAttribute('r'));
		var pos = new Vector (cx - r, cy);
    var seg = new Segment (pos, 0)
    var pos2 = new Vector (cx + r, cy);
    seg.parts.push( seg.getArc(pos, pos2, r, 0,  false, false));
    seg.parts.push( seg.getArc(pos2, pos, r, 0, false, false));  
    seg.trim(Geom.dp);     	
		let d = seg.getPathCommands()
		return new Path(0, true, color, d)	
	}

	shiftBy (svg, dx, dy) {
		for (var i = 0; i <  svg.childElementCount; i++) {
			var elem = svg.childNodes[i];
			elem.setAttribute("transform", "matrix( 1 0 0 1 " + dx + " " + dy+")");
		}
	}

	crop (op, segments, rect) {
		let list = [];
		let isexpanded  = 	this.modetype == "outline"
		for (let i=0; i <segments.length; i++) {
			let seg = segments[i];
			seg.setRect();
			if (!seg.rect.intersects(rect)) continue;
			let newseg = seg.crop(op, i, rect, isexpanded);
			if (!newseg) continue;
			newseg.setRect();
			list.push(newseg);
		}
		return list;
	}

	////////////////////////////
	//
	// Processed Segments
	//
	////////////////////////////

	getSegments(whenDone){
		let self  = this;
		let list = this.getPaths(this.svg)
		list  = this.removeDuplicatePaths(list)
		self.processMasks(self.basecolor, list, whenDone)
	}

	removeDuplicatePaths(list){
		let res =[];
		var compared = []	
		var remove = []
		for (let i = 0; i < list.length; i++) list[i].attrd = list[i].getSVGpath()
		for (let i = 0; i < list.length; i++) {
			for (let j = 0; j < list.length; j++) {
			 		if (i == j) continue;
					if (compared.indexOf(i+"_"+j) > -1) continue;			 
					compared.push(i+"_"+j); compared.push(j+"_"+i);
					if (list[i].strokewidth != list[j].strokewidth)  continue;
					if ((list[i].color == this.basecolor) && (list[j].color!= this.basecolor)) continue;
					if ((list[i].color != this.basecolor) && (list[j].color == this.basecolor)) continue;
			//		if (list[i].color != list[j].color)  continue;
					if (list[i].comparePaths(list[i].attrd,  list[j].attrd)) {
						var pos = i < j ? i : j
						remove.push (pos)
					}	
			}	
		}
  
		var unique = [...new Set(remove)];

		for (let i = 0; i < list.length; i++)  {
			if (remove.indexOf(i) < 0) res.push (list[i])
		}
		return res
	}
	
	getSegmentsGroups (color, pathlist, whenDone){
		var drawcount = 0;
		var segmentgroups = [];
		var maskgroup = []
		var drawsegments = []
		var flag = false;		
		let self = this;
		var currentpos = 0
		oneByOne ();	
		
		function oneByOne () {
			if (currentpos< pathlist.length) doOne()
			else {
				if (drawsegments.length > 0) segmentgroups.push (drawsegments) 
				if (maskgroup.length > 0) self.consolidatePaths (maskgroup, doEnd)
				else whenDone(segmentgroups)
			} 
		}
		
		function doEnd (paths){
			let masksegments= self.getExpandedPathsSegments(paths);
			segmentgroups.push (masksegments)
			whenDone(segmentgroups)
		}
		
		function storeIt(paths) {
			var masksegments= self.getExpandedPathsSegments(paths);
			segmentgroups.push (drawsegments)
			segmentgroups.push (masksegments)
			let elem = pathlist[currentpos];
			drawsegments = self.getExpandedPathsSegments([elem])
			maskgroup = []
			currentpos++;
			oneByOne ()
		}
		
		function doOne(){	
			let elem = pathlist[currentpos];
			if (elem.color == color) {
				if (drawcount > 0) maskgroup.push (elem)
				currentpos++;
				oneByOne ()
			}
			else {
				if (maskgroup.length > 0) self.consolidatePaths (maskgroup, storeIt)
				else {
					drawcount++;
					var expanded = self.getExpandedPathsSegments([elem])
					drawsegments = drawsegments.concat(expanded)	
					currentpos++;
					oneByOne ()
				} 
			}
		}
	}

	processGroupMasks(color, groups, whenDone) {
		var drawsegments = [];
		var masksegments = []
	//	let res = [];
		var flag = false;		
		let self = this;
		var currentpos = 0
		oneByOne ();	
	
		function oneByOne () {
			if (currentpos< groups.length) doOne()
			else {
				if (masksegments.length > 0) doErase(masksegments, whenDone)
				else whenDone(drawsegments)
			} 
		}

		function doOne(){	
			let group = groups[currentpos];
			if (group[0].color == color) {
				if (drawsegments.length > 0) masksegments = masksegments.concat (group)
				currentpos++;
				oneByOne ()
			}
			else {
				if (masksegments.length > 0) doErase(masksegments, gotSegments)		
				else {
					drawsegments = drawsegments.concat(group)	
					currentpos++;
					oneByOne ()
				} 
			}
  	}
  
		function gotSegments (segmentlist){
		//	console.log ("gotSegments", segmentlist)
			let group = groups[currentpos];
			masksegments = [];
			drawsegments = segmentlist.concat (group)
			currentpos++;
			oneByOne ()			
  	}

		function doErase (masks, mycallback){
			for (let i=0; i < masks.length; i++) {
				let clone = masks[i].clone()
		//		 Exporter.pc.partsToPath(Exporter.pc.tstsvg, self.optimizer.getCloneParts(drawsegments) ,  "#ff0000", "draw segments");
		//		 Exporter.pc.partsToPath(Exporter.pc.tstsvg, clone.parts,  "#ffcc00", "mask");
				drawsegments = clone.mask(self.optimizer, drawsegments)
			}
			mycallback(drawsegments)
		}	
	}
	
	consolidatePaths (paths, callback) {
		var res =[];
		let self = this;
		res.push (paths[0])
		doNext (1);
		
		function doNext (i) {
			if (i< paths.length) doOne(i)
			else callback(res)
	}
	
		function doLast (n, p) {	
			res.push (p)
			n++;
			doNext(n)
	}
	
		function doOne(n) {
			var p1 = res.pop();
			var p2 =  paths[n];
			let storeValue  = function (p) {doLast(n, p)};
			if (p1.isEqual(p2)) p1.merge (self, p2, storeValue)
			else {
					res.push (p1)
					res.push (p2)
					n++;
					doNext(n)
			}
		}
	}
}

