var t;
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},o=t.createElementNS("http://www.w3.org/1999/xhtml","a"),r="download"in o,i=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},a=e.webkitRequestFileSystem,c=e.requestFileSystem||a||e.mozRequestFileSystem,u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},f="application/octet-stream",s=0,d=500,l=function(t){var o=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove()};e.chrome?o():setTimeout(o,d)},v=function(e,t,n){t=[].concat(t);for(var o=t.length;o--;){var r=e["on"+t[o]];if("function"==typeof r)try{r.call(e,n||e)}catch(i){u(i)}}},p=function(e){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["﻿",e],{type:e.type}):e},w=function(t,u,d){d||(t=p(t));var w,y,m,S=this,h=t.type,O=!1,R=function(){v(S,"writestart progress write writeend".split(" "))},b=function(){if((O||!w)&&(w=n().createObjectURL(t)),y)y.location.href=w;else{var o=e.open(w,"_blank");void 0==o&&"undefined"!=typeof safari&&(e.location.href=w)}S.readyState=S.DONE,R(),l(w)},g=function(e){return function(){return S.readyState!==S.DONE?e.apply(this,arguments):void 0}},E={create:!0,exclusive:!1};return S.readyState=S.INIT,u||(u="download"),r?(w=n().createObjectURL(t),o.href=w,o.download=u,void setTimeout(function(){i(o),R(),l(w),S.readyState=S.DONE})):(e.chrome&&h&&h!==f&&(m=t.slice||t.webkitSlice,t=m.call(t,0,t.size,f),O=!0),a&&"download"!==u&&(u+=".download"),(h===f||a)&&(y=e),c?(s+=t.size,void c(e.TEMPORARY,s,g(function(e){e.root.getDirectory("saved",E,g(function(e){var n=function(){e.getFile(u,E,g(function(e){e.createWriter(g(function(n){n.onwriteend=function(t){y.location.href=e.toURL(),S.readyState=S.DONE,v(S,"writeend",t),l(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&b()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=S["on"+e]}),n.write(t),S.abort=function(){n.abort(),S.readyState=S.DONE},S.readyState=S.WRITING}),b)}),b)};e.getFile(u,{create:!1},g(function(e){e.remove(),n()}),g(function(e){e.code===e.NOT_FOUND_ERR?n():b()}))}),b)}),b)):void b())},y=w.prototype,m=function(e,t,n){return new w(e,t,n)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(e,t,n){return n||(e=p(e)),navigator.msSaveOrOpenBlob(e,t||"download")}:(y.abort=function(){var e=this;e.readyState=e.DONE,v(e,"abort")},y.readyState=y.INIT=0,y.WRITING=1,y.DONE=2,y.error=y.onwritestart=y.onprogress=y.onwrite=y.onabort=y.onerror=y.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!=define.amd&&define([],function(){return saveAs});
function animateTitle(txt, id) {
	var chars = "0123456789ABCDEF";
    var finalChars = txt.split('');

	var jq = $('#' + id);

	var letterCount = -10;
	function onAnimTimeout() {
		var randomChars = "";
		if(letterCount >=0 ) {
			randomChars = txt.substring(0, letterCount);
		}

		randomChars += '<span class="randomChars">';
		for(var i = (letterCount < 0)?0:letterCount; i < txt.length; i++) {
			var c = Math.floor(Math.random() * chars.length);
			randomChars += chars[c];
		}
		randomChars += '</span>';


		jq.html(randomChars);
		letterCount++;
		clearTimeout(t);
		if(letterCount <= txt.length) {
			t = setTimeout(onAnimTimeout, 50);
		}
	}

	t = setTimeout(onAnimTimeout, 50);

}

var PythonIDE = {
	updateConsoleSize: function() {
		var h = $('#output').height() - $('#headerOut').height();
		if(h < 100) {
			h = 100;
		}
		$('#consoleOut').css({
			'max-height': h + "px"
		});
	},
	debugHandler: function(result) {
		var c = result;
		if(!c)
			return;
		var filename = PythonIDE.currentFile;
		while(c.child) {
			lineNumber = c.$lineno;
			c = c.child;
			if(c.filename)
				filename = c.filename;
		}
		filename = filename.replace("./", "");
		//console.log(filename, lineNumber);
		var breakpoint = false;
		if(PythonIDE.breakpoints[filename] && PythonIDE.breakpoints[filename][lineNumber] && PythonIDE.continueRunning) {
			PythonIDE.showHint("Призупинено через точку зупинки на лінії " + (lineNumber));
			$('#btn_showREPL').show();
			breakpoint = true;
			PythonIDE.editFile(filename, lineNumber);
			PythonIDE.continueRunning = false;
			PythonIDE.runMode = "paused";
			//debugger;
		}
		
//		console.log(PythonIDE.runMode, breakpoint);
		///
		// globals
		PythonIDE.currentScope = {};
		var susp = result;
		if(true || PythonIDE.runMode == "step" || breakpoint) {
			var html = '<i id="btnToggleGlobals" class="fa fa-arrows-h"></i> <div id="globals"><h3>Global variables: </h3><table><tr><th>Name</th><th>Data type</th><th>Value</th></tr></div>';
			PythonIDE.watchVariables.expandHandlers = [];
			var context = susp;
			if(context.child && context.child.$gbl) {
				context = context.child;
			}
	
			for(var key in context.$gbl) {
				var pyVal = context.$gbl[key];
				PythonIDE.currentScope[key] = pyVal;
				var type = PythonIDE.getPyType(pyVal);
				if(type == undefined) {
					continue;
				}
				if(type == "function"){
					continue;
				}
				if(key.match(/__.*__/)) {
					continue;
				}
				var val = "";
				try {
					val = Sk.ffi.remapToJs(Sk.builtin.repr(pyVal));	
				} catch(e) {
					//debugger;
					val = "ERROR: " + type;
				}
				
	
				if(val === undefined) {
					val = "";
				}
	
				if(val && val.length && val.length > 20) {
					var eH = {"id":PythonIDE.watchVariables.expandHandlers.length, "fullText": val, "shortText": val.substring(0,17)};
	
					PythonIDE.watchVariables.expandHandlers.push(eH);
					val = '<span class="debug_expand_zone" id="debug_expand_' + eH.id + '">' + val.substring(0, 17) + '<img src="./media/tools.png" class="debug_expand" title="Click to see full value"></span>';
				}
	
				html += '<tr><td>' + key + '</td><td>' + type + '</td><td>' + val + '</td></tr>';
			}
			html += '</table>';

			context = susp.child;
			while(context && context.$tmps && context.$lineno) {
			
				html += '<h4>Local Variables from line ' + context.$lineno + '</h4><table><tr><th>Name</th><th>Data Type</th><th>Value</th></tr>';
				
				for(var key in context.$tmps) {
					var pyVal = context.$tmps[key];
					PythonIDE.currentScope[key] = pyVal;
					if(pyVal) {
						var type = PythonIDE.getPyType(pyVal);
						if(type != undefined && type != "function" && key[0] != "$") {
							var val = "";
							try {
								val = Sk.ffi.remapToJs(Sk.builtin.repr(pyVal));
							} catch(e) {
								//debugger;
								val = "ERROR!: " + type;
							}
							html += '<tr><td>' + key + '</td><td>' + type + '</td><td>' + val + '</td></tr>';		
						}
						
					}
					
				}
			
				html += '</table>';
				context = context.child;
			}
	
	
	
			$('#watch').html(html);
			$('#btnToggleGlobals').click(function() {
				PythonIDE.showGlobalVariables = !PythonIDE.showGlobalVariables;
				if(PythonIDE.showGlobalVariables) {
					$('#watch').css({"max-width":"30%"});
				} else {
					$('#watch').css({"max-width":"2em"});
				}
				
			});
	
			$('span.debug_expand_zone').click(function(e) {
				var id = e.currentTarget.id;
				var idNum = id.replace("debug_expand_", "");
				$('#' + id).html(PythonIDE.watchVariables.expandHandlers[idNum].fullText);
			});
		}

		var p = new Promise(function(resolve,reject){
			PythonIDE.continueDebug = function() {
				if(PythonIDE.runMode != "step" && PythonIDE.running) {
					requestAnimationFrame(function() {PythonIDE.runCode(PythonIDE.runMode); });
				}
				return resolve(susp.resume());
			}

			PythonIDE.abortDebug = function() {
				delete PythonIDE.abortDebug;
				delete PythonIDE.continueDebug;
				PythonIDE.running = false;
				return reject("Program aborted");
			}

		});
		return p;
		///

		if(PythonIDE.continueRunning) {
			delete PythonIDE.continueDebug;
			PythonIDE.runToEnd();
			return result;	
		} else {
			if(breakpoint) {
				var p = new Promise(function(resolve,reject){
					PythonIDE.continueDebug = function() {
						setTimeout(function() {PythonIDE.runCode(PythonIDE.runMode); }, 100);
						return resolve(result);
					}

					PythonIDE.abortDebug = function() {
						delete PythonIDE.abortDebug;
						delete PythonIDE.continueDebug;
						PythonIDE.running = false;
						return reject("Program aborted");
					}

				});
				return p;
			}
			return result;
		}
		
	},

	login: function() {
		$('#login').dialog('open');
	},

	editFile: function(filename, lineno) {
		filename = filename.replace("./", "");
		if(filename == PythonIDE.projectName + ".py") {
			filename = "mycode.py";
		}
		if(!lineno)
			lineno = 1;

		if(filename != PythonIDE.currentFile) {
			if(undefined === PythonIDE.files[filename]) {
				return;
			}
			if(PythonIDE.files[PythonIDE.currentFile]) {
				PythonIDE.files[PythonIDE.currentFile] = PythonIDE.editor.getValue();
			}
			PythonIDE.currentFile = filename;
			PythonIDE.disableChangeEvent = true;
			PythonIDE.editor.setValue(PythonIDE.files[filename]);
			
			PythonIDE.disableChangeEvent = false;
			//PythonIDE.editor.focus();

			var extension = filename.match(/(\.[^.]+)/);
			if(extension.length > 1)
				extension = extension[1];
			switch(extension) {
				case '.py':
					PythonIDE.editor.setOption("mode", "python");
				break;
				case '.html':
					PythonIDE.editor.setOption("mode", "htmlmixed");
				break;
				case '.json':
					PythonIDE.editor.setOption("mode", "javascript");
				break;
				case '.css':
					PythonIDE.editor.setOption("mode", "css");
				break;
				case '.js':
					PythonIDE.editor.setOption("mode", "javascript");
					break;
				default:
					PythonIDE.editor.setOption("mode", "");
				break;
			}

			if(PythonIDE.breakpoints[filename]) {
				for (var line in Object.keys(PythonIDE.breakpoints[filename])) {
					PythonIDE.addBreakpoint(filename, line);
				}
			}

			PythonIDE.updateFileTabs();
			PythonIDE.editor.refresh();

		}
		PythonIDE.editor.setCursor(lineno - 1);
	},

	updateFileTabs: function() {
		var html = '';
		for(var file in PythonIDE.files){
			if(file == "tests.json" && (!localStorage.debug || PythonIDE.lti)) {
				continue;
			}
			if(file == 'mycode.py'){
				file = PythonIDE.projectName + ".py";
			}
			html += '<span class="file_tab';
			if((file == PythonIDE.currentFile) || (file == PythonIDE.projectName + ".py") && (PythonIDE.currentFile == "mycode.py")) {
				html += ' file_tab_selected">'
				if(file != 'mycode.py') {
					html += '<img class="btn_file_settings" alt="File settings" title="File settings" src="./media/settings.png">';
				}
			} else {
				html += '">';
			}
			html += file + '</span> ';
		}
		html += '<span class="file_tab"><img class="btn_file_settings" alt="Створити новий файл" title="Створити новий файл" src="./media/tools.png"></span>';
		$('#file_tabs').html(html);
		$('.file_tab').click(function(e) {
			var fileName = e.currentTarget.textContent;
			if(fileName == PythonIDE.projectName + ".py") {
				fileName = "mycode.py";
			}
			switch(fileName) {
				case "":
					fileName = 'newfile.txt';
					if(PythonIDE.files[fileName] === undefined){
						PythonIDE.files[fileName] = '';
					}
					PythonIDE.editFile('newfile.txt');
					break;
				case PythonIDE.currentFile:
					if(fileName == "mycode.py") {
						$('#txt_project_name').val(PythonIDE.projectName);
						$('#project_settings').dialog("open");
					} else {
						$('#file_settings').dialog("open");
						$('#txt_file_name').val(fileName).focus();
					}
					break;
				default:
					PythonIDE.editFile(e.currentTarget.textContent);
					break;
			}

		});
	},

	projectName: 'mycode',

	currentFile: 'mycode.py',

	countFiles: function() {
		var c = 0;
		for(var f in PythonIDE.files) {
			c++;
		}
		return c;
	},

	files: {'mycode.py':''},

	readFile: function(filename) {
		filename = filename.replace("./", "");
		if(Sk.builtinFiles.files[filename]) {
			return Sk.builtinFiles.files[filename];
		}
		return PythonIDE.files[filename];
	},

	openFile: function(file) {
		switch(Sk.ffi.remapToJs(file.mode)[0]) {
			case 'w':
				PythonIDE.files[file.name] = "";
				PythonIDE.updateFileTabs();
			break;
			case 'r':
				if(PythonIDE.files[file.name] === undefined) {
					throw new Sk.builtin.IOError("No such file or directory: '" + file.name + "'");
				}
			break
			case 'a':
				if(PythonIDE.files[file.name] === undefined) {
					PythonIDE.files[file.name] = "";	
				}
				file.data$ = PythonIDE.files[file.name];	
				file.pos$ = file.data$.length;
			break;
			case 'x':
				if(PythonIDE.files[file.name] !== undefined) {
					throw new Sk.builtin.IOError("File already exists");
				}
				PythonIDE.files[file.name] = "";
				PythonIDE.updateFileTabs();
			break;
		}
	},

	writeFile: function(file, contents) {
		if(!Sk.builtin.checkString(contents)) {
			throw new Sk.builtin.TypeError("write() arguments must be str, not " + contents.tp$name); 
		}
		var before = file.data$.substr(0, file.pos$);
		file.data$ = before + Sk.ffi.remapToJs(contents).toString();
		file.pos$ = file.data$.length;
		
		file.lineList = file.data$.split("\n");
        file.lineList = file.lineList.slice(0, -1);

        for (i in file.lineList) {
            file.lineList[i] = file.lineList[i] + "\n";
        }
        file.currentLine = 0;
		
		PythonIDE.files[file.name] = file.data$;
		PythonIDE.updateFileTabs();
	},

	welcomeMessage: "Натисніть Ctrl+Enter, щоб виконати код",

	getOption: function(optionName, defaultValue) {
		if(localStorage && localStorage['OPT_' + optionName])
			return localStorage['OPT_' + optionName]
		return defaultValue;
	},

	setOption: function(optionName, value) {
		localStorage['OPT_' + optionName] = value;
		return value;
	},

	showHint: function(msg) {
		if(PythonIDE.hideHintTimeout) {
			clearTimeout(PythonIDE.hideHintTimeout);
		}
		PythonIDE.hideHintTimeout = setTimeout(function(){
			delete PythonIDE.hideHintTimeout;
			$('#hintBar').fadeOut();
		}, 5000);
		$('#hintBar').html(msg).show();
	},
	
	sanitize: function(input) {
		return $("<div/>").text(input).html();
	  function replace(match) {
		// allow attributes for images and links except for event handlers
		if(match.match(/^\s*(href|src)/i)) {
			return match.replace(/on[a-z]+\s*=\s*(("[^"]*")|('[^']*'))/i, "");

		}
		return "";
	  }
	  var white="b|i|p|br|a|img";//allowed tags
	  var black="script|object|embed";//complete remove tags
	  var e=new RegExp("(<("+black+")[^>]*>.*<\\/2>|(?!<[\\/]?("+white+")(\\s[^<]*>|[\\/]>|>))<[^<>]*>|(?!<[^<>\\s]+)\\s[^<\\/>]+(?=[\\/>]))", "gi");
	  output = input.replace(e,replace);
	  
		return output;
	},

	python: {
		repl: function(code) {
			if(code == undefined) {
				Sk.inputfun(">>> ").then(function(result) {
					if(result.length > 0) {
						PythonIDE.python.repl(result);
						PythonIDE.python.repl();
					}
				}).catch(PythonIDE.handleError);
			} else {
				var outputResult = true;
				if(code.match(/\s*import/)) {
					outputResult = false;
				} else {
					code = "__result = " + code;	
				}
				var r = eval(Sk.compile(code, "repl", "exec", true).code)(PythonIDE.currentScope?PythonIDE.currentScope:Sk.globals);
				var startTime = new Date().getTime();
				while(r.$isSuspension) {
					if(r.data.promise) {
						r.data.promise.then(function(result) {
							if(outputResult) {
								PythonIDE.python.output(Sk.ffi.remapToJs(Sk.builtin.repr(result)));	
							}
						}).catch(PythonIDE.handleError);
					} else {
						r = r.resume();
					}
					var now = new Date().getTime();
					if(now - startTime > 5000) {
						PythonIDE.showHint("Зупинено через 5 секунд, щоб запобігти збою у роботі вебпереглядача");
						break;
					}
				} 
				if(r.__result && outputResult) {
					PythonIDE.python.output(Sk.ffi.remapToJs(Sk.builtin.repr(r.__result)));
				}	
			
			}
			
		},

		outputListeners: [],

		outputSanitized: function(text, header) {
			PythonIDE.python.output(text, header, true);
		},

		output: function(text, header, sanitized) {
			if(PythonIDE.runningTests)
				return;
			var id = header == undefined?'consoleOut': 'headerOut';
			var c = document.getElementById(id);
			if(!c) {
				console.error(text);
				return;
			}
			if(sanitized) {
				text = PythonIDE.sanitize(text);
				c.innerHTML += text;
			} else {
				c.innerHTML += text;
			}


			var i = 0;
			while(i < PythonIDE.python.outputListeners.length) {
				var l = PythonIDE.python.outputListeners[i];
				try {
					l(text);
					i++;
				} catch(e) {
					PythonIDE.python.outputListeners.splice(i, 1);
				}
			}
			//var c = c.parentNode.parentNode;
			c.scrollTop = c.scrollHeight;

		},

		clear: function() {
			var c = document.getElementById('consoleOut');
			c.innerHTML = '';
			var c = c.parentNode.parentNode;
			c.scrollTop = c.scrollHeight;
		},

		builtinread: function(x) {
			if(x.slice(0,2) == "./") {
				var f = x.slice(2);
				if(PythonIDE.files[f]) {
					return PythonIDE.files[f];
				}
			}
			if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
			return Sk.builtinFiles["files"][x];
		}
	},

	runAsync: function(asyncFunc) {
		var p = new Promise(asyncFunc);
		var result;
		var susp = new Sk.misceval.Suspension();
		susp.resume = function() {
			return result;
		}
		susp.data = {
			type: "Sk.promise",
			promise: p.then(function(value) {
				result = value;
				return value;
			}, function(err) {
				result = "";
				PythonIDE.handleError(err);
				return new Promise(function(resolve, reject){
				});
			})
		};
		return susp;
	},

	watchVariables: {
		expandHandlers:[]
	},

	vault: localStorage.vault?JSON.parse(localStorage.vault):[],

	recover: function() {
		PythonIDE.saveSnapshot();
		var html = '<p>A copy of your code is saved in your browser every time you run it.</p>';
		html += '<p>Number of code backups currently stored in the vault:' + PythonIDE.vault.length + '</p>';
		html += '<div id="slider_recover"></div><span id="recover_time">Drag the slider to go back in time and recover your code</span>';

		html += '<p><button id="btn_recover">Recover</button></p>';
		html += '<p>If more than one person on this computer uses the same login you may wish to clear all of the code stored in the recovery vault.</p><p><i class="fa fa-warning"></i> Be careful: once you\'ve pressed Delete all you can\'t go back.</p>';
		html += '<p><button id="btn_recover_clear">Delete all</button></p>';


		$('#recover').html(html).dialog("open").parent().css({'opacity':0.8});
		$('#slider_recover').slider({
			min: 0,
			max: PythonIDE.vault.length - 1,
			value: PythonIDE.vault.length - 1,
			slide: function(event, ui) {
				var snapshot = PythonIDE.vault[ui.value];
				var d = new Date(snapshot.date);
				PythonIDE.files = JSON.parse(snapshot.files);
				PythonIDE.currentFile = "mycode.py";
				PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
				PythonIDE.updateFileTabs();
				PythonIDE.editor.setCursor(0);
				var ds = "" + (d.getMonth() + 1) + "/" + (d.getDate()) + "/" + d.getFullYear();
				var hours = d.getHours() % 12;
				if(hours == 0) {
					hours = 12;
				}
				var days = "Sun,Mon,Tue,Wed,Thu,Fri,Sat,Sun".split(",");
				var months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");
				function pad2(s){s = s.toString();return s.length < 2?"0"+s:s;}
				$('#recover_time').html('<p class="recover_date">' + days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + '</p><p class="recover_label">Recovery time:</p><span id="recover_time_hours">' + (pad2(hours)) + '</span><span id="recover_time_mins">' + pad2(d.getMinutes()) + '</span><span id="recover_time_ampm">' + ((d.getHours() >= 12)? "PM" : "AM") + '</span>');

			}
		});

		$('#btn_recover_clear').button().click(function(){
			PythonIDE.vault = [];
			PythonIDE.recover();
		});
		$('#btn_recover').button().click(function() {
			$('#recover').dialog("close");
		});
	},

	tag: '',

	sendSnapshot: function(snapshot) {
		var cursor = PythonIDE.editor.getCursor();
		PythonIDE.api('save_code_snapshot', {
			url: location.href + PythonIDE.tag,
			code: snapshot.files,
			line: cursor.line,
			ch: cursor.ch
		}, function(r) {
			if(!PythonIDE.aT) {
				PythonIDE.aT = {};
			}						
			if(!PythonIDE.aT[PythonIDE.hash]) {
				PythonIDE.aT[PythonIDE.hash] = {};
			}
			PythonIDE.aT[PythonIDE.hash].t = Date.now();
			PythonIDE.aT[PythonIDE.hash].c = PythonIDE.files;
			localStorage.aT = JSON.stringify(PythonIDE.aT);
		});
	},

	saveSnapshot: function(submit) {
		if(submit === undefined) {
			submit = true;
		}
		var snapshot = {date: Date.now(), files: JSON.stringify(PythonIDE.files)};
		if(PythonIDE.currentGroup && submit) {
			PythonIDE.sendSnapshot(snapshot);
		}
		while(PythonIDE.vault.length > 50) {
			PythonIDE.vault = PythonIDE.vault.slice(1);
		}
		var match = false;
		for(i = 0; i < PythonIDE.vault.length; i++) {
			if(i == PythonIDE.vault.length - 1 && PythonIDE.vault[i].files == snapshot.files) {
				PythonIDE.vault[i].date = snapshot.date;
				match = true;
			}
		}
		if(!match) {
			PythonIDE.vault.push(snapshot);
		}

		localStorage.vault = JSON.stringify(PythonIDE.vault);
	},

	showGlobalVariables: true,

	hash: "/",

	runTests: function(options) {
		if(options === undefined) {
			options = {};
		}
		//console.log(PythonIDE.code)
		/// TODO: save code if being tracked
		var runTests = PythonIDE.files['tests.json'] !== undefined;
		if(!runTests && !PythonIDE.lti) {
			return;
		}
		if(PythonIDE.running){
			if(PythonIDE.whenFinished) {
				var f = PythonIDE.whenFinished;
				PythonIDE.whenFinished = function() {
					f();
					PythonIDE.runTests();
				}
			} else {
				PythonIDE.whenFinished = PythonIDE.runTests;
			}
			return;
		}
		if(String.prototype.includes === undefined) {
			String.prototype.includes = function (str) {
				var returnValue = false;

				if (this.indexOf(str) !== -1) {
					returnValue = true;
				}

				return returnValue;
			}
		}

		if (!Array.prototype.includes) {
			Object.defineProperty(Array.prototype, "includes", {
				enumerable: false,
				value: function(obj) {
				    var newArr = this.filter(function(el) {
				      return el == obj;
				    });
				    return newArr.length > 0;
				  }
				});
			}
		$('#tests').remove();
		var html = '<div id="tests"><div class="tiny">tests:</div><span class="tests_score"><i class="fa fa-gear fa-spin"></i></span></div>';
		$('body').append(html);
		$('#tests').click(function() {
			$('#dlg').dialog('option', 'title', "Tests");
			$('#output').html(html);
			$('#dlg').dialog("open");
		});

		
		var sanitizedCode = PythonIDE.files['mycode.py'];
		if(options.sanitize) {

			// replace multiline strings
			sanitizedCode = sanitizedCode.replace(/"""[\s\S]*?"""/, function(m) {
				var s = "";
				for(var i = 0; i < m.length; i++) {
					s+=m[i] == "\n"?"\n":"~";
				}
				
				return s;
			});

			// replace strings with same length whitespace
			sanitizedCode = sanitizedCode.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, function(m) {
				var s = "'";
				for(var i = 1; i < m.length - 1; i++) {
					s+=" ";
				}
				s += "'"
				return s;
			})

			// strip comments
			sanitizedCode = sanitizedCode.replace(/#.*$/mg, function(m) {
				var s = "#";
				for(var i = 1; i < m.length; i++) {
					s+=" ";
				}
				return s;	
			});
		}

		function cmp(a, b, match) {
			if(match===undefined) {
				match = "=";
			}
			if(Array.isArray(a)) {
				if(Array.isArray(b)) {
					if(a.length != b.length) {
						return false;
					}
					for(var i = 0; i < a.length; i++) {
						if(!cmp(a[i], b[i], match)) {
							return false;
						}
					}
					return true;
				} else {
					for(var i = 0; i < a.length; i++) {
						if(cmp(a[i], b, match)) {
							return true;
						}
					}
					return false;	
				}
				
			}

			switch(match) {
				case 'contains':
					return a.includes(b);
				break;

				case '=':
					return a == b;
				break;

				case '>':
					return a > b;
					break;

				case '<':
					return a < b;
					break;

				case '>=':
					return a >= b;
					break;

				case '<=':
					return a <= b;
					break;

				case 'regex':
					var m = b.match(/\/(.*)\/(.+)/);
					var flags = '';
					var r = b;
					if(m) {
						r = m[1];
						flags = m[2];
					}
					return a.match(new RegExp(r, flags));
					break;
			}
			return false;
		}

		function testCondition(condition) {

			function compare(a, b, match) {
				if(condition.process) {
					if(condition.process.includes("join")) {
						if(Array.isArray(a)) {
							a = a.join("\n");
						}
					}

					if(condition.process.includes("lines")) {
						if(Array.isArray(a)) {
							for(var i = 0; i < a.length; i++) {
								a[i] = a[i].split("\n");
							}
						} else {
							a = a.split("\n");	
						}
					}

					if(condition.process.includes("ignoreblanks")) {
						a = a.filter(function(e) {
							switch(e) {
								case undefined:
								case "":
									return false;
								default:
									return true;
							}
						});
					}

					if(condition.process.includes("count")) {
						a = a.length;
					}

					if(condition.process.includes("length")) {
						a = a.length;
					}

					if(condition.process.includes("lower")) {
						if(Array.isArray(a)) {
							for(var i = 0; i < a.length; i++) {
								a[i] = a[i].toLowerCase();
							}
						} else {
							a = a.toLowerCase();
						}
						
					}

					if(condition.process.includes("upper")) {
						if(Array.isArray(a)) {
							for(var i = 0; i < a.length; i++) {
								a[i] = a[i].toUpperCase();
							}
						} else {
							a = a.toUpperCase();
						}
						
					}
				}
				

				var m = false;
				if(match == undefined)
					match = "=";

				if(Array.isArray(a)) {
					for(var i = 0; i < a.length; i++) {
						if(cmp(a, b, match)) {
							m = true;
						}
					}
					return m;
				} else {
					return cmp(a, b, match);
				}
			}

			if(condition.met === undefined) {
				var item = "";
				switch(condition.search) {
					case 'file':
						if(condition.name) {
							item = PythonIDE.files[condition.name];	
						} else {
							item = Object.keys(PythonIDE.files);
						}
						break;
					case 'code':
						item = sanitizedCode;
						break;
					case 'errors':
						item = errors;
						break;
					case 'output':
						item = output;
						break;
					case 'input':
						item = input;
						break;
					case 'globals':
						if(condition.name) {
							item = globals[condition.name];
							if(condition.process && condition.process.includes("name lower")) {
								var varNames = Object.keys(globals);
								for(var v = 0; v < varNames.length; v++) {
									if(varNames[v].toLowerCase() == condition.name) {
										item = globals[varNames[v]];
										break;
									}
								}
							}
							
							if(item && condition.property && condition.property == "type") {
								item = item.type;
							} else {
								if(item) {
									item = item.value;									
								}
							}	
						} else {
							item = Object.keys(globals);
						}
						
						break;
				}
				condition.met = compare(item, condition.for, condition.match);
				if(condition.process && condition.process.includes("not")) {
					condition.met = !condition.met;
				}
			}
		}

		html = "";

		if(PythonIDE.lti && !PythonIDE.files['tests.json']) {
			PythonIDE.files['tests.json'] = '{"expect":[{"search":"errors","process":["count"],"for":0}]}';
		}
		if(PythonIDE.files['tests.json']) {
			try {
				var tests = JSON.parse(PythonIDE.files['tests.json']);
			} catch (e) {
				var msg = e.toString();
				var r = /position (\d+)/;
				var m = r.exec(msg);
				var pos = 0;
				var line = 1;
				if(m) {
					pos = m[1];
					var cPos = 0;
					var lines = PythonIDE.files['tests.json'].split("\n");
					for(line = 0; line < lines.length; line++) {
						cPos += lines[line].length + 1;
						if(cPos >= pos) {
							break;
						}
					}
					line++;
				}
				$('#test_results').html('<h2>Error processing tests file:</h2>Line ' + line + ':' + e.toString());
				$('.tests_score').html(0 + "%");
				$('#tests').css({'background-color':'hsl(0,100%, 40%)'});
				return e;
			}
			var handlers = [];
			var output = [];
			var input = [];
			var globals = [];

			var lineCount = 0;
			var maxLines = 1000;
			if(tests.limit) {
				maxLines = tests.limit;
			}
			Sk.TurtleGraphics.animate = false;
			PythonIDE.runningTests = true;
			handlers["Sk.debug"] = function(susp) {
				globals = [];
				if(susp && susp.child && susp.child.$gbl) {
					for(var key in susp.child.$gbl) {
						var v = susp.child.$gbl[key];
						globals[key] = {
							name: key,
							value: Sk.ffi.remapToJs(v),
							type: PythonIDE.getPyType(v)
						};	
					}
					
				}
				if(lineCount++ > maxLines) {
					var p = new Promise(function(resolve, reject) {
						reject("too many lines");	
					});	
					return p;
				}
				return false;
			}

			Sk.inputfun = function(prompt) {
					input.push(prompt);
					if(tests.provide) {
						for(var i = 0; i < tests.provide.length; i++) {
							var p = tests.provide[i];
							if(p.search && p.search == "input") {
								if(cmp(prompt, p.for, p.match)) {
									return p.provide;
								}
							}
						}
					}
					return "";
				}
			
			Sk.configure({
				breakpoints:function(filename, line_number, offset, s) {
					return true;
				},
				debugging: true,
				output: function(e) {
					output.push(e.substring(0, e.length - 1));
				},
				filewrite: PythonIDE.writeFile,
				fileopen: PythonIDE.openFile,
				read: PythonIDE.readFile,
				inputfunTakesPrompt:true
			});
			
			var errors = [];

			html += '<h3>Testing mycode.py:</h3><div id="canvas" style="display:none"></div>';
			var code = PythonIDE.files['mycode.py'];
			if(tests && tests.code && tests.code.suffix) {
				code += "\n" + tests.code.suffix;
			}
			code += "\npass";
			var fileBackup = JSON.parse(JSON.stringify(PythonIDE.files));
			var mod;
			var p = Sk.misceval.callsimAsync(handlers, function() {
				return Sk.importMainWithBody("mycode",false,code,true);
			}).then(function(module){
				mod = module;
			}, function(e) {
				errors.push(e.toString());
			});

			p.then(function() {
				setTimeout(function() {
					PythonIDE.runningTests = false;	
				}, 100);
				
				/*if(localStorage.debug) {
					console.log("mod:", mod);
					console.log("errors:", errors);
					console.log("input:", input);
					console.log("output", output);
					console.log("globals", globals);
					console.log("code", code);
				}*/
				PythonIDE.lastTest = {
					mod: mod,
					errors: errors,
					input: input,
					output: output,
					globals: globals,
					code: code
				};
				if(localStorage.debug) {
					console.log(PythonIDE.lastTest);
				}
				
				html += '<table class="testing_table"><tr><th>Test</th><th>Description</th><th>Pass</th></tr>';
				var score = 0;
				var passed = 0;
				if(tests.expect) {
					for(var j = 0; j < tests.expect.length; j++) {
						var c = tests.expect[j];
						var process = "";
						if(c.process) {
							process = c.process.join(" ");
						}
						if(c.match == undefined) {
							c.match = "=";
						}
						if(c.description == undefined) {
							switch(c.search) {
								case "file":
									if(c.name) {
										c.description = "File " + c.name + " " + c.match + " '" + c.for + "'"; 
									} else {
										c.description = "Create a file called " + c.for;
									}
								break;
								case "input":
									c.description = "Ask '" + c.for + "'";
								break;
								case "output":
									c.description = "Display '" + c.for + "'";
								break;
								case "globals":
									if(c.name) {
										c.description = "Store the value " + c.for + " into a variable called " + c.name;	
										if(c.property && c.property=="type") {
											c.description = "Make sure the variable " + c.name + " stores a " + c.for;	
										}
									} else {
										c.description = "Create a variable called " + c.for;
									}
								break;
								case "errors":
									c.description = "Error message " + process + " " + c.match + " " + c.for;
								break;
								case "code":
									c.description = "Source code " + process + " " + c.match + " " + c.for;
								break;
							}
						}
						try {
							testCondition(c);	
						} catch (e) {
							console.log(e);
						}
						
						if(c.met) {
							passed++;
						}
						html += '<tr><td>' + (j+1) + '</td>';
						html += '<td>' + c.description + '</td>';
						html += '<td>' + (c.met?'<span class="pass"><i class="fa fa-check"></i> Pass</span>':'<span class="fail"><i class="fa fa-close"></i> Fail</span>') + '</td></tr>';
					}
					PythonIDE.aT[PythonIDE.hash].m = tests.expect.length;
					PythonIDE.aT[PythonIDE.hash].s = passed;
					PythonIDE.aT[PythonIDE.hash].t = Date.now();
					PythonIDE.aT[PythonIDE.hash].c = PythonIDE.files;
					localStorage.aT = JSON.stringify(PythonIDE.aT);
					if(tests.expect.length > 0) {
						score = Math.round(passed / tests.expect.length * 100);
					}
				}
				html += '</table>';
				$('#test_results').html(html);
				$('.tests_score').html(score + "%");
				if(PythonIDE.lti && PythonIDE.lti.check && PythonIDE.lti.check) {
					if(PythonIDE.lti.submitted != score) {
						$.getJSON('/lib/api.php?cmd=lti_report_grade', {
							check: PythonIDE.lti.check,
							grade: score,
							act: PythonIDE.lti.id
						}, function(e) {
							if(e.success) {
								PythonIDE.showHint("Збережений рахунок: " + score + "%");
								PythonIDE.lti.submitted = score;
							} else {
								PythonIDE.showHint("Рахунок не збережено");
								console.log(e);
							}
						});	
					}
					
				}
				$('#tests').css({'background-color':'hsl(' + score + ',100%, 40%)'});
				PythonIDE.files = fileBackup;
				PythonIDE.updateFileTabs();
			});
		
		}
		
		$('#tests').click(function() {
			$('#dlg').dialog('option', 'title', "Tests");
			$('#output').html('<div id="test_results">' + html + '</div>');
			$('#dlg').dialog("open");
		});
	},

	runToEnd: function() {
		
		
		if(PythonIDE.continueRunning) {
			requestAnimationFrame(PythonIDE.runToEnd);
			if(PythonIDE.continueDebug) {
				PythonIDE.continueDebug();
			}
		}
	
	},

	runCode: function(runMode) {
		if(runMode == "finished") {
			return;
		}
		if(!PythonIDE.files['mycode.py']) {
			PythonIDE.files['mycode.py'] = '# You need to have a file called mycode.py'
			PythonIDE.updateFileTabs();
		}
		if(!PythonIDE.files[PythonIDE.currentFile]) {
			PythonIDE.currentFile = "mycode.py";
		}
		PythonIDE.aT[PythonIDE.hash].r = Date.now();
		localStorage.aT = JSON.stringify(PythonIDE.aT);
		Sk.TurtleGraphics.animate = true;

		if(PythonIDE.animTimeout && runMode != "anim") {
			clearTimeout(PythonIDE.animTimeout);
			delete PythonIDE.animTimeout;
			return;
		}

		if(PythonIDE.hasBreakpoints() && runMode == "normal") {
			runMode = "debugging";
			PythonIDE.continueRunning = true;
		} else {
		}

		if(PythonIDE.continueDebug) {
			PythonIDE.runMode = runMode;
			switch(runMode) {
				case 'paused':
					return;
				break;
				case 'debugging':
				case 'step':
				case 'normal':
					PythonIDE.continueDebug();
					return;	
				break;
				case 'finished':
				return;
				default:
					debugger;
					PythonIDE.runToEnd();
					return;
			}
		}
		

		if(runMode === undefined)
			runMode = "normal";

		PythonIDE.runMode = runMode;
		PythonIDE.python.outputListeners = [];

		PythonIDE.showHint("Програма виконується...");
		$('#btn_stopRunning').addClass('visibleButton');

		var code = PythonIDE.files['mycode.py'];

		var codeName = "mycode.py";
		var fileParts = PythonIDE.currentFile.split(".");
		if(fileParts.length == 2 && fileParts[1] == "py") {
			code = PythonIDE.files[PythonIDE.currentFile];
			codeName = PythonIDE.currentFile;
		}
		$('#dlg').dialog('option', 'title', codeName);

		PythonIDE.saveSnapshot();
		
		// super() hack
		if(code.indexOf("super()") > -1) {
			var lines = code.split("\n");
			var superClass = "";
			for(var i = 0; i < lines.length; i++) {
				var line = lines[i];
				var m = line.match(/\bclass\s+([a-zA-Z0-9_]*)\s*\(([A-Za-z0-9]*)\)/);
				if(m) {
					superClass = m[2];
				}
				lines[i] = line.replace(/\bsuper\s*\(\s*\)\s*\.\s*([A-Za-z0-9_]*)\s*\((.*?)\)/, function(m, method, params ) {
					var replacement = superClass + "." + method + "(self";
					if(params && params.trim().length > 0) {
						replacement += "," + params;
					}
					replacement += ")";
					return replacement;
				});
			}
			
			code = lines.join("\n");
		}
		//


		var html = '';
		html += '<div id="headerOut"></div>';
		html += '<pre id="consoleOut"><div id="watch"><h2>Variables:</h2></div></pre>';
		html += '</pre>';
		if(code.indexOf("turtle") > 0) {
			html += '<div id="canvas"></div>';
		}
		html += '<div><button id="btn_showREPL"><i class="fa fa-terminal"></i> REPL</button></div>';



		$('#output').html(html);
		$('#dlg').dialog("open");
		$('#btn_showREPL').button().click(function() { PythonIDE.python.repl() });
		if(runMode != "step") {
			$('#btn_showREPL').hide();
		}

		$('#btn_stop').button().click(function() {
			localStorage.loadAction = "restoreCode";
			window.location = window.location.href.replace('run/', 'python/').replace('#', '');
		});

		var handlers = [];
		PythonIDE.running = true;
		var crashPreventionMode = false;
		if(runMode != "normal") {
			handlers["Sk.debug"] = PythonIDE.debugHandler;
			requestAnimationFrame(function() {PythonIDE.runCode(runMode); });

			$('#watch').show();
		}

		PythonIDE.configSkulpt(runMode, crashPreventionMode);

		Sk.misceval.callsimAsync(handlers, function() {
			return Sk.importMainWithBody(PythonIDE.currentFile.replace(".py", ""),false,code,true);
		}).then(function(module){
			PythonIDE.showHint('Програма завершила виконання');
			PythonIDE.continueRunning = false;
			if(PythonIDE.continueDebug)
				delete PythonIDE.continueDebug;
			if(PythonIDE.abortDebug)
				delete PythonIDE.abortDebug;
			$('#btn_stop').hide();
			$('#btn_showREPL').show();
			$('#btn_stopRunning').removeClass('visibleButton').addClass('hiddenButton');
			PythonIDE.running = false;
			PythonIDE.runMode = "finished";
			if(PythonIDE.whenFinished) {
				PythonIDE.whenFinished();
			}
		}, PythonIDE.handleError);

	},

	handleError:function (err){
		PythonIDE.running = false;
		console.log(err);

		var html = '<div class="error">' + PythonIDE.sanitize(err.toString()) + '</div>';
		PythonIDE.showHint(html);
		

		if(err.traceback && err.traceback[0].filename != "repl") {
			console.log(err);
			html += '<fieldset><legend>Stack trace:</legend>';
			for(var i = 0; i < err.traceback.length; i++) {
				var t = err.traceback[i];
				if(t.filename == "mycode.py") {
					t.filename = PythonIDE.projectName + ".py";
				}
				html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
			}
			html += '</fieldset>';
		} 

		PythonIDE.python.output(html);
		$('.btn_lineno').button().click(function(e) {
			var b = $(this);
			var line = b.data('line');
			PythonIDE.editFile(b.data('file'), line);
			$('.CodeMirror-activeline')[0].scrollIntoView({behaviour:"smooth"});
		});
	},

	showShare: function(){

		if(!PythonIDE.shareMode)
			PythonIDE.shareMode = "code";

		var link = "" + window.location;
		var embed = ('https://create.withcode.uk' + window.location.pathname).replace('python/', 'embed/');

		if(PythonIDE.shareMode == "run") {
			link = link.replace('python/', 'run/');
			embed = embed.replace('embed/', 'run/');
		}
		//console.log(link);
		$('#share_link_val').val(link);
		$('#share_embed_val').val('<iframe frameborder="0" width="100%" height="400px" src="' + embed + '"><a target="_blank" href="' + link + '">create.withcode.uk</a></iframe>');
		$('#share_qr_val').html('<a target="_blank" href="' + link + '"><img src="https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=' + link + '"></a>');
		var r = /\/python\/([\d\w]+)/;
		var m = r.exec(window.location.pathname);
		try {
			var hash = m[1];
			$('#share_wp_val').val('[withcode id="' + hash + '"' + (PythonIDE.shareMode == "run"?' mode="run"':'') + ']');
			$('#share_type_val').val('https://type.withcode.uk/create/' + hash);
			$('#share_type_link').attr('href', 'https://type.withcode.uk/create/' + hash);
			$('#share_kpride_val').val('https://create.withcode.uk/kpride/' + hash);
			$('#share_kpride_link').attr('href', 'https://create.withcode.uk/kpride/' + hash);
			$('#sharethis').attr({
				"data-url":link,
				"data-title": "Check out my python code:",
				"data-description": "Create.withcode.uk lets you write, run debug and share python code in your browser",
				"data-image": "https://create.withcode.uk/media/try_debug_extend.gif"
			});	
		} catch(e) {

		}
		
		$('#share').dialog("open");
	},

	getPyType: function(v) {
		if(v){
				var type = v.skType?v.skType : v.__proto__.tp$name;
				if(type == "str") {
					type = "string";
				}
				return type;	
		}
	},

	downloadFile: function() {
		var blob = new Blob([PythonIDE.files[PythonIDE.currentFile]], {type : "text/plain", endings: "transparent"});
		
		saveAs(blob, PythonIDE.projectName + ".py");
	},

	saveChoice: function() {
		$("#save").dialog("open");
	},

	saveTest: function() {
		PythonIDE.saveSnapshot();
		var code = PythonIDE.files['mycode.py'];

		if(PythonIDE.countFiles() > 1) {
			code = JSON.stringify(PythonIDE.files);
		}

		console.log((PythonIDE.b64EncodeUnicode(code)));
	},

	saveReplace: function() {
		PythonIDE.saveSnapshot();
		var code = PythonIDE.files['mycode.py'];

		if(PythonIDE.countFiles() > 1) {
			code = JSON.stringify(PythonIDE.files);
		}
		
		$.post('/lib/api.php', {
			cmd: 'overwrite',
			code: PythonIDE.b64EncodeUnicode(code),
			name: PythonIDE.projectName
		}, function(data) {
			if(data.success) {
				PythonIDE.showHint(data.message);
				$('#btnSaveSort_updated').trigger('click');
				$("#save").dialog("close");
			} else {
				PythonIDE.showHint(data.message);
			}
		}, "json");
	},

	b64EncodeUnicode: function(str) {
    	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	        function toSolidBytes(match, p1) {
	            return String.fromCharCode('0x' + p1);
	    }));
	},

	save: function() {
		PythonIDE.showHint("Зберігання...");
		var code = PythonIDE.files['mycode.py'];

		if(PythonIDE.countFiles() > 1) {
			code = JSON.stringify(PythonIDE.files);
		}
		var captcha = '';
		try {
			captcha = grecaptcha.getResponse();
		} catch (e) {
			captcha = "logged in";
		}
		$.post('/lib/api.php', {
			cmd: 'save',
			captcha: captcha,
			name: PythonIDE.projectName + ".py",
			code: PythonIDE.b64EncodeUnicode(code)
		}, function(data) {
			//console.log(data);
			if(data.verified) {
				var link = 'https://create.withcode.uk/python/'+data.hash;
				window.location=link;	
			} else {
				PythonIDE.showHint("Не вдалося зберегти: неправильні дані captcha");
			}
		}, "json");
	},

	breakpoints: {},

	addBreakpoint: function(file, line) {
		if(!PythonIDE.breakpoints[file])
			PythonIDE.breakpoints[file] = {};
		PythonIDE.breakpoints[file][line] = true;
		var b = document.createElement("div");
		b.style.color = "#822";
		b.innerHTML = "●";
		if(PythonIDE.currentFile == file)
			PythonIDE.editor.setGutterMarker(line - 1, "breakpoints", b);
	},

	hasBreakpoints: function(file) {
		return Object.keys(PythonIDE.breakpoints).length > 0;
	},

	clearBreakpoints: function(file) {
		if(PythonIDE.currentFile == file)
			PythonIDE.editor.clearGutter("breakpoints");
		PythonIDE.breakpoints[file] = {};
	},

	removeBreakpoint: function(file, line) {
		delete PythonIDE.breakpoints[file][line];
		if(PythonIDE.currentFile == file)
			PythonIDE.editor.setGutterMarker(line - 1, "breakpoints", null);
	},

	toggleBreakpoint: function(file, line) {
		if(PythonIDE.breakpoints[file] && PythonIDE.breakpoints[file][line]) {
			PythonIDE.removeBreakpoint(file, line);
		} else {
			PythonIDE.addBreakpoint(file, line);
		}
	},

	autoSize: function(e) {
		if(e && e.target.localName == "div")
			return;
		// expand editor to fit height of the screen.
		$('.holder').css({height: window.innerHeight - 80});
		$('#dlg,#settings,#login,#share,#project_settings,#file_settings,#recover,#save,#tracker').dialog({
			width: window.innerWidth * 0.5,
			height: window.innerHeight
		});
		$('#editor').css({top:$('#file_tabs').height() - 20});
		PythonIDE.editor.refresh();
	},

	configSkulpt: function(mode, forceDebugging) {
		var debugging = forceDebugging || !(mode == "run" || mode == "normal");
		
		Sk.inputfun = function(prompt) {
			//return window.prompt(prompt);
			var p = new Promise(function(resolve, reject) {
				if($('#raw_input_holder').length > 0) {
					return;
				}
				PythonIDE.python.output('<form><div id="raw_input_holder"><label for="raw_input">' + prompt + '</label><input class="ui-widget ui-state-default ui-corner-all" type="text" name="raw_input" id="raw_input" value="" autocomplete="off"/><button id="raw_input_accept" type="submit">OK</button></div></form>');

				var btn = $('#raw_input_accept').button().click(function() {
					var val = $('#raw_input').val();
					$('#raw_input_holder').remove();
					PythonIDE.python.output(prompt + ' <span class="console_input">' + val + "</span>\n");
					resolve(val);
				});
				$('#raw_input').focus();
			});
			return p;
		}

		Sk.configure({
			breakpoints:function(filename, line_number, offset, s) {
				//debugger;
				if(PythonIDE.runMode == "anim") {
					if(PythonIDE.continueDebug) {
						PythonIDE.animTimeout = setTimeout(function() {
							PythonIDE.runCode("anim");
						}, $( "#slider_step_anim_time" ).slider( "value" ));
					}
				}
				if(PythonIDE.runMode == "step" || PythonIDE.runMode == "anim" || PythonIDE.runMode == "debugging") {
					PythonIDE.editFile(filename, line_number);	
					//console.log(this, filename, line_number,PythonIDE.runMode);
				}
				
				PythonIDE.lineNumber = line_number;
				return true;
			},
			//debugging: !(mode == "run" || mode == "normal") ,
			debugging: debugging,
			output: PythonIDE.python.outputSanitized,
			readFile: PythonIDE.readFile,
			fileopen: PythonIDE.openFile,
			filewrite: PythonIDE.writeFile,
			read: PythonIDE.readFile,
			killableWhile: true,
			/*killableFor: true,*/
			inputfunTakesPrompt: true});

	},

	aT: {},
	
	api: function(cmd, data, onSuccess) {
/*		data.cmd = cmd;
			$.ajax({
				url: 'https://tools.withcode.uk/keywords/api.php',
			xhrFields: {
					withCredentials: true
				},
			data: data,
			dataType: "jsonp",
			method: "POST",
			cache: false
		}).done(function(r) {onSuccess(r);});
*/
	},

	updateTrackerList: function() {
		var html = '<span class="fa fa-spin fa-spinner"></span>';
		var tl = $('#tracker_list').html(html);
		$.getJSON('/lib/api.php', {
			cmd: 'get_trackers'
		}, function(e) {
			if(e.success) {
				tl.html(e.trackers);	
				PythonIDE.addTrackerHandlers();
			}
			
		});
	},

	onTrackerActivityButton: function(e) {
		var parts = e.currentTarget.id.split("_");
		var id = parts[4];
		var type = parts[3];
		switch(type) {
			case 'delete':
				if(id == 0) {
					$('#tracker_activity_0').remove();
				} else {
					$.getJSON('/lib/api.php', {
						cmd: 'delete_tracker_activity',
						id: id
					}, function(data) {
						if(data.success) {
							PythonIDE.updateTrackerActivityList(PythonIDE.selectedTracker);
						}
					});	
				}
				
			break;
			case 'update':
				var jqA = $('#tracker_activity_' + id);
				var sortorder = jqA.index();
				$.getJSON('/lib/api.php', {
					cmd: 'update_tracker_activity',
					id: id,
					tracker: PythonIDE.selectedTracker,
					name: jqA.find('.tracker_activity_name input').val(),
					activity: jqA.find('.tracker_activity_hash input').val(),
					url: jqA.find('.tracker_activity_url input').val(),
					sortorder: sortorder
				}, function(data) {
					PythonIDE.updateTrackerActivityList(PythonIDE.selectedTracker);
				});
			break;
		}
	},

	updateTrackerActivityList: function(hash) {
		PythonIDE.selectedTracker = hash;
		$.getJSON('/lib/api.php', {
			cmd: 'get_tracker',
			hash: hash
		}, function(e) {
			if(e.success) {
				$('#txt_tracker_name').val(e.name);
				var html = '';
				for(var i = 0; i < e.activities.length; i++) {
					var a = e.activities[i];
					html += '<li id="tracker_activity_' + a.id + '" class="tracker_activity"><table>'
					+ '<tr class="tracker_activity_name"><th>Name:</th><td><input class="txt_full" value="' + a.name + '"></td></tr>'
					+ '<tr class="tracker_activity_hash"><th>Activity:</th><td><input class="txt_full" value="' + a.hash + '"></td></tr>'
					+ '<tr class="tracker_activity_url"><th>URL:</th><td><input class="txt_full" value="' + a.url + '"></td></tr>'
					+ '</table><button class="btn_tracker_activity" id="btn_tracker_activity_delete_' + a.id + '"><i class="fa fa-trash"></i> Delete</button>'
					+ '<button class="btn_tracker_activity" id="btn_tracker_activity_update_' + a.id + '"><i class="fa fa-check"></i> Save</button></li>';
				}
				$('#tracker_activities').html(html).sortable({
					placeholder: 'tracker_activity_placeholder'
				});
				$('.btn_tracker_activity').button().click(PythonIDE.onTrackerActivityButton);
				var code = '<iframe src="https://create.withcode.uk/tracker/' + hash + '" frameborder="0" width="100%" height="50px"></iframe>';
				$('#txt_tracker_code').val(code);
				$('#tracker_preview').html(code);
			}
		});
	},

	addTrackerHandlers: function() {
		$('.btn_tracker').button().click(function(e) {
			$('#tracker').dialog("open");
			var hash = e.currentTarget.id.split("_")[2];
			PythonIDE.updateTrackerActivityList(hash);
		});
	},

	stop: function() {
		localStorage.loadAction = "restoreCode";
		window.location = window.location.href.replace('run/', 'python/').replace("", "");
	},

	keyHandlers: [],

	savePreview: {
		start: 0,
		size: 9,
		order: "updated"
	},

	globals: ["abs","delattr","hash","memoryview","set","all","dict","help","min","setattr","any","dir","hex","next","slice","ascii","divmod","id","object","sorted","bin","enumerate","input","oct","staticmethod","bool","eval","int","open","str","breakpoint","exec","isinstance","ord","sum","bytearray","filter","issubclass","pow","super","bytes","float","iter","print","tuple","callable","format","len","property","type","chr","frozenset","list","range","vars","classmethod","getattr","locals","repr","zip","compile","globals","map","reversed","complex","hasattr","max","round"],

	autoComplete: function(cm, option) {

		return new Promise(function(accept) {
			var suggestions = [];
			var keys = {

			};
			var cursor = cm.getCursor(), line = cm.getLine(cursor.line)
	        var start = cursor.ch, end = cursor.ch
	        while (start && /\w/.test(line.charAt(start - 1))) --start;
	        while (end < line.length && /\w/.test(line.charAt(end))) ++end;
	        var preLine = line.slice(0, start).trim();
	        var context = preLine.split(/\b/);

	        var word = line.slice(start, end).toLowerCase();

	        function addSuggestion(text, className) {
				if(keys[text] || text.indexOf(word) !== 0)
					return;
				suggestions.push({
	        		text: text,
	        		className: className
	        	});
	        	keys[text] = true;
			}
	        
	        var addMore = true;

	        var last = context[context.length - 1];
	        if(last == ".") {
	        	addMore = false;
	        }
	        if(addMore) {
	        	if(last == "import") {
	        		var builtins = ["math", "re", "random", "turtle", "time"];
	        		for(var i = 0; i < builtins.length; i++) {
	        			addSuggestion(builtins[i], 'autocomplete-mod');
	        		}
	        		for(var key in Sk.externalLibraries) {
	        			if(!Sk.externalLibraries.hasOwnProperty(key)) {
	        				continue;
	        			}
	        			addSuggestion(key, 'autocomplete-mod');
	        		}
	        		addMore = false;
	        	}
	        }

	        if(addMore) {
		        for(var i = 0; i < PythonIDE.globals.length; i++) {
		        	addSuggestion(PythonIDE.globals[i], 'autocomplete-builtin');
		        }
		    }

		    var code = PythonIDE.editor.getValue();
	        if(addMore) {
	        	var r = /\b([A-Za-z_0-9]+)\b\s*=/g;
		        var v;
		        while(v = r.exec(code)) {
		        	addSuggestion(v[1], 'autocomplete-var');
		        }

		        r = /^\s*def\s+([A-Za-z0-9_]+)/gm;
		        while(v = r.exec(code)) {
		        	addSuggestion(v[1], 'autocomplete-def');
		        }	
	        }
	        
	        
	        suggestions.sort(function(a,b) {
	        	return (a.text > b.text)? 1:-1;
	        });
			return accept({
				list: suggestions,
				from: CodeMirror.Pos(cursor.line, start),
				to: CodeMirror.Pos(cursor.line, end)
			});
		});
	},
	
	lastGroupUpdateSearch: {
		sort:"lastname",
		direction:"asc"
	},

	updateGroupCode: function(sortBy, direction) {
		if(!sortBy) {
			sortBy = PythonIDE.lastGroupUpdateSearch.sort;
		}
		if(!direction) {
			direction = PythonIDE.lastGroupUpdateSearch.direction;
		}
		PythonIDE.lastGroupUpdateSearch = {
			sort:sortBy,
			direction:direction
		}
		g = PythonIDE.currentGroup;
		PythonIDE.api('get_group_code', {group:g.id, student:PythonIDE.currentStudent, sort:sortBy, direction:direction}, function(r) {
			var html = '';
			if(r.success && r.students && r.students.length > 0) {
				html += '<table class="testing_table"><thead class="group_students"><tr><th data-col="lastname">Last name</th><th data-col="firstname">First name</th><th data-col="projects">Projects</th><th data-col="updated">Last updated</th></tr></thead><tbody>'
				for(var i = 0; i < r.students.length; i++) {
					html += '<tr class="student_row';
					if(PythonIDE.currentStudent == r.students[i].id) {
						html += ' selected';
					}
					html += '" id="sr_' + r.students[i].id + '"><td>' + r.students[i].lastname + '</td><td>' + r.students[i].firstname + '</td><td>' + r.students[i].code + '</td><td>' + r.students[i].lastupdated + '</td></tr>';
				}
				html += '</tbody></table>';
			}
			$('#code_students').html(html);
			$('.group_students th').click(function(e) {
				var sortBy = $(e.currentTarget).data('col'); 
				PythonIDE.updateGroupCode(sortBy);
			});
			$('.student_row').click(function(e) {
				var id = e.currentTarget.id.split("_")[1];
				if(PythonIDE.currentStudent == id) {
					PythonIDE.currentStudent = 0;
				} else {
					PythonIDE.currentStudent = id;	
				}
				PythonIDE.updateGroupCode();
			});
			html = '';
			if(r.success && r.code && r.code.length > 0) {
				PythonIDE.recentCode = r.code;
				var html = '<table class="testing_table"><thead><tr><th>Date</th><th>Template</th><th>Preview</th></tr></thead><tbody>';
				for(var i = 0; i < r.code.length; i++) {
					var c = r.code[i];
					if(i == 0) {
						PythonIDE.showPreview({currentTarget: {id: 'recent_code_preview_' + c.id}});
					}
					var url = "/";
					if(c.url.length > 0) {
						url = c.url;
					}
					var preview = c.files;
					try {
						preview = JSON.parse(preview);
						var fileNames = Object.keys(preview).join(" ");
						preview = "# files: " + fileNames + "\n" + preview['mycode.py'];
					} catch (e) {
					}
					var m = preview.match(/(^.*(\n|$)){1,3}/m);
					preview = m[0];
					html += '<tr><td>' + c.date + '</td><td><a href="' + url + '" target="_blank">' + url + '</a></td><td class="recent_code_preview" id="recent_code_preview_' + c.id + '"><pre>' + preview + '</pre></td></tr>';
				}
			}
			html += '</tbody></table>';
			$('#code_mine').html(html);
			$('.recent_code_preview').hover(PythonIDE.showPreview, PythonIDE.resetPreview).click(PythonIDE.loadPreview);
		});
	},
	
	changeGroup: function(id) {		
		for(var i = 0; i < PythonIDE.groups.length; i++) {
			if(id == PythonIDE.groups[i].id) {
				$('#kwuser_group').val(id);
				var g = PythonIDE.currentGroup = PythonIDE.groups[i];
				$('#group_link').attr('href', g.link);
				$('#btnGroup').attr({src: g.image, alt: g.name});
				$('#btnGroup').hover(function(e) {
					// mouse over tool button
					PythonIDE.showHint($('#' + e.currentTarget.id).attr('alt'));
				}).click(function(e) {
					if(PythonIDE.currentGroup) {
						PythonIDE.updateGroupCode();						
						$('#dlg').dialog('option', 'title', 'Groups');

						var html = 'You are logged in as <a href="https://tools.withcode.uk/keywords/user" target="_blank">' + PythonIDE.kwuser.username + "</a>";
						if(!PythonIDE.kwuser.student) {
							html += ' (teacher)';
						}
						if(PythonIDE.groups) {
							html += '<select id="kwuser_group">';
							for(var i = 0; i < PythonIDE.groups.length; i++) {
								var g = PythonIDE.groups[i];
								html += '<option value="' + g.id + '"';
								if(g.id == id) {
									html += ' selected';
								}
								html += '>' + g.name + ' (' + g.schoolname + ')</option>';
								
							}
							html += '</select>';
						}
						console.log(g.link);
						html += '<a id="group_link" target="_blank" href="' + g.link + '">Show all group resources</a>'
						+ '<fieldset><legend>Students:</legend><div id="code_students">Your code will be saved automatically shared with your teacher</div></fieldset>'
						+ '<fieldset><legend>Recent code:</legend><div id="code_mine">Loading...</div></fieldset>';
						
						$('#output').html(html);
						$('#kwuser_group').selectmenu({
							change: function(e, ui) {
								var id = parseInt(ui.item.value);
								PythonIDE.changeGroup(id);
								PythonIDE.updateGroupCode();
							}
						});
						$('#dlg').dialog("open");
					}		
				});
			}
		}
	},

	resetPreview: function(e) {
		if(PythonIDE.resetPreviewCode) {
			PythonIDE.files = PythonIDE.resetPreviewCode;
			PythonIDE.currentFile = "mycode.py";
			PythonIDE.updateFileTabs();
			PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
		}
		delete PythonIDE.disableChangeEvent;
	},

	loadPreview: function(e) {
		PythonIDE.showPreview(e, true);
	},

	showPreview: function(e, load) {
		PythonIDE.disableChangeEvent = true;
		PythonIDE.resetPreviewCode = PythonIDE.files;
		var id = e.currentTarget.id.split("_")[3];
		if(PythonIDE.recentCode) {
			for(var i = 0; i < PythonIDE.recentCode.length; i++) {
				if(PythonIDE.recentCode[i].id == id) {
					var files = PythonIDE.recentCode[i].files;
					try {
						files = JSON.parse(files);
					} catch (e) {
						files = {"mycode.py":files};
					}
					PythonIDE.files = files;
					PythonIDE.currentFile = "mycode.py";
					PythonIDE.updateFileTabs();
					PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
					var remoteCursor = document.createElement('span');
					remoteCursor.classList.add('remote-cursor');
					var cursor = PythonIDE.editor.setBookmark({line: PythonIDE.recentCode[i].line, ch: PythonIDE.recentCode[i].ch}, {widget: remoteCursor});
					if(load) {
						var url = '/';
						var hash = '/';
						if(PythonIDE.recentCode[i].url.length > 0) {
							url += 'python/' + PythonIDE.recentCode[i].url;
							hash = PythonIDE.recentCode[i].url;
						}
						if(!PythonIDE.aT) {
							PythonIDE.aT = {};
						}						
						if(!PythonIDE.aT[hash]) {
							PythonIDE.aT[hash] = {};
						}
						PythonIDE.aT[hash].t = Date.now();
						PythonIDE.aT[hash].c = PythonIDE.files;
						localStorage.aT = JSON.stringify(PythonIDE.aT);
						location.href = url;
					}
				}
			}
		}
	},
	
	groups: [],

	init: function(style) {
		PythonIDE.api('get_user_details', {}, function(r) {
			if(r.success && r.user && r.user.username) {
				PythonIDE.kwuser = r.user;
				PythonIDE.groups = r.groups;
				if(r.groups && r.groups.length > 0) {
					var g = r.groups[0];
					PythonIDE.currentGroup = g;
					html = ' <img id="btnGroup" src="' + g.image + '" class="toolButton" alt="' + g.name + '">';
					$('#footer').append(html);
					PythonIDE.changeGroup(g.id);
				}
			}
		});

		$('#btnSaveShowMore').button().click(function(e) {
			PythonIDE.savePreview.start += PythonIDE.savePreview.size;
			$.getJSON('/lib/api.php', {
				cmd: 'get_saves',
				sort: PythonIDE.savePreview.order,
				start: PythonIDE.savePreview.start,
				size: PythonIDE.savePreview.size
			}, function(data) {
				if(data.success) {
					$('#saves').append(data.html);
					addSavedCodePreviewHandlers();
				}
			});
		});

		if($('#lti_id').length > 0) {
			PythonIDE.lti = {
				id: $('#lti_id').val(),
				check: $('#lti_check').val(),
				submitted: 0
			}
		}

		$('#btnCreateTracker').button().click(function(e) {
			$('#createTrackerDlg').remove();
			var html = '<div id="createTrackerDlg" title="Create new tracker"><fieldset><legend>Name:</legend><input type="text" id="txt_new_tracker_name" value="New tracker"></fieldset><button id="btnCreateTrackerOK"><i class="fa fa-check"></i> OK</button></div>';
			$('body').append(html);
			$('#createTrackerDlg').dialog();
			$('#txt_new_tracker_name').select();
			$('#btnCreateTrackerOK').button().click(function(e) {
				$.getJSON('/lib/api.php', {
					cmd: 'create_tracker',
					name: $('#txt_new_tracker_name').val()
				}, function(data) {
					PythonIDE.updateTrackerList();	
				});
				
				$('#createTrackerDlg').dialog("close");
			});
		});

		$('#hintBar').click(function() {
			clearTimeout(PythonIDE.hideHintTimeout);
			delete PythonIDE.hideHintTimeout;
			$('#hintBar').fadeOut();
		});

		$('#btn_save_tracker_order').button().click(function(e) {
			var activities = [];
			$('.tracker_activity').each(function(i) {
				var id = this.id.split("_")[2];
				if(id != 0) {
					activities.push(id);	
				}
			});
			$.getJSON('/lib/api.php', {
				cmd: 'update_tracker_order',
				activities: activities,
				tracker: PythonIDE.selectedTracker
			}, function(data) {
				PythonIDE.updateTrackerActivityList(PythonIDE.selectedTracker);
			});
		});

		$('#btn_add_tracker_activity').button().click(function(e) {
			if($('#tracker_activity_0').length == 0) {
				var html = '<li id="tracker_activity_0" class="tracker_activity"><table>'
						+ '<tr class="tracker_activity_name"><th>Name:</th><td><input class="txt_full"></td></tr>'
						+ '<tr class="tracker_activity_hash"><th>Activity:</th><td><input class="txt_full"></td></tr>'
						+ '<tr class="tracker_activity_url"><th>URL:</th><td><input class="txt_full"></td></tr>'
						+ '</table><button class="btn_tracker_activity" id="btn_tracker_activity_delete_0"><i class="fa fa-trash"></i> Delete</button>'
						+ '<button class="btn_tracker_activity" id="btn_tracker_activity_update_0"><i class="fa fa-check"></i> Save</button></li>';
				$("#tracker_activities").append(html);	
				$('#tracker_activity_0 button').button().click(PythonIDE.onTrackerActivityButton);
			}
			$('#tracker_activity_0 .tracker_activity_name input').focus();
			
		});
		
		
		var isAdvancedUpload = function() {
		  var div = document.createElement('div');
		  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
		}();
		
		
		var $form = $('.box');

		function loadFile(file) {
			PythonIDE.saveSnapshot();
			if (file.name.match(/\.(txt|py|json)$/)) {
				var reader = new FileReader();
				var loadname = file.name.replace(/ \(\d+\)\./, ".");
				reader.onload = function (event) {
					PythonIDE.files[loadname] = event.target.result;
					PythonIDE.currentFile = loadname;
					PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
					PythonIDE.updateFileTabs();
					PythonIDE.editor.refresh();
				};
				reader.readAsText(file);
			} else {
				if(file.name.match(/\.sb3$/)) {
					PythonIDE.showHint("Спроба прочитати файл sb3");
				} else {
					PythonIDE.showHint("Непідтримуваний формат файлу");	
				}
				
			}
		}
		if (isAdvancedUpload) {
		  $form.addClass('has-advanced-upload');

		  var droppedFiles = false;
		
		  $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		  })
		  .on('dragover dragenter', function() {
			$form.addClass('is-dragover');
		  })
		  .on('dragleave dragend drop', function() {
			$form.removeClass('is-dragover');
		  })
		  .on('drop', function(e) {
			  var file = e.originalEvent.dataTransfer.files[0];
			  loadFile(file);
		  });

		  $('.box__file').on('change', function(e) { 
			var file = e.currentTarget.files[0];
			loadFile(file);  			
		  });
		
		}
		
		var r = /\/(python|embed|run)\/(.*)(\?|#)?/;
		var m = r.exec(window.location.pathname);
		if(m && m.length > 2) {
			PythonIDE.hash = m[2];
		}
		if(localStorage.aT) PythonIDE.aT = JSON.parse(localStorage.aT);
		if(!PythonIDE.aT[PythonIDE.hash]) PythonIDE.aT[PythonIDE.hash] = {r:false, v:Date.now(), t:false, s:0, m:0};
		localStorage.aT = JSON.stringify(PythonIDE.aT); 
		
		PythonIDE.addTrackerHandlers();

		$('.btn_tracker_tool').button().click(function(e) {
			switch(e.currentTarget.id) {
				case 'btn_copy_tracker':
					$('#txt_tracker_code').select();
					document.execCommand('copy');
					PythonIDE.showHint('Код трекера скопійовано в буфер обміну');
				break;
				case 'btn_tracker_delete':
					var html = '<div id="dlg_confirm" title="Are you sure?"><p>If you delete this tracker, you will not be able to undo this action.</p><p>If anyone else links to this tracker, it will continue to be available to them, but you will no longer be able to edit it</p>'
						+ '<div><button id="dlg_confirm_ok" class="dlg_confirm_btn"><i class="fa fa-check"></i> OK</button> <button class="dlg_confirm_btn" id="dlg_confirm_cancel"><i class="fa fa-close"></i> Cancel</button></div></div>';
					$('body').append(html);
					$('.dlg_confirm_btn').button().click(function(e) {
						switch(e.currentTarget.id) {
							case 'dlg_confirm_ok':
								$.getJSON('/lib/api.php', {
									cmd: 'delete_tracker',
									hash: PythonIDE.selectedTracker
								}, function(e) {
									$('#tracker').dialog("close");
									PythonIDE.showHint("Трекер видалено");
									PythonIDE.updateTrackerList();
								});
							break;
						}
						$('#dlg_confirm').dialog("close").remove();
					});
					$('#dlg_confirm').dialog();
				break;

				case 'btn_tracker_rename':
					var name = $('#txt_tracker_name').val();
					$.getJSON('/lib/api.php', {
						cmd: 'rename_tracker',
						hash: PythonIDE.selectedTracker,
						name: name
					}, function(e) {
						if(e.success) {
							$('#txt_tracker_name').val(e.name);
							$('#tracker_preview iframe').attr('src', $('#tracker_preview iframe').attr('src'));
							PythonIDE.updateTrackerList();	
						}
					});
				break;
			}
		})

		function addSavedCodePreviewHandlers() {
			if(!PythonIDE.resetCode) {
					PythonIDE.resetCode = PythonIDE.files;	
			}
			$('.codepreview').off('mouseenter dblclick mouseleave').on({
				'mouseenter': function(e) {
					if(!PythonIDE.resetCode) {
							PythonIDE.resetCode = PythonIDE.files;	
					}
					if(!PythonIDE.actualProjectName) {
						PythonIDE.actualProjectName = PythonIDE.projectName;
					}
					var hash = e.currentTarget.id.split("_")[1];
					PythonIDE.showHint("Завантаження попереднього перегляду..." + hash);
					$.getJSON('/lib/api.php', {
						cmd: 'get_code',
						hash: hash
					}, function(data) {
						if(data.success) {
							PythonIDE.showHint("Попередній перегляд коду: " + data.hash);
							var name = 'mycode.py';
							if(data.name) {
								name = data.name;
							}
							var externalFiles = {"mycode.py": ""};
							try {
								externalFiles = JSON.parse(data.Code);
							} catch (e){
								externalFiles["mycode.py"] = data.Code;
							}
							PythonIDE.projectName = name.replace(".py", "");
							PythonIDE.files = externalFiles;
							PythonIDE.currentFile = 'mycode.py';
							PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
							PythonIDE.updateFileTabs();
							PythonIDE.editor.refresh();
						} else {
							PythonIDE.files = PythonIDE.resetCode;
							PythonIDE.projectName = PythonIDE.actualProjectName;
							delete PythonIDE.actualProjectName;
							PythonIDE.updateFileTabs();
							PythonIDE.showHint("Не вдалося завантажити попередній перегляд коду");
						}
					});
				},
				'dblclick': function(e) {
					window.location = $(e.currentTarget).find('a').attr('href');
				},
				'mouseleave': function(e) {
					if(PythonIDE.resetCode) {
						PythonIDE.files = PythonIDE.resetCode;
						PythonIDE.currentFile = 'mycode.py';
						if(PythonIDE.actualProjectName) {
							PythonIDE.projectName = PythonIDE.actualProjectName;
							delete PythonIDE.actualProjectName;
						}
						PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
						PythonIDE.updateFileTabs();
					}		
				}
			});
		}

		$('#btnPreviewReset').button().click(function() {
			if(PythonIDE.resetCode) {
				PythonIDE.files = PythonIDE.resetCode;
				PythonIDE.currentFile = 'mycode.py';
				PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
				PythonIDE.updateFileTabs();
			}
		});

		$('#btnSaveSearch').button().click(function(e) {
			var q = $('#txtSearch').val();
			$.getJSON('/lib/api.php', {
				cmd: 'get_saves',
				sort: PythonIDE.savePreview.order,
				q: q
			}, function(data) {
				if(data.success) {
					$('#saves').html(data.html);
					addSavedCodePreviewHandlers();
				}
			});
		});

		$('.btnSaveSort').button().click(function(e) {
			PythonIDE.savePreview = {
				start: 0,
				size: 9,
				order: e.currentTarget.id.split("_")[1]
			}
			$.getJSON('/lib/api.php', {
				cmd: 'get_saves',
				sort: PythonIDE.savePreview.order
			}, function(data) {
				if(data.success) {
					$('#saves').html(data.html);
					addSavedCodePreviewHandlers();
				}
			});
		});

		addSavedCodePreviewHandlers();

		$('.btnLogin').button().click(function() {
			localStorage.loadAction = "restoreCode";
			PythonIDE.saveSnapshot();
			window.location = $('#btnLogin').data('url');
		});

		$('#btnDownload').button().click(function(e) {
			PythonIDE.downloadFile();
		});

		$('.linkbutton').button();

		PythonIDE.showHint(PythonIDE.welcomeMessage);
		window.onresize = PythonIDE.autoSize;
		PythonIDE.updateFileTabs();

		$('#share_tabs').tabs();

		animateTitle('create.withcode.uk', 'title_text');

		PythonIDE.editor = CodeMirror(document.getElementById('editor'), {
			value: PythonIDE.files['mycode.py'],
			extraKeys: {"Ctrl-Space": "autocomplete"},
			mode: 'python',
			lineNumbers: true,
			gutters: ["CodeMirror-linenumbers", "breakpoints"],
			styleActiveLine: true,
			inputStyle: "textarea",
			lineWrapping: true,
			hintOptions: {
				hint: PythonIDE.autoComplete
			}
		});

		PythonIDE.editor.on("gutterClick", function(cm, n) {
		  PythonIDE.toggleBreakpoint(PythonIDE.currentFile, n + 1);
		});

		PythonIDE.editor.addKeyMap({
		"Tab": function (cm) {
			if (cm.somethingSelected()) {
				var sel = PythonIDE.editor.getSelection("\n");
				// Indent only if there are multiple lines selected, or if the selection spans a full line
				if (sel.length > 0 && (sel.indexOf("\n") > -1 || sel.length === cm.getLine(cm.getCursor().line).length)) {
					cm.indentSelection("add");
					return;
				}
			}

			if (cm.options.indentWithTabs)
				cm.execCommand("insertTab");
			else
				cm.execCommand("insertSoftTab");
		},
		"Shift-Tab": function (cm) {
			cm.indentSelection("subtract");
		}
		});
		setTimeout(function() {
			PythonIDE.editor.refresh();
		}, 100);

		if(style != "embed" && style != "run") {
			PythonIDE.editor.focus();
		}
		PythonIDE.editor.on("change", function(e) {
			if(PythonIDE.disableChangeEvent){
				return 0;
			}
			if(PythonIDE.currentGroup) {
				if(PythonIDE.submitTimeout) {
					clearTimeout(PythonIDE.submitTimeout);
					delete PythonIDE.submitTimeout;
				}
				PythonIDE.submitTimeout = setTimeout(function() {
					PythonIDE.sendSnapshot({date: Date.now(), files: JSON.stringify(PythonIDE.files)});
				}, 2000);
			}
			var runTests = PythonIDE.files['tests.json'] !== undefined;
			if(PythonIDE.testTimeout) {
				clearTimeout(PythonIDE.testTimeout);
				delete PythonIDE.testTimeout;
			} else {
				if(runTests) {
					$('#tests').remove();
					$('body').append('<div id="tests"><div class="tiny">tests:</div><i class="fa fa-spin fa-gear"></i></div>');	
				}
			}
			PythonIDE.testTimeout = setTimeout(function() {
				PythonIDE.runTests();
			}, 1000);
			if(!runTests) {	
				$('#tests').remove();
			}

			if(PythonIDE.abortDebug) {
				PythonIDE.abortDebug();
			}
			// update breakpoints
			PythonIDE.breakpoints = {};
			for(var n = 0; n < PythonIDE.editor.lineCount(); n++) {
				var info = PythonIDE.editor.lineInfo(n);
				if(info && info.gutterMarkers && info.gutterMarkers.breakpoints) {
					PythonIDE.breakpoints[n+1] = true;
				}
			}
			
			PythonIDE.files[PythonIDE.currentFile] = PythonIDE.editor.getValue();
		});

		$('#project_settings button').button().click(function(e) {
			switch(e.currentTarget.id) {
				case 'btn_project_ok':
					var newProjectName = $('#txt_project_name').val();
					PythonIDE.projectName = newProjectName;
					PythonIDE.updateFileTabs();
					$("#project_settings").dialog("close");
				break;
				case 'btn_project_cancel':
					$("#project_settings").dialog("close");
				break;
			}
		});



		$('#file_settings button').button().click(function(e) {
			switch(e.currentTarget.id) {
				case 'btn_file_rename':
					var newFileName = $('#txt_file_name').val();
					if(!newFileName.match(/^[A-Za-z0-9_.]+$/)){
						PythonIDE.showHint("Некоректне ім'я файлу");
						break;
					}
					if(PythonIDE.files[newFileName] || (PythonIDE.projectName + ".py" == newFileName)) {
						PythonIDE.showHint('Файл із такою назвою вже існує');
						break;
					}
					var fileContents = PythonIDE.files[PythonIDE.currentFile]
					delete PythonIDE.files[PythonIDE.currentFile];
					PythonIDE.currentFile = newFileName;
					PythonIDE.files[PythonIDE.currentFile] = fileContents;
					PythonIDE.updateFileTabs();
					$('#file_settings').dialog("close");
					PythonIDE.editFile(newFileName);

				break;
				case 'btn_file_delete':
					delete PythonIDE.files[PythonIDE.currentFile];
					PythonIDE.editFile("mycode.py");

				case 'btn_file_cancel':
					$('#file_settings').dialog("close");
				break;
			}
			//console.log(e.currentTarget.id);
		});

		if(localStorage && !localStorage.options) {
			localStorage.options = {
				codeSize:12,
				outputSize: 12,
				outputTransparency: 0,
				stepAnimtime: 1000
			}
		}

		$('#slider_code_size').slider({
			value: PythonIDE.getOption('codeSize', 12),
			min: 6,
			max: 40,
			slide: function(e, ui) {
				$('#txt_code_size').val(ui.value + "pt");
				$('#editor').css({'font-size':ui.value + 'pt'});
				PythonIDE.setOption('codeSize', ui.value);
			}
		});
		$('#txt_code_size').val(PythonIDE.getOption('codeSize', 12) + "pt");
		$('#editor').css({'font-size':PythonIDE.getOption('codeSize', 12) + 'pt'});

		$('#slider_output_size').slider({
			value: PythonIDE.getOption('outputSize', 12),
			min: 6,
			max: 40,
			slide: function(e, ui) {
				$('#txt_output_size').val(ui.value + "pt");
				$('#output').css({'font-size':ui.value + 'pt'});
				PythonIDE.setOption('outputSize', ui.value)
			}
		});
		$('#txt_output_size').val(PythonIDE.getOption('outputSize', 12) + "pt");
		$('#output').css({'font-size':PythonIDE.getOption('outputSize', 12) + 'pt'});

		$('#slider_output_transparency').slider({
			value: PythonIDE.getOption('outputTransparency', 0),
			min: 0,
			max: 100,
			slide: function(e, ui) {
				$('#txt_output_transparency').val(ui.value + "%");
				$('#dlg').parent().css({'opacity':1 - (ui.value / 100)});
				PythonIDE.setOption('outputTransparency', ui.value);
			}
		});
		$('#txt_output_transparency').val(PythonIDE.getOption('outputTransparency', 0) + "%");

		$('#slider_step_anim_time').slider({
			value: PythonIDE.getOption('stepAnimTime', 500),
			min: 500,
			max: 5000,
			step: 500,
			slide: function(e, ui) {
				$('#txt_step_anim_time').val(ui.value / 1000 + "s");
				PythonIDE.setOption('stepAnimtime', ui.value)
			}
		});
		$('#txt_step_anim_time').val(PythonIDE.getOption('stepAnimTime', 500) + "ms");

		window.onerror=function(err) {
			if(err && err.__proto__ && err.__proto__.tp$name == "SystemExit") {
				PythonIDE.stop();
			} else {
				var msg = err.toString().replace("Uncaught ", "");

				var html = '<div class="error">' + msg + '</div>';
				html += '<fieldset><legend>Stack trace:</legend>';
				if(err.traceback) {
					for(var i = 0; i < err.traceback.length; i++) {
						var t = err.traceback[i];
						if(t.filename == "mycode.py") {
							t.filename = PythonIDE.projectName + ".py";
						}
						html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
					}
				} else {
					var t = {
						filename: PythonIDE.currentFile,
						lineno: 1
					}
					var m = msg.match(/line\s+(\d+)/);
					if(m && m.length > 1) {
						t.lineno = m[1];
					}
					if(t.filename == "mycode.py") {
						t.filename = PythonIDE.projectName + ".py";
					}
					html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
				}
				html += '</fieldset>';

				PythonIDE.python.output(html);
				$('.btn_lineno').button().click(function(e) {
					var b = $(this);
					var line = b.data('line');
					PythonIDE.editFile(b.data('file'), line);
					$('.CodeMirror-activeline')[0].scrollIntoView({behaviour:"smooth"});
				});



				console.log(err);
				return true;				
			}
			
		}

		$(window).keyup(function(e) {
			if(!PythonIDE.running) {
				PythonIDE.keyHandlers = [];
			} else {

				// space and arrow keys
			    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
			        e.preventDefault();
			    }

				for(var i = 0; i < PythonIDE.keyHandlers.length; i++) {
					PythonIDE.keyHandlers[i](e);
				}	
			}
		});

		// setup keyboard shortcutts
		$(window).keydown(function(e) {
			if(!PythonIDE.running) {
				PythonIDE.keyHandlers = [];
			} else {

				// space and arrow keys
			    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
			        e.preventDefault();
			    }

				for(var i = 0; i < PythonIDE.keyHandlers.length; i++) {
					PythonIDE.keyHandlers[i](e);
				}	
			}

			if(PythonIDE.resetCode) {
				delete PythonIDE.resetCode;
			}
			if(e.altKey && e.shiftKey && e.keyCode == 83) {
				PythonIDE.showShare();
			}
			if(e.ctrlKey) {
				switch(e.keyCode) {
					case 13: // CTRL + ENTER = run / stop
						PythonIDE.runCode("normal");
						e.preventDefault();
					break;

					case 83: // CTRL + S = save
						if(e.shiftKey) {
							PythonIDE.saveReplace();
						} else {
							if(e.altKey) {
								PythonIDE.downloadFile();
							} else {
								if($('.g-recaptcha').length > 0) {
									PythonIDE.saveChoice();
								} else {
									PythonIDE.save();
								}	
							}
						}
						
						e.preventDefault();
						break;

					case 190: // CTRL + . = step | CTRL SHIFT + . = anim
						if(e.altKey) {
							if(PythonIDE.abortDebug) {
								PythonIDE.abortDebug();
							}
						} else {
							if(e.shiftKey) {
								PythonIDE.runCode("anim");
							} else {
								PythonIDE.runCode("step");
							}
						}
						e.preventDefault();
						break;

					case 79: // CTRL + O settings
						$('#settings').dialog("open");
						e.preventDefault();
						break;

					case 65: // Ctrl + A Select all
						PythonIDE.editor.execCommand("selectAll");
						PythonIDE.editor.focus();
						e.preventDefault();
						break;

					case 32: // Ctrl + Space show code hint
						//PythonIDE.showCodeHint();
					break;

					default:
						//console.log("Control + keycode:" + e.keyCode);
					break;
				}
			}
		});

		$('#dlg,#settings,#login,#share,#project_settings,#file_settings, #recover,#save,#tracker').dialog({
			autoOpen:false,
			width: window.innerWidth * 0.5,
			height: window.innerHeight,
			position: {my: "left top", at: "center top", of: window}
		}).parent().css({position: "fixed"});

		$('#btnShare').button().click(function() {
			PythonIDE.showShare();
		});

		$('#btnSaveNew').button().click(function() {
			var captcha = '';
			try {
				captcha = grecaptcha.getResponse();
			} catch (e) {
				captcha = "logged in";
			}
			if(captcha != "") {
				$('#save').dialog("close");	
				localStorage.loadAction = "showShare";
				PythonIDE.save();
			} else {
				PythonIDE.showHint("Будь ласка, поставте галочку біля назви «Я не робот».");
			}			
		});

		$('#btnSaveUpdate').button().click(function() {
			PythonIDE.saveReplace();
			PythonIDE.showShare();
		});

		$('#radio_share_mode').buttonset().change(function(e) {
			var id = $('#radio_share_mode :radio:checked').attr('id');
			switch(id) {
				case 'radio_share_mode_code':
					PythonIDE.shareMode = 'code';
				break;
				case 'radio_share_mode_run':
					PythonIDE.shareMode = 'run';
				break;
			}
			PythonIDE.showShare();
		});

		$('#radio_run_mode').buttonset().change(function(e) {
			var id = $('#radio_run_mode :radio:checked').attr('id');
			switch(id) {
				case 'radio_run_mode_all':
					PythonIDE.runMode = "normal";
				break;
				case 'radio_run_mode_single':
					PythonIDE.runMode = "step";
				break;
				case 'radio_run_mode_anim':
					PythonIDE.runMode = "anim";
				break;
			}
		});

		$('#radio_code_style').buttonset().change(function(e) {
			var id = $('#radio_code_style :radio:checked').attr('id');
			switch(id) {
				case 'radio_code_style_light':
					PythonIDE.editor.setOption("theme", "default");
					$('body').css({'background-color': '#FFF'});
					PythonIDE.setOption('code_style', 'light')
				break;
				case 'radio_code_style_dark':
					PythonIDE.editor.setOption("theme", "blackboard");
					$('body').css({'background-color': '#000'});
					PythonIDE.setOption('code_style', 'dark')
				break;
				case 'radio_code_style_dusk':
					PythonIDE.editor.setOption("theme", "cobalt");
					$('body').css({'background-color': '#002240'});
					PythonIDE.setOption('code_style', 'dusk')
				break;
			}
		});
		$('#radio_code_style_' + PythonIDE.getOption('code_style', 'light')).prop('checked', true).change();

		$('#radio_output_style').buttonset().change(function(e) {
			var id = $('#radio_output_style :radio:checked').attr('id');
			switch(id) {
				case 'radio_output_style_light':
					$('#dlg').css({'background-color': '#FFF','color':'#000'});
					PythonIDE.setOption('output_style', 'light')
				break;
				case 'radio_output_style_dark':
					$('#dlg').css({'background-color': '#222','color':'#CCC'});
					PythonIDE.setOption('output_style', 'dark')
				break;
				case 'radio_output_style_dusk':
					$('#dlg').css({'background-color': '#002240','color':'#CCC'});
					PythonIDE.setOption('output_style', 'dusk')
				break;
			}
		});
		$('#radio_output_style_' + PythonIDE.getOption('output_style', 'dark')).prop('checked', true).change();

		$('#btn_user').click(function() {
			PythonIDE.saveSnapshot();
			$('#login').dialog("open");
		});




		if(localStorage.loadAction) {
			switch(localStorage.loadAction) {
				case 'showShare':
					PythonIDE.showShare();
				break;
				case 'restoreCode':
					console.log("restoring");
					var snapshot = PythonIDE.vault.pop()
					if(snapshot) {
						PythonIDE.files = JSON.parse(snapshot.files);
						PythonIDE.currentFile = "mycode.py";
						PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
						PythonIDE.updateFileTabs();	
					}
					
				break;
			}
			delete localStorage.loadAction;
			PythonIDE.editor.setCursor(0);
			PythonIDE.editor.focus();
		}
		
		Sk.python3 = true;
		Sk.python2.print_function = true;
		Sk.python2.unicode_literals = true;
		Sk.python2.ceil_floor_int = true;
		Sk.inputfunTakesPrompt = true;

		(Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'canvas';

		PythonIDE.configSkulpt("run");
		var dev = "?v=" + Date.now() + ".js";
		Sk.externalLibraries = {
			itertools: {
				path: 'lib/skulpt/itertools/__init__.js'
			},
			colorsys: {
				path: 'lib/skulpt/colorsys/__init__.js'
			},
			pgzrun: {
				path: 'lib/skulpt/pgzrun/__init__.js',
				dependencies: ['lib/skulpt/tkinter/colors.js']
			},
			tkinter: {
				path: 'lib/skulpt/tkinter/__init__.js',
				dependencies: ['lib/skulpt/tkinter/colors.js']
			},
			martypy: {
				path: 'lib/skulpt/martypy/__init__.js',
				dependencies: ['lib/skulpt/martypy/three.js', 'lib/skulpt/martypy/GLTFLoader.js', 'lib/skulpt/martypy/marty.js']
			},
			lcddriver: {
				path: 'lib/skulpt/lcddriver/__init__.js'
			},
			neopixel: {
				path: 'lib/skulpt/neopixel/__init__.js'
			},
			schooldirect: {
				path: 'lib/skulpt/schooldirect/__init__.js'
			},
			withcode: {
				path: 'lib/skulpt/withcode/__init__.js' + dev
			},
			sqlite3: {
				path: 'lib/skulpt/sqlite3/__init__.js'
			},
			hashlib: {
				path: 'skulpt/hashlib/__init__.js',
				dependencies: ['lib/skulpt/hashlib/crypto-js.js']
			},
			microbit: {
				path: 'lib/skulpt/microbit/__init__.js' + dev
			},
			music: {
				path: 'lib/skulpt/music/__init__.js'
			},
			py3d: {
				path: 'lib/skulpt/py3d/__init__.js',
				dependencies: ['lib/skulpt/py3d/hjson.js'],
			},
			RPi: {
				path: 'lib/skulpt/rpi/__init__.js'
			},
			"RPi.GPIO": {
				path: 'lib/skulpt/rpi/__init__.js'
			},
			gpiozero: {
				path: 'lib/skulpt/rpi/gpiozero.js' + dev,
				dependencies: ['lib/skulpt/rpi/raphael.js']
			},
			speech: {
				path: 'lib/skulpt/speech/__init__.js',
				dependencies: ['lib/skulpt/speech/sam.js']
			},
			radio: {
				path: 'lib/skulpt/radio/__init__.js'
			},
			os:{
				path: 'lib/skulpt/os/__init__.js'
			}
		};

		// expand editor to fit height of the screen.
		$('.holder').css({height: window.innerHeight - 80});

		$('#footer').css({bottom: 0});
		$('#chk-advanced').checkboxradio();
		if(localStorage.debug) {
			$('#chk-advanced').prop('checked', true).change();
		}
		
		
		$('#chk-advanced').change(function(e){
			$('#chk-advanced').checkboxradio('refresh');
			if($('#chk-advanced').prop('checked')){
				localStorage.debug=true;
			} else{
				delete localStorage.debug;
			}
			PythonIDE.updateFileTabs();
			});

		
		if(style == "run") {

			$('#editor').hide();
			var output = $('#output').detach();
			$('#holder').append(output);
			$('#dlg').remove();
			PythonIDE.whenFinished = function() {
				var link = window.location.href.replace('run/', 'python/');
				var html = '<div><a class="nounderline" href="http://withcode.uk" target="_blank"><h1 id="title" onmouseover="animateTitle(\'create.withcode.uk\', \'title_text\')"><span class="brackets">{</span><span id="title_text">withcode.uk</span><span class="brackets">}</span></h1></a></div>';
				PythonIDE.python.output(html + '<p>This python app was written using <a href="https://create.withcode.uk">create.withcode.uk</a>. <a href="' + link + '">Click here to edit the python code and create/share your own version</a> or check out <a href="http://blog.withcode.uk">blog.withcode.uk</a> for ideas, tips and resources</p> <button id="btn_run_again">Run again</button>');
				$('#btn_run_again').button().click(function() {PythonIDE.runCode()});
			}
			PythonIDE.runCode();
		}

		function timeSince(date) {

		  var seconds = Math.floor((new Date() - date) / 1000);

		  var interval = Math.floor(seconds / 31536000);

		  if (interval > 1) {
		    return interval + " years";
		  }
		  interval = Math.floor(seconds / 2592000);
		  if (interval > 1) {
		    return interval + " months";
		  }
		  interval = Math.floor(seconds / 86400);
		  if (interval > 1) {
		    return interval + " days";
		  }
		  interval = Math.floor(seconds / 3600);
		  if (interval > 1) {
		    return interval + " hours";
		  }
		  interval = Math.floor(seconds / 60);
		  if (interval > 1) {
		    return interval + " minutes";
		  }
		  return Math.floor(seconds) + (seconds==1?" second" : " seconds");
		}

		if(PythonIDE.hash && !PythonIDE.forceReset && PythonIDE.aT && PythonIDE.aT[PythonIDE.hash] && PythonIDE.aT[PythonIDE.hash].c) {
			PythonIDE.defaultSavedCode = JSON.stringify(PythonIDE.files);
			if(JSON.stringify(PythonIDE.aT[PythonIDE.hash].c) != PythonIDE.defaultSavedCode) {
				PythonIDE.restored = true;
				PythonIDE.files = PythonIDE.aT[PythonIDE.hash].c;
				PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
				PythonIDE.updateFileTabs();
				PythonIDE.showHint("Відображається код, який ви редагували востаннє " + timeSince(PythonIDE.aT[PythonIDE.hash].t) + " тому");	
				var html = '<img id="btn_reset_code" alt="Скинути код до збереженої версії" title="Скинути код" class="toolButton hiddenButton visibleButton" src="./media/reset.png">';
				$("#btn_stopRunning").after(html);
			}
				
			if(PythonIDE.files['tests.json'] !== undefined) {
				PythonIDE.runTests();
			}
		}

		$('.toolButton').hover(function(e) {
			// mouse over tool button
			PythonIDE.showHint($('#' + e.currentTarget.id).attr('alt'));
		}, function(e) {
			// mouse out tool button
			//PythonIDE.showHint(PythonIDE.welcomeMessage);
		}).click(function(e) {
			// tool button click
			switch(e.currentTarget.id) {
				case 'btn_reset_code':
					PythonIDE.resetFiles();
				break;

				case 'btn_edit':
					window.open(window.location.href.replace('embed', 'python').replace('run', 'python'));
				break;

				case 'btn_show_recover':
					PythonIDE.recover();
				break;

				case 'btn_stopRunning':
					PythonIDE.stop();
				break;

				case 'btn_tools':
					toolsVisible = !toolsVisible;
					if(toolsVisible) {
						$('.toolButton').addClass('visibleButton');
					} else {
						$('.toolButton').removeClass('visibleButton');
					}
				break;

				case 'btn_show_output':
					//$('#btn_group_console').toggleClass('hiddenButtonPanel');
					$('#dlg').dialog("open");
				break;

				case 'btn_show_settings':
					$('#settings').dialog("open");
				break;

				case 'btn_show_share':
					PythonIDE.saveChoice();
				break;

				case 'btn_run':
					PythonIDE.runCode();
				break;
			}
		});
		PythonIDE.autoSize();
	},

	resetFiles: function(all) {
		if(PythonIDE.aT && PythonIDE.hash && PythonIDE.aT[PythonIDE.hash] && PythonIDE.defaultSavedCode) {
			PythonIDE.saveSnapshot();
			delete PythonIDE.aT[PythonIDE.hash];
			PythonIDE.aT[PythonIDE.hash] = {r:false, v:Date.now(), t:false, s:0, m:0};
			localStorage.aT = JSON.stringify(PythonIDE.aT);
			PythonIDE.files = JSON.parse(PythonIDE.defaultSavedCode);
			PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
			PythonIDE.updateFileTabs();
			PythonIDE.showHint("Відновити збережений код за замовчуванням. Для скасування скористайтеся кнопкою відновлення коду.");
		}
	}
}
