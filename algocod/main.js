const codeEditor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    theme: "pastel-on-dark",
    mode: "pseudocode",
    extraKeys: {
            "Tab": function(cm){
              cm.replaceSelection("   " , "end");
            }
           }
})
// Клавіатурні скорочення для вставлення мовних конструкцій
var mymap = {
	"Alt-Z": function(cm){codeEditor.doc.replaceSelection('якщо   то\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін якщо\n');},
	"Alt-S": function(cm){codeEditor.doc.replaceSelection('якщо   то\n\n'+" ".repeat(codeEditor.getCursor().ch)+'інакше\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін якщо\n');},
	"Alt-L": function(cm){codeEditor.doc.replaceSelection('для   від  до\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін для\n');},
	"Alt-G": function(cm){codeEditor.doc.replaceSelection('поки\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін поки\n');},
	"Alt-A": function(cm){codeEditor.doc.replaceSelection('функція\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін функція\n');},
	"Alt-F": function(cm){codeEditor.doc.replaceSelection('анімація\n\n'+" ".repeat(codeEditor.getCursor().ch)+'кін анімація\n');},
	"Alt-1": function(cm){codeEditor.doc.replaceSelection('лінія(');},
	"Alt-2": function(cm){codeEditor.doc.replaceSelection('прямокутник(');},
	"Alt-3": function(cm){codeEditor.doc.replaceSelection('трикутник(');},
	"Alt-4": function(cm){codeEditor.doc.replaceSelection('чотирикутник(');},
	"Alt-5": function(cm){codeEditor.doc.replaceSelection('заповнення(');},
	"Alt-6": function(cm){codeEditor.doc.replaceSelection('контур');},
	"Alt-7": function(cm){codeEditor.doc.replaceSelection('ламана\n'+" ".repeat(codeEditor.getCursor().ch)+'\tвершина(,)\n'+" ".repeat(codeEditor.getCursor().ch)+'\tвершина(,)\n'+" ".repeat(codeEditor.getCursor().ch)+'кін ламана\n');},	
	"Alt-8": function(cm){codeEditor.doc.replaceSelection('фігура\n'+" ".repeat(codeEditor.getCursor().ch)+'\tвершина(,)\n'+" ".repeat(codeEditor.getCursor().ch)+'\tвершина(,)\n'+" ".repeat(codeEditor.getCursor().ch)+'кін фігура\n');},	
	"Alt-0": function(cm){codeEditor.doc.replaceSelection('коло(');},
	"Alt-I": function(cm){console.log(codeEditor.getCursor().ch);}
	}
codeEditor.addKeyMap(mymap);
codeEditor.focus();
codeEditor.setSize("100%", "100%")


function output() {
    let element = document.createElement("p")
    element.innerHTML = ""
    for (let i = 0; i < arguments.length; i++) {
        element.innerHTML = element.innerHTML + arguments[i]
    }
    
    element.setAttribute("class", "outputLine")
    document.querySelector(".runner").appendChild(element)
}

function redOutput() {
    let element = document.createElement("p")
    element.innerHTML = ""
    for (let i = 0; i < arguments.length; i++) {
        element.innerHTML = element.innerHTML + arguments[i]
    }
    element.innerHTML = "<span style='color: red;'>"+element.innerHTML
    element.setAttribute("class", "outputLine")
    document.querySelector(".runner").appendChild(element)
}

function greenOutput() {
    let element = document.createElement("p")
    element.innerHTML = ""
    for (let i = 0; i < arguments.length; i++) {
        element.innerHTML = element.innerHTML + arguments[i]
    }
    element.innerHTML = "<span style='color: #041a09;'>"+element.innerHTML
    element.setAttribute("class", "outputLine")
    document.querySelector(".runner").appendChild(element)
}
var onError;
function error(errorCode) {
	onError = true;
    let element = document.createElement("p")
    element.innerHTML = errorCode
    element.innerHTML = "<span style='color: red;'>"+element.innerHTML
    element.setAttribute("class", "error")
    document.querySelector(".runner").appendChild(element)
}

function div(x, y) {
    return (x / y) | 0
}

function input(text) {
    let inputted = prompt(text, "")
    inputted = Number.isNaN(Number(inputted)) ? inputted : Number(inputted)
    output(text,' : ' + inputted)
    return inputted
}

window.onerror = function(e) {
	if (e==="Script error.") {
		redOutput("Помилка у записі інструкції або виразу");
		greenOutput("······ виконання програми перервано ······");
	}
	 console.log("Помилка: ", e);
   return true;
   
  };


function endOfRun(){
	greenOutput("······ виконання програми закінчено ······");
	codeEditor.focus()
}


function runCode() {
		
    document.querySelector(".runner").innerHTML = ""
    let compiledCode = compile(codeEditor.getValue())

    if (compiledCode === false) {
        return
    }
	greenOutput("······ виконання програми розпочато ······");
	onError = false;
	animateOn = false;
    var codeToRun = new Function(compiledCode)

		codeToRun()
	
}

function run(e){
  if (e.innerText==="▶"){
    e.innerText="■";
    runCode();
    if (animateOn===false){endOfRun();e.innerText="▶"}
   }
  else {e.innerText="▶";
	  onError = true }
 }
 
 
   
/*
document.querySelector("#run").addEventListener("click", function () {
    runCode()
}, {passive: true})
*/
