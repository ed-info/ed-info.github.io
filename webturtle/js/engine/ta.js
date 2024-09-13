var version = 'WebTurtleArt v3f';

var defs;
var palette;
var events;
var scripts;
var editfield;
var turtle;
var runtime;
var project;
var random;
var pngscraper;
var toolmode;
var supportsPassive = false;
var scriptsSize = {w: 920*2, h: 736*2}
var shifKeyDown = false;

window.onload = setup;

function setup(){
	try {
		addEventListener("test", null, { get passive() { supportsPassive = true; } });
	} catch(e) {}
	window.addEventListener('resize',resize);
	document.body.ondragover =  function (e) {self.allowDrop(e)}; 
	document.body.ondrop = function (e) {self.handleDrop(e)};
	let urlvars = getUrlVars();
	defs = new Defs();
	palette = new Palette();
	events = new Events();
	scripts = new Scripts();
	editfield = new EditField();
	turtle = new Turtle();
	runtime = new Runtime();
	project = new Project();
	random = new Random();
	pngscraper = new PngScraper();
	if(urlvars["dpi"]) turtle.dpi=urlvars["dpi"];
	defs.preloadTabImages();
	defs.preloadImages(setup1);
	window.onkeydown = UI.handleSpecialKeys;
	window.onkeyup = UI.handleSpecialKeysUp;
	savebutton.onclick = UI.save;
	togglebutton.onclick = UI.toggleBlocks;
	openmenu.onclick = UI.toggleMenu;	
	playbutton.onclick = UI.runOrStop;
	UI.fastmode = urlvars["mode"] == "fast";
	UI.digitalfab = true; //!urlvars["fab"] ? false : eval (urlvars["fab"]);
	gn("zoomin")[events.dispatch["start"]] = UI.zoomin;
  gn("zoomout")[events.dispatch["start"]] = UI.zoomout;
	gn("zoomreset")[events.dispatch["start"]] = UI.zoomreset;
	scripts.createScrollbars();

	window.onbeforeunload = function (e) {
		localStorage.setItem("webturtleart", project.projectString());
		return true;
		 var message = "Changes you made may not be saved.",
		 e = e || window.event;
		 
		 // For IE and Firefox
		 if (e) {
			 e.returnValue = message;
		 }
		 // For Safari
		 return true;
	
	 };
}

function setup1(){
	defs.defineBlocks();
	editfield.setup();
	turtle.setup();
	events.setup(window);
	resize();
	palette.setup();
	if (UI.digitalfab) UI.addOnPlayBlock(); // Exploratorium request
}

function mousedown(e){
	if (scripts.iframe) {
		scripts.closeHelp();
		events.clearEvents();
	}
	UI.closeDropdown();
	Exporter.closeDialog();
	Exporter.closeDialogBox();
	footer.style.visibility = 'hidden';
	editfield.editDone();
}

function resize (e){
	var doch = getDocumentHeight();
	var docw = getDocumentWidth();
	var cnvh = Math.round(doch-10);
	var cnvw = Math.round(cnvh*5/4);
	var dw = 225 + 46 +  10;
	if((cnvw+dw)>docw){
		cnvw = docw-dw;
		cnvh = Math.round(cnvw*4/5);
	}
	var top =  Math.floor ((doch - cnvh)/2-2);
	var frameheight =  Math.round(cnvh+2);
	frame.style.width =  Math.round(cnvw+dw - 10)+'px';
	frame.style.height = frameheight+'px';
	frame.style.left =  Math.floor ((docw - (cnvw+dw - 10)) / 2) +'px';
	frame.style.top = top +'px';	
  cnvframe.style.width = cnvw+'px';
  canvas.style.width = cnvw+'px';
  cnvframe.style.height = cnvh+'px';
  canvas.style.height = cnvh+'px';
  palframe.style.height = cnvh +'px';
  turtle.move();
  var pos  = ((doch - cnvh)/2) +  cnvh 
  savebutton.style.top = palframe.offsetTop+palframe.offsetHeight-52+'px';
  openmenu.style.top =  palframe.offsetTop+palframe.offsetHeight-52+'px';
  togglebutton.style.top =  (Math.floor (frameheight / 2)  - 23) +'px';
  if (gn('toolbarmenu')) gn('toolbarmenu').style.top = (togglebutton.offsetTop - 195) + "px";
  footer.style.top = (cnvframe.offsetHeight-footer.offsetHeight*1.5)+'px'
  footer.style.left = ((cnvframe.offsetWidth-footer.offsetWidth)/2)+'px'
  scripts.setScrollbars()
  if (palette && palette.selected!='') palette.open(palette.selected);
}

function allowDrop (evt) { 
	evt.preventDefault(); 
	evt.stopPropagation();
}

function handleDrop(evt){
	evt.preventDefault(); 
	evt.stopPropagation();
	scripts.showblocks()
	var str = evt.dataTransfer.getData('text/plain');
	mousedown(evt)
	if(str.length>0) handleDropText(evt,str);
	else handleDropFile(evt);
}

function handleDropText(evt,str){
	var x = Math.floor((evt.clientX-cnvframe.offsetLeft-50)/scripts.zoom)-scripts.cnvx;
	var y = Math.floor((evt.clientY-cnvframe.offsetTop-30)/scripts.zoom)-scripts.cnvy;
	project.dropText(str,x,y);
}

document.getElementById('fileInput');
document.addEventListener('change', function (event) {
                let file = event.target.files[0];
				loadFile(file);
});

function handleDropFile (evt) { 
	evt.preventDefault(); 
	if (evt.stopPropagation) evt.stopPropagation();
	else evt.cancelBubble = true;
	var file = evt.dataTransfer.files[0];
	loadFile(file);
}	

function loadFile(file) {
	console.log("Load File");
	if(file.type=='text/plain'){
		var reader = new FileReader();
	  reader.onload = readstack;
	  reader.readAsText(file);
	  
	} else if(file.type=='image/png'){
		var reader = new FileReader();
	  reader.onload = readimage;
		reader.readAsArrayBuffer(file);
	} 

  function readstack(){
  	var str = reader.result;
		var x = Math.floor(evt.x-cnvframe.offsetLeft);
		var y = Math.floor(evt.y-cnvframe.offsetTop);
		project.dropText(str, Math.max (10, Math.min (cnvframe.offsetWidth - 100, x)), Math.max (10, Math.min (cnvframe.offsetHeight - 100, y)));
  }

  function readimage(){
		var data = Array.from(new Uint8Array(reader.result));
		pngscraper.scrape(data);
  	var dataurl = 'data:image/png;base64,'+base64(data);
  	turtle.loadpng(dataurl, file.name);
  }

	function base64(data) {
    var str = '';
    for (var i=0; i<data.length; i++) str+=String.fromCharCode(data[i]);
    return btoa(str);
	}
}

function upload(gallery){
	var url = getUrlVars()["ulurl"];
	var s = project.projectString();
	ImageData.setImageData(turtle.ctx, s);
	var str = canvas.toDataURL().split(',')[1];
	var req = new XMLHttpRequest();
	req.onreadystatechange=function(){next();};
	var url = url+'/post.php?gallery='+gallery;
	req.open('PUT', url, true);
	req.setRequestHeader("Content-Type", 'text/plain');
	req.send(str);

	function next(){
		if (req.readyState!=4) return;
		if (req.status!=200) return;
		console.log('sent');
	}
}

function mlupload(gallery){
	var url = getUrlVars()["ulurl"];
	var path = gallery+'/'+project.name+'.png';
	var s = project.projectString();
	ImageData.setImageData(turtle.ctx, s);
	var dataurl = canvas.toDataURL();
	var str = dataurl.split(',')[1];
 	ws = new WebSocket(url);
	ws.onmessage = gotresponse;
	ws.onopen = function(){
		ws.send('0:putimg:'+path+':'+str);
		makeThumb(dataurl);
	}

  function gotresponse(m){
  	var resp = m.data.split(':');
  	if(resp[0]!=0) return;
  	if(resp[1]=='already exists') console.log(project.name,'already exists.');
  	else if (resp[1]=='error') console.log('error uploading',project.name);
  	else console.log(project.name,'uploaded.');
  }

  function makeThumb(dataurl){
	var thbpath = gallery+'-th/'+project.name+'.png';
  	var img = document.createElement('img');
  	var cnv1 = document.createElement('canvas');
  	cnv1.width = 600;
  	cnv1.height = 480;
  	var cnv2 = document.createElement('canvas');
  	cnv2.width = 300;
  	cnv2.height = 240;
  	img.onload = next;
  	img.src = dataurl

  	function next(){
			var ctx1 = cnv1.getContext('2d')
			var s = 600/img.naturalWidth;
			ctx1.scale(s,s);
			ctx1.drawImage(img, 0, 0);
			var ctx2 = cnv2.getContext('2d')
			ctx2.scale(.5,.5);
			ctx2.drawImage(cnv1, 0, 0);
			ImageData.setImageData(ctx2,'[thumb |'+path+'|]');
			var str = cnv2.toDataURL().split(',')[1];
			ws.send('1:putimg:'+thbpath+':'+str);
  	}

  }
}


