
<!--
//browser sniffer script from www.dynamicdrive.com

var exclude=1;
var agt=navigator.userAgent.toLowerCase();
var win=0;var mac=0;var lin=1;var winxp=0;var winvista=0;
if(agt.indexOf('win')!=-1){win=1;lin=0;}
if(agt.indexOf('mac')!=-1){mac=1;lin=0;}
if(agt.indexOf('windows nt 5.1')!=-1){winxp=1;}
if(agt.indexOf('windows nt 6.0')!=-1){winvista=1;}
var lnx=0;if(lin){lnx=1;}
var ice=0;
var ie=0;var ie4=0;var ie5=0;var ie6=0;var com=0;var dcm;
var op5=0;var op6=0;var op7=0;
var ns4=0;var ns6=0;var ns7=0;var mz7=0;var kde=0;var saf=0;
var ff=0;
if(typeof navigator.vendor!="undefined" && navigator.vendor=="KDE"){
	var thisKDE=agt;
	var splitKDE=thisKDE.split("konqueror/");
	var aKDE=splitKDE[1].split("; ");
	var KDEn=parseFloat(aKDE[0]);
	if(KDEn>=2.2){
		kde=1;
		ns6=1;
		exclude=0;
		}
	}
else if(agt.indexOf('webtv')!=-1){exclude=1;}
else if(typeof window.opera!="undefined"){
	exclude=0;
	if(agt.indexOf("opera/5")!=-1||agt.indexOf("opera 5")!=-1){op5=1;}
	if(agt.indexOf("opera/6")!=-1||agt.indexOf("opera 6")!=-1){op6=1;}
	if(agt.indexOf("opera/7")!=-1||agt.indexOf("opera 7")!=-1){op7=1;}
	}
else if(typeof document.all!="undefined"&&!kde){
	exclude=0;
	ie=1;
	if(typeof document.getElementById!="undefined"){
		ie5=1;
		if(agt.indexOf("msie 6")!=-1){
			ie6=1;
			dcm=document.compatMode;
			if(dcm!="BackCompat"){com=1;}
			}
		}
	else{ie4=1;}
	}
else if(typeof document.getElementById!="undefined"){
	exclude=0;
	if(agt.indexOf("netscape/6")!=-1||agt.indexOf("netscape6")!=-1){ns6=1;}
	else if(agt.indexOf("netscape/7")!=-1||agt.indexOf("netscape7")!=-1){ns6=1;ns7=1;}
	else if(agt.indexOf("gecko")!=-1){ns6=1;mz7=1;ff=1;}
	if(agt.indexOf("safari")!=-1 || (typeof document.childNodes!="undefined" && typeof document.all=="undefined" && typeof navigator.taintEnabled=="undefined")){mz7=0;ns6=1;saf=1;}
	}
else if((agt.indexOf('mozilla')!=-1)&&(parseInt(navigator.appVersion)>=4)){
	exclude=0;
	ns4=1;
	if(typeof navigator.mimeTypes['*']=="undefined"){
		exclude=1;
		ns4=0;
		}
	}
if(agt.indexOf('escape')!=-1){exclude=1;ns4=0;}
if(typeof navigator.__ice_version!="undefined"){exclude=1;ie4=0;}
//-->
