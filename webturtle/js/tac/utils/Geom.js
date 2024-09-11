/* © 2018 Playful Invention Company - Paula Bontá */

var Geom = {}

Geom.dp = 4;
Geom.precision = 1 / Math.pow(10, Geom.dp)

Geom.linesIntersect = function (line1, line2){
	var res = []
	if (Geom.ptInLine(line1.end, line2))  res.push(line1.end.trim(Geom.dp));
	if (Geom.ptInLine(line1.start, line2)) res.push(line1.start.trim(Geom.dp));
	if (Geom.ptInLine(line2.end, line1)) res.push(line2.end.trim(Geom.dp));
	if (Geom.ptInLine(line2.start, line1)) res.push(line2.start.trim(Geom.dp));
	if (res.length > 0) return res;
	var res = []
	var v1 = line1.start;
	var v2 = line1.end;
	var v3 = line2.start;
	var v4 = line2.end;
	var pt = Geom.linesIntersecting(v1, v2, v3, v4);
	return pt ? res.concat(pt) : res;
}

Geom.colinearPt = function (line1, line2){
	var res = []
	if (line1.start.diff(line2.start).len() != 0) {
		if (Geom.ptInLine(line1.start, line2)) res.push (line1.start.trim(Geom.dp))
		if (Geom.ptInLine(line2.start, line1)) res.push (line2.start.trim(Geom.dp))
	}
	if (line1.end.diff(line2.end).len() != 0) {
		if (Geom.ptInLine(line1.end, line2)) res.push (line1.end.trim(Geom.dp))
		if (Geom.ptInLine(line2.end, line1)) res.push (line2.end.trim(Geom.dp))
	}
	return res;
}

Geom.arcLength = function (arc){return (arc.size / 360) *2 * Math.PI * arc.r}
Geom.getAngleForDistance = function (dist, arc){return dist * 360 / (2 * Math.PI * arc.r)}

Geom.linesIntersecting = function (v1, v2, v3, v4){
	var seg1 = v2.diff(v1);
	var seg2 = v4.diff(v3);
	var seg3 =  v1.diff(v3);
  var denom  = seg2.y * seg1.x - seg2.x * seg1.y;
  var numera = seg2.x *seg3.y - seg2.y * seg3.x;
  var numerb = seg1.x * seg3.y - seg1.y *seg3.x;
 	if (Math.abs(denom) == 0) return null;
  var mua = numera / denom;
  var mub = numerb / denom;
	 /* Is the intersection along the  segments */
//	 console.log (mua, mub, numera, numerb)
  if (mua < 0 || mua > 1 || mub < 0 || mub > 1)  {
  	return null;
  }
  var px = v1.x + mua * seg1.x;
  var py  = v1.y + mua * seg1.y;
  return new Vector (px, py).trim(Geom.dp);
 }

Geom.lineIntersectCircle = function (line, arc){
	var center = arc.center;
	var r = arc.r;
	var vector1 = line.start;
	var vector2 = line.end;
	var res = []
	if (Geom.ptInArc(line.start, arc)) res.push(line.start)
	if (Geom.ptInArc(line.end, arc)) res.push(line.end)
	var v1 = vector1.diff(center);
	var v2 = vector2.diff(center);
	var pts = Geom.lineCircleIntersections (v1, v2, r);
	if (pts.length == 0) return res;
	// clear it up if there is another one.
	res = []
	for (var i=0; i < pts.length;i++) {
		var p = pts[i].sum(center);	
		res.push(p.trim(Geom.dp))
	}
	return res;
}
 
Geom.lineCircleIntersections = function (v1, v2, r){ 
	var s = v2.diff(v1); 
	var D = v1.x*v2.y-v2.x*v1.y;
	var dr	=	Math.sqrt(s.x*s.x+s.y*s.y)	
	var res = [];
	var delta = r*r * dr*dr - D*D;
	if ((delta < 0) && (Math.abs(delta) != 0)) return res; // no crossing
	var pt1 = getxsing(s, -1)
	var pt2 = getxsing(s, 1)
	var perp = s.perp();
	var unitvector = perp.norm ();
	var ptinline =  Geom.linesIntersecting (pt1.sum (unitvector.scale(r)), pt1.diff (unitvector.scale(r)), v1, v2);
	if (ptinline) res.push(pt1.trim(Geom.dp));
 	ptinline =  Geom.linesIntersecting (pt2.sum (unitvector.scale(r)), pt2.diff (unitvector.scale(r)), v1, v2);
 	// PB it used to only insert the ones who's  > Geom.precision
	if (ptinline)	res.push(pt2.trim(Geom.dp)); 
	return res;

	function getxsing(s, dir){
		var x = D*s.y + (dir * sgn(s.y)*s.x*Math.sqrt(delta));
		x = x / (dr*dr)	
		var y	=	(-D*s.x+ (dir * Math.abs(s.y)*Math.sqrt(delta)))
		y = y /(dr*dr)
		return new Vector(x,y);
	}

	function sgn(x){return x<0 ? -1 : 1  }
}
 
Geom.circleIntersectCircle = function (arc1, arc2){ 
	var c1 = arc1.center;
	var c2 = arc2.center;
	var r1 = arc1.r;
	var r2 = arc2.r;
	var d = c1.diff(c2).len();
	var res = [];
	if (Geom.ptInArc(arc1.start, arc2)) res.push(arc1.start.trim(Geom.dp))
	if (Geom.ptInArc(arc2.start, arc1)) res.push(arc2.start.trim(Geom.dp))
	if (Geom.ptInArc(arc1.end, arc2)) res.push(arc1.end.trim(Geom.dp))
	if (Geom.ptInArc(arc2.end, arc1)) res.push(arc2.end.trim(Geom.dp))
//	if (res.length > 0) return res;
	var fullcircle = (arc1.r == arc2.r) && (Math.abs(arc1.size) == 180) && (Math.abs(arc2.size) == 180)
	if ((arc1.end.diff(arc2.start).len() == 0) && !fullcircle)  res.push(arc1.end.trim(Geom.dp))
	if ((arc2.end.diff(arc1.start).len() == 0) && !fullcircle)  res.push(arc2.end.trim(Geom.dp))
	if (d > (r1 + r2)) return res
	if (d <  Math.abs(r2 - r1)) return res;
	if ((Math.round(d) == 0) && (r1 == r2)) return res;
 	var a = (r1*r1 - r2*r2 + d*d ) / (2*d) 
 	var h = Math.sqrt(r1*r1 - a*a);
  var p1 = c2.diff(c1).scale(a/d).sum(c1);
  var touch1 = new Vector (p1.x + h*(c2.y - c1.y)/d, p1.y - h*(c2.x - c1.x)/d);
  var touch2 = new Vector (p1.x - h*(c2.y - c1.y)/d, p1.y + h*(c2.x - c1.x)/d);
 	if (touch1.trim(Geom.dp).diff(touch2.trim(Geom.dp)).len() == 0) return res // tangent
  else return res.concat ([touch1.trim(Geom.dp), touch2.trim(Geom.dp)]);
}

Geom.getArcIntersect = function (pts, line, arc){
	var res = [];
	for (let i = 0 ; i < pts.length; i++) {
		let pt = pts[i];
		if (Geom.ptInArc(pt, arc)) res.push(pt.trim(Geom.dp));
	}
	return res
}

Geom.getArcIntersectArcs = function (pts, arc1, arc2){
	var res = [];
	for (var i = 0 ; i < pts.length; i++) {
		if (Geom.ptInArc(pts[i], arc1) &&  Geom.ptInArc(pts[i], arc2)) res.push(pts[i].trim(Geom.dp));
	}
	return res
}

Geom.getCircleCenter = function (v1, v2, v3) {
	let delta1  = v2.diff (v1)
	let delta2  = v3.diff (v2)
	var yDelta_a = v2.y - v1.y;
	var xDelta_a = v2.x - v1.x; 
	var yDelta_b = v3.y - v2.y;
	var xDelta_b = v3.x - v2.x;
	center = new Vector()
	var aSlope = delta1.y / delta1.x;
	var bSlope = delta2.y / delta2.x;
	center.x = (aSlope*bSlope*(v1.y - v3.y) + bSlope*(v1.x + v2.x) - aSlope*(v2.x+v3.x) )/(2* (bSlope-aSlope) );
	center.y = -1*(center.x - (v1.x+v2.x)/2)/aSlope +  (v1.y+v2.y)/2;
	return center;
}

Geom.ptInLine = function (pt, line){
	var v1 =  pt.diff(line.start)
	var v2  = line.end.diff(line.start)
	var p = pt
	var cross = v1.cross(v2)
	cross = Math.abs (cross.trim(0))
	if (cross != 0) return false
	var start = line.start
	var end = line.end;
	if (Math.abs(v2.x) >= Math.abs(v2.y)) {
 		if (v2.x > 0) return start.x <= p.x && p.x <= end.x;
    else return end.x <= p.x && p.x <= start.x;
  }
	else {
		if (v2.y > 0) return start.y <= p.y && p.y <= end.y;
		else return end.y <= p.y && p.y <= start.y;
  }
}

Geom.lineInsideLine = function (shortLine, longLine){
	if (!Geom.ptInLine(shortLine.start, longLine)) return false;
	var inside =  Geom.ptInLine(shortLine.end, longLine)
	return inside
}

Geom.isFullCircle = function (arc1, arc2){
	return  (arc1.startAngle.trim(Geom.dp) == arc2.endAngle.trim(Geom.dp)) && (arc1.endAngle.trim(Geom.dp) == arc2.startAngle.trim(Geom.dp))
}

Geom.ptInArc = function (pt, arc){
	var precision = Geom.precision
	var s = arc.startAngle;
	var e = arc.endAngle;
	var c = arc.center
	let val = Math.abs(pt.diff(c).len() - arc.r).trim(Geom.dp) // PB change so val > precision doesn't miss
	if (val > precision) return false
	var v1 = arc.CCW ? pt.diff(c) : c.diff(pt) ;	 // correct
	if (pt.diff(arc.start).len().trim(Geom.dp) <= precision) return true;
	if (pt.diff(arc.end).len().trim(Geom.dp) <= precision) return true;
	var h = Geom.getAngle(Geom.ptToAngle (v1)).mod(360);
 	return Geom.inAngleRange(h, arc.CCW ? e : s, arc.size);
}

Geom.angleInArc = function (h, arc) {
	var s = arc.startAngle;
	var e = arc.endAngle;
	let val  = h.trim(Geom.dp).mod(360)
	if ((s.trim(Geom.dp).mod(360) - val) == 0) return true;
	if ((e.trim(Geom.dp).mod(360) - val) == 0) return true;
	return Geom.inAngleRange(h, arc.CCW ? e : s, arc.size);
}

Geom.inAngleRange = function (h, start, size){
	var precision = Geom.precision
	h = h.trim(Geom.dp)
	start = start.trim(Geom.dp)
	size = size.trim(Geom.dp)
	if ((h - start) == 0) return true;
	if ((h - (start + size).trim(Geom.dp)) == 0) return true;
	if ((h > start) && (h < (start + size))) return true;
	if ((start+size) > 360) h+=360;
	if ((h - (start + size)) == 0) return true;
	if ((h > start) && (h < (start + size))) return true;
	return false;
}

Geom.hitPosition = function (h, start, size){
	if (Geom.inAngleRange(h,start, size)) return "hit"
	var precision = Geom.precision
	let h1 = h.trim(Geom.dp).mod(360)
	let mid  = start + (size / 2)	
	let s = (mid - 90)
	let e = (mid + 90)
	let ms = start;
	let state = "none"
	if ((s < 0)  && (h1 > 180)) h1 = h1 - 360;
	if ((e > 360)&& (h1  < 180)) h1+=360
	if ((h1 > s) && (h1 < e)) state = h1 < ms ? "left" : "right"
	return state
}

Geom.getPt2Angle = function (pt, arc){
	var c = arc.center
	var v1 = arc.CCW ? pt.diff(c) : c.diff(pt) ;
	return  Geom.getAngle(Geom.ptToAngle (v1)).trim(Geom.dp);
}

Geom.getAngles = function (a, b, c){
	var cosa = ((b * b) + (c * c) - (a * a)) / ( 2 * b * c); // turtle angle comand
	var cosb = ((c * c) + (a * a) - (b * b )) / ( 2 * c * a); // the other side
	var cosc = ((a * a) + (b * b) - (c * c)) / ( 2 * a * b); // one side
	return {A: cos2degree(cosa),  C: cos2degree(cosc), B: cos2degree(cosb)};
}

Geom.getPtFromAngle = function (radius, center,  angle) {
	var x = center.x + radius * sindeg(angle);
	var y = center.y - (radius * cosdeg(angle));
	return new Vector (x, y)
}

Geom.triangleAreaDir = function(aa,bb,cc){
	var a= aa.trim(Geom.dp);
	var b= bb.trim(Geom.dp);
	var c = cc.trim(Geom.dp);
	var area = (b.x - a.x) * (c.y -a.y) -  (b.y - a.y) * (c.x - a.x);
	if (area > Geom.precision) return "clockwise";
	if (area < -Geom.precision) return "counterclockwise";
	return "colinear";
}

Geom.pointInside = function (pt, elem){
	let slope = (elem.end.y - elem.start.y) / (elem.end.x - elem.start.x); 
	let cond1 = (elem.start.x <= pt.x) && (pt.x < elem.end.x); 
	let cond2 = (elem.end.x <= pt.x) && (pt.x < elem.start.x);
	let above = (pt.y < slope * (pt.x - elem.start.x) + elem.start.y); 
 return ((cond1 || cond2)  && above )
}

Geom.fromPolar = function (a, radius) {return new Vector(radius * cosdeg(a), radius * sindeg(a))}  

Geom.getCoor = function(pt, a, dist) {return  new Vector(pt.x +dist*sindeg(a), pt.y - dist*cosdeg(a))}	

Geom.ptToAngle  = function(pt) {return Math.atan2(pt.y, pt.x) * 180 / Math.PI}

Geom.getAngle = function(a) {return (a < 0 ? 360 + a : a).mod(360)}
 
Number.prototype.trim = function (n) {return Number(Number(this).toFixed(n))}
Number.prototype.round = function () {return  (Math.round(this) - this) < 0 ? Math.round(this+1) : Math.round(this);}

function cos2degree(val) { return deg(Math.acos(val));}
