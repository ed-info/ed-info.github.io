/* © 2018 Playful Invention Company - Paula Bontá */

class Path {
    constructor (w, fillstate, color, d) {
    //	console.log ("path constructor", w, fillstate)
    	this.strokewidth = w;
    	this.segments = [];
    	this.color = color;
    	this.hasfill = !fillstate ? false : fillstate
    	this.setPathData (d)
    }
   
   setPathData (d){
   	if (!d || (d == "")) return;
	  var commands = this.getCommands(d)	
		let list = SVG.getAbsoluteCommands(commands);
		this.currentSegment = undefined;
		for (let i =0 ; i < list.length; i++) this.processCommand(list[i]);
		this.endPath();
		// set precision  and color 
		for (let i = 0; i < this.segments.length ; i++){
			this.segments[i].setcolor (this.color)
			this.segments[i].trim(Geom.dp);
		} 
	}
	
	scaleby (scale) {
		this.strokewidth = this.strokewidth*scale;
		 for (let j=0; j< this.segments.length; j++) {
			 let parts = this.segments[j].parts
			 for (let i=0; i < parts.length; i++) parts[i].scaleby(scale);
		 }
	 }
	 
	 moveby (delta) {
		 for (let j=0; j< this.segments.length; j++) {
			 let parts = this.segments[j].parts
			 for (let i=0; i < parts.length; i++) parts[i].translate(-delta.x, -delta.y);
		 }
	 }
	 
  	isEmpty (){
  		if (!this.segments)  return true;
  		if (this.segments.length == 0) return true;
  		return this.segments[0].parts.length  == 0;
  	}
    
   getSVGpath(data){
   		data = data ? data : this.segments;
   		var d = "";
   		for (let i =0 ; i < data.length; i++)  d+= data[i].getPathCommands();
   		return d;
   }
   
	recalculateSegments(parts){
	 /* specially important for filled paths
	 this function calculates closed segments so later on mid points 
	 of arcs and lines can be tested against "sensible" polygons.
	 */
		 var starts = {};
		 for (let i=0; i<parts.length; i++) register(starts, parts[i].start, i);
		 let segments = this.calculateSegments (parts, starts)
		 let singleparts = [];
		 let result = [];
		 for (let i=0; i< segments.length; i++)  {
		 	if ((segments[i].parts.length == 1)	&& (segments[i].parts[0].strokesize == 0)){
		 			singleparts.push(segments[i].parts[0])
		 	}
		 	else result.push(segments[i]);
		 }
		 var startso = {};
		 for (let i=0; i<singleparts.length; i++)  register(startso, singleparts[i].start, i);
		 let jointseg = (singleparts.length > 0) ?  this.calculateSegments (singleparts, startso) : [];
		 this.segments = result.concat(jointseg);
				// set precision  and color 
		for (let i = 0; i < this.segments.length ; i++){
			this.segments[i].setcolor (this.color)
			this.segments[i].trim(Geom.dp);
		}  
	}
  
	calculateSegments (parts, starts){
		let segments = [];
		var seg;
		var lastpos;
		for (let i=0; i<parts.length; i++){
			var part = parts[i]
			if (!seg) {
				seg = new Segment(part.start, this.strokewidth / 2);
				segments.push(seg);
			}
			if (lastpos) {
				let str = lastpos.toString(Geom.dp)
				let choices = starts[str];
				// check if it is a break or it arrives to a joint
				// joints are splitted in different segments
				let state = (lastpos.diff(part.start).len() > Geom.precision) || (choices.length > 1);
				if (state) {		
					if (seg) {
						var ps =  seg.parts[0].start;
						var pe =  seg.parts[seg.parts.length-1].end;
						if (pe.diff(ps).len().trim(Geom.dp)<=Geom.precision) seg.parts[seg.parts.length-1].end = seg.parts[0].start;
					}
					seg.setcolor (this.color)
					seg = new Segment(part.start, this.strokewidth / 2);
					segments.push(seg);
				}
			}	
			lastpos = part.end;
			seg.parts.push(part);
		}
		if (seg) {
			var ps =  seg.parts[0].start;
			var pe =  seg.parts[seg.parts.length-1].end;
			if (pe.diff(ps).len().trim(Geom.dp)<=Geom.precision) seg.parts[seg.parts.length-1].end = seg.parts[0].start;
			seg.setcolor (this.color)
		}
		return segments;   
	}

	processCommand (cmd){
	//	console.log  (cmd[0])
		switch (cmd[0]){
			case 'M': this.addStartPath(cmd); break;
			case "L": this.addLine(cmd); break;
			case 'A': this.addArc(cmd); break;
			case "z":
			case "Z": this.addClosePath(); break;
			default: break;
		}	
	}

	addStartPath(cmd){
		let pos  = new Vector(cmd[1],  cmd[2]);
		pos.trim(Geom.dp);
		let usethis =  this.currentSegment && ((this.currentSegment.parts.length == 0) || ((this.currentSegment.parts.length == 1) && (this.currentSegment.parts[0].len() == 0)))
		if (usethis) this.currentSegment.pos = pos
		else {
			this.currentSegment = new Segment(pos , this.strokewidth / 2);
			this.segments.push(this.currentSegment)
		}
		if (this.hasfill) this.currentSegment.fillInside = true;
	}

	endPath(){if (this.hasfill) this.currentSegment.endPath();}
	addLine(cmd){this.currentSegment.addLine (new Vector(cmd[1],  cmd[2]))}

	addArc (cmd){this.currentSegment.addArc (cmd)}

	addClosePath(){
		let firstpos = this.currentSegment && this.currentSegment.parts.length > 0 ? this.currentSegment.parts[0].start : null;
		if (!firstpos) return;
		let v1 = this.currentSegment.pos.trim(Geom.dp)
		let v2 = firstpos.trim(Geom.dp);
		if (v1.diff(v2).len() == 0) return;
		this.currentSegment.addLine (firstpos);
	}

	getRectangle(){
		let rect = new Rectangle();
		for (let i = 0; i < this.segments.length ; i++) {
			var seg = this.segments[i]
			this.startSizePath(rect, seg);
			for (let j = 0; j < seg.parts.length ; j++) {
				var r = seg.parts[j].getRectangle()
				rect = rect.union (r);
				
			}
		}
		return rect;
	}
	 
	closePathSize(rect, cmd){rect.addPoint(this.endp)}

	startSizePath(rect, seg){
		this.endp = seg.start;
		this.startp = seg.start;
	}

    // tools 
    getCommands (d) {
      if (!d) return null;
			var commands = d.match(/[A-DF-Za-df-z][^A-Za-df-z]*/g);
			if (!commands) return null;
			var res =[];
			for (var i = 0; i < commands.length ; i++)  {	
				var cmd = commands[i];
				var ct = cmd.charAt(0);	
				var cmddata = (ct.toLowerCase() == "z") ? [] : this.splitNumericArgs(cmd.substr(1, cmd.length));
				cmddata.unshift(ct);
				res.push(cmddata);
			}
			return res;
    }
    
  	splitNumericArgs(str) {
			var res=[];
			if (!str) return res;
			var list = str.match(/(?:\+|-)?\d+(?:\.\d+)?(?:e(?:\+|-)?\d+)?/g);
			for (var i = 0; i < list.length ; i++) res.push(Number(list[i]));
			return res;
		}
  
   arrayToString(list){		
		var str="";
		for (var i =0 ; i < list.length; i++) {
			var cmd = list [i];
			str += cmd[0];
			if (cmd.length > 1) {
				cmd.shift();
				str += cmd.toString();
			}
		}
		return str;	
	} 	


////////////////////////
//
// Path Expansion
//
/////////////////////////

	expand (){ // returns parts
		var  res = [];
		let list = this.splitLargeArcs();
		this.recalculateSegments(list); 
		if (this.hasfill) return this.segments; // no need to expand
		for (let j=0; j < this.segments.length; j++) res = res.concat(this.segments[j].expand())
		return res;
	}

	splitLargeArcs (){ // to simplify algorithms
		let parts = this.getParts()
		let res = [];
 		for (let i=0; i<parts.length; i++) {
 				let p = parts[i];
 				if (p.type!= 'arc') res.push (p);
 				else 	res = res.concat(p.split());
 		}
 		return res;
	}
	
	getParts (){
		var list = [] ;
		for (let j=0; j < this.segments.length; j++) {
			list = list.concat(this.segments[j].getParts())
		}
		return list;
	}

	
////////////////////////
//
// Path consolidation
//
/////////////////////////

	isEqual (p2){
		let p1 = this;
		let a =  this.getSVGpath()
		let b =  p2.getSVGpath()
		return this.comparePaths (a, b);
	}
	
	comparePaths (a,b) {
		if (Math.abs(a.length -  b.length) > 1) return false;
		if ((a.length == b.length) && (a==b)) return true;
		if ((a.length < b.length) && (a==b.substring(0, b.length - 1))) return true;
		return (b==a.substring(0, a.length - 1))
	}
	
	merge (pc, b, fcn){
		let a = this;
		var state = "line";
		if (a.hasfill || b.hasfill) state = "outer"
		var path = a.strokewidth > b.strokewidth ? a : b;
		switch (state) {
			case "outer": 
				path.getOutterPath(pc, fcn); break;
			default: fcn(path);break;
		}
	}
	

getOutterPath (pc, whenDone) {
	let segments = pc.getExpandedPathsSegments([this])	
//	segments = pc.cropToCanavas(segments)
	for (let i=0; i < segments.length; i++) segments[i].setRect(); 
	let rect = pc.optimizer.getRectangle(segments);
	rect.width = rect.width + rect.x;
	rect.height = rect.height + rect.y;
	rect.x = 0; rect.y = 0;
	
	pc.processOutline (rect, segments, doLast)
	
	function doLast (str) {
		var subpaths = str.split ("M");
		var res  = [];
		for (let j=0; j < subpaths.length; j++) {
			var sp = subpaths[j]
			if (sp == "") continue;
			var p = new Path(0, true, pc.basecolor, "M"+sp); // mask outline
			res.push(p);
		}
		var size  = 0;
		var respath = undefined;
		for (let i=0; i < res.length; i++) {
			let path = res[i]
			if (path.segments.length == 0) continue;
			var rect  = path.getRectangle()
			if (rect.getArea () > size){
				 size = rect.getArea ();
				 respath=  path;
			 }
		}
		whenDone (respath)
	}
	
}

}
