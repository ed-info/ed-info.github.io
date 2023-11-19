function translate(line) {
  let kwords =["точка","point","лінія","line","прямокутник","rect","трикутник","triangle","чотирикутник","quad","коло","circle","еліпс","ellipse","фон","background","колір","stroke","заповнення","fill",'"червоний"',"'red'",'"помаранчевий"',"'orange'",'"жовтий"',"'yellow'",'"зелений"',"'green'",'"блакитний"',"'aqua'",'"синій"',"'blue'",'"фіолетовий"',"'violet'",'"чорний"',"'black'",'"сірий"',"'gray'",'"білий"',"'white'",'"коричневий"',"'brown'"];

	for (let i=0; i < kwords.length; i=i+2){
       line = line.replace(kwords[i], kwords[i+1])
	}
	
	console.log("*>"+line)	
	
	
    line = line.trimStart();  
    
    line = line.replace(/ mod /g, " % ");

    line = line.replace(/ AND /g, " && ");
    line = line.replace(/ OR /g, " || ");

    line = line.replace(/NOT/g, "!");
    line = line.replace(/<>/g, "!=");

    line = line.replace(/ то/, ") {")

    let sp = line.indexOf(" ");
    let first = "";

    if (line.startsWith("якщо")) {
        first = "якщо";
    } 
    else if (line.startsWith("інакше якщо")) {
        first = "інакше якщо";
    } 
    else if (line.startsWith("інакше")) {
        first = "інакше";
    } 
    else if (line.startsWith("цикл поки")) {
        first = "цикл поки";
    } 
    else if (line.startsWith("цикл для")) {
        first = "цикл для";
    } 
    else if (line.startsWith("цикл поки не")) {
        first = "цикл поки не";
    } 
    else if (line.startsWith("цикл ")) {
        first = "цикл ";
    } 
    else if (line.startsWith("вивести")) {
        first = "вивести";
    } 
    else if (line.startsWith("функія")) {
        first = "функція";
    } 
    else if (line.startsWith("Class")) {
        first = "class";
    } 
    else if (line.startsWith("ввести")) {
        first = "ввести";
    }
    else {
        if (sp >= 0) {
            first = line.substring(0, sp);
        }
    }
    if (first == "якщо" || first == "інакше якщо") {
        line = line.replace(/ = /g, " == ");
        line = line.replace("якщо ","if(");
        if (first == "інакше якщо") {
            line = line.replace("інакше якщо", "} \nelse if");
        }
    }
    if (first == "інакше") {
        line = line.replace("інакше", "}\nelse{");
    }
    if (first == "цикл поки") {
        line = line.replace("цикл поки", "while(") + "){";
    }
    if (first == "цикл для") {
        let v = line.indexOf("цикл для") + 9;
        let ve = line.indexOf(" ", v);
        let vname = line.substring(v, ve);

        let vs = line.indexOf(" від ") + 5;
        let vt = line.indexOf(" до ");
        let vstart = line.substring(vs, vt);

        let vend = line.substring(vt + 4);

        line =
            "for(" +
            vname +
            "=" +
            vstart +
            ";" +
            vname +
            "<=" +
            vend +
            ";" +
            vname +
            "++){";
    }
    if (first == "цикл поки не") {
        line = line.replace("цикл поки не", "while(!(") + ")){";
    }
    if (first == "цикл") {
        let v = line.indexOf("цикл") + 5;
        let ve = line.indexOf(" ", v);
        let vname = line.substring(v, ve);

        let vs = line.indexOf(" від ") + 5;
        let vt = line.indexOf(" до ");
        let vstart = line.substring(vs, vt);

        let vend = line.substring(vt + 4);

        line =
            "for(let " +
            vname +
            " = " +
            vstart +
            "; " +
            vname +
            " <= " +
            vend +
            "; " +
            vname +
            "++) {";
    }
    if (first == "кін") {
        line = "}";
    }
	if(first=="вивести")
	{  var t = line.indexOf("вивести")+7
		line = "output("+line.substring(t)+")"
	}
	
	if(first=="ввести")
	{
		var v = line.indexOf("ввести")+7
		var name = line.substring(v)
		line = name + " = input(\"" + name + "\")" 
	}
    if (first == "функція") {
        line = line.replace(/функція/, "function") + "{";
    }

    if (first == "class") {
        line = line.replace(/Class/, "function") + "{";
    }
     
 return line;
}

function compile(code) {
    document.querySelector(".runner").innerHTML = ""

    let program = code.split("\n");

    for (line in program) {
        program[line] = translate(program[line])
    }

    return program.join("\n")
}
