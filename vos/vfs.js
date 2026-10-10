/* ============================================================
   vfs.js — API віртуальної файлової системи (IndexedDB "DesktopFS")

   Підключення (в будь-якому застосунку того ж домену):
       <script src="/vfs.js"></script>

   Що дає скрипт:
   1) Підміну window.showOpenFilePicker / showSaveFilePicker / showDirectoryPicker.
      Вони повертають об'єкти, що імітують FileSystemFileHandle та
      FileSystemDirectoryHandle (getFile, createWritable, getFileHandle,
      getDirectoryHandle, removeEntry, resolve, entries/keys/values, ...).
   2) Глобальний об'єкт VFS з простим API за шляхами (readText, writeFile,
      readdir, mkdir, remove, rename, move, copy, stat, exists, ...).
   3) Подію зміни: VFS.onChange(cb) або window.addEventListener('vfs-change').

   Діалоги вибору файлу малюються у верхньому вікні (робочому столі), якщо
   воно доступне і теж підключає vfs.js; інакше — у поточному документі.
   ============================================================ */
(function (global) {
  'use strict';
  if (global.VFS && global.VFS.__loaded) return;

  const SCRIPT_SRC = (global.document && document.currentScript && document.currentScript.src) || '';
  const DB_NAME = 'DesktopFS';
  const STORE = 'nodes';
  const BAD_NAME = /[\\\/:*?"<>|]/;
  const utf8 = new TextEncoder();

  const domErr = (name, msg) => new DOMException(msg || name, name);
  const notFound = () => domErr('NotFoundError', 'A requested file or directory could not be found at the time an operation was processed.');

  /* ---------------------------------------------------------
     Сховище
     --------------------------------------------------------- */
  const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const genId = () => 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

  function putWith(d, n) {
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(n);
      t.oncomplete = () => res();
      t.onerror = t.onabort = () => rej(t.error);
    });
  }
  const getWith = (d, id) => reqP(d.transaction(STORE, 'readonly').objectStore(STORE).get(id));

  // Така сама ієрархія, як створює робочий стіл (idempotent)
  async function ensureStructure(d) {
    const defs = [
      { id: 'pc', parent: null, name: "Цей комп'ютер", kind: 'computer' },
      { id: 'c', parent: 'pc', name: 'Локальний диск (C:)', kind: 'drive' },
      { id: 'users', parent: 'c', name: 'Користувачі' },
      { id: 'user', parent: 'users', name: 'Користувач' },
      { id: 'docs', parent: 'user', name: 'Документи' },
      { id: 'downloads', parent: 'user', name: 'Завантаження' },
      { id: 'pictures', parent: 'user', name: 'Зображення' },
      { id: 'apps', parent: 'user', name: 'Програми' },
      { id: 'recycle', parent: 'root', name: 'Смітник', kind: 'recycle' }
    ];
    for (const def of defs) {
      if (!(await getWith(d, def.id))) {
        await putWith(d, { ...def, type: 'folder', content: '', created: Date.now(), sys: true });
      }
    }
    const r = await getWith(d, 'root');
    if (!r) {
      await putWith(d, { id: 'root', parent: 'user', name: 'Робочий стіл', type: 'folder', content: '', created: Date.now(), sys: true });
    } else if (r.parent !== 'user' || !r.sys) {
      r.parent = 'user'; r.sys = true;
      await putWith(d, r);
    }
  }

  let dbPromise = null;
  function openDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains(STORE)) {
            d.createObjectStore(STORE, { keyPath: 'id' }).createIndex('parent', 'parent', { unique: false });
          }
        };
        req.onsuccess = e => { const d = e.target.result; d.onversionchange = () => { d.close(); dbPromise = null; }; resolve(d); };
        req.onerror = () => reject(req.error);
      }).then(async d => { await ensureStructure(d); return d; });
    }
    return dbPromise;
  }
  const dbGet = async id => reqP((await openDB()).transaction(STORE, 'readonly').objectStore(STORE).get(id));
  const dbAll = async () => reqP((await openDB()).transaction(STORE, 'readonly').objectStore(STORE).getAll());
  const dbChildren = async pid => reqP((await openDB()).transaction(STORE, 'readonly').objectStore(STORE).index('parent').getAll(pid));
  async function dbPut(n) { return putWith(await openDB(), n); }
  async function dbDelete(id) {
    const d = await openDB();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).delete(id);
      t.oncomplete = () => res();
      t.onerror = t.onabort = () => rej(t.error);
    });
  }

  /* ---------------------------------------------------------
     Сповіщення про зміни (між вікнами та iframe одного домену)
     --------------------------------------------------------- */
  const listeners = new Set();
  let bc = null;
  try { bc = new BroadcastChannel('DesktopFS'); } catch (_) {}
  function fire(detail) {
    listeners.forEach(f => { try { f(detail); } catch (_) {} });
    try { global.dispatchEvent(new CustomEvent('vfs-change', { detail })); } catch (_) {}
  }
  function notify() {
    fire({ local: true });
    try { if (bc) bc.postMessage({ t: 'change' }); } catch (_) {}
  }
  if (bc) bc.onmessage = () => fire({ local: false });

  /* ---------------------------------------------------------
     Допоміжне: імена, MIME, байти
     --------------------------------------------------------- */
  function checkName(name) {
    if (typeof name !== 'string' || !name || name === '.' || name === '..' || BAD_NAME.test(name)) {
      throw new TypeError('Name is not allowed.');
    }
  }
  const MIME = {
    txt: 'text/plain', md: 'text/markdown', html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript',
    json: 'application/json', xml: 'application/xml', csv: 'text/csv', svg: 'image/svg+xml',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
    ico: 'image/x-icon', avif: 'image/avif', pdf: 'application/pdf', zip: 'application/zip',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm'
  };
  const BIN_EXT = /\.(png|jpe?g|gif|webp|bmp|ico|avif|pdf|zip|gz|7z|rar|mp3|wav|ogg|mp4|webm|mov|woff2?|ttf|otf|exe|dll|bin|wasm)$/i;
  const extOf = name => { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i + 1).toLowerCase() : ''; };
  const mimeOf = name => MIME[extOf(name)] || '';

  async function toBytes(data) {
    if (data == null) throw new TypeError('Failed to execute \'write\': data is required.');
    if (typeof data === 'string') return utf8.encode(data);
    // Перевірки через toString/duck-typing — дані можуть прийти з іншого realm (iframe), де instanceof не працює
    const tag = Object.prototype.toString.call(data);
    if (tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]') return new Uint8Array(data.slice(0));
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    if (typeof data.arrayBuffer === 'function') return new Uint8Array(await data.arrayBuffer());
    return utf8.encode(String(data));
  }
  async function bytesOf(node) {
    return node.blob ? new Uint8Array(await node.blob.arrayBuffer()) : utf8.encode(node.content || '');
  }

  // Записати байти у вузол: текст зберігається рядком (його бачить редактор), решта — Blob
  async function storeBytes(id, bytes) {
    const node = await dbGet(id);
    if (!node || node.type !== 'file') throw notFound();
    let text = null;
    if (!BIN_EXT.test(node.name)) {
      try {
        text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        if (text.includes('\u0000')) text = null;
      } catch (_) { text = null; }
    }
    if (text !== null) { node.content = text; delete node.blob; }
    else { node.blob = new Blob([bytes.slice()], { type: mimeOf(node.name) }); node.content = ''; }
    node.mime = mimeOf(node.name);
    node.modified = Date.now();
    await dbPut(node);
    notify();
  }

  async function childByName(parentId, name) {
    const l = name.toLowerCase();
    return (await dbChildren(parentId)).find(k => k.name.toLowerCase() === l) || null;
  }
  async function createNode(parentId, name, type) {
    const now = Date.now();
    const n = { id: genId(), parent: parentId, name, type, content: '', created: now, modified: now };
    await dbPut(n);
    return n;
  }
  async function removeTree(id) {
    for (const k of await dbChildren(id)) await removeTree(k.id);
    await dbDelete(id);
  }
  async function descendantIds(id) {
    const out = new Set([id]), st = [id];
    while (st.length) {
      for (const k of await dbChildren(st.pop())) {
        if (!out.has(k.id)) { out.add(k.id); if (k.type === 'folder') st.push(k.id); }
      }
    }
    return out;
  }
  async function uniqueIn(parentId, name) {
    const taken = new Set((await dbChildren(parentId)).map(k => k.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
    let i = 2;
    while (taken.has(`${stem} (${i})${ext}`.toLowerCase())) i++;
    return `${stem} (${i})${ext}`;
  }

  /* ---------------------------------------------------------
     Потік запису (імітація FileSystemWritableFileStream)
     --------------------------------------------------------- */
  class WriteState {
    constructor(id, initial) {
      this.id = id;
      this.buf = initial || new Uint8Array(0);
      this.size = this.buf.length;
      this.pos = 0;
    }
    ensure(n) {
      if (n <= this.buf.length) return;
      const nb = new Uint8Array(Math.max(n, this.buf.length * 2, 256));
      nb.set(this.buf.subarray(0, this.size));
      this.buf = nb;
    }
    truncate(n) {
      if (!(n >= 0)) throw new TypeError('Invalid size.');
      if (n < this.size) this.buf.fill(0, n, this.size);
      else this.ensure(n);
      this.size = n;
      if (this.pos > n) this.pos = n;
    }
    async apply(chunk) {
      let data = chunk, position = null;
      const isParams = !!chunk && typeof chunk === 'object' && !ArrayBuffer.isView(chunk) &&
        typeof chunk.arrayBuffer !== 'function' && Object.prototype.toString.call(chunk) === '[object Object]' && 'type' in chunk;
      if (isParams) {
        if (chunk.type === 'seek') { this.pos = chunk.position >>> 0 === chunk.position ? chunk.position : Math.max(0, +chunk.position || 0); return; }
        if (chunk.type === 'truncate') { this.truncate(chunk.size); return; }
        if (chunk.type !== 'write') throw new TypeError('Invalid params type.');
        data = chunk.data;
        if (typeof chunk.position === 'number') position = chunk.position;
      }
      const bytes = await toBytes(data);
      if (position !== null) this.pos = position;
      const end = this.pos + bytes.length;
      this.ensure(end);
      this.buf.set(bytes, this.pos);
      this.size = Math.max(this.size, end);
      this.pos = end;
    }
    commit() { return storeBytes(this.id, this.buf.subarray(0, this.size)); }
  }

  const StreamBase = typeof WritableStream !== 'undefined' ? WritableStream : class {};
  class VFSWritableFileStream extends StreamBase {
    constructor(state) {
      super({
        write: chunk => state.apply(chunk),
        close: () => state.commit(),
        abort: () => {}
      });
    }
    async write(data) { const w = this.getWriter(); try { await w.write(data); } finally { w.releaseLock(); } }
    async seek(position) { return this.write({ type: 'seek', position }); }
    async truncate(size) { return this.write({ type: 'truncate', size }); }
    async close() { const w = this.getWriter(); await w.close(); }
    async abort(reason) { const w = this.getWriter(); await w.abort(reason); }
  }

  /* ---------------------------------------------------------
     Хендли (імітація FileSystemFileHandle / FileSystemDirectoryHandle)
     --------------------------------------------------------- */
  class VFSFileHandle {
    constructor(id, name) { Object.defineProperty(this, '_id', { value: id }); Object.defineProperty(this, '_name', { value: name }); }
    get name() { return this._name; }
    get id() { return this._id; }
    isSameEntry(other) { return Promise.resolve(!!other && other._id === this._id); }
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }
    async getFile() {
      const n = await dbGet(this._id);
      if (!n || n.type !== 'file') throw notFound();
      const type = n.mime || mimeOf(n.name);
      const opts = { type, lastModified: n.modified || n.created };
      return new File([n.blob || n.content || ''], n.name, opts);
    }
    async createWritable(options) {
      const n = await dbGet(this._id);
      if (!n || n.type !== 'file') throw notFound();
      const keep = !!(options && options.keepExistingData);
      return new VFSWritableFileStream(new WriteState(this._id, keep ? await bytesOf(n) : null));
    }
    async remove() {
      const n = await dbGet(this._id);
      if (!n) throw notFound();
      if (n.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be removed.');
      await removeTree(n.id); notify();
    }
    async createSyncAccessHandle() { throw domErr('NotSupportedError', 'createSyncAccessHandle is not supported.'); }
    toString() { return '[object FileSystemFileHandle]'; }
  }

  class VFSDirectoryHandle {
    constructor(id, name) { Object.defineProperty(this, '_id', { value: id }); Object.defineProperty(this, '_name', { value: name }); }
    get kind() { return 'directory'; }
    get name() { return this._name; }
    isSameEntry(other) { return Promise.resolve(!!other && other._id === this._id); }
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }

    async _dir() {
      const n = await dbGet(this._id);
      if (!n || n.type !== 'folder') throw notFound();
      return n;
    }
    async getFileHandle(name, options) {
      checkName(name);
      const dir = await this._dir();
      let c = await childByName(this._id, name);
      if (!c) {
        if (!(options && options.create)) throw notFound();
        if (dir.kind === 'computer') throw domErr('NoModificationAllowedError', 'Cannot create entries here.');
        c = await createNode(this._id, name, 'file');
        notify();
      } else if (c.type !== 'file') throw domErr('TypeMismatchError', 'The path supplied exists, but was not an entry of requested type.');
      return new VFSFileHandle(c.id, c.name);
    }
    async getDirectoryHandle(name, options) {
      checkName(name);
      const dir = await this._dir();
      let c = await childByName(this._id, name);
      if (!c) {
        if (!(options && options.create)) throw notFound();
        if (dir.kind === 'computer') throw domErr('NoModificationAllowedError', 'Cannot create entries here.');
        c = await createNode(this._id, name, 'folder');
        notify();
      } else if (c.type !== 'folder') throw domErr('TypeMismatchError', 'The path supplied exists, but was not an entry of requested type.');
      return new VFSDirectoryHandle(c.id, c.name);
    }
    async removeEntry(name, options) {
      checkName(name);
      await this._dir();
      const c = await childByName(this._id, name);
      if (!c) throw notFound();
      if (c.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be removed.');
      if (c.type === 'folder' && !(options && options.recursive) && (await dbChildren(c.id)).length) {
        throw domErr('InvalidModificationError', 'The object can not be modified in this way.');
      }
      await removeTree(c.id);
      notify();
    }
    async remove(options) {
      const n = await this._dir();
      if (n.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be removed.');
      if (!(options && options.recursive) && (await dbChildren(n.id)).length) throw domErr('InvalidModificationError', 'The object can not be modified in this way.');
      await removeTree(n.id); notify();
    }
    async resolve(possibleDescendant) {
      if (!possibleDescendant || !possibleDescendant._id) return null;
      const names = [];
      let cur = await dbGet(possibleDescendant._id), guard = 0;
      while (cur && guard++ < 64) {
        if (cur.id === this._id) return names.reverse();
        names.push(cur.name);
        cur = cur.parent != null ? await dbGet(cur.parent) : null;
      }
      return null;
    }
    async *entries() {
      await this._dir();
      const kids = (await dbChildren(this._id)).sort((a, b) => a.name.localeCompare(b.name, 'uk', { numeric: true }));
      for (const k of kids) yield [k.name, wrap(k)];
    }
    async *keys() { for await (const [n] of this.entries()) yield n; }
    async *values() { for await (const [, h] of this.entries()) yield h; }
    [Symbol.asyncIterator]() { return this.entries(); }
    toString() { return '[object FileSystemDirectoryHandle]'; }
  }

  // Щоб `handle instanceof FileSystemFileHandle` повертало true (методи — наші власні)
  try {
    if (typeof FileSystemFileHandle !== 'undefined') Object.setPrototypeOf(VFSFileHandle.prototype, FileSystemFileHandle.prototype);
    if (typeof FileSystemDirectoryHandle !== 'undefined') Object.setPrototypeOf(VFSDirectoryHandle.prototype, FileSystemDirectoryHandle.prototype);
  } catch (_) {}
  try {
    Object.defineProperty(VFSFileHandle.prototype, Symbol.toStringTag, { value: 'FileSystemFileHandle' });
    Object.defineProperty(VFSDirectoryHandle.prototype, Symbol.toStringTag, { value: 'FileSystemDirectoryHandle' });
  } catch (_) {}

  const wrap = n => n.type === 'folder' ? new VFSDirectoryHandle(n.id, n.name) : new VFSFileHandle(n.id, n.name);
  async function wrapId(id) {
    const n = await dbGet(id);
    if (!n) throw notFound();
    return wrap(n);
  }

  /* ---------------------------------------------------------
     API за шляхами
     --------------------------------------------------------- */
  const ALIASES = {
    desktop: 'root', 'робочий стіл': 'root', documents: 'docs', 'документи': 'docs',
    downloads: 'downloads', 'завантаження': 'downloads', pictures: 'pictures', 'зображення': 'pictures'
  };

  function splitPath(path) {
    return String(path == null ? '' : path).replace(/\//g, '\\').split('\\').map(s => s.trim()).filter(Boolean);
  }
  // Шлях: "C:\Користувачі\Користувач\Документи\a.txt", "/Користувачі/...",
  // "Desktop/a.txt" або відносно папки користувача ("Документи/a.txt")
  async function nodeAt(path) {
    const raw = String(path == null ? '' : path).trim();
    const parts = splitPath(raw);
    let cur;
    if (!parts.length) return dbGet(/^[\\\/]/.test(raw) ? 'c' : 'pc');
    const first = parts[0].toLowerCase();
    if (first === "цей комп'ютер" || first === 'this pc') { cur = await dbGet('pc'); parts.shift(); }
    else if (/^[a-z]:$/.test(first)) {
      if (first !== 'c:') throw notFound();
      cur = await dbGet('c'); parts.shift();
    } else if (/^[\\\/]/.test(raw)) cur = await dbGet('c');
    else if (ALIASES[first]) { cur = await dbGet(ALIASES[first]); parts.shift(); }
    else cur = await dbGet('user');
    for (const p of parts) {
      if (!cur) break;
      if (p === '.') continue;
      if (p === '..') { cur = cur.parent != null ? await dbGet(cur.parent) : null; continue; }
      if (cur.type !== 'folder') throw domErr('TypeMismatchError', 'Not a directory: ' + path);
      cur = await childByName(cur.id, p);
    }
    if (!cur) throw notFound();
    return cur;
  }
  async function pathOf(id) {
    const names = [];
    let cur = await dbGet(id), guard = 0;
    while (cur && guard++ < 64) { names.unshift(cur); cur = cur.parent != null ? await dbGet(cur.parent) : null; }
    if (!names.length) return '';
    if (names.length === 1) return names[0].name;
    const rest = names.slice(1).map(n => n.name);
    rest[0] = 'C:';
    return rest.join('\\') + (rest.length === 1 ? '\\' : '');
  }
  async function splitParent(path) {
    const parts = splitPath(path);
    const name = parts.pop();
    if (!name) throw new TypeError('Path is empty.');
    checkName(name);
    const abs = /^[\\\/]/.test(String(path).trim());
    // Просте ім'я без каталогу — відносно папки користувача (а не «Цей комп'ютер»)
    const parent = (!abs && !parts.length) ? await dbGet('user') : await nodeAt((abs ? '\\' : '') + parts.join('\\'));
    return { parent, name };
  }
  async function mkdirp(path) {
    const parts = splitPath(path);
    let prefix = /^[\\\/]/.test(String(path).trim()) ? '\\' : '';
    let cur = null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const here = prefix + parts.slice(0, i + 1).join('\\');
      try { cur = await nodeAt(here); }
      catch (e) {
        if (e.name !== 'NotFoundError') throw e;
        checkName(p);
        const par = i === 0 ? await nodeAt(prefix || '') .catch(() => null) : cur;
        const base = i === 0 ? (par && !/^[a-z]:$/i.test(p) && !ALIASES[p.toLowerCase()] && prefix === '' ? await dbGet('user') : par) : cur;
        if (!base) throw notFound();
        cur = await createNode(base.id, p, 'folder');
      }
    }
    notify();
    return cur;
  }

  const describe = async n => ({
    name: n.name, kind: n.type === 'folder' ? 'directory' : 'file', path: await pathOf(n.id),
    size: n.type === 'file' ? (n.blob ? n.blob.size : utf8.encode(n.content || '').length) : 0,
    created: n.created || 0, modified: n.modified || n.created || 0, type: n.type === 'file' ? (n.mime || mimeOf(n.name)) : ''
  });

  async function writeFile(path, data, options) {
    const o = Object.assign({ parents: true }, options);
    const { parent, name } = await (async () => {
      try { return await splitParent(path); }
      catch (e) {
        if (e.name !== 'NotFoundError' || !o.parents) throw e;
        const parts = splitPath(path); const nm = parts.pop(); checkName(nm);
        const abs = /^[\\\/]/.test(String(path).trim()) ? '\\' : '';
        await mkdirp(abs + parts.join('\\'));
        return splitParent(path);
      }
    })();
    if (parent.type !== 'folder' || parent.kind === 'computer') throw domErr('TypeMismatchError', 'Cannot write here.');
    let f = await childByName(parent.id, name);
    if (f && f.type !== 'file') throw domErr('TypeMismatchError', 'A directory exists with this name.');
    if (!f) f = await createNode(parent.id, name, 'file');
    await storeBytes(f.id, await toBytes(data));
    return f.id;
  }

  async function copyTree(id, parentId, newName) {
    const n = await dbGet(id);
    const c = { ...n, id: genId(), parent: parentId, name: newName || (await uniqueIn(parentId, n.name)), created: Date.now(), modified: Date.now() };
    delete c.sys; delete c.x; delete c.y;
    await dbPut(c);
    if (n.type === 'folder') for (const k of await dbChildren(id)) await copyTree(k.id, c.id);
    return c;
  }

  const VFS = {
    __loaded: true,
    native: {
      showOpenFilePicker: global.showOpenFilePicker,
      showSaveFilePicker: global.showSaveFilePicker,
      showDirectoryPicker: global.showDirectoryPicker
    },
    FileHandle: VFSFileHandle,
    DirectoryHandle: VFSDirectoryHandle,

    ready: () => openDB().then(() => true),
    notify,
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    pathOf,

    async getRoot() { return wrapId('c'); },               // корінь диска C:
    async getHandle(path) { return wrap(await nodeAt(path)); },
    async getFileHandle(path, options) {
      if (options && options.create) { await writeFileIfMissing(path); }
      const n = await nodeAt(path);
      if (n.type !== 'file') throw domErr('TypeMismatchError', 'Not a file.');
      return wrap(n);
    },
    async getDirectoryHandle(path, options) {
      if (options && options.create) await mkdirp(path);
      const n = await nodeAt(path);
      if (n.type !== 'folder') throw domErr('TypeMismatchError', 'Not a directory.');
      return wrap(n);
    },

    async exists(path) { try { await nodeAt(path); return true; } catch (e) { if (e.name === 'NotFoundError') return false; throw e; } },
    async stat(path) { return describe(await nodeAt(path)); },
    async readdir(path) {
      const n = await nodeAt(path);
      if (n.type !== 'folder') throw domErr('TypeMismatchError', 'Not a directory.');
      const kids = (await dbChildren(n.id)).sort((a, b) =>
        a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name, 'uk', { numeric: true }));
      return Promise.all(kids.map(describe));
    },
    async readBytes(path) {
      const n = await nodeAt(path);
      if (n.type !== 'file') throw domErr('TypeMismatchError', 'Not a file.');
      return bytesOf(n);
    },
    async readText(path) {
      const n = await nodeAt(path);
      if (n.type !== 'file') throw domErr('TypeMismatchError', 'Not a file.');
      return n.blob ? new TextDecoder().decode(await bytesOf(n)) : (n.content || '');
    },
    async readBlob(path) { return new VFSFileHandle((await nodeAt(path)).id, '').getFile(); },
    async writeFile(path, data, options) { await writeFile(path, data, options); },
    async appendFile(path, data) {
      let old = new Uint8Array(0);
      try { old = await VFS.readBytes(path); } catch (e) { if (e.name !== 'NotFoundError') throw e; }
      const add = await toBytes(data);
      const all = new Uint8Array(old.length + add.length);
      all.set(old); all.set(add, old.length);
      await writeFile(path, all);
    },
    async mkdir(path, options) {
      if (options && options.recursive === false) {
        const { parent, name } = await splitParent(path);
        if (await childByName(parent.id, name)) throw domErr('InvalidModificationError', 'Already exists.');
        await createNode(parent.id, name, 'folder'); notify(); return;
      }
      await mkdirp(path);
    },
    async remove(path, options) {
      const n = await nodeAt(path);
      if (n.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be removed.');
      if (n.type === 'folder' && !(options && options.recursive) && (await dbChildren(n.id)).length) {
        throw domErr('InvalidModificationError', 'Directory is not empty.');
      }
      await removeTree(n.id); notify();
    },
    async rename(path, newName) {
      checkName(newName);
      const n = await nodeAt(path);
      if (n.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be renamed.');
      const clash = await childByName(n.parent, newName);
      if (clash && clash.id !== n.id) throw domErr('InvalidModificationError', 'Name already exists.');
      n.name = newName; await dbPut(n); notify();
    },
    async move(path, destDir) {
      const n = await nodeAt(path), d = await nodeAt(destDir);
      if (n.sys) throw domErr('NoModificationAllowedError', 'System entries cannot be moved.');
      if (d.type !== 'folder' || d.kind === 'computer') throw domErr('TypeMismatchError', 'Bad destination.');
      if ((await descendantIds(n.id)).has(d.id)) throw domErr('InvalidModificationError', 'Cannot move into itself.');
      if (n.parent === d.id) return;
      n.name = await uniqueIn(d.id, n.name);
      n.parent = d.id; delete n.x; delete n.y;
      await dbPut(n); notify();
    },
    async copy(path, destDir) {
      const n = await nodeAt(path), d = await nodeAt(destDir);
      if (d.type !== 'folder' || d.kind === 'computer') throw domErr('TypeMismatchError', 'Bad destination.');
      if ((await descendantIds(n.id)).has(d.id)) throw domErr('InvalidModificationError', 'Cannot copy into itself.');
      await copyTree(n.id, d.id); notify();
    },
    async dump() { return dbAll(); }
  };

  async function writeFileIfMissing(path) {
    if (await VFS.exists(path)) return;
    await writeFile(path, '');
  }

  /* ---------------------------------------------------------
     Діалог вибору файлу / папки
     --------------------------------------------------------- */
  const LAST_KEY = 'VFS_pickerDirs';
  const lastDirs = (() => { try { return JSON.parse(localStorage.getItem(LAST_KEY)) || {}; } catch (_) { return {}; } })();
  const rememberDir = (key, id) => { lastDirs[key || '_'] = id; try { localStorage.setItem(LAST_KEY, JSON.stringify(lastDirs)); } catch (_) {} };

  const WELL_KNOWN = { desktop: 'root', documents: 'docs', downloads: 'downloads', pictures: 'pictures', programs: 'apps', 'програми': 'apps', music: 'user', videos: 'user' };
  const GLYPHS = { pc: '💻', c: '💽', root: '🖥️', docs: '📑', downloads: '📥', pictures: '🖼️', apps: '🧩', users: '👥', user: '👤', recycle: '🗑️' };
  const glyphOf = n => n.icon || GLYPHS[n.id] || (n.type === 'folder' ? '📁' : '📄');

  const STYLE = `
.vfs-ov{position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:40000;font:13px "Segoe UI",Tahoma,sans-serif;color:#000;user-select:none}
.vfs-ov *{box-sizing:border-box}
.vfs-dlg{width:min(760px,96vw);height:min(500px,92vh);display:flex;flex-direction:column;background:#f0f0f0;border:1px solid #0078d7;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.vfs-tt{flex:none;height:30px;display:flex;align-items:center;padding:0 0 0 10px;background:linear-gradient(180deg,#f0f0f0,#e0e0e0);border-bottom:1px solid #d0d0d0;font-weight:600;cursor:default}
.vfs-tt .t{flex:1}
.vfs-tt .x{width:40px;height:100%;border:none;background:transparent;font-size:14px;cursor:default}
.vfs-tt .x:hover{background:#e81123;color:#fff}
.vfs-bar{flex:none;display:flex;gap:4px;align-items:center;padding:6px;background:#fff;border-bottom:1px solid #e0e0e0}
.vfs-bar button{height:26px;min-width:28px;border:1px solid transparent;background:transparent;font:inherit;cursor:default}
.vfs-bar button:hover:not(:disabled){background:#e5f3ff;border-color:#cce8ff}
.vfs-bar button:disabled{opacity:.35}
.vfs-path{flex:1;min-width:0;height:26px;display:flex;align-items:center;overflow:hidden;white-space:nowrap;border:1px solid #d9d9d9;padding:0 4px}
.vfs-path span.c{padding:2px 5px;cursor:default}.vfs-path span.c:hover{background:#e5f3ff}.vfs-path span.s{color:#777;font-size:11px}
.vfs-body{flex:1;min-height:0;display:flex;background:#fff}
.vfs-nav{flex:none;width:170px;overflow:auto;padding:4px 0;border-right:1px solid #e5e5e5}
.vfs-nav .h{padding:8px 10px 2px;color:#6d6d6d;font-size:11px}
.vfs-nav .i{padding:3px 10px;display:flex;gap:6px;align-items:center;white-space:nowrap;cursor:default}
.vfs-nav .i:hover{background:#e5f3ff}.vfs-nav .i.cur{background:#cce8ff}
.vfs-list{flex:1;min-width:0;overflow:auto}
.vfs-hd,.vfs-row{display:grid;grid-template-columns:minmax(150px,1fr) 130px 120px 70px;min-width:480px;align-items:center}
.vfs-hd{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e5e5;color:#4c607a}
.vfs-hd div{padding:4px 8px;border-right:1px solid #e5e5e5}
.vfs-row{height:22px;border:1px solid transparent;cursor:default}
.vfs-row>div{padding:0 8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.vfs-row .n{display:flex;gap:6px;align-items:center}.vfs-row .z{text-align:right}
.vfs-row:hover{background:#e5f3ff}.vfs-row.sel{background:#cce8ff;border-color:#99d1ff}
.vfs-empty{padding:24px;text-align:center;color:#777}
.vfs-foot{flex:none;padding:10px;display:grid;grid-template-columns:auto 1fr auto;gap:8px 8px;align-items:center;border-top:1px solid #e0e0e0}
.vfs-foot input,.vfs-foot select{height:26px;border:1px solid #a0a0a0;padding:0 6px;font:inherit;background:#fff;outline:none;min-width:0;user-select:text}
.vfs-foot input:focus,.vfs-foot select:focus{border-color:#0078d7}
.vfs-foot .msg{grid-column:1/-1;min-height:16px;color:#c50f1f;font-size:12px}
.vfs-foot .btns{display:flex;gap:6px}
.vfs-foot button,.vfs-mini button{padding:5px 18px;border:1px solid #adadad;background:#e1e1e1;font:inherit;cursor:default}
.vfs-foot button:hover,.vfs-mini button:hover{background:#e5f1fb;border-color:#0078d7}
.vfs-foot button.p,.vfs-mini button.p{background:#0078d7;border-color:#0078d7;color:#fff}
.vfs-mini-ov{position:absolute;inset:0;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center}
.vfs-mini{width:340px;background:#f0f0f0;border:1px solid #0078d7;padding:14px;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.vfs-mini input{width:100%;height:26px;margin:8px 0;border:1px solid #a0a0a0;padding:0 6px;font:inherit;user-select:text}
.vfs-mini .b{text-align:right;margin-top:8px}.vfs-mini .b button{margin-left:6px}`;

  function injectStyle() {
    if (document.getElementById('vfs-ui-style')) return;
    const s = document.createElement('style');
    s.id = 'vfs-ui-style';
    s.textContent = STYLE;
    (document.head || document.documentElement).appendChild(s);
  }
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const fmtSize = b => b < 1024 ? b + ' Б' : Math.ceil(b / 1024).toLocaleString('uk') + ' КБ';
  const fmtDate = ts => ts ? new Date(ts).toLocaleString('uk', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const nodeSize = n => n.blob ? n.blob.size : utf8.encode(n.content || '').length;
  function typeLabel(n) {
    if (n.kind === 'computer') return 'Системна папка';
    if (n.kind === 'drive') return 'Локальний диск';
    if (n.type === 'folder') return 'Папка з файлами';
    const e = extOf(n.name);
    return e === 'txt' ? 'Текстовий документ' : e ? 'Файл «' + e.toUpperCase() + '»' : 'Файл';
  }

  // Нормалізація options.types -> [{label, test(name), ext}]
  function normTypes(types, excludeAll) {
    if (types != null && !Array.isArray(types)) throw new TypeError("Failed to read the 'types' property: not a sequence.");
    const out = [];
    for (const t of types || []) {
      const accept = (t && t.accept) || {};
      const exts = [], mimes = [];
      for (const mime of Object.keys(accept)) {
        const list = [].concat(accept[mime] || []);
        for (const e of list) {
          if (typeof e !== 'string' || e[0] !== '.') throw new TypeError('Extensions must start with a dot.');
          exts.push(e.toLowerCase());
        }
        if (!list.length) mimes.push(mime);
      }
      if (!exts.length && !mimes.length) throw new TypeError('Invalid accept entry.');
      const label = (t.description || 'Файли') + ' (' + (exts.length ? exts.map(e => '*' + e).join(';') : mimes.join(';')) + ')';
      out.push({
        label, ext: exts[0] || '',
        test: name => {
          const l = name.toLowerCase();
          if (exts.some(e => l.endsWith(e))) return true;
          const m = mimeOf(name);
          return !!m && mimes.some(x => x === m || (x.endsWith('/*') && m.startsWith(x.slice(0, -1))));
        }
      });
    }
    if (excludeAll && !out.length) throw new TypeError('Cannot exclude the all-files option when no types are given.');
    if (!excludeAll) out.push({ label: 'Усі файли (*.*)', ext: '', test: () => true });
    return out;
  }

  async function startDir(o) {
    const s = o.startIn;
    if (s && s._id && (await dbGet(s._id))) return s.kind === 'directory' ? s._id : (await dbGet(s._id)).parent;
    if (typeof s === 'string' && WELL_KNOWN[s]) return WELL_KNOWN[s];
    const last = lastDirs[o.id || '_'];
    if (last && (await dbGet(last))) return last;
    return 'docs';
  }

  // mode: 'open' | 'save' | 'dir'. Повертає null при скасуванні
  async function pick(o) {
    await openDB();
    injectStyle();
    const mode = o.mode, multiple = !!o.multiple;
    const types = mode === 'dir' ? [] : normTypes(o.types, o.excludeAcceptAllOption);
    let cwd = await startDir(o), typeIdx = 0, sel = [], lastSel = null, order = [];

    const ov = h('div', 'vfs-ov');
    const dlg = h('div', 'vfs-dlg');
    ov.appendChild(dlg);
    const tt = h('div', 'vfs-tt');
    tt.append(h('span', 't', mode === 'save' ? 'Зберегти як' : mode === 'dir' ? 'Вибір папки' : 'Відкрити'));
    const xBtn = h('button', 'x', '✕');
    tt.appendChild(xBtn);
    const bar = h('div', 'vfs-bar');
    const upBtn = h('button', '', '↑'); upBtn.title = 'Вгору';
    const pathEl = h('div', 'vfs-path');
    const newBtn = h('button', '', '📁＋'); newBtn.title = 'Нова папка';
    bar.append(upBtn, pathEl, newBtn);
    const body = h('div', 'vfs-body');
    const nav = h('div', 'vfs-nav');
    const list = h('div', 'vfs-list');
    body.append(nav, list);
    const foot = h('div', 'vfs-foot');
    const nameLbl = h('label', '', mode === 'dir' ? 'Папка:' : 'Ім\'я файлу:');
    const nameIn = h('input'); nameIn.spellcheck = false;
    nameIn.value = mode === 'save' ? (o.suggestedName || '') : '';
    const typeSel = h('select');
    types.forEach((t, i) => { const op = h('option', '', t.label); op.value = i; typeSel.appendChild(op); });
    if (mode === 'dir') typeSel.style.visibility = 'hidden';
    const okBtn = h('button', 'p', mode === 'save' ? 'Зберегти' : mode === 'dir' ? 'Вибір папки' : 'Відкрити');
    const cancelBtn = h('button', '', 'Скасувати');
    const btns = h('div', 'btns'); btns.append(okBtn, cancelBtn);
    const msg = h('div', 'msg');
    const row2 = h('div'); row2.style.display = 'contents';
    foot.append(nameLbl, nameIn, h('span'), h('span'), typeSel, btns, msg);
    // другий рядок: тип файлу під ім'ям
    foot.replaceChildren(nameLbl, nameIn, h('span'), h('span'), typeSel, btns, msg);
    dlg.append(tt, bar, body, foot);
    document.body.appendChild(ov);

    const setMsg = t => { msg.textContent = t || ''; };

    function finish(result) {
      document.removeEventListener('keydown', onKey, true);
      ov.remove();
      resolve_(result);
    }
    let resolve_;
    const done = new Promise(r => { resolve_ = r; });

    /* ---- маленькі діалоги ---- */
    function ask(text, withInput, value) {
      return new Promise(res => {
        const mo = h('div', 'vfs-mini-ov'), box = h('div', 'vfs-mini');
        box.appendChild(h('div', '', text));
        let inp = null;
        if (withInput) { inp = h('input'); inp.value = value || ''; box.appendChild(inp); }
        const b = h('div', 'b'), ok = h('button', 'p', 'OK'), no = h('button', '', 'Скасувати');
        b.append(ok, no); box.appendChild(b); mo.appendChild(box); dlg.appendChild(mo);
        const close = v => { mo.remove(); res(v); };
        ok.onclick = () => close(withInput ? inp.value.trim() : true);
        no.onclick = () => close(withInput ? null : false);
        mo.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') no.click(); });
        (inp || ok).focus(); if (inp) inp.select();
      });
    }

    /* ---- відмалювання ---- */
    async function render() {
      let cur = await dbGet(cwd);
      if (!cur) { cwd = 'pc'; cur = await dbGet('pc'); }
      const kids = await dbChildren(cwd);
      const shown = kids.filter(k => k.type === 'folder' || (mode !== 'dir' && types[typeIdx].test(k.name)))
        .sort((a, b) => a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name, 'uk', { numeric: true }));
      order = shown.map(k => k.id);
      sel = sel.filter(id => order.includes(id));

      // шлях
      pathEl.replaceChildren();
      const chain = []; let c = cur, g = 0;
      while (c && g++ < 64) { chain.unshift(c); c = c.parent != null ? await dbGet(c.parent) : null; }
      chain.forEach((n, i) => {
        if (i) pathEl.appendChild(h('span', 's', '›'));
        const sp = h('span', 'c', n.name);
        sp.onclick = () => go(n.id);
        pathEl.appendChild(sp);
      });
      upBtn.disabled = cur.parent == null;
      newBtn.disabled = cur.kind === 'computer';

      // навігація
      nav.replaceChildren();
      nav.appendChild(h('div', 'h', 'Швидкий доступ'));
      for (const id of ['root', 'downloads', 'docs', 'pictures', 'apps', 'pc', 'c']) {
        const n = await dbGet(id);
        if (!n) continue;
        if (id === 'pc') nav.appendChild(h('div', 'h', 'Цей комп\'ютер'));
        const it = h('div', 'i' + (id === cwd ? ' cur' : ''));
        it.append(h('span', '', glyphOf(n)), h('span', '', n.name));
        it.onclick = () => go(id);
        nav.appendChild(it);
      }

      // список
      list.replaceChildren();
      const hd = h('div', 'vfs-hd');
      ['Ім\'я', 'Дата змінення', 'Тип', 'Розмір'].forEach(t => hd.appendChild(h('div', '', t)));
      list.appendChild(hd);
      if (!shown.length) list.appendChild(h('div', 'vfs-empty', 'Немає елементів, що відповідають умові пошуку.'));
      for (const n of shown) {
        const r = h('div', 'vfs-row' + (sel.includes(n.id) ? ' sel' : ''));
        r.dataset.id = n.id;
        const nm = h('div', 'n'); nm.append(h('span', '', glyphOf(n)), h('span', '', n.name));
        r.append(nm, h('div', '', fmtDate(n.modified || n.created)), h('div', '', typeLabel(n)),
          h('div', 'z', n.type === 'file' ? fmtSize(nodeSize(n)) : ''));
        r.onclick = e => select(n, e);
        r.ondblclick = () => { if (n.type === 'folder') go(n.id); else if (mode !== 'dir') accept(); };
        list.appendChild(r);
      }
    }

    function go(id) { cwd = id; sel = []; lastSel = null; if (mode === 'dir') nameIn.value = ''; setMsg(''); render(); }

    async function select(n, e) {
      setMsg('');
      if (n.type === 'folder' && mode !== 'dir') { sel = [n.id]; lastSel = n.id; }
      else if (multiple && mode === 'open' && (e.ctrlKey || e.metaKey)) {
        sel = sel.includes(n.id) ? sel.filter(i => i !== n.id) : [...sel, n.id]; lastSel = n.id;
      } else if (multiple && mode === 'open' && e.shiftKey && lastSel) {
        const a = order.indexOf(lastSel), b = order.indexOf(n.id);
        sel = order.slice(Math.min(a, b), Math.max(a, b) + 1);
      } else { sel = [n.id]; lastSel = n.id; }
      const nodes = (await Promise.all(sel.map(dbGet))).filter(Boolean);
      const files = nodes.filter(x => x.type === 'file');
      if (mode === 'dir') nameIn.value = nodes.length ? nodes[0].name : '';
      else if (files.length) nameIn.value = files.length > 1 ? files.map(x => '"' + x.name + '"').join(' ') : files[0].name;
      await render();
    }

    /* ---- підтвердження ---- */
    async function accept() {
      setMsg('');
      const cur = await dbGet(cwd);
      if (mode === 'dir') {
        let target = cwd;
        if (sel.length) target = sel[0];
        else if (nameIn.value.trim()) {
          const c = await childByName(cwd, nameIn.value.trim());
          if (!c || c.type !== 'folder') return setMsg('Папку не знайдено.');
          target = c.id;
        }
        const t = await dbGet(target);
        if (!t || t.kind === 'computer') return setMsg('Оберіть диск або папку.');
        return finish({ id: target });
      }
      if (mode === 'open') {
        let ids = [];
        const text = nameIn.value.trim();
        if (sel.length && (await Promise.all(sel.map(dbGet))).some(n => n && n.type === 'file')) {
          ids = (await Promise.all(sel.map(dbGet))).filter(n => n && n.type === 'file').map(n => n.id);
        } else if (text) {
          const names = (text.match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1));
          const wanted = names.length ? names : [text];
          for (const nm of wanted) {
            let c = await childByName(cwd, nm);
            if (!c) { try { c = await nodeAt(nm); } catch (_) { c = null; } }
            if (!c) return setMsg('Файл "' + nm + '" не знайдено.');
            if (c.type === 'folder') { if (wanted.length === 1) { nameIn.value = ''; return go(c.id); } return setMsg('"' + nm + '" — це папка.'); }
            ids.push(c.id);
          }
        } else return setMsg('Оберіть файл.');
        if (!multiple && ids.length > 1) return setMsg('Можна обрати лише один файл.');
        return finish({ ids });
      }
      // save
      if (cur.kind === 'computer') return setMsg('Оберіть диск або папку.');
      let name = nameIn.value.trim();
      if (!name) return setMsg('Введіть ім\'я файлу.');
      if (BAD_NAME.test(name) || name === '.' || name === '..') return setMsg('Ім\'я не може містити символи: \\ / : * ? " < > |');
      const ext = types[typeIdx] && types[typeIdx].ext;
      if (ext && !/\.[^.]+$/.test(name)) name += ext;
      const ex = await childByName(cwd, name);
      if (ex && ex.type === 'folder') { nameIn.value = ''; return go(ex.id); }
      if (ex && !(await ask('Файл "' + ex.name + '" уже існує. Замінити його?', false))) return;
      finish({ parentId: cwd, name: ex ? ex.name : name });
    }

    /* ---- події ---- */
    upBtn.onclick = async () => { const c = await dbGet(cwd); if (c && c.parent != null) go(c.parent); };
    newBtn.onclick = async () => {
      const name = await ask('Ім\'я нової папки:', true, 'Нова папка');
      if (!name) return;
      if (BAD_NAME.test(name) || name === '.' || name === '..') return setMsg('Недопустиме ім\'я папки.');
      if (await childByName(cwd, name)) return setMsg('Елемент із таким іменем уже існує.');
      const n = await createNode(cwd, name, 'folder'); notify();
      sel = [n.id]; await render();
    };
    typeSel.onchange = () => { typeIdx = +typeSel.value; render(); };
    okBtn.onclick = accept;
    const cancel = () => finish(null);
    cancelBtn.onclick = cancel;
    xBtn.onclick = cancel;
    ov.addEventListener('mousedown', e => { if (e.target === ov) cancel(); });
    nameIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') accept(); if (e.key === 'Escape') cancel(); });
    function onKey(e) {
      if (dlg.querySelector('.vfs-mini-ov')) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
      else if (e.key === 'Enter' && document.activeElement !== nameIn) { e.preventDefault(); accept(); }
    }
    document.addEventListener('keydown', onKey, true);

    await render();
    nameIn.focus();
    if (mode === 'save') {
      const dot = nameIn.value.lastIndexOf('.');
      nameIn.setSelectionRange(0, dot > 0 ? dot : nameIn.value.length);
    }
    const result = await done;
    if (result) {
      const dirId = result.parentId || (result.ids && result.ids[0] && (await dbGet(result.ids[0])).parent) || result.id;
      if (dirId) rememberDir(o.id, dirId);
    }
    return result;
  }

  // Найвищий доступний (того ж походження) документ, де є VFS.ui — щоб діалог малювався на робочому столі
  function hostVFS() {
    let best = VFS, w = global;
    for (let i = 0; i < 8; i++) {
      try {
        if (w.parent === w) break;
        w = w.parent;
        if (w.VFS && w.VFS.__loaded && w.VFS.ui) best = w.VFS;
      } catch (_) { break; }
    }
    return best;
  }
  VFS.ui = { pick };

  const abort = () => domErr('AbortError', 'The user aborted a request.');

  async function showOpenFilePicker(options) {
    const o = Object.assign({}, options);
    normTypes(o.types, o.excludeAcceptAllOption);          // перевірка параметрів у цьому реалмі
    const r = await hostVFS().ui.pick({ ...o, mode: 'open', multiple: !!o.multiple });
    if (!r) throw abort();
    return Promise.all(r.ids.map(wrapId));
  }
  async function showSaveFilePicker(options) {
    const o = Object.assign({}, options);
    normTypes(o.types, o.excludeAcceptAllOption);
    if (o.suggestedName != null) o.suggestedName = String(o.suggestedName).replace(/[\\\/:*?"<>|]/g, '_');
    const r = await hostVFS().ui.pick({ ...o, mode: 'save' });
    if (!r) throw abort();
    let f = await childByName(r.parentId, r.name);
    if (!f) { f = await createNode(r.parentId, r.name, 'file'); notify(); }   // як у Chrome — порожній файл створюється одразу
    return new VFSFileHandle(f.id, f.name);
  }
  async function showDirectoryPicker(options) {
    const o = Object.assign({}, options);
    const r = await hostVFS().ui.pick({ ...o, mode: 'dir' });
    if (!r) throw abort();
    return wrapId(r.id);
  }
  VFS.showOpenFilePicker = showOpenFilePicker;
  VFS.showSaveFilePicker = showSaveFilePicker;
  VFS.showDirectoryPicker = showDirectoryPicker;

  // Підміна на window (за потреби — на чужому window, напр. iframe)
  VFS.install = function (win) {
    const w = win || global;
    for (const [k, fn] of [['showOpenFilePicker', showOpenFilePicker], ['showSaveFilePicker', showSaveFilePicker], ['showDirectoryPicker', showDirectoryPicker]]) {
      Object.defineProperty(w, k, { value: fn, configurable: true, writable: true, enumerable: true });
    }
  };
  // Підключити vfs.js у вікні, яке його ще не завантажило (iframe того ж походження).
  // Кожен realm отримує власну копію, тому instanceof / File / Blob всередині iframe працюють нативно.
  VFS.inject = function (win, src) {
    try {
      if (!win || (win.VFS && win.VFS.__loaded)) return false;
      const url = src || SCRIPT_SRC;
      if (!url) return false;
      const d = win.document;
      if (!d || d.getElementById('vfs-injected')) return false;
      const s = d.createElement('script');
      s.id = 'vfs-injected';
      s.src = url;
      (d.head || d.documentElement).appendChild(s);
      return true;
    } catch (_) { return false; }   // інший origin
  };
  // Підключення до <iframe>: підміна window.show*Picker у ньому після кожної навігації.
  // 1) одразу ставимо локальні заглушки (щоб працювало 'showSaveFilePicker' in window),
  // 2) на DOMContentLoaded/load підвантажуємо повноцінну копію vfs.js у realm iframe.
  VFS.attachFrame = function (iframe, src) {
    let lastDoc = null;
    const hook = () => {
      try {
        const w = iframe.contentWindow, d = w && w.document;
        if (!d || d === lastDoc || d.location.href === 'about:blank') return;
        lastDoc = d;
        if (!(w.VFS && w.VFS.__loaded)) VFS.install(w);
        VFS.inject(w, src);
      } catch (_) { /* інший origin */ }
    };
    iframe.addEventListener('load', hook);
    // раннє підключення: поки документ ще вантажиться
    const t = setInterval(() => {
      if (!iframe.isConnected) return clearInterval(t);
      hook();
    }, 15);
    setTimeout(() => clearInterval(t), 4000);
  };

  global.VFS = VFS;
  VFS.install(global);
  openDB().catch(() => {});
})(typeof window !== 'undefined' ? window : globalThis);
