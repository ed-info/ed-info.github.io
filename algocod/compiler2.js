function operatorReplacements(code) {
	code = code.trimStart()

	code = code.replace(/ mod /g, " % ")
	code = code.replace(/ AND /g, " && ")
	code = code.replace(/ OR /g, " || ")

	code = code.replace(/ NOT /g, " ! ")
	code = code.replace(/ <> /g, " != ")

	code = code.replace(/\.append\(/, ".push(")

	return code
}

function extractStrings(code) {
    code = code + "\n"
	let strings = []
	let inString = false
    let inInlineComment = false
    let inMultilineComment = false
	let currentString = ""
	let program = []

    let inDiv = false
    inDivWillEnd = false
    let inDivBrackets = 0

	for (let i = 0; i < code.length; i++) {
        if (inInlineComment || inMultilineComment) {
            if (code[i] == "\n") {
                program.push("\n ")
                inInlineComment = false
            }
            if (code[i] == "/" && code[i - 1] == "*") {
                inMultilineComment = false
            }
        }
		else if (inString) {
			if (code[i] == '"') {
				inString = false
				strings.push(currentString)
				currentString = ""
				program.push(code[i])
			}
			else {
				currentString = currentString + code[i]
			}
		}
		else if (code[i] == '"') {
			inString = true
			program.push(code[i])
		}
        else if (inDiv) {
            if (code[i] == "(") {
                inDivBrackets += 1
            }
            if (code[i] == ")") {
                inDivBrackets -= 1
            }
            if (inDivBrackets == 0) {
                if (inDivWillEnd && (code[i] == " " || code[i] == "\n")) {
                    program.push(" | 0 ")
                    program.push(code[i])
                    inDiv = false
                }
                else {
                    if (code[i] != " ") {
                        inDivWillEnd = true
                    }
                    program.push(code[i])
                }
            }
            else {
                program.push(code[i])
            }

        }
        else if (code[i] == 'd' && code[i + 1] == 'i' && code[i + 2] == 'v' && code[i + 3] == ' ') {
            inDiv = true
            program.push("/")
            i += 2
        }
		else {
            if (code[i] == "/" && code[i + 1] == "/") {
                inInlineComment = true
                continue
            }
            if (code[i] == "/" && code[i + 1] == "*") {
                inMultilineComment = true
                continue
            }
			program.push(code[i])
		}
	}

	if (inString) {
		error("Помилка - маєте не закритий лапками текстовий рядок.")
	}



	return [program.join(''), strings]
}

let variables = {0: []}
let scope = 0
let stack = []
indent = 0

let lineNum = 1

function checkVariables(expression, lineNum) {
/*	
    if (/\w+\(.*\)/.test(expression)) {
        return true
    }
	let vars = expression.trim().split(/\s/)


	for (variable in vars) {
		vars[variable] = vars[variable].replace(/\.\w+[\)(\(.*\))]?/gi, "")
		if (vars[variable] != `""` && vars[variable].match(/[0-9]+/) != vars[variable] && vars[variable] != "" && vars[variable] != " " && vars[variable] != "true" && vars[variable] != "false") {
			let validVariable = false
			let scopeIterator = scope
			while (scopeIterator >= 0) {
				for (existingVariable in variables[scopeIterator]) {
					if (variables[scopeIterator][existingVariable] == vars[variable]) {
						validVariable = true
						break
					}
				}
                scopeIterator--
			}
			
			if (!validVariable) {
				output(vars)
				error(`Variable ${vars[variable]} is not defined on line ${lineNum}`)
				return false
			}
		}
	}
	*/
	
	return true
}
var fID; //animation function ID
var animateOn = false; //animation flag
function translateLine(line, lineNum) {
		
	if (line==="анімація") { // ідентифікатор для анімації
		fID = Date.now()
	}
	let kwords =[
	"кін фігура","endShape(CLOSE)",
	"кін ламана","endShape()",
	"кін анімація","},1000/60)}xf_anim"+fID+"();",
	"товщина","strokeWeight",
	"контур","noFill()",
	"фігура","beginShape()",
	"ламана","beginShape()",
	"вершина","vertex",
	"точка","point",
	"лінія","line",
	"прямокутник","rect",
	"трикутник","triangle",
	"чотирикутник","quad",
	"коло","circle",
	"еліпс","ellipse",
	"фон","background",
	"колір","stroke",
	"заповнення","fill",
	"ввести","input",
	"вивести","output",
	"істина","true",
	"хиба","false",
	"анімація","function xf_anim"+fID+"(){animateOn=true;setTimeout(function() {let _aID=window.requestAnimationFrame(xf_anim"+fID+");if ((keyIsPressed===true)||(onError===true)) {if ((keyCode === ESCAPE)||(onError===true)){window.cancelAnimationFrame(_aID);endOfRun()}} "
	];
	
	
	for (let i=0; i < kwords.length; i=i+2){
       line = line.replaceAll(kwords[i], kwords[i+1])
	}
	
	
	line = line.trim();
	line = line.replace(/\s{2,}/g, " ")
	let indentWillIncrease = false
    let allSpaces = true
    for (let i = 0; i < line.length; i++) {
        if (line[i] != " ") {
            allSpaces = false
            break
        }
    }
    if (allSpaces || line == "") {
		return ""
	}
	else if (line.startsWith("якщо ")) {	
	  if (line.split(" ")[line.split(" ").length - 1] != "то") {
            error(line.split(" ")[line.split(" ").length - 1])
			error("Помилка у рядку " + lineNum + ", після ʼякщоʼ відсутнє 'то'!")
         return false
		}

        line = line.replace(/ то/g, ") {")
		line = line.replace(/ = /g, " == ")
		line = line.replace(/якщо /, "if (")
		stack.push("якщо")
		indentWillIncrease = true
	}

	else if (line.startsWith("інакше якщо")) {
		if (line.split(" ")[line.split(" ").length - 1] != "то") {
			error("Помилка у рядку " + lineNum + ", після ʼякщоʼ відсутнє 'то'!")
            return false
		}

        line = line.replace(/ то/g, ") {")
        line = line.replace(/ = /g, " == ")
        line = line.replace(/інакше якщо /, "} else if (")
		indent--
		indentWillIncrease = true
	}

	else if (line.startsWith("інакше")) {
		indent--
		indentWillIncrease = true
		line = "} else {"
	}

	else if (line.startsWith("поки")) { // цикл поки
		stack.push("поки")
		line = line.replace(/цикл /, "")
        line = line.replace(/ = /g, " == ")
		line = line.replace(/поки /, "while (")
        line = line + ") {"
		indentWillIncrease = true
	}

	else if (line.startsWith("поки не")) { // цикл поки не
		stack.push("поки не")
        line = line.replace(/цикл /, "")
        line = line.replace(/ = /g, " == ")
		line = line.replace(/поки не /, "while (!(")
        line = line + ")) {"
		indentWillIncrease = true
	}

	else if (line.startsWith("для")) { //опрацьовуємо цикл  "для"
		stack.push("для")
		stp = line.search("крок") // перевірка на наявність "кроку"
		let incs="1"
		if (stp > 0){
			stps=line.slice(stp)
			line=line.slice(0,stp)
			incs=stps.slice(5)	
		}
        scope++
		variables[scope] = []
		variables[scope].push(line.split(" ")[1])
		let elements = line.replace(/для/, "").split(/ від /)
		let loopVar = elements[0]
		elements = elements[1].split(/ до /)
		let from = elements[0]
		let to = elements[1]
		if (!checkVariables(from, lineNum)) {
			return false
		}
		if (!checkVariables(to, lineNum)) {
			return false
		}
		indentWillIncrease = true
		line = `for (let ${loopVar} = ${from}; ${loopVar} <= ${to}; ${loopVar}+=${incs}) {`
		line = line.replace(/для /, "")
	}


	else if (line.startsWith("вивести ")) {
		if (!checkVariables(line.replace(/вивести /, ""), lineNum)) {
			return false
		}
		
		line = line.replace(/вивести /, "output(")
		line = line + ")"
	}

	else if (line.startsWith("ввести")) {
        variables[scope].push(line.split(" ")[1])
		line = line.split(" ")[1] + " = " + line.replace(/ввести/, "input('") + "')"

	}

    else if (line.startsWith("функція ")) {
        line = line.replace(/функція /, "function ") + "{"
		scope++
		variables[scope] = []
		if (/\(\w*\)/.test(line)) {
			variables[scope].push(line.match(/\(\w*\)/)[0].replace("(", "").replace(")", "").replace(" ", "").split(","))
		}
		
        stack.push("функція")
    }
    else if (line.startsWith("результат ")) {
        line.replace(/return /, "")
    }

	else if (line.startsWith("кін ")) {
		let flowEnded = line.split(" ")[1]
		let flowToEnd = stack.pop()

		if (flowEnded != flowToEnd) {
			error(`Помилка - кін ${flowToEnd} має бути перед кін ${flowEnded} у рядку ${lineNum}`)
            return false
		}

		indent--

		line = "}"
	}

	else {
        if (line.startsWith("[") || line.startsWith("{") || line.startsWith("}") || line.startsWith("]")) {
            return line
        }
		if (line.match( /\w+\(/ )) {
			line = line
		}
		else if (!(line.match("=")) && !(line.match(/\(/))) {
			error(`Помилка - у рядку ${lineNum} записано щось незрозуміле!`)
            return false
		}
//
//		else if(!(line.split(" ")[1] == "=") && !(/\w+\(/.test(line))) {
//			error(`Invalid variable definition on line ${lineNum}`)
//           return false
//		}

		variables[scope].push(line.split(" ")[0])
	}

	for (let i = 0; i < indent; i++) {
		line = "    " + line
	}

	if (indentWillIncrease) {
		indent++
	}

	return line
}

function compile(code) {
	
    let program = code

    let separatedProg = extractStrings(program)

    program = separatedProg[0]
    strings = separatedProg[1]

    console.log(program);

    program = operatorReplacements(program)

    let lines = program.split("\n")

    for (let i = 0; i < lines.length; i++) {
        lines[i] = translateLine(lines[i], i + 1)
        if (lines[i] === false) {
            return false
        }
    }

    code = lines.join("\n")

    lines = []

    let inString = false
    let nextString = 0

    for (let i = 0; i < code.length; i++) {
        if (code[i] == '"' && !inString) {
            lines.push(code[i])
            lines.push(strings[nextString++])
            inString = true
        }
        else {
            lines.push(code[i])
            inString = false
        }
        
    }

    code = lines.join("")
    
 let kcolors =["результат","return",'"червоний"',"'red'",'"помаранчевий"',"'orange'",'"жовтий"',"'yellow'",'"зелений"',"'green'",'"блакитний"',"'aqua'",'"синій"',"'blue'",'"фіолетовий"',"'violet'",'"чорний"',"'black'",'"сірий"',"'gray'",'"білий"',"'white'",'"коричневий"',"'brown'"];

	for (let i=0; i < kcolors.length; i=i+2){
       code = code.replaceAll(kcolors[i], kcolors[i+1])
	}
	



    console.log(code);

    return code
}
