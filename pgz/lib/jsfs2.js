// JSFS на основі IndexedDB
(function () {
  'use strict';

  function _Class(name) {
    this._name = name || 'undefined';
    this._cwd = '/';
    this.compressionDefault = false;
    this._dbPromise = this._openDB();
    this._metadataCache = null; // кеш метаданих файлової системи
  }

  // === Основні константи ===
  _Class.prototype.pathSeparator = '/';
  _Class.prototype.escapeCharacter = '\\';

  // === Імена об'єктних сховищ ===
  _Class.prototype.METADATA_STORE = 'metadata';
  _Class.prototype.FILES_STORE = 'files';

  // === Відкриття бази даних ===
  _Class.prototype._openDB = function () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._name + '_filesystem', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
          db.createObjectStore(this.METADATA_STORE);
        }
        if (!db.objectStoreNames.contains(this.FILES_STORE)) {
          db.createObjectStore(this.FILES_STORE);
        }
      };
    });
  };

  // === Завантаження метаданих файлової системи ===
  _Class.prototype._loadMetadata = async function () {
    if (this._metadataCache !== null) return this._metadataCache;

    const db = await this._dbPromise;
    const tx = db.transaction(this.METADATA_STORE, 'readonly');
    const store = tx.objectStore(this.METADATA_STORE);
    const req = store.get('root');

    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        this._metadataCache = req.result || {};
        resolve(this._metadataCache);
      };
      req.onerror = () => reject(req.error);
    });
  };

  // === Збереження метаданих ===
  _Class.prototype._saveMetadata = async function (fs) {
    const db = await this._dbPromise;
    const tx = db.transaction(this.METADATA_STORE, 'readwrite');
    const store = tx.objectStore(this.METADATA_STORE);
    store.put(fs, 'root');
    this._metadataCache = fs;
  };

  // === Допоміжні функції шляхів (як у оригіналі) ===
 _Class.prototype._splitPath = function (pathString) {
  const sep = this.pathSeparator;
  const esc = this.escapeCharacter;

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Видалити подвійні розділювачі (esc+esc → тимчасовий маркер)
  let clean = pathString
    .replace(new RegExp(escapeRegExp(esc) + escapeRegExp(esc), 'g'), '\x00')
    .replace(new RegExp(escapeRegExp(sep) + escapeRegExp(sep), 'g'), sep)
    .replace(/\x00/g, esc + esc);

  if (clean.startsWith(sep)) clean = clean.slice(sep.length);
  if (clean.endsWith(sep)) clean = clean.slice(0, -sep.length);

  const parts = clean.split(sep).map(p =>
    p.replace(new RegExp(escapeRegExp(esc) + escapeRegExp(sep), 'g'), sep)
     .replace(new RegExp(escapeRegExp(esc) + escapeRegExp(esc), 'g'), esc)
  );

  return parts.filter(p => p !== '');
};

_Class.prototype._joinPath = function (pathArray) {
  const sep = this.pathSeparator;
  const esc = this.escapeCharacter;

  // Функція для екранування спецсимволів у регулярних виразах
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return pathArray.map(p =>
    p.replace(new RegExp(escapeRegExp(sep), 'g'), esc + sep)
     .replace(new RegExp(escapeRegExp(esc), 'g'), esc + esc)
  ).join(sep);
};
  _Class.prototype._toAbsolutePath = function (cwd, relativePath) {
    if (!relativePath) return cwd;
    const sep = this.pathSeparator;
    if (relativePath.startsWith(sep)) return relativePath;
    const joined = this._joinPath([...this._splitPath(cwd), ...this._splitPath(relativePath)]);
    return sep + (joined.startsWith(sep) ? joined.slice(sep.length) : joined);
  };

  _Class.prototype._toCanonicalPath = function (absolutePath) {
    const sep = this.pathSeparator;
    const parts = this._splitPath(absolutePath);
    const result = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (result.length > 0) result.pop();
      } else {
        result.push(part);
      }
    }
    return sep + this._joinPath(result);
  };

  // === Робота з деревом ===
  _Class.prototype._walkPath = function (obj, pathArray) {
    let current = obj;
    for (const step of pathArray) {
      if (!current || typeof current !== 'object' || Array.isArray(current) || !current.hasOwnProperty(step)) {
        return null;
      }
      current = current[step];
    }
    return current;
  };

  _Class.prototype._walkPathAndFile = function (obj, pathArray) {
    if (pathArray.length === 0) return obj;
    const parent = this._walkPath(obj, pathArray.slice(0, -1));
    if (!parent) return null;
    return parent[pathArray[pathArray.length - 1]] || null;
  };

  // === Публічні методи ===
  _Class.prototype.getName = function () { return this._name; };
  _Class.prototype.getCwd = function () { return this._cwd; };

  _Class.prototype.separate = function (path) {
    return this._splitPath(this._toCanonicalPath(this._toAbsolutePath(this._cwd, path)));
  };

  _Class.prototype.separateWithFilename = function (path) {
    const fullPath = this.separate(path);
    if (fullPath.length === 0) throw new Error('Invalid path');
    return {
      path: fullPath.slice(0, -1),
      name: fullPath[fullPath.length - 1]
    };
  };

  _Class.prototype.type = async function (pathToEntry) {
    const fs = await this._loadMetadata();
    const fullpath = this.separate(pathToEntry);
    const entry = this._walkPathAndFile(fs, fullpath);
    if (!entry) return null;
    return Array.isArray(entry) ? 'file' : 'folder';
  };

  _Class.prototype.cd = async function (path = '/') {
    const newcwd = this._toCanonicalPath(this._toAbsolutePath(this._cwd, path));
    const fs = await this._loadMetadata();
    if (this._walkPath(fs, this._splitPath(newcwd))) {
      this._cwd = newcwd;
    }
  };

  _Class.prototype.mkdir = async function (path = '.') {
    const fs = await this._loadMetadata();
    const steps = this.separate(path);
    let current = fs;
    let modified = false;
    for (const step of steps) {
      if (!current[step]) {
        current[step] = {};
        modified = true;
      } else if (Array.isArray(current[step])) {
        throw new Error('Cannot create directory: file exists with same name');
      }
      current = current[step];
    }
    if (modified) await this._saveMetadata(fs);
    return modified;
  };

  _Class.prototype.ls = async function (folder = '.', type = 'all') {
    const fs = await this._loadMetadata();
    const pathArray = this.separate(folder);
    const target = this._walkPath(fs, pathArray);
    if (!target) throw new Error('Invalid folder');

    const entries = Object.keys(target).sort();
    const folders = entries.filter(e => !Array.isArray(target[e]));
    const files = entries.filter(e => Array.isArray(target[e]));

    if (type === 'folders') return folders;
    if (type === 'files') return files;
    return [...folders, ...files];
  };

  // === Робота з файлами ===
  _Class.prototype._getFileId = async function () {
    const db = await this._dbPromise;
    const tx = db.transaction(this.FILES_STORE, 'readonly');
    const allKeys = await new Promise((resolve, reject) => {
      const req = tx.objectStore(this.FILES_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const used = new Set(allKeys);
    let id = 0;
    while (used.has(id)) id++;
    return id;
  };

  _Class.prototype.write = async function (filename, content, compress = this.compressionDefault) {
    const { path, name } = this.separateWithFilename(filename);
    const fs = await this._loadMetadata();
    const folder = this._walkPath(fs, path);
    if (!folder) throw new Error('Invalid folder path');

    let fileId;
    if (folder[name] && Array.isArray(folder[name])) {
      // Оновлення існуючого файлу
      fileId = folder[name][0];
    } else {
      // Новий файл
      fileId = await this._getFileId();
    }

    // Збереження вмісту у файлове сховище
    const db = await this._dbPromise;
    const tx = db.transaction(this.FILES_STORE, 'readwrite');
    const store = tx.objectStore(this.FILES_STORE);
    store.put(content, fileId);

    // Оновлення метаданих
    folder[name] = [fileId, typeof content === 'string' ? new Blob([content]).size : (content?.size || 0), !!compress];
    await this._saveMetadata(fs);
    return folder[name][1];
  };

  _Class.prototype.read = async function (filename) {
    const fs = await this._loadMetadata();
    const fileMeta = this._walkPathAndFile(fs, this.separate(filename));
    if (!fileMeta || !Array.isArray(fileMeta)) throw new Error('No such file');
    const fileId = fileMeta[0];

    const db = await this._dbPromise;
    const tx = db.transaction(this.FILES_STORE, 'readonly');
    const store = tx.objectStore(this.FILES_STORE);
    const req = store.get(fileId);

    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  _Class.prototype.size = async function (filename) {
    const fs = await this._loadMetadata();
    const fileMeta = this._walkPathAndFile(fs, this.separate(filename));
    return fileMeta && Array.isArray(fileMeta) ? fileMeta[1] : -1;
  };

  _Class.prototype.rm = async function (path) {
    const { path: dirPath, name } = this.separateWithFilename(path);
    if (!name) return false;

    const fs = await this._loadMetadata();
    const folder = this._walkPath(fs, dirPath);
    if (!folder || !folder[name]) return false;

    const deleteSubtree = (node) => {
      if (Array.isArray(node)) {
        // Файл: видалити з файлового сховища
        const db = this._dbPromise;
        db.then(db => {
          const tx = db.transaction(this.FILES_STORE, 'readwrite');
          tx.objectStore(this.FILES_STORE).delete(node[0]);
        });
      } else {
        // Тека: рекурсивно
        for (const key in node) deleteSubtree(node[key]);
      }
    };

    deleteSubtree(folder[name]);
    delete folder[name];
    await this._saveMetadata(fs);
    return true;
  };

  _Class.prototype.mv = async function (source, dest) {
    const srcParts = this.separateWithFilename(source);
    const dstParts = this.separateWithFilename(dest);

    const fs = await this._loadMetadata();
    const srcFolder = this._walkPath(fs, srcParts.path);
    if (!srcFolder || !srcFolder[srcParts.name]) throw new Error('Source not found');

    let dstFolder = this._walkPath(fs, dstParts.path);
    let dstName = dstParts.name;

    if (!dstFolder) return false;

    // Якщо dest — тека, переміщуємо всередину неї
    if (dstFolder[dstName] && !Array.isArray(dstFolder[dstName])) {
      dstFolder = dstFolder[dstName];
      dstName = srcParts.name;
    }

    if (dstFolder[dstName]) return false; // уже існує

    dstFolder[dstName] = srcFolder[srcParts.name];
    delete srcFolder[srcParts.name];
    await this._saveMetadata(fs);
    return true;
  };

  // === Експорт класу ===
  window.FileSystem = _Class;
})();
