let fs;
let selected = { image: null, audio: null, music: null };
let currentAudio = null;
let isPlaying = false;
let currentMusicAudio = null; // окремий програвач для музики
let isMusicPlaying = false;
// --- ІМПОРТ ---
let externalFiles = [];        // повний список файлів з files.txt
let categories = [];          // унікальні категорії
let currentCategory = 'things';
let selectedExternalImage = null; // URL обраного зображення для імпорту

async function openImportModal() {
  console.log("press Import")
  document.getElementById('importModal').style.display = 'flex';
  await loadExternalFiles();
}

function closeImportModal() {
  document.getElementById('importModal').style.display = 'none';
  selectedExternalImage = null;
  document.getElementById('importFileBtnContainer').style.display = 'none';
}

async function loadExternalFiles() {
  try {
    const response = await fetch('https://ed-info.github.io/images/files.txt');
    if (!response.ok) throw new Error('Не вдалося завантажити files.txt');
    const text = await response.text();
    externalFiles = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('images/'));

    // Виділяємо унікальні категорії
    const catSet = new Set();
    externalFiles.forEach(file => {
      const parts = file.split('/');
      if (parts.length >= 3) {
        catSet.add(parts[1]);
      }
    });
    categories = Array.from(catSet).sort();

    renderImportCategories();
    loadCategory('things');
  } catch (err) {
    await message('','Помилка завантаження списку файлів:\n' + err.message);
    console.error(err);
  }
}

function renderImportCategories() {
  const container = document.getElementById('importCategories');
  container.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.style.background = cat === currentCategory ? '#007bff' : '#444';
    btn.style.color = 'white';
    btn.style.border = '1px solid #666';
    btn.style.borderRadius = '20px';
    btn.style.padding = '4px 12px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => loadCategory(cat);
    container.appendChild(btn);
  });
}

function loadCategory(category) {
  currentCategory = category;
  renderImportCategories(); // оновлює активну кнопку

  const container = document.getElementById('importImages');
  container.innerHTML = '<div style="width:100%; text-align:center; color:#aaa;">Завантаження...</div>';

  const filesInCategory = externalFiles.filter(file => {
    const parts = file.split('/');
    return parts.length >= 3 && parts[1] === category;
  });

  // Завантажуємо прев’ю послідовно (щоб не перевантажувати)
  container.innerHTML = '';
  filesInCategory.forEach(file => {
    const url = `https://ed-info.github.io/${file}`;
    const item = document.createElement('div');
    item.style.textAlign = 'center';
    item.style.cursor = 'pointer';
    item.style.opacity = '0.8';
    item.onclick = () => selectExternalImage(url, item);

    const img = document.createElement('img');
    img.src = url;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'contain';
    img.style.background = '#999';
    img.style.borderRadius = '4px';

    const name = stripExtension(file.split('/').pop());
    const label = document.createElement('div');
    label.textContent = name;
    label.style.fontSize = '12px';
    label.style.marginTop = '4px';
    label.style.color = '#ddd';

    item.appendChild(img);
    item.appendChild(label);
    container.appendChild(item);
  });
}

function selectExternalImage(url, element) {
  // Знімаємо виділення з усіх
  document.querySelectorAll('#importImages > div').forEach(el => {
    el.style.opacity = '0.8';
    el.style.outline = 'none';
  });

  // Виділяємо обраний
  element.style.opacity = '1';
  element.style.outline = '2px solid #007bff';
  element.style.borderRadius = '6px';

  selectedExternalImage = url;
  document.getElementById('importFileBtnContainer').style.display = 'block';
}

async function importSelectedImage() {
  if (!selectedExternalImage) return;

  try {
    // Завантажуємо зображення як Blob
    const response = await fetch(selectedExternalImage);
    if (!response.ok) throw new Error('Не вдалося завантажити зображення');
    const blob = await response.blob();

    // Конвертуємо у Data URL
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    // Генеруємо ім’я файлу
    const filename = selectedExternalImage.split('/').pop();
    let name = filename;
    let counter = 1;
    while (await fs.type(`/images/${name}`) === 'file') {
      const ext = getExtension(filename);
      const base = stripExtension(filename);
      name = `${base} (${counter++})${ext}`;
    }
    console.log("Save import:",`/images/${name}`)
    // Зберігаємо у внутрішнє сховище
    await fs.write(`/images/${name}`, dataUrl);

    await message('Імпорт файлу','Файл успішно імпортовано!');
    await refreshGallery();
    closeImportModal();
  } catch (err) {
    await message('','Помилка імпорту:\n' + err.message);
    console.error(err);
  }
}
async function initFS() {
  fs = new FileSystem("PGZfs");
  await fs.mkdir('/images');
  await fs.mkdir('/sounds');
  await fs.mkdir('/music'); 
}

async function refreshGallery() {
  await renderImages();
  await renderSounds();
  await renderMusic(); 
}

function clearSelection(type) {
  selected[type] = null;
  const controlId = type === 'image' ? 'imageControls' :
                    type === 'audio' ? 'soundControls' :
                    type === 'music' ? 'musicControls' : null;
  if (controlId) {
    document.getElementById(controlId).style.display = 'none';
  }
  document.querySelectorAll(`.item[data-type="${type}"]`).forEach(el => el.classList.remove('selected'));
  
  if (type === 'audio') updatePlayButton(false);
  if (type === 'music') updatePlayMusicButton(false);
}

function clearAllSelections() {
  // Скидаємо глобальні змінні
  selected.image = null;
  selected.audio = null;
  selected.music = null;

  // Приховуємо всі панелі керування
  document.getElementById('imageControls').style.display = 'none';
  document.getElementById('soundControls').style.display = 'none';
  document.getElementById('musicControls').style.display = 'none';

  // Знімаємо клас 'selected' з усіх елементів галереї
  document.querySelectorAll('.item.selected').forEach(el => {
    el.classList.remove('selected');
  });

  // Зупиняємо програвання, якщо треба
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    isPlaying = false;
    updatePlayButton(false);
  }
  if (currentMusicAudio) {
    currentMusicAudio.pause();
    currentMusicAudio = null;
    isMusicPlaying = false;
    updatePlayMusicButton(false);
  }
}

function selectGalleryFile(type, path) {
  // --- 1. Скасовуємо ВСЕ попереднє виділення ---
  clearAllSelections();

  // --- 2. Встановлюємо нове виділення ---
  selected[type] = path;

  // --- 3. Показуємо відповідну панель керування ---
  let controlId;
  if (type === 'image') controlId = 'imageControls';
  else if (type === 'audio') controlId = 'soundControls';
  else if (type === 'music') controlId = 'musicControls';

  if (controlId) {
    document.getElementById(controlId).style.display = 'inline-block';
  }

  // --- 4. Додаємо клас 'selected' до обраного елемента ---
  const item = document.querySelector(`.item[data-path="${CSS.escape(path)}"]`);
  if (item) item.classList.add('selected');
}

// --- Допоміжні функції ---
function stripExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0 && lastDot < filename.length - 1) {
    return filename.substring(0, lastDot);
  }
  return filename;
}

function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0 && lastDot < filename.length - 1) {
    return filename.substring(lastDot);
  }
  return '';
}
// --- РЕНДЕРИНГ ---
async function renderImages() {
  const container = document.getElementById('imagesList');
  container.innerHTML = '';
  
  const files = await fs.ls('/images', 'files'); 

  for (const name of files) { 
    const data = await fs.read(`/images/${name}`);
    const path = `/images/${name}`;
    const displayName = stripExtension(name);
    
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.type = 'image';
    item.dataset.path = path;
        
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'thumb-container';
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = data;
    thumbContainer.appendChild(img);
    
    item.appendChild(thumbContainer);
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(displayName));
    container.appendChild(item);
  }
}

async function renderSounds() {
  const container = document.getElementById('soundsList');
  container.innerHTML = '';
  const files = await fs.ls('/sounds', 'files'); 
  for (const name of files) {
    const path = `/sounds/${name}`;
    const displayName = stripExtension(name);
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.type = 'audio';
    item.dataset.path = path;
        
    const icon = document.createElement('div');
    icon.className = 'audio-icon';
    icon.textContent = '🔊';
    
    item.appendChild(icon);
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(displayName));
    container.appendChild(item);
  }
}
async function renderMusic() {
  const container = document.getElementById('musicList');
  container.innerHTML = '';
  const files = await fs.ls('/music', 'files');
  for (const name of files) {
    const path = `/music/${name}`;
    const displayName = stripExtension(name);
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.type = 'music';
    item.dataset.path = path;
        
    const icon = document.createElement('div');
    icon.className = 'audio-icon';
    icon.textContent = '🎵';
    
    item.appendChild(icon);
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(displayName));
    container.appendChild(item);
  }
}
// --- ФАЙЛОВІ ДІЇ ---
function addFile(type) {
  clearSelection(type);
  const input = document.createElement('input');
  input.type = 'file';

  if (type === 'image') {
    input.accept = 'image/*';
  } else if (type === 'audio' || type === 'music') {
    input.accept = 'audio/*';
  } else {
    return;
  }

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      let folder, baseName, ext;

      if (type === 'image') folder = '/images/';
      else if (type === 'audio') folder = '/sounds/';
      else if (type === 'music') folder = '/music/';
      else return;

      const lastDot = file.name.lastIndexOf('.');
      if (lastDot > 0 && lastDot < file.name.length - 1) {
        baseName = file.name.substring(0, lastDot);
        ext = file.name.substring(lastDot);
      } else {
        baseName = file.name;
        ext = '';
      }

      let name = file.name;
      let counter = 1;
      while (await fs.type(folder + name) === 'file') { 
        name = `${baseName} (${counter++})${ext}`;
      }

      await fs.write(folder + name, dataUrl);
      await refreshGallery();
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

async function showSelected(type) {
  if (!selected[type]) return;
  const data = await fs.read(selected[type]);
  document.getElementById('modalImg').src = data;
  document.getElementById('modal').style.display = 'flex';
}

async function togglePlayPause() {
  if (!selected.audio) return;
  if (isPlaying) {
    if (currentAudio) currentAudio.pause();
    isPlaying = false;
    updatePlayButton(false);
  } else {
    if (currentAudio) currentAudio.pause();
    const data = await fs.read(selected.audio); 
    currentAudio = new Audio(data);
    currentAudio.play().catch(e => message('', 'Помилка програвання: ' + e.message));
    isPlaying = true;
    updatePlayButton(true);
    // ✅ Правильна змінна
    currentAudio.onended = () => {
      isPlaying = false;
      updatePlayButton(false);
      currentAudio = null;
    };
  }
}

function updatePlayButton(playing) {
  const btn = document.getElementById('playBtn');
  if (playing) {
    btn.textContent = '⏹️';
    btn.title = 'Зупинити';
  } else {
    btn.textContent = '▶️';
    btn.title = 'Програти';
  }
}
async function togglePlayPauseMusic() {
  if (!selected.music) return;
  if (isMusicPlaying) {
    if (currentMusicAudio) currentMusicAudio.pause();
    isMusicPlaying = false;
    updatePlayMusicButton(false);
  } else {
    if (currentMusicAudio) currentMusicAudio.pause();
    const data = await fs.read(selected.music); 
    currentMusicAudio = new Audio(data);
    currentMusicAudio.play().catch(e => message('','Помилка програвання: ' + e.message));
    isMusicPlaying = true;
    updatePlayMusicButton(true);
    currentMusicAudio.onended = () => {
      isMusicPlaying = false;
      updatePlayMusicButton(false);
      currentMusicAudio = null;
    };
  }
}

function updatePlayMusicButton(playing) {
  const btn = document.getElementById('playMusicBtn');
  if (playing) {
    btn.textContent = '⏹️';
    btn.title = 'Зупинити';
  } else {
    btn.textContent = '▶️';
    btn.title = 'Програти';
  }
}
// 
function getPath(type) {
  const path = selected[type];
  return path;
}
// --- ПЕРЕЙМЕНУВАННЯ (без розширення у діалозі) ---
async function renameSelected(type) {
  const path = selected[type];
  if (!path) return;
  
  const oldName = path.split('/').pop();
  const oldDisplayName = stripExtension(oldName);
  const ext = getExtension(oldName);

  const newName = prompt('Нове ім’я:', oldDisplayName);
  if (!newName || newName === oldDisplayName) return;

  const newFullName = newName + ext;
  const dir = path.substring(0, path.lastIndexOf('/') + 1);

  if (newFullName === oldName) return;

  if (await fs.type(dir + newFullName) === 'file') {
    await message('','Файл з таким іменем уже існує!');
    return;
  }

  await fs.mv(path, dir + newFullName);
  clearSelection(type);
  await refreshGallery();
}
async function deleteSelected(type) {
  const path = selected[type];
  if (!path) return;
  if (await askConfirm('','Видалити файл?')) {
    await fs.rm(path); 
    clearSelection(type);
    await refreshGallery(); 
  }
}

// --- ЕКСПОРТ У ZIP ---
async function exportGallery() {
  const zip = new JSZip();

  // Зображення
  const imageFiles = await fs.ls('/images', 'files');
  for (const name of imageFiles) {
    const dataUrl = await fs.read(`/images/${name}`);
    const blob = await dataURLToBlob(dataUrl);
    zip.file(`images/${name}`, blob);
  }

  // Аудіо
  const soundFiles = await fs.ls('/sounds', 'files');
  for (const name of soundFiles) {
    const dataUrl = await fs.read(`/sounds/${name}`);
    const blob = await dataURLToBlob(dataUrl);
    zip.file(`sounds/${name}`, blob);
  }

  // Музика
  const musicFiles = await fs.ls('/music', 'files');
  for (const name of musicFiles) {
    const dataUrl = await fs.read(`/music/${name}`);
    const blob = await dataURLToBlob(dataUrl);
    zip.file(`music/${name}`, blob);
  }

  // Додаємо файл з кодом Python
  if (typeof PythonIDE !== 'undefined' && PythonIDE.files && PythonIDE.currentFile) {
    const pythonCode = PythonIDE.files[PythonIDE.currentFile];
    const codeBlob = new Blob([pythonCode], { type: "text/plain", endings: "transparent" });
    zip.file("my_pgz.py", codeBlob);
  } else {
    console.warn("PythonIDE або поточний файл не знайдено — файл my_pgz.py не буде додано.");
  }

  if (imageFiles.length === 0 && soundFiles.length === 0 && musicFiles.length === 0 &&
      (!PythonIDE || !PythonIDE.files || !PythonIDE.currentFile)) {
    await message('','Немає файлів для експорту.');
    return;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, document.getElementById('projectNameInput').value+'.pgz');
}

function dataURLToBlob(dataUrl) {
  return new Promise((resolve) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    resolve(new Blob([u8arr], { type: mime }));
  });
}
document.addEventListener('click', function(e) {
  const item = e.target.closest('.item');
  if (item && item.dataset.type && item.dataset.path) {
    selectGalleryFile(item.dataset.type, item.dataset.path);
  }
});
// --- ІНІЦІАЛІЗАЦІЯ ---
async function initializeAssetsGallery() {
  await initFS();
  await refreshGallery();
};
initializeAssetsGallery()
async function importGallery() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pgz';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);

      // --- 1. Завантаження my_pgz.py у редактор ---
      const codeEntry = zip.file('my_pgz.py');
      if (codeEntry) {
        const code = await codeEntry.async('text');
        if (typeof PythonIDE !== 'undefined') {
          PythonIDE.files['my_pgz.py'] = code;
          PythonIDE.currentFile = 'my_pgz.py';
          PythonIDE.editor.setValue(PythonIDE.files[PythonIDE.currentFile]);
          PythonIDE.updateFileTabs();
		  PythonIDE.editor.refresh();
          console.log('Код my_pgz.py завантажено в редактор.');
        } else {
          console.warn('PythonIDE недоступний — код не завантажено.');
        }
      } else {
        console.log('Файл my_pgz.py не знайдено в архіві.');
      }

      // --- 2. Завантаження зображень ---
      const allFiles = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      for (const path of allFiles) {
        if (path.startsWith('images/')) {
          const filename = path.substring('images/'.length);
          const fileEntry = zip.file(path);
          if (!fileEntry) continue;

          const b64 = await fileEntry.async('base64');
          const extMatch = path.toLowerCase().match(/\.([a-z0-9]+)$/);
          const ext = extMatch ? extMatch[1] : 'png';
          const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml'
          };
          const mime = mimeTypes[ext] || 'image/png';
          const dataUrl = `data:${mime};base64,${b64}`;
          await fs.write(`/images/${filename}`, dataUrl);
          console.log("Імпортовано зображення:", filename);
        }
      }

      // --- 3. Завантаження звуків ---
      for (const path of allFiles) {
        if (path.startsWith('sounds/')) {
          const filename = path.substring('sounds/'.length);
          const fileEntry = zip.file(path);
          if (!fileEntry) continue;
          const arrayBuffer = await fileEntry.async('arraybuffer');
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          await fs.write(`/sounds/${filename}`, dataUrl);
          console.log("Імпортовано звук:", filename);
        }
      }

      // --- 4. Завантаження музики ---
      for (const path of allFiles) {
        if (path.startsWith('music/')) {
          const filename = path.substring('music/'.length);
          const fileEntry = zip.file(path);
          if (!fileEntry) continue;
          const arrayBuffer = await fileEntry.async('arraybuffer');
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          await fs.write(`/music/${filename}`, dataUrl);
          console.log("Імпортовано музику:", filename);
        }
      }

      // --- Оновлення інтерфейсу ---
      await refreshGallery();
      await message('','Проєкт успішно імпортовано!');
    } catch (err) {
      console.error('Помилка імпорту:', err);
      await message('','Помилка при завантаженні архіву:\n' + (err.message || err));
    }
  };

  input.click();
}
