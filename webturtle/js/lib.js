////////////////////////
//
// one liners
//
/////////////////////////

function gn(str) {return document.getElementById(str);}
function rl() { window.location.reload(true);}
Number.prototype.mod = function(n) {return ((this%n)+n)%n;}
Number.prototype.isInt = function() {return (this/Math.floor(this)) == 1;}
function last(l){return l[l.length-1];}
function getDocumentHeight(){return Math.max(document.body.clientHeight, document.documentElement.clientHeight);}
function getDocumentWidth(){return Math.max(document.body.clientWidth, document.documentElement.clientWidth);}

function abs(pos){var x=pos[0], y=pos[1]; return Math.sqrt(x*x+y*y);}
function rad(a){return a*2*Math.PI/360;}
function deg(a){return a*360/(2*Math.PI);}
function sindeg(x){return Math.sin(x*2*Math.PI/360);}
function cosdeg(x){return Math.cos(x*2*Math.PI/360);}

function globalx(el){return el.getBoundingClientRect().left;}
function globaly(el){return el.getBoundingClientRect().top;}
function localx(gx){return (gx-cnvframe.getBoundingClientRect().left);}
function localy(gy){return (gy-cnvframe.getBoundingClientRect().top);}
function magnitude(pos) {var x=pos[0], y=pos[1]; return Math.sqrt(x*x+y*y);}
function setProps(object, props){for(var i in props) object[i] = props[i];}
function flatten (arrays) {return [].concat.apply([], arrays);}

function ptInDiv(d, x, y){
	var dx = globalx(d);
	var dy = globaly(d);
	if(x<dx) return false;
	if(x>dx+d.offsetWidth) return false;
	if(y<dy) return false;
	if(y>dy+d.offsetHeight) return false;
	return true;
}

function setSVG(div, str, cb){
	var img = div.childNodes[0];
	img.onload = next;
	img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(str)));	
	
	function next(){if(cb) cb();}
}

function newHTML(type, c, p) {
	var e = document.createElement(type);
	if (c) e.setAttribute ("class", c);
	if (p) p.appendChild(e);
	return e;
}

////////////////////////
//
// converter pts registration
//
/////////////////////////

function registerVertices (list, aa) {
	for (let i = 0; i < list.length; i++){	
		var p = list[i]	
		if (!p) continue;			
		register(aa, p.start, i)	
		register(aa, p.end, i)
	}	
}

function register(obj, v, pos) {
		var str = v.toString(Geom.dp)
		var l = obj[str]
		l = l ? l : []
		l.push(pos)
		obj[str] = l;
	}

function unregister(obj, v, pos) {
	var str = v.toString(Geom.dp)
	var l = obj[str]
	if (!l) return;
	let n = l.indexOf(pos);
	if (n < 0) return;
	l.splice(n,1);
	if (l.length == 0) delete obj[str];
	else obj[str] = l;	
}
	

////////////////////////
//
// URL vars
//
/////////////////////////

function getUrlVars(){
	if (window.location.href.indexOf('?') < 0) return [];
	var args = window.location.href.slice(window.location.href.indexOf('?') + 1);
	var vars = [], hash;
	
	var hashes = args.split('&');
	for(var i = 0; i < hashes.length; i++){
		hash = hashes[i].split('=');
		vars[hash[0]] = hash[1];
	}
	console.log("UrlVars=",vars);
  return vars;
}

////////////////////////
//
// timer
//
/////////////////////////

var t0 = Date.now();
var deltatime0;
var _debug = false;
function resett () {t0 = Date.now(); deltatime0 = t0;}
function timer(){return Date.now()-t0;}
function now(){return new Date().getTime();}

function tracetime (str) {
	if (!_debug) return;
	console.log (str, (Date.now() - deltatime0) /1000, "sec", 'since start:', (Date.now() - t0) /1000); deltatime0 = Date.now();
}

function warn (str) {
	if (!_debug) return;
	console.warn (str)
}

var _timeout;

function waituntil (waitcond, fcn){
	if (_timeout != undefined) clearTimeout(_timeout);
	_timeout = undefined;
	if (waitcond()) _timeout = setTimeout(function (){waituntil(waitcond, fcn)}, 500);
	else fcn();
}

////////////////////////
//
// random
//
/////////////////////////

class Random {

constructor(){
this.seed = (new Date).getTime();
this.startseed = this.seed;
}


oneof(a,b){
	return this.nextRandomDouble()<.5 ? a : b;
}

pickRandom(a,b){
	var t = this;
	var ia = Math.floor(a);
	var ib = Math.floor(b);
	if((a==ia)&&(b==ib)) return a+(Math.floor(this.nextRandomDouble()*(b-a+1)));
	else return a+(this.nextRandomDouble()*(b-a));
}

nextRandomDouble(){
	var t = this;
	var r1 = nextRandom(26);
	var r2 = nextRandom(27);
	return (r1*Math.pow(2,27)+r2)/Math.pow(2,53);	
	
	function nextRandom(bits){
		var k = 0x5DEECE66D;
		var shift=1, mod=Math.pow(2,48);
		var part, res=0;
		for(var i=0;i<9;i++){
			part = (k%16)*t.seed%mod*shift;
			res+=part;
			k = Math.floor(k/16);
			shift*=16; mod/=16;
		}
		res+=11; res%=Math.pow(2,48);
		t.seed = res;
		return Math.floor(res/Math.pow(2,48-bits));
	}
}}

class ImageData {

static getImageData(ctx){
	var pixels = ctx.getImageData(0, 0, 500, 300).data;
	var x=0, y=0;
	var signature = readln(20);
	if(signature!='TurtleArt') return 'bad sig';
	return readln(100000);


	function readln(max){
		var res = '';
		var c, cksum=0;
		for (var i=0;i<max;i++) {
			c=rb();
			cksum += c;
			cksum &= 0xffff;
			if (c == 0xff) {
				if  (cksum != rb() + (rb() << 8)) res = "bad checksum";
				return decodeURIComponent(escape(res));
			}
			res = res + String.fromCharCode(c);
		}
		return 'bad readln';
	}

	function rb(){
		var res = 0;
		var idx = (x*4)+y*2000;
		res += (pixels[idx+2]&1);
		res += (pixels[idx+1]&1)<<1;
		res += (pixels[idx]&1)<<2;
		idx = (x*4)+(y+1)*2000;
		res += (pixels[idx+2]&1)<<3;
		res += (pixels[idx+1]&1)<<4;
		res += (pixels[idx]&1)<<5;
		idx = (x*4)+(y+2)*2000;
		res += (pixels[idx+2]&1)<<6;
		res += (pixels[idx+1]&1)<<7;
		x++;
		if (x==500) {x = 0; y+=3;}
		return res
	}
}

static setImageData(ctx, str){
	var imd = ctx.getImageData(0, 0, 500, 300);
	var pixels = imd.data;
	var x=0, y=0;
	println('TurtleArt');
	println(str);
	ctx.putImageData(imd,0,0);


	function println(str){
		var arr = explode(str);
		arr.push(0xff);
		var cksum = 0;
		for(var i in arr){
			wb(arr[i]);
			cksum+=arr[i];
		}
		wb(cksum&0xff);
		wb((cksum>>8)&0xff);
	}

	function wb(n){
		var idx = (x*4)+y*2000;
		pixels[idx+2]&=0xfe; pixels[idx+2]+=getbit(n,0);
		pixels[idx+1]&=0xfe; pixels[idx+1]+=getbit(n,1);
		pixels[idx]&=0xfe; pixels[idx]+=getbit(n,2);
		pixels[idx+3]=0xff;
		idx = (x*4)+(y+1)*2000;
		pixels[idx+2]&=0xfe; pixels[idx+2]+=getbit(n,3);
		pixels[idx+1]&=0xfe; pixels[idx+1]+=getbit(n,4);
		pixels[idx]&=0xfe; pixels[idx]+=getbit(n,5);
		pixels[idx+3]=0xff;
		idx = (x*4)+(y+2)*2000;
		pixels[idx+2]&=0xfe; pixels[idx+2]+=getbit(n,6);
		pixels[idx+1]&=0xfe; pixels[idx+1]+=getbit(n,7);
		pixels[idx+3]=0xff;
		x++;
		if (x==500) {x = 0; y+=3;}
	}

	function explode(str){
		var res = new Array();
		var ustr = unescape(encodeURIComponent(str));
		for(var i=0;i<ustr.length;i++) res.push(ustr.charCodeAt(i));
		return res;
	}

	function getbit(word, n) { return 1 & (word >> n); }
}

}

/////////////////////////
//
// Tokenizer
//
/////////////////////////

class Tokenizer {

constructor(s){
this.str = s;
this.offset = 0;
}

static parse(s){return new Tokenizer(s).tokenize();}

tokenize(){
	var t = this;
	return readList();

function readList(){
	var a = new Array();
	skipSpace();
	while(true){
		if(eof()) break;
		var token = readToken();
		if(token==null) break;
		a.push(token);
	}
	return a;
}

function readToken(){
	if(peekChar()=="|") return readString();
	var s = next();
	var n = Number(s);
	if(!isNaN(n)) return n;
	var first = s.charAt(0);
	if(first=="]") return null;
	if(first=="[") return readList();
	return s;
}


function next(){
	var res='';
	if(delim()) res=nextChar();
	else {
		while(true){
			if(eof()) break;
			if(delim()) break;
			else res+=nextChar();
	}}
	skipSpace();
	return res;
}

function readString(){
	nextChar();
	var res='';
	while (true){
		var c=nextChar();
		if(eof()) return res;
		if(c=="|") {skipSpace(); return res;}
		res+=c;
	}
	return null;
}

function nextLine(){
	var res='';
	while (true){
		if(eof()) return res;
		var c=nextChar();
		if(c=='\n') return res;
		res+=c;
	}
}

function skipSpace(){
	while(true){
		if(eof()) return;
		var c = peekChar();
		if(c==';') {skipComment(); continue;}
		if(" \t\r\n,".indexOf(c)==-1) return;
		nextChar();
	}	
}

function skipComment(){
	while(true){
		var c = nextChar();
		if(eof()) return;
		if(c== '\n') return;
	}	
}

function delim(){return "()[] \t\r\n".indexOf(peekChar())!=-1;}
function peekChar(){return t.str.charAt(t.offset);}
function nextChar(){return t.str.charAt(t.offset++);}
function eof() {return t.str.length==t.offset;}	

}}


/////////////////////////
//
// PngScraper
//
/////////////////////////

class PngScraper {

scrape(bytes){
	var t = this;
	var pixels = [];
	var addr = 16;		// skip past the file signature
	var width = read32(), height = read32();
	addr+=1;				// skip pixel depth
	var bpp = (read8()==2)?3:4;
	addr+=7;	// skip rest of header
//	console.log('width:', width, ' height:', height, ' bpp:', bpp);
	scanChunks();

function scanChunks(){
	while(addr<bytes.length){
		var startaddr = addr;
		var len = read32();
		var sig = readsig();
		var data = readn(len);
//		console.log(len,sig,data);
		addr+=4;		//skip crc
		if(['IHDR','IDAT','IEND'].indexOf(sig)==-1){
		 bytes.splice(startaddr,len+12);
		 addr = startaddr;
		}
	}
}

function readn(n){
	var res= [];
	for(var i=0;i<n;i++) res.push(read8());
	return res;
}

function read8(){return bytes[addr++];}
function read32(){return (read8()<<24)+(read8()<<16)+(read8()<<8)+read8();}
function readc(){return String.fromCharCode(read8());}
function readsig(){return readc()+readc()+readc()+readc();}

}}


