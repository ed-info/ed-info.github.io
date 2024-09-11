/* © 2017 Playful Invention Company */

class SVGTurtle  {
	
	constructor() {
		this.path = "";
		this.svg = undefined;
		this.svgGroup = undefined;
		this.fillpathSVG = undefined;	
		this.svg =  SVG.top(700,560);
		this.svgGroup = SVG.addChild(this.svg, 'g',  {id: "imagepaths"});	
		this.turtlestate = turtle.getstate();
	}
			
			
restore () {turtle.setstate(this.turtlestate)}
	
/////////////////////////
//
// SVGTurtle
//
/////////////////////////

clean(b){this.clean()}

forward (b){this.fd(runtime.getnum(b,1));}
	
back(b){this.fd(-runtime.getnum(b,1));}

fd(n){
	if (turtle.pendown && (n!=0)){
		if (this.path == "") {
			var pos =  this.getPos();
			var step =  "M"+pos.x +","+ pos.y;
			this.path +=step;
		}
	}
	
	turtle.xcor+=n*sindeg(turtle.heading);
	turtle.ycor+=n*cosdeg(turtle.heading);
	
	if(turtle.pendown){
		var nextpos =  this.getPos();
		if (n == 0) this.drawDot(); 
		else  {
			var step = "L"+nextpos.x+","+ nextpos.y;
			this.path +=step;	
			if (this.fillpathSVG) this.fillpathSVG+=step;
		}
	}
}

setxy(b){
	turtle.xcor = runtime.getnum(b,1);
	turtle.ycor = runtime.getnum(b,2);
	var pos =  this.getPos();
	this.path += "M"+pos.x+","+pos.y;
	if (this.fillpathSVG) {
		this.fillpathSVG += "z";
		this.fillpathSVG += "M"+pos.x+","+pos.y;
	}
}

arc(b){
	var a = runtime.getnum(b,1);
	var r = runtime.getnum(b,2);
	if(a==0) return;	
	if(r==0) {turtle.seth(turtle.heading+a); return;}
	var dir = a < 0 ? -1 : 1;
	var pos =  this.getPos();
	if(turtle.pendown){
		if (this.path == "") {
			var step = "M"+ pos.x +","+ pos.y;
			this.path +=step;
		}
		var drawing = true
		while (drawing) {
			var angle =  Math.abs(a) >= 360 ? 180* a/Math.abs(a) : a;
			var cmd = this.getSVGarc (angle, r, dir);
			this.path+= cmd;
			if (this.fillpathSVG) this.fillpathSVG+=cmd;
			this.setArcState(angle,r, dir);
			drawing = a != angle;
			a -= angle;
		}
	}
	else this.setArcState(a,r, dir);
}

getSVGarc (a, r, dir){
	var sgn = r == 0 ?  1 : r/Math.abs(r);
	var ar = Math.abs(r);
	var h =turtle.heading+a*sgn; 
	h = h.mod(360);
	var cx = turtle.xcor+ar*cosdeg(turtle.heading) * dir;
	var cy = turtle.ycor-ar*sindeg(turtle.heading) * dir;
	var sx=turtle.cnvWidth/2+turtle.xcor, sy=turtle.cnvHeight/2-turtle.ycor;
	var ex=turtle.cnvWidth/2+(cx-ar*cosdeg(h) * dir), ey=turtle.cnvHeight/2-(cy+ar*sindeg(h) * dir);
	var sweepFlag = sgn*(a/Math.abs(a)) > 0 ? 1 : 0;
	var largArcFlag = Math.abs(a) % 360 > 180 ? 1 : 0;
	var d = ["A", Math.abs(r*dir), Math.abs(r*dir), 0, largArcFlag, sweepFlag, ex, ey].join(" "); 
	return d;
}

setArcState (a, r, dir){
	var ar = Math.abs(r);
	var cx = turtle.xcor+ar*cosdeg(turtle.heading) * dir;
	var cy = turtle.ycor-ar*sindeg(turtle.heading) * dir;
	var sgn =  r == 0 ?  1 : r/Math.abs(r);
	turtle.seth(turtle.heading+a*sgn);
	turtle.xcor = cx-ar*cosdeg(turtle.heading) * dir;
	turtle.ycor = cy+ar*sindeg(turtle.heading) * dir;
//	console.log (turtle.xcor + "  " + turtle.ycor);
}

/////////////////////////
//
// Pen
//
/////////////////////////

fillscreen(b){
	var color = runtime.getnum(b,1);
	var shade = runtime.getnum(b,2);
	this.dofillscreen(color, shade); // #FAFAFA
}

pendown(){
	turtle.pendown=true;
	var pos = this.getPos();
	this.path += "M"+pos.x+","+pos.y;
	if (this.fillpathSVG) this.fillpathSVG += "M"+pos.x+","+pos.y;	
}

penup(){
	turtle.pendown=false;
	//this.drawSVGPath(this.path, true);
//	this.drawSVG();
}

drawSVG() {
	this.drawSVGPath(this.path, true);
	this.path = "";
	if (this.fillpathSVG &&  (this.fillpathSVG!="")) {
		this.fillpathSVG+="z";
		this.drawSVGPath(this.fillpathSVG, false);
		this.fillpathSVG = undefined;
	}
}

drawSVGPath(d, isStroke){
	let t = this;
	if (d == "")  return;
	if (isStroke && (turtle.pensize == 0)) return; 	
	if ((d.indexOf ("L") < 0)  && (d.indexOf ("A") < 0)) return;
	var c = t.getColor();	
  var attr = isStroke ? {"fill": 'none',"stroke":  c, "stroke-width":  turtle.pensize,
			"stroke-miterlimit": 10, 'd': d,  "stroke-linecap": "round", "stroke-linejoin": "round"} : {"fill": c, 'd': d}
	var	base = document.createElementNS(SVG.svgns, "path");
	for (var val in attr) base.setAttribute(val, attr[val]);
	this.svgGroup.appendChild(base);
}

drawDot (){
	var hasFillPath = this.fillpathSVG != undefined;
	this.drawSVG();
	var tr =  turtle.pensize / 2;
	var c = this.getColor();	
	var pos =  this.getPos();
	var attr = {fill: c,  cx: pos.x, cy: pos.y, r: tr}
	SVG.addChild(this.svgGroup, "circle", attr);
	if (hasFillPath) this.fillpathSVG = "M"+pos.x+","+pos.y;
}

setcolor(b){
	this.drawSVGPath(this.path, true);
	this.path = "";
	turtle.color=runtime.getnum(b,1);
}

setshade(b){
	this.drawSVGPath(this.path, true);
	this.path = "";
	turtle.shade=runtime.getnum(b,1);
}

setpensize(b){
	this.drawSVGPath(this.path, true);
	this.path = "";
	turtle.pensize = runtime.getnum(b,1);
}

startfill(){
	var pos =  this.getPos();
	this.fillpathSVG = "M"+pos.x+","+pos.y;
}

endfill(){
	if (this.fillpathSVG &&  (this.fillpathSVG!="")) {
		this.fillpathSVG+="z";
		this.drawSVGPath(this.fillpathSVG, false);
	}
	this.fillpathSVG = undefined;
}


/////////////////////////
//
//  Special
//
/////////////////////////

clean(){
	this.init();
	this.dofillscreen(-9999, 98); // #FAFAFA
}

dofillscreen(color, shade){
	while (this.svg.childElementCount >  0) this.svg.removeChild(this.svg.childNodes[0]);	
	this.svgGroup = SVG.addChild(this.svg, 'g',  {id: "imagepaths"});	
	var path = "M0,0L700,0L700,560L0,560z";
	var c = turtle.mergeColorShade(color,shade);
	var cc = '#'+(c+0x1000000).toString(16).substring(1);	
  var attr = {"id": "background", "fill": cc, 'd': path};
	var	base = document.createElementNS(SVG.svgns, "path");
	for (var val in attr) base.setAttribute(val, attr[val]);
	this.svgGroup.appendChild(base)
}

init (){
	turtle.xcor=0, turtle.ycor=0, turtle.heading=0;
	turtle.color=0, turtle.shade=50;
	turtle.pensize = 4;
	turtle.pendown = true;
	turtle.fillpathSVG = undefined;
	turtle.path = "";
}

/////////////////////////
//
// Overrides
//
/////////////////////////

wait (){}
showTurtle(){}
hideTurtle(){}



/////////////////////////
//
// Low Level
//
/////////////////////////

getColor (){	
	var c = turtle.mergeColorShade(turtle.color, turtle.shade);
	return '#'+(c+0x1000000).toString(16).substring(1);	
}

getPos () {return new Vector(turtle.xcor+turtle.cnvWidth/2,turtle.cnvHeight/2-turtle.ycor).trim(Geom.dp)}

}
