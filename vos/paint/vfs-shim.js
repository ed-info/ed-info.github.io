/* ============================================================
   vfs-shim.js — інтеграція XP Paint із віртуальною файловою
   системою (VFS).

   Paint (форк JS Paint) не використовує File System Access API, а
   відкриває файли через <input type="file">, а зберігає через
   FileSaver (saveAs). Цей скрипт підміняє обидва механізми так,
   щоб усе читання/запис ішли виключно у VFS (vfs.js), який
   впроваджується у вікно застосунку робочим столом.
   ============================================================ */
(function () {
  'use strict';

  function pickersReady() {
    return typeof window.showOpenFilePicker === 'function' &&
           typeof window.showSaveFilePicker === 'function';
  }

  /* ---- Відкриття -------------------------------------------------
     Paint очікує FileList у callback (files[0], for...of, .type, .name).
     Масив File поводиться так само. */
  window.get_FileList_from_file_select_dialog = function (callback) {
    if (!pickersReady()) {
      console.error('VFS не підключено: відкриття файлів недоступне.');
      return;
    }
    (async function () {
      try {
        const handles = await window.showOpenFilePicker({ multiple: true });
        const files = [];
        for (const handle of handles) files.push(await handle.getFile());
        callback(files);
      } catch (err) {
        if (!err || err.name !== 'AbortError') console.error(err);
      }
    })();
  };

  /* ---- Збереження ------------------------------------------------
     Записує Blob у файл ВФС через showSaveFilePicker + createWritable. */
  async function saveBlobToVFS(blob, suggestedName) {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName || 'untitled.png'
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return handle;
  }

  // Заміна FileSaver.saveAs: жодних реальних завантажень.
  window.saveAs = function (blob, name) {
    saveBlobToVFS(blob, name).catch(function (err) {
      if (!err || err.name !== 'AbortError') console.error(err);
    });
    return { onwriteend: null, onwritestart: null, onprogress: null };
  };

  // Пряме збереження полотна: оновлює ім'я документа після запису.
  window.save_canvas_as = function (canvas, fileName, savedCallbackUnreliable) {
    if (!pickersReady()) {
      console.error('VFS не підключено: збереження недоступне.');
      return;
    }
    canvas.toBlob(function (blob) {
      if (!blob || !blob.size) return;
      saveBlobToVFS(blob, fileName).then(function (handle) {
        if (savedCallbackUnreliable) savedCallbackUnreliable('', handle.name);
      }).catch(function (err) {
        if (!err || err.name !== 'AbortError') console.error(err);
      });
    });
  };
})();
