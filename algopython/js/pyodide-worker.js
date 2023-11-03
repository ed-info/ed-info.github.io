importScripts('vendor/pyodide/pyodide.js');
async function loadPyodideAndPackages(){
    await loadPyodide({ indexURL : 'vendor/pyodide/pyodide.js' })
    self.pyodide.runPython(`import sys
import io`)
    self.pyodide.globals.set('input', self.askInput)
    self.pyodide.loadPackage(['matplotlib'])
    postMessage({type: "ready"})
}
let pyodideReadyPromise = loadPyodideAndPackages()

self.lastInput = undefined

self.onmessage = async(msg) => {
  await pyodideReadyPromise
    switch(msg.data.type){
      case "runAsync":
      var code = msg.data.code
      code = code.replace(/\binput\s*[(]/g, 'await $&')
        if(typeof msg.data.input === "undefined"){
          self.pyodide.globals.set('input', self.askInput)
        } else {
          self.inputList = msg.data.input
          self.inputListnb = 0
          self.pyodide.globals.set('input', self.passInputList)
        }
        await self.pyodide.runPythonAsync("sys.stdout = io.StringIO()")
        try{
          await self.pyodide.runPythonAsync(code)
        } catch(e){
          postMessage({type:"error",error:e.toString()})
        }
        await postMessage({type: "done",ret: self.pyodide.runPython("sys.stdout.getvalue()")})
      break
      case "input":
        self.lastInput = msg.data.content
      break
    }
}

self.passInputList = async() => {
  if(self.inputListnb >= self.inputList.length) return ""
  var i = self.inputList[self.inputListnb]
  self.inputListnb++
  return i
}

self.pollEnd = () => new Promise((resolve, reject) => {
  setInterval(() => {
    if(typeof self.lastInput !== "undefined") resolve()
  }
,50)})

//Demander un input
self.askInput = async() => {
  self.lastInput = undefined
  postMessage({type: "input"})
  await self.pollEnd()
  return self.lastInput
}
