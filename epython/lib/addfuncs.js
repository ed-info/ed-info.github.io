// added functions -------------------------
var toolsVisible = false;
        $(function () {
            $('#loading').hide();
            $('#holder').show();
            PythonIDE.init('normal');
        });
        
		function loadAsset() {
				
			const file = document.getElementById("asset-file").files[0];
			if (file.name.match(/\.(json)$/)) {				
				const reader = new FileReader();
				reader.addEventListener(
					"load",
					() => {
		
					PythonIDE.files['assets.json'] = reader.result;
					PythonIDE.editor.refresh();	
				},
				false,
				);
				if (file) {
					reader.readAsText(file);
				}
			}
		  else {
					PythonIDE.showHint("Непідтримуваний формат файлу");	
					
			}
				
		}
				
	function getFile() {
		const file = document.getElementById("choose-file").files[0];
		const reader = new FileReader();
		reader.addEventListener(
			"load",
			() => {
		// convert image file to base64 string
			localStorage.setItem(file.name,reader.result);
			},
			false,
		);

		if (file) {
			reader.readAsDataURL(file);
		}
	}

    let btnRun = document.querySelector("#btn_run");
    function runSketch(event) {
        runit();
    }
    btnRun.addEventListener('click', runSketch);

    function runit() { 
		document.querySelector("#myChart").style.display = "none";
		Sk.canvas = "myChart";
		Sk.p5Sketch = "p5Sketch";
        const cnvs = [...document.querySelectorAll(`[id^="defaultCanvas"]`),];
        cnvs.forEach((cnv) => {
            //cnv.style = "display:none";
            cnv.remove();
        });
    } 

function getImageData(url, callback) {
		  var xhr = new XMLHttpRequest();
		  xhr.onload = function() {
		    var reader = new FileReader();
		    reader.onloadend = function() {
		      callback(reader.result);
		    }
		    reader.readAsDataURL(xhr.response);
		  };
		  xhr.open('GET', url);
		  xhr.responseType = 'blob';
		  xhr.send();
		}
$(document).ready(function(){
  function showAssetManager(a) {
	  $("#save").dialog("close");
	  assetType='images';
	    	var html = '<style>.asset_img{width:50px;float:left;margin-right:5px;} .asset{display:inline-block;background-color:#FF9;padding:5px;margin:5px;border-radius:10px;border: solid 1px #000;}</style>У вебверсії Pygame Zero зображення та звуки перед використання необхідно попередньо завантажити до середовища програмування!<br>';
	    		    	
	    	html += '<fieldset id="pgz_assets_images"><legend>Зображення</legend>';
	    	html += '<p>Перед використанням оберіть та завантажте потрібні файли зображень. </p>';
	    	html += '<p>Підтримувані типи: .jpg, .png та .gif. </p><br>';	    	
	    	html +=  '<div>Зображення: <input type="file" id="choose-file" name="choose-file" onchange="getFile()"/><button class="btn_asset" id="btn_asset_add_image">Додати зображення</button></div>';
	    	switch(assetType) {
	    		case 'images':
	    			if(assets.images) {
	    				for(var name in assets.images) {							
	    					var image = assets.images[name];
	    					html += '<div class="asset" id="asset_image_' + name + '"><img class="asset_img" src="' + image.src + '">';
	    					html += '<div><b>' + name + '</b></div>';
	    					var src = image.src;
	    					if(src.match(/data:image/)) {
	    						src="base64";
	    					} else {
	    						getImageData(src, function(data) {
	    							
	    						})
	    					};
	    					html += '<button id="btn_asset_delete_image_' + name + '" class="btn_trash"><i class="fa fa-trash"></i></button>'
	    					html += '</div>';
	    				}
	    			}
	    		break;
	    		case 'sounds':
	    			if(assets.sounds) {
	    				for(var name in assets.sounds) {
	    					var sound = assets.sounds[name];
	    					html += '<div class="asset" id="asset_sound_' + name + '"><audio class="asset_snd" controls src="' + sound.src + '"></audio>';
	    					html += '<div><b>' + name + '</b></div>';
	    					html += '<div class="btn_trash"></div><button id="btn_asset_delete_sound_' + name + '><i class="fa fa-trash"></i></button></div>'
	    					html += '</div>';
	    				}
	    			}
	    		break;
	    	}
	    	html += '<br><button id="btn_AssetManager_ok" class="btn_asset"><i class="fa fa-check"></i> Гаразд</button>';
	    	html += '<button id="btn_AssetManager_cancel" class="btn_asset"><i class="fa fa-times"></i> Скасувати</button>';
	    	
	    	html += '<br><br><div>Інформація про використані ресурси (зображення та звуки) зберігається у файлі assets.json.<br><button id="btnAssetSave"> Зберегти ресурси</button>';
	    	html += '<p> Використати ресурси </p><input type="file" id="asset-file" name="asset-file" onchange="loadAsset()"/><button id="btnAssetLoad"> Використати</button></div>';
	    	html += '</div>';
	    	html += '</fieldset>';
  $("#PGZAssetManager").empty();   	
  $("#PGZAssetManager").append(html);
  }

$('#btn_PGZ').button().click(function() {	
   	    	$('#PGZAssetManager').dialog( {
	    		width: window.innerWidth * .8,
	    		height: window.innerHeight * .8  });  
	if(PythonIDE.files['assets.json']) {
				assets = JSON.parse(PythonIDE.files['assets.json']);
				
			}
		showAssetManager(false);	
	});
  
$(document).on('click','#btnAssetSave', function() { 			 	
			 if(PythonIDE.files['assets.json']) {				
					var blob = new Blob([PythonIDE.files['assets.json']], {type : "text/plain", endings: "transparent"});
					saveAs(blob, 'assets.json');
				}	
  });

$(document).on('click','#btnAssetLoad', function() {  
			 if(PythonIDE.files['assets.json']) {
				assets = JSON.parse(PythonIDE.files['assets.json']);
				PythonIDE.updateFileTabs();
				showAssetManager(false);
			 }
 });
$(document).on('click','#btn_AssetManager_ok', function() { 
	PythonIDE.files['assets.json'] = JSON.stringify(assets, null, 2);
	PythonIDE.updateFileTabs();
	$('#PGZAssetManager').dialog('close');
 });
$(document).on('click','#btn_asset_add_image', function() {	
	if(!assets.images) {
    							assets.images = {};
    						}    						
    						var url = document.getElementById("choose-file").files[0].name;
    						var imageData = localStorage.getItem(url)   						
							var name = url.split(".")[0];							
							name = name.toLowerCase().replaceAll(" ","_");
							assets.images[name] = {src:imageData};	
		    				showAssetManager(false);
		    				
 }); 
 
$(document).on('click','#btn_AssetManager_cancel', function() { 
	 $('#PGZAssetManager').dialog("close");
 }); 

$(document).on('click','.btn_trash', function(e) {  
    var id = e.currentTarget.id.slice(0, 23);	
    var parts = id.split("_");				
    var name = e.currentTarget.id.slice(23);
    var type = parts[3];
    $('#asset_' + type + '_' + name).remove();
    delete assets[type + "s"][name];
});	  	
	    	
});


