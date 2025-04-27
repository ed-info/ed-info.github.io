/*
This file is used by `filedialog.html` in the same folder, to provide a demo
GUI for browsing a `jsfs` filesystem.

This web page is used inside an `<iframe>` of another page, and thus it uses
message-passing (`onmessage` an `postMessage` calls) to communicate with
that outer page.

We therefore create two functions to handle this task.  The first one
listens for messages from the outer page and handles them by turning them
into function calls.  This permits the outer page to call any
(already-defined) function in the inner page.  The message's data should be
an array mimicking the function signature.  E.g., to call `f(a,b,c)`, send
the array `['f',a,b,c]` to this page using `postMessage`.
 */
var   fsToBrowse;
(function() {
  var allExtensions, askToDeleteEntry, changeFolder, clearActionLinks, fileBrowserMode, icon, imitateDialog, makeActionLink, makeTable, rowOf3, setup, tellPage, validBrowserModes,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.onmessage = function(e) {
    var fname;
    if (!(e.data instanceof Array)) {
      return console.log('Invalid message from page:', e.data);
    }
    fname = e.data.shift();
    if (typeof window[fname] !== 'function') {
      return console.log('Cannot call non-function:', fname);
    }
    return window[fname].apply(null, e.data);
  };
  /*
  The second function that handles message-passing with the page is for
  communication in the other direction.  To tell the page any data, simply
  pass it to the `tellPage` routine, and it will be posted to the containing
  window via `postMessage`.
   */
  tellPage = function(message) {
    return window.parent.postMessage(message, '*');
  };
  /*
  The following variables determine the state of this page.
  
  This dialog can browse any filesystem stored in LocalStorage.  It defaults
  to browsing the one created in the demo page [index.html](index.html).
   */
  fsToBrowse = new FileSystem('epythonfs');
  /*
  When setting the name of the filesystem to browse, an entirely new
  `FileSystem` object is created.  The old one is discarded.
   */
  window.setFileSystemName = function(name) {
    fsToBrowse = new FileSystem(name);
    return updateFileBrowser();
  };
  /*
  It can be in one of several modes, stored in a global variable, here.
   */
  fileBrowserMode = null;
  /*
  Here are the valid modes, and a routine for changing the mode.  It
  automatically calls the update function defined later for keeping the view
  fresh.
   */
  validBrowserModes = ['manage files', 'open file', 'save file', 'open folder', 'save in folder'];

  window.setFileBrowserMode = function(mode) {
    if (indexOf.call(validBrowserModes, mode) >= 0) {
      fileBrowserMode = mode;
    }
    return updateFileBrowser();
  };
  /*
  When moving a file, we store in this global variable the name, folder, and
  absolute path of the file being moved.
   */
  window.fileBeingMoved = {};
  /*
  When opening a file, one particular file will be selected before the user
  clicks the "Open" button.  This global variable records the name of that
  file.  Only the name is needed, not the path, since only files in the
  current directory can be selected.
   */
  window.fileToBeOpened = null;

  window.selectFile = function(name) {
    window.fileToBeOpened = name;
    console.log('selectedFile=', name);
    //tellPage(['selectedFile', name]);
    return updateFileBrowser();
  };
  /*
  Whenever the browser changes folders, several things must happen, so it is
  convenient to collect them into one method.  First, the filesystem itself
  must change its cwd.  Second, the page containing this browser must be
  notified.  Finally, any selected file needs to be deselected, thus updating
  the view.
   */
  changeFolder = function(destination) {
    fsToBrowse.cd(destination);
    console.log('changedFolder=', fsToBrowse.getCwd());
    //tellPage(['changedFolder', fsToBrowse.getCwd()]);
    return selectFile(null);
  };
  /*
  It can imitate a dialog box by adding a status bar and title bar; whether to
  do so is stored in a global variable, here.
   */
  imitateDialog = false;
  /*
  Whether to imitate a dialog can only be true or false, so we use `!!` to
  coerce things to a boolean.
   */
  window.setDialogImitation = function(enable) {
    if (enable == null) {
      enable = true;
    }
    imitateDialog = !!enable;
    return updateFileBrowser();
  };
  /*
  It's also important to be able to programmatically click buttons.  The
  default way this works is that the call is passed along to the `tellPage`
  function in `filedialog.html`, which, in turn, sends it to the containing
  page via inter-frame message passing.  If you re-use this demo UI in an
  actual application, this behavior can be overridden at either level; you can
  assign a new handler over this function, or over `tellPage`, whichever you
  prefer.
   */

  window.buttonClicked = function(name) {
  /*
  The only button we handle internally is the "New folder" button.  All others
  are passed on to the page.
   */

	  
    var args, folderName, path, success;
    if (name === 'New folder') {
      folderName = prompt('Введіть назву створюваної теки', 'Мої файли');
      if (fsToBrowse.mkdir(folderName)) {
        updateFileBrowser();
      } else {
        alert('Тека з таким іменем вже існує.');
      }
      return;
    }
   /*
  All other buttons are handled externally, but some need special processing
  before we pass to the page the information that a button was clicked.  We
  store any additional information we'll be passing the page in the following
  arguments list.
   */   
    args = [];
   /*
  When passing the "Save" button, also pass the currently-chosen filename
  under which to save.  But if a file is actually being moved, then send a
  "move" signal instead of a "save" signal.  The file will be moved right now,
  and the signal will indicate whether the move succeeded or failed.
   */   
    if (name === 'Save') {
      path = fsToBrowse.getCwd();
      if (path.slice(-1) !== FileSystem.prototype.pathSeparator) {
        path += FileSystem.prototype.pathSeparator;
      }
      args.push(path + saveFileName.value);
      if (fileBeingMoved.name) {
        args.unshift(fileBeingMoved.full);
        if (fileBeingMoved.copy) {
          success = fsToBrowse.cp(fileBeingMoved.full, path + saveFileName.value);
          name = success ? 'Copied' : 'Copy failed';
        } else {
          success = fsToBrowse.mv(fileBeingMoved.full, path + saveFileName.value);
          name = success ? 'Moved' : 'Move failed';
        }
      }
    }
  /*
  When passing the "Save here" button, also pass the current working
  directory.
   */    
    if (name === 'Save here') {
      args.push(fsToBrowse.getCwd());
    }
    if (name === 'Get file') {
      console.log("Get file");
      var fullPath = document.getElementById("filename");
	  console.log("fullPath:",fullPath);
    }
  /*
  When passing the "Open" button, also pass the full path to the file to open.
   */    
    if (name === 'Open') {
      path = fsToBrowse.getCwd();
      if (path.slice(-1) !== FileSystem.prototype.pathSeparator) {
        path += FileSystem.prototype.pathSeparator;
      }
      args.push(path + fileToBeOpened);
      viewFile(path + fileToBeOpened);
    }
  /*
  When passing the "Open this folder" button, also pass the cwd.
   */    
    if (name === 'Open this folder') {
      args.push(fsToBrowse.getCwd());
      name = 'Open folder';
    }
  /*
  Send signal now.  Also, any button that was clicked in the status bar
  completes the job of this dialog, thus returning us to "manage files" mode,
  if the dialog even remains open.  Thus we make that change now.
   */    
    //tellPage(['buttonClicked', name].concat(args));
    window.fileBeingMoved = {};
    selectFile(null);
    return setFileBrowserMode('manage files');
  };
  /*
  When the demo GUI page loads, the following setup routine must get called.
  It simply sets the default mode, which also populates the view, and notifies
  the page of the initial cwd.
   */
  window.onload = setup = function() {
	
    setFileBrowserMode('manage files');
    return changeFolder('.');
  };

    
  /*
  The following function prompts the user, and if they agree, it deletes the
  given file or folder permanently.  If they disagree, it does nothing.  If it
  deletes the file or folder, then it updates the browser.
   */
  askToDeleteEntry = function(entry) {
    if (confirm('Бажаєте видалити назавжди "' + entry + '"?')) {
      fsToBrowse.rm(entry);
      return updateFileBrowser();
    }
  };
  /*
  Every time the view needs to be updated, the update routine defined below
  will do so.  It will recompute the HTML content of the document body and
  write it.
  
  The update routine is as follows.
   */
  window.updateFileBrowser = function() {
    var I, T, X, action, buttons, disable, e, entries, entry, extensions, features, file, filter, folder, index, interior, j, k, l, len, len1, len2, oldIndex, oldName, path, ref, ref1, statusbar, text, title, titlebar;
  /*
  We will track the set of features that need to be enabled or disabled,
  depending on the mode in which the dialog is operating.  This defaults to
  the settings required for "manage files" mode.
   */
    features = {
      navigateFolders: true,
      deleteFolders: true,
      viewFiles:true,
      deleteFiles: true,
      createFolders: true,
      fileNameTextBox: false,
      filesDisabled: false,
      moveFiles: true,
      moveFolders: true,
      copyFiles: true,
      extensionFilter: false,
      selectFile: true
    };
   /*
  We also set up other defaults, for title bar and status bar content.
   */   
    title = fileBrowserMode ? fileBrowserMode[0].toUpperCase() + fileBrowserMode.slice(1) : '';
    buttons = [];
  /*
  Now we update the above default options based on the current mode.  If the
  mode has somehow been set to an invalid value, the defaults will hold.
   */    
    if (fileBrowserMode === 'manage files') {
	  title = "Керування файлами";
      buttons = ['New folder', 'Get file'];
    } else if (fileBrowserMode === 'save file') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.fileNameTextBox = true;
      title = 'Зберегти як...';
      buttons = ['Cancel', 'Save'];
      if (imitateDialog) {
        buttons.unshift('New folder');
      }
    } else if (fileBrowserMode === 'save in folder') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.filesDisabled = true;
      title = 'Зберегти в...';
      buttons = ['New folder', 'Cancel', 'Save here'];
    } else if (fileBrowserMode === 'open file') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.extensionFilter = features.selectFile = true;
      buttons = ['Cancel', 'Open'];
    } else if (fileBrowserMode === 'open folder') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.filesDisabled = true;
      buttons = ['Cancel', 'Open this folder'];
    }
/*
  We will store in the following array the set of entries that will show up in
  the center of the dialog, in a two-column tables.
*/   
    entries = [];
/*
  We add to that array all the folders in the cwd.  These are links if and
  only if `navigateFolders` was enabled in the features set.
  
  First, the link to the parent folder, if and only if we're not at the
  filesystem root.
*/   
    if (fsToBrowse.getCwd() !== FileSystem.prototype.pathSeparator) {
      I = icon('up-arrow');
      T = 'На рівень вище';
      if (features.navigateFolders) {
        action = function() {
          return changeFolder('..');
        };
        I = makeActionLink(I, 'Go up to parent folder', action);
        T = makeActionLink(T, 'Go up to parent folder', action);
      }
      entries.push(rowOf3(I, T));
    }
/*
Далі посилання на всі інші папки в cwd. Це так само, як
 батьківської папки, за винятком того, що їх також можна видалити або перемістити, якщо і тільки якщо
 У наборі функцій увімкнено функцію `deleteFolders` або `moveFolders`.
*/   
    ref = fsToBrowse.ls('.', 'folders');
    for (j = 0, len = ref.length; j < len; j++) {
      folder = ref[j];
      I = icon('folder');
      T = folder;
      if (features.navigateFolders) {
        (function(folder) {
          action = function() {
            return changeFolder(folder);
          };
          I = makeActionLink(I, 'Відкрити теку ' + folder, action);
          return T = makeActionLink(T, 'Відкрити теку ' + folder, action);
        })(folder);
      }
      X = '';
      if (features.deleteFolders) {
        (function(folder) {
          return X += makeActionLink(icon('delete'), 'Видалити теку ' + folder, function() {
            return askToDeleteEntry(folder);
          });
        })(folder);
      }
      
      if (features.moveFolders) {
        (function(folder) {
          return X += makeActionLink(icon('movefolder'), 'Перемістити теку ' + folder, function() {
            var sep;
            window.fileBeingMoved = {
              name: folder
            };
            fileBeingMoved.path = fsToBrowse.getCwd();
            fileBeingMoved.full = fileBeingMoved.path;
            sep = FileSystem.prototype.pathSeparator;
            if (fileBeingMoved.full.slice(-1) !== sep) {
              fileBeingMoved.full += sep;
            }
            fileBeingMoved.full += folder;
            fileBeingMoved.copy = false;
            fileBrowserMode = 'save file';
            return updateFileBrowser();
          });
        })(folder);
      }
      
      entries.push(rowOf3(I, T, X));
    }
/*
Після папок у cwd ми також перераховуємо всі файли в cwd. Ці
 не можна переходити, але їх можна видаляти, переміщувати, копіювати або вибирати, якщо
 `deleteFiles`, `moveFiles`, `copyFiles` або `selectFile` ввімкнено в наборі функцій.

 Крім того, файли можна фільтрувати за допомогою розкривного списку розширень. Давайте
 дізнатися, чи вибрав користувач елемент із цього списку.
*/
    
    filter = typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.options[typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.selectedIndex : void 0].value : void 0;
    if (filter === '*.*') {
      filter = null;
    } else {
      filter = filter != null ? filter.slice(1) : void 0;
    }
   /*
  Now proceed to examine all the files.
   */
    ref1 = fsToBrowse.ls('.', 'files');
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      file = ref1[k];
      if (filter && file.slice(-filter.length) !== filter) {
        continue;
      }
      I = icon('text-file');
      T = file;
      if (features.filesDisabled) {
        T = "<font color='#888888'>" + T + "</font>";
      } else if (features.selectFile) {
        (function(file) {
          action = function() {
            return selectFile(file);
          };
          I = makeActionLink(I, 'Open ' + file, action);
          return T = makeActionLink(T, 'Open ' + file, action);
        })(file);
      }
      if (features.fileNameTextBox) {
        (function(file) {
          action = function() {
            saveFileName.value = file;
            return saveBoxKeyPressed();
          };
          I = makeActionLink(I, 'Save as ' + file, action);
          return T = makeActionLink(T, 'Save as ' + file, action);
        })(file);
      }
      X = '';
      if (features.viewFiles) {
        (function(file) {
          return X += makeActionLink(icon('view'), 'Переглянути файл ' + file, function() {
            console.log("View file:",file);
            
            
            buttonClicked('Open');           
            return updateFileBrowser();
          });
        })(file);
      }
     
      
      if (features.moveFiles) {
        (function(file) {
          return X += makeActionLink(icon('move'), 'Перемістити файл ' + file, function() {
            var sep;
            window.fileBeingMoved = {
              name: file
            };
            fileBeingMoved.path = fsToBrowse.getCwd();
            fileBeingMoved.full = fileBeingMoved.path;
            sep = FileSystem.prototype.pathSeparator;
            if (fileBeingMoved.full.slice(-1) !== sep) {
              fileBeingMoved.full += sep;
            }
            fileBeingMoved.full += file;
            fileBeingMoved.copy = false;
            fileBrowserMode = 'save file';
            return updateFileBrowser();
          });
        })(file);
      }
      
      if (features.copyFiles) {
        (function(file) {
          return X += makeActionLink(icon('download'), 'Зберегти файл ' + file, function() {
            var sep;
            window.fileBeingMoved = {
              name: file
            };
            fileBeingMoved.path = fsToBrowse.getCwd();
            fileBeingMoved.full = fileBeingMoved.path;
            sep = FileSystem.prototype.pathSeparator;
            if (fileBeingMoved.full.slice(-1) !== sep) {
              fileBeingMoved.full += sep;
            }
            fileBeingMoved.full += file;
            fileBeingMoved.copy = true;
            fileBrowserMode = 'save file';
            return updateFileBrowser();
          });
        })(file);
      }
      
       if (features.deleteFiles) {
        (function(file) {
          return X += makeActionLink(icon('delete'), 'Видалити файл ' + file, function() {
            return askToDeleteEntry(file);
          });
        })(file);
      }
      
      entry = rowOf3(I, T, X);
      if (fileToBeOpened === file) {
        entry = "SELECT" + entry;
      }
      entries.push(entry);
    }
   /*
  Now create the interior of the dialog using the `makeTable` function,
  defined below.  If the entries list is empty, then we must be at the root
  and there are no files or folders, so in that unusual case, include a
  message indicating that the entire filesystem is empty.
   */   
    if (entries.length === 0) {
      entries.push('(empty filesystem)');
    }
    interior = makeTable(entries);
   /*
  If this is a "save" dialog, we need a text box into which to type the
  filename under which we wish to save.  We add it to the status bar, but if
  we are not in dialog-imitation mode, that will automatically get moved into
  the content proper.
   */   
    titlebar = statusbar = '';
    if (features.fileNameTextBox) {
      statusbar += "Назва: <input id='saveFileName' type='text' style='font-size:12' size=40 onkeyup='saveBoxKeyPressed(event);'/>";
    }
    if (features.extensionFilter) {
      extensions = (function() {
        var l, len2, ref2, results;
        ref2 = allExtensions();
        results = [];
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          e = ref2[l];
          results.push("<option>" + e + "</option>");
        }
        return results;
      })();
      statusbar += "File type: <select id='fileFilter' onchange='updateFileBrowser();'> " + (extensions.join('\n')) + " </select>";
    }
  /*
  Construct the HTML for the buttons, which may be used in the status bar or
  above it.
   */    
    for (index = l = 0, len2 = buttons.length; l < len2; index = ++l) {
      text = buttons[index];
      disable = '';
      if (text === 'Open' && !fileToBeOpened) {
        disable = 'disabled=true';
      }
      buttons[index] = "<input type='button' value='";
      var vimg ="'";
      var vtxt =text;
      if (text === "Open") { vtxt = "Відкрити"}
      if (text === "Get file") { vtxt = "'"}
      if (text === "New folder") { vtxt = " Створити теку";vimg=' '}
      if (text === "Cancel") { vtxt = "Скасувати"}
      if (text === "Save here") { vtxt = "Зберегти тут"}
      if (text === "Save") { vtxt = "Зберегти"}
      if (text === "Open this folder") { vtxt = "Відкрити цю теку"}
      var onclick = vimg+" style='width:130px;height:32px;font-size:12' onclick='buttonClicked(\"" + text + "\");'";
      
      
      buttons[index] = buttons[index] + vtxt  + "' id='statusBarButton" + text + "' " + disable + onclick + ">";
      if (text === "New folder") { 
		   buttons[index]="<button style='width:143px;height:32px;font-size:12' onclick='newFolder()'"+"><i class='fa fa-folder' ></i> Створити теку</button>"
		  };
      if (text === "Get file") { 
		   buttons[index]="<button style='width:133px;height:32px;font-size:12' onclick='document.getElementById("+ String.fromCharCode(34)+'getfile'+ String.fromCharCode(34)+").click()'"+"><i class='fa fa-file-o' ></i> Додати файл</button><input type='file' id='getfile' onchange='readFile(this)' style='display:none'>"
		  };
	  
    }
    buttons = buttons.join(' ');

  /*
  The interior of the dialog is created.  We will add to it a title bar and a
  status bar if and only if we have been asked to do so.  The following code
  checks to see if we are supposed to imitate a dialog box, and if so, creates
  the necessary HTML to do so.
   */

    if (imitateDialog) {
      path = fsToBrowse.getCwd();
      if (path === FileSystem.prototype.pathSeparator) {
        path += ' (верхній рівень';
      }
      titlebar = "<table border=1 cellpadding=5 cellspacing=0 width=100% height=100%> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=33%> <b>" + title + "</b> </td> <td align=center width=34%> Місце: " + path + " </td> <td align=right width=33%><select id='modSelector' onchange='modSelector(this)'><option value='manage files'>Manage files</option><option value='open file'>Open file</option><option value='save file'>Save file</option><option value='open folder'>Open folder</option><option value='save in folder'>Save in folder</option></select>  " + (icon('close')) + " </td> </tr> </table> </td> </tr> <tr> <td bgcolor=#fafafa valign=top>";
      
      statusbar = "   </td> </tr> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=50%> " + statusbar + " </td> <td align=right width=50%> " + buttons + " </td> </tr> </table> </td> </tr> </table>"+"<img id='imgsrc' src=''>"+ "</center> </div>";
    } else {
      if (window.fileBeingMoved.name) {
        statusbar += " &nbsp; " + buttons;
      }
      //statusbar = "<div style='position: absolute; bottom: 0; width: 90%; margin-bottom: 5px;'> <center>" + statusbar;
       statusbar = "   </td> </tr> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=50%> " + statusbar + " </td> <td align=right width=50%> " + buttons + " </td> </tr> </table> </td> </tr> </table>"+"<img id='imgsrc' src=''>"+ "</center> </div>";
    }
    
   /*
  Place the final result in the document.
  
  If there is a "save file" text box, preserve its contents across changes to
  the DOM.  Do the same for a "file type" drop-down list.
  
  Also, there is a global variable that can be set to contain the name of the
  file being moved, when a move operation is in process; if that is the case,
  then use that as the save filename.
   */
      
    oldName = (typeof saveFileName !== "undefined" && saveFileName !== null ? saveFileName.value : void 0) || (typeof fileBeingMoved !== "undefined" && fileBeingMoved !== null ? fileBeingMoved.name : void 0);
    oldIndex = typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.selectedIndex : void 0;
    
    //document.body.innerHTML = titlebar + interior + statusbar;
    var screenWidth = $(document).width();
    var dlgWidth=600;
    if (screenWidth<500) {dlgWidth=400}
    var fdlg = $("#filemanager").dialog({
                    autoOpen: false,
                    maxWidth:dlgWidth,
                    maxHeight: 500,
                    width: dlgWidth,                   
                    modal: false                    
    });
    

    fdlg.css("display", "block");
    fdlg.html(interior + statusbar);
    
    
    if (oldName && (typeof saveFileName !== "undefined" && saveFileName !== null)) {
      saveFileName.value = oldName;
    }
    if (oldIndex && (typeof fileFilter !== "undefined" && fileFilter !== null)) {
      fileFilter.selectedIndex = oldIndex;
    }
    saveBoxKeyPressed();
    if (typeof saveFileName !== "undefined" && saveFileName !== null) {
      return saveFileName.focus();
    }
  };
  /*
  The above function depends on a handler to enable/disable the Save button
  based on whether the file name has been filled in.  The following function
  is that handler.  It also simulates Save/Cancel button presses in response
  to Enter/Escape key presses, respectively.
   */
  window.saveBoxKeyPressed = function(event) {
    var name;
    name = typeof saveFileName !== "undefined" && saveFileName !== null ? saveFileName.value : void 0;
    if (typeof statusBarButtonSave !== "undefined" && statusBarButtonSave !== null) {
      statusBarButtonSave.disabled = !name;
    }
    if (typeof name === 'string') {
      tellPage(['saveFileNameChanged', name]);
    }
    if ((event != null ? event.keyCode : void 0) === 13) {
      return buttonClicked('Save');
    }
    if ((event != null ? event.keyCode : void 0) === 27) {
      return buttonClicked('Cancel');
    }
  };
  /*
  The following utility function makes a two-column table out of the string
  array given as input.  This is useful for populating the file dialog.
   */
  makeTable = function(entries) {
    var half, i, j, lcolor, left, rcolor, ref, result, right;
    result = '<table border=0 width=100% cellspacing=5 cellpadding=5>';
    half = Math.ceil(entries.length / 2);
    for (i = j = 0, ref = half; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      left = entries[i];
      lcolor = 'bgcolor=#e8e8e8';
      if (left.slice(0, 6) === 'SELECT') {
        lcolor = 'bgcolor=#ddddff';
        left = left.slice(6);
      }
      right = entries[i + half];
      rcolor = 'bgcolor=#e8e8e8';
      if (!right) {
        rcolor = '';
      } else if (right.slice(0, 6) === 'SELECT') {
        rcolor = 'bgcolor=#ddddff';
        right = right.slice(6);
      }
      result += "<tr> <td width=50% " + lcolor + ">" + left + "</td> <td width=50% " + rcolor + ">" + (right || '') + "</td> </tr>";
    }
    return result + '</table>';
  };
  /*
  The following utility function makes a link that calls a script function.
   */
  window.actionLinks = [];

  clearActionLinks = function() {
    var actionLinks;
    return actionLinks = [];
  };

  makeActionLink = function(text, tooltip, func) {
    var number;
    number = actionLinks.length;
    actionLinks.push(func);
    return "<a href='javascript:void(0);' title='" + tooltip + "' onclick='actionLinks[" + number + "]();'>" + text + "</a>";
  };
  /*
  The following utility function makes an icon from one in the demo folder.
   */
  icon = function(name) {
    return "<img src='media/" + name + ".png'>";
  };
  /*
  The following utility function makes a three-part row, where the first part
  is an icon (or empty), the second part is left-justified text, and the third
  part is right-justified content (or empty).
   */
  rowOf3 = function(icon, text, more) {
    if (more == null) {
      more = '';
    }
    return "<table border=0 cellpadding=0 cellspacing=0 width=100%><tr> <td width=22>" + (icon || '') + "</td> <td align=left>" + text + " &nbsp; &nbsp; </td> <td align=left width=66><nobr>" + more + "</nobr></td></tr></table>";
  };
  /*
  The following utility function finds all extensions on all files in the
  whole filesystem, and returns them in alphabetical order.  This is useful
  for creating a drop-down list of extensions for filtering in the "open"
  version of the dialog.
   */
  allExtensions = function(F) {
    var extension, file, folder, j, k, l, len, len1, len2, ref, ref1, ref2, result;
    if (F == null) {
      F = null;
    }
    if (!F) {
      F = new FileSystem(fsToBrowse.getName());
    }
    result = ['*.*'];
    ref = F.ls('.', 'files');
    for (j = 0, len = ref.length; j < len; j++) {
      file = ref[j];
      extension = /\.[^.]*?$/.exec(file);
      if (extension) {
        extension = '*' + extension;
        if (indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
    }
    ref1 = F.ls('.', 'folders');
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      folder = ref1[k];
      F.cd(folder);
      ref2 = allExtensions(F);
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        extension = ref2[l];
        if (indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
      F.cd('..');
    }
    return result.sort();
  };

}).call(this);
function openFileBrowser() {
	  $("#filemanager").dialog("option","title","Розпорядник файлів").dialog('open');
	}
// View selected file
function openDialog(file,message) {
    if ($('#vdialog').length == 0) {
        $(document.body).append('<div id="vdialog">'+message+'</div>');
    } else {
        $('#vdialog').html(message);
    }
    $( "#vdialog" ).dialog({
        autoOpen: false,
        show: "blind",
        hide: "explode"
    });
    $( "#vdialog" ).dialog("option","title",file).dialog('open');
    $("#vdialog" ).dialog("widget").position({
       my: 'left',
       at: 'right'
    });
}
function viewFile(file) {
  console.log("View file:",file);
  if(file==="/null"){return}
  var content = fsToBrowse.read( file );
  var fileExt = file.split('.').pop();
  if ( typeof( content ) != 'string' )
      content = JSON.stringify( content, null, 2 );
      content = content.replace(/(?:\r\n|\r|\n)/g, '<br>');
 
      if (fileExt=='txt'){ openDialog(file,"<p>"+content+"</p>");}
      if (fileExt=='png'){ openDialog(file,"<img src='"+content+"'>");}

return;
}
   function newFolder(){      
      folderName = prompt('Введіть назву створюваної теки', 'Мої файли');
      if (fsToBrowse.mkdir(folderName)) {
        updateFileBrowser();
      } else {
        alert('Тека з таким іменем вже існує.');
      }
      return;
  } 

 /*
  read File
  */ 
function readFile(input) {
  
  let file = input.files[0];
  console.log("File:",file.name);
  var fileExt = file.name.split('.').pop();
  if ((fileExt==="txt")||(fileExt==="png")){
   let reader = new FileReader();
   if (fileExt==="txt"){
	 console.log("Store txt file");
     reader.readAsText(file);

       reader.onload = function() {
        console.log(reader.result);
  
        fsToBrowse.write(file.name,reader.result);
        updateFileBrowser();
       };

      reader.onerror = function() {
        console.log(reader.error);
      }
     } //end txt
   if (fileExt==="png"){
	   console.log("Store png file");


        document.getElementById("imgsrc").style.display = "none";     
        

        reader.onload = function (e) {
            document.getElementById('imgsrc').src =  e.target.result;
            fsToBrowse.write(file.name,e.target.result);
            updateFileBrowser();
        }

        reader.readAsDataURL(file);
 }
}
 else {alert("Недопустимий тип файлу, дозволено лише '.txt' та '.png'!")} 

}
function modSelector(selectObject) {
  var value = selectObject.value;  
  console.log("Select:",value);
  setFileBrowserMode(value);
  
}
