/* © 2018 Playful Invention Company - Paula Bontá */


////////////////////////////////////////
// Basic Matrix
////////////////////////////////////////
class Rectangle {
	constructor (x,y,w,h) {
		this.x = x ? x : x == 0 ? 0  : Infinity;
		this.y = y ? y : y == 0 ? 0  : Infinity;
		this.width = w ? w : 0
		this.height = h ? h : 0
	}
	
 	real (n) {return (n == Infinity) ?  0 : n;}
  
  clone(){return new Rectangle(this.x, this.y, this.width, this.height);}

	hitRect (pt){
		var x = pt.x; var y = pt.y;
		if(x<this.x) return false;
		if(x>this.x+this.width) return false;
		if(y<this.y) return false;
		if(y>this.y + this.height) return false;
		return true;
	}

	hitEdge (pt){
		var x = pt.x; var y = pt.y;
		if ((x ==this.x)|| (x== (this.x+this.width))){
			if(y<this.y) return false;
			if(y>this.y + this.height) return false;
			return true;	
		}
		else if ((y==this.y)|| (y== (this.y+this.height))) {
			if(x<this.x) return false;
			if(x>this.x + this.width) return false;
			return true;
		
		}
	}
	
	getCorners (){
		let res  = []
		res.push (new Vector (this.x, this.y))
		res.push (new Vector (this.x+this.width, this.y))
		res.push (new Vector (this.x+this.width, this.y + this.height))
		res.push (new Vector (this.x, this.y + this.height))
		return res;
	}
	
	overlapElemBy (box2,percent){return this.overlapElem(box2) >= percent;}

	overlapElem (box2){
		var boxi = this.intersection(box2);
		if (boxi.isEmpty()) return 0;
		if (boxi.isEqual(box2)) return 1;
		if (boxi.isEqual(this)) return 1;
		return (boxi.width * boxi.height) / (box2.width * box2.height);
	}
	
	intersects (r){
		var x0 = Math.max(this.x, r.x);
		var x1 = Math.min(this.x + this.width, r.x + r.width);
		if (x0 <= x1) {
			var y0 = Math.max(this.y, r.y);
			var y1 = Math.min(this.y + this.height, r.y + r.height);
			if (y0 <= y1) return true;
		}
		return false;
	}
	
	intersection (box2){
		var dx = Math.max(this.x, box2.x);
		var dw = Math.min(this.width + this.x, box2.width + box2.x)
		if (dx <= dw) {
			var dy = Math.max(this.y, box2.y);
			var dh = Math.min(this.height + this.y, box2.height + box2.y) 
			if (dy > dh) return new Rectangle();
			return new Rectangle(dx,dy, dw - dx, dh - dy);
		}
		return new Rectangle();
	}

	union (box2){
		if (this.isEmpty()) return box2;
		if (box2.isEmpty()) return this;
		var box = new Rectangle();
		box.x = Math.min(this.x, box2.x)
		box.y = Math.min(this.y, box2.y)
		let myx = this.real(this.x); let myy = this.real(this.y);
		let yourx = this.real(box2.x); let youry = this.real(box2.y);
		
		if (box.x < 0) {myx -= box.x; yourx -= box.x;}
		if (box.y < 0) {myy -= box.y; youry -= box.y;}
		box.width = Math.max(this.width + myx, box2.width + yourx) - ((box.x < 0) ? 0 :  this.real(box.x));
		box.height =  Math.max(this.height + myy, box2.height + youry) - ((box.y < 0) ? 0 : this.real(box.y));
		return box;
	}

	include (pt){
		var box = new Rectangle();
		box.x = Math.min(this.real(this.x), this.real(pt.x))
		box.y = Math.min(this.real(this.y), this.real(pt.y))
		box.width = Math.max(0, Math.max(this.width + this.x, pt.x) - box.x)
		box.height = Math.max (0, Math.max(this.height + this.y, pt.y)  - box.y)
		return box;
	}
 
	expandBy (sw){
		this.x -= sw;
		this.y -= sw;
		this.width += sw * 2;
		this.height += sw * 2;
		return this
	}

	round (){
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		this.width = Math.round(this.width);
		this.height = Math.round(this.height);
	}
	
	trim (n){
		this.x = this.x.trim (n);
		this.y = this.y.trim (n)
		this.width = this.width.trim (n);
		this.height = this.height.trim (n);
		return this
	}

	toParts(size){
		let parts = []
		let pts = [new Vector (this.x, this.y),new Vector (this.x, this.y+this.height), 
							new Vector (this.x+this.width , this.y+this.height),
							new Vector (this.x+this.width , this.y)];
		for (let i=0; i<pts.length; i++) {
			let 	p = new Part({type: "line", start: pts[i], end: pts[(i+1).mod(pts.length)], strokesize: size});	
		 	p.trim(Geom.dp);
		 	parts.push(p);
		}
		return parts;
	}
		
	svgPath(){return "M"+ this.x+','+ this.y+'l'+this.width+', 0l0,'+this.height+
										'l'+ -this.width+', 0l0,'+ -this.height+"z";}
	
	addPoint(pt){		
		let x = (pt.x < this.x) ?  pt.x : this.x;
		let y = (pt.y < this.y) ?  pt.y : this.y;
		let dx = (x == Infinity) ? 0 : this.x;
		let dy = (y == Infinity) ? 0 : this.y;
		if (pt.x < dx) this.width +=  (x != Infinity) ? this.x - pt.x :  pt.x;
		if (pt.y < dy) this.height +=  (y != Infinity) ? this.y - pt.y :  pt.y;
		if (pt.x > (this.width +  dx))  this.width = pt.x - dx ;
		if (pt.y > (this.height + dy)) this.height =  pt.y - dy;
		this.x = x;
		this.y = y;
	}

	zeroTopLeft(){this.x =0; this.y = 0;}
	toString(){return JSON.stringify(this);}
	
	shiftBy (dx, dy){
		this.x += dx;
		this.y += dy;
	}
	
	getArea (){return this.width * this.height;}

	rounded (){
		return new Rectangle(Math.floor(this.x), Math.floor(this.y),Math.round(this.width) + 1 ,Math.round(this.height) + 1);
		}

	isEqual (box2){
		return (this.x == box2.x ) &&  (this.y == box2.y ) && 
					(this.width == box2.width) &&  (this.height== box2.height);
	}

	isEmpty () {
		return (((this.x == Infinity) && (this.y ==Infinity)) || ((this.x == 0) && (this.y == 0)))
		 				&& (this.width == 0) && (this.height == 0);
		}


}
