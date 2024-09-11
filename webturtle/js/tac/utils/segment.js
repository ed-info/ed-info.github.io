/* © 2018 Playful Invention Company - Paula Bontá */

class Segment {
    constructor (pt, size) {
		 this.parts = [];
		 this.pos = pt;
		 this.insideOf = null;
		 this.outsideOf = null;
		 this.strokesize = size;
		 this.fillInside = size==0;
		 this.cutstroke = 0
	 }
 
 setRect (){this.rect = this.getRect();}
 	
 setSections (factor, rect, cpr) {
 		this.rect = this.getRect();
 		for (let i=0; i < this.parts.length; i++) this.parts[i].setSections(factor, rect,  cpr);
 		let res = []
 		for (let i=0; i < this.parts.length; i++) res = res.concat(this.parts[i].keys);
 		res = res.sort(function(a, b) {return a  - b});
 		let keys = [];
 		for (let i=0; i < res.length; i++) {
 			if (keys.indexOf(res[i]) < 0)  keys.push({row: Math.floor (res[i] / cpr), column: res[i] % cpr})
 		}
 		let row= -1;
 		let rowcolumns = [];
 		let sectors = [];
		for (let i=0; i < keys.length; i++) {
			let nextrow = keys[i].row;
			if (nextrow!= row) {
				rowcolumns = complete(row, rowcolumns);
				sectors =  sectors.concat(rowcolumns);
				rowcolumns = [];
				row = nextrow;
			}
			rowcolumns.push(keys[i].column);
		}
 		this.keys = sectors;
 		
 		function complete (row, columns) {
 			if (columns.length == 0) return [];
 			let prev = columns[0];
 			let res = [];
 			res.push(getslot(row, prev))
 			for (let i=1; i < columns.length; i++){
 				let next = columns[i];
 				let len = next - prev;
 				for (let j=0; j < len; j++) res.push(getslot(row, prev + j + 1));
 				prev = next;
 			}
 			return res;
 		}
 		
 		function getslot(row,col){return col + row * cpr;}
 	}
 	
	 getRect () {
		 let rect = new Rectangle();
		 for (let j = 0; j < this.parts.length ; j++) {
			 var r = this.parts[j].getRectangle();
			 rect = rect.union (r);
		 }
		 this.rect = rect;
		 return rect;
	 }

  getPartHitted(pt) {
 		let parts = this.parts;
 		for (let i = 0; i < parts.length; i++){
 			let p2 = parts[i];
 			if (p2.ptInPart(pt)) return p2; 
 		}
 		return null
 	}
 		
 	hitPartEnds(pt, prec) {
 		let parts = this.parts;
 		for (let i = 0; i < parts.length; i++){
 			let p = parts[i];
 			let hitstart = pt.diff(p.start).len() < prec;
			let hitend = pt.diff(p.end).len() < prec;
	 		if (hitstart ||  hitend) return true; 
 		}
 	}
 		
 containsPart(part) {
		var precision = Geom.precision;
		var parts = this.parts;
		var pt = part.getMidPoint();
		if (!this.rect.hitRect(pt)) return false;
		// do not include parts that are hit path line
		if (this.ptInSegment(pt)) return false
 		var compass = part.getCompassHeading();
 		var p = this.getVector(compass, 1000000,  pt, true)
 		// do not include parts that hit the start or end points
 		var crossings = this.getCrossings(new Optimizer(), p, parts)
		return crossings.length.mod(2) == 1
 }
 
	hasEqual(pt, part) {
		for (let i = 0; i < this.parts.length; i++){
 			let p2 = this.parts[i];
 			var midpointdist = pt.diff(p2.getMidPoint()).len().trim (Geom.dp) <= Geom.precision			
 			var foundsimilar  = part.equalTo(p2);
 			if (!foundsimilar) continue;
 			if (midpointdist) return true;
 		}		
 		return false;
	}
	
	ptInSegment(pt) {
		for (let i = 0; i < this.parts.length; i++){
 			let p2 = this.parts[i];
 			var inseg = p2.ptInPart(pt);
 			if (inseg) return true
 		}		
 		return false;
	}
	
	ptInSegmentPart(pt, p) {
		for (let i = 0; i < this.parts.length; i++){
 			let p2 = this.parts[i];
 		//	console.log (p2)
 			// IMPORTANT more forgiving precision so it favours including the part
 			var inseg = p2.ptInPart(pt);	
 			let ahit =  !inseg  ? false : !p.equalTo(p2)
 			if (ahit) return p2
 		}		
 		return null;
	}
 	
	getCrossings(op, p1, parts) {	
	//	var pt = p1.end;
		var res = []
 		for (let i = 0; i < parts.length; i++){
 			let p2 = parts[i]
 			let xsings = op.getCrossingList(p1, p2);
 			for (let m=0; m < xsings.length; m++) {
				 // skip if it is already a joint
				 	let xross = xsings[m]
					res.push(xross.toString(Geom.dp));
			 }	
 		}		
 		var unique = [...new Set(res)];
 		return unique;
	} 		

 	getParts (){return this.parts}

	clone (){
		var newseg = new Segment(this.pos, this.strokesize)
		for (let key in this) {
			switch (key) {
				case 'parts': newseg.parts = this.getCloneParts (); break;
				default:
					newseg[key] =  this[key] && this[key].clone ? this[key].clone() : this[key];
					break;
 	}
 	
		}
		newseg.setRect()
		return newseg;
	}

 	getCloneParts (){
 		var res = [];
 		for (let i = 0; i < this.parts.length; i++){
 			let p = this.parts[i].clone();
 			res.push(p);
 		}
 		return res;
 	}
 		
	addLine (pt) {
		var obj = new Part({type: "line", start: this.pos, end: pt, strokesize: this.strokesize});
		this.parts.push (obj) 
		this.pos = pt
	}
		
	addArc (cmd) {
		var pt =  new Vector(cmd[6],  cmd[7])
		var r = cmd[1];
		var attr = {type: "arc", start: this.pos, end: pt, r: r, strokesize: this.strokesize, large: cmd[4] == 1,  CCW: cmd[5] == 0};
		var obj = new Part(attr);	
		this.parts.push (obj)
		this.pos = pt;
	}
	
	getArc (start, pt, r, size, islarge,  ccw) {
		var attr = {type: "arc", start: start, end: pt, r: r, strokesize: size, large: islarge, CCW: ccw};
		return new Part(attr);	
	}
	
	endPath () {
		if (this.parts.length == 0) return;
		var first  = this.parts[0].start.trim(Geom.dp);
		var end = this.pos.trim(Geom.dp);
		if (first.diff(end).len() != 0) this.addLine (first)
	}
	
	getPathCommands (){
		if (this.parts.length == 0) return "";
		var laststart = this.parts[0].start.trim(Geom.dp)
		var start = laststart
		var d = "M"+start.x+","+start.y;
		var lastpos;
		for (var i=0; i <  this.parts.length; i++){
			var part = this.parts[i];
			var cmd = "";
			if (lastpos) {
				if (lastpos.diff(part.start).len() > Geom.precision) {
					var pstart = part.start.trim(Geom.dp)
					cmd+="M"+pstart.x+","+pstart.y;
					var laststart = part.start;
				}
			}
			lastpos = part.end
			cmd+= part.getCmd(Geom.dp);
			d+=cmd;
		}	
		if (lastpos && lastpos.diff(laststart).len() < Geom.precision) d+="z";
		return d;
	}

	isclosed (){	
		if (this.parts.length < 2) return false;
		var start = this.parts[0].start
		var pt = this.parts[this.parts.length - 1].end
		return start.diff(pt).len() < Geom.precision; 
	}
	
	sortByClosestTo(pt) {
		if (this.parts.length < 2) {
			if (pt.diff(this.parts[0].start).len() > pt.diff(this.parts[0].end).len()){
				this.flip()
				return
			}
		}
		let result = []
		for (let i=0; i < this.parts.length; i++)  {
			this.parts[i].mypos = i;
			result.push (this.parts[i])
		}
		result = result.sort(function(a, b) {		
			return a.start.diff(pt).len() - b.start.diff(pt).len() 
		});
		let pos = result[0].mypos
		if (pos != 0) {
			let start  = this.parts.splice (pos, this.parts.length)
			let all = start.concat (this.parts)
			this.parts = all;
		}
	}

	getClosetTo(pt) {
		if (this.parts.length < 2) return this.parts[0].start.diff (pt)
		let result = []
		for (let i=0; i < this.parts.length; i++)  {
			this.parts[i].mypos = i;
			result.push (this.parts[i])
		}
		result = result.sort(function(a, b) {		
			return a.start.diff(pt).len() - b.start.diff(pt).len() 
		});
		let pos = result[0].mypos
		return this.parts[pos].start.diff (pt)
	}
	
		
	///////////////////////
	// Expand functions
	///////////////////////

	expand(){ 
		var res = []
		for (let i=0; i <  this.parts.length; i++){
			let expanded  = this.expandPart(this.parts[i])
			if (!expanded) continue
			res.push (expanded)
		} 
		return res;
	}
	
	expandPart(part){
		let size  = part.strokesize
		let p = part.clone();
		var data = {outside:[], inside:[]}
		part.expand(data);	
		var elems = data.outside.concat(data.inside);
		if (elems.length == 0) return null;
		var parts = this.smooth(elems);
		var seg = new Segment(parts[0].start, this.cutstroke);
		seg.parts = parts;
		seg.setcolor (this.color)
		seg.expandedfrom = part;	
		for (let i=0; i < parts.length; i++) {
			parts[i].expandedfrom = part;
			parts[i].oldstrokesize =  size;
		}
		return seg
	}
		
	smooth(list){
		var res = [];
		for (let i=1; i < list.length; i++) res = res.concat(this.joinSegments(list[i-1], list[i]))
		res = res.concat(this.joinSegments(list[list.length-1],  list[0]))
		res.shift();
		res.unshift(list[0]) // in case it has changed
		return res;
	} 
	
	joinSegments(prev, next){
	//	console.log (prev, next);
		var corner = [];
		switch(prev.type+next.type){
			case "lineline": corner = this.smoothLines(prev, next, this.strokesize);  break;
			case "linearc": corner = this.smoothLine2Arc(prev, next, this.strokesize);  break;
			case "arcline": corner = this.smoothArc2Line(prev, next, this.strokesize);  break;
			case "arcarc": corner = this.smoothArcs(prev, next, this.strokesize); break;
		}
		return [prev].concat (corner);
	}
	
	smoothLine2Arc (line, arc, radius){
		var pts = Geom.lineIntersectCircle (line, arc)
		var intersect =  (pts.length > 0) ? Geom.getArcIntersect(pts,line, arc) : [];
		var corner = []
		if ((intersect.length == 0) &&(line.end.diff(arc.start).len() > Geom.precision)) corner = this.getCorner(radius, line, arc)
		else if (intersect.length  != 0){
			line.end = intersect[0].trim(Geom.dp);
			arc.start = intersect[0].trim(Geom.dp);
			arc.updatePart()
		}
		return corner
	}

	smoothArc2Line (arc, line, radius){
		var pts = Geom.lineIntersectCircle (line, arc)
		var intersect =  (pts.length > 0) ? Geom.getArcIntersect(pts, line, arc) : [];
		var corner = []
		if ((intersect.length  == 0) &&(arc.end.diff(line.start).len() > Geom.precision)) corner = this.getCorner(radius, arc, line)
		else if (intersect.length  != 0) {
			arc.end = intersect[0];
			arc.updatePart();
			line.start = intersect[0];
		}
		return corner
	}
	
	getCorner (r, prev, next){
		var canclose = (prev.end.diff(next.start).len() -  Math.sqrt(r*r*2)) <  Math.sqrt(r*r*2)
		if (canclose) {
			let cap = this.getArc(prev.end, next.start, r, this.cutstroke, false, false)
			cap.corner = true;
			// = cap.size == 180;
			return [cap]
		 }
		 return []
	 }
					
	smoothArcs (prev, next, radius){
		var pts = Geom.circleIntersectCircle (prev, next)
		var xsings = (pts.length > 0)  ? Geom.getArcIntersectArcs(pts, prev,  next) : [];	
		var res = [];
	 	if ((xsings.length == 0) &&(prev.end.diff(next.start).len() > Geom.precision))  res = this.getCorner(radius, prev, next)
		else if (xsings.length > 0) {
			var pt = xsings[0]
			prev.end = pt;
			next.start = pt;
			prev.updatePart()
			next.updatePart()
		}
		return res
	}
	
	smoothLines (prev, next, radius){
		var intersect = Geom.linesIntersect (prev, next)
		var corner = []
		if (intersect.length == 0) corner = this.getCorner(radius, prev, next)
		else {
			prev.end = intersect[0];
			next.start = intersect[0];
		}	
		return corner
	}
	
	
	///////////////////////
	// crop functions
	///////////////////////
	
 rectToParts(rect){
		var x = rect.x;
		var y = rect.y;
		let edges = []
		edges.push (new Part({border: true, type: "line", start: new Vector (x, y), end: new Vector (x+rect.width, y), strokesize: 0}));	
		edges.push (new Part({border: true, type: "line", start: new Vector (x+rect.width, y), end: new Vector (x+rect.width, y+rect.height), strokesize: 0}));	
		edges.push (new Part({border: true, type: "line", start: new Vector (x+rect.width, y+rect.height), end: new Vector (x, y+rect.height), strokesize: 0}));	
		edges.push (new Part({border: true, type: "line", start: new Vector (x, y+rect.height), end: new Vector (x, y), strokesize: 0}));	
		return edges;
	}
	
	crop (optimizer, n, rect, expanded){
		let self  = this;
		let edges = this.rectToParts(rect);
		for (let i = 0; i < edges.length; i++) edges[i].segn = n;
		let res = [];
		var total = 0;
		for (let i = 0; i < this.parts.length; i++) {
			let p1 = this.parts[i];
			for (let j = 0; j < edges.length; j++) {
				let xsings = optimizer.getCrossingList(p1, edges[j]);
				total += xsings.length;
				for (let m=0; m < xsings.length; m++) res.push({index1: i, index2: this.parts.length + j, pt: xsings[m]});
			}
		}
		if (res.length == 0) { // no crossings
			if (!self.inside(rect)) return null;
			else return this;
		}
		let myparts = this.getCloneParts().concat(edges);
    let elems = optimizer.splitParts(myparts, res);  
    let result  = [];
		for (let i = 0; i < elems.length; i++) {
			let part =  elems[i];
			let mid = part.getMidPoint();
			if (expanded &&  part.border && self.contains(part)) result.push(part);
			else if (!part.border && rect.hitRect(mid)) result.push(part);
		}
   	var seg = new Segment(result[0].start,  self.strokesize);
		seg.parts = result;
		return seg;
	}

	inside (rect) {
		for (let i = 0; i < this.parts.length; i++) {
			let p = this.parts[i];
			if (rect.hitRect(p.start)) return true;
			if (rect.hitRect(p.end)) return true;
		}
		return false;
	}
	
	flip (){
		let res =[]
		var l1 =  this.parts;
		for (let i=0; i< l1.length; i++) {
			let p = l1[i];
			p.flip();
			res.unshift(p);
		}
		this.parts = res;
	}	

 trim (dp) {
 	this.pos = this.pos.trim(dp);
 	for (let i=0; i < this.parts.length; i++) this.parts[i].trim(dp);
 }	
 
 contains (part){
	let op = new Optimizer();
	let precision = Geom.precision; 	
	var pt = part.getMidPoint();
	let parts  = this.parts;
	if (!this.rect.hitRect(pt)) return false;
	var compass = part.getCompassHeading();
	var p = this.getVector(compass, 1000000,  pt, true)
	var crossings = this.getCrossings(new Optimizer(), p, parts)
	return crossings.length % 2  == 1
}

 getVector(compass, size, pt, state) {	
	var start;
	let linesize = size;
	switch (compass){
		case "N": 
			start = state ? new Vector(pt.x,pt.y-linesize) : new Vector(pt.x, pt.y+linesize); 
			break;
		case "E": 
			start =  state ? new Vector(pt.x+linesize, pt.y) : new Vector(pt.x-linesize, pt.y);
			break;
		case "S":
			 start =  state ? new Vector(pt.x, pt.y+linesize) :  new Vector(pt.x, pt.y-linesize);
			 break;
		default:
		 start = state ? new Vector(pt.x-linesize, pt.y) : new Vector(pt.x+linesize, pt.y); 
		 break;		
	}	
	var p1 = new Part({type: "line", start: start , end: pt, strokesize: 0});	
	return p1
}

setcolor (color) {
 	this.color = color;
 	for (let i=0; i < this.parts.length; i++) this.parts[i].color = color;
 }	
 
 
///////////////
//
// Masking
//
/////////////

	mask(optimizer, segments) {
		let self  = this;
		optimizer.setIds ([self].concat(segments))
		this.setRect()
		this.trim(Geom.dp)
		let res = []
		for (let i = 0; i < segments.length; i++) {
			let drawseg = segments[i];
			let seg = drawseg.clone()
			seg.trim(Geom.dp)
			if (!seg.rect.intersects(self.rect)){
				console.log ("no erase" , seg.id, "with mask", self.id)
				res = res.concat (seg)
			} 
			else {
				let result  = seg.erase(optimizer, self);
				for (let i=0; i< result.length; i++) result[i].resetVariables(seg);
				res  = res.concat(result)
			}
		}
		return res;
	}
	
	reverse (){
		var list  = this.getCloneParts();
		for (let i = 0; i < list.length; i++) {
			let p = list[i]
			p.flip ()
			p.flipped = false;
		}
		return list;
	}
	
	erase (optimizer, mask) {
		let self = this;
		this.setRect();
		var segparts  = this.getCloneParts()
		let maskparts = mask.getCloneParts()
		let xsings = this.getMaskCrossings(optimizer, maskparts, segparts)

		if (xsings.length == 0) {
			let both = self.rect.union(mask.rect).trim(Geom.dp)
			var maskinside = both.isEqual(self.rect.trim(Geom.dp));
			var maskoutside = both.isEqual(mask.rect.trim(Geom.dp))
			let type = keepOrDiscard (maskinside, maskoutside)
			switch (type){
				case "keep": return [self.clone()];
				case "addmask":
					let maskseg = mask.clone()
					var list  = maskseg.parts.reverse()	
					self.parts = self.getCloneParts().concat (list); // compound path
					return [self]
				default: return []
			}
		}
		
		let myparts = maskparts.concat(segparts);		
    let elems = optimizer.splitParts(myparts, xsings); 
  	return this.eraseSegment(mask, elems)
  	
  	function keepOrDiscard(inside, outside){
			if (!inside && !outside) return "keep"
			if (inside) return "addmask"
			else if (outside) return "discard"; // erase everything	
			else return "keep"
  	}
	}

	divideSegments (parts) {
		let maskparts = []
		let segparts = []
		for (let i = 0; i < parts.length; i++) {
			let p = parts [i]
			if (p.isMask) maskparts.push(p)
			else segparts.push (p)
		}
		
		var mseg = new Segment(maskparts[0].start,  0);
		mseg.parts = maskparts;
		mseg.setcolor (maskparts[0].color)
		mseg.setRect();
		var pseg = new Segment(segparts[0].start,  0);
		pseg.parts = segparts;
		pseg.setcolor (segparts[0].color)
		pseg.setRect();
		return {seg: pseg, mask: mseg}	
	}

	eraseSegment	(mask, elems) {
	  var newparts  = [];
	 	let compare  = this.divideSegments (elems)
	// 	console.log ("eraseSegment", this.id, compare.seg.parts.length, compare.mask.parts.length)
	  let optimizer  = new Optimizer();
		for (let i = 0; i < elems.length; i++) {		
			let part =  elems[i].clone();
			var action = this.getPartAction(part, part.isMask ? compare.seg : compare.mask)
			var include = true
			var check = []
		
			switch (action) {
				case "same": include = !!part.isMask; break;
				case "edge": include = !!part.isMask;  break;
				case "inside": include = !!part.isMask;   break;
				case "outside": include = !part.isMask; break;
				default: break;
			}
			if (include) newparts.push(part);	
		}
		Exporter.pc.adjustIfNeeded(newparts)
		let count = getMaskCount (newparts)
		if (count == 0) return [this]
		if (count == newparts.length) console.log ("ALL MASKS", newparts[0].start.diff(newparts[count-1].end).len().trim(Geom.dp))
		if (count == newparts.length) {
			if (newparts[0].start.diff(newparts[count-1].end).len().trim(Geom.dp) == 0) return []
		}
		newparts = this.eliminateDuplicates(newparts)
		if (newparts.length < 2) return []
	
		let segments = this.recombineParts (newparts, mask)
		return segments;
		
		function getMaskCount (list){
			let count = 0;
			for (let i = 0; i < list.length; i++) {
				if (list[i].isMask) 	count++
			}
			return count
		}
	}
	
	getPartAction (part, seg) {
		var mid  = part.getMidPoint();
		var p = seg.getPartHitted(mid); // hits a part
		if (!p) return seg.contains (part) ? "inside" : "outside"	
		if (p.equalTo(part)) return "same"
		if (p && p.insideOf(part)) return "edge"
		// part.endsMatch(p) is checking the exception where one part is 
		// an arc and the other is a line, both have the same end points
		// So if the midpoint is hitting the other part it means that the two parts
		// are very small an can be considered the same
		return part.endsMatch(p) ? "outside"  : seg.contains (part) ? "inside" : "outside"	
	}	

	recombineParts(validparts, mask) {
		var other  = [];
		for (let i=0; i < validparts.length; i++) other.push (validparts[i].clone())
		if (validparts.length < 2)  console.log ("bad")
		if (validparts.length < 2) return []
		let pf = new PathFinder (validparts)
		var res = pf.processSegments(validparts, this.color)
		return res
	}	
	
	resetVariables(seg) {
		this.id  = seg.id; // may not matter
		this.legacyID = seg.legacyID
		let parts = this.parts;
		for (let j = 0; j < parts.length; j++) {
			parts[j].color = seg.color;
			parts[j].legacyID = seg.legacyID;
			parts[j].isMask = false;
		}
	}

	getDirection (){
		let parts  = this.parts;
		var data = {cw: 0, ccw: 0, colinear: 0}
		var pts = []
		for (let i=0; i < parts.length; i++) {	
			pts.push(parts[i].start)
			if (parts[i].type == "arc")	pts.push(parts[i].getMidPoint())
		}
		var max = pts.length
		for (let j=0; j < pts.length; j++) {	
			var i = (j-2).mod(max)
			let key = Geom.triangleAreaDir(pts[i], pts[(i+1).mod(max)], pts[(i+2).mod(max)]);
			switch (key){
				case "clockwise": data.cw++; break
				case "counterclockwise": data.ccw++; break
				case "colinear": data.colinear++; break
			}
		}
		let dir = (data.cw - data.ccw) == 0 ? "colinear" : (data.cw - data.ccw) > 0 ? "clockwise": "counterclockwise" 
		return dir
	}

	getMaskCrossings(optimizer, maskparts, segparts){
		var res  = []
		let precision = Geom.precision;
		for (var j = 0; j < maskparts.length; j++) {
			var p2 = maskparts[j];
			p2.isMask = true;
			for (var i = 0; i < segparts.length; i++) {
				let p1 = segparts[i];
				if (!p2.rect.intersects(p1.rect)) continue;
				if (p2.equalTo(p1)) continue;
				let xsings = optimizer.getCrossingList(p1, p2);
				for (let m=0; m < xsings.length; m++) {
						res.push({index1: i+maskparts.length, index2: j, pt: xsings[m]});		
				}
			}
		}
		return res;
		}
	
	reconnect (){
		let self = this;
	  var joints = {} 
	  let parts =this.parts
	  if (parts.length  < 1) return
		registerVertices(parts, joints);
		let indices = [parts.length - 1]
		let prev = parts[indices[0]];
		let result = [prev]

		while (indices.length < parts.length) {
			let key = prev.end.toString(Geom.dp)
			let options = joints[key];
			var best;
//			console.log (indices, options)
			for (let n=0; n< options.length; n++) {
				let val = options[n]
				if (indices.indexOf(val) > 0) continue;
				best = val;
				break;
				}
			if (best!=undefined) {
				var next = parts[best]				
				var ekey = next.end.toString(Geom.dp)
				if (ekey == key) next.flip()
				indices.push (best)
				var joints = {} 
				registerVertices(parts, joints);
			}
			else {
				console.warn (indices, "not found", "best", best, "option", options, key, prev)
				return parts;
			}
			prev = next;
		}
		var rightorder =[];
		for (let i=0; i < indices.length; i++) rightorder.push (parts[indices[i]])
		self.parts = rightorder
	}
 
	eliminateDuplicates(list){	
		let self = this;
		let joints = {} 
		registerVertices(list, joints);
		//		console.log (joints)
		var res = [];	
		var compared = []	
		var duplicates = {}
		var relations = {}
		let comparisons = []
		let zones =  [];

		for (var key in joints) zones.push(joints[key]);

		for (var m=0; m < zones.length; m++) {
			var indexes = zones[m];
			if (indexes.length < 2) continue;
			for (var k=0; k <  indexes.length; k++) {
				var i = indexes[k];
				if (!list[i]) continue;
				if (relations[i]) continue;	
				var p1  = list[i];
				for (var n=indexes.length - 1;  n >= 0; n--) {	
					var j = indexes[n];
					if (!list[j]) continue;
					if (i == j) continue;
					if (compared.indexOf(i+"_"+j) > -1) continue;					
					var p2  = list[j];
					compared.push(i+"_"+j);
					compared.push(j+"_"+i);
					if (p1.equalTo(p2))  {	
						let entry = duplicates[i] ? duplicates[i] : [];
						let other = relations[j] ?  relations[j] : [];	
						if (entry.indexOf(j) < 0) entry.push(j)
						if (other.indexOf(i) < 0) other.push(i)
						//	list[j] =  list[i].clone();	
						relations[j] = other	
						duplicates[i] = entry;	
					}		
				}		
			}
		}
		let removes  = [];
		for (let num in duplicates) removes = removes.concat(duplicates[num])
		for (let i=0; i <  list.length; i++) {if (removes.indexOf (i) < 0) res.push (list[i]);}
		return res;
	}
	
}
