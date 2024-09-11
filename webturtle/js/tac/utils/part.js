/* © 2021 Playful Invention Company - Paula Bont‡ */

class Part {

	constructor (data) {
		this.flipped = false;
		for (let key in data) this[key] =  data [key];
		this.setup();
	 }
	
	setup () {
		switch (this.type){
			case "line":
				if (!this.heading) {
					var v1 = this.end.diff(this.start);
					this.heading = Geom.getAngle( 90 + Geom.ptToAngle (v1))
				}
				break;
			case "arc":
				if (!this.center) this.setupArc()
				break;
			}
		this.rect = this.getRectangle().trim(Geom.dp);
		}

	 setupArc (){
		let v1 = this.end.diff(this.start)
		let middle = v1.scale(0.5);
		let a = middle.len();
		let size = Math.sqrt((this.r * this.r) - (a * a));
		var center;
		let zeroAngle = ((size.toString() == 'NaN') || (Math.abs(size).trim(Geom.dp) == 0))
		var perp = middle.perp();
		var unitvector = perp.norm ();	
		var pt1 = unitvector.scale(size)
		this.center  = this.start.sum (zeroAngle ? middle : getState(!this.CCW, this.large, middle, pt1))
		this.calcuateArcAngles()
	
		function getState(cw, islarge, middle, pt)  {
			if (islarge&&!cw) return middle.sum(pt1)
			if (islarge&&cw) return middle.diff(pt1)
			if (!islarge&&cw) return middle.sum(pt1)
			else return middle.diff(pt1)
		}
	}

	calcuateArcAngles () {	
		var sd = this.CCW ? this.start.diff(this.center) : this.center.diff(this.start) ;
		var ed = this.CCW  ? this.end.diff(this.center) : this.center.diff(this.end);
		var sh = Geom.getAngle(Geom.ptToAngle (sd));		
		var eh = Geom.getAngle(Geom.ptToAngle (ed));
		var enda = (eh < sh)  ?  eh+360 : eh;
		var size = (sh - enda).mod(360);	
		this.size = this.large ? size < 180 ? 360 - size :  size :  size < 180 ? size :  360 - size ;
		this.startAngle = sh
		this.endAngle = eh
	}

////////////////////////
// Other tools
////////////////////////

  getArc (start, pt, r, islarge,  ccw) {
		var part = new Part({type: "arc", start: start, end: pt,  r: r, strokesize: this.strokesize, CCW: ccw, large: islarge});	
		part.rect = part.getRectangle().trim(Geom.dp);
		return part
	}
	
	getLine	 (spt, pt, size) {		
		var part = new Part({type: "line", start: spt, end: pt, strokesize: size});	
		part.rect = part.getRectangle().trim(Geom.dp);
		return part
	}
	
	clone (skip){
		var obj = {}
		for (let key in this) {
			if (skip && (key == skip)) obj[key] =  this[key];
			else if (this[key] ==  undefined) obj[key] =  this[key];
			else {
			obj[key] =  this[key].clone ? this[key].clone() : this[key];
		}
		}
		var part =	 new Part(obj)
		part.rect = part.getRectangle().trim(Geom.dp);
		return part
	}
	
	trim (n) {
//		console.log ("part trim", n)
		for (let key in this)  {
			this[key] =  this [key];
			if (!this[key]) continue;
			if (typeof this[key] == "string" ) continue;
			if (typeof this[key] == "boolean" ) continue;
			if (this[key].trim) this[key] = this[key].trim(n)
		}
		this.updatePart();
		return this;
	}
	
	scaleby (scale) {
		this.start = this.start.scale(scale).trim(Geom.dp)
		this.end = this.end.scale(scale).trim(Geom.dp)
		
		switch(this.type)	{
				case "arc":
					this.center = this.center.scale(scale).trim(Geom.dp)
					this.r = (this.r * scale).trim(Geom.dp)
					break;
				default: break;
			}	
		this.rect = this.getRectangle().trim(Geom.dp);
	}
	
	translate (x, y) {
		let vdelta = new Vector (x,y)
		this.start = this.start.sum(vdelta)
		this.end = this.end.sum(vdelta)
		this.rect.x =  this.rect.x + x
		this.rect.y =  this.rect.y + y	
		switch(this.type)	{
				case "arc":
					this.center = this.center.sum(vdelta)
					break;
				default: break;
			}	
	}
	
	/*https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm*/
	setSections (factor, rect, cpr) {
			var points = this.getSections(factor, rect)
		 	this.areapts = points;
			var list = []
			if (points.length == 0){
				var pt = new Vector ( (Math.floor(this.start.x/factor) * factor).round(), (Math.floor(this.start.y/factor) * factor).round());
				addAll(pt)
			}
			for (let j=0; j < points.length; j++) addPoint(points[j]);
			this.keys = list;
			function addKey (val) {if (list.indexOf(val) < 0)  list.push(val)}
			function addAll(pt){
				var row =  pt.y / factor
				var col = pt.x / factor
				var n =  Math.floor (col) + Math.floor (row) * cpr;
				addKey (n+1);
				addKey (n);
				addKey (n-1);
				row--;
				n =  Math.floor (col) + Math.floor (row) * cpr
				addKey (n+1);
				addKey (n);
				addKey (n-1);
				row++; row++; 
				n =  Math.floor (col) + Math.floor (row) * cpr
				addKey (n+1);
				addKey (n);
				addKey (n-1);
			}			
			function addPoint(pt){
				var row =  pt.y / factor
				var col = pt.x / factor
				var n =  Math.floor (col) + Math.floor (row) * cpr;
				
				addKey (n);
		 		if (Math.abs(col - Math.floor (col)) < 0.01) addKey (n-1);
		 		if (Math.abs(col - Math.floor (col) - 1) < 0.01) addKey (n+1);
		 		if (Math.abs(row - Math.floor (row)) < 0.01) {
		 		 	row--;
		 		 	var n =  Math.floor (col) + Math.floor (row) * cpr;
		 			addKey (n);
		 			if (Math.abs(col - Math.floor (col)) < 0.01) addKey (n-1);
		 			if (Math.abs(col - Math.floor (col) - 1) < 0.01) addKey (n+1);
		 			row++;
		 		}
		 		if (Math.abs(row - Math.floor (row) - 1) < 0.01) {
		 		 	row++;
		 		 	var n =  Math.floor (col) + Math.floor (row) * cpr;
		 			addKey (n);
		 			if (Math.abs(col - Math.floor (col)) < 0.01) addKey (n-1);
		 			if (Math.abs(col - Math.floor (col) - 1) < 0.01) addKey (n+1);
		 			row--;
		 		}
		 	}
	 	
		}

//pt to sectors VectorÊ{x: 109.6965, y: 330} 10.96965 0.9696499999999997 0.03035000000000032 0 1
 
	ptToKeys (pt, factor, rect, cpr) {
			let list = [];
			var pt = new Vector ( (Math.floor(this.start.x/factor) * factor).round(), (Math.floor(this.start.y/factor) * factor).round());
			addPoint(pt)
			for (let j=0; j < points.length; j++) addPoint(points[j]);
			this.keys = list;
			function addKey (val) {if (list.indexOf(val) < 0)  list.push(val)}
			function addPoint(pt){
				var row =  pt.y / factor
				var col = pt.x / factor
				var n =  Math.floor (col) + Math.floor (row) * cpr;
				addKey (n+1);
				addKey (n);
				addKey (n-1);
				row--;
				n =  Math.floor (col) + Math.floor (row) * cpr
				addKey (n+1);
				addKey (n);
				addKey (n-1);
				row++; row++; 
				n =  Math.floor (col) + Math.floor (row) * cpr
				addKey (n+1);
				addKey (n);
				addKey (n-1);
		}
	}
	
	getSections(factor, rect){	
		// calculate start lines
		var x = Math.floor (this.rect.x  / factor);
		var y = Math.floor (this.rect.y  / factor);
		let deltax =  Math.floor((this.rect.x  + this.rect.width)/factor)
		let deltay =  Math.floor((this.rect.y  + this.rect.height)/factor)
		// calculate intersections		
		var gridlines = []
		for (let i = x; i < deltax+1; i++) gridlines.push (new Part({type: "line", start: new Vector (i*factor, 0), end: new Vector (i*factor, rect.height), strokesize: 1}));	
		for (let i = y; i < deltay+1; i++) gridlines.push (new Part({type: "line", start: new Vector (0, i*factor), end: new Vector (rect.width, i*factor), strokesize: 1}));			
		var pts  = []
	//	console.log (deltax,deltay, gridlines.length)
		for (let i = 0; i < gridlines.length; i++) {
			let intersect = [];
			switch(this.type)	{
				case "line": 
					pts = pts.concat (Geom.linesIntersect(this, gridlines[i]));
					break;
				case "arc":
					let places = Geom.lineIntersectCircle(gridlines[i], this);
					intersect = (places.length > 0) ? Geom.getArcIntersect(places, gridlines[i], this) : [];
					pts = pts.concat (intersect);
					break;
				default: break;
			}
		}
	//	console.log (JSON.stringify(pts), this, this.rect, this.getRectangle())
		return pts;	
	}

	isEmpty () {
		this.updatePart();
	//	if (this.len() < (1 / Math.pow(10, 12))) console.log (this.segn, this.len())
		return this.len() == 0;
	//	return this.len() < (1 / Math.pow(10, 12));
	}
		
	updatePart (){
		switch(this.type){
			case "line": 
				var v1 = this.end.diff(this.start)
				this.heading = Geom.getAngle( 90 + Geom.ptToAngle (v1)).trim(Geom.dp);
				break;
			case "arc": 
			//	if (this.large) console.log ('before', this.size)
				this.calcuateArcAngles();
				break;
			default: break;
		}
		this.rect = this.getRectangle().trim(Geom.dp);
	}

	flip ()	{
		switch(this.type){
			case "line": 
				let end = this.end;
				this.end = this.start;
				this.start = end;
				var v1 = this.end.diff(this.start)
				this.heading = Geom.getAngle(90 + Geom.ptToAngle (v1)).trim(Geom.dp);
				this.flipped  = !this.flipped ;
				break;
			case "arc": 
				let aend = this.end;
				this.end = this.start;
				this.start = aend;
				this.CCW = !this.CCW 
				this.setupArc()
				this.flipped  = !this.flipped ;
				break;
			default: break;
		}
		return this;
	}
	
	isVertical (){
		// returns true if this line is horizontal and false if it is vertical
		switch(this.type){
			case "line": 
				let val = (Math.floor (this.heading / 90) % 4) % 2;
				return val == 0;
			case "arc": 
				var v1 = this.end.diff(this.start)
				let heading = Geom.getAngle( 90 + Geom.ptToAngle (v1)).trim(Geom.dp);
				let num = (Math.floor (this.heading / 90) % 4) % 2;
				return num == 0;
		}
	}
	
	getCompassHeading(state){
		// returns compass
		let h = ["N", "E", "S", "W"];
		switch(this.type){
			case "line": 		
			//	let val = (Math.floor (this.heading / 90)  + 1 ) % 4; // changed
				let val = (state ? Math.floor (this.heading / 90) : 1  + Math.floor (this.heading / 90)) % 4;
				return h [val];
			case "arc": 
				var v1 = this.end.diff(this.start)
				let heading = Geom.getAngle( 90 + Geom.ptToAngle (v1)).trim(Geom.dp);
				let num = (Math.floor (heading / 90) % 4);
				return  h[num];
		}
	}
	
	getMidPoint(){
		switch (this.type) {
			case 'arc':
				let mid = this.size / 2
				let a =  this.CCW ? this.startAngle  - mid : this.startAngle + mid
				let pt = Geom.fromPolar (a, this.r)
				var res = this.CCW  ?  this.center.sum (pt) : this.center.diff (pt)
				return res
			default:
				return this.start.mid(this.end)
		}
	}
	
	split (){
		if (!this.large) return [this];
		return this.splitArc();
	}
	
	splitArc(){
		let pt = this.getMidPoint();
		let part1 = this 
		let part2 = this.clone()
		part1.end = pt;
		part2.start = pt;
		part1.large = false;
		part2.large = false;
 		part1.updatePart()
		part2.updatePart()	
		return [part1, part2];
	}
	

	////////////////////////////////
	// circles
	///////////////////////////////	
	
	isCircle (other){
		if ((this.size + other.size) != 360) return false;
		if (this.center.diff(other.center).len() != 0) return false;
		if (this.end.diff(other.start).len() != 0) return false;
		if (this.start.diff(other.end).len() != 0) return false;
		if (this.CCW != other.CCW) return false;
		return true;	
	}
	
	
	////////////////////////////////
	// expand
	///////////////////////////////	
	
	expand (data){
		if (this.strokesize == 0) return;
		switch(this.type){
			case "line": this.expandLine(data); break;
			case "arc":
				if (this.size == 0) console.log ("zero arc bug", this);
				 this.expandArc(data);
				break;
		}
		this.strokesize = 0
	}

	expandLine(data){
		var outcorners = this.calculateOffsets(this.start, this.end, -this.strokesize);
		var line  = this.getLine(outcorners.start, outcorners.end, 0)
		data.outside.push(line);
		var incorners = this.calculateOffsets(this.start, this.end, this.strokesize);
		var newline = this.getLine(incorners.end, incorners.start, 0);
		data.inside.unshift(newline); 
	}
			
	expandArc(data){	
		var size  = this.strokesize;
		this.strokesize = 0
	//	console.log ("CCW", this.CCW," expandArc radius ", this.r, "islarge," ,this.large, "c", this.center,"angle start", this.startAngle,  "angle end", this.endAngle);
		var pts1 = getPoints(this.start, this.end, getAngle(this.startAngle + 90), getAngle(this.endAngle + 90) , size);
		var pts2 = getPoints(this.start, this.end, getAngle(this.startAngle - 90), getAngle(this.endAngle - 90), size);
		var arc1 = this.CCW ? this.getArc(pts1.end, pts1.start, this.r + size,  this.large, !this.CCW) : this.getArc(pts1.end, pts1.start, this.r - size,  this.large , !this.CCW)
		var arc2 = this.CCW ? this.getArc(pts2.start, pts2.end, this.r - size,  this.large, this.CCW) : this.getArc(pts2.start, pts2.end, this.r + size, this.large, this.CCW)
		data.inside.unshift(arc1); 
		data.outside.push(arc2); 		
		function getAngle (a) {return (a < 0 ? 360 + a : a).mod(360);}
		function getPoints (sp, ep, sh, eh, size){return {start:  getCoor(sp, sh, size), end: getCoor(ep, eh, size)};}
		function getCoor (pt, a, dist) {return new Vector(pt.x +dist*sindeg(a), pt.y - dist*cosdeg(a))}	
	}
	
	////////////////////////////////
	// SVG Cmd
	///////////////////////////////
	
	getCmd (dp){
		let end = this.end.trim(dp)
		switch(this.type){
			case "line": return  "L"+end.x+","+end.y; 
			case "arc":
				return "A " + this.r + " " +  this.r + " 0 "+ (this.large ? 1 : 0) + " "+ (this.CCW ? 0 : 1) + " " +end.x+" "+end.y; 
		}
		return "";
	}

	////////////////////////////////
	// Rectangle
	//////////////////////////////
		
	getRectangle(){
		switch(this.type){
			case "line": return this.lineRect();
			case "arc": return this.arcRect();
		}
		return new Rectangle();
	}
	
	lineRect (){
		var x = Math.min(this.start.x, this.end.x)
		var y = Math.min(this.start.y, this.end.y)
		var delta = this.start.diff(this.end)
		return new Rectangle(x, y, Math.max(Exporter.pad, Math.abs(delta.x)), Math.max(Exporter.pad, Math.abs(delta.y)))
	}
	
	arcRect (){
		var x = Math.min(this.start.x, this.end.x)
		var y = Math.min(this.start.y, this.end.y)
		var delta = this.start.diff(this.end)
		var rect  = new Rectangle(x, y, Math.max(Exporter.pad, Math.abs(delta.x)), Math.max(Exporter.pad, Math.abs(delta.y)))
		for (var a = 0; a < 360; a+=90) {
			if (Geom.inAngleRange(a, this.CCW ? this.endAngle : this.startAngle, this.size, true)) {
				var pt = Geom.getCoor(this.center, (a-90).mod(360),  this.CCW ? -this.r :  this.r)
				rect.addPoint(pt)
			}
		}
		return rect;
	}

	////////////////////////////////
	// Get part Points 
	//////////////////////////////
	
	getPoints(){
		switch(this.type){
			case "line": return [this.start];
			case "arc": return this.arcPoints();
		}
		return [];
	}
	
	arcPoints(){
		var pts  = []// gets the rectangle from start to end
		if (this.size == 0) return [];
		pts.push(this.start);
		for (var a = 0; a < 360; a+=90) {
			if (Geom.inAngleRange(a, this.CCW ? this.endAngle : this.startAngle, this.size, true)) {
				var pt = Geom.getCoor(this.center, (a-90).mod(360),  this.CCW ? -this.r :  this.r)
				if (pt.diff(this.end).len() == 0) continue;
				pts.push(pt)
			}
		}
		return pts;
	}
	
		ptInPart (pt){
			switch(this.type){
				case "line":  return Geom.ptInLine(pt, this)	
				case "arc": return Geom.ptInArc(pt, this)
			}
			return false;
		}
		
	joined (other){
		if (this.type != other.type) return null
		if (this.end.diff(other.start).len() !=0) return null	 
		switch (this.type) {
			case "line": 	 
				if (Math.abs(this.heading.mod(360) - other.heading.mod(360)) != 0) return null;
				break;
			 case "arc": 
		//	 console.log (this.size, other.size, this.CCW)
			 	if (this.CCW != other.CCW) return null
				if (this.center.diff(other.center).len() != 0 )	return null
				if (this.r != other.r) return null
				if ((this.size + other.size) > 355) return null
				if ((this.size + other.size) > 180) this.large = true
				break;
			}	
		this.end = other.end
		this.updatePart()
	//	console.log (this.type , this.size)
		return this	
	}
		
	len (){
		switch (this.type) {
			case "line": return this.end.diff(this.start).len().trim(Geom.dp);
			case "arc": return Geom.arcLength(this)
		} 
	}

	insideOf (other) { // other is segment part
		if (this.type != other.type) return false;
		var p1; var p2; var p3;
		switch (this.type) {
			case "arc": 
				if (this.r != other.r) return false;
				var val = this.center.diff(other.center).len().trim(Geom.dp)		
				if (val > Geom.precision) return false;			
				p1  = Geom.ptInArc(this.start, other)	||  Geom.ptInArc(other.start, this)
				p2  = Geom.ptInArc(this.end, other) ||  Geom.ptInArc(other.end, this)
				p3 = this.r.trim(Geom.dp) == other.r.trim(Geom.dp)
				break;	
			default:	
				p1  = Geom.ptInLine(this.start, other) ||  Geom.ptInLine(other.start, this)
				p2  = Geom.ptInLine(this.end, other) ||  Geom.ptInLine(other.end, this)
				p3 = this.heading.trim(Geom.dp).mod (180) == other.heading.trim(Geom.dp).mod (180)
				break;
			}
		return p1 && p2	&& p3
	}
	
	equalTo (other) {
		if (this.type != other.type) return false;
		switch (this.type) {
			case "line":		
				let endsareequal = this.endsMatch(other)
				if (!endsareequal) return false
				var val = Math.abs(this.len() - other.len()).trim(Geom.dp)
				return val <= Geom.precision
			case "arc": 
				if (this.r != other.r) return false;
				var equalEnds = this.endsMatch(other)
				if (!equalEnds) return false
				var val = this.center.diff(other.center).len().trim(Geom.dp)		
				if (val > Geom.precision) return false;
				var equalAngles =  compareAngles(this, other)
				return equalAngles
			}
			
			function compareAngles(me, other) {
				if (me.startAngle.trim(Geom.dp) != other.startAngle.trim(Geom.dp))  {
					var alias  = other.clone();
					alias  = alias.flip();
					if (me.startAngle.trim(Geom.dp) != alias.startAngle.trim(Geom.dp)) return false;
					else return me.endAngle.trim(Geom.dp) == alias.endAngle.trim(Geom.dp)
				}
				else return me.endAngle.trim(Geom.dp) == other.endAngle.trim(Geom.dp)
				}
					} 

	endsMatch (other){
		var isFlipped = false
		if (this.end.diff(other.end).len().trim (Geom.dp) > Geom.precision) {
			if (this.start.diff(other.end).len().trim (Geom.dp) > Geom.precision) return false
			isFlipped = true
			}
		if (isFlipped) return this.end.diff(other.start).len().trim (Geom.dp) <= Geom.precision
		return this.start.diff(other.start).len().trim (Geom.dp) <= Geom.precision
		}	

	calculateOffsets (before, here, size){
		var v1 = here.diff (before); 
		var perp = v1.perp();
		var unitvector = perp.norm ();
		var pt1 = before.sum (unitvector.scale(size));
		var pt2 = here.sum (unitvector.scale(size));
		return {start: pt1, end: pt2};
	}
	
	stringify(){
		var obj = {}
		for (let key in this) {
			obj[key] =  this[key].toString() ? this[key].toString() : this[key];
		}
		return JSON.stringify(obj)
	}
	
}
