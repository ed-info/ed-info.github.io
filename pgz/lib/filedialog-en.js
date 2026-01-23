var   fsToBrowse;
(function() {
  var allExtensions, askToDeleteEntry, changeFolder, clearActionLinks, fileBrowserMode, icon, imitateDialog, makeActionLink, makeTable, rowOf3, setup, tellPage, validBrowserModes,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

// Обробка повідомлень від зовнішньої сторінки (через postMessage)
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

  tellPage = function(message) {
    return window.parent.postMessage(message, '*');
  };

  fsToBrowse = new FileSystem("PGZfs");

  window.setFileSystemName = function(name) {
    fsToBrowse = new FileSystem(name);
// Основна функція: оновлює інтерфейс файлового менеджера
    return updateFileBrowser();
  };

  fileBrowserMode = null;

  validBrowserModes = ['manage files', 'open file', 'save file', 'open folder', 'save in folder'];

  window.setFileBrowserMode = function(mode) {
    if (indexOf.call(validBrowserModes, mode) >= 0) {
      fileBrowserMode = mode;
    }
// Основна функція: оновлює інтерфейс файлового менеджера
    return updateFileBrowser();
  };

  window.fileBeingMoved = {};

  window.fileToBeOpened = null;

  window.selectFile = function(name) {
    window.fileToBeOpened = name;
    console.log('selectedFile=', name);

// Основна функція: оновлює інтерфейс файлового менеджера
    return updateFileBrowser();
  };

// Зміна поточної теки у файловій системі
  changeFolder = function(destination) {
    fsToBrowse.cd(destination);
    console.log('changedFolder=', fsToBrowse.getCwd());

    return selectFile(null);
  };

  imitateDialog = false;

  window.setDialogImitation = function(enable) {
    if (enable == null) {
      enable = true;
    }
    imitateDialog = !!enable;
// Основна функція: оновлює інтерфейс файлового менеджера
    return updateFileBrowser();
  };

  window.buttonClicked = function(name) {

    var args, folderName, path, success;
    if (name === 'New folder') {
      folderName = prompt('Enter the name of the new folder', 'My Files');
      if (fsToBrowse.mkdir(folderName)) {
// Основна функція: оновлює інтерфейс файлового менеджера
        updateFileBrowser();
      } else {
        alert('A folder with this name already exists.');
      }
      return;
    }

    args = [];

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

    if (name === 'Save here') {
      args.push(fsToBrowse.getCwd());
    }
    if (name === 'Get file') {
      console.log("Get file");
      var fullPath = document.getElementById("filename");
	  console.log("fullPath:",fullPath);
    }

    if (name === 'Open') {
      path = fsToBrowse.getCwd();
      if (path.slice(-1) !== FileSystem.prototype.pathSeparator) {
        path += FileSystem.prototype.pathSeparator;
      }
      args.push(path + fileToBeOpened);
      viewFile(path + fileToBeOpened);
    }

    if (name === 'Open this folder') {
      args.push(fsToBrowse.getCwd());
      name = 'Open folder';
    }

    window.fileBeingMoved = {};
    selectFile(null);
    return setFileBrowserMode('manage files');
  };

  window.onload = setup = function() {

    setFileBrowserMode('manage files');
    return changeFolder('.');
  };

  askToDeleteEntry = function(entry) {
    if (confirm('Do you want to permanently delete "' + entry + '"?')) {
      fsToBrowse.rm(entry);
// Основна функція: оновлює інтерфейс файлового менеджера
      return updateFileBrowser();
    }
  };

// Основна функція: оновлює інтерфейс файлового менеджера
  window.updateFileBrowser = function() {
    var I, T, X, action, buttons, disable, e, entries, entry, extensions, features, file, filter, folder, index, interior, j, k, l, len, len1, len2, oldIndex, oldName, path, ref, ref1, statusbar, text, title, titlebar;

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

    title = fileBrowserMode ? fileBrowserMode[0].toUpperCase() + fileBrowserMode.slice(1) : '';
    buttons = [];

    if (fileBrowserMode === 'manage files') {
	  title = "Manage files";
      buttons = ['New folder', 'Get file'];
    } else if (fileBrowserMode === 'save file') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.fileNameTextBox = true;
      title = 'Save as...';
      buttons = ['Cancel', 'Save'];
      if (imitateDialog) {
        buttons.unshift('New folder');
      }
    } else if (fileBrowserMode === 'save in folder') {
      features.deleteFolders = features.deleteFiles = features.moveFiles = features.moveFolders = features.copyFiles = false;
      features.filesDisabled = true;
      title = 'Save to...';
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

    entries = [];

    if (fsToBrowse.getCwd() !== FileSystem.prototype.pathSeparator) {
      I = icon('up-arrow');
      T = 'Go up';
      if (features.navigateFolders) {
        action = function() {
          return changeFolder('..');
        };
        I = makeActionLink(I, 'Go up to parent folder', action);
        T = makeActionLink(T, 'Go up to parent folder', action);
      }
      entries.push(rowOf3(I, T));
    }

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
          I = makeActionLink(I, 'Open folder ' + folder, action);
          return T = makeActionLink(T, 'Open folder ' + folder, action);
        })(folder);
      }
      X = '';
      if (features.deleteFolders) {
        (function(folder) {
          return X += makeActionLink(icon('delete'), 'Remove folder ' + folder, function() {
            return askToDeleteEntry(folder);
          });
        })(folder);
      }

      if (features.moveFolders) {
        (function(folder) {
          return X += makeActionLink(icon('movefolder'), 'Move folder ' + folder, function() {
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
// Основна функція: оновлює інтерфейс файлового менеджера
            return updateFileBrowser();
          });
        })(folder);
      }

      entries.push(rowOf3(I, T, X));
    }

    filter = typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.options[typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.selectedIndex : void 0].value : void 0;
    if (filter === '*.*') {
      filter = null;
    } else {
      filter = filter != null ? filter.slice(1) : void 0;
    }

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
    return X += makeActionLink(icon('view'), 'View file ' + file, function() {
      // Прямий перегляд файлу, без встановлення fileToBeOpened
      viewFile(fsToBrowse.getCwd() + FileSystem.prototype.pathSeparator + file);
    });
  })(file);
}

      if (features.moveFiles) {
        (function(file) {
          return X += makeActionLink(icon('move'), 'Move file ' + file, function() {
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
// Основна функція: оновлює інтерфейс файлового менеджера
            return updateFileBrowser();
          });
        })(file);
      }

      if (features.copyFiles) {
        (function(file) {
          return X += makeActionLink(icon('download'), 'Save file ' + file, function() {
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
// Основна функція: оновлює інтерфейс файлового менеджера
            return updateFileBrowser();
          });
        })(file);
      }

       if (features.deleteFiles) {
        (function(file) {
          return X += makeActionLink(icon('delete'), 'Remove file ' + file, function() {
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

    if (entries.length === 0) {
      entries.push('(empty filesystem)');
    }
    interior = makeTable(entries);

    titlebar = statusbar = '';
    if (features.fileNameTextBox) {
      statusbar += "Name: <input id='saveFileName' type='text' style='font-size:12' size=40 onkeyup='saveBoxKeyPressed(event);'/>";
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
// Основна функція: оновлює інтерфейс файлового менеджера
      statusbar += "File type: <select id='fileFilter' onchange='updateFileBrowser();'> " + (extensions.join('\n')) + " </select>";
    }

    for (index = l = 0, len2 = buttons.length; l < len2; index = ++l) {
      text = buttons[index];
      disable = '';
      if (text === 'Open' && !fileToBeOpened) {
        disable = 'disabled=true';
      }
      buttons[index] = "<input type='button' value='";
      var vimg ="'";
      var vtxt =text;

      var onclick = vimg+" style='width:130px;height:32px;font-size:12' onclick='buttonClicked(\"" + text + "\");'";

      buttons[index] = buttons[index] + vtxt  + "' id='statusBarButton" + text + "' " + disable + onclick + ">";
      if (text === "New folder") { 
           buttons[index] = "<button style='width:48px;height:48px;background:white;border:none;padding:0' title='Create new folder' onclick='newFolder()'>" +
                            "<img src='media/new_folder.png' alt='New Folder' style='width:100%;height:100%;margin-top: 50%;'></button>";
          };
      if (text === "Get file") { 
           buttons[index] = "<button style='width:48px;height:48px;background:white;border:none;padding:0' title='Add file' onclick='document.getElementById(\"getfile\").click()'>" +
                            "<img src='media/add_file.png' alt='Add File' style='width:100%;height:100%;margin-top: 50%;'></button>" +
                            "<input type='file' id='getfile' onchange='readFile(this)' style='display:none'>";
          };

    }
    buttons = buttons.join(' ');

    if (imitateDialog) {
      path = fsToBrowse.getCwd();
      if (path === FileSystem.prototype.pathSeparator) {
        path += ' (up lelvel';
      }
      titlebar = "<table border=1 cellpadding=5 cellspacing=0 width=100% height=100%> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=33%> <b>" + title + "</b> </td> <td align=center width=34%> Місце: " + path + " </td> <td align=right width=33%><select id='modSelector' onchange='modSelector(this)'><option value='manage files'>Manage files</option><option value='open file'>Open file</option><option value='save file'>Save file</option><option value='open folder'>Open folder</option><option value='save in folder'>Save in folder</option></select>  " + (icon('close')) + " </td> </tr> </table> </td> </tr> <tr> <td bgcolor=#fafafa valign=top>";

      statusbar = "   </td> </tr> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=50%> " + statusbar + " </td> <td align=right width=50%> " + buttons + " </td> </tr> </table> </td> </tr> </table>"+"<img id='imgsrc' src=''>"+ "</center> </div>";
    } else {
      if (window.fileBeingMoved.name) {
        statusbar += " &nbsp; " + buttons;
      }

       statusbar = "   </td> </tr> <tr height=1%> <td bgcolor=#cccccc> <table border=0 cellpadding=0 cellspacing=0 width=100%> <tr> <td align=left width=50%> " + statusbar + " </td> <td align=right width=50%> " + buttons + " </td> </tr> </table> </td> </tr> </table>"+"<img id='imgsrc' src=''>"+ "</center> </div>";
    }

    oldName = (typeof saveFileName !== "undefined" && saveFileName !== null ? saveFileName.value : void 0) || (typeof fileBeingMoved !== "undefined" && fileBeingMoved !== null ? fileBeingMoved.name : void 0);
    oldIndex = typeof fileFilter !== "undefined" && fileFilter !== null ? fileFilter.selectedIndex : void 0;

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
    fdlg.dialog("widget").css({
        "border": "2px solid #999",
        "box-shadow": "4px 4px 20px rgba(0, 0, 0, 0.5)"
    });

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

// Генерує HTML-таблицю з переліком файлів і тек
makeTable = function(entries) {
  var half, i, j, lcolor, left, rcolor, ref, result, right;
  result = '<table border=0 width=100% cellspacing=5 cellpadding=5>';
  half = Math.ceil(entries.length / 2);
  for (i = j = 0, ref = half; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
    left = entries[i];
    lcolor = 'bgcolor=#e8e8e8';
    if (left.slice(0, 6) === 'SELECT') {
      lcolor = 'style="background-color:#007bff;color:white;"';
      left = left.slice(6);
    }
    right = entries[i + half];
    rcolor = 'bgcolor=#e8e8e8';
    if (!right) {
      rcolor = '';
    } else if (right.slice(0, 6) === 'SELECT') {
      rcolor = 'style="background-color:#007bff;color:white;"';
      right = right.slice(6);
    }
    result += "<tr> <td width=50% " + lcolor + ">" + left + "</td> <td width=50% " + rcolor + ">" + (right || '') + "</td> </tr>";
  }
  return result + '</table>';
};

  window.actionLinks = [];

  clearActionLinks = function() {
    var actionLinks;
    return actionLinks = [];
  };

// Створює клікабельне посилання (кнопку або дію)
makeActionLink = function(text, tooltip, func) {
  var number;
  number = actionLinks.length;
  actionLinks.push(func);
  return "<a href='javascript:void(0);' title='" + tooltip + "' onclick='actionLinks[" + number + "]();' style='color:inherit;background:inherit;text-decoration:none;'>" + text + "</a>";
};

  icon = function(name) {
    return "<img src='media/" + name + ".png'>";
  };

  rowOf3 = function(icon, text, more) {
    if (more == null) {
      more = '';
    }
    return "<table border=0 cellpadding=0 cellspacing=0 width=100%><tr> <td width=22>" + (icon || '') + "</td> <td align=left>" + text + " &nbsp; &nbsp; </td> <td align=left width=66><nobr>" + more + "</nobr></td></tr></table>";
  };

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
// Відкриває діалог файлового менеджера
function openFileBrowser() {
	  $("#filemanager").dialog("option","title","File Manager").dialog('open');
	}

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
// Перегляд вмісту файлу (txt або png)
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

// Створення нової теки у поточній директорії
function newFolder() {
      folderName = prompt('Enter the name of the new folder', 'My Files');
      if (fsToBrowse.mkdir(folderName)) {
// Основна функція: оновлює інтерфейс файлового менеджера
        updateFileBrowser();
      } else {
        alert('A folder with this name already exists.');
      }
      return;
}

// Обробка завантаження файлу користувачем
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
// Основна функція: оновлює інтерфейс файлового менеджера
        updateFileBrowser();
       };

      reader.onerror = function() {
        console.log(reader.error);
      }
     } 
   if (fileExt==="png"){
	   console.log("Store png file");

        document.getElementById("imgsrc").style.display = "none";     

        reader.onload = function (e) {
            document.getElementById('imgsrc').src =  e.target.result;
            fsToBrowse.write(file.name,e.target.result);
// Основна функція: оновлює інтерфейс файлового менеджера
            updateFileBrowser();
        }

        reader.readAsDataURL(file);
 }
}
 else {alert("Invalid file type. Only '.txt' and '.png' are allowed!");
} 

}
function modSelector(selectObject) {
  var value = selectObject.value;  
  console.log("Select:",value);
  setFileBrowserMode(value);

}
