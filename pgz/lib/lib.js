let userLang = navigator.language || navigator.userLanguage;
let selectedLang = userLang.startsWith('en') ? 'en' : 'uk';
var t;
var wscale = 0.5;

// Close dialog - заміна jQuery
document.addEventListener('click', function(e) {
    if (e.target.closest('.ui-dialog-titlebar-close')) {
        e.preventDefault();
        const dialogContainer = e.target.closest('.ui-dialog');
        const dialogContent = dialogContainer.querySelector('.ui-dialog-content');
        const dialogId = dialogContent ? dialogContent.id : null;
        if (dialogId && window[dialogId]) {
            window[dialogId].close();
        }
    }
});

// Main PythonIDE object
var PythonIDE = {
    updateConsoleSize: function() {
        const output = document.getElementById('output');
        const headerOut = document.getElementById('headerOut');
        const consoleOut = document.getElementById('consoleOut');
        
        if (!output || !headerOut || !consoleOut) return;
        
        var h = output.offsetHeight - headerOut.offsetHeight;
        if(h < 100) {
            h = 100;
        }
        consoleOut.style.maxHeight = h + "px";
    },
    
    // debug
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
        
        var breakpoint = false;
        if(PythonIDE.breakpoints[filename] && PythonIDE.breakpoints[filename][lineNumber] && PythonIDE.continueRunning) {
            PythonIDE.showHint(selectedLang === 'en' ? "Paused due to a breakpoint on the line " + (lineNumber) : "Призупинено через точку зупинки на рядку " + (lineNumber));
            document.getElementById('btn_showREPL').style.display = 'block';
            breakpoint = true;
            PythonIDE.editFile(filename, lineNumber);
            PythonIDE.continueRunning = false;
            PythonIDE.runMode = "paused";
        }
        
        // globals
        PythonIDE.currentScope = {};
        var susp = result;
        if(true || PythonIDE.runMode == "step" || breakpoint) {
            var html = '<i id="btnToggleGlobals" class="fa fa-arrows-h"></i> <div id="globals"><h3 data-i18n="global_vars">Глобальні змінні: </h3><table><tr><th>Ім\'я</th><th data-i18n="data_type">Тип даних</th><th data-i18n="variable_values">Значення</th></tr></div>';
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
                html += '<h4><span data-i18n="local_variables">Локальні змінні у рядку</span> ' + context.$lineno + '</h4><table><tr><th>Ім\'я</th><th data-i18n="data_type">Тип даних</th><th data-i18n="variable_values">Значення</th></tr>';
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
                                val = "ERROR!: " + type;
                            }
                            html += '<tr><td>' + key + '</td><td>' + type + '</td><td>' + val + '</td></tr>';
                        }
                    }
                }
                html += '</table>';
                context = context.child;
            }
            
            const watchEl = document.getElementById('watch');
            if (watchEl) {
                watchEl.innerHTML = html;
                
                const btnToggleGlobals = document.getElementById('btnToggleGlobals');
                if (btnToggleGlobals) {
                    btnToggleGlobals.addEventListener('click', function() {
                        PythonIDE.showGlobalVariables = !PythonIDE.showGlobalVariables;
                        if(PythonIDE.showGlobalVariables) {
                            watchEl.style.maxWidth = "30%";
                        } else {
                            watchEl.style.maxWidth = "2em";
                        }
                    });
                }
                
                const debugExpandZones = document.querySelectorAll('span.debug_expand_zone');
                debugExpandZones.forEach(function(zone) {
                    zone.addEventListener('click', function(e) {
                        var id = e.currentTarget.id;
                        var idNum = id.replace("debug_expand_", "");
                        document.getElementById(id).innerHTML = PythonIDE.watchVariables.expandHandlers[idNum].fullText;
                    });
                });
            }
        }
        
        var p = new Promise(function(resolve,reject){
            PythonIDE.continueDebug = function() {
                if(PythonIDE.runMode != "step" && PythonIDE.running) {
                    requestAnimationFrame(function() {PythonIDE.runCode(PythonIDE.runMode); });
                }
                return resolve(susp.resume());
            };
            PythonIDE.abortDebug = function() {
                delete PythonIDE.abortDebug;
                delete PythonIDE.continueDebug;
                PythonIDE.running = false;
                return reject("Program aborted");
            };
        });
        return p;
        
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
                    };
                    PythonIDE.abortDebug = function() {
                        delete PythonIDE.abortDebug;
                        delete PythonIDE.continueDebug;
                        PythonIDE.running = false;
                        return reject("Program aborted");
                    };
                });
                return p;
            }
            return result;
        }
    },
        // edit a file
    editFile: function(filename, lineno) {
        filename = filename.replace("./", "");
        if(filename == PythonIDE.projectName + ".py") {
            filename = "my_pgz.py";
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
            
            var extension = filename.match(/(\.[^.]+)/);
            if(extension && extension.length > 1)
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
    
    // update the list of files at the top of the screen
    updateFileTabs: function() {
        var html = '';
        for(var file in PythonIDE.files){
            if(file == 'my_pgz.py'){
                file = PythonIDE.projectName + ".py";
            }
            html += '<span class="file_tab';
            if((file == PythonIDE.currentFile) || (file == PythonIDE.projectName + ".py") && (PythonIDE.currentFile == "my_pgz.py")) {
                html += ' file_tab_selected">';
                if(file != 'my_pgz.py') {
                    html += '<img class="btn_file_settings" alt="File settings" title="File settings" src="./media/settings.png">';
                }
            } else {
                html += '">';
            }
            html += file + '</span> ';
        }
        html += '<span class="file_tab"><img class="btn_file_settings" '
            + (selectedLang === 'en'
                ? 'alt="Create a new file" title="Create a new file"'
                : 'alt="Створити новий файл" title="Створити новий файл"')
            + ' src="./media/tools.png"></span>';
        
        const fileTabs = document.getElementById('file_tabs');
        if (fileTabs) {
            fileTabs.innerHTML = html;
            
            const fileTabElements = fileTabs.querySelectorAll('.file_tab');
            fileTabElements.forEach(function(tab) {
                tab.addEventListener('click', function(e) {
                    var fileName = e.currentTarget.textContent;
                    if(fileName == PythonIDE.projectName + ".py") {
                        fileName = "my_pgz.py";
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
                            if(fileName == "my_pgz.py") {
                                const txtProjectName = document.getElementById('txt_project_name');
                                if (txtProjectName) txtProjectName.value = PythonIDE.projectName;
                                const projectSettings = document.getElementById('project_settings');
                                if (projectSettings) projectSettings.style.display = 'block';
                            } else {
                                const fileSettings = document.getElementById('file_settings');
                                if (fileSettings) fileSettings.style.display = 'block';
                                const txtFileName = document.getElementById('txt_file_name');
                                if (txtFileName) {
                                    txtFileName.value = fileName;
                                    txtFileName.focus();
                                }
                            }
                            break;
                        default:
                            PythonIDE.editFile(e.currentTarget.textContent);
                            break;
                    }
                });
            });
        }
    },
    
    projectName: 'my_pgz',
    currentFile: 'my_pgz.py',
    
    countFiles: function() {
        var c = 0;
        for(var f in PythonIDE.files) {
            c++;
        }
        return c;
    },
    
    files: {'my_pgz.py':''},
    
    writeFile: function(file, contents) {
        console.log('Filepos:',file.pos$);
        console.log('FileData:',file.data$);
        if(!Sk.builtin.checkString(contents)) {
            throw new Sk.builtin.TypeError("write() arguments must be str, not " + contents.tp$name);
        }
        if (file.mode.v==='a') {
            file.pos$ = file.data$.length;
        }
        if ((file.mode.v==='w')&&(file.pos$ ===0)) {
            file.data$ = '';
        }
        var before = file.data$;
        file.data$ = before + Sk.ffi.remapToJs(contents).toString();
        file.pos$ = file.data$.length;
        file.lineList = file.data$.split("\n");
        file.lineList = file.lineList.slice(0, -1);
        for (var i in file.lineList) {
            file.lineList[i] = file.lineList[i] + "\n";
        }
        file.currentLine = 0;
        PythonIDE.files[file.name] = file.data$;
        PythonIDE.updateFileTabs();
    },    

    getOption: function(optionName, defaultValue) {
        if(localStorage && localStorage['OPT_' + optionName])
            return localStorage['OPT_' + optionName];
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
            const hintBar = document.getElementById('hintBar');
            if (hintBar) hintBar.style.display = 'none';
        }, 5000);
        
        const hintBar = document.getElementById('hintBar');
        if (hintBar) {
            hintBar.innerHTML = msg;
            hintBar.style.display = 'block';
        }
    },
    
    sanitize: function(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
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
                        r.data.promise.then(function(value) {
                            if(outputResult) {
                                PythonIDE.python.output(Sk.ffi.remapToJs(Sk.builtin.repr(value)));
                            }
                        }).catch(PythonIDE.handleError);
                    } else {
                        r = r.resume();
                    }
                    var now = new Date().getTime();
                    if(now - startTime > 5000) {
                        PythonIDE.showHint(selectedLang === 'en' ? "Stopped after 5 seconds to prevent web browser crashes" : "Зупинено через 5 секунд, щоб запобігти збою у роботі вебпереглядача");
                        break;
                    }
                }
                if(r.__result && outputResult) {
                    if (Sk.ffi.remapToJs(Sk.builtin.repr(r.__result))!='None'){
                        PythonIDE.python.output(Sk.ffi.remapToJs(Sk.builtin.repr(r.__result)));
                    }
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
            var c = document.getElementById('output');
            if (!c) {
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
            c.scrollTop = c.scrollHeight;
        },
        
        clear: function() {
            var c = document.getElementById('consoleOut');
            if (!c) return;
            c.innerHTML = '';
            const parent = c.parentNode.parentNode;
            if (parent) parent.scrollTop = parent.scrollHeight;
        }
    },
    
    runAsync: function(asyncFunc) {
        var p = new Promise(asyncFunc);
        var result;
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() {
            return result;
        };
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
    
    vault: localStorage.vault ? JSON.parse(localStorage.vault) : [],
        recover: function() {
        PythonIDE.saveSnapshot();
        console.log("Recover");
        
        // Закриваємо попередні діалоги
        const saveDialog = document.getElementById('saveModal');
        if (saveDialog) saveDialog.style.display = 'none';
        
        // Оновлюємо текст відповідно до мови
        const recoverInfoText = document.getElementById('recover_info_text');
        const recoverCountText = document.getElementById('recover_count_text');
        const recoverTimeEl = document.getElementById('recover_time');
        const previewFileName = document.getElementById('preview_file_name');
        const recoverDeleteInfo = document.getElementById('recover_delete_info');
        const recoverWarningText = document.getElementById('recover_warning_text');
        const modalTitle = document.querySelector('.modal-title');
        const btnRecover = document.getElementById('btn_recover');
        const btnRecoverClear = document.getElementById('btn_recover_clear');
        const previewTitle = document.querySelector('.preview-title');
        
        if (selectedLang === 'en') {
            if (recoverInfoText) recoverInfoText.textContent = "A copy of your code is stored in your browser's storage every time you run it.";
            if (recoverCountText) recoverCountText.innerHTML = "Number of code backups currently stored in browser storage: <span id='vault_count'>" + PythonIDE.vault.length + "</span>";
            if (recoverTimeEl) recoverTimeEl.textContent = "Drag the slider to view a previous state of the code";
            if (previewFileName) previewFileName.textContent = "my_pgz.py";
            if (recoverDeleteInfo) recoverDeleteInfo.textContent = "If needed, you can delete all code copies stored in recovery storage.";
            if (recoverWarningText) recoverWarningText.textContent = "Be careful: after you click Delete All, you will not be able to undo this action.";
            if (modalTitle) modalTitle.textContent = "Recover Code";
            if (btnRecover) btnRecover.innerHTML = '<i class="fa fa-undo"></i> Restore selected code copy';
            if (btnRecoverClear) btnRecoverClear.innerHTML = '<i class="fa fa-trash"></i> Delete all from storage';
            if (previewTitle) previewTitle.textContent = "Code Preview";
        } else {
            if (recoverInfoText) recoverInfoText.textContent = "Копія вашого коду зберігається у сховищі вашого вебоглядача кожного разу, коли ви його запускаєте.";
            if (recoverCountText) recoverCountText.innerHTML = "Кількість резервних копій коду, які зараз зберігаються в сховищі: <span id='vault_count'>" + PythonIDE.vault.length + "</span>";
            if (recoverTimeEl) recoverTimeEl.textContent = "Перетягніть повзунок, щоб переглянути попередній стан коду";
            if (previewFileName) previewFileName.textContent = "my_pgz.py";
            if (recoverDeleteInfo) recoverDeleteInfo.textContent = "За потреби ви можете видалити всі копії коду, що зберігаються у сховищі відновлення.";
            if (recoverWarningText) recoverWarningText.textContent = "Будьте обережні: після того, як ви натиснули Видалити все, ви не зможете скасувати цю дію.";
            if (modalTitle) modalTitle.textContent = "Відновлення коду";
            if (btnRecover) btnRecover.innerHTML = '<i class="fa fa-undo"></i> Відновити обрану копію коду';
            if (btnRecoverClear) btnRecoverClear.innerHTML = '<i class="fa fa-trash"></i> Видалити все зі сховища';
            if (previewTitle) previewTitle.textContent = "Перегляд коду";
        }
        
        // Оновлюємо лічильник
        const vaultCountEl = document.getElementById('vault_count');
        if (vaultCountEl) vaultCountEl.textContent = PythonIDE.vault.length;
        
        // Змінні для збереження поточного стану
        var currentSelectedCode = '';
        var currentSelectedFiles = null;
        var currentSelectedFile = "my_pgz.py";
        
        // Використовуємо нативний слайдер
        const sliderRecover = document.getElementById('slider_recover');
        if (sliderRecover && sliderRecover.tagName === 'INPUT' && sliderRecover.type === 'range') {
            sliderRecover.min = 0;
            sliderRecover.max = PythonIDE.vault.length - 1;
            sliderRecover.value = PythonIDE.vault.length - 1;
            
            sliderRecover.addEventListener('input', function() {
                if (PythonIDE.vault.length === 0) return;
                
                var snapshot = PythonIDE.vault[this.value];
                var d = new Date(snapshot.date);
                
                // Парсимо файли зі снепшоту
                var files = JSON.parse(snapshot.files);
                var code = files[currentSelectedFile] || Object.values(files)[0];
                
                // Зберігаємо поточний вибраний код для подальшого відновлення
                currentSelectedCode = code;
                currentSelectedFiles = files;
                
                // Відображаємо код у фреймі перегляду
                const codePreview = document.querySelector('#code_preview code');
                if (codePreview) codePreview.textContent = code;
                
                // Форматуємо дату
                var days = selectedLang === 'en'
                    ? "Sun,Mon,Tue,Wed,Thu,Fri,Sat,Sun".split(",")
                    : "Нд,Пн,Вт,Ср,Чт,Пт,Сб,Нд".split(",");
                var months = selectedLang === 'en'
                    ? "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",")
                    : "Січ,Лют,Бер,Кві,Тра,Чер,Лип,Серп,Вер,Жовт,Лист,Гру".split(",");
                var hours = d.getHours();
                var ampm = hours >= 12 ? (selectedLang === 'en' ? 'PM' : '') : (selectedLang === 'en' ? 'AM' : '');
                hours = hours % 12;
                hours = hours ? hours : 12;
                
                function pad2(s){s = s.toString();return s.length < 2?"0"+s:s;}
                
                var timeHtml = '<p class="recover_date">' + days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + '</p>';
                timeHtml += '<p class="recover_label">' + (selectedLang === 'en' ? 'Storage time:' : 'Час збереження:') + '</p>';
                timeHtml += '<span id="recover_time_hours">' + pad2(hours) + ':' + pad2(d.getMinutes()) + ' ' + ampm + '</span>';
                
                if (recoverTimeEl) recoverTimeEl.innerHTML = timeHtml;
            });
        }
        
        // Обробник кнопки "Відновити"
        if (btnRecover) {
            btnRecover.removeEventListener('click', PythonIDE.recoverClickHandler);
            btnRecover.addEventListener('click', function() {
                if (currentSelectedCode && currentSelectedFiles) {
                    PythonIDE.files = currentSelectedFiles;
                    PythonIDE.currentFile = currentSelectedFile;
                    PythonIDE.editor.setValue(currentSelectedCode);
                    PythonIDE.updateFileTabs();
                    PythonIDE.editor.setCursor(0);
                    
                    var message = selectedLang === 'en'
                        ? 'Code successfully restored!'
                        : 'Код успішно відновлено!';
                    console.log(message);
                }
                
                const recoverModal = document.getElementById('recoverModal');
                if (recoverModal) {
                    recoverModal.style.opacity = '0';
                    setTimeout(function() {
                        recoverModal.style.display = 'none';
                    }, 200);
                }
            });
        }
        
        // Обробник кнопки "Видалити все"
        if (btnRecoverClear) {
            btnRecoverClear.removeEventListener('click', PythonIDE.clearVaultClickHandler);
            btnRecoverClear.addEventListener('click', function() {
                var confirmMessage = selectedLang === 'en'
                    ? 'Are you sure you want to delete all backups? This action cannot be undone.'
                    : 'Ви впевнені, що хочете видалити всі резервні копії? Цю дію неможливо скасувати.';
                
                if (confirm(confirmMessage)) {
                    PythonIDE.vault = [];
                    
                    const codePreview = document.querySelector('#code_preview code');
                    if (codePreview) codePreview.textContent = '';
                    
                    if (vaultCountEl) vaultCountEl.textContent = '0';
                    
                    var successMessage = selectedLang === 'en'
                        ? 'All backups have been deleted.'
                        : 'Всі резервні копії видалено.';
                    console.log(successMessage);
                    
                    // Оновлюємо інформаційний текст
                    if (recoverTimeEl) {
                        recoverTimeEl.innerHTML = selectedLang === 'en'
                            ? 'No backups available.'
                            : 'Немає доступних резервних копій.';
                    }
                }
            });
        }
        
        // Обробник кнопки закриття
        const btnRecoverClose = document.getElementById('btn_recover_close');
        if (btnRecoverClose) {
            btnRecoverClose.removeEventListener('click', PythonIDE.closeRecoverModal);
            btnRecoverClose.addEventListener('click', function() {
                const recoverModal = document.getElementById('recoverModal');
                if (recoverModal) {
                    recoverModal.style.opacity = '0';
                    setTimeout(function() {
                        recoverModal.style.display = 'none';
                    }, 200);
                }
            });
        }
        
        // Закриття модального вікна при кліку поза ним
        const recoverModal = document.getElementById('recoverModal');
        if (recoverModal) {
            recoverModal.removeEventListener('click', PythonIDE.closeRecoverModalOnClickOutside);
            recoverModal.addEventListener('click', function(e) {
                if (e.target.id === "recoverModal") {
                    recoverModal.style.opacity = '0';
                    setTimeout(function() {
                        recoverModal.style.display = 'none';
                    }, 200);
                }
            });
        }
        
        // Ініціалізуємо перший перегляд
        if (PythonIDE.vault.length > 0) {
            var initialSnapshot = PythonIDE.vault[PythonIDE.vault.length - 1];
            var initialFiles = JSON.parse(initialSnapshot.files);
            currentSelectedFiles = initialFiles;
            
            // Визначаємо активний файл
            if (PythonIDE.currentFile && initialFiles[PythonIDE.currentFile]) {
                currentSelectedFile = PythonIDE.currentFile;
            } else if (initialFiles["my_pgz.py"]) {
                currentSelectedFile = "my_pgz.py";
            } else {
                currentSelectedFile = Object.keys(initialFiles)[0];
            }
            
            var initialCode = initialFiles[currentSelectedFile];
            currentSelectedCode = initialCode;
            
            const codePreview = document.querySelector('#code_preview code');
            if (codePreview) codePreview.textContent = initialCode;
            
            if (previewFileName) previewFileName.textContent = currentSelectedFile;
            
            // Тригеримо подію для оновлення часу
            if (sliderRecover) {
                const event = new Event('input');
                sliderRecover.dispatchEvent(event);
            }
        } else {
            // Немає резервних копій
            const codePreview = document.querySelector('#code_preview code');
            if (codePreview) {
                codePreview.textContent = selectedLang === 'en'
                    ? '// No backups available\n// Run your code to create a backup'
                    : '// Немає резервних копій\n// Запустіть код, щоб створити резервну копію';
            }
            if (previewFileName) previewFileName.textContent = '-';
        }
        
        // Показуємо модальне вікно
        if (recoverModal) {
            recoverModal.style.display = 'flex';
            setTimeout(function() {
                recoverModal.style.opacity = '1';
            }, 10);
        }
    },
        saveSnapshot: function(submit) {
        if(submit === undefined) {
            submit = true;
        }
        var snapshot = {date: Date.now(), files: JSON.stringify(PythonIDE.files)};
        while(PythonIDE.vault.length > 50) {
            PythonIDE.vault = PythonIDE.vault.slice(1);
        }
        var match = false;
        for(var i = 0; i < PythonIDE.vault.length; i++) {
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
        if(!PythonIDE.files['my_pgz.py']) {
            PythonIDE.files['my_pgz.py'] = '# You need to have a file called my_pgz.py';
            PythonIDE.updateFileTabs();
        }
        if(!PythonIDE.files[PythonIDE.currentFile]) {
            PythonIDE.currentFile = "my_pgz.py";
        }
        PythonIDE.aT[PythonIDE.hash].r = Date.now();
        localStorage.aT = JSON.stringify(PythonIDE.aT);
        Sk.TurtleGraphics.animate = true;
        
        const btnStopRunning = document.getElementById("btn_stopRunning");
        const btnRun = document.getElementById("btn_run");
        if (btnStopRunning) btnStopRunning.style.display = "block";
        if (btnRun) btnRun.style.display = "none";
        
        if(PythonIDE.animTimeout && runMode != "anim") {
            clearTimeout(PythonIDE.animTimeout);
            delete PythonIDE.animTimeout;
            return;
        }
        
        if(PythonIDE.hasBreakpoints() && runMode == "normal") {
            runMode = "debugging";
            PythonIDE.continueRunning = true;
        }
        
        if(PythonIDE.continueDebug) {
            PythonIDE.runMode = runMode;
            switch(runMode) {
                case 'paused':
                    return;
                case 'debugging':
                case 'step':
                case 'normal':
                    PythonIDE.continueDebug();
                    return;
                case 'finished':
                    return;
                default:
                    PythonIDE.runToEnd();
                    return;
            }
        }
        
        if(runMode === undefined)
            runMode = "normal";
        PythonIDE.runMode = runMode;
        PythonIDE.python.outputListeners = [];
        PythonIDE.showHint(selectedLang === 'en' ? "Program is running..." : "Програма виконується...");
        
        const btnStopRunningEl = document.getElementById('btn_stopRunning');
        if (btnStopRunningEl) btnStopRunningEl.classList.add('visibleButton');
        
        var code = PythonIDE.files['my_pgz.py'];
        var codeName = "my_pgz.py";
        var fileParts = PythonIDE.currentFile.split(".");
        if(fileParts.length == 2 && fileParts[1] == "py") {
            code = PythonIDE.files[PythonIDE.currentFile];
            codeName = PythonIDE.currentFile;
        }
        
        const dlg = document.getElementById('dlg');
        if (dlg) dlg.setAttribute('title', codeName);
        
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
        
        var html = '';
        html += '<div id="headerOut"></div>';
        html += '<pre id="consoleOut"><div id="watch"><h2>Variables:</h2></div></pre>';
        html += '</pre>';
        if(code.indexOf("turtle") > 0) {
            html += '<div id="canvas"></div>';
        }
        html += '<div><button id="btn_showREPL" style="color:#aaaaaa;outline: none;border:none;padding:0;background:none;">REPL>>></button></div>';
        
        const output = document.getElementById('output');
        if (output) output.innerHTML = html;
        
        const btnShowREPL = document.getElementById('btn_showREPL');
        if (btnShowREPL) {
            btnShowREPL.addEventListener('click', function() { 
                PythonIDE.python.repl();
            });
        }
        
        if(runMode != "step") {
            if (btnShowREPL) btnShowREPL.style.display = 'none';
        }
        
        var handlers = [];
        PythonIDE.running = true;
        var crashPreventionMode = false;
        if(runMode != "normal") {
            handlers["Sk.debug"] = PythonIDE.debugHandler;
            requestAnimationFrame(function() {PythonIDE.runCode(runMode); });
            const watchEl = document.getElementById('watch');
            if (watchEl) watchEl.style.display = 'block';
        }
        
        PythonIDE.configSkulpt(runMode, crashPreventionMode);
        Sk.misceval.callsimAsync(handlers, function() {
            return Sk.importMainWithBody(PythonIDE.currentFile.replace(".py", ""),false,code,true);
        }).then(function(module){
            PythonIDE.showHint(selectedLang === 'en' ? "The program has completed execution." : "Програма завершила виконання.");
            
            if (btnStopRunning) btnStopRunning.style.display = "none";
            if (btnRun) btnRun.style.display = "block";
            
            const gameModal = document.getElementById("gameModal");
            if (gameModal) gameModal.style.display = "none";
            
            PythonIDE.continueRunning = false;
            if(PythonIDE.continueDebug)
                delete PythonIDE.continueDebug;
            if(PythonIDE.abortDebug)
                delete PythonIDE.abortDebug;
            
            PythonIDE.running = false;
            PythonIDE.runMode = "finished";
            if(PythonIDE.whenFinished) {
                PythonIDE.whenFinished();
            }
        }, PythonIDE.handleError);
    },
        handleError: function(err) {
        PythonIDE.running = false;
        console.log(err);
        var html = '<div class="error">' + PythonIDE.sanitize(err.toString()) + '</div>';
        PythonIDE.showHint(html);
        
        if(err.traceback && err.traceback[0].filename != "repl") {
            console.log(err);
            html += '<fieldset><legend>Stack trace:</legend>';
            for(var i = 0; i < err.traceback.length; i++) {
                var t = err.traceback[i];
                if(t.filename == "my_pgz.py") {
                    t.filename = PythonIDE.projectName + ".py";
                }
                html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
            }
            html += '</fieldset>';
        }
        
        PythonIDE.python.output(html);
        
        // Додаємо обробники для кнопок рядків
        const btnLineNos = document.querySelectorAll('.btn_lineno');
        btnLineNos.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var line = this.getAttribute('data-line');
                var file = this.getAttribute('data-file');
                PythonIDE.editFile(file, line);
                const activeLine = document.querySelector('.CodeMirror-activeline');
                if (activeLine) {
                    activeLine.scrollIntoView({behavior: "smooth"});
                }
            });
        });
    },
    
    showShare: function() {
        if(!PythonIDE.shareMode)
            PythonIDE.shareMode = "code";
        var r = /\/python\/([\d\w]+)/;
        const shareDialog = document.getElementById('share');
        if (shareDialog) shareDialog.style.display = 'block';
    },
    
    getPyType: function(v) {
        if(v){
            var type = v.skType ? v.skType : v.tp$name;
            if(type == "str") {
                type = "string";
            }
            return type;
        }
    },
    
    downloadFile: function() {
        var blob = new Blob([PythonIDE.files[PythonIDE.currentFile]], {type : "text/plain", endings: "transparent"});
        let file_name = PythonIDE.currentFile;
        if (file_name=='my_pgz.py') {
            file_name = PythonIDE.projectName + ".py";
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
	closeSettingsModal: function() {
		const settingsModal = document.getElementById('settingsModal');
		settingsModal.style.display = 'none';
	},
	closeSaveModal: function() {
		const saveModal = document.getElementById('saveModal');
		saveModal.style.display = 'none';
	},        
    saveChoice: function() {
        const saveDialog = document.getElementById('saveModal');
        saveDialog.style.display = 'flex';
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
        wscale=0.5;
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        if (check) {wscale=1;}
        if(e && e.target.localName == "div")
            return;
        
        const holder = document.querySelector('.holder');
        if (holder) holder.style.height = (window.innerHeight - 80) + 'px';
        
        PythonIDE.editor.refresh();
    },
    
    configSkulpt: function(mode, forceDebugging) {
        var debugging = forceDebugging || !(mode == "run" || mode == "normal");
        Sk.inputfun = function(prompt) {
            var p = new Promise(function(resolve, reject) {
                if(document.getElementById('raw_input_holder')) {
                    return;
                }
                PythonIDE.python.output('<form><div id="raw_input_holder"><label for="raw_input">' + prompt + '</label><input class="ui-widget ui-state-default ui-corner-all" type="text" style="color:#ff0000;background:none;border:none;outline:none;" name="raw_input" id="raw_input" value="" autocomplete="off"/><button id="raw_input_accept" type="submit" style="border:none;padding:1em;background: none;">OK</button></div></form>');
                
                const rawInputAccept = document.getElementById('raw_input_accept');
                const rawInput = document.getElementById('raw_input');
                
                if (rawInputAccept && rawInput) {
                    rawInputAccept.addEventListener('click', function(e) {
                        e.preventDefault();
                        var val = rawInput.value;
                        const holder = document.getElementById('raw_input_holder');
                        if (holder) holder.remove();
                        console.log('val=',val);
                        PythonIDE.python.output(prompt + ' <span class="console_input">' + val + "</span>\n");
                        resolve(val);
                    });
                    rawInput.focus();
                }
            });
            return p;
        };
        
        Sk.configure({
            breakpoints:function(filename, line_number, offset, s) {
                if(PythonIDE.runMode == "anim") {
                    if(PythonIDE.continueDebug) {
                        PythonIDE.animTimeout = setTimeout(function() {
                            PythonIDE.runCode("anim");
                        }, document.getElementById("slider_step_anim_time") ? 
                            document.getElementById("slider_step_anim_time").value : 100);
                    }
                }
                if(PythonIDE.runMode == "step" || PythonIDE.runMode == "anim" || PythonIDE.runMode == "debugging") {
                    PythonIDE.editFile(filename, line_number);
                }
                PythonIDE.lineNumber = line_number;
                return true;
            },
            debugging: debugging,
            output: PythonIDE.python.outputSanitized,
            filewrite: PythonIDE.writeFile,
            read: PythonIDE.builtinRead,
            killableWhile: true,
            inputfunTakesPrompt: true
        });
    },
    
    aT: {},
    
stop: function() {
    console.log("Stop");
    
    // Зберігаємо поточний код перед перезавантаженням
    if (PythonIDE.hash && PythonIDE.aT[PythonIDE.hash]) {
        // Зберігаємо файли для відновлення після перезавантаження
        PythonIDE.aT[PythonIDE.hash].c = JSON.parse(JSON.stringify(PythonIDE.files));
        PythonIDE.aT[PythonIDE.hash].t = Date.now();
        localStorage.aT = JSON.stringify(PythonIDE.aT);
    }
    
    // Встановлюємо прапорець для відновлення коду після перезавантаження
    localStorage.loadAction = "restoreCode";
    
    // Змінюємо URL і перезавантажуємо
    window.location = window.location.href
        .replace('run/', 'python/')
        .replace('?run', '');
    location.reload();
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
            var keys = {};
            var cursor = cm.getCursor(), line = cm.getLine(cursor.line);
            var start = cursor.ch, end = cursor.ch;
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
    
    builtinRead: function(file) {
        if (externalLibs[file] !== undefined) {
            return Sk.misceval.promiseToSuspension(
                fetch(externalLibs[file]).then(res => {
                    return res.text();
                })
            );
        }
        var f = file;
        if (f.slice(0,8) == "src/lib/") {
            var f = f.slice(8);
            if(PythonIDE.files[f]) {
                return PythonIDE.files[f];
            }
        }
        if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[file] === undefined) {
            throw `File not found: ${file}`;
        }
        return Sk.builtinFiles.files[file];
    },
        init: function(style) {
        const hintBar = document.getElementById('hintBar');
        if (hintBar) {
            hintBar.addEventListener('click', function() {
                clearTimeout(PythonIDE.hideHintTimeout);
                delete PythonIDE.hideHintTimeout;
                hintBar.style.display = 'none';
            });
        }
        
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
        
        const fileBtn = document.getElementById('file-btn');
        if (fileBtn) {
            fileBtn.addEventListener('change', function(){
                console.log(this.files[0].name);
                var file = this.files[0];
                loadFile(file);
            });
        }
 
		// Кнопка закриття
		const btnSaveClose = document.getElementById('btn_save_close');
		if (btnSaveClose) {
			btnSaveClose.removeEventListener('click', PythonIDE.closeSaveModal);
			btnSaveClose.addEventListener('click', PythonIDE.closeSaveModal);
		}
 
        const btnSettingsClose = document.getElementById('btn_settings_close');
		if (btnSettingsClose) {
			btnSettingsClose.removeEventListener('click', PythonIDE.closeSettingsModal);
			btnSettingsClose.addEventListener('click', PythonIDE.closeSettingsModal);
		}
        var r = /\/(python|embed|run)\/(.*)(\?|#)?/;
        var m = r.exec(window.location.pathname);
        if(m && m.length > 2) {
            PythonIDE.hash = m[2];
        }
        
        if(localStorage.aT) PythonIDE.aT = JSON.parse(localStorage.aT);
        if(!PythonIDE.aT[PythonIDE.hash]) PythonIDE.aT[PythonIDE.hash] = {r:false, v:Date.now(), t:false, s:0, m:0};
        localStorage.aT = JSON.stringify(PythonIDE.aT);
        
        const btnDownloadLabel = document.getElementById('btnDownloadLabel');
        if (btnDownloadLabel) {
            btnDownloadLabel.addEventListener('click', function(e) {
                PythonIDE.downloadFile();
            });
        }
        
        const btnShowRecoverLabel = document.getElementById('btn_show_recover_label');
        if (btnShowRecoverLabel) {
            btnShowRecoverLabel.addEventListener('click', function(e) {
                PythonIDE.recover();
            });
        }
        
        window.addEventListener('resize', PythonIDE.autoSize);
        PythonIDE.updateFileTabs();
        
        PythonIDE.editor = CodeMirror(document.getElementById('editor'), {
            value: PythonIDE.files['my_pgz.py'],
            extraKeys: {"Ctrl-Space": "autocomplete"},
            mode: 'python',
            lineNumbers: true,
            gutters: ["CodeMirror-linenumbers", "breakpoints"],
            styleActiveLine: true,
            inputStyle: "textarea",
            lineWrapping: true,
            searchbox: true,
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
                const projectSettings = document.getElementById('project_settings');
        if (projectSettings) {
            const buttons = projectSettings.querySelectorAll('button');
            buttons.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    switch(e.currentTarget.id) {
                        case 'btn_project_ok':
                            const txtProjectName = document.getElementById('txt_project_name');
                            var newProjectName = txtProjectName ? txtProjectName.value : '';
                            PythonIDE.projectName = newProjectName;
                            PythonIDE.updateFileTabs();
                            if (projectSettings) projectSettings.style.display = 'none';
                            break;
                        case 'btn_project_cancel':
                            if (projectSettings) projectSettings.style.display = 'none';
                            break;
                    }
                });
            });
        }
        
        const fileSettings = document.getElementById('file_settings');
        if (fileSettings) {
            const buttons = fileSettings.querySelectorAll('button');
            buttons.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    switch(e.currentTarget.id) {
                        case 'btn_file_rename':
                            const txtFileName = document.getElementById('txt_file_name');
                            var newFileName = txtFileName ? txtFileName.value : '';
                            if(!newFileName.match(/^[A-Za-z0-9_.]+$/)){
                                PythonIDE.showHint(selectedLang === 'en' ? "Invalid file name" : "Некоректне ім'я файлу");
                                break;
                            }
                            if(PythonIDE.files[newFileName] || (PythonIDE.projectName + ".py" == newFileName)) {
                                PythonIDE.showHint(selectedLang === 'en' ? "A file with that name already exists" : "Файл із такою назвою вже існує");
                                break;
                            }
                            var fileContents = PythonIDE.files[PythonIDE.currentFile];
                            delete PythonIDE.files[PythonIDE.currentFile];
                            PythonIDE.currentFile = newFileName;
                            PythonIDE.files[PythonIDE.currentFile] = fileContents;
                            PythonIDE.updateFileTabs();
                            if (fileSettings) fileSettings.style.display = 'none';
                            PythonIDE.editFile(newFileName);
                            break;
                        case 'btn_file_delete':
                            delete PythonIDE.files[PythonIDE.currentFile];
                            PythonIDE.editFile("my_pgz.py");
                        case 'btn_file_cancel':
                            if (fileSettings) fileSettings.style.display = 'none';
                            break;
                    }
                });
            });
        }
        
        if(localStorage && !localStorage.options) {
            localStorage.options = {
                codeSize:12,
                outputSize: 12,
                outputTransparency: 0,
                stepAnimtime: 1000
            };
        }
        
        // Налаштування слайдерів (нативні)
        const sliderCodeSize = document.getElementById('slider_code_size');
        const txtCodeSize = document.getElementById('txt_code_size');
        const editorEl = document.getElementById('editor');
        
        if (sliderCodeSize && sliderCodeSize.tagName === 'INPUT' && sliderCodeSize.type === 'range') {
            sliderCodeSize.value = PythonIDE.getOption('codeSize', 12);
            sliderCodeSize.min = 6;
            sliderCodeSize.max = 40;
            
            sliderCodeSize.addEventListener('input', function(e) {
                if (txtCodeSize) txtCodeSize.value = this.value + "pt";
                if (editorEl) editorEl.style.fontSize = this.value + 'pt';
                PythonIDE.setOption('codeSize', this.value);
            });
        }
        
        if (txtCodeSize) txtCodeSize.value = PythonIDE.getOption('codeSize', 12) + "pt";
        if (editorEl) editorEl.style.fontSize = PythonIDE.getOption('codeSize', 12) + 'pt';
        
        const sliderOutputSize = document.getElementById('slider_output_size');
        const txtOutputSize = document.getElementById('txt_output_size');
        const outputEl = document.getElementById('output');
        
        if (sliderOutputSize && sliderOutputSize.tagName === 'INPUT' && sliderOutputSize.type === 'range') {
            sliderOutputSize.value = PythonIDE.getOption('outputSize', 12);
            sliderOutputSize.min = 6;
            sliderOutputSize.max = 40;
            
            sliderOutputSize.addEventListener('input', function(e) {
                if (txtOutputSize) txtOutputSize.value = this.value + "pt";
                if (outputEl) outputEl.style.fontSize = this.value + 'pt';
                PythonIDE.setOption('outputSize', this.value);
            });
        }
        
        if (txtOutputSize) txtOutputSize.value = PythonIDE.getOption('outputSize', 12) + "pt";
        if (outputEl) outputEl.style.fontSize = PythonIDE.getOption('outputSize', 12) + 'pt';
                window.onerror = function(err) {
            if(err && err.__proto__ && err.__proto__.tp$name == "SystemExit") {
                PythonIDE.stop();
            } else {
                var msg = err.toString().replace("Uncaught ", "");
                var html = '<div class="error">' + msg + '</div>';
                html += '<fieldset><legend>Stack trace:</legend>';
                if(err.traceback) {
                    for(var i = 0; i < err.traceback.length; i++) {
                        var t = err.traceback[i];
                        if(t.filename == "my_pgz.py") {
                            t.filename = PythonIDE.projectName + ".py";
                        }
                        html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
                    }
                } else {
                    var t = {
                        filename: PythonIDE.currentFile,
                        lineno: 1
                    };
                    var m = msg.match(/line\s+(\d+)/);
                    if(m && m.length > 1) {
                        t.lineno = m[1];
                    }
                    if(t.filename == "my_pgz.py") {
                        t.filename = PythonIDE.projectName + ".py";
                    }
                    html += '<div class="error">' + t.filename + ' <button class="btn_lineno" data-file="' + t.filename + '" data-line="' + t.lineno + '">line ' + t.lineno + '</button></div>';
                }
                html += '</fieldset>';
                PythonIDE.python.output(html);
                
                // Додаємо обробники для кнопок рядків
                const btnLineNos = document.querySelectorAll('.btn_lineno');
                btnLineNos.forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        var line = this.getAttribute('data-line');
                        var file = this.getAttribute('data-file');
                        PythonIDE.editFile(file, line);
                        const activeLine = document.querySelector('.CodeMirror-activeline');
                        if (activeLine) {
                            activeLine.scrollIntoView({behavior: "smooth"});
                        }
                    });
                });
                console.log(err);
                return true;
            }
        };
        
        window.addEventListener('keyup', function(e) {
            if(!PythonIDE.running) {
                PythonIDE.keyHandlers = [];
            } else {
                if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                    e.preventDefault();
                }
                for(var i = 0; i < PythonIDE.keyHandlers.length; i++) {
                    PythonIDE.keyHandlers[i](e);
                }
            }
        });
        
        window.addEventListener('keydown', function(e) {
            if(!PythonIDE.running) {
                PythonIDE.keyHandlers = [];
            } else {
                if([37, 38, 39, 40, 116].indexOf(e.keyCode) > -1) {
                    e.preventDefault();
                }
                for(var i = 0; i < PythonIDE.keyHandlers.length; i++) {
                    PythonIDE.keyHandlers[i](e);
                }
            }
            if ((e.which || e.keyCode) == 116) {
                if(e.shiftKey) {
                    PythonIDE.runCode("step");
                    e.preventDefault();
                } else {
                    PythonIDE.runCode("normal");
                    e.preventDefault(); 
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
                        if(e.altKey) {
                            PythonIDE.downloadFile();
                        }
                        e.preventDefault();
                        break;
                    case 79: // CTRL + O settings
                        const settingsDialog = document.getElementById('settings');
                        if (settingsDialog) settingsDialog.style.display = 'block';
                        e.preventDefault();
                        break;
                    case 65: // Ctrl + A Select all
                        PythonIDE.editor.execCommand("selectAll");
                        PythonIDE.editor.focus();
                        e.preventDefault();
                        break;
                    default:
                        break;
                }
            }
        });
        
        Sk.inBrowser = true;
        Sk.inputfunTakesPrompt = true;
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'canvas';
        PythonIDE.configSkulpt("run");
        
        const holder = document.querySelector('.holder');
        if (holder) holder.style.height = (window.innerHeight - 80) + 'px';
        
        const footer = document.getElementById('footer');
        if (footer) footer.style.bottom = '0';
        
        const chkAdvanced = document.getElementById('chk-advanced');
        if (chkAdvanced) {
            if(localStorage.debug) {
                chkAdvanced.checked = true;
            }
            chkAdvanced.addEventListener('change', function(e){
                if(this.checked){
                    localStorage.debug=true;
                } else{
                    delete localStorage.debug;
                }
                PythonIDE.updateFileTabs();
            });
        }
        
        if(style == "run") {
            const editorEl = document.getElementById('editor');
            if (editorEl) editorEl.style.display = 'none';
            
            const output = document.getElementById('output');
            const holderEl = document.getElementById('holder');
            if (output && holderEl) {
                holderEl.appendChild(output);
            }
            
            const dlg = document.getElementById('dlg');
            if (dlg && dlg.parentNode) {
                dlg.parentNode.removeChild(dlg);
            }
            
            PythonIDE.whenFinished = function() {
                var link = window.location.href.replace('run/', 'python/');
                var html = '<div><p>This python app was written using create.withcode</p></div>';
                PythonIDE.python.output(html+'<button id="btn_run_again">Run again</button>');
                const btnRunAgain = document.getElementById('btn_run_again');
                if (btnRunAgain) {
                    btnRunAgain.addEventListener('click', function() {
                        PythonIDE.runCode();
                    });
                }
            };
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
        
// Завантажуємо збережений код лише якщо це перезавантаження через stop()
if(localStorage.loadAction === "restoreCode") {
    if(PythonIDE.hash && !PythonIDE.forceReset && PythonIDE.aT && PythonIDE.aT[PythonIDE.hash] && PythonIDE.aT[PythonIDE.hash].c) {
        PythonIDE.defaultSavedCode = JSON.stringify(PythonIDE.files);
        if(JSON.stringify(PythonIDE.aT[PythonIDE.hash].c) != PythonIDE.defaultSavedCode) {
            PythonIDE.restored = true;
            PythonIDE.files = PythonIDE.aT[PythonIDE.hash].c;
            PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
            PythonIDE.updateFileTabs();
 /*
            PythonIDE.showHint(selectedLang === 'en' 
                ? "Showing the code you last edited " + timeSince(PythonIDE.aT[PythonIDE.hash].t) + " ago" 
                : "Цей код ви редагували " + timeSince(PythonIDE.aT[PythonIDE.hash].t) + " тому");
*/
            // Очищаємо прапорець після завантаження
            delete localStorage.loadAction;
        }
    }
}
        
        const toolButtons = document.querySelectorAll('.toolButton');
        toolButtons.forEach(function(btn) {
            btn.addEventListener('mouseenter', function(e) {
                const alt = e.currentTarget.getAttribute('alt');
                if (alt) {
                    PythonIDE.showHint(alt);
                }
            });
            
            btn.addEventListener('click', function(e) {
                switch (e.currentTarget.id) {
                    case 'btn_reset_code':
                        PythonIDE.resetFiles();
                        break;
                    case 'btn_edit':
                        window.open(
                            window.location.href
                                .replace('embed', 'python')
                                .replace('run', 'python')
                        );
                        break;
                    case 'btn_stopRunning':
                        PythonIDE.stop();
                        break;
                    case 'btn_tools':
                        var toolsVisible = !PythonIDE.toolsVisible;
                        PythonIDE.toolsVisible = toolsVisible;
                        document.querySelectorAll('.toolButton').forEach(function(btn) {
                            if (toolsVisible) {
                                btn.classList.add('visibleButton');
                            } else {
                                btn.classList.remove('visibleButton');
                            }
                        });
                        break;
                    case 'btn_show_output':
                        const dlg = document.getElementById('dlg');
                        if (dlg) {
                            if (dlg.style.display === 'none' || dlg.style.display === '') {
                                dlg.style.display = 'block';
                            } else {
                                dlg.style.display = 'none';
                            }
                        }
                        break;
                    case 'btn_show_settings':
                        const settings = document.getElementById('settingsModal');
                        settings.style.display = 'flex';
                        break;
                    case 'btn_show_share':
                        console.log("btn_show_share")
                        PythonIDE.saveChoice();
                        break;
                    case 'btn_run':
                        const btnRun = document.getElementById('btn_run');
                        const imgSrc = btnRun ? btnRun.getAttribute('src') : '';
                        if (imgSrc === "./media/play.png") PythonIDE.runCode();
                        if (imgSrc === "./media/step.png") PythonIDE.runCode("step");
                        break;
                }
            });
        });
        
        PythonIDE.autoSize();
        // Ініціалізація налаштувань
		PythonIDE.initSettings();
    },
//
// Ініціалізація налаштувань
initSettings: function() {
    // Слайдер розміру шрифту коду
    const sliderCodeSize = document.getElementById('slider_code_size');
    const txtCodeSize = document.getElementById('txt_code_size');
    
    if (sliderCodeSize && txtCodeSize) {
        const codeSize = PythonIDE.getOption('codeSize', 12);
        sliderCodeSize.value = codeSize;
        txtCodeSize.value = codeSize + "pt";
        
        // Застосовуємо початковий розмір шрифту
        const editorEl = document.querySelector('.CodeMirror');
        if (editorEl) {
            editorEl.style.fontSize = codeSize + 'pt';
        }
        
        // Обробник зміни слайдера
        sliderCodeSize.addEventListener('input', function() {
            txtCodeSize.value = this.value + "pt";
            if (editorEl) {
                editorEl.style.fontSize = this.value + 'pt';
            }
            PythonIDE.setOption('codeSize', this.value);
        });
    }
    
    // Слайдер розміру шрифту виводу
    const sliderOutputSize = document.getElementById('slider_output_size');
    const txtOutputSize = document.getElementById('txt_output_size');
    
    if (sliderOutputSize && txtOutputSize) {
        const outputSize = PythonIDE.getOption('outputSize', 12);
        sliderOutputSize.value = outputSize;
        txtOutputSize.value = outputSize + "pt";
        
        // Застосовуємо початковий розмір шрифту
        const outputEl = document.getElementById('output');
        if (outputEl) {
            outputEl.style.fontSize = outputSize + 'pt';
        }
        
        // Обробник зміни слайдера
        sliderOutputSize.addEventListener('input', function() {
            txtOutputSize.value = this.value + "pt";
            if (outputEl) {
                outputEl.style.fontSize = this.value + 'pt';
            }
            PythonIDE.setOption('outputSize', this.value);
        });
    }
    
    // Слайдер прозорості вікна виводу
    const sliderOutputTransparency = document.getElementById('slider_output_transparency');
    const txtOutputTransparency = document.getElementById('txt_output_transparency');
    
    if (sliderOutputTransparency && txtOutputTransparency) {
        const outputTransparency = PythonIDE.getOption('outputTransparency', 0);
        sliderOutputTransparency.value = outputTransparency;
        txtOutputTransparency.value = outputTransparency + "%";
        
        // Обробник зміни слайдера
        sliderOutputTransparency.addEventListener('input', function() {
            txtOutputTransparency.value = this.value + "%";
            const dlg = document.getElementById('dlg');
            if (dlg && dlg.parentElement) {
                dlg.parentElement.style.opacity = 1 - (this.value / 100);
            }
            PythonIDE.setOption('outputTransparency', this.value);
        });
    }
    
    // Слайдер часу анімації
    const sliderStepAnimTime = document.getElementById('slider_step_anim_time');
    const txtStepAnimTime = document.getElementById('txt_step_anim_time');
    
    if (sliderStepAnimTime && txtStepAnimTime) {
        const stepAnimTime = PythonIDE.getOption('stepAnimTime', 500);
        sliderStepAnimTime.value = stepAnimTime;
        txtStepAnimTime.value = stepAnimTime + "ms";
        
        // Обробник зміни слайдера
        sliderStepAnimTime.addEventListener('input', function() {
            txtStepAnimTime.value = this.value + "ms";
            PythonIDE.setOption('stepAnimtime', this.value);
        });
    }
    
    // Радіокнопки режиму запуску
    const radioRunModeElements = document.querySelectorAll('input[name="radio_run_mode"]');
    radioRunModeElements.forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const id = this.id;
                switch(id) {
                    case 'radio_run_mode_all':
                        PythonIDE.runMode = "normal";
                        const btnRun = document.getElementById('btn_run');
                        if (btnRun) btnRun.src = "./media/play.png";
                        break;
                    case 'radio_run_mode_single':
                        PythonIDE.runMode = "step";
                        const btnRunStep = document.getElementById('btn_run');
                        if (btnRunStep) btnRunStep.src = "./media/step.png";
                        break;
                    case 'radio_run_mode_anim':
                        PythonIDE.runMode = "anim";
                        break;
                }
            }
        });
    });
    
    // Радіокнопки стилю редактора
    const radioCodeStyleElements = document.querySelectorAll('input[name="radio_code_style"]');
    radioCodeStyleElements.forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const id = this.id;
                switch(id) {
                    case 'radio_code_style_light':
                        if (PythonIDE.editor) {
                            PythonIDE.editor.setOption("theme", "default");
                        }
                        document.body.style.backgroundColor = '#FFF';
                        const editorContainer = document.getElementById('editorContainer');
                        if (editorContainer) editorContainer.style.backgroundColor = '#FFF';
                        PythonIDE.setOption('code_style', 'light');
                        break;
                    case 'radio_code_style_dark':
                        if (PythonIDE.editor) {
                            PythonIDE.editor.setOption("theme", "blackboard");
                        }
                        document.body.style.backgroundColor = '#000';
                        const editorContainerDark = document.getElementById('editorContainer');
                        if (editorContainerDark) editorContainerDark.style.backgroundColor = '#0c1021';
                        PythonIDE.setOption('code_style', 'dark');
                        break;
                    case 'radio_code_style_dusk':
                        if (PythonIDE.editor) {
                            PythonIDE.editor.setOption("theme", "cobalt");
                        }
                        document.body.style.backgroundColor = '#002240';
                        const editorContainerDusk = document.getElementById('editorContainer');
                        if (editorContainerDusk) editorContainerDusk.style.backgroundColor = '#002240';
                        PythonIDE.setOption('code_style', 'dusk');
                        break;
                }
            }
        });
    });
    
    // Встановлюємо початковий вибраний стиль редактора
    const codeStyle = PythonIDE.getOption('code_style', 'light');
    const radioCodeStyleChecked = document.getElementById('radio_code_style_' + codeStyle);
    if (radioCodeStyleChecked) {
        radioCodeStyleChecked.checked = true;
        // Тригеримо подію change для застосування стилю
        const event = new Event('change');
        radioCodeStyleChecked.dispatchEvent(event);
    }
    
    // Радіокнопки стилю консолі
    const radioOutputStyleElements = document.querySelectorAll('input[name="radio_output_style"]');
    radioOutputStyleElements.forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const id = this.id;
                switch(id) {
                    case 'radio_output_style_light':
                        const consoleContainerLight = document.getElementById('consoleContainer');
                        if (consoleContainerLight) {
                            consoleContainerLight.style.backgroundColor = '#FFF';
                            consoleContainerLight.style.color = '#000';
                        }
                        PythonIDE.setOption('output_style', 'light');
                        break;
                    case 'radio_output_style_dark':
                        const consoleContainerDark = document.getElementById('consoleContainer');
                        if (consoleContainerDark) {
                            consoleContainerDark.style.backgroundColor = '#111';
                            consoleContainerDark.style.color = '#CCC';
                        }
                        PythonIDE.setOption('output_style', 'dark');
                        break;
                    case 'radio_output_style_dusk':
                        const consoleContainerDusk = document.getElementById('consoleContainer');
                        if (consoleContainerDusk) {
                            consoleContainerDusk.style.backgroundColor = '#002240';
                            consoleContainerDusk.style.color = '#CCC';
                        }
                        PythonIDE.setOption('output_style', 'dusk');
                        break;
                }
            }
        });
    });
    
    // Встановлюємо початковий вибраний стиль консолі
    const outputStyle = PythonIDE.getOption('output_style', 'dark');
    const radioOutputStyleChecked = document.getElementById('radio_output_style_' + outputStyle);
    if (radioOutputStyleChecked) {
        radioOutputStyleChecked.checked = true;
        // Тригеримо подію change для застосування стилю
        const event = new Event('change');
        radioOutputStyleChecked.dispatchEvent(event);
    }
},
// Ініціалізація обробників для налаштувань
initSettingsEvents: function() {
    // Викликаємо ініціалізацію налаштувань
    PythonIDE.initSettings();
    
    // Зміна режиму запуску - показ/приховування налаштування часу
    const radioRunModes = document.querySelectorAll('input[name="radio_run_mode"]');
    radioRunModes.forEach(function(radio) {
        radio.addEventListener('change', function() {
            PythonIDE.toggleAnimTimeSetting();
        });
    });
    
    // Зміна стилю редактора
    const radioEditorStyles = document.querySelectorAll('input[name="radio_code_style"]');
    radioEditorStyles.forEach(function(radio) {
        radio.addEventListener('change', function() {
            PythonIDE.updateRadioColors();
        });
    });
    
    // Зміна стилю консолі
    const radioConsoleStyles = document.querySelectorAll('input[name="radio_output_style"]');
    radioConsoleStyles.forEach(function(radio) {
        radio.addEventListener('change', function() {
            PythonIDE.updateRadioColors();
        });
    });    
  
    // Кнопка закриття
    const btnSettingsClose = document.getElementById('btn_settings_close');
    if (btnSettingsClose) {
        btnSettingsClose.removeEventListener('click', PythonIDE.closeSettings);
        btnSettingsClose.addEventListener('click', PythonIDE.closeSettings);
    }
    
    // Закриття при кліку поза вікном
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.removeEventListener('click', PythonIDE.closeSettingsOnClickOutside);
        settingsModal.addEventListener('click', PythonIDE.closeSettingsOnClickOutside);
    }
},  
//    
    resetFiles: function(all) {
        if(PythonIDE.aT && PythonIDE.hash && PythonIDE.aT[PythonIDE.hash] && PythonIDE.defaultSavedCode) {
            PythonIDE.saveSnapshot();
            delete PythonIDE.aT[PythonIDE.hash];
            PythonIDE.aT[PythonIDE.hash] = {r:false, v:Date.now(), t:false, s:0, m:0};
            localStorage.aT = JSON.stringify(PythonIDE.aT);
            PythonIDE.files = JSON.parse(PythonIDE.defaultSavedCode);
            PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
            PythonIDE.updateFileTabs();
            PythonIDE.showHint(selectedLang === 'en' ? "Restore the saved default code. To cancel, use the restore code button." : "Відновити збережений код за замовчуванням. Для скасування скористайтеся кнопкою відновлення коду.");
        }
    }
};
