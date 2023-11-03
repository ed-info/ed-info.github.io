// Pt 2021 - MIT-License

var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');

var canvasWidth = 0;
var canvasHeight = 0;
    
var startWidth = 0.3*$(window).width();
var maxKoord = $(window).width();     

var farbep5SetupDraw = "#ed225d";
var farbep5Funktionen = "#ed225d";
var farbep5Helfer = "#da5a73";
var farbeGrundformen = "#e67e22";
var farbeVarGrundformen = "#e67e22";
var farbeAussehen = "#95a5a6";
var farbep5Werte = "#2f7db7";
var farbep5Text = "#5ba58c";
var farbeObjekte = "#d2b48c";
var farbeKommentar = "#073763";
var farbeTurtle = "#006400";
var farbeMathe = "#5b67a5";

var workspace = Blockly.inject(blocklyDiv, {
            collapse: true,
            comments: true,
            css: true,
            disable: false,
            grid: {
                spacing: 20,
                length: 1,
                colour: '#888',
                snap: true
            },   
            horizontalLayout: false,            
            maxBlocks: Infinity,
            media: 'media/',
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            oneBasedIndex: true,
            readOnly: false,
            rtl: false,
            scrollbars: true,
            toolbox: p5jsBlocklyEditorToolbox,            
            toolboxPosition: 'start',            
            trashcan: true,
            sounds: true,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.02
            } 
        });

Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);

var onresize = function(e) {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    let p5Hoehe = canvasHeight+100;
    if (blocklyArea.offsetHeight > p5Hoehe) {
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    } else {
      blocklyDiv.style.height = p5Hoehe + 'px';
    } 
    Blockly.svgResize(workspace);
};

let splitInstance = Split(['#split-0', '#split-1'], {
        minSize: [0, 10],
        snapOffset: 80,
        gutterSize: 20,
    })

let observer = new ResizeObserver(function(mutations) {
    onresize();
    Blockly.svgResize(workspace);
});

let child = document.getElementById('split-0');
observer.observe(child, { attributes: true });

window.addEventListener('resize', onresize, false);
onresize();
Blockly.svgResize(workspace);

var myp5;

function updateP5() {
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    var myblocks = Blockly.mainWorkspace.getAllBlocks()
    for(var i = 0; i < myblocks.length; i++){
      if(myblocks[i].type == 'setup'){
        canvasWidth = myblocks[i].getFieldValue('canvasBreite');
        canvasHeight = myblocks[i].getFieldValue('canvasHoehe');
      }
    }
    document.getElementById('p5jsContainer').style.width = canvasWidth;
    document.getElementById('p5jsContainer').style.height = canvasHeight;    
    document.getElementById('p5jsContainer').setAttribute("style", "width: " + canvasWidth + "px; height: " + canvasHeight + "px;");
    document.getElementById('p5jsContainer').innerHTML = "";
    if (myp5) {
      myp5.remove();
    }
    try {
        var sketch = new Function("p5sketch", code);
        myp5 = new p5(sketch, 'p5jsContainer'); 
    } catch (e) { 
        $('#loggerDiv').removeClass('alert alert-light').addClass('alert alert-danger');
        $("#loggerDiv").css("max-width", "400px");
        let text01 = '<strong>Im Code gibt es einen Fehler:<\/strong><br><br>' + e.toString() + '<hr>Mit \"rechter Maustaste - Rückgängig\" können die letzten Änderungen zurückgenommen werden.'
        document.getElementById('loggerDiv').innerHTML = text01;        
    }
    let linksProzent = (canvasWidth+25)/$(window).width() * 100;
    let rechtsProzent = 100-linksProzent;
    splitInstance.setSizes([linksProzent, rechtsProzent]);
    onresize();
    Blockly.svgResize(workspace);
}

function viewFlems() {
    let codeInstance = Blockly.JavaScript.workspaceToCode(workspace);
    let code = codeInstance.replaceAll("p5sketch.", "");
    let codeToSave = code.replaceAll("p5sketch, ", "");
    //dreifache neue Zeile ersetzen
    codeToSave = codeToSave.replace(/\n\s*\n\s*\n/g, '\n\n');
    if(!codeToSave.includes('new p5();')) {
      codeToSave = codeToSave + '\nnew p5();';
    }    
    window.localStorage.setItem("codeLocalStorage", codeToSave);  
    window.open("p5jsflems/index.html",'_blank');
}

function viewCode() {
    let codeInstance = Blockly.JavaScript.workspaceToCode(workspace);
    let code1 = codeInstance.replaceAll("p5sketch.", "");    
    let code = code1.replaceAll("p5sketch, ", "");
    //dreifache neue Zeile ersetzen
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');   
    let codeDiv = document.getElementById('codeDiv');
    let htmlImport = Prism.highlight(code, Prism.languages.javascript, 'javascript');
    codeDiv.innerHTML = htmlImport;
}

function p5Init() {
    Blockly.mainWorkspace.clear();
    let urlString = window.location.hash;
    if (urlString.length > 0) {
        try {
            let triggerCode = urlString.substring(0, 4);
            if (triggerCode == "#LZ=") {
              let comressedCode = urlString.substring(4);
              let string = LZString.decompressFromEncodedURIComponent(comressedCode);
              let xml = Blockly.Xml.textToDom(string);
              Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);              
            }
            if (triggerCode == "#PN=") {
              let programmName = urlString.substring(4);
              loadBeispielProgramm('programme/' + programmName + '.p5xml');
            }
        }
        catch {
           Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);
        }
    } else {
        Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);
    }
    let p5jsBreite = 0.3*$(window).width();
    let breite1 = "width: " + p5jsBreite + "px";
    let breite2 = p5jsBreite + "px";
    document.getElementById('p5jsContainer').setAttribute("style", breite1);
    document.getElementById('p5jsContainer').style.width = breite2;
    onresize();
    viewCode();
    updateP5();
    loadTutorial('tutorials/inhalt.html');
}

document.getElementById('p5Run').onclick = function() {
    $('#loggerDiv').removeClass('alert alert-danger').addClass('alert alert-light');
    document.getElementById('loggerDiv').innerHTML = '';
    updateP5();
};

let modalConfirm = function(callback){
  $("#p5loeschen").on("click", function(){
    $("#programmLoeschenModal").modal('show');
  });
  $("#btnLoeschJa").on("click", function(){
    callback(true);
    $("#programmLoeschenModal").modal('hide');
  });
  $("#btnLoeschNein").on("click", function(){
    callback(false);
    $("#programmLoeschenModal").modal('hide');
  });
};
modalConfirm(function(confirm){
  if(confirm){
    $('#loggerDiv').removeClass('alert alert-danger').addClass('alert alert-light');
    document.getElementById('loggerDiv').innerHTML = '';    
    myp5.remove();
    p5Init();
  }else{
  }
});

document.getElementById('jsAnzeigen').onclick = function() {
    viewCode();
};

document.getElementById('flemsAnzeigen').onclick = function() {
    viewFlems();
};
