

class App{

  constructor(){
    this.testResult = undefined
    this.context = undefined

    this.status = "";
    this.currentCodeTest = ""
    this.tries = 0
    this.testConsole = ""
    this.isFullTesting = false
    this.printsCount = 0
    this.showInput = true

    this.runCountLines = 0

    this.getContextParam = function(){
      switch(ExerciceParams.context){
        case "console":
          return new Console()
        case "robot":
          return new Robot()
        case "canvas":
            return new Canvas()
        default:
          return new Console()
      }
    }

    document.addEventListener('keyup',function(e) {
      if (e.which === 13) {
        document.getElementById("result-input-ok").click()
        if($("#modal-niveau-termine.show").length > 0){
          window.location.href = OtherParams.continuer_lien;
        }
        if(e.altKey && app.needFullTest()){
          document.getElementById("editor-fulltest").click()
        } else if(e.ctrlKey){
          if(app.status == "waiting") app.setStatus("running")
          else{
            app.context.interrupt()
            app.setStatus("waiting")
          }
        }
      }
      if (e.which === 27) {
        $("#result-input-field").val("")
        document.getElementById("result-input-ok").click()
      }
    })

    $("#result-input-ok").click(function(e) {
      app.showInputField(false)
    })

    $("#editor-reset").click(function(e) {
      if(ExerciceParams.modele) return
      app.resetEditor()
      $("#editor-reset").blur()
    })
  }

  resetEditor(code){
    if(ExerciceParams.modele) return
    app.editor.setValue((typeof code === "undefined" || app.countLines(code) == 0) ? (ExerciceParams.codeBloque+ExerciceParams.initCode) : code,1)
    app.updateLineCount()
    app.editor.getSession().setUndoManager(new ace.UndoManager())
  }

  async setStatus(s){
    var ct = this.context
    switch(s){
      case "waiting":
        if(this.status == "running"){
          app.context.interrupt()
        }
        $("#editor-run").html('<i class="fas fa-play"></i> '+(app.needFullTest() ? 'Тестувати' : 'Виконати'))
        $("#editor-run").removeClass("btn-primary")
        $("#editor-run").removeClass("btn-danger")
        $("#editor-run").addClass("btn-success")
        app.showInputField(false)
        this.status = s
      break
      case "running":
        if(ExerciceParams.interpreter === "pyodide" && !pyo.ready) return
        if(!modele.champsFull()) return
        if(this.status != "running" && !this.isFullTesting){
          if(typeof tooltipList[0] !== "undefined") tooltipList[0].hide()
          if(typeof tooltipList[1] !== "undefined") tooltipList[1].hide()
          this.status = s
          $("#editor-run").html('<i class="fas fa-stop"></i> Зупинити')
          $("#editor-run").removeClass("btn-success")
          $("#editor-run").removeClass("btn-primary")
          $("#editor-run").addClass("btn-danger")
          $("#editor-run").blur()
          this.tries++
          this.printsCount = 0
          this.runCountLines = app.countLines()
          this.runCodeInterdit = app.checkCodeInterdit(ExerciceParams.codeInterdit)
          this.testConsole = ""
          this.currentInputs = []
          this.currentCodeIfComplete = ExerciceParams.modele ? modele.getCode() : app.editor.getValue()
          ct.start(this.tries)
          switch(ExerciceParams.interpreter){
            case "skulpt":
              Sk.configure({output:app.outf,inputfun:app.inputf,inputfunTakesPrompt: true,__future__: Sk.python3,execLimit: this.context.execLimit})
              var myPromise = Sk.misceval.asyncToPromise(function() {
                  return Sk.importMainWithBody("<stdin>", false, app.currentCode(), true)
              });
              myPromise.then(function(mod) {
                ct.end(app.currentCode())
              },
                function(err) {
                  app.blinkError(err.toString())
                  app.context.endError(app.testResult,err.toString())
                  app.postTentative(app.currentCodeIfComplete,"err",err.toString())
              });
            break
            case "pyodide":
              if(pyo.ready){
                var myPromise = new Promise((resolve, reject) => {
                  var ret = pyo.runAsync(app.currentCode())
                  resolve(ret)
                })
                myPromise.then(function(value){
                  app.outfMultiple(value)
                  ct.end(app.currentCode())
                },function(err){
                  var errstr = app.sortOutError(err.toString())
                  app.blinkError(errstr)
                  app.context.endError(app.testResult,errstr)
                  app.postTentative(app.currentCodeIfComplete,"err",errstr)
                })
              }
            break
          }
          app.setStatus("running")
        }
      break
    }
  }

  //Si Pyodide exécute le code, il renverra une erreur, il faut en extraire la ligne importante
  sortOutError(err){
    var lines = err.split("\n")
    var lastLine = 0;
    for(var i = 0; i < lines.length; i++){
      if(lines[i] !== "") lastLine = i
    }
    var error = lines[lastLine]
    if(lastLine > 0){
      var prev = lines[lastLine-1]
      var m
      if(m = prev.match(/line [0-9]+/g)){
        m = m[0]
        error += " on "+m
      }
    }
    return error
  }

  blinkError(err){
    var m
    if(m = err.match(/line [0-9]+/g)){
      m = m[0]
      var v = parseInt(m.substr(5))-app.getInitialCodeLineCount()
      if(v >= 1){
        $("#editor").addClass("line-error-"+v)
        window.setTimeout(function(){
          $("#editor").removeClass("line-error-"+v)
        },1000)
      }
    }
  }

  currentCode(){
    var ret = app.context.contextCode+"\n"+ExerciceParams.initCodeHidden+"\n"+(ExerciceParams.modele ? modele.getCode() : app.editor.getValue())
    if(!app.isFullTesting && typeof eTest !== "undefined"){
      if(eTest.argsDescription.length){
        var aNames = []
        for(var a of eTest.argsDescription){
          if(a.type == "int") ret += "\n"+a.name+" = int(input())"
          else if(a.type == "float") ret += "\n"+a.name+" = float(input())"
          else if(a.type == "list"){
            var code = "\n"+"TEMP_INPUT = input()"
            code += "\n"+"TEMP_INPUT = TEMP_INPUT.strip('][').split(',')"
            code += "\n"+"LIST = []"
            code += "\n"+"for e in TEMP_INPUT :"
            code += "\n"+"    LIST = LIST + [float(e)]"
            ret += code+"\n"+a.name+" = LIST"
          }
          else ret += "\n"+a.name+" = input()"
          aNames.push(a.name)
        }
        if(eTest.noPrint) ret += "\n"+eTest.functionName+"("+aNames.join(",")+")"
        else ret += "\nprint("+eTest.functionName+"("+aNames.join(",")+"))"
      }
      else if(eTest.functionName) ret += "\nprint("+eTest.functionName+"())"
    }
    return ret
  }

  testReady(r){
    if(!ExerciceParams.modele) app.editor.focus()
    var ct = this.context
    app.testResult = r
    if(app.testResult && app.testResult.correct){
      if(app.runCountLines <= app.maxLines && this.runCodeInterdit){
        ct.endCorrect(app.testResult)
        $("#editor-fulltest").prop('disabled',false)
        app.postTentative(app.currentCodeIfComplete,"ok","")
      } else {
        if(!this.runCodeInterdit) ct.endCodeInterdit(app.testResult)
        else ct.endTooMuchLines(app.testResult,app.runCountLines,app.maxLines)
        app.postCodeFail()
        app.postTentative(app.currentCodeIfComplete,"ko","Забагато рядків або заборонений код")
      }
    } else {
      ct.endIncorrect(app.testResult,app.runCountLines,app.maxLines)
      app.postCodeFail()
      app.postTentative(app.currentCodeIfComplete,"ko","Помилковий результат")
    }
  }

  postCodeFail(){
    $.post(OtherParams.siteRoot+"php/ajax/exercice_termine.php", {slug:OtherParams.slug, code: this.currentCodeIfComplete, champs: modele.getChampsArray(), statut:0, key:md5(OtherParams.slug+OtherParams.userId+this.currentCodeIfComplete+0)} )
  }

  needFullTest(){
    return typeof eTest !== "undefined" && eTest.functionName !== "" && eTest.nbTests > 0 && (eTest.argsDescription && eTest.argsDescription.length)
  }

  postTentative(code,statut,details){
    $.post(OtherParams.siteRoot+"php/ajax/tentative.php", {slug:OtherParams.slug, code: code, statut:statut, details:details, key:md5(OtherParams.slug+OtherParams.userId+code+statut+details)} )
  }

  async fullTest(){
    if(ExerciceParams.interpreter === "pyodide" && !pyo.ready) return
    if(!modele.champsFull()) return
    if(app.status !== "waiting") return
    this.isFullTesting = true
    this.context.testStart()
    this.runCountLines = app.countLines()
    this.runCodeInterdit = app.checkCodeInterdit(ExerciceParams.codeInterdit)
    this.currentCodeIfComplete = ExerciceParams.modele ? modele.getCode() : app.editor.getValue()
    window.setTimeout(async function(){
      var test = await app.context.testAnswer(app.currentCode())
      app.testReady(test)
      app.isFullTesting = false
    },100)
  }

  async inputf(){
    var question = true
    var questionMobile = true
    if(typeof eTest !== "undefined" && eTest.argsDescription && app.currentInputs.length < eTest.argsDescription.length){
      var a = eTest.argsDescription[app.currentInputs.length]
      if(a.type == "list" || a.type == "string") $("#result-input-field").attr('maxlength',30)
      else $("#result-input-field").attr('maxlength',8)
      question = (a.type == "list") ? "Введіть список "+a.name+" :" : ((a.type == "int" || a.type == "float") ? "Введіть число "+a.name+" :" : "Введіть текст "+a.name+" :")
      questionMobile = (a.type == "list") ? "> Список "+a.name+" :" : ((a.type == "int" || a.type == "float") ? "> Число "+a.name+" :" : "> Текст "+a.name+" :")
      app.showInput = false
    } else app.showInput = true
    app.showInputField(question,questionMobile)
    if(typeof tooltipList[0] !== "undefined") tooltipList[0].hide()
    return new Promise((resolve, reject) => {
      document.getElementById("result-input-ok").addEventListener('click',function(e) {
        var inp = $("#result-input-field").val()
        app.currentInputs.push(inp)
        app.context.input(inp)
        if(!app.showInput && typeof eTest !== "undefined" && eTest.argsDescription && app.currentInputs.length == eTest.argsDescription.length){
          var args = []
          for(var i = 0; i < eTest.argsDescription.length; i++){
            var currentInput = app.currentInputs[i]
            if(eTest.argsDescription[i].type === "list") currentInput = testHelpers.listify(currentInput)
            if(eTest.argsDescription[i].type === "string") currentInput = testHelpers.stringify(currentInput)
            args.push(currentInput)
          }
          args = args.join(", ")
          app.showInput = true
          app.context.input(eTest.functionName+"("+args+")")
        }
        resolve(inp)
      }, {once: true})
      })
  }

  showInputField(show,showMobile){
    if(show){
      if(show !== true){
        $("#result-input-question").html(show)
        $("#result-input-question-mobile").html(showMobile)
      }
      else{
        $("#result-input-question").html("Entrez un texte :")
        $("#result-input-question-mobile").html("Entrée : ")
      }
      $("#result").css('opacity',0.5)
      $("#result-input").show()
      $("#input-mask").show()
      $("#result-input-field").val("")
      $("#result-input-field").focus()
      window.setTimeout(function(){$("#result-input-field").focus()},100)
      $("#result-input-field").prop("disabled",false)
      $("#result-input-ok").prop("disabled",false)
      $("#editor-run").prop("disabled",true)
    } else {
      $("#result").css('opacity',1)
      $("#result-input").hide()
      $("#input-mask").hide()
      $("#result-input-field").prop("disabled",true)
      $("#result-input-ok").prop("disabled",true)
      if(app.context.isReady) $("#editor-run").prop("disabled",false)
    }
  }

  levelComplete(){
    $.post(OtherParams.siteRoot+"php/ajax/exercice_termine.php", {slug:OtherParams.slug, code: this.currentCodeIfComplete, champs: modele.getChampsArray(), statut:1, key:md5(OtherParams.slug+OtherParams.userId+this.currentCodeIfComplete+1)} )
    if(!this.levelcompleted){
      this.levelcompleted = true;
      $("#navbar-exercice-termine").addClass('ok-1')
      $("#navbar-exercice-termine").removeClass('ok-0')
      window.setTimeout(mEnd.show,ExerciceParams.context == "console" ? 1500 : 500)
    }
  }


  outTest(text){
    app.testConsole += testHelpers.roundFloats(text)
  }
  outfMultiple(text){
    var lines = text.split("\n")
    for(var i = 0; i < lines.length; i++){
      if(i < lines.length - 1) app.outf(lines[i] + "\n")
      else app.outf(lines[i])
    }
  }
  outf(text) {
    app.printsCount++
    app.context.print(testHelpers.roundFloats(text).replace(/\n/g,'<br>'))
  }

  countLines(lines){
    if(ExerciceParams.modele) return 0
    if(typeof lines === "undefined") lines = app.editor.getValue()
    lines = lines.split("\n")
    var c = 0
    for(var i in lines){
      var line = lines[i].trim()
      if(line && line.charAt(0) != "#") c++
    }
    return c
  }

  checkCodeInterdit(regArray,lines){
    if(ExerciceParams.modele) return true
    if(typeof lines === "undefined") lines = app.editor.getValue()
    for(var reg of regArray){
      if(reg.charAt(0) == "/" && reg.charAt(reg.length-1) == "/"){
        reg = new RegExp(reg.substring(1,reg.length-1),"i")
      }
      else reg = reg.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      if(lines.search(reg) !== -1) return false
    }
    return true
  }

  chechCommonMistakes(lines){
    if(ExerciceParams.modele) return false
    if(typeof lines === "undefined") lines = app.editor.getValue()
    lines = lines.split("\n")
    var currentLine = app.editor.getCursorPosition().row
    for(var i = 0; i < lines.length; i++){
      var prev = (i == 0) ? "" : lines[i-1]
      var line = lines[i]
      var next = (i == lines.length-1) ? "" : lines[i+1]
      for(var m of mistakeList){
        var c = m.check(line,prev,next,i+1)
        if(c){
          if(i !== currentLine || !app.editor.isFocused()) return c
          else return false
        }
      }
    }
    return false
  }

  getInitialCodeLineCount(){
    return this.countLines(app.context.contextCode+"\n"+ExerciceParams.initCodeHidden) + 2
  }

  updateLineCount(){
    $("#editor-lignes-compte").html(app.countLines())
    $("#editor-lignes").css('color','black')
    $("#editor").removeClass('excess-lines')
    $("#editor-lignes-interdites").hide()
    var codeInterditOk = app.checkCodeInterdit(ExerciceParams.codeInterdit)
    var commonMistake = app.chechCommonMistakes()
    if(codeInterditOk && !commonMistake) tooltipCode.hide()
    else{
      tooltipCode.show()
      $("#tooltip-error-content").html(codeInterditOk ? commonMistake : "Ви використовуєте заборонений код для цієї вправи.")
    }
    if(app.countLines() > app.maxLines || !codeInterditOk || commonMistake || (ExerciceParams.modele && app.editor.getValue().length > ExerciceParams.maxCharsEditor)){
      if(app.countLines() > app.maxLines) $("#editor-lignes").css('color','red')
      $("#editor").addClass('excess-lines')
    }
  }
};
var app = new App()

class Context{
  constructor(){
    this.isReady = false
    this.programEnded = true
    this.contextCode = ""
    this.execLimit = 30000
    this.instructionLimit = 1000
  }

  //Tout premier lancement du contexte.
  ready(){
    if(this.isReady) return
    this.isReady = true
    window.setTimeout(function(){$("#editor-run").prop("disabled",false)},1000)
    window.setTimeout(function(){$("#editor-fulltest").prop("disabled",false)},1000)
  }

  //Début de l'exécution d'un programme
  start(nbTry){

  }

  //Le programme a écrit une ligne.
  print(str){
    if(app.printsCount > this.instructionLimit) throw "Instruction limit exceeded"
  }

  //Une valeur a été rentrée par l'utilisateur
  input(str){

  }

  //Le programme a terminé sans erreur, il est prêt pour le test.
  //Certains contextes doivent encore lancer des animations avant de pouvoir faire leur test.
  async end(code){
    if(typeof eTest === "undefined"){
      this.endNeutral()
      app.postCodeFail()
      return
    }
    var testAns = await this.testAnswer(code,false)
    app.testReady(testAns)
  }

  //Corriger la ligne d'une erreur de code
  correctLineError(err){
    var m
    if(m = err.match(/line [0-9]+/g)){
      m = m[0]
      err = err.substr(0,err.length-(m.length-5))+(Math.max(1,parseInt(m.substr(5))-app.getInitialCodeLineCount()));
    }
    return err
  }

  //Tester la réponse de l'utilisateur.
  //Cela dépend du contexte : le comportement normal consiste à tester le code, mais dans certains cas (canvas, robot), cela dépend du résultat en fin de programme.
  async testAnswer(code,full){
    //Nouvel objet eTest défini, on utilise la nouvelle méthode
    if(typeof eTest !== "undefined"){
      if(typeof full === "undefined") full = true
      for(var i = 0; i < (full ? eTest.nbTests : 1); i++){
        //Préparation des variables
        this.testValueArray = testHelpers.turnToArray(eTest.args(i))
        this.testValuenbInput = 0
        app.testConsole = ""
        if(!full) this.testValueArray = app.currentInputs
        //Rajout du code du début
        var codeTest = code
        if(full && eTest.functionName && eTest.functionName != "input"){
          this.testValueArrayPython = []
          for(var j = 0; j < this.testValueArray.length; j++){
            if(eTest.argsDescription[j] && eTest.argsDescription[j].type === "string"){
              this.testValueArrayPython.push("\"" + this.testValueArray[j] + "\"")
            }
            else this.testValueArrayPython.push(this.testValueArray[j]);
          }
          if(eTest.noPrint) codeTest += "\n"+eTest.functionName+"("+this.testValueArrayPython.join(",")+")"
          else codeTest += "\nprint("+eTest.functionName+"("+this.testValueArrayPython.join(",")+"))"
        }
        //Exécution de Skulpt
        switch(ExerciceParams.interpreter){
          case "skulpt":
            Sk.configure({output:app.outTest,inputfun:app.context.testAnswerInput,inputfunTakesPrompt: true,__future__: Sk.python3,execLimit: 5000})
            try{
              Sk.importMainWithBody("<stdin>", false, codeTest, true)
            } catch(e){
              return new testResult("erreur",this.testValueArray,e.toString())
            }
          break
          case "pyodide":
            if(pyo.ready){
              try{
                var ret = await pyo.runAsync(codeTest,app.context.testValueArray)
                await app.outTest(ret)
              }
              catch(err){
                var errstr = app.sortOutError(err.toString())
                return new testResult("erreur",this.testValueArray,errstr)
              }
            }
          break
        }
        //Suppression de la dernière ligne vide
        var lines = app.testConsole.split("\n")
        if(lines[lines.length-1].trim() == "") lines.pop()
        //Vérification avec la fonction test
        var check = eTest.test(lines,this.testValueArray)
        //console.log(check)
        if(!check.correct) return check
      }
      return new testResult(true)
    }
  }


  testAnswerInput(prompt){
    if(app.context.testValuenbInput >= app.context.testValueArray.length) return ""
    var i = app.context.testValueArray[app.context.testValuenbInput]
    app.context.testValuenbInput++
    return i
  }

  //Fin de l'exécution s'il n'y a pas de test
  endNeutral(r){

  }

  //Fin de l'exécution d'un programme
  endCorrect(r){

  }

  endTooMuchLines(r,l,lmax){

  }

  endCodeInterdit(r){

  }

  endIncorrect(r){

  }

  endError(r,err){

  }

  interrupt(){

  }


}

class modalEnd{

  constructor(){
    this.m = new bootstrap.Modal(document.getElementById('modal-niveau-termine'), {backdrop: 'static', keyboard: true})
    this.t = 0
    this.tInterval = 40
    this.durationAnim = 2000
    this.levelUpDuration = 1000
    this.levelUp = 0
  }
  show(){
    $("#exo-suivant").show()
    mEnd.m.show()
    if(mEnd.t == 0){
      mEnd.pointsInit = OtherParams.points
      if(OtherParams.points_exercice == 0) mEnd.t = 1
      else window.setTimeout(mEnd.animate,mEnd.tInterval)
    }
  }
  //TODO : répéter autant de fois qu'il y a eu de différence de temps
  animate(){
    if(mEnd.levelUp <= 0) mEnd.t = Math.min(1,mEnd.t+mEnd.tInterval/mEnd.durationAnim)
    mEnd.levelUp = Math.max(0,mEnd.levelUp-mEnd.tInterval)
    if(mEnd.t > 0.2 && mEnd.t < 0.8){
      $("#barre-xp-image").css('top','0px')
      $("#barre-xp-image").css('left','0px')
      $("#barre-xp-image").css('width','100px')
      $("#barre-xp-image").css('height','100px')
      OtherParams.points = mEnd.pointsInit + Math.floor(OtherParams.points_exercice*(mEnd.t-0.2)/0.6)
    }
    if(mEnd.t >= 0.8){
       OtherParams.points =  mEnd.pointsInit + OtherParams.points_exercice
       $("#barre-xp-image").css('top','20px')
       $("#barre-xp-image").css('left','20px')
       $("#barre-xp-image").css('width','60px')
       $("#barre-xp-image").css('height','60px')
    }
    if(OtherParams.points >= OtherParams.points_next){
      OtherParams.rang++
      var prev = OtherParams.points_next
      OtherParams.points_next = mEnd.calcBarre(OtherParams.rang)
      OtherParams.points_prev = prev
      mEnd.levelUp = mEnd.levelUpDuration
    }
    if(mEnd.t < 1 || mEnd.levelUp > 0) window.setTimeout(mEnd.animate,mEnd.tInterval)
    mEnd.render()
  }

  calcBarre(r){
    return r*(OtherParams.barre_rang+OtherParams.barre_rang+(r-1)*OtherParams.barre_rang_raison)/2
  }

  render(){
    $("#barre-xp-points").html(OtherParams.points)
    $("#barre-xp-next").html(OtherParams.points_next)
    $("#modal-niveau-termine .niveau").html(OtherParams.rang)
    $("#modal-niveau-termine .progress-bar").css('width',(100*((OtherParams.points-OtherParams.points_prev)/(OtherParams.points_next-OtherParams.points_prev)))+"%")
    if(mEnd.levelUp > 0){
      $("#modal-niveau-termine .progress-bar").css('width',"100%")
      $("#barre-xp-compte-normal").hide()
      $("#barre-xp-compte-sup").css('display','inline')
      $("#modal-niveau-termine .progress").css('box-shadow',"0px 0px 6px 6px rgba(255,128,0,0.5)")
      if((mEnd.levelUp/mEnd.levelUpDuration) % 0.25 >= 0.12){
        $("#modal-niveau-termine .niveau").css('color','rgb(255,128,0)')
        $("#barre-xp-compte-sup").css('opacity','0')
      } else {
        $("#modal-niveau-termine .niveau").css('color','white')
        $("#barre-xp-compte-sup").css('opacity','1')
      }
    } else {
      $("#modal-niveau-termine .niveau").css('color','white')
      $("#barre-xp-compte-normal").show()
      $("#barre-xp-compte-sup").hide()
      $("#modal-niveau-termine .progress").css('box-shadow',"")
    }
  }
}
var mEnd = new modalEnd()

class Modele{
  getCode(){
    var code = ExerciceParams.modele
    for(var i = 0; i < 10; i++){
      if($("#modele-champ-"+i).length) code = code.replace("$$"+i+"$$",$("#modele-champ-"+i).val())
      else code = code.replace("$$"+i+"$$","")
    }
    return code
  }
  getChampsArray(){
    var ret = []
    for(var i = 0; i < 10; i++){
      if($("#modele-champ-"+i).length) ret.push($("#modele-champ-"+i).val())
    }
    return ret.join("|")
  }
  champsFull(){
    if(!ExerciceParams.modele) return true
    for(var i = 0; i < 10; i++){
      if($("#modele-champ-"+i).length && !$("#modele-champ-"+i).val().trim()) return false
    }
    return true
  }
  attachEvents(){
    for(var i = 0; i < 10; i++){
      if($("#modele-champ-"+i).length){
        $("#modele-champ-"+i).keyup(modele.setToolTips)
        $("#modele-champ-"+i).change(modele.setToolTips)
      }
    }
  }
  setToolTips(){
    if(!modele.toolTipTest || !modele.toolTipFull) return
    if(modele.champsFull()){
      $("#editor-run").attr("data-bs-original-title",modele.toolTipTest)
      $("#editor-fulltest").attr("data-bs-original-title",modele.toolTipFull)
    } else {
      $("#editor-run").attr("data-bs-original-title","Заповніть усі поля перед запуском.")
      $("#editor-fulltest").attr("data-bs-original-title","Заповніть усі поля перед запуском.")
    }
  }
  onLoad(){
    modele.attachEvents()
    modele.toolTipTest = $("#editor-run").attr("data-bs-original-title")
    modele.toolTipFull = $("#editor-fulltest").attr("data-bs-original-title")
    window.setTimeout(modele.setToolTips,500)
  }
}
var modele = new Modele()

if (!String.prototype.trimStart) {
	String.prototype.trimStart = function () {
		return this.replace(new RegExp('^' + /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+/.source, 'g'), '');
	};
}

if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            var pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}


class Pyo{
  constructor(){
    this.ready = false
    this.lastResult = undefined
    this.polls = 0
    this.minpolls = 2
    this.isWaitingInput = false
    this.pollInterval = 100
    this.pyerror = false
    this.initworker()
  }

  initworker(){
    this.pyowork = new Worker(OtherParams.siteRoot+"js/pyodide-worker.js")
    this.pyowork.onmessage = async function (msg){
      //console.log(msg.data)
      switch(msg.data.type){
        case "ready":
          pyo.ready = true
          app.context.ready()
        break
        case "done":
          pyo.lastResult = msg.data.ret
        break
        case "input":
          pyo.isWaitingInput = true
          var content = await app.inputf()
          pyo.pyowork.postMessage({type: "input", content: content})
          pyo.isWaitingInput = false
        break
        case "error":
          pyo.pyerror = msg.data.error
          pyo.polls = -1;
        break
      }
    }
  }

  pollEnd = () => new Promise((resolve, reject) => {
    pyo.intervalVariable = setInterval(() => {
      if(!pyo.polls){
          window.clearInterval(pyo.intervalVariable)
          reject()
        }
        if(pyo.polls < 0){
          pyo.polls = 0
          window.clearInterval(pyo.intervalVariable)
          reject(pyo.pyerror)
        }
        if(pyo.polls >= 50 + pyo.minpolls){
          this.pyowork.terminate()
          this.initworker()
          this.ready = false
          pyo.polls = 0
          window.clearInterval(pyo.intervalVariable)
          reject("Програму зупинено: перевищено ліміт часу")
        }
        if(typeof pyo.lastResult !== "undefined" && pyo.polls >= pyo.minpolls){
          window.clearInterval(pyo.intervalVariable)
          resolve()
        }
        else{
          if(!pyo.isWaitingInput) pyo.polls++
        }
    },pyo.pollInterval)
  })

  async runAsync(code,inputf){
    pyo.lastResult = undefined
    pyo.pyerror = false
    pyo.polls = 1
    pyo.minpolls =  3
    if(inputf){
      this.pollInterval = 10
      pyo.minpolls = 1
    } else {
      this.pollInterval = 100
      pyo.minpolls = 3
    }
    pyo.pyowork.postMessage({type: "runAsync", code: code, input: inputf})
    let name = await pyo.pollEnd();
    return pyo.lastResult
  }
}
if(ExerciceParams.interpreter == "pyodide"){
  var pyo = new Pyo();
}

class C3Context extends Context{
  constructor(){
    super()
    this.c3 = document.getElementById("c3").contentWindow
    this.c3Status = {}
    this.execLimit = 1000
    this.instructionLimit = 1000
  }

  c3StatusUpdate(obj){
    for(var t in obj){
      switch(t){
        case "ready":
          if(!this.c3Status.ready){
            this.c3.c3_callFunction("lireNiveau",[ExerciceParams.data,ExerciceParams.context])
            this.c3Status.ready = true
          }
        break;
        case "success":
          if(obj[t] && !this.c3Status.success){
            this.c3Status.success = true
            app.testReady(new testResult(true))
          }
          if(!obj[t] && this.c3Status.success){
            this.c3Status.success = false
          }
        break;
        case "failure":
          if(obj[t] && !this.c3Status.failure){
            this.c3Status.failure = true
            app.testReady(new testResult(false))
          }
          if(!obj[t] && this.c3Status.failure){
            this.c3Status.failure = false
          }
        break;
        default:
          this.c3Status[t] = obj[t]
      }
    }
    if(app.status == "running" && (this.c3Status.failure || this.c3Status.success)){
      $("#editor-run").html('<i class="fas fa-undo"></i> Повторити')
      $("#editor-run").removeClass("btn-success")
      $("#editor-run").addClass("btn-primary")
      $("#editor-run").removeClass("btn-danger")
    }
  }

  setSpeed(){
    var val = parseInt($("#c3-vitesse-range").val())
    var spd = 1;
    switch(val){
      case 1: spd = 0.5; break;
      case 3: spd = 3; break;
      case 4: spd = 10; break;
      default: spd = 1; break;
    }
    app.context.c3.c3_callFunction("changerVitesse",[spd])
  }



  endCorrect(){
    app.levelComplete()
  }

  interrupt(){
    this.c3.c3_callFunction("reset",[])
  }

  testAnswer(code){

  }
}

class Canvas extends C3Context{
  constructor(){
    super()
    this.instructionLimit = 1000
    this.contextCode = 'def move(x):\n print("**CANVAS**av"+str(x))\n'
    this.contextCode += 'def turn(x):\n print("**CANVAS**tr"+str(x))\n'
    this.contextCode += 'def pendown():\n print("**CANVAS**po1")\n'
    this.contextCode += 'def penup():\n print("**CANVAS**po0")\n'
    this.contextCode += 'def color(r,g,b):\n print("**CANVAS**cl"+str(r)+","+str(g)+","+str(b))\n'
    this.contextCode += 'def thickness(x):\n print("**CANVAS**ep"+str(x))\n'
    this.contextCode += 'def arc(x,a):\n print("**CANVAS**ar"+str(x)+","+str(a))\n'

    for(var i of ['up','down','left','right']){
      mistakeList.push(new Mistake(new RegExp("^"+i),"La fonction <pre>"+i+"</pre> n'existe pas ici (elle est associée au robot)."))
    }

    mistakeList.push(new Mistake("penup","За вказівкою <pre>penup</pre> повинні стояти дві дужки <pre>()</pre>."))
    mistakeList.push(new Mistake(/penup\([0-9]+\)/,"Ви не можете вказати число у вказівці <pre>penup</pre>. Натомість використовуйте <pre>penup()</pre>, а потім <pre>move</pre>."))
    mistakeList.push(new Mistake("pendown","За вказівкою <pre>pendown</pre> повинні стояти дві дужки <pre>()</pre>."))
    mistakeList.push(new Mistake(/pendown\([0-9]+\)/,"Ви не можете вставити число у вказівку <pre>pendown</pre>."))
    mistakeList.push(new Mistake(/move\(\s*\)/,"У вказівці <pre>move</pre> кількість переміщень має бути вказана в дужках."))
    mistakeList.push(new Mistake(/color\(.*\..*\)/,"У вказівці <pre>color</pre> числа мають бути розділені комами, а не крапками."))

  }

  print(str){
    if(app.printsCount > this.instructionLimit) return
    if(str.indexOf("**CANVAS**") != -1){
      var ordre = str.substr(10,2)
      var params = str.substr(12,str.indexOf("<")-12)
      var ar_params = params.split(",")
      switch(ordre){
        case "av": this.c3.c3_callFunction("ordreCanvas",["avancer",params,"0","0"]); break;
        case "tr": this.c3.c3_callFunction("ordreCanvas",["tourner",params,"0","0"]); break;
        case "po": this.c3.c3_callFunction("ordreCanvas",["on",params,"0","0"]); break;
        case "ep": this.c3.c3_callFunction("ordreCanvas",["epaisseur",params,"0","0"]); break;
        case "ar": this.c3.c3_callFunction("ordreCanvas",["arc",ar_params[0],ar_params[1],"0"]); break;
        case "cl": this.c3.c3_callFunction("ordreCanvas",["color",ar_params[0],ar_params[1],ar_params[2]]); break;
      }
    } else {
      if(str.slice(-4) == "<br>") str = str.substr(0,str.length-4)
      if(str) this.c3.c3_callFunction("ordreCanvas",["print",str,"0","0"])
    }
  }

  end(code){
    this.c3.c3_callFunction("endCanvas",[])
  }

  endError(r,err){
    this.c3.c3_callFunction("ordreCanvas",["printerror",this.correctLineError(err),"0","0"])
  }

  endTooMuchLines(r,l,lmax){
    this.c3.c3_callFunction("printTooMuchLines",[])
  }

}

class Console extends Context{

  constructor(){
    super()
    this.result = $("#result")
    for(var i of ['up','down','left','right']){
      mistakeList.push(new Mistake(new RegExp("^"+i),"Функція <pre>"+i+"</pre> тут не існує (вона пов’язана з роботом)."))
    }
    for(var i of ['move','turn','penup','pendown','color']){
      mistakeList.push(new Mistake(new RegExp("^"+i),"Функція <pre>"+i+"</pre> тут не існує (вона пов’язана з малюванням)"))
    }
  }

  ready(){
    if(this.isReady) return
    this.writeLn('консоль >>',"grey")
    super.ready()
  }

  start(nbTry){
    this.writeLn("")
    this.writeLn("Спроба #"+nbTry,"lightblue")
    var flash = document.getElementById("result-flash")
    flash.style.animation = "none"
    flash.offsetHeight
    flash.style.animation = null
  }

  print(str){
    super.print()
    this.write(str)
  }

  input(str){
    if(app.showInput) this.writeLn("> "+str,"grey")
  }

  write(text){
    if(text == "None<br>") text = '<span style="color:grey">None</span>'
    this.result.append(text)
    this.result.scrollTop(this.result[0].scrollHeight)
  }

  writeLn(line,color){
    var text = line
    if(color) text = '<span style="color:'+color+'">'+text+'</span>'
    this.write(text+"<br>")
  }

  testStart(){
    this.writeLn("")
    this.writeLn("Перевірку розпочато","lightblue")
  }

  end(code){
    if(this.result.html().slice(-4) !== "<br>") this.writeLn("")
    super.end(code)
  }

  endNeutral(r){
    this.writeLn("Перевірку закінчено.","lightblue")
    app.setStatus("waiting")
  }

  endCorrect(){
    app.setStatus("waiting")
    if(typeof ExerciceParams.noTest !== "undefined") return
    if(app.needFullTest()){
      if(app.isFullTesting){
        this.writeLn("Код правильний!","lawngreen")
        app.levelComplete()
      } else{
        this.writeLn("Тестування завершено.","lawngreen")
        var color1 = "lawngreen"
        var color2 = "lightblue"
        this.write('<span style="color:'+color1+'">Натисніть кнопку <span style="color:'+color2+'">[Перевірити]</span> щоб підтвердити ваш код.</span><br>')
      }
    } else {
      this.writeLn("Вправу виконано !","lawngreen")
      app.levelComplete()
    }
  }

  endCodeInterdit(r){
    this.writeLn("Результат правильний, але ви використовуєте заборонений код.","goldenrod")
    app.setStatus("waiting")
  }

  endTooMuchLines(r,l,lmax){
    if(app.isFullTesting) this.writeLn("Код правильний, але ви використовуєте "+(l-lmax).toString()+" рядки"+(l-lmax > 1 ? "s" : "")+" це забагато.","goldenrod")
    else this.writeLn("Результат правильний, але ви використовуєте "+(l-lmax).toString()+" рядки"+(l-lmax > 1 ? "s" : "")+" це забагато.","goldenrod")
    app.setStatus("waiting")
  }

  endIncorrect(r,l,lmax){
    if(typeof ExerciceParams.noTest === "undefined"){
      if(app.isFullTesting){
        //console.log(r)
        if(r.inputs && r.result && r.target && Array.isArray(r.result) && Array.isArray(r.target) && r.result.length == 1 && r.target.length == 1){
          var inputsFull = r.inputs.join(" <span style=\"color:lightblue\">puis</span> ")
          this.writeLn("Помилка перевірки...","lightcoral")
          if(r.hint === "erreur"){
            this.writeLn(this.correctLineError(r.result[0]),"red")
          }
          else{
            this.writeLn((eTest.functionName == "input" ? "Lorsqu'on tape" : (r.inputs.length > 1 ? "Avec les arguments" : "Avec l'argument"))+" <span style=\"color:lightgrey\">"+inputsFull+"</span>,","lightblue")
            this.writeLn((eTest.functionName == "input" ? "le programme affiche" : "la fonction renvoie")+" : <span style=\"color:lightcoral\">"+testHelpers.roundFloats(r.result[0])+"</span>.","lightblue")
            this.writeLn((eTest.functionName == "input" ? "Il devrait afficher" : "Elle devrait renvoyer")+" : <span style=\"color:lawngreen\">"+testHelpers.roundFloats(r.target[0])+"</span>.","lightblue")
          }
        } else this.writeLn("Помилка перевірки...","lightcoral")
      }
      else{
        this.writeLn("Результат не відповідає умові завдання.","lightcoral")
        if(r.inputs && r.result && r.target && Array.isArray(r.target) && r.target.length == 1 && eTest.functionName){
          this.writeLn((eTest.functionName == "input" ? "Тут програма має відображати " : "Тут функція повинна була повернути ")+" <span style=\"color:lawngreen\">"+testHelpers.roundFloats(r.target[0])+"</span>.","lightblue")
        }

      }
      if(l > lmax && !app.isFullTesting){
        this.writeLn("Використано на "+(l-lmax).toString()+" ряд"+(l-lmax === 1 ? "ок" : "")+(l-lmax > 1 ? "ки" : "")+" більше, ніж допустимо.","goldenrod")
      }
      if(r.hint && !app.isFullTesting){
        this.writeLn("Підказка: "+r.hint,"goldenrod")
      }
    }
    app.setStatus("waiting")
  }

  endError(r,err){
    app.setStatus("waiting")
    this.writeLn(this.correctLineError(err),"red")
    //this.writeLn("Une erreur a eu lieu lors de l'exécution.","lightcoral")
  }



  interrupt(){

  }

}

class Robot extends C3Context{
  constructor(){
    super()
    this.instructionLimit = 100
    this.contextCode = "data = \'"+ExerciceParams.data+"'.split(',') \nrobotX = 0 \nrobotY = 0 \n" +
'def getCoord(x,y):\n' +
'   if(y < len(data) and y >= 0):\n' +
'       if(x < len(data[y]) and x >= 0):\n' +
'           return data[y][x]\n' +
'       else:\n' +
'           return "-"\n' +
'   else:\n' +
'       return "-"\n' +
'def setCoord(x,y,v):\n' +
'   if(y < len(data) and x < len(data[y]) and x >= 0 and y >= 0):\n' +
'       s = list(data[y])\n' +
'       s[x] = v\n' +
'       data[y] = "".join(s)\n' +
"for k,v in enumerate(data):\n" +
"    if(v.find('S') != -1):\n" +
"        robotX = v.find('S')\n" +
"        robotY = k\n" +
"setCoord(robotX,robotY,'-')\n"+
"def wallRight():\n" +
"    return(getCoord(robotX+1,robotY) == 'R')\n" +
"wallright = wallRight\n"+
"def wallLeft():\n" +
"    print(getCoord(robotX-1,robotY))\n" +
"    return(getCoord(robotX-1,robotY) == 'R')\n" +
"wallleft = wallLeft\n"+
"def wallUp():\n" +
"    return(getCoord(robotX,robotY-1) == 'R')\n" +
"wallup = wallUp\n"+
"def wallDown():\n" +
"    return(getCoord(robotX,robotY+1) == 'R')\n" +
"walldown = wallDown\n"+
"def arrivee():\n" +
"    return(getCoord(robotX,robotY) == 'F')\n" +
"def nonArrive():\n" +
"    return(not arrivee())\n" +
"nonarrive = nonArrive\n"+
'def right(x):\n' +
'    global robotX\n' +
'    for i in range(x):\n' +
'        robotX = robotX + 1\n' +
'        print("**ROBOT**d")\n'+
'def left(x):\n' +
'    global robotX\n' +
'    for i in range(x):\n' +
'        robotX = robotX - 1\n' +
'        print("**ROBOT**g")\n' +
'def up(x):\n' +
'    global robotY\n' +
'    for i in range(x):\n' +
'        robotY = robotY - 1\n' +
'        print("**ROBOT**h")\n' +
'def down(x):\n' +
'    global robotY\n' +
'    for i in range(x):\n' +
'        robotY = robotY + 1\n' +
'        print("**ROBOT**b")\n'

  for(var i of ['move','turn','penup','pendown','color']){
    mistakeList.push(new Mistake(new RegExp("^"+i),"Функція <pre>"+i+"</pre> тут не існує (вона пов’язана з малюванням)."))
  }
  for(var i of ['up','down','left','right']){
    mistakeList.push(new Mistake(i,"Ви повинні вказати кількість переміщень у круглих дужках після вказівки <pre>"+i+"</pre>."))
  }
  mistakeList.push(new Mistake(/^up\(\s*\)/,"Ви повинні вказати кількість переміщень у круглих дужках після вказівки <pre>up</pre>."))
  mistakeList.push(new Mistake(/^down\(\s*\)/,"Ви повинні вказати кількість переміщень у круглих дужках після вказівки <pre>down</pre>."))
  mistakeList.push(new Mistake(/^left\(\s*\)/,"Ви повинні вказати кількість переміщень у круглих дужках після вказівки <pre>left</pre>."))
  mistakeList.push(new Mistake(/^right\(\s*\)/,"Ви повинні вказати кількість переміщень у круглих дужках після вказівки <pre>right</pre>."))
}

  print(str){
    if(app.printsCount > this.instructionLimit) return
    if(str.indexOf("**ROBOT**") != -1){
      this.c3.c3_callFunction("ordreRobot",[str.charAt(9)])
    } else {
      if(str.slice(-4) == "<br>") str = str.substr(0,str.length-4)
      if(str) this.c3.c3_callFunction("ordreRobot",["PRINT:"+str])
    }
  }

  end(code){
    this.c3.c3_callFunction("ordreRobot",["e"])
  }

  endError(r,err){
    this.c3.c3_callFunction("printError",[this.correctLineError(err)])
  }

  endTooMuchLines(r,l,lmax){
    this.c3.c3_callFunction("printTooMuchLines",[])
  }
}

var checks = {
  compareConsole: function(ref,options){
    return (function(test){
      return new testResult(testHelpers.arraysEqual(test,ref,options))
    })
  }
}

class ExerciceTests{
  constructor(obj){
    /*
    Si égal à "input", ce seront les inputs qui seront utilisés (série D)
    Sinon, si non vide, c'est le nom de la fonction à tester.
    Laisser vide ou false pour ne pas avoir d'input, la console de l'utilisateur sera alors directement vérifiée.
    */
    this.functionName = ""
    this.nbTests = 20
    this.noPrint = false
    //Nom des arguments de la fonction, utile lorsque le code est testé par l'utilisateur
    this.argsDescription = []
    if(obj.nbTests) this.nbTests = obj.nbTests
    if(obj.noPrint) this.noPrint = obj.noPrint
    if(obj.functionName) this.functionName = obj.functionName
    if(obj.args) this.args = obj.args
    if(obj.target) this.target = obj.target
    if(obj.test) this.test = obj.test
    if(obj.argsDescription) this.argsDescription = testHelpers.turnToArray(obj.argsDescription)
    if(!this.functionName){
      this.nbTests = 1
      this.argsDescription = []
    }
    if(this.functionName == "input") this.argsDescription = []
  }
  //Fonction qui renvoie un array d'arguments à tester (prend en argument le numéro de l'appel)
  args(i){
    return []
  }
  //Renvoie le tableau console de ce que la fonction devrait renvoyer avec le tableau d'inputs donné
  target(arg){
    return [0]
  }
  //Fonction qui renvoie un testResult disant si le contenu de la console est ok par rapport aux arguments passés
  test(cs,arg){
    return new testResult(testHelpers.arraysEqual(cs,this.target(arg).toString(),{onlyone: true}),arg,cs)
  }
}

class testResult{
  constructor(r,inputs,result,target){
    if(typeof r === "undefined") r = false
    this.correct = (r === true) ? true : false
    this.hint = this.correct ? "" : (r ? r.toString() : "")
    //Tableau avec les arguments passés
    this.inputs = inputs ? testHelpers.turnToArray(inputs) : []
    //Tableau avec les lignes de la console
    this.result = result ? testHelpers.turnToArray(result) : []
    //Tableau avec les lignes attendues
    if(typeof target === "undefined" && typeof inputs !== "undefined" && typeof eTest.target !== "undefined"){
      this.target = testHelpers.turnToArray(eTest.target(this.inputs))
    }
    else this.target = target ? testHelpers.turnToArray(target) : []
  }
}

var testHelpers = {

  //A partir d'une fonction renvoyant une TestValue, construit une fonction renvoyant un array contenant plusieurs TestValue
  duplicate: function(f,c){
    return function(){
      var r = []
      for(var i = 0; i < c; i++){
        r.push(f())
      }
      return r
    }
  },


  //A partir d'une fonction de test, crée un array de testValue (utile lorsqu'il n'y a pas d'input dans l'exercice)
  noInputTest: function(f){
    return function(){
      return [new testValue([],f)]
    }
  },



  //Transforme une variable en Array, si elle ne l'est pas déjà
  turnToArray: function(v){
    if(Array.isArray(v)) return v
    else return [v]
  },

  /*Vérifie si deux tableaux ou deux valeurs sont égales
  Paramètres dans l'objet "options" :
  - simplify : comparaison simplifiée
  - contains : ok si la ref est contenue dans le test (test "vous êtes majeur", ref "majeur")
  - onlyone : tester toutes les lignes du test contre chacune des lignes de la ref, ok si une seule est valide (test "quel est votre âge? vous êtes majeur")
  - int/float : changer toutes les valeurs du test en entier/flottant pour la comparaison
  */
  arraysEqual: function(test, ref, options){
    if(typeof options === "undefined") options = {}
    if(typeof options.int === "undefined") options.int = false
    if(typeof options.float === "undefined") options.float = false
    if(typeof options.simplify === "undefined" && !options.int && !options.float && !options.list) options.simplify = true
    if(typeof options.contains === "undefined") options.contains = false
    if(typeof options.onlyone === "undefined") options.onlyone = false
    if(typeof options.list === "undefined") options.list = false
    test = testHelpers.turnToArray(test)
    ref = testHelpers.turnToArray(ref)
    if (test === ref) return true
    if (test == null || ref == null) return false
    if (test.length !== ref.length && !options.onlyone) return false
    //console.log(test,ref)
    for (var i = 0; i < test.length; ++i) {
      var t = test[i]
      if(options.simplify) t = this.simplify(t)
      if(options.int) t = parseInt(t)
      if(options.float) t = testHelpers.roundFloats(t,3)
      if(typeof t === "string") t = t.trimRight()
      if(options.onlyone){ //Il faut qu'une seule ligne test matche avec une des lignes de la ref
        for (var j = 0; j < ref.length; ++j) {
          var r = ref[j]
          if(options.simplify) r = this.simplify(r)
          if(options.int) r = parseInt(r)
          if(options.float) r = testHelpers.roundFloats(r,3)
          if(typeof r === "string") r = r.trimRight()
          var find = (options.contains && t.indexOf(r) != -1) || (!options.contains && t == r) || (options.list && testHelpers.compareLists(t,r))
          if(find) return true
        }
      } else {
        var r = ref[i]
        if(options.simplify) r = this.simplify(r)
        if(options.int) r = parseInt(r)
        if(options.float) r = testHelpers.roundFloats(r,3)
        if(typeof r === "string") r = r.trimRight()
        var find = (options.contains && t.indexOf(r) != -1) || (!options.contains && t == r) || (options.list && testHelpers.compareLists(t,r))
        if(!find) return false
      }
    }
    return !options.onlyone; //Aucune de dirrérentes possibilités n'a été trouvée
  },

  compareLists: function(l1, l2, options){
    if(typeof options === "undefined") options = {}
    if(typeof options.separator === "undefined") options.separator = ","
    if(typeof options.precision === "undefined") options.precision = 3
    l1 = testHelpers.stringToArray(l1,options.separator)
    l2 = testHelpers.stringToArray(l2,options.separator)
    for(var i = 0; i < l1.length; i++){
      //S'il n'y a pas le même nombre d'éléments, on retourne false
      if(i >= l2.length) return false
      elt1 = l1[i]
      elt2 = l2[i]
      elt1.trim()
      elt2.trim()
      elt1 = testHelpers.sliceDelimiters(elt1,"\"","\"")
      elt2 = testHelpers.sliceDelimiters(elt2,"\"","\"")
      elt1 = testHelpers.sliceDelimiters(elt1,"'","'")
      elt2 = testHelpers.sliceDelimiters(elt2,"'","'")
      //Si un des deux éléments n'est pas un nombre, on compare avec une égalité large
      if(Number.isNaN(parseFloat(elt1)) || Number.isNaN(parseFloat(elt2))){
        if(elt1.toString().toLowerCase() != elt2.toString().toLowerCase()) return false
      }
      if(testHelpers.roundFloats(elt1,options.precision) != testHelpers.roundFloats(elt2,options.precision)) return false
    }
    return true
  },

  sliceDelimiters: function(str,dStart,dEnd){
    if(str.slice(-1) == dEnd) str = str.slice(0,-1)
    if(str.charAt(0) == dStart) str = str.substring(1)
    return str
  },

  stringToArray: function(str,sep){
    if(typeof sep === "undefined") sep = ","
    if(str.length < 2) return [str]
    str = testHelpers.sliceDelimiters(str,"[","]")
    str = testHelpers.sliceDelimiters(str,"(",")")
    return str.split(sep)
  },

  listify: function(str){
    str = testHelpers.sliceDelimiters(str,"[","]")
    str = testHelpers.sliceDelimiters(str,"(",")")
    var arr = str.split(",")
    var newArr = []
    for(var x of arr){
      newArr.push(x.toString().trim())
    }
    return "["+newArr.join(", ")+"]"
  },

  stringify: function(str){
    str = testHelpers.sliceDelimiters(str,"\"","\"")
    return "\""+str+"\""
  },

  roundFloats: function(text,precision){
    precision = precision ?? 12
    var maxInteger = 1000000000000 //Tout ce qui est au-dessus deviendra un flottant
    var mult = Math.pow(10,precision)
    var suffix = ""
    text = text.toString()
    if(text.indexOf("\n", text.length - "\n".length) !== -1){
      suffix = "\n"
    }
    var prefix = ""
    if(text.charAt(0) == "-"){
      text = text.slice(1)
      prefix = "-"
    }
    if(!text.trim()) return text
    if(text.toString() == "Infinity") return "inf"
    var toNumber = Number(text)
    if(isNaN(toNumber) && toNumber.toString().toLowerCase == "nan") return "nan"
    if(Number.isInteger(toNumber) && (toNumber < maxInteger)) return prefix+Math.round(toNumber).toString()+suffix
    if(!isNaN(toNumber) && (toNumber >= maxInteger || !Number.isInteger(toNumber))){
      text = text.substr(0,text.length - suffix.length)
      if(toNumber >= maxInteger){
        var toexp = toNumber.toExponential()
        var expo = (toexp.toString()).substr(toexp.indexOf("e"))
        toexp = Math.round(mult*parseFloat(toexp.substr(0,toexp.indexOf("e"))))/mult
        return prefix+(toexp.toString())+expo
      } else {
        var r = Math.round(mult*toNumber)/mult
      }
      return prefix+r.toString()+suffix
    }

    return text
  },

  //convertit en minuscules, supprime les accents, puis transforme tout ce qui n'est pas une lettre, un chiffre ou un espace en chaîne vide, puis supprime les espaces du début et de fin
  simplify: function(s){
    if(typeof s === "number") return s
    s = s.toLowerCase()
    var defaultDiacriticsRemovalMap = [
      {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
      {'base':'AA','letters':/[\uA732]/g},
      {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
      {'base':'AO','letters':/[\uA734]/g},
      {'base':'AU','letters':/[\uA736]/g},
      {'base':'AV','letters':/[\uA738\uA73A]/g},
      {'base':'AY','letters':/[\uA73C]/g},
      {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
      {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
      {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
      {'base':'DZ','letters':/[\u01F1\u01C4]/g},
      {'base':'Dz','letters':/[\u01F2\u01C5]/g},
      {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
      {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
      {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
      {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
      {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
      {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
      {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
      {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
      {'base':'LJ','letters':/[\u01C7]/g},
      {'base':'Lj','letters':/[\u01C8]/g},
      {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
      {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
      {'base':'NJ','letters':/[\u01CA]/g},
      {'base':'Nj','letters':/[\u01CB]/g},
      {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
      {'base':'OI','letters':/[\u01A2]/g},
      {'base':'OO','letters':/[\uA74E]/g},
      {'base':'OU','letters':/[\u0222]/g},
      {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
      {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
      {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
      {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
      {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
      {'base':'TZ','letters':/[\uA728]/g},
      {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
      {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
      {'base':'VY','letters':/[\uA760]/g},
      {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
      {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
      {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
      {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
      {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
      {'base':'aa','letters':/[\uA733]/g},
      {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
      {'base':'ao','letters':/[\uA735]/g},
      {'base':'au','letters':/[\uA737]/g},
      {'base':'av','letters':/[\uA739\uA73B]/g},
      {'base':'ay','letters':/[\uA73D]/g},
      {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
      {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
      {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
      {'base':'dz','letters':/[\u01F3\u01C6]/g},
      {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
      {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
      {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
      {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
      {'base':'hv','letters':/[\u0195]/g},
      {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
      {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
      {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
      {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
      {'base':'lj','letters':/[\u01C9]/g},
      {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
      {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
      {'base':'nj','letters':/[\u01CC]/g},
      {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
      {'base':'oi','letters':/[\u01A3]/g},
      {'base':'ou','letters':/[\u0223]/g},
      {'base':'oo','letters':/[\uA74F]/g},
      {'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
      {'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
      {'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
      {'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
      {'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
      {'base':'tz','letters':/[\uA729]/g},
      {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
      {'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
      {'base':'vy','letters':/[\uA761]/g},
      {'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
      {'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
      {'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
      {'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
    ]
    for(var i = 0; i < defaultDiacriticsRemovalMap.length; i++) {
      s = s.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base)
    }
 //   s = s.replace(/[^a-z0-9\s]/g,'');
    s = s.trim()
    return s
  },


}

class Mistake{

  constructor(checkIdentifier,helpString){
    this.checkIdentifier = checkIdentifier
    //Texte expliquant l'erreur
    this.helpString = helpString
  }

  check(line,prev,next,nb){
    if(this.checkIdentifier instanceof RegExp){
      if(line.trim().search(this.checkIdentifier) !== -1) return this.helpString
    }
    if(typeof this.checkIdentifier === "string"){
      if(line.trim() === this.checkIdentifier) return this.helpString
    }
    else if(this.checkIdentifier && {}.toString.call(this.checkIdentifier) === '[object Function]'){
      var res = this.checkIdentifier(line,prev,next,nb)
      if(res) return (typeof res === "string") ? res : this.helpString
    }
    return false
  }

  static whiteSpaceStart(string){
    return(string.length - string.trimStart().length)
  }
}

var mistakeList = []

//Oubli de deux points
mistakeList.push(new Mistake(/^for\s*.*[^:]$/i,"Вказівка <pre>for</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake("for","Вказівка <pre>for</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake(/^while\s*.*[^:]$/i,"Вказівка <pre>while</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake("while","Вказівка <pre>while</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake(/^if\s*.*[^:]$/i,"Вказівка <pre>if</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake("if","Вказівка <pre>if</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake(/^else\s*.*[^:]$/i,"Вказівка <pre>else</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake("else","Вказівка <pre>else</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake(/^def\s*.*[^:]$/i,"Вказівка <pre>def</pre> має закінчуватися двокрапкою <pre>:</pre>."))
mistakeList.push(new Mistake("def","Вказівка <pre>def</pre> має закінчуватися двокрапкою <pre>:</pre>."))

//Oubli d'indentation
mistakeList.push(new Mistake(function(line,prev,next){
  for(var com of ["for","while","if","else","def"]){
    if(prev.trim().startsWith(com)){
      if(Mistake.whiteSpaceStart(line) <= Mistake.whiteSpaceStart(prev) && line.trim() != "") return "Після вказівки <pre>"+com+"</pre> має бути рядок із відступом (з пропусками ліворуч)."
    }
  }
},"За цією вказівкою має йти відповідний рядок (з відступами ліворуч)."))

//Espaces à left de la première ligne
mistakeList.push(new Mistake(function(line,prev,next,nb){
  if(nb > 1) return false;
  if(line.startsWith(" ")) return "У першому рядку не повинно бути відступу ліворуч.";
},"У першому рядку не повинно бути відступу ліворуч."))

//Un seul signe = dans un if ou un while (qui pour le reste est bien construit)
mistakeList.push(new Mistake(function(line,prev,next){
  for(var com of ["while","if","else"]){
    if(line.trim().startsWith(com)){
      if(line.search(new RegExp("^"+com+".*=.*:$")) != -1 && line.search(new RegExp("^"+com+".*=[=<>].*:$")) == -1 && line.search(new RegExp("^"+com+".*[=<>]=.*:$")) == -1) return "Після вказівки <pre>"+com+"</pre> використовуйте два символи <pre>==</pre>, щоб перевірити, чи два значення рівні."
    }
  }
},"Ви повинні використовувати два символи <pre>==</pre>, щоб перевірити, чи два значення рівні."))

var tooltipList
$(document).ready(function() {
  $("#console").val("")
  ace.config.set("basePath", "js/ace")
  app.context = app.getContextParam()
  if(!ExerciceParams.modele){
    app.editor = ace.edit("editor")
    app.editor.setTheme("ace/theme/solarized_light")
    app.editor.session.setMode("ace/mode/python")
    app.editor.setValue("")
    app.editor.getSelection().clearSelection()
    app.editor.setOptions({fontSize: "14pt"})
  }
  app.setStatus("waiting")
  if(ExerciceParams.interpreter == "skulpt") app.context.ready()
  app.maxLines = ExerciceParams.maxLines
  if(typeof eTest !== "undefined" && eTest.functionName && eTest.functionName !== "input"){
    ExerciceParams.initCode += "    "
  }
  if(ExerciceParams.codeBloque){
    var initLines = ExerciceParams.codeBloque.split("\n")
    $("#editor").addClass("function-lock-end-"+(initLines.length-1))
    for(var i = 0; i < initLines.length-1; i++){
      $("#editor").addClass("function-lock-"+(i+1))
    }

  }
  app.resetEditor(ExerciceParams.userCode)

  window.setTimeout(function(){
        new bootstrap.Collapse(document.getElementById('exercice-consigne-longue')).show()
  },500)

  $("#c3-vitesse-range").on("change",function(){
    app.context.setSpeed()
  })

  $("#editor-run").click(function(){
    switch(app.status){
      case "running":
        app.context.interrupt()
        app.setStatus("waiting")
      break
      default:
        app.setStatus("running")
      break
    }
    if(!ExerciceParams.modele) app.editor.focus()
    $("#editor-run").blur()
  })
  if(app.needFullTest()) $("#editor-fulltest").show()
  if(OtherParams.deja_termine) $("#editor-fulltest").prop('disabled',false)
  $("#editor-fulltest").click(function(){
    $("#editor-fulltest").blur()
    if(app.status == "waiting" && app.needFullTest()){
      app.fullTest()
    }
    if(!ExerciceParams.modele)  app.editor.focus()
  })
    if(!ExerciceParams.modele) {
    app.editor.session.on('change', function(delta) {
      window.setTimeout(app.updateLineCount,1)
      if(app.status == "running" && ExerciceParams.context !== "console"){
        app.context.interrupt()
        app.setStatus("waiting")
      }
    })
    app.editor.on('blur', function(delta){
      window.setTimeout(app.updateLineCount,1)
    })
    app.editor.on('click', function(delta){
      window.setTimeout(app.updateLineCount,1)
    })
    //Events après un changement dans l'éditeur
    app.editor.commands.on('afterExec', function(e){
      //Limiter le nombre de lignes et le nombre de caractères
      lines = app.editor.getValue()
      if(lines.length >= ExerciceParams.maxCharsEditor){
        lines = lines.slice(0,ExerciceParams.maxCharsEditor)
        app.editor.setValue(lines, 1)
      }
      lines = lines.split("\n")
      if(lines.length > ExerciceParams.maxLinesEditor){
        lines.splice(ExerciceParams.maxLinesEditor,Number.MAX_VALUE)
        app.editor.setValue(lines.join("\n"), 1)
      }

      //Dans un exercice où une fonction est définie
      if(ExerciceParams.codeBloque.length > 5){
        //Bloquer la première ligne
        initLines = ExerciceParams.codeBloque.split("\n")
        for(var i = 0; i < initLines.length-1; i++){
          if(initLines[i] !== lines[i]){
            app.editor.session.replace({
                start: {row: i, column: 0},
                end: {row: i, column: Number.MAX_VALUE}
            }, initLines[i])
          }
        }

        //Vérifier que tout est bien indenté
        if(ExerciceParams.forceIndent){
          for(var i = initLines.length-1; i < lines.length; i++){
            if(!lines[i].startsWith("    ")){
              if(lines[i].startsWith(" ")){
                app.editor.session.replace({
                    start: {row: i, column: 0},
                    end: {row: i, column: Number.MAX_VALUE}
                }, "    ")
              }
              if(lines[i] != ""){
                app.editor.session.replace({
                    start: {row: i, column: 0},
                    end: {row: i, column: Number.MAX_VALUE}
                }, "    "+lines[i])
                app.editor.moveCursorTo(i,Number.MAX_VALUE)
              }
            }
          }
        }
        //Empêcher les positions interdites du curseur
        var pos = app.editor.getCursorPosition()
        if(pos.row < initLines.length-1) app.editor.moveCursorTo(initLines.length-1,4*ExerciceParams.forceIndent)
      }
    })
  }

  if(!ExerciceParams.modele) app.editor.focus()

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl,{trigger: 'hover', delay: 100})
  })

  //On vérifie régulièrement que le contenu des lignes bloquées reste le même
  if(!ExerciceParams.modele) {
    window.setInterval(function(){
      lines = app.editor.getValue()
      initLines = ExerciceParams.codeBloque.split("\n")
      for(var i = 0; i < initLines.length-1; i++){
        if(initLines[i] !== lines[i]){
          app.editor.session.replace({
              start: {row: i, column: 0},
              end: {row: i, column: Number.MAX_VALUE}
          }, initLines[i])
        }
      }
    },5000)
  }

  //S'il y a un modèle, on applique sa fonction onLoad
  modele.onLoad()

});
