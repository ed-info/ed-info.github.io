/* © 2018 Playful Invention Company - Paula Bont‡ */

class Optimizer {
	constructor() {
		this.factor = 2;
		this.areas = {};
		this.segmentAreas = {}
	}

	trim(list, n){
		for (let i=0; i < list.length; i++) list[i].trim(n);
	}

	setIds(list, attr) {
		for (let i=0; i <  list.length; i++) {
			list[i].id = i;
			if (attr) list[i][attr] = i;
			for (let j=0; j < list[i].parts.length; j++){
				let p = list[i].parts[j];
				p.segn = i;
				if (attr) p[attr] = i;
			}
		}
	}

	////////////////////////////
	// Find Crossings
	///////////////////////////
	
findCrossings (list, areas, whenDone){
	var dt =  Date.now();
  var ddt =  Date.now();	 
	var maximun =  600 * 1000; // 10 minutes;
 	let self = this; 
	 var res = [];	
	 var compared = []	
	 let zones =  [];
	 let precision =  Geom.precision;
	 for (var key in areas) zones.push(areas[key]);
	 doLoop(list, zones, 0, whenDone);
	 
	 function doLoop(list, zones, start, doNext) {
	 		var count = 0;
		 	for (var m=start; m <  zones.length; m++) {	 
			 var indexes = zones[m]
			 if (indexes.length <  0) continue
			 for (var k=0; k <  indexes.length; k++) {
				 var i = indexes[k]
				 for (var n=indexes.length - 1;  n > 0; n--) {	
					 var j = indexes[n]
					 if (i == j) continue;
					 if (compared.indexOf(i+"_"+j) > -1) continue;			 
					 compared.push(i+"_"+j); compared.push(j+"_"+i);
					 if ((list[i]== null) ||  (list[j]== null)) continue;
					 if (!list[i].rect.intersects(list[j].rect)) continue;
					 var p1 = list[i].clone();
					 var p2 = list[j].clone();
					 count++;			
					 let xsings = self.getCrossingList(p1, p2);
					 for (let m=0; m < xsings.length; m++) {
					 		let xross = xsings[m]
							res.push({index1: i, index2: j, pt: xross});		
					}
				 }
			 }	 
			 if (count > 500) break;
			 ddt =  Date.now();	 
			 if ((ddt - dt) > maximun) break;
		 }
		var fcn  = function (){doLoop(list, zones, m+1, doNext);}
		if (Exporter.pc && Exporter.pc.done) { // close dialog while doing it
				doNext(list, undefined);  
			} 
		else if (m < zones.length) self.timeout = setTimeout(fcn, 20);
		else doNext(list, res)
	 }
 } 
 
 getCrossingList (p1, p2){ // state = true to include tangents
		let xsings = []
		var intersect = [];	
	 	p1.updatePart();
 		p2.updatePart();
// 		if (p1.seg == p2.seg) return xsings;
 //		if (p1.equalTo(p2)) console.log ('getCrossingList', p1.type, p1.partnumber, "size", p1.len(), "is equal",  p2.type, p2.partnumber, p2.len())
 		if (p1.equalTo(p2)) return xsings;
 
	//	console.log(p1.type+p2.type);
		switch(p1.type+p2.type){
			case "lineline": 
				intersect = Geom.linesIntersect (p1, p2)
				break;
			case "linearc": 
				var pts = Geom.lineIntersectCircle (p1, p2)
				intersect = (pts.length > 0) ? Geom.getArcIntersect(pts, p1, p2) : [];	
				break;
			case "arcline":				
				var pts = Geom.lineIntersectCircle (p2, p1);
				intersect = (pts.length > 0) ? Geom.getArcIntersect(pts, p2, p1) : [];
					break;
			case "arcarc":		
				var pts = Geom.circleIntersectCircle (p1, p2);	
	//			console.log (pts,  Geom.getArcIntersectArcs(pts, p1,  p2))
			//	if (p1.corner || p2.corner) console.log (pts, p1, p2);
				xsings = (pts.length > 0) ? Geom.getArcIntersectArcs(pts, p1,  p2) : []
				break;
			}
		xsings = xsings.concat(intersect)
	//		console.log (p1.type+p2.type, p1.partnumber, p2.partnumber, xsings)
		return xsings
	}
	
	////////////////////////////
	// Path grid classification
	///////////////////////////
		
	assignArea (rect, parts, area) {	
		let self  = this;
		self [area] = {};
		let factor = self.factor;			
	 	var cpr =  this.getCellsPerRow(rect);
	 	for (let i=0; i < parts.length; i++) {	
	 		if (!parts[i]) continue;
			let list = parts[i].keys;
			for (let j=0; j<list.length; j++) {
				var pos = list[j]
				var values = self [area][pos] ? self [area][pos] : []
				if  (values.indexOf(i) <  0) values.push(i)		
				self[area][pos]  = values;
			}	
		} 
		return self [area];
	}
	
	ptToArea(pt, rect){
		let factor = this.factor;
		var row =  pt.y / factor;
		var col = pt.x / factor;
		var cpr = this.getCellsPerRow(rect);
	 	return Math.floor (col) + Math.floor (row) * cpr;
	}

	ptToAreas(pt, rect){
		var res =  []
		let factor = this.factor;
		var row =  pt.y / factor;
		var col = pt.x / factor;
		var cpr = this.getCellsPerRow(rect);
		var n =  Math.floor (col) + Math.floor (row) * cpr;
		res.push (n+1);
		res.push (n);
		res.push (n-1);
		row--;
		n =  Math.floor (col) + Math.floor (row) * cpr
		res.push (n+1);
		res.push (n);
		res.push (n-1);
		row++; row++; 
		n =  Math.floor (col) + Math.floor (row) * cpr
		res.push (n+1);
		res.push (n);
		res.push (n-1);
		return res;
	} 
 		
	setSections (list, rect){
		let cpr = this.getCellsPerRow(rect);		
		for (let i=0; i < list.length; i++) {
			if (!list[i]) continue
			list[i].setSections(this.factor, rect,  cpr);
		}
		this.assignArea(rect, list, "areas")
	}
	
	setSegmentSections(list, rect){
		let cpr = this.getCellsPerRow(rect);		
		for (let i=0; i < list.length; i++) {
			if (!list[i]) continue
			list[i].setSections(this.factor, rect,  cpr);
		}
		this.assignArea(rect, list, "segmentAreas")
	}
			
	getCellsPerRow(rect) { return Math.round (rect.width / this.factor);}
	
	removeInnerPathsFrom (rect, color, parts, allseg) {	
		var segments = excludeMasks (color, allseg)
		this.setSegmentSections(segments, rect);
		
		this.setSections(parts, rect); // clone parts need to do it again		
		var res = []
		var compared = [];
		for (let i=0; i<parts.length; i++){
			let p=parts[i];
			if (!p) continue;
			p.segn = p.oldSegn;
			var mid = p.getMidPoint()
			var cells = this.ptToAreas(mid, rect);	
			var positions = []
			for (let j=0; j<cells.length; j++){
				let cell = cells[j]
				let values  = this.segmentAreas[cell]
				if (!values) continue;
			 	positions = positions.concat (values);
			}
			positions = [...new Set(positions)]; // unique positions
			positions.sort(function(a, b) {return Number(a) - Number(b)});
			var val = this.isInnerPt(p, mid, positions, segments);
			if (val) continue;
			res.push(p);
		}
		return res
		
		function excludeMasks (color, allseg){
			let total  = [];
			for (let i=0; i < allseg.length; i++){
				if (allseg[i].color == color) continue;
				else total.push (allseg[i])
			}	
			
			var result = []
			for (let j=0; j < total.length;  j++) {
				let ms =  total[j]
				if (!ms) continue;
				result[ms.id] = ms
			}
			return result;	
		}
	}
	
	removeInnerPaths (rect, parts, segments) {
		this.setSegmentSections(segments, rect);
		this.setSections(parts, rect); // clone parts need to do it again		
		var res = []
		var compared = [];
		for (let i=0; i<parts.length; i++){
			let p=parts[i];
			if (!p) continue;
			var mid = p.getMidPoint()
			var cells = this.ptToAreas(mid, rect);	
			var positions = []
			for (let j=0; j<cells.length; j++){
				let cell = cells[j]
				let values  = this.segmentAreas[cell]
				if (!values) continue;
			 	positions = positions.concat (values);
			}
			positions = [...new Set(positions)]; // unique positions
			positions.sort(function(a, b) {return Number(a) - Number(b)});
			var val = this.isInnerPt(p, mid, positions, segments);
			if (val) continue;
			res.push(p);
		}
		return res
	}
	
	isInnerPt (p, mid, positions, segments) {	
		var myseg = segments[p.segn]
		if (!myseg) return false;
		for (let i=0; i <  positions.length; i++) {
			var seg = segments[positions [i]];
			if (!seg) continue;	
			if (p.segn == seg.id) continue;	
			var action = this.checkInsideDuplicates(mid, p, myseg, seg)
			if (action == "keep") continue;	
			else if (action == "delete") return true;	
			else  {
			var inside = seg.containsPart(p);
			if (inside) return true;
			}	
		}
		return false;
	}

	checkInsideDuplicates(mid, p, myseg, seg) {
		if (p.corner || p.border) return "check"
		var p2 = seg.getPartHitted(mid);
		if (!p2) return "check";
		var inside = p.insideOf(p2)
		if (!inside) return "check";
		// found and overlapping part
		for (let i=0; i < myseg.parts.length; i++ ) { // check the initial part segment to see how it is overlapping
			let m =  myseg.parts[i]		
			if (m.equalTo(p)) continue; // already compared
			let mp = m.getMidPoint();
			let hit  = seg.ptInSegmentPart(mp, p2) 
			if (hit) return "keep";  // if they hit they aren't adjacent
			var inside = seg.contains(m); // any part inside means that may be overlapping rather than adjacent.	
			if (inside) return "keep"
		}
		return "delete"
	}

////////////////////
// eliminate border points
////////////////////
			
	removeInBorder (rect, border, parts, segments) {
		var res = []
		var eliminate = [];
		var bordersegnumbers = [];
		for (let j=0; j<border.length; j++) bordersegnumbers.push (border[j].id)
		for (let j=0; j<border.length; j++){
			var seg = border[j];
			for (let i=0; i<parts.length; i++){
				let p=parts[i];			
				if (!p) continue;
				if (bordersegnumbers.indexOf(p.segn) > -1) continue;
				var inside = seg.contains(p);		
				if (!inside) continue;
				if (eliminate.indexOf(i) < 0)  eliminate.push(i);
			}
		}

		var results = new Array(parts.length) // register which border parts are invalid
		for (let j=0; j<segments.length; j++){ // j has segment number
			var seg = segments[j];
			if (bordersegnumbers.indexOf(seg.id) > -1) continue; // exclude border segments
			for (let i=0; i<parts.length; i++){		 // i has the boder parts also
				let p=parts[i];	
				if (!p) continue;
				if (bordersegnumbers.indexOf(p.segn) < 0) continue; // include only border parts
				var inside = seg.containsPart(p)  // segment (closed shape) has a border part
				if (!inside && (p.len() < 1)) { 
					// if the part is really small
					// it can fail the test because the mid point precision will hit the segment
					// in that case we should retest the endpoints
					// if the part has an odd Number of crossings it is internal
					let crossings = seg.getCrossings(new Optimizer(), p, seg.parts)
					inside = crossings.length.mod(2) == 1
				}
				if (!inside) continue;
				var ml  = results[i] ?  results[i] : [];
				if (ml.indexOf(j) < 0)  ml.push(j);
				results[i] = ml; // result [i] has the border part how many different segments had hitted
			}
		}
		
		for (let j=0; j<results.length; j++){
			var vals = results[j]
			if (!vals) continue;
			if ((vals.length % 2) != 1) continue;
			if (eliminate.indexOf(j) < 0)  eliminate.push(j);
		}

		for (let i=0; i<parts.length; i++){
			 if (eliminate.indexOf(i) > -1) continue;
			 res.push (parts[i])
		}
		return res
	}
	

////////////////////
// Paths parts
////////////////////
			
splitParts (parts, xsings){
		var cropped = []	
		for (let j=0; j < xsings.length; j++) {
			var cross = xsings[j]
			if (!cross) continue;
			 var pt = cross.pt;
			 crop (cross.index1, cross.pt)
			 crop (cross.index2, cross.pt)
		}
		return this.consolidate(parts, cropped)
			
		function crop (i, pt) {
			var list = cropped[i];
			if (list) {
				for (let k=0; k < list.length; k++)	splitPart(pt, list, k)
			} 
			else {
				list = [parts[i]]
				splitPart(pt, list, 0)
			}
			cropped[i] = list		
		}
		
		function splitPart(pt, list, k) {
			let part = list[k];
			var inpart = part.ptInPart(pt)
			let a = part.start.diff(pt).len()
			let b = part.end.diff(pt).len()
			if (!inpart) return; // IMPORTANT the pt may not longer be in the line
			else if (a == 0) return // must be zero for tight lines
			else if (b == 0) return // (test file can't do.PNG)
			else {
			 let part1 = part 
		//	 console.log (!!part.expandedfrom, part.corner)
			 let part2 = part.clone()
			 let state  = !!part.corner
			 part1.end = pt;
			 part2.start = pt;
			 part1.updatePart()
			 part2.updatePart()
			 list.splice (k+1,0, part2)
			 part2.corner =  state;
			 part1.corner = state;
			}
		}	
	}
	
 	consolidate (parts, cropped) {
		var res = []
		let self = this;
		for (let i=0; i < parts.length; i++) {
			if (cropped[i]) {
				var list = cropped[i]
				for (let j=0; j < list.length; j++) insert (list[j])
			}
			else if (parts[i]) insert (parts[i])	
		}
		
		return res;
	
	 function insert (p) {
		 if (!p) return;
		 if (p.isEmpty()) return;
		 res.push(p)	
	 }
 }
 
 	/////////////////////////////
	// Rect from expanded parts
	/////////////////////////////
	
	getRectangle(segments) {
		var rect = this.getRectFrom (segments).trim(0);
		return this.trimToFactor(rect)
	}
	
	trimToFactor(rect) {
		let x =  Math.floor (rect.x / this.factor) * this.factor;
		let y =  Math.floor (rect.y / this.factor) * this.factor;
		let w = (rect.width / this.factor).isInt() ? rect.width : (Math.floor (rect.width / this.factor) + 1) * this.factor;
		let h = (rect.height / this.factor).isInt() ? rect.height : (Math.floor (rect.height / this.factor) + 1) * this.factor;
		let r = new Rectangle (x,y, w, h);
		let dx = (r.width - rect.width) / 2 ;
		let dy = (r.height - rect.height)  / 2;
		r.x = (rect.x - dx).trim(0);
		r.y = (rect.y - dy).trim(0);	
		return r;
	}
	
	getRectFrom (segments){
	 	let rect = new Rectangle();
		for (let i = 0; i < segments.length ; i++) {
			var seg = segments[i]
			let r = seg.rect ? seg.rect : seg.getRect();
			rect = rect.union (r);
		}
		return rect;
	}
	
	getRectFromParts (parts){
	 	let rect = new Rectangle();
		for (let i = 0; i < parts.length ; i++) {
			var p = parts[i]
			let r = p.getRectangle();
			rect = rect.union (r);
		}
		return rect;
	}
		
	moveBy (parts, delta){
		for (let i=0; i < parts.length; i++) parts[i].translate(-delta.x, -delta.y);
	}

	////////////////////
	// get Segments
	////////////////////
	
	getSegments (paths){
		var list = [] ;
		for (let i=0; i < paths.length; i++) list.push(paths[i].segments)
		return list;
	}

	////////////////////
	// Segment parts
	////////////////////
	
	getCloneSegments(segments){
		var list = [] ;
		for (let j=0; j < segments.length; j++) list.push (segments[j].clone())
		return list;
	}
	
	getCloneParts(segments){
		var list = [] ;
		for (let j=0; j < segments.length; j++) {
			list = list.concat(segments[j].getCloneParts())
		}
		return list;
	}
	
	getPartsFrom (segments){
		var list = [] ;
		for (let j=0; j < segments.length; j++) {
			list = list.concat(segments[j].getParts())
		}
		return list;
	}

	getClones(parts){
		var list = [] ;
		for (let j=0; j < parts.length; j++) {
			list.push (parts[j].clone())
		}
		return list;
	}
	
	////////////////////
	// Paths parts
	////////////////////
	
	getParts (paths){
		var list = [] ;
		var n = 0;
		for (let i=0; i < paths.length; i++) {
			var segments = paths[i].segments;
			for (let j=0; j < segments.length; j++) {
				list = list.concat(segments[j].getParts(n))
				n++
			}
		}
		return list;
	}

///////////////////
// for debugging
///////////////////
	debugArcCenters  (svg, parts, c, d){
		var g = SVG.addChild(svg, 'g', {id: "centers"});	
		for (var k=0; k < parts.length; k++) {
			if (parts[k].type != "arc") continue;
			let pt =parts[k].center;
			var pie = SVG.addChild(g, 'g', {id: "center_"+k});	
			var attr = {"fill": c, 'cx': pt.x, 'cy': pt.y, 'r': d/2, id: "pt "+k +"_"+parts[k].len()};		
			SVG.addChild(pie, 'circle', attr);	
			var p1 = parts[k].start;
		 	attr = {"fill": "none", 'stroke': "#ffcc00", "stroke-width": 0.5, d:"M"+pt.x+"," +pt.y+"L"+p1.x+","+p1.y};		
			SVG.addChild(pie, 'path', attr);		
			var p2 = parts[k].end;
		 	attr = {"fill": "none", 'stroke':  "#ffcc00", "stroke-width": 0.5, d:"M"+pt.x+"," +pt.y+"L"+p2.x+","+p2.y};		
			SVG.addChild(pie, 'path', attr);		
		}
	}
	
	debugCrossings  (svg, crossings, c, d){
		var g = SVG.addChild(svg, 'g', {id: "xsings"});	
		for (var k=0; k < crossings.length; k++) {
			let pt =crossings[k].pt;
			var attr = {"fill": c, 'cx': pt.x, 'cy': pt.y, 'r': d/2, id: "pt "+k +"_"+pt.toString(Geom.dp)};		
			SVG.addChild(g, 'circle', attr);	
		}
	}
	
	debugMidPoints  (svg, parts, c, d){
		var g = SVG.addChild(svg, 'g', {id: "mid points"});	
		for (var k=0; k < parts.length; k++) {
			let pt =parts[k].getMidPoint();
			var attr = {"fill": c, 'cx': pt.x, 'cy': pt.y, 'r': d/2, id: "pt "+k +"_"+parts[k].len()};		
			SVG.addChild(g, 'circle', attr);	
		}
	}
	
	debugCrossVector (el, part, seg){
	 	let op = new Optimizer();
	 	let precision = Geom.precision; 	
		var pt = part.getMidPoint();
		var compass = part.getCompassHeading();
		var p = seg.getVector(compass, 500,  pt, true)
		var g = SVG.addChild(el, 'g', {id: pt.trim(0).toString() + "_seg_" + seg.id});	
		var attr = {"fill": "#00ff00", 'cx': pt.x, 'cy': pt.y, 'r': 4, id: "pt_"+pt.trim(0).toString()};		
		SVG.addChild(g, 'circle', attr);
		var d = "M"+p.start.x+","+p.start.y+"L"+p.end.x+","+p.end.y
		var attr = {"stroke": "#00ff00", 'd': d, id: "line_"+p.start.trim(0).toString(), "stroke-width": 1, 
				"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};	
		SVG.addChild(g, 'path', attr);
		 d = "M"+part.start.x+","+part.start.y+"L"+part.end.x+","+part.end.y
		attr = {"stroke": "#00f0ff", 'd': d, id: "part_"+part.start.trim(0).toString(), "stroke-width": 1, 
				"stroke-miterlimit": 10, "stroke-linecap": "round", "stroke-linejoin": "round"};	
		SVG.addChild(g, 'path', attr);
 	}
 	
	debugXsings (svg, parts, list, colors){
		var g = SVG.addChild(svg, 'g', {id: "xsings"});
		let c =  colors[0];
		for (var k=0; k < list.length; k++) {
			var pt = list[k].pt
			var key = parts[list[k].index1].type + parts[list[k].index2].type
			if(!pt) continue		
			switch (key){
				case "lineline": c = colors[0]; break;
				case "linearc": c = colors[1]; break;
				case "arcline":	c = colors[2]; break;
				case "arcarc": c = colors[3]; break;
			}
			var attr = {"fill": c, 'cx': pt.x, 'cy': pt.y, 'r': 1, id: "pt "+k};		
			SVG.addChild(g, 'circle', attr);	
		}
	}

displayAssignArea (svg, rect, parts, data) {
 	let self  = this;
 	let factor = this.factor;
	var g = SVG.addChild(svg, 'g', {id: "grid"});
	var cpr =  this.getCellsPerRow(rect);
	this.addGrid(g, rect)
	// paint squares
	var partsdone  = [];
	var  cd = Math.max(2, Math.floor(Turtle.colors.length /  parts.length) - 2);
	var tag = ["#000000", "#00000", "#0000", "#000", "#00", "#0", "#"];
	for (let key in data){
		let partsforrect = data[key];
		for (let i=0; i < partsforrect.length; i++) {
			let index = partsforrect[i];
			if (partsdone.indexOf(index) > -1) continue;
			let part = parts[index];
			var pos = (index * cd).mod (Turtle.colors.length)
			var c = Turtle.colors[pos].toString(16)
			c  = tag [Turtle.colors[pos].toString(16).length] + c
			let num =  Number (key)
			if ((num < g.childElementCount) && (num > -1)) g.childNodes[num].setAttribute ("fill", c)
		}	
	}
}
	
addGrid (g, rect) {
	let factor  = this.factor
	var attr = {"fill": "none", 'stroke': "#000000", "stroke-width": 0.5, 'width': factor, 'height': factor};		
	for (var j = 0; j < rect.height; j= j+factor) {
		for (var i = 0; i < rect.width; i=i+factor) {
			attr.x  = i; attr.y = j;
			attr.id = "p_"+ g.childElementCount;
			SVG.addChild(g, 'rect', attr);	
		}
	}	
	 

}
	 
}
