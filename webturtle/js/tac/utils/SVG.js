/* © 2018 Playful Invention Company - Paula Bontá */

/////////////////////////
//
//Save
//
/////////////////////////

SVG = function() {};
SVG.svgns =  "http://www.w3.org/2000/svg";

///////////////////////////////
// SVG Element Creation Tools
///////////////////////////////

SVG.top = function (w,h){
	var el = document.createElementNS(SVG.svgns,"svg");
	el.setAttributeNS(null, 'version', 1.1);
	el.setAttribute("xml:space","preserve");
	el.setAttribute('xmlns:xlink',"http://www.w3.org/1999/xlink");
	el.setAttributeNS(null,'width',w);
	el.setAttributeNS(null, 'height', h);
	el.setAttributeNS(null, 'viewBox',  '0 0 '+ w +' '+ h);
	el.setAttributeNS(null,'x',"0px");
	el.setAttributeNS(null,'y',"0px");
	el.style ="enable-background:new 0 0 " + w +' '+ h+";";
	return el;
}

SVG.addChild = function (div, type, attr){
	if (!attr) attr = new Object();
	var	shape = document.createElementNS(SVG.svgns, type);
	for (var val in attr) shape.setAttribute(val, attr[val]);
	if (div) div.appendChild(shape);
	return shape;
}

///////////////////////
// Other Tools
//////////////////////

SVG.getClone = function(svg){return  SVG.toObject(SVG.toString (svg));}

SVG.toObject= function(str){
	str.replace(/>\s*</g,'><');
	var xmlDoc = (new DOMParser()).parseFromString(str, "text/xml");
	var node = document.importNode(xmlDoc.documentElement, true);
	return node;
}
	
SVG.toString = function (svg){
	var str ='<?xml version="1.0" encoding="utf-8"?>\n'
	str += new XMLSerializer().serializeToString(svg);			
	return str.replace("&amp;","&");
}

SVG.getRect = function (svg){
 let list  = svg.getAttribute("viewBox").split (" ");
 return new Rectangle (parseInt (list [0]), parseInt (list [1]),parseInt (list [2]),parseInt (list [3]))
}

////////////
// Absolute commands
///////////////////

SVG.endp;
SVG.startp;
SVG.lastcxy;

SVG.getAbsoluteCommands=function(list){
	var res = [];
	for (var i =0 ; i < list.length; i++)res.push(SVG.getAbsoluteCommand(list[i]));
	return res;
}

 SVG.getAbsoluteCommand=function(cmd){
	var key = cmd[0];
	return SVG.dispatchAbsouluteCmd[key](cmd);
}

// moves
 SVG.setAbsoluteMove=function(cmd){
	SVG.endp = new Vector(cmd[1], cmd[2]);
	SVG.startp = SVG.endp;
	SVG.lastcxy = SVG.endp;
	return cmd;
}

SVG.setRelativeMove=function(cmd){ 
	SVG.endp =  SVG.endp.sum(new Vector(cmd[1],cmd[2]));
	SVG.startp = SVG.endp;
	return ["M", SVG.endp.x, SVG.endp.y];
}

// lines
 SVG.setClosePath=function(cmd){
 	SVG.endp =SVG.startp;
 	return cmd;
}

 SVG.setAbsoluteLine=function(cmd){
 	SVG.endp = new Vector(cmd[1],cmd[2])
  return cmd;
}

 SVG.setRelativeLine=function(cmd){
	SVG.endp = SVG.endp.sum(new Vector(cmd[1],cmd[2])); 
 	return ["L", SVG.endp.x,  SVG.endp.y];
}

SVG.setAbsoluteArc=function(cmd){
 	SVG.endp = new Vector(cmd[6],cmd[7])
  return cmd;
}

SVG.setRelativeArc=function(cmd){
	SVG.endp = SVG.endp.sum(new Vector(cmd[6],cmd[7]))
 	var newcmd = cmd.concat();
 	newcmd[0] = "A";
 	newcmd[6] = SVG.endp.x;
 	newcmd[7] = SVG.endp.y;
  return newcmd;
}

//////////////////////////////////////
// Dispatch tables
//////////////////////////////////////

SVG.dispatchAbsouluteCmd = {'A': SVG.setAbsoluteArc,'a': SVG.setRelativeArc,'M': SVG.setAbsoluteMove, "m": SVG.setRelativeMove, 
	"L": SVG.setAbsoluteLine, "l": SVG.setRelativeLine,	"Z": SVG.setClosePath, "z": SVG.setClosePath};
