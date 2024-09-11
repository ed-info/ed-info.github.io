/* © 2018 Playful Invention Company - Paula Bont‡ */

class PathFinder {
	constructor(pieces, whenDone) {	
		this.pieces = pieces;
		this.edge = []; // outer edge of the image
		this.stack = []; // find path option stack
		this.pathparts = []; // final result list
		if (!whenDone) return;
		let self = this;
		self.process(doNext);
	
		function doNext (list, lastparts){
			if (lastparts.length != 0) warn ("final",  lastparts.length)
			whenDone (list);
		}
	}
 
	process(whenDone){
		let pieces  = this.pieces;
		let self = this;
		this.pathparts = [];
		this.lastcount = pieces.length;	
//		Exporter.pc.partsToPath(Exporter.pc.svgresult, pieces,  "#009eff", "before process"); 
		self.processShape(pieces, doNext);
		
		function doNext (pieces) {
			if ((pieces.length == 0)  || (pieces.length == self.lastcount)) {
				whenDone (self.pathparts, pieces);
				return;
			}
			else {
				self.lastcount = pieces.length;
				self.processShape(pieces, doNext);
			}
		}
	}
	
	processSegments(pieces, color){
		let self = this;
		let result  = [];
		var n = 0;
		return doAllParts (pieces)
	//	console.log (pieces)
	//	Exporter.pc.partsToPath(Exporter.pc.svgresult, pieces,  "#009eff", "shape"); 
		function doAllParts (pieces) {
			self.pathparts  = [];
			n++;
			self.pointsData = self.getData(pieces);	
			var lastcount = self.pointsData.parts.length;	
			if (self.pointsData.parts.length == 0) return result;
			self.getPath(self.pointsData);
	//		if (self.pathparts.length == 0) console.warn ("POTENTIAL ERROR", self.pointsData)
			if (self.pathparts.length == 0) return result;
			var nseg = new Segment(self.pathparts[0].start,  0);
			nseg.parts = self.pathparts;
	//		Exporter.pc.partsToPath(Exporter.pc.tstsvg, self.pathparts,  "#aa77aa", "Path finder result " + n);
			nseg.reconnect()
			nseg.setcolor (color)
			result.push (nseg)
			let validparts = Exporter.pc.keepConnected (self.pointsData.parts);
			if (validparts.length == 0) return result;
			else return doAllParts (validparts)
		}
	}
		
/* 
	ProcessShape
	store each path self.pathparts as lists of parts
	call again processShape if there are still unprocessed parts 
*/
	processShape(pieces, doneShape){
		let self = this;
		this.pointsData = this.getData(pieces);	
		var lastcount = this.pointsData.parts.length;	
		let returnShape = function (){
			if (Exporter.pc && Exporter.pc.done) doneShape([])
			else  doneShape (self.pointsData.parts);
		}
		if (lastcount == 0) returnShape();
		else findPath(returnShape);
				
		function findPath(doNext) {	
			if (self.pointsData.parts.length == 0) {
				 doNext ();
				 return;
			}
			if (self.pointsData.parts.length > 1) self.getPath(self.pointsData);
			let result = Exporter.pc.keepConnected (self.pointsData.parts);
			self.pointsData = self.getData(result);
			if (self.pointsData.parts.length == lastcount) {
				doNext();
				return;
			}
			lastcount = self.pointsData.parts.length;	
			if (Exporter.pc && Exporter.pc.done) doNext();	
			else if ((Date.now() - deltatime0) < 1000) findPath(doNext);
			else {
				self.timeout = setTimeout(function (){findPath(doNext);}, 20);
			} 
		}
	}
	
	getPath(data){	
		let self = this;
		var doneIndexes = [];
		var counter = 0;
		var done = [];
		var flag  = false;
		while ((doneIndexes.length == 0) && (counter < data.parts.length)) {	
			try {
				counter = this.getSizeablePart(counter, data.parts);
				done = this.findEdge(data.parts, counter);
				if (done.length >  0) {
					var res = [];		
					for (var i = 0; i < done.length; i++) res.push(data.parts[done[i]])	
			 		if (isValid(res)){ 
			 			self.pathparts = self.pathparts.concat(res);
						doneIndexes = doneIndexes.concat(done)
			 		} 	
				}
			}
			catch (error) {warn(error)}
			counter++;
		}
		if (doneIndexes.length == 0) data.parts= [];
		else data.parts = self.deleteUsed(data.parts, doneIndexes)
		
		function isValid (parts) {		
			if (parts.length < 2) return false;	
		//	if (parts[0].start.diff(res[parts.length - 1].end).len() != 0 ) return false;	
			if (parts.length == 2) {
				if (!parts[0].size && !parts[1].size) return false; //2 lines
				var l1 = parts[0].len().trim(Geom.dp)
				var l2 = parts[1].len().trim(Geom.dp)
				if ((l1 * l2) < Geom.precision) return false; // too small to count
		//		if ((parts[0].type != parts[1].type) && ((l1-l2) < Geom.precision))  console.log ("not valid", l1 * l2)
				if ((parts[0].type != parts[1].type) && ((l1-l2) < Geom.precision)) return false; // drawn over each other
			} 
			return true;
		}
	}
			
	getSizeablePart (n, list){
		var max = 0;
		var lastn =  n;
		while (n < list.length){
			 var first = list[n];
			 let size = Math.max (first.end.diff(first.start).len(), first.size ? first.size : 0);
			 if (size > max) {
					 max = size;
					 lastn = n;
			 }
			 if (size > 0.1) return n;
			 n++
		 }
		return lastn
	}
			
	getPoints (res) {
		var pts = []
		for (let i = 0; i < res.length; i++){	
			var p = res[i]
			if (!p) continue
			var partpts = p.getPoints()
			for (let j = 0; j < partpts.length; j++) 	pts.push({index: i, pt: partpts[j]})
		}
		return pts
	}

	findEdge (list, i) {
	//	console.log ("FindEdge", list.length, i )
		if (list.length < 2) return [];
		var res = []
		var done = []
		var data = {part: list[i], index: i}
		if (!data) return done;
		var startat = data.part.start
		var done = [];
		var anchors = []
		var n = 0;
		while (true){			
			var prev = data.part	
			var	i = data.index;
		//	if (!prev) break;
			var key = prev.start.toString(Geom.dp)
			var clue = prev.end.toString(Geom.dp)
			var pos = anchors.indexOf(clue) 
			if (pos < 0) {
				done.push (i)
				anchors.push(key)
			 	data = this.findNextSegment(i, list, done, done.length);	
			}
		 if ((pos > -1) || !data) { // already there or not a valid connection
		 // 	 console.log ("popFromStack")
				 data = this.popFromStack(list)
				 if (data) {
				 		done.splice(data.place)
 						anchors.splice(data.place)
 				 }	
 				 else throw {'index': i, 'done': done}
			}
			if (!data.part)	throw {'index': i, 'done': done}
			if (data.part.end.diff (startat).len() < Geom.precision){
				done.push (data.index)
				break;
			} 
	 	//	console.log ( " indexes", done)		
			n++
		}
	//	console.log ( "final indexes", done, data)		
		return done;
	}

 popFromStack (list){
	 if (this.stack.length == 0) return null;
	 let place = this.stack.pop();
	 let indx = this.stack.pop();
	 let res = this.stack.pop();
	 indx++;
	 if (indx < res.length) {
		 this.stack.push(res)
		 this.stack.push(indx)
		 this.stack.push(place)
		 var pos = res[indx]	
		 return {place: place, part: list[pos], index: pos }
	 }
	 else return this.popFromStack(list) 
 }	
	
	findNextSegment (indx, list, used,  pos){
	//	console.log ('findNextSegment', indx)
		let res = this.findChoices(indx, list, used);
		if (res.length == 0) return null;
		var obj = {part: list[res[0]], index: res[0]}			
		this.stack.push(res)
		this.stack.push(0)
		this.stack.push(pos)
		return obj;
	}
	
	findChoices (indx, list, used) {
		var prev = list[indx];
		var res  = []
		let str = prev.end.toString(Geom.dp)
		let choices = this.pointsData["heads"][str];
		if (!choices) {
			let aux = this.pointsData["tails"][str];
			let result = [];	
			if (!aux) return res;
			let ends = aux.concat();
			delete this.pointsData["tails"][str];
			for (let i = 0; i < ends.length; i++){
				let pos = ends[i];
				if (result.indexOf(pos) > -1) continue;
				let p = list[pos];
				unregister (this.pointsData["heads"], p.start, pos)		
				unregister (this.pointsData["tails"], p.end, pos)				
				p.flip();		
				register(this.pointsData["heads"], p.start, pos)			
				register(this.pointsData["tails"], p.end, pos)
				result.push(pos)	
			}		
			choices = result.length >  0 ? result : null;
		}
		if (!choices) return res;
		for (let i = 0; i < choices.length; i++) {
			var n = choices[i]
			if (n == indx) continue
			if (used.indexOf(n) > -1) continue
	//		if (!list[n]) continue;
			res.push(n)
		}
		res = res.sort(function(a, b) {		
	//		if (!list[a]|| !list[b]) return 0
			return list[a].len()  - list[b].len()
		});
		return res.reverse();
	}

	deleteUsed(parts, done){
		var result = [];
		for (let j=0; j < done.length; j++) parts[done[j]] = undefined
		for (let i=0; i < parts.length; i++) {
			if (parts[i])	result.push (parts[i])
		}
		return result;
	}

	getData(pieces){
		var starts = {};
		var ends = {} 
		let result = [];
		for (let i = 0; i < pieces.length; i++){	
			let p = pieces[i]
			if (!p) continue;
			register(starts, p.start, i)
			register(ends, p.end, i)
			result.push (p)
		}	
		var pts = this.getPoints(result)
		return {parts: result, heads: starts, tails: ends, points: pts}
	}
	
	
}


