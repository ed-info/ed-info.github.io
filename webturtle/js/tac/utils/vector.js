/* © 2018 Playful Invention Company - Paula Bontá */

class Vector {
	constructor (x, y) {
		this.x = x ? x : 0
		this.y = y ? y : 0
	}
	
	sum (b){return new  Vector(this.x + b.x, this.y + b.y)}
	diff (b){return new  Vector(this.x - b.x, this.y - b.y)}	
	equal (b){return this.diff(b).len() == 0;}
	floor (){return new Vector(Math.floor (this.x), Math.floor (this.y))}
	len (){return Math.sqrt (this.x*this.x + this.y*this.y)}

	norm (){
		var value = this.len();
		if (value == 0) value = 0.001;
		return new  Vector( this.x  / value,  this.y  / value)
	}

	clone (){return new Vector(this.x, this.y)}
	perp (){return new Vector(-this.y,  this.x)}

	interpolate(b, perc) {
		let x = this.x * (1-perc) + b.x*perc;
		let y = this.y * (1-perc) + b.y*perc;
		return new Vector (x,y)
	}
	
	trim(n) {return new Vector(this.x.trim(n), this.y.trim(n));}

	scale (s){return new Vector(this.x * s, this.y * s)}

	dot (b){return this.x*b.x + this.y*b.y}
	
	cross(b) {return this.x * b.y - this.y * b.x;}

	mid (b){return  new Vector((this.x + b.x) / 2, (this.y + b.y) / 2)}

	toString(n) {return this.x.trim(n).toString()+"_" + this.y.trim(n).toString()}
	
	trace(n) {return this.x.trim(n).toString()+" " + this.y.trim(n).toString()}
	
}
