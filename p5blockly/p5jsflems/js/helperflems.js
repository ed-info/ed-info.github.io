// Pt 2021 - MIT-License

function flemsInit() {
  let dataImport1 = '';  
  let urlString = window.location.hash;
  if (urlString.length > 0) {
      try {
        let triggerCode = urlString.substring(0, 4);
        if (triggerCode == "#LZ=") {
          let comressedCode = urlString.substring(4);
          dataImport1 = LZString.decompressFromEncodedURIComponent(comressedCode);
          flemsLoad(dataImport1, '00');             
        }
        if (triggerCode == "#LN=") {
          let libsUsed = urlString.substring(4, 6);          
          let comressedCode = urlString.substring(7);
          dataImport1 = LZString.decompressFromEncodedURIComponent(comressedCode);
          flemsLoad(dataImport1, libsUsed);             
        }        
        //Format: #PN=01&dateiname mit 01 = geladene bibliotheken
        if (triggerCode == "#PN=") {
          let libsUsed = urlString.substring(4, 6);
          let programmName = urlString.substring(7);
          loadBeispielProgramm('programme/' + programmName + '.p5txt', libsUsed);
        }          
      }
      catch {
        jQuery.get('p5sketch/sketch.js', function(geladen) {
          dataImport1 = geladen;
          flemsLoad(dataImport1, '00');
        });
      }
  } else {
    dataImport1 = window.localStorage.getItem('codeLocalStorage');
    if (dataImport1 != null) {
      if (dataImport1.length > 0) {
        try {
            flemsLoad(dataImport1, '00');
        }
        catch {
          jQuery.get('p5sketch/sketch.js', function(geladen) {
            dataImport1 = geladen;
            flemsLoad(dataImport1, '00');
          });
        }
      }
    } else {
      jQuery.get('p5sketch/sketch.js', function(geladen) {
        dataImport1 = geladen;
        flemsLoad(dataImport1, '00');
      });
    }
  }
}

function flemsLoad(data1, libs) {
    let htmlURL = 'p5sketch/p5_' + libs + '.html';
    jQuery.get(htmlURL, function(data2) {
      Flems(document.getElementById('flems'), {
        "middle": 50,
        "selected": ".js",
        "color": "rgb(38,50,56)",
        "theme": "material",
        "layout": "auto",
        "resizeable": true,
        "editable": true,
        "toolbar": true,
        "fileTabs": true,
        "linkTabs": true,
        "shareButton": false,
        "reloadButton": true,
        "console": "collapsed",
        "autoReload": true,
        "autoReloadDelay": 400,
        "autoFocus": false,
        "autoHeight": false,
        "scroll": [
          0,
          0
        ],  
        "files": [
          {
            "name": "p5sketch.js",
            "content": data1,
          },    
          {
            "name": "index.html",
            "content": data2,
          }
        ]
      });
    }); 
}

document.getElementById('p5saveDateiname').value = 'FlemsCode';

document.getElementById('p5Save').onclick = function() {
  try {
    var cmInstance = document.querySelector(".CodeMirror").CodeMirror;
    var codeToSave = cmInstance.getValue();
    var file = new Blob([codeToSave], {type: "text/plain;charset=utf-8"});
    var link = document.createElement('a');
    var url = URL.createObjectURL(file);
    link.href = url;
    link.download = document.getElementById('p5saveDateiname').value + '.p5txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch { }
};

const fileSelector = document.getElementById('p5Dateiwahl');
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  let file = fileList[0];
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (event) {
    let dataImport1 = event.target.result;
    flemsLoad(dataImport1, '00');
    document.getElementById('p5Dateiwahl').value = null; 
  }
});

var hideMain = function() {
  try {
    document.getElementsByTagName('canvas')[0].style.display = 'none';
  } catch { }
}

window.onload = function() {
  flemsInit();
  loadTutorial('hilfe/inhalt.html');
  setTimeout(hideMain, 500);
}

document.getElementById('URLSave').onclick = function() {
  try {
    var cmInstance = document.querySelector(".CodeMirror").CodeMirror;
    var codeToSave = cmInstance.getValue();
    let compressed = LZString.compressToEncodedURIComponent(codeToSave);
    let URL_text = "#LZ=" + compressed;
    let URLDiv = document.getElementById('URLDiv');
    URLDiv.innerHTML = URL_text;
  } catch { }  
};

async function loadTutorial(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    $("#divTutorials").html(data);
  } catch (err) { }
}

document.getElementById('backToContent').onclick = function() {
  loadTutorial('hilfe/inhalt.html');
};

async function loadBeispielProgramm(url, libs) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    flemsLoad(data, libs);
  } catch (err) { }
}
