let fs;
let selected = { image: null, audio: null, music: null };
let currentAudio = null;
let isPlaying = false;
let currentMusicAudio = null; // окремий програвач для музики
let isMusicPlaying = false;
// --- ІМПОРТ ---
let externalFiles = [];       // повний список файлів з files.txt
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
    await showGallery();
    closeImportModal();
  } catch (err) {
    await message('','Помилка імпорту:\n' + err.message);
    console.error(err);
  }
}
async function initFS() {
  if (!fs) fs = window.jsfs || new FileSystem("PGZfs");
  window.jsfs = fs;
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
async function renderAudioItems(containerId, folder, type, icon) {
  const container = document.getElementById(containerId);
  if (!container) return; // Захист від відсутності контейнера в DOM
  
  container.innerHTML = '';
  
  // Використовуємо активну файлову систему (як ми визначили раніше)
  const activeFs = window.jsfs || fs;
  const files = await activeFs.ls(folder, 'files'); 

  for (const name of files) {
    const path = `${folder}/${name}`.replace(/\/+/g, '/');
    const displayName = stripExtension(name);
    
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.type = type;
    item.dataset.path = path;
    item.draggable = true;    
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'audio-icon';
    iconDiv.textContent = icon;
    
    item.appendChild(iconDiv);
    item.appendChild(document.createElement('br'));
    item.appendChild(document.createTextNode(displayName));
    container.appendChild(item);
  }
}

async function renderSounds() {
  await renderAudioItems('soundsList', '/sounds', 'audio', '🔊');
}

async function renderMusic() {
  await renderAudioItems('musicList', '/music', 'music', '🎵');
}

// --- ФАЙЛОВІ ДІЇ ---
async function addFile(type) {
  clearSelection(type);

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true; // багатовибір

  if (type === 'image') input.accept = 'image/*';
  else if (type === 'audio' || type === 'music') input.accept = 'audio/*';
  else return;

input.addEventListener('change', async (e) => {
  const files = Array.from(input.files);
  if (files.length === 0) return;

  // Використовуємо for...of для ПОСЛІДОВНОЇ обробки
  for (const file of files) {
    await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const dataUrl = reader.result;
          let folder, baseName, ext;

          if (type === 'image') folder = '/images/';
          else if (type === 'audio') folder = '/sounds/';
          else if (type === 'music') folder = '/music/';
          else return resolve();

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
        } catch (err) {
          console.error("Помилка завантаження файлу:", file.name, err);
        }
        resolve();
      };

      reader.onerror = () => resolve();
      reader.readAsDataURL(file);
    });
  }

  await refreshGallery();
});

  input.click();
}


async function showSelected(type) {
  if (!selected[type]) return;
  const data = await fs.read(selected[type]);
  document.getElementById('modalImg').src = data;
  document.getElementById('modal').style.display = 'flex';
}
async function toggleAudioPlayback(type) {
  const isMusic = type === 'music';
  const path = selected[type];
  if (!path) return;

  // Вибір потрібних змінних залежно від типу
  let audioVar = isMusic ? currentMusicAudio : currentAudio;
  let playingVar = isMusic ? isMusicPlaying : isPlaying;
  const updateFunc = isMusic ? updatePlayMusicButton : updatePlayButton;

  if (playingVar) {
    if (audioVar) audioVar.pause();
    if (isMusic) {
        isMusicPlaying = false;
    } else {
        isPlaying = false;
    }
    updateFunc(false);
  } else {
    // Зупиняємо попередній трек перед запуском нового
    if (audioVar) audioVar.pause();

    const activeFs = window.jsfs || fs;
    const data = await activeFs.read(path); 
    
    const newAudio = new Audio(data);
    
    // Оновлення глобальних посилань
    if (isMusic) {
        currentMusicAudio = newAudio;
        isMusicPlaying = true;
    } else {
        currentAudio = newAudio;
        isPlaying = true;
    }

    newAudio.play().catch(e => message('', 'Помилка програвання: ' + e.message));
    updateFunc(true);

    newAudio.onended = () => {
      if (isMusic) {
          isMusicPlaying = false;
          currentMusicAudio = null;
      } else {
          isPlaying = false;
          currentAudio = null;
      }
      updateFunc(false);
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

// Для звукових ефектів
async function togglePlayPause() {
  await toggleAudioPlayback('audio');
}

// Для музики
async function togglePlayPauseMusic() {
  await toggleAudioPlayback('music');
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

  const newName = prompt("Нове ім’я:", oldDisplayName);
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
  if (!fs) await initFS();
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
// --- ДРАГ-ЕНД-ДРОП ФУНКЦІОНАЛ ---
function enableDragAndDrop() {
  // Робимо елементи галереї перетягуваними
document.addEventListener('dragstart', function(e) {
    console.log("Drag Start")
    const item = e.target.closest('.item[data-type]');
    if (item && item.dataset.path) {
        const type = item.dataset.type; // 'image', 'audio', 'music'
        const filename = item.dataset.path.split('/').pop();
        const nameWithoutExt = stripExtension(filename);
        
        let codeToInsert = '';
        
        switch(type) {
            case 'image':
                codeToInsert = `\n${nameWithoutExt} = Actor('${nameWithoutExt}')\n`;
                break;
            case 'audio':
                codeToInsert = `\nsounds.${nameWithoutExt}.play()\n`;
                break;
            case 'music':
                codeToInsert = `\nmusic.play('${nameWithoutExt}')\n`;
                break;
        }
        
        // Зберігаємо код для вставки у dataTransfer
        e.dataTransfer.setData('text/plain', codeToInsert);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Опціонально: показуємо прев'ю зображення під час перетягування
        if (type === 'image') {
            const img = item.querySelector('img');
            if (img) {
                e.dataTransfer.setDragImage(img, 50, 50);
            }
        }
    }
});
}
//
// видалення всіх файлів
async function clearFolder(folderPath) {
    // Використовуємо вже ініціалізований об'єкт fs
    if (!fs) {
        console.error("Файлова система не ініціалізована");
        return;
    }

    try {
        // Отримуємо список усіх елементів у теці
        const entries = await fs.ls(folderPath, 'all');
        
        for (const entry of entries) {
            const fullPath = `${folderPath}/${entry}`.replace(/\/+/g, '/');
            const entryType = await fs.type(fullPath);

            if (entryType === 'folder') {
                // Рекурсивно очищаємо підтеку
                await clearFolder(fullPath);
                // Видаляємо вже порожню теку
                await fs.rm(fullPath);
            } else {
                // Видаляємо файл
                await fs.rm(fullPath);
            }
        }
    } catch (e) {
        // Ігноруємо лише помилку відсутності теки, інші — виводимо
        if (!e.message?.includes('Invalid folder') && !e.message?.includes('not found')) {
            console.error(`Помилка очищення ${folderPath}:`, e);
        }
    }
}

// видалення всіх файлів
async function clearProjectResources() { 
	await initFS();   
    await clearFolder('/images');
    await clearFolder('/sounds');
    await clearFolder('/music');
    // Очищення DOM
    ['imagesList', 'soundsList', 'musicList'].forEach(id => {
        document.getElementById(id).innerHTML = "";
    });
    document.getElementById('output').innerHTML = '';
}
//
// --- ІНІЦІАЛІЗАЦІЯ ---
async function initializeAssetsGallery() {
  await initFS();
  await refreshGallery();
  enableDragAndDrop();
}
async function importGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pgz';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await clearProjectResources();
            clearAllSelections();

            const zip = await JSZip.loadAsync(file);
            
            // Завантаження коду
            const codeEntry = zip.file('my_pgz.py');
            if (codeEntry && typeof PythonIDE !== 'undefined') {
                const code = await codeEntry.async('text');
                PythonIDE.files['my_pgz.py'] = code;
                PythonIDE.currentFile = 'my_pgz.py';
                PythonIDE.editor.setValue(code);
                PythonIDE.updateFileTabs();
            }

            // Обробка медіафайлів одним циклом
            const allFiles = Object.keys(zip.files).filter(name => !name.endsWith('/'));
            for (const path of allFiles) {
                const folder = path.split('/')[0];
                if (['images', 'sounds', 'music'].includes(folder)) {
                    const fileData = await zip.file(path).async('base64');
                    // Логіка визначення MIME-типу та запис через fs.write...
                    const dataUrl = `data:application/octet-stream;base64,${fileData}`;
                    await fs.write('/' + path, dataUrl);
                }
            }

            await refreshGallery();
            const projectName = file.name.replace(/\.pgz$/, '');
            document.getElementById('projectNameInput').value = projectName;
            await message('', 'Проєкт успішно імпортовано!');
        } catch (err) {
            console.error('Помилка імпорту:', err);
        }
    };
    input.click();
}

function normalizePgzUrl(input) {
  input = input.trim();
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
   if (input.startsWith('//')) {
    return 'https:' + input;
  }
  if (!input.includes('/') && !input.includes('.')) {

    throw new Error('Некоректна адреса проєкту');
  }
  return 'https://' + input;
}

// === ЗАВАНТАЖЕННЯ ПРОЄКТУ З URL ===
async function loadProjectFromUrl(rawUrl) {
  let pgzUrl;
  try {
    pgzUrl = normalizePgzUrl(rawUrl);
  } catch (e) {
    await message('', 'Некоректна адреса проєкту:\n' + rawUrl);
    return;
  }

  try {
    const response = await fetch(pgzUrl);
    if (!response.ok) {
      throw new Error(`Помилка завантаження: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);

    // 1. Завантаження коду (my_pgz.py)
    const codeEntry = zip.file('my_pgz.py');
    if (codeEntry && typeof PythonIDE !== 'undefined') {
      const code = await codeEntry.async('text');
      PythonIDE.files['my_pgz.py'] = code;
      PythonIDE.currentFile = 'my_pgz.py';
      PythonIDE.editor.setValue(code);
      PythonIDE.updateFileTabs();
      PythonIDE.editor.refresh();
      console.log('Код завантажено');
    }

    // 2. Обробка всіх медіафайлів одним циклом (як в importGallery)
    const allFiles = Object.keys(zip.files).filter(name => !name.endsWith('/'));
    for (const path of allFiles) {
      const folder = path.split('/')[0];
      
      // Перевіряємо, чи файл належить до однієї з медіа-папок
      if (['images', 'sounds', 'music'].includes(folder)) {
        const fileEntry = zip.file(path);
        if (!fileEntry) continue;

        // Використовуємо універсальний метод отримання base64 (як в importGallery)
        const fileData = await fileEntry.async('base64');
        const dataUrl = `data:application/octet-stream;base64,${fileData}`;
        
        await fs.write('/' + path, dataUrl);
        console.log(`Імпортовано: ${path}`);
      }
    }

    // Налаштування інтерфейсу для запуску гри
    document.getElementById('topPanel').style.display = 'none';
    document.getElementById('mainLayout').style.display = 'none';
    document.getElementById('gameModal').style.background = '#222';
    document.getElementById('closeGameBtn').style.display = 'none';
    document.getElementById('cgb').style.display = 'block';
	
    const playBtn = document.getElementById('playGameBtn');
    if (playBtn) {
      // Очищуємо старі лісенери та додаємо новий
      const newPlayBtn = playBtn.cloneNode(true);
      playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
      
      newPlayBtn.addEventListener('click', function() {
        this.style.display = 'none';
        PythonIDE.runCode();
      });
    }

  } catch (err) {
    console.error('Помилка імпорту з URL:', err);
    await message('', 'Не вдалося завантажити проєкт:\n' + (err.message || err.toString()));
  }
}
