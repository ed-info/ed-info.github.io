const codeEditor = CodeMirror(document.querySelector(".editor"), {
    lineNumbers: true,
    tabSize: 4,
    theme: "pastel-on-dark",
    mode: "pseudocode"
})

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

function error(errorCode) {
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





function runCode() {
    document.querySelector(".runner").innerHTML = ""
    let compiledCode = compile(codeEditor.getValue())

    if (compiledCode === false) {
        return
    }
greenOutput("······ виконання програми розпочато ······");
	console.log(compiledCode)

    var codeToRun = new Function(compiledCode)

		codeToRun()
greenOutput("······ виконання програми закінчено ······");
}

document.querySelector("#run").addEventListener("click", function () {
    runCode()
}, {passive: true})

