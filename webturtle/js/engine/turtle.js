class Turtle {

constructor(){
this.cnvWidth = 700;
this.cnvHeight = 560;
this.img;
this.ctx;
this.xcor;
this.ycor;
this.element;
this.heading = 0;
this.color=0;
this.shade=50;
this.pendown= true;
this.pensize = 0;
this.size = 70;
this.font = 'sans-serif';
this.fontsize = 30;
this.dpi = 2;
this.action = '';
this.dragangle = 0;

this.colors = [
	0xFF0000, 0xFF0D00, 0xFF1A00, 0xFF2600, 0xFF3300, 0xFF4000, 0xFF4D00, 0xFF5900, 0xFF6600, 0xFF7300, 
	0xFF8000, 0xFF8C00, 0xFF9900, 0xFFA600, 0xFFB300, 0xFFBF00, 0xFFCC00, 0xFFD900, 0xFFE600, 0xFFF200, 
	0xFFFF00, 0xE6FF00, 0xCCFF00, 0xB3FF00, 0x99FF00, 0x80FF00, 0x66FF00, 0x4DFF00, 0x33FF00, 0x1AFF00, 
	0x00FF00, 0x00FF0D, 0x00FF1A, 0x00FF26, 0x00FF33, 0x00FF40, 0x00FF4D, 0x00FF59, 0x00FF66, 0x00FF73, 
	0x00FF80, 0x00FF8C, 0x00FF99, 0x00FFA6, 0x00FFB3, 0x00FFBF, 0x00FFCC, 0x00FFD9, 0x00FFE6, 0x00FFF2, 
	0x00FFFF, 0x00F2FF, 0x00E6FF, 0x00D9FF, 0x00CCFF, 0x00BFFF, 0x00B3FF, 0x00A6FF, 0x0099FF, 0x008CFF, 
	0x0080FF, 0x0073FF, 0x0066FF, 0x0059FF, 0x004DFF, 0x0040FF, 0x0033FF, 0x0026FF, 0x001AFF, 0x000DFF, 
	0x0000FF, 0x0D00FF, 0x1A00FF, 0x2600FF, 0x3300FF, 0x4000FF, 0x4D00FF, 0x5900FF, 0x6600FF, 0x7300FF, 
	0x8000FF, 0x8C00FF, 0x9900FF, 0xA600FF, 0xB300FF, 0xBF00FF, 0xCC00FF, 0xD900FF, 0xE600FF, 0xF200FF, 
	0xFF00FF, 0xFF00E6, 0xFF00CC, 0xFF00B3, 0xFF0099, 0xFF0080, 0xFF0066, 0xFF004D, 0xFF0033, 0xFF001A, 
	0xFF0000];
	
}

setup(){
	var t = this;
	t.element = document.createElement('div');
	t.element.setAttribute ('class', 'turtle');
	t.element.jsobj = t;
	cnvframe.appendChild(t.element);
	t.img = document.createElement('img');
	t.element.appendChild (t.img);
	t.img.src = 'assets/turtle.svg';
	t.img.onload = imgLoaded;
	t.ctx = canvas.getContext('2d');
	canvas.width = t.cnvWidth*t.dpi;
	canvas.height = t.cnvHeight*t.dpi;
	t.ctx.scale(t.dpi,t.dpi);
	t.ctx.textAlign = 'center';
	t.ctx.textBaseline="middle"; 
	t.clean();

	function imgLoaded(){
		t.img.width = t.size;
		t.img.height = t.size;
		t.element.style.width = t.size+'px';
		t.element.style.height = t.size+'px';
		t.move();
	}

}

/////////////////////////
//
// TurtleData
//
/////////////////////////

getpos (n) {
	var t = this;
	return {x: t.xcor+n*sindeg(t.heading), y: t.ycor+n*cosdeg(t.heading)};
}

turndone(n){this.seth(n);}

forwarddone(pos){
	var t = this;
	var x= pos.x;
	var y= pos.y;
	if (((x-t.xcor) == 0) && ((y-t.ycor) == 0)) return;
	if(t.pendown){
		t.ctx.beginPath();
		t.ctx.moveTo(t.xcor+t.cnvWidth/2, t.cnvHeight/2-t.ycor);
	}
	t.xcor = x;
	t.ycor = y;
	if(t.pendown){
		var sx=t.xcor+t.cnvWidth/2, sy=t.cnvHeight/2-t.ycor;
		t.ctx.lineTo(sx,sy);
		if(t.pensize!=0) t.ctx.stroke();
		if(t.fillpath) t.fillpath.push(function(){turtle.ctx.lineTo(sx,sy);});
	}
}

arcdone(dir, pos){}

/////////////////////////
//
// Turtle
//
/////////////////////////

forward(n){
	//console.log ("forward", n)
	var t = this;
	if(t.pendown){
		t.ctx.beginPath();
		t.ctx.moveTo(t.xcor+t.cnvWidth/2, t.cnvHeight/2-t.ycor);
	}
	t.xcor+=n*sindeg(t.heading);
	t.ycor+=n*cosdeg(t.heading);
	if(t.pendown){
		var sx=t.xcor+t.cnvWidth/2, sy=t.cnvHeight/2-t.ycor;
		if(n>=.1)t.ctx.lineTo(sx,sy);
		else t.ctx.lineTo(sx, sy+.1);
		if(t.pensize!=0) t.ctx.stroke();
		if(t.fillpath) t.fillpath.push(function(){turtle.ctx.lineTo(sx,sy);});
	}
}

right(n){this.seth(this.heading+n);}
left(n){this.seth(this.heading-n);}
seth(a){this.heading=a; this.heading=this.heading.mod(360);}

setxy(x,y){
	var t = this;
	t.xcor = x;
	t.ycor = y;
	var sx=t.xcor+t.cnvWidth/2, sy=t.cnvHeight/2-t.ycor;
	if(t.fillpath) t.fillpath.push(function(){turtle.ctx.moveTo(sx,sy);});
}

arc(a,r){
	var t = this;
	if(a==0) return;	
	if(r==0) {t.seth(t.heading+a);}
	else if (a<0) leftArc(a,r);
	else rightArc(a,r);

	function rightArc(a,r){
		var sgn = r/Math.abs(r);
		var ar = Math.abs(r);
		var dx = ar*cosdeg(t.heading);
		var dy = ar*sindeg(t.heading);
		var cx = t.xcor+dx;
		var cy = t.ycor-dy;
		if(t.pendown){
			var sx=t.cnvWidth/2+cx, sy=t.cnvHeight/2-cy;
			var astart=rad(t.heading+180.0), aend=rad(t.heading+180+a*sgn);
			if((a%360)==0) aend+=.0001;
			var dir = r<0;
			t.ctx.beginPath();
			t.ctx.moveTo(t.xcor+t.cnvWidth/2, t.cnvHeight/2-t.ycor);
			t.ctx.arc(sx, sy, ar, astart, aend, dir); 
			if(t.pensize!=0) t.ctx.stroke();
			if(t.fillpath) t.fillpath.push(function(){turtle.ctx.arc(sx, sy, ar, astart,aend, dir);});
		}
		t.seth(t.heading+a*sgn);
		t.xcor = cx-ar*cosdeg(t.heading);
		t.ycor = cy+ar*sindeg(t.heading);
	} 

	function leftArc(a,r){
		var sgn = r/Math.abs(r);
		var ar = Math.abs(r);
		var dx = ar*cosdeg(t.heading);
		var dy = ar*sindeg(t.heading);
		var cx = t.xcor-dx;
		var cy = t.ycor+dy;
		if(t.pendown){
			var sx=t.cnvWidth/2+cx, sy=t.cnvHeight/2-cy;
			var astart=rad(t.heading), aend=rad(t.heading+a*sgn);
			var dir = r>=0;
			if((a%360)==0) aend+=.0001;
			t.ctx.beginPath();
			t.ctx.moveTo(t.xcor+t.cnvWidth/2, t.cnvHeight/2-t.ycor);
			t.ctx.arc(sx, sy, ar, astart,aend, dir); 
			if(t.pensize!=0) t.ctx.stroke();
			if(t.fillpath) t.fillpath.push(function(){turtle.ctx.arc(sx, sy, ar, astart,aend, dir);});
		}
		t.seth(t.heading+a*sgn);
		t.xcor = cx+ar*cosdeg(t.heading);
		t.ycor = cy-ar*sindeg(t.heading);
	}
}

showTurtle(){this.element.style.visibility = 'visible';}
hideTurtle(){this.element.style.visibility = 'hidden';}

/////////////////////////
//
// Pen
//
/////////////////////////

fillscreen(c,s){
	var oldcolor = this.color, oldshade=this.shade;
	if((typeof c)=='object') c = c[0];
	this.setCtxColorShade(c, s);
	this.ctx.fillRect(0,0,this.cnvWidth,this.cnvHeight);
	this.setCtxColorShade(this.color, this.shade);
}

setcolor(c){
	if((typeof c)=='object'){this.color = c[0]; this.shade = c[1];}
	else this.color = c;
	this.setCtxColorShade(this.color, this.shade);
}

setshade(sh){
	this.shade=sh;
	this.setCtxColorShade(this.color, this.shade);
}

setpensize(ps){
	this.pensize = ps;
	this.ctx.lineWidth = Math.abs(this.pensize);
}

startfill(){
	this.fillpath = new Array();
	var sx=this.xcor+this.cnvWidth/2, sy=this.cnvHeight/2-this.ycor;
	this.fillpath.push(function(){turtle.ctx.moveTo(sx, sy);});
}

endfill(){
	if(!this.fillpath) return
	this.ctx.beginPath();
	for(var i in this.fillpath){
		if(i>2000) break;
		this.fillpath[i]();
	}
	this.ctx.fill();
	this.fillpath = undefined;
}

setlinedash(l){
	this.ctx.setLineDash(l);
}

/////////////////////////
//
// Text
//
/////////////////////////

drawString(str){
	var t = this;
	t.ctx.save();
	turtle.ctx.translate(t.xcor+t.cnvWidth/2, t.cnvHeight/2-t.ycor);
	t.ctx.rotate(rad(t.heading));
	t.ctx.fillText(str,0,0);
	t.ctx.restore();	
}

setfont(f){
	this.font = f;
	this.ctx.font = this.fontsize+'px '+f;
}

setfontsize(s){
	this.fontsize = s;
	this.ctx.font = s+'px '+this.font;
}


/////////////////////////
//
//  Basic stuff
//
/////////////////////////

move(){
	var t = this;
	if(!t.img.complete) return;
	var dx = screenLeft();
	var dy = screenTop();
	var s = canvas.offsetHeight/t.cnvHeight;
	t.element.style.webkitTransform = 'translate('+dx+'px, '+ dy+ 'px) rotate(' + t.heading + 'deg)'+' scale('+s+','+s+')';
	t.element.left = dx; 
	t.element.top = dy; 

	function screenLeft() {return -t.size/2+(t.xcor+t.cnvWidth/2)*canvas.offsetWidth/t.cnvWidth;}
	function screenTop() {return -t.size/2+(t.cnvHeight/2-t.ycor)*canvas.offsetHeight/t.cnvHeight;}

}

clean(){
	var t = this;
	t.xcor=0, t.ycor=0, t.heading=0;
	t.setCtxColorShade(-9999, 98); // #FAFAFA
	t.ctx.fillRect(0,0,t.cnvWidth,t.cnvHeight);
	t.color=0, t.shade=50;
	t.setCtxColorShade(t.color, t.shade);
	t.pensize = 4;
	t.ctx.lineWidth=t.pensize;
	t.pendown = true;
	t.fillpath = undefined;
	t.ctx.lineCap = 'round';
	t.ctx.lineJoin = 'round';
	t.font = 'sans-serif';
	t.fontsize = 30;
	t.ctx.font = '30px sans-serif';
	t.ctx.setLineDash([]);	
}

/////////////////////////
//
// load/save
//
/////////////////////////

loadpng(url, name, fcn){
	var t = this;
	var ctx = this.ctx;
	var img = new Image;
	img.onload = drawImageToFit;
	img.src = url;

	function drawImageToFit(){
		var code = readHiddenData();
		if(code=='bad sig') error('not a TurtleArt project');
		else if (code.substring(1,6)=='thumb') loadFromThumb(code)
		else {
			project.loadFile(code, name);
			var s = t.cnvWidth/img.naturalWidth;
			ctx.save();
			ctx.scale(s,s);
			ctx.drawImage(img, 0, 0);
			ctx.restore();
		}	
		if(fcn) fcn();
	}

	function loadFromThumb(str){
		var l =  Tokenizer.parse(str.substr(1,str.length-2));
		var url = getUrlVars()["ulurl"];
		if(url==undefined){error('missing ulurl'); return;}
	 	var ws = new WebSocket(url);
		ws.onmessage = resp;
		ws.onopen = function(){
			ws.send('0:getimg:'+l[1]);
		}

		function resp(m){
			var data = m.data.split(':')[1];
			ws.close();
			if(data=='error') {error('image not on server'); return}
			var dataurl = 'data:image/png;base64,'+data;
			t.loadpng(dataurl,name,fcn);
		}
	}

	function readHiddenData(){
		var cnv = document.createElement("canvas");
		cnv.width = img.naturalWidth;
		cnv.height = img.naturalHeight;
		var ctx = cnv.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(img, 0, 0);
		return ImageData.getImageData(ctx);
	}

	function error(str){
		footer.innerHTML=str;
		footer.style.visibility='visible';
	}
}

savepng(){
	var name = prompt('Зберегти як', project.name);
	if(name==null) return;
	this.saveproject (name)
}

saveproject(name, fcn){
	name = name.replaceAll('|','_');
	project.name = name;
	var s = project.projectString();
	ImageData.setImageData(turtle.ctx, s);
	var a = document.createElement('a');
  canvas.toBlob(next);

  function next(blob){
		a.href = URL.createObjectURL(blob);
		a.download = project.name+'.png';
		frame.appendChild(a);
		a.click();
		frame.removeChild(a);
		if (fcn) fcn(name)
	}
}

/////////////////////////
//
// Low Level
//
/////////////////////////


setCtxColorShade(color, shade){
	var t = this;
	let c  = t.mergeColorShade(color, shade);
	setCtxColor(c);

	function setCtxColor(c){
		var cc = '#'+(c+0x1000000).toString(16).substring(1);
		t.ctx.strokeStyle = cc;
	//  console.log ('ctx color:',cc);
		t.ctx.fillStyle = cc; 
	}
}

mergeColorShade(color, shade){
		var t = this;
		var sh = Math.abs(shade.mod(200));
		if(sh>100) sh = 200 - sh;
		if(color==-9999) return blend(0x000000, 0xffffff, sh/100);
		var c = colorFromNumber(color);
		if(sh==50) return c;
		else if (sh<50) return blend(c, 0x000000, (50-sh)/60);
		else return blend(c, 0xffffff, (sh-50)/53);

	function colorFromNumber (c){
		var mc = c.mod(100);
		var ic = Math.floor(mc);
		var fract = mc - ic;
		return blend(t.colors[ic], t.colors[ic+1], fract);
	}

	function blend(a, b, s){
		var ar=(a>>16)&0xff, ag=(a>>8)&0xff, ab=a&0xff; 
		var br=(b>>16)&0xff, bg=(b>>8)&0xff, bb=b&0xff; 
		var rr = Math.round(ar*(1-s)+br*s);
		var rg = Math.round(ag*(1-s)+bg*s);
		var rb = Math.round(ab*(1-s)+bb*s);
		return (rr<<16)+(rg<<8)+rb;
	}
}

/////////////////////////
//
// Drag and Drop
//
/////////////////////////

dragstart(obj,e){
	e.preventDefault(); 
	e.stopPropagation();
	var t = turtle;
	var cnvx = localx(e.clientX);
	var cnvy = localy(e.clientY);
	var tx = cnvx*t.cnvWidth/canvas.offsetWidth-(t.cnvWidth/2);
	var ty = (t.cnvHeight/2)-cnvy*t.cnvHeight/canvas.offsetHeight;
	var dist = magnitude([tx-turtle.xcor,ty-turtle.ycor]);
	if(dist>turtle.size*.4){events.jsobj=scripts; events.handler=scripts; scripts.dragstart(obj,e); return;}
  t.action = dist<(turtle.size*0.2) ? "move" : "turn";
	cnvframe.appendChild(turtle.element);
	t.dragangle = t.dragAngle(e)-t.heading;
}

dragmove(t,e,x,y){
	e.preventDefault(); 
	e.stopPropagation();
	if (turtle.action == "move") turtle.dragmoveMove(t,e,x,y);
	else turtle.dragmoveTurn(t,e,x,y);
}

dragmoveMove(t,e,x,y){
	var t = turtle;
	var newx = t.xcor+x*t.cnvWidth/canvas.offsetWidth;
	var newy = t.ycor-y*t.cnvHeight/canvas.offsetHeight;
	UI.showText("Turtle X="+Math.round(t.xcor+x*t.cnvWidth/canvas.offsetWidth)+", Y="+Math.round(t.ycor-y*t.cnvHeight/canvas.offsetHeight));
	t.setxy(newx,newy);
	t.move();
}

dragmoveTurn(t,e,x,y){
	turtle.seth(Math.round(turtle.dragAngle(e)-turtle.dragangle));
	turtle.move();
}

dragAngle(e){
	var t = turtle;
	var cnvx = localx(e.clientX);
	var cnvy = localy(e.clientY);
	var tx = cnvx*t.cnvWidth/canvas.offsetWidth-(t.cnvWidth/2);
	var ty = (t.cnvHeight/2)-cnvy*t.cnvHeight/canvas.offsetHeight;
	UI.showText("Turtle Angle: "+Math.round(90-deg(Math.atan2(ty-turtle.ycor,tx-turtle.xcor))));
	return 90-deg(Math.atan2(ty-turtle.ycor,tx-turtle.xcor));
}

dragend(t,e,x,y){
	var blks = scripts.getBlocks();
	cnvframe.insertBefore(turtle.element, scripts.blockcanvas);
	turtle.action = '';
}

// PB for Exporter
getstate(){
 return {xcor: this.xcor, ycor: this.ycor, heading: this.heading, color: this.color,
  shade: this.shade, pendown: this.pendown, pensize: this.pensize}
}

setstate (attr) {
	for (let key in attr) this[key] = attr [key];
}

}
