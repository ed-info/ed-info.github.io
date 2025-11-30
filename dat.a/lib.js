    // Структура бази даних
    let database = {
        fileName: "",
        tables: [], // Кожна таблиця — об'єкт з name та schema
        reports: [], // 🆕 Масив для збереження звітів
        relations: [], // 🆕масив для збереження зв'язків
        forms: [] // ⬅️ масив для збереження форм

    };


let SQL = null;
let db = null;
let dbToDelete = null;
let selectedReportName = null;
let currentEditTable = null;
let selectedCell = null;
let selectedQueryName = null;
let selectedTableNameForEdit = null;
let selectedTableNameForDelete = null;
let selectedDbFile = null;
let newDbFile = false; // змінна для фіксації створення нового файлу
let editingTableName = "unnamed";
let autoIncrement = null;
let isNewTable = true;
let isNewRecord = false;    
let sqlQuery = null;
let queryName = null;
let constructorMode = null;
let screenGridVisible = false; 
let screenCanvas = null; 
let isCreatingNewRecord = false;
let currentPreviewForm = null;
let isOwnSQL = false;
let queries = {
        definitions: [], // Stores query configurations
        results: [] // Stores query result tables (virtual tables)
    };

    
closeAllModals();
// Завантаження SQL.js
initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    }).then(SQLLib => {
        SQL = SQLLib;
        //loadDatabase();
    });
/*
initSqlJs({
    locateFile: file => `lib/${file}`   // локальний шлях до sql-wasm.wasm
}).then(SQLLib => {
    SQL = SQLLib;
    // loadDatabase();
});
*/   
function getCurrentTableNames() {
      return Object.keys(database.tables || {});
    }
function getCurrentQueryNames() {      
      return Object.keys(queries.definitions || {});
    }
function getCurrentReportNames() {
      return (database.reports || []).map(r => r.name);
    }
function getCurrentFormNames() {
      return (database.forms || []).map(f => f.name);
    }
       
// Завантаження БД з localStorage або створення нової
function loadDatabase() {
        console.log("loadDatabase")        
        const name = database.fileName || "my_database";
        const saved = localStorage.getItem(name + ".db-data");
        console.log("name =",name)
        
        if (saved) {
            const uIntArray = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
            
            db = new SQL.Database(uIntArray);
            console.log("База даних завантажена: ",db);            
            // Завантажити запити тільки якщо є база
            const savedQueries = localStorage.getItem(name + ".queries-data");
            if (savedQueries) {
                queries.definitions = JSON.parse(savedQueries);
                console.log("Визначення запитів завантажено: ",queries.definitions);
                
            } else {
                queries.definitions = [];
            }
            
            const savedQueryResults = localStorage.getItem(name + ".query-results");
            if (savedQueryResults) {
                queries.results = JSON.parse(savedQueryResults);
                console.log("Результати запитів завантажено:", queries.results);
            } else {
                queries.results = [];
            }

            const savedReports = localStorage.getItem(name + ".reports-data");
            if (savedReports) {
                database.reports = JSON.parse(savedReports);
                console.log("Звіти завантажено: ",database.reports);               
            } else {
                database.reports = [];
            }
            
            const savedForms = localStorage.getItem(name + ".forms-data");
            if (savedForms) {
                database.forms = JSON.parse(savedForms);
                console.log("Форми завантажено: ",database.forms);
            } else {
                database.forms = [];
            }
            
            const savedRelations = localStorage.getItem(name + ".relations-data");
            if (savedRelations) {
                database.relations = JSON.parse(savedRelations);
                console.log("Зв'язки завантажено: ", database.relations);
            } else {
                database.relations = [];
            }

        } else {
            db = new SQL.Database(); // створюємо нову БД, але без запитів
            queries.definitions = []; // обнуляємо, бо бази немає
            database.reports = [];
            database.forms = [];
            console.log("Нова база даних створена");
        }
        newDbFile = false;
        queries.results = []; // Завжди очищати результати
        document.getElementById("import-table-link").style.display = "block";
        updateMainTitle();
        updateQuickAccessPanel(
                  getCurrentTableNames(),
                  getCurrentQueryNames(),
                  getCurrentReportNames(),
                  getCurrentFormNames()
                ); 
                             
                    
    }


// Збереження БД у localStorage
function saveDatabase() {
        console.log("Зберігаємо базу даних: ", database.fileName)        
        if (!db) return;
        const data = db.export();
        const base64 = btoa(String.fromCharCode(...data));
        localStorage.setItem(database.fileName + ".db-data", base64);       
        console.log("Зберігаємо таблиці: ",database.tables)
        localStorage.setItem(database.fileName + ".tables-data", JSON.stringify(database.tables));
        // Зберігаємо запити та їх результати
        console.log("Зберігаємо запити: ",queries.definitions)
        localStorage.setItem(database.fileName + ".queries-data", JSON.stringify(queries.definitions));
        console.log("Зберігаємо результати запитів: ",queries.results)
        localStorage.setItem(database.fileName + ".query-results", JSON.stringify(queries.results || []));


        // Зберігаємо звіти
        localStorage.setItem(database.fileName + ".reports-data", JSON.stringify(database.reports || []));
        console.log("Зберігаємо звіти: ",database.reports)
        // Зберігаємо форми
        localStorage.setItem(database.fileName + ".forms-data", JSON.stringify(database.forms || []));
        console.log("Зберігаємо форми: ",database.forms)
        // Зберігаємо зв'язки
        resetNonReadonlyRelations();
        console.log("Зберігаємо зв'язки: ",database.relations)
        localStorage.setItem(database.fileName + ".relations-data", JSON.stringify(database.relations || []));
        
        console.log("База даних збережена у localStorage");
        document.getElementById("import-table-link").style.display = "block";
        updateQuickAccessPanel(
                  getCurrentTableNames(),
                  getCurrentQueryNames(),
                  getCurrentReportNames(),
                  getCurrentFormNames()
                );                
                    
    }

/**
 * очищуємо базу даних, меню даних та панель швидкого доступу
 **/
function clearDB() {
    // очистити всі змінні
    database.fileName = "";
    database.tables =  [];
    database.reports = [];
    database.relations = [];
    database.forms =  [];            
    queries.definitions = [];
    queries.results = [];
            
    const dataMenu = document.getElementById("data-menu");
    dataMenu.innerHTML = "";
  
    updateQuickAccessPanel([], [], [], []);   
} 
 
/**
 * Перевірка для імені файлу, таблиць та полів
 **/
 function checkName(name) {
    
    name = name.trim();
    // перевірка довжини
    if (name.length < 2 || name.length > 32) {
        Message("Назва має містити від 2 до 32 символів.");
        return false;
    }
    // перевірка на наявність пропусків
    if (/\s/.test(name)) {
        Message("Назва не повинна містити пропусків - замініть на символ '_'.");
        return false;
    }
    // перевірка першого символу — літера (латиниця або кирилиця)
    const firstCharPattern = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]$/;
    if (!firstCharPattern.test(name[0])) {
        Message("Назва повинна починатися з літери (латинської або кириличної).");
        return false;
    }
    // перевірка на допустимі символи
    const allowedPattern = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9\-_']+$/;
    if (!allowedPattern.test(name)) {
        Message("Назва містить недопустимі символи. Дозволені: літери, цифри, дефіс (-), підкреслення (_), апостроф (').");
        return false;
    }
    // перевірка на заборонені символи (додаткова страховка)
    const forbiddenPattern = /[?"\/\\<>*\|:"]/;
    if (forbiddenPattern.test(name)) {
        Message("Назва містить заборонені символи: ? \" / \\ < > * | :");
        return false;
    }

    return true;
}

/**
 * Перевірка назв полів у структурі таблиці
 **/
function checkFieldName() {
    const rows = document.querySelectorAll("#schemaBody tr");
    let allValid = true;

    rows.forEach(row => {
        const nameCell = row.cells[1];
        const fieldName = nameCell.innerText.trim();

        // знімаємо попереднє підсвічування
        nameCell.style.backgroundColor = "";

        if (fieldName) {
            if (!checkName(fieldName)) {
                // погане ім'я → підсвітити комірку
                nameCell.style.backgroundColor = "#ffcccc"; // рожево-червоний
                allValid = false;
            }
        }
    });

    return allValid;
}

//

function showStorageDialog() {
        const listEl = document.getElementById("storageList");
        listEl.innerHTML = "";
        selectedDbFile = null;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.endsWith(".db-data")) {
                const fileName = key.replace(".db-data", "");
                const li = document.createElement("li");
                li.textContent = fileName;
                li.style.padding = "8px";
                li.style.cursor = "pointer";

                li.addEventListener("click", () => {
                    // зняти попереднє виділення
                    [...listEl.children].forEach(el => el.style.background = "");
                    li.style.background = "#d0e0ff";
                    selectedDbFile = fileName;
                });

                listEl.appendChild(li);
            }
        }

        document.getElementById("storageModal").style.display = "flex";
    }

    function closeStorageDialog() {
        document.getElementById("storageModal").style.display = "none";
    }

function loadSelectedDb() {
    if (!selectedDbFile) {
        Message("Виберіть файл бази даних.");
        return;
    }
    
    const saved = localStorage.getItem(selectedDbFile + ".db-data");
    if (!saved) {
        Message("Файл не знайдено.");
        return;
    }

    const uIntArray = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(uIntArray);

    // Очистити database, queries та меню
    clearDB();

    // Завантажити дані з локального сховища
    const fullDatabase = JSON.parse(localStorage.getItem(selectedDbFile + ".tables-data"));
    console.log("fullDatabase=", fullDatabase);

    queries.definitions = [];
    if (fullDatabase) {
        database.tables = fullDatabase;
    
        // Створити всі таблиці в SQLite, якщо вони відсутні
        database.tables.forEach(t => {
            try {
                db.exec(`SELECT * FROM "${t.name}" LIMIT 1`);
            } catch (e) {
                console.warn(`Таблиця "${t.name}" відсутня в SQLite, створюємо...`);
                
                // Створення таблиці вручну з її schema
                const fields = t.schema.map(field => {
                    let type = (field.type || "").toUpperCase();
                    if (type === "ЦІЛЕ ЧИСЛО") type = "INTEGER";
                    else if (type === "ДРОБОВЕ ЧИСЛО") type = "REAL";
                    else if (type === "ТЕКСТ") type = "TEXT";
                    else if (type === "ТАК/НІ" || type === "BOOLEAN") type = "INTEGER";
                    else if (type === "ДАТА") type = "TEXT";

                    let def = `"${field.title}" ${type}`;

                    if (field.primaryKey) {
                        if (field.autoInc && type === "INTEGER") {
                            def += " PRIMARY KEY AUTOINCREMENT";
                        } else {
                            def += " PRIMARY KEY";
                        }
                    }

                    return def;
                });

                // Додати FOREIGN KEY (якщо є)
                const foreignKeys = t.schema
                    .filter(f => f.foreignKey && f.refTable && f.refField)
                    .map(f => `FOREIGN KEY ("${f.title}") REFERENCES "${f.refTable}"("${f.refField}")`);

                const fullFields = [...fields, ...foreignKeys].join(", ");
                db.run(`CREATE TABLE "${t.name}" (${fullFields});`);
            }

            // 🔧 відновлюємо subst у схемі (щоб не губився після відновлення)
            t.schema = t.schema.map(f => ({
                ...f,
                subst: f.subst || false,
                autoInc: f.autoInc ?? false
            }));

            // Завантажити дані
            const res = db.exec(`SELECT * FROM "${t.name}"`);
            t.data = res.length ? res[0].values : [];
        });
    } else {
        Message("Файл даних пошкоджено або не містить таблиць.");
        return;
    }
    console.log("t.data=",database.tables)

    // Load 
    database.fileName = selectedDbFile;
    loadDatabase();

    // 🔄 Автоматично додати зв’язки з foreign key
    database.relations = [];
    database.tables.forEach(table => {
        table.schema.forEach(field => {
            if (field.foreignKey && field.refTable && field.refField) {
                database.relations.push({
                    fromTable: table.name,
                    fromField: field.title,
                    toTable: field.refTable,
                    toField: field.refField,
                    readonly: true,
                });
            }
        });
    });

    database.tables.forEach(t => addTableToMenu(t.name)); // 🔧 Оновити меню "Дані"
    Message("Базу даних '" + selectedDbFile + "' завантажено.");
    database.fileName = selectedDbFile;
    closeStorageDialog();
    updateMainTitle();
}


/**
 *  Розширене введення даних з контролем типів та налаштування елементів вводу (select, input, contentEditable, обмеження по типу даних, перевірки) *  
**/
function advDataInput(container, cellData, col, rowData, index, isReadOnly) {
    container.innerHTML = "";
    let createdEl = null;

    const typeStr = String(col?.type || "").toLowerCase();
    const isPK = !!col?.primaryKey;
    const isPKAuto = isPK && typeStr === "ціле число" && col?.autoInc === true;
    const isForeignKey = !!(col && col.foreignKey && col.refTable && col.refField);

    // ===== хелпери для caret у contentEditable =====
    const getCaretOffset = (el) => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return 0;
        const range = sel.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(el);
        preRange.setEnd(range.endContainer, range.endOffset);
        return preRange.toString().length;
    };

    const setCaretOffset = (el, offset) => {
        offset = Math.max(0, Math.min(offset, el.innerText.length));
        const range = document.createRange();
        const sel = window.getSelection();
        let current = 0;

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        let node = walker.nextNode();
        while (node) {
            const len = node.nodeValue.length;
            if (current + len >= offset) {
                range.setStart(node, offset - current);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                return;
            }
            current += len;
            node = walker.nextNode();
        }

        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    };

    // універсальний санітайзер для типів
    const sanitizeByType = (s, t) => {
        s = (s ?? "").toString().replace(/\r?\n/g, "");
        t = String(t || "").toLowerCase();
    
        if (t === "текст") {
            if (s.length > 64) s = s.slice(0, 64);
            return s;
        }
        if (t === "ціле число") {
            s = s.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
            if (s.startsWith("--")) s = "-" + s.slice(2);
            return s;
        }
        if (t === "дробове число") {
            s = s.replace(/[^\d.\-]/g, "")
                 .replace(/(?!^)-/g, "")
                 .replace(/(\..*)\./g, "$1");
            return s;
        }
        return s;
    };
    

    // ===== FOREIGN KEY =====
    if (isForeignKey) {
        const select = document.createElement("select");

        const emptyOption = document.createElement("option");
        emptyOption.value = "empty";
        emptyOption.textContent = "(пусто)";
        select.appendChild(emptyOption);

        const refTableObj = database.tables.find(t => t.name === col.refTable);
        if (refTableObj) {
            const refIdIndex = refTableObj.schema.findIndex(f => f.title === col.refField); // PK
            let displayIndex = refIdIndex;

            if (col.subst) {
                const idx = refTableObj.schema.findIndex(f => f.title === col.title);
                if (idx !== -1) displayIndex = idx;
            }

            if (refIdIndex !== -1) {
                refTableObj.data.forEach(refRow => {
                    const option = document.createElement("option");
                    option.value = refRow[refIdIndex];          // завжди PK
                    option.textContent = refRow[displayIndex];  // показуємо PK або підставлене значення
                    select.appendChild(option);
                });

                select.value = (cellData === null || cellData === undefined || cellData === "")
                    ? "empty"
                    : String(cellData);
            }
        }

        select.disabled = !!isReadOnly;
        
        container.appendChild(select);
        createdEl = select;

        select.addEventListener("change", () => {
            rowData[index] = select.value === "empty" ? null : select.value; // у таблиці завжди PK
        });
    }
    // ===== BOOLEAN =====
    else if (typeStr === "так/ні" || typeStr === "boolean") {
        const select = document.createElement("select");
        select.innerHTML = `<option value="1">Так</option><option value="0">Ні</option>`;
        select.value = (cellData == 1) ? "1" : "0";
        select.disabled = !!isReadOnly;
        container.appendChild(select);
        createdEl = select;

        select.addEventListener("change", () => {
            rowData[index] = Number(select.value);
        });
    }
    // ===== DATE (замінено на кастомний віджет custom-date-picker) =====
    else if (typeStr === "дата" || typeStr === "date") {
        console.log("cellData=",cellData)
        // Створюємо кастомний віджет (припускається, що datepicker.js вже підключено)
        const picker = document.createElement("custom-date-picker");

        // Визначаємо початкове значення: якщо cellData у форматі YYYY-MM-DD — використовуємо його,
        // інакше ставимо сьогоднішню дату (так само, як у попередній реалізації)
        const asStr = typeof cellData === "string" ? cellData : "";
        const defaultValue = /^\d{4}-\d{2}-\d{2}$/.test(asStr)
            ? asStr
            : new Date().toISOString().split("T")[0];

        // Встановлюємо value через атрибут (setter компонента також викличе change)
        picker.setAttribute("value", defaultValue);

        // Відмітка для доступності / блокування взаємодії
        if (isReadOnly) {
            // Якщо ваш компонент підтримує атрибут disabled — можна встановити його.
            // Багато веб-компонентів ігнорують 'disabled' автоматично, тому додатково блокуємо події.
            picker.setAttribute("aria-disabled", "true");
            picker.style.pointerEvents = "none";
            picker.style.opacity = "0.6";
        } else {
            picker.setAttribute("aria-disabled", "false");
            picker.style.pointerEvents = "";
            picker.style.opacity = "";
        }

        // Ініціалізуємо rowData початковим значенням (такий же поведінковий ефект, як у оригінальному input)
        rowData[index] = defaultValue;

        // При зміні — оновлюємо рядок
        picker.addEventListener("change", (e) => {
            // Компонент повинен мати геттер value, який повертає YYYY-MM-DD або "".
            // Якщо компонент повернув порожній рядок — зберігаємо порожнє значення.
            const val = (typeof picker.value === "string") ? picker.value : (e?.target?.getAttribute?.("value") || "");
            rowData[index] = val === "" ? "" : val;
        });

        container.appendChild(picker);
        createdEl = picker;
    }
    // ===== TEXT / NUMBER (contentEditable) =====
    else { 
        const editable = !isReadOnly && !isPKAuto;
        let displayValue = sanitizeByType(cellData ?? "", typeStr);
        container.textContent = displayValue;
        container.contentEditable = editable ? "true" : "false";
        container.spellcheck = false;
        createdEl = container;
    
        if (editable) {
            container.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const currentRow = container.closest("tr");
                    const nextRow = currentRow?.nextElementSibling;
                    const colIdx = Array.from(currentRow.children).indexOf(container);
                    if (nextRow) {
                        if (typeof highlightRow === "function") highlightRow(nextRow);
                        const nextCell = nextRow.children[colIdx];
                        if (nextCell) nextCell.focus();
                    } else {
                        container.focus();
                    }
                }
            });
    
            container.addEventListener("paste", (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData("text") || "";
                const clean = text.replace(/\r?\n/g, "").replace(/\s+$/g, "");
                document.execCommand("insertText", false, clean);
            });
    
            container.addEventListener("input", () => {
                const oldText = container.innerText;
                const caret = getCaretOffset(container);
                let newText = oldText;
                
                if (typeStr === "ціле число" || typeStr === "дробове число") {
                    newText = sanitizeByType(oldText, typeStr);
                }
    
                if (newText !== oldText) {
                    container.innerText = newText;
                    setCaretOffset(container, Math.min(caret, newText.length));
                }
    
                if (typeStr === "ціле число" || typeStr === "дробове число") {
                    const n = newText === "" ? null : Number(newText);
                    rowData[index] = (n === null || Number.isNaN(n)) ? null : n;
                } else {
                    rowData[index] = newText;
                }
            });
        }
    }
        
    if (createdEl && createdEl !== container) {
        if (container.dataset.tableName) createdEl.dataset.tableName = container.dataset.tableName;
        if (container.dataset.fieldName) createdEl.dataset.fieldName = container.dataset.fieldName;
        if (container.dataset.colIndex)  createdEl.dataset.colIndex  = container.dataset.colIndex;
    }

    return createdEl;
}


/**
 * Функція editData
 * ------------------
 * Призначення: Відображає інтерфейс редагування таблиці або перегляду запиту у модальному вікні.
 * Параметри: tableName — назва таблиці або запиту (з * на початку).
 * Результат: Відкриває модальне вікно з даними для редагування або перегляду.
 * Робота:
 * - Завантажує дані таблиці або результатів запиту з SQLite або об'єкта database.
 * - Якщо таблиці не існує — створює її, базуючись на схемі.
 * - Відображає дані у вигляді таблиці з можливістю редагування.
 **/
/**
 * Відкриває таблицю або результат запиту для редагування
 * (оновлено для підтримки кастомного <custom-date-picker>)
 */
function editData(tableName) {
    let table = null;
    let isReadOnly = false;
    let columns = [];
    let rows = [];

    document.getElementById("savedTablesModal").style.display = "none";
    selectedCell = null;
    const oldSelected = document.querySelector("tr.selected-row");
    if (oldSelected) oldSelected.classList.remove("selected-row");

    const isQueryTable = tableName.startsWith('*');
    console.log("Edit=", tableName);

    if (isQueryTable) {
        const originalQueryName = tableName.substring(1);
        table = queries.results.find(t => t.name === originalQueryName);
        isReadOnly = true;

        if (table) {
            table.schema = (table.schema || []).map(f => ({
                subst: !!f.subst,
                autoInc: (f.autoInc ?? (f.primaryKey && /int/i.test(String(f.type)))),
                ...f
            }));
            columns = table.schema.map(col => col.title);
            rows = table.data;
        }
    } else {
        table = database.tables.find(t => t.name === tableName);
        isReadOnly = false;

        if (table) {
            table.schema = (table.schema || []).map(f => ({
                subst: !!f.subst,
                autoInc: (f.autoInc ?? (f.primaryKey && /int/i.test(String(f.type)))),
                ...f
            }));
            columns = table.schema.map(col => col.title);
            rows = table.data || [];
        }
    }

    if (!table) {
        Message("Таблицю/Запит не знайдено");
        return;
    }

    currentEditTable = table;
    document.getElementById("editTitle").innerText = isReadOnly
        ? `Результати запиту ${table.name.slice(5)}`
        : `Записи таблиці "${table.name}"`;

    const head = document.getElementById("editHead");
    const body = document.getElementById("editBody");
    head.innerHTML = "";
    body.innerHTML = "";

    // --- Заголовок ---
    const headerRow = document.createElement("tr");
    columns.forEach((colTitle, i) => {
        const th = document.createElement("th");
        const colSchema = table.schema[i];
        th.textContent = colSchema && colSchema.subst ? colTitle + "🛟" : colTitle;
        th.style.backgroundColor = "#eee";
        if (!isReadOnly && colSchema && colSchema.primaryKey) th.classList.add("pk");
        headerRow.appendChild(th);
    });
    head.appendChild(headerRow);

    // --- Ресайз колонок ---
    (function setupColumnResizing() {
        const tableEl = head.closest('table') || document.getElementById('editTable');
        if (!tableEl) return;

        const oldColgroup = tableEl.querySelector('colgroup');
        if (oldColgroup) oldColgroup.remove();

        const colgroup = document.createElement('colgroup');
        for (let i = 0; i < columns.length; i++) {
            const col = document.createElement('col');
            const w = currentEditTable?.columnWidths?.[i];
            if (w) col.style.width = w + 'px';
            colgroup.appendChild(col);
        }
        tableEl.insertBefore(colgroup, tableEl.querySelector('thead') || tableEl.firstChild);
        tableEl.style.tableLayout = 'fixed';
        tableEl.style.width = tableEl.style.width || '100%';

        tableEl.querySelectorAll('th, td').forEach(el => {
            el.style.overflow = 'hidden';
            el.style.textOverflow = 'ellipsis';
            el.style.whiteSpace = 'nowrap';
        });

        headerRow.querySelectorAll("th").forEach((th, colIndex) => {
            th.style.position = "relative";
            if (th.querySelector('.col-resizer')) return;

            const resizer = document.createElement("div");
            resizer.className = 'col-resizer';
            Object.assign(resizer.style, {
                width: "8px",
                height: "100%",
                position: "absolute",
                top: "0",
                right: "0",
                cursor: "col-resize",
                userSelect: "none",
                zIndex: "20",
                transform: "translateX(50%)"
            });

            th.appendChild(resizer);

            resizer.addEventListener("mousedown", (e) => {
                e.preventDefault();
                const col = tableEl.querySelectorAll('col')[colIndex];
                if (!col) return;

                const startX = e.clientX;
                const startWidth = col.getBoundingClientRect().width;
                const minWidth = 40;
                const prevUserSelect = document.body.style.userSelect;
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'col-resize';

                function onMouseMove(ev) {
                    const dx = ev.clientX - startX;
                    col.style.width = Math.max(minWidth, Math.round(startWidth + dx)) + 'px';
                    currentEditTable.columnWidths = currentEditTable.columnWidths || [];
                    currentEditTable.columnWidths[colIndex] = parseInt(col.style.width);
                }

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.style.userSelect = prevUserSelect || '';
                    document.body.style.cursor = '';
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    })();

    // --- Рядки ---
    rows.forEach(rowData => {
        const tr = document.createElement("tr");
        rowData.forEach((cellData, index) => {
            const td = document.createElement("td");
            const colSchema = table.schema[index];

            const el = advDataInput(td, cellData, colSchema, rowData, index, isQueryTable);

            // 🔹 Спеціальна підтримка кастомного datepicker:
            if (el && el.tagName === 'CUSTOM-DATE-PICKER') {
                el.addEventListener("change", () => {
                    rowData[index] = el.value || "";
                });
            }

            td.addEventListener("click", () => {
                if (selectedCell?.parentElement) selectedCell.parentElement.classList.remove("selected-row");
                selectedCell = td;
                selectedCell.parentElement.classList.add("selected-row");
            });

            tr.appendChild(td);
        });
        body.appendChild(tr);
    });

    document.getElementById("addDataRowBtn").style.display = isReadOnly ? 'none' : 'inline-block';
    document.getElementById("deleteSelectedRowBtn").style.display = isReadOnly ? 'none' : 'inline-block';
    document.getElementById("saveTableDataBtn").style.display = isReadOnly ? 'none' : 'inline-block';
    document.getElementById("editModal").style.display = "flex";
}


/**
 * Додає новий рядок до таблиці
 * (оновлено для підтримки кастомного <custom-date-picker>)
 */
function addDataRow() {
    if (!currentEditTable || currentEditTable.name.startsWith('*')) return;

    const tbody = document.getElementById("editBody");
    const tr = document.createElement("tr");

    const newRowData = currentEditTable.schema.map(() => null);
    let firstEditableCell = null;

    currentEditTable.schema.forEach((col, index) => {
        const td = document.createElement("td");
        td.dataset.tableName = currentEditTable.name;
        td.dataset.fieldName = col.title;
        td.dataset.colIndex = index;

        let defaultValue = null;

        // Автоінкремент
        if (col.primaryKey && col.type === "Ціле число" && col.autoInc === true) {
            let max = 0;
            currentEditTable.data.forEach(row => {
                const val = parseInt(row[index]);
                if (!isNaN(val)) max = Math.max(max, val);
            });
            defaultValue = max + 1;
            newRowData[index] = defaultValue;
        }

        // Створюємо елемент введення
        const el = advDataInput(td, defaultValue, col, newRowData, index, false);

        // 🔹 Підтримка кастомного datepicker
        if (el && el.tagName === 'CUSTOM-DATE-PICKER') {
            el.addEventListener("change", () => {
                newRowData[index] = el.value || "";
            });
        }

        // Вибір першої активної клітинки
        if (!firstEditableCell && el && el !== td) firstEditableCell = el;
        else if (!firstEditableCell && td.isContentEditable) firstEditableCell = td;

        td.addEventListener("click", () => {
            selectedCell = td;
            highlightRow(tr);
        });

        tr.appendChild(td);
    });

    currentEditTable.data.push(newRowData);
    tbody.appendChild(tr);

    highlightRow(tr);

    if (firstEditableCell) {
        if (firstEditableCell.focus) firstEditableCell.focus();
        if (firstEditableCell.select) firstEditableCell.select();
    }
}


// Допоміжна функція для виділення рядка
function highlightRow(tr) {
    const tbody = tr.parentElement;
    tbody.querySelectorAll("tr").forEach(row => row.classList.remove("selected-row"));
    tr.classList.add("selected-row");
}

//

let deleteRowCallback = null; // сюди збережемо функцію, яку виконаємо після підтвердження

function confirmDeleteRow(pkValue, onConfirm) {
    // Зберігаємо колбек на підтвердження
    deleteRowCallback = onConfirm;

    // Заповнюємо текст повідомлення
    document.getElementById("deleteMessage").textContent =
        `Видалити запис "${pkValue}" з бази даних?`;

    // Показуємо модалку
    document.getElementById("deleteRowModal").style.display = "block";
}

function deleteRowConfirmed() {
    document.getElementById("deleteRowModal").style.display = "none";
    if (typeof deleteRowCallback === "function") {
        deleteRowCallback(true);
    }
    deleteRowCallback = null;
}

function deleteRowCancelled() {
    document.getElementById("deleteRowModal").style.display = "none";
    if (typeof deleteRowCallback === "function") {
        deleteRowCallback(false);
    }
    deleteRowCallback = null;
}
   

/**
* Функція deleteSelectedRow()
* ---------------------------
* Призначення: Видаляє вибраний рядок із таблиці редагування, якщо вона не є запитом і має первинний ключ.
* Параметри: Відсутні (використовує глобальні selectedCell та currentEditTable).
* Результат: Видаляє рядок з DOM і з бази даних, викликає збереження.
* Спосіб роботи:
* - Перевіряє, чи клітинка вибрана та чи таблиця не є запитом;
* - Знаходить індекс стовпця з первинним ключем;
* - Формує SQL-запит DELETE і виконує його;
* - Видаляє рядок із таблиці і зберігає БД.
**/
function deleteSelectedRow() {
    if (!selectedCell || currentEditTable.name.startsWith('*')) {
        Message("Спочатку клацніть у комірку рядка, який хочете видалити, або це вікно не є редагованим.");
        return;
    }

    const row = selectedCell.parentElement;
    const cells = row.querySelectorAll("td");

    // Збираємо всі стовпці, які є частиною PK
    const pkCols = currentEditTable.schema
        .map((col, idx) => col.primaryKey ? { title: col.title, index: idx } : null)
        .filter(Boolean);

    if (pkCols.length === 0) {
        Message("У таблиці немає первинного ключа, тому неможливо видалити запис з бази.");
        return;
    }

    // Значення першого PK для повідомлення
    const pkValue = cells[pkCols[0].index].innerText.trim();

    // Викликаємо модальне підтвердження
    confirmDeleteRow(pkValue, (confirmed) => {
        if (!confirmed) return;

        // Якщо підтверджено — формуємо SQL і видаляємо
        const whereClauses = pkCols.map(pk => {
            const value = cells[pk.index].innerText.trim();
            return `"${pk.title}" = '${value.replace(/'/g, "''")}'`;
        });

        const sql = `DELETE FROM "${currentEditTable.name}" WHERE ${whereClauses.join(" AND ")};`;

        try {
            db.run(sql);
            row.remove();
            saveDatabase();
        } catch (e) {
            Message("Помилка видалення: " + e.message);
        }
    });
}



/**
* Функція saveTableData()
*------------------------
* Призначення: Зберігає всі дані з таблиці редагування у базу даних, враховуючи різні типи елементів (select, input).
* Параметри: Відсутні (використовує DOM та currentEditTable).
* Результат: Дані записуються у БД, таблиця оновлюється.
* Спосіб роботи:
* - Проходить усі рядки таблиці;
* - Для кожної клітинки бере значення з select / input / тексту;
* - Якщо рядок не порожній — формує INSERT OR REPLACE SQL;
* - Зберігає базу та оновлює currentEditTable.data.
**/
function saveTableData() {
    if (!currentEditTable || currentEditTable.name.startsWith('*')) {
        Message("Ця таблиця не підлягає редагуванню.");
        return;
    }

    const rows = document.querySelectorAll("#editBody tr");

    const pkCols = currentEditTable.schema
        .filter(col => col.primaryKey)
        .map(col => col.title);

    if (pkCols.length > 0) {
        const seenPKs = new Set();
        for (let row of rows) {
            const cells = row.querySelectorAll("td");
            let pkValueCombo = pkCols.map(pk => {
                const colIndex = currentEditTable.schema.findIndex(c => c.title === pk);
                const cell = cells[colIndex];
                let val = "";

                const select = cell.querySelector("select");
                if (select) {
                    val = select.value;
                    if (val === "empty") val = "";
                } else {
                    const picker = cell.querySelector("custom-date-picker");
                    if (picker) {
                        val = picker.value ?? "";
                    } else {
                        val = cell.innerText.trim();
                    }
                }

                return val;
            }).join("||");

            if (pkValueCombo.trim() !== "") {
                if (seenPKs.has(pkValueCombo)) {
                    Message(`Помилка: знайдено повторювані значення первинного ключа: ${pkValueCombo}`);
                    return;
                }
                seenPKs.add(pkValueCombo);
            }
        }
    }

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const valuesObj = {};
        let allEmpty = true;

        currentEditTable.schema.forEach((col, index) => {
            const cell = cells[index];
            let val = "";

            const select = cell.querySelector("select");
            if (select) {
                val = select.value;
                if (val === "empty") val = "";
            } else {
                const picker = cell.querySelector("custom-date-picker");
                if (picker) {
                    val = picker.value ?? "";
                } else {
                    val = cell.innerText.trim();
                }
            }

            if (val !== "") allEmpty = false;
            valuesObj[col.title] = val;
        });

        if (allEmpty) return;

        if (pkCols.length > 0) {
            const whereClauses = pkCols.map(pk => `"${pk}" = '${valuesObj[pk].replace(/'/g, "''")}'`).join(" AND ");
            const checkSQL = `SELECT COUNT(*) as cnt FROM "${currentEditTable.name}" WHERE ${whereClauses};`;
            let exists = false;

            try {
                const res = db.exec(checkSQL);
                if (res.length > 0 && res[0].values[0][0] > 0) {
                    exists = true;
                }
            } catch (e) {
                console.warn("Помилка перевірки існування PK:", e);
            }

            if (exists) {
                const setClauses = Object.keys(valuesObj)
                    .map(key => `"${key}" = '${valuesObj[key].replace(/'/g, "''")}'`)
                    .join(", ");
                const updateSQL = `UPDATE "${currentEditTable.name}" SET ${setClauses} WHERE ${whereClauses};`;
                db.run(updateSQL);
            } else {
                const columns = Object.keys(valuesObj).map(k => `"${k}"`).join(", ");
                const vals = Object.values(valuesObj).map(v => `'${v.replace(/'/g, "''")}'`).join(", ");
                const insertSQL = `INSERT INTO "${currentEditTable.name}" (${columns}) VALUES (${vals});`;
                db.run(insertSQL);
            }
        } else {
            const columns = Object.keys(valuesObj).map(k => `"${k}"`).join(", ");
            const vals = Object.values(valuesObj).map(v => `'${v.replace(/'/g, "''")}'`).join(", ");
            const sql = `INSERT OR REPLACE INTO "${currentEditTable.name}" (${columns}) VALUES (${vals});`;
            db.run(sql);
        }
    });

    try {
        const res = db.exec(`SELECT * FROM "${currentEditTable.name}"`);
        currentEditTable.data = res.length ? res[0].values : [];
    } catch (e) {
        console.warn("Не вдалося оновити дані після збереження:", e);
        currentEditTable.data = [];
    }

    saveDatabase();
    Message("Дані збережено.");
    closeEditModal();
}



/**
* Функція closeEditModal()
* Призначення: Закриває вікно редагування таблиці, скидаючи вибрані значення.
* Параметри: Відсутні.
* Результат: Модальне вікно зникає, змінні очищуються.
**/
function closeEditModal() {
    document.getElementById("editModal").style.display = "none"; // Ховаємо вікно
    currentEditTable = null; // Скидаємо редаговану таблицю
    selectedCell = null; // Скидаємо вибрану клітинку
}



/** 
* Функція closeDbModal()
* Призначення: Закриває модальне вікно створення бази даних.
* Параметри: відсутні.
* Результат: Сховує вікно з вибором назви БД.
**/
function closeDbModal() {
    document.getElementById("dbModal").style.display = "none";
}
/**
* Перевірка нa новий файл
**/
function saveNewDb() {
    console.log("Save new file")
    newDbFile = true; 
    const name = document.getElementById("dbName").value.trim() || "my_database"; // зчитування назви БД або використання за замовчуванням
    if (!checkName(name)) return; // якщо "погане" ім'я
    console.log("Save new file=",name + ".db-data")
    console.log("newDbFile0 =",newDbFile)
    // Якщо створюємо новий файл і такий вже існує
    if (localStorage.getItem(name + ".tables-data")) {
        console.log("Overwrite!!!");
        newDbFile = false; 
        const msg = document.getElementById("overwtiteConfirmText");
        msg.innerHTML = `<p>Файл з назвою <b>${name}</b> вже існує.</p><p>Що робити?</p>`;
        console.log("newDbFile1 =",newDbFile)
        showOverwriteConfirm(name);
    };
    console.log("newDbFile2 =",newDbFile) 
    if (newDbFile) saveDb();
} 
/**
 * Вікно підтвердження при перезапису файлу бази даних
 **/ 
function showOverwriteConfirm(name) {
     document.getElementById("overwriteModal").style.display = "flex"; // показати вікно вибору
}
function doOverwriteDb() {
    document.getElementById("overwriteModal").style.display = "none"; 
    newDbFile = true;
    saveDb();
}

function doNewNameDb() {
    document.getElementById("overwriteModal").style.display = "none"; // ховаємо вікно вибору     
    newDbFile = false; 
}

function doCloseOverwriteConfirm() {
    document.getElementById("overwriteModal").style.display = "none"; // ховаємо вікно вибору     
    newDbFile = false;
    closeDbModal()
}

/** 
* Функція createDbFile()
* Призначення: Відкриває модальне вікно для створення нового файлу бази даних.
* Параметри: відсутні.
* Результат: Показ модального вікна з полем для введення назви бази.
**/
function createDbFile() {
    newDbFile = true;
    editingTableName = null;
    // Очистити всі змінні
    clearDB();           

    db = new SQL.Database(); // створюємо нову БД, але без запитів
    document.getElementById("dbName").value = "my_database"; // встановлюємо значення за замовчуванням
    document.getElementById("dbModal").style.display = "flex"; // відкриваємо модальне вікно
}
/**
 * Генерується унікальний ідентифікатор бази
 **/
function generateDbId() {
    const now = Date.now();
    return now & 0x7FFFFFFF; // залишає лише нижчі 31 біти
}
/** 
* Функція saveDb()
* Призначення: Створює новий файл бази даних у памʼяті та зберігає його.
* Параметри: відсутні.
* Результат: Створення SQLite бази, очищення попередніх даних, збереження у localStorage.
**/
function saveDb() {
    const name = document.getElementById("dbName").value.trim() || "my_database";
    
    if (newDbFile) { // ❗ Скидаємо структуру тільки при створенні нової БД
        clearDB();
        db = new SQL.Database();

        // Генеруємо 32-бітовий ідентифікатор
        const dbId = generateDbId();

        // Зберігаємо в PRAGMA user_version  
        console.log("dbId=",dbId)
        console.log("dbId type of:", dbId, typeof dbId);
        // ✅ Записуємо user_version — після змін, щоб гарантовано зберіглось
    
        db.run(`PRAGMA user_version = ${dbId};`);


        // Зберігаємо ідентифікатор 
        database.id = dbId;
        console.log("Файл бази даних створено:", database);
        console.log("Ідентифікатор БД (32-bit):", dbId, `(${toHex4Part(dbId)})`);

    }
    database.fileName = name;
    saveDatabase();

    

    closeDbModal();
    updateMainTitle();
}

/** 
* Функція saveDbAndCreateTable()
* Призначення: Створює базу даних та одразу відкриває інтерфейс для створення таблиці.
* Параметри: відсутні.
* Результат: Створення бази та перехід до створення структури таблиці.
**/
function saveDbAndCreateTable() {
    console.log("saveDbAndCreateTable")
    const name = document.getElementById("dbName").value.trim() || "my_database"; // зчитування назви БД або використання за замовчуванням
    if (!checkName(name)) return; // якщо "погане" ім'я   
    saveNewDb(); // зберігаємо базу
    if (newDbFile) {
        closeDbModal(); // закриваємо модальне вікно
        createTable(); // відкриваємо створення таблиці
    }
}

// Обʼєкт для збереження тимчасової інформації про створювану таблицю
let table = {
    name: "Неназвана_таблиця", // назва таблиці за замовчуванням
    schema: [] // структура таблиці
};

// Список усіх таблиць бази, використовується для перевірок у редакторі
let tableList = [];
/** 
 * Функція createTable()
 * Призначення: Відкриває модальне вікно для створення нової таблиці та ініціалізує її структуру.
 */
function createTable() {
    // Переконаємось, що стара таблиця не перезаписується
    if (!database.tables) database.tables = [];
    table.schema = []; // очищення схеми
    autoIncrement = null;
    isNewTable = true;
    editingTableName = null;

    // Очищуємо HTML таблиці
    const schemaBody = document.getElementById("schemaBody");
    if (!schemaBody) {
        console.error("Відсутній елемент schemaBody!");
        return;
    }
    schemaBody.innerHTML = "";

    // Переконаємось, що заголовки FK існують
    const refTableHeader = document.getElementById("refTableHeader");
    const refFieldHeader = document.getElementById("refFieldHeader");
    const refSubstHeader = document.getElementById("refSubstHeader");
    if (!refTableHeader) {
        console.warn("Відсутній refTableHeader, створюємо його динамічно");
        const th = document.createElement("th");
        th.id = "refTableHeader";
        th.innerText = "Таблиця 📌";
        schemaBody.closest("table").querySelector("thead tr").appendChild(th);
    }
    if (!refFieldHeader) {
        console.warn("Відсутній refFieldHeader, створюємо його динамічно");
        const th = document.createElement("th");
        th.id = "refFieldHeader";
        th.innerText = "Поле 📌";
        schemaBody.closest("table").querySelector("thead tr").appendChild(th);
    }
        if (!refSubstHeader) {
        console.warn("Відсутній refSubstHeader, створюємо його динамічно");
        const th = document.createElement("th");
        th.id = "refSubstHeader";
        th.innerText = "Поле 📌";
        schemaBody.closest("table").querySelector("thead tr").appendChild(th);
    }

    // Встановлюємо назву таблиці за замовчуванням
    document.getElementById("tableName").value = "Неназвана_таблиця";

    // Оновлюємо список існуючих таблиць для перевірки FK
    tableList = database.tables.map(t => t.name);

    // Додаємо перший рядок для створення полів
    addSchemaRow();

    // Встановлюємо заголовок модального вікна
    document.getElementById("makeTable").innerText = `Створення структури таблиці`;

    // Показуємо модальне вікно
    document.getElementById("modal").style.display = "flex";

    // Встановлюємо видимість заголовків FK
    toggleForeignKeyHeaders();
}
 
/** 
* Функція closeModal()
* Призначення: Закриває модальне вікно створення таблиці.
* Параметри: відсутні.
* Результат: Сховує вікно.
**/
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

/** 
* Функція deleteSchemaRow(button)
* Призначення: Видаляє один рядок зі структури створюваної таблиці.
* Параметри: button — кнопка "❌", натиснута користувачем.
* Результат: Видалення відповідного рядка з DOM.
*/
function deleteSchemaRow(button) {
    const row = button.closest("tr"); // знаходження батьківського рядка
    if (row) row.remove(); // видалення з DOM
    toggleForeignKeyHeaders();
}

/**
Функція toggleForeignKeyHeaders()
Призначення: Показує або приховує заголовки "Таблиця 📌" та "Поле 📌"
             залежно від того, чи є хоча б один увімкнений чекбокс зовнішнього ключа.
*/
function toggleForeignKeyHeaders() {
    const rows = document.querySelectorAll("#schemaBody tr");
    const anyChecked = Array.from(rows).some(row => {
        const checkbox = row.cells[3]?.querySelector('input[type="checkbox"]');
        return checkbox?.checked;
    });

    const refTableHeader = document.getElementById("refTableHeader");
    const refFieldHeader = document.getElementById("refFieldHeader");
    const refSubstHeader = document.getElementById("refSubstHeader");
    
    if (anyChecked) {
        refTableHeader.style.display = "";
        refFieldHeader.style.display = "";
        refSubstHeader.style.display = "";
    } else {
        refTableHeader.style.display = "none";
        refFieldHeader.style.display = "none";
        refSubstHeader.style.display = "none";
    }
}



/** 
* Функція addSchemaRow()
* Призначення: Додає новий рядок до структури таблиці, що створюється.
* Параметри: відсутні.
* Результат: Вставка HTML-елементів до тіла таблиці зі всіма полями для нового стовпця.
**/
function addSchemaRow() {
    const tbody = document.getElementById("schemaBody");
    const row = document.createElement("tr");

    const tableOptions = tableList.map(t => `<option value="${t}">${t}</option>`).join("");

    const anyChecked = Array.from(document.querySelectorAll('#schemaBody tr input[type="checkbox"]'))
        .some(cb => cb.closest('td')?.cellIndex === 3 && cb.checked);

    row.innerHTML = `
        <td style="text-align:center;">
            <input type="checkbox" onchange="handlePrimaryKey(this)">
        </td>
        <td contenteditable="true"></td>
        <td>
            <select>
                <option>Текст</option>
                <option>Ціле число</option>
                <option>Дробове число</option>
                <option>Так/Ні</option>
                <option>Дата</option>
            </select>
        </td>
        <td style="text-align:center;">
            <input type="checkbox" onchange="handleForeignKey(this)">
        </td>
        ${anyChecked ? `
            <td>
                <select onchange="updateFieldOptions(this)">
                    <option value="">(таблиця)</option>
                    ${tableOptions}
                </select>
            </td>
            <td>
                <select><option value="">(поле)</option></select>
            </td>
            <td>
                <input type="checkbox"
            </td>    
        ` : ''}
        <td contenteditable="true"></td>
        <td style="text-align:center;">
            <button onclick="deleteSchemaRow(this)">❌</button>
        </td>
    `;

    tbody.appendChild(row);
    toggleForeignKeyHeaders(); // гарантуємо правильний стан заголовків
}


    
/**
* Функція getFieldsForTable(tableName)
* Призначення: Повертає список назв полів для заданої таблиці.
* Параметри:
* - tableName (string): назва таблиці.
* Результат: Масив назв полів або порожній масив, якщо таблиця не знайдена.
*/
function getFieldsForTable(tableName) {
    const table = database.tables.find(t => t.name === tableName);
    if (!table) return [];
    return table.schema.map(field => field.title);
}

//
function getColumnName(checkbox) {
    const cell = checkbox.closest("td");       // комірка з чекбоксом
    const row = cell.closest("tr");            // рядок
    const cells = Array.from(row.cells);
    const index = cells.indexOf(cell);

    // наступна комірка після чекбокса
    if (index >= 0 && index + 1 < cells.length) {
        return cells[index + 1].innerText.trim();
    }
    return null;
}
/**
* Функція handlePrimaryKey(checkbox)
* Призначення: Обробляє встановлення або зняття первинного ключа для поля таблиці.
* Параметри:
* - checkbox (HTMLInputElement): прапорець первинного ключа.
* Результат: Оновлює тип поля та коментар до нього.
**/
function handlePrimaryKey(checkbox) {
    const row = checkbox.closest("tr");
    const cells = row.cells;
    const commentCell = cells[cells.length - 2];
    const typeSelect = row.cells[2].querySelector("select");

    if (checkbox.checked) {
        if (!commentCell.innerText.includes("Первинний ключ")) {
            if(!getColumnName(checkbox)) { 
                Message("Поле без назви!");
                checkbox.checked = false;
                return
            }
            commentCell.innerText = "Первинний ключ";
        }

        // Показуємо модальне вікно
        const modal = document.getElementById("pkModal");
        modal.style.display = "block";

        // Кнопка "Так"
        const yesBtn = document.getElementById("pkYes");
        yesBtn.onclick = () => {
            if (typeSelect) {
                typeSelect.value = "Ціле число";
                autoIncrement = getColumnName(checkbox);
                console.log("PK field autoIncrement=", autoIncrement);
                // встановлення автоінкременту у схемі
                const rowIdx = checkbox.closest("tr").rowIndex - 1; // -1 бо є заголовок
                if (table.schema[rowIdx]) table.schema[rowIdx].autoInc = true;
                // фарбування комірки
                checkbox.closest("td").style.backgroundColor = "#0f56d9";                
            }
                modal.style.display = "none";
        };

        // Кнопка "Ні"
        const noBtn = document.getElementById("pkNo");
        noBtn.onclick = () => {
            modal.style.display = "none";
            // повертаємося у функцію
            // скидання автоінкременту
            const rowIdx = checkbox.closest("tr").rowIndex - 1;
            if (table.schema[rowIdx]) table.schema[rowIdx].autoInc = false;
            checkbox.closest("td").style.backgroundColor = "";

        };

    } else {
        if (commentCell.innerText === "Первинний ключ") {
            commentCell.innerText = "";
            const rowIdx = checkbox.closest("tr").rowIndex - 1;
            if (table.schema[rowIdx]) table.schema[rowIdx].autoInc = false;
            checkbox.closest("td").style.backgroundColor = "";
        }
    }
}

/**
* Функція handleForeignKey(checkbox)
* Призначення: Обробляє встановлення або зняття зовнішнього ключа для поля.
* Параметри:
*  - checkbox (HTMLInputElement): прапорець зовнішнього ключа.
* Результат: Увімкнення/вимкнення селекторів таблиці/поля для FK.
**/
function handleForeignKey(checkbox) {
    const tbody = document.getElementById("schemaBody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));

    // Перевіряємо, чи заголовки FK вже видимі (до змін DOM)
    const refTableHeader = document.getElementById("refTableHeader");
    const headersVisible = !!refTableHeader && window.getComputedStyle(refTableHeader).display !== "none";

    // Чи є хоча б один увімкнений checkbox у всіх рядках
    const anyChecked = rows.some(row => {
        const cb = row.cells[3]?.querySelector('input[type="checkbox"]');
        return !!cb?.checked;
    });

    rows.forEach(row => {
        const cells = row.cells;
        const hasForeignKeyColumns = cells.length > 6; // якщо >6 — значить є стовпчики ЗК

        if (anyChecked && !hasForeignKeyColumns) {
            // Додаємо стовпчики FK перед останніми двома (коментар + кнопка)
            const commentCell = cells[cells.length - 2];

            const tableTd = document.createElement("td");
            const fieldTd = document.createElement("td");
            const substTd = document.createElement("td");

            const tableOptions = tableList
                .map(t => `<option value="${t}">${t}</option>`)
                .join("");

            tableTd.innerHTML = `
                <select onchange="updateFieldOptions(this)">
                    <option value="">(таблиця)</option>
                    ${tableOptions}
                </select>`;
            fieldTd.innerHTML = `<select><option value="">(поле)</option></select>`;
            substTd.innerHTML = `<input type="checkbox">`;

            row.insertBefore(tableTd, commentCell);
            row.insertBefore(fieldTd, commentCell);
            row.insertBefore(substTd, commentCell);

        } else if (!anyChecked && hasForeignKeyColumns) {
            // Видаляємо три комірки (підстановка, поле, таблиця) перед коментарем
            const commentIndex = cells.length - 2;
            // Видаляємо завжди з індексу commentIndex-1 тричі — після кожного deleteCell
            row.deleteCell(commentIndex - 1); // підстановка
            row.deleteCell(commentIndex - 1); // поле ЗК
            row.deleteCell(commentIndex - 1); // таблиця ЗК
        }
    });

    // якщо заголовки вже були видимі і користувач увімкнув чекбокс у конкретному рядку,
    // то у цьому рядку знімаємо disabled з select-ів (таблиця + поле)
    const currentRow = checkbox.closest("tr");
    if (headersVisible && checkbox.checked && currentRow) {
        // шукаємо перший і другий select в цьому рядку — вони мають бути tableSelect і fieldSelect
        const selects = currentRow.querySelectorAll("select");
        if (selects.length >= 1) {
            selects.forEach(sel => {
                sel.disabled = false;
                sel.removeAttribute("disabled");
            });
        }
    }
    
    console.log("handleForeignKey: toggled row =", checkbox.closest("tr"), "headersVisible=", headersVisible, "anyChecked=", anyChecked);

    toggleForeignKeyHeaders();
}


/**
* Функція updateFieldOptions(tableSelect)
* Призначення: Оновлює список доступних полів при виборі таблиці у зовнішньому ключі.
* Параметри:
* - tableSelect (HTMLSelectElement): селектор таблиці.
* Результат: Оновлення списку полів у відповідному селекторі.
*/
function updateFieldOptions(tableSelect) {
    const row = tableSelect.closest("tr");
    const fieldSelect = row.cells[5].querySelector("select");
    const selectedTable = tableSelect.value;
    console.log("selectedTable=",selectedTable)
    fieldSelect.innerHTML = `<option value="">Завантаження...</option>`;

    const fields = getFieldsForTable(selectedTable);
    fieldSelect.innerHTML = fields.map(f => `<option value="${f}">${f}</option>`).join("");
}

/**
* Функція saveSchema()
* Призначення: Зберігає структуру таблиці, створює відповідну таблицю в SQLite, вставляє дані, оновлює UI та базу.
* Параметри: відсутні.
* Результат: Створена або оновлена таблиця з новою схемою в БД.
**/
function saveSchema() {
    const newTableName = document.getElementById("tableName").value.trim() || "Неназвана_таблиця";
    if (!checkName(newTableName)) return;
    
    // Перевірка назв полів
    if (!checkFieldName()) {
        Message("Виправте назви полів з недопустимими символами.");
        return;
    }
    
    
    const rows = document.querySelectorAll("#schemaBody tr");

    const schema = [];
    const fieldNames = new Set();
    let hasDuplicate = false;

    for (let row of rows) {
        const isPrimaryKey = row.cells[0].querySelector("input").checked;
        let title = row.cells[1].innerText.trim();
        const type = row.cells[2].querySelector("select").value;
        const comment = row.cells[3].innerText.trim();

        if (!title) continue;

        const lowerTitle = title.toLowerCase();
        if (fieldNames.has(lowerTitle)) {
            hasDuplicate = true;
            break;
        }

        fieldNames.add(lowerTitle);

        let isForeignKey = false;
        const fkCheckbox = row.cells[3].querySelector("input[type=checkbox]");
        if (fkCheckbox) {
            isForeignKey = fkCheckbox.checked;
        }

        let refTable = null;
        let refField = null;
        let refSubst = false;

        if (isForeignKey) {
            const refTableSelect = row.cells[4]?.querySelector("select");
            const refFieldSelect = row.cells[5]?.querySelector("select");
            const refSubstCheck = row.cells[6]?.querySelector("input");
            if (refTableSelect) refTable = refTableSelect.value || null;
            if (refFieldSelect) refField = refFieldSelect.value || null;
            if (refSubstCheck)  refSubst = refSubstCheck.checked;
         }

        schema.push({
            primaryKey: isPrimaryKey,
            autoInc: title===autoIncrement,
            title: title,
            type: type,
            comment: comment,
            foreignKey: isForeignKey,
            refTable: isForeignKey ? refTable : null,
            refField: isForeignKey ? refField : null,
            subst: refSubst
        });
    }

    if (hasDuplicate) {
        Message("Назви полів мають бути унікальними.");
        return;
    }

    if (schema.length === 0) {
        Message("Структура таблиці не може бути порожньою.");
        return;
    }

    if (schema.filter(f => f.primaryKey).length === 0) {
        Message("Не вказано жодного первинного ключа. Таблиця не буде збережена.");
        return;
    }

    
    let oldTableName = null;

    if (newDbFile) editingTableName = newTableName;
    console.log("isNewTable =",isNewTable )
    if (!isNewTable && editingTableName) {
        if (typeof editingTableName === "string") {
            oldTableName = editingTableName.trim();
        } else if (typeof editingTableName.name === "string") {
            oldTableName = editingTableName.name.trim();
        }
    }

    if (!isNewTable && !oldTableName) {
        isNewTable = true;
    }

    const nameChanged = !isNewTable && oldTableName !== newTableName;

    let oldData = [];
    if (!isNewTable) {
        try {
            const stmt = db.prepare(`SELECT * FROM "${oldTableName}"`);
            while (stmt.step()) {
                oldData.push(stmt.getAsObject());
            }
            stmt.free();
        } catch (e) {
            console.warn("Не вдалося зчитати старі дані таблиці:", e);
        }

        try {
            db.run(`DROP TABLE IF EXISTS "${oldTableName}"`);
        } catch (e) {
            console.error("Не вдалося видалити стару таблицю:", e);
        }
    }

    db.run("PRAGMA foreign_keys = ON;");

    const fieldsSQL = schema.map(field => {
        let type = field.type.toUpperCase();
        if (type === "ЦІЛЕ ЧИСЛО") type = "INTEGER";
        else if (type === "ДРОБОВЕ ЧИСЛО") type = "REAL";
        else if (type === "ТЕКСТ") type = "TEXT";
        else if (type === "ТАК/НІ") type = "BOOLEAN";
        else if (type === "ДАТА") type = "TEXT";

        return `"${field.title}" ${type}`;
    });

    // Додаємо складений або одинарний PRIMARY KEY
    const pkFields = schema.filter(f => f.primaryKey).map(f => `"${f.title}"`);
    if (pkFields.length > 0) {
        fieldsSQL.push(`PRIMARY KEY (${pkFields.join(", ")})`);
    }

    const foreignKeys = schema
        .filter(f => f.foreignKey && f.refTable && f.refField)
        .map(f => `FOREIGN KEY ("${f.title}") REFERENCES "${f.refTable}"("${f.refField}")`);

    const fullFieldsSQL = [...fieldsSQL, ...foreignKeys].join(", ");
    const createSQL = `CREATE TABLE "${newTableName}" (${fullFieldsSQL});`;

    try {
        db.run(createSQL);
    } catch (e) {
        console.warn("Не вдалося створити таблицю:", e, createSQL);
        
        Message("Не вдалося створити таблицю.\n"+e);
        return;
    }

    const newFieldNames = schema.map(f => f.title);
    oldData.forEach(record => {
        const insertFields = [];
        const insertValues = [];
        for (const key of newFieldNames) {
            if (key in record) {
                insertFields.push(`"${key}"`);
                insertValues.push(JSON.stringify(record[key]));
            }
        }
        if (insertFields.length > 0) {
            const insertSQL = `INSERT INTO "${newTableName}" (${insertFields.join(", ")}) VALUES (${insertValues.join(", ")});`;
            try {
                db.run(insertSQL);
            } catch (e) {
                console.warn("Не вдалося вставити запис:", e, insertSQL);
            }
        }
    });

    const table = {
        name: newTableName,
        schema: schema,
        data: []
    };

    try {
        const stmt = db.prepare(`SELECT * FROM "${newTableName}"`);
        const fieldOrder = schema.map(f => f.title);
        while (stmt.step()) {
            const obj = stmt.getAsObject();
            const row = fieldOrder.map(f => obj[f] ?? null);
            table.data.push(row);
        }
        stmt.free();
    } catch (e) {
        console.warn("Не вдалося зчитати дані для таблиці:", e);
    }

    if (!isNewTable) {
        const index = database.tables.findIndex(t => t.name === oldTableName);
        if (index !== -1) {
            database.tables.splice(index, 1);
        }
    }
    database.tables.push(table);

    if (!isNewTable && nameChanged) {
        updateRelationsOnRename(oldTableName, newTableName);
        updateQueriesOnTableRename(oldTableName, newTableName);
        updateReportsOnTableRename(oldTableName, newTableName);
        updateFormsOnTableRename(oldTableName, newTableName);
        removeTableFromMenu(oldTableName);
    }

    addTableToMenu(newTableName);
    saveDatabase();
    Message("Структуру таблиці збережено.");
    closeModal();
    newDbFile = false;
    isNewTable = false;
}


// Допоміжна функція: чи змінилася структура
function isStructureChanged(oldSchema, newSchema) {
    if (!oldSchema || oldSchema.length !== newSchema.length) return true;

    for (let i = 0; i < oldSchema.length; i++) {
        const oldField = oldSchema[i];
        const newField = newSchema[i];
        if (
            oldField.title !== newField.title ||
            oldField.type !== newField.type ||
            oldField.primaryKey !== newField.primaryKey ||
            oldField.foreignKey !== newField.foreignKey ||
            oldField.refTable !== newField.refTable ||
            oldField.refField !== newField.refField
        ) {
            return true;
        }
    }
    return false;    
}

/**
 * Функція updateFormsOnTableRename
 * Призначення: Оновлює форми в database.forms після перейменування таблиці.
 * Оновлює:
 *   - element.tableName: якщо дорівнює oldName
 *   - element.text: якщо містить "oldName.fieldName" (наприклад, "Contacts.phone")
 * Параметри:
 *   - oldName (string): стара назва таблиці
 *   - newName (string): нова назва таблиці
 */
function updateFormsOnTableRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldEscaped = escapeRegex(oldName);
    const fieldRefPattern = new RegExp(`"${oldEscaped}\\.([a-zA-Z0-9_]+)"`, 'g');

    database.forms.forEach(form => {
        if (Array.isArray(form.elements)) {
            form.elements.forEach(element => {
                // 1. Оновлюємо tableName
                if (element.tableName === oldName) {
                    element.tableName = newName;
                }

                // 2. Оновлюємо text, якщо це посилання на поле: "TableName.FieldName"
                if (typeof element.text === 'string') {
                    const isFieldRef = new RegExp(`^"${oldEscaped}\\.[^"]+"$`).test(element.text);
                    if (isFieldRef) {
                        element.text = element.text.replace(fieldRefPattern, `"${newName}.$1"`);
                    } else if (element.text === oldName) {
                        // Якщо просто назва таблиці
                        element.text = element.text.replace(oldName, newName);
                    }
                }
            });
        }
    });

    console.log(`Оновлено форми: "${oldName}" → "${newName}" (tableName та text)`);
}

/**
 * Функція updateReportsOnTableRename
 * Призначення: Оновлює звіти в database.reports після перейменування таблиці.
 * Оновлює:
 *   - element.tableName: якщо співпадає з oldName
 *   - element.text: якщо містить "oldName.fieldName" → замінює на "newName.fieldName"
 * Параметри:
 *   - oldName (string): стара назва таблиці
 *   - newName (string): нова назва таблиці
 */
function updateReportsOnTableRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;

    // Екрануємо назви для регулярних виразів
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldEscaped = escapeRegex(oldName);

    // Регулярний вираз для пошуку "tableName.fieldName" у text
    const fieldRefPattern = new RegExp(`"${oldEscaped}\\.([a-zA-Z0-9_]+)"`, 'g');

    database.reports.forEach(report => {
        if (Array.isArray(report.elements)) {
            report.elements.forEach(element => {
                // 1. Оновлюємо tableName
                if (element.tableName === oldName) {
                    element.tableName = newName;
                }

                // 2. Оновлюємо text, якщо містить "OldTable.field"
                if (typeof element.text === 'string') {
                    // Спочатку перевіряємо, чи є посилання на поле: "TableName.FieldName"
                    const hasFieldRef = new RegExp(`^"${oldEscaped}\\.[^"]+"$`).test(element.text);
                    if (hasFieldRef) {
                        // Замінюємо всі входження "OldTable.field" → "NewTable.field"
                        element.text = element.text.replace(
                            fieldRefPattern,
                            `"${newName}.$1"`
                        );
                    } else if (element.text === oldName) {
                        // Якщо просто назва таблиці (наприклад, для заголовків)
                        element.text = element.text.replace(oldName, newName);
                    }
                }
            });
        }
    });

    console.log(`Оновлено звіти: "${oldName}" → "${newName}" (tableName та text)`);
}

/**
 * Функція updateQueriesOnTableRename
 * Призначення: Оновлює SQL та конфігурацію запитів після перейменування таблиці.
 * Оновлює:
 *   - sql: текст запиту (наприклад, "OldTable" → "NewTable")
 *   - config.tableName: у кожному полі
 *   - joins.fromTable, joins.toTable: якщо використовуються
 * Параметри:
 *   - oldName (string): стара назва таблиці
 *   - newName (string): нова назва таблиці
 */
function updateQueriesOnTableRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldEscaped = escapeRegex(oldName);
    const pattern = new RegExp(`"(${oldEscaped})"`, 'g');

    queries.definitions.forEach(query => {
        // 1. Оновлюємо SQL-рядок
        if (typeof query.sql === 'string') {
            query.sql = query.sql.replace(pattern, `"${newName}"`);
        }

        // 2. Оновлюємо config.tableName
        if (Array.isArray(query.config)) {
            query.config.forEach(field => {
                if (field.tableName === oldName) {
                    field.tableName = newName;
                }
            });
        }

        // 3. Оновлюємо joins (якщо є)
        if (Array.isArray(query.joins)) {
            query.joins.forEach(join => {
                if (join.fromTable === oldName) {
                    join.fromTable = newName;
                }
                if (join.toTable === oldName) {
                    join.toTable = newName;
                }
            });
        }

        // 4. (Опціонально) Оновлюємо назву запиту, якщо вона містить старе ім'я
        // if (typeof query.name === 'string' && query.name.includes(oldName)) {
        //     query.name = query.name.replace(oldName, newName);
        // }
    });

    console.log(`Оновлено запити: "${oldName}" → "${newName}" (sql, config, joins)`);
}
/**
 * Функція updateRelationsOnRename
 * Призначення: Оновлює всі посилання на таблицю в database.relations після її перейменування.
 * Параметри:
 *   - oldName (string): стара назва таблиці.
 *   - newName (string): нова назва таблиці.
 */
function updateRelationsOnRename(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;

    database.relations.forEach(relation => {
        // Оновлюємо звідки (fromTable)
        if (relation.fromTable === oldName) {
            relation.fromTable = newName;
        }
        // Оновлюємо куди (toTable)
        if (relation.toTable === oldName) {
            relation.toTable = newName;
        }
    });

    console.log(`Оновлено зв'язки: "${oldName}" → "${newName}"`);
}

/**
* Функція addTableToMenu(tableName)
* Призначення: Додає назву таблиці до списку таблиць у меню.
* Параметри:
* - tableName (string): назва таблиці.
* Результат: Елемент меню для редагування цієї таблиці додається до DOM.
**/
function addTableToMenu(tableName) {
    const dataMenu = document.getElementById("data-menu");

    // Якщо вже є — видаляємо стару версію (для оновлень)
    const existingItem = Array.from(dataMenu.children).find(item => item.textContent === tableName);
    if (existingItem) {
        existingItem.remove();
    }

    const item = document.createElement("a");
    item.href = "#";
    item.textContent = tableName;
    item.onclick = () => editData(tableName);

    dataMenu.appendChild(item);
    document.getElementById("data-work-link").style.display = "block";
    
}

/**
 * Функція removeTableFromMenu(oldTableName)
 * Призначення: Видаляє пункт меню для таблиці за її назвою.
 * Параметри:
 *  - oldTableName (string): назва таблиці, яку потрібно видалити з меню.
 * Результат: Відповідний елемент видаляється з DOM (якщо існує).
 */
function removeTableFromMenu(oldTableName) {
    const dataMenu = document.getElementById("data-menu");

    // Знаходимо елемент, у якого текстовий вміст співпадає з oldTableName
    const itemToRemove = Array.from(dataMenu.children).find(
        item => item.textContent.trim() === oldTableName.trim()
    );

    // Якщо знайшли — видаляємо
    if (itemToRemove) {
        dataMenu.removeChild(itemToRemove);
    }
}

/** 
 * Відображає модальне вікно з повідомленням
 * Параметри:
 *   msg — текст повідомлення, яке потрібно показати
 * Результат: показує вікно з заданим текстом
 **/
function Message(msg) {
    const modal = document.getElementById("messageModal"); // Отримати елемент модального вікна
    const content = document.getElementById("messageContent"); // Отримати блок для тексту

    content.innerText = msg; // Встановити текст повідомлення
    modal.style.display = "flex"; // Показати вікно
}

/** 
 * Приховує модальне вікно повідомлення 
 **/
function closeMessage() {
    document.getElementById("messageModal").style.display = "none"; // Сховати вікно
}

/** 
 * Запит на підтвердження видалення обраної бази даних
 * Показує модальне вікно підтвердження
 **/
function confirmDeleteDb() {
    if (!selectedDbFile) {
        Message("Виберіть файл для видалення."); // Якщо файл не вибрано — повідомлення
        return;
    }

    dbToDelete = selectedDbFile; // Зберегти ім’я БД для видалення
    document.getElementById("deleteConfirmText").innerHTML =
        `Ви дійсно хочете видалити базу даних <b>"${dbToDelete}"</b>?`; // Вивести підтвердження

    document.getElementById("deleteModal").style.display = "flex"; // Показати вікно підтвердження
}

/** 
 * Видаляє базу даних із localStorage
 * Після видалення оновлює список
 **/
function doDeleteDb() {
    if (dbToDelete) {
        // Якщо видаляється поточна база даних — спочатку її закриваємо
        if (dbToDelete === database.fileName) {
                    // Очистити поточну базу, обнулити структуру, UI тощо           
                    // Автоматично зберегти перед закриттям
                    saveDatabase();
            
                    // Очистити всі змінні
                    db = null;
                    clearDB();            
                    updateMainTitle(); // Змінити заголовок на "Виберіть або створіть базу даних"                    
                               
        }

        // Видалити дані бази та запити з localStorage
        localStorage.removeItem(dbToDelete + ".db-data");
        localStorage.removeItem(dbToDelete + ".queries-data");

        Message(`Файл "${dbToDelete}" видалено.`); // Показати повідомлення

        closeDeleteModal();     // Закрити підтвердження
        closeStorageDialog();   // Закрити список
        showStorageDialog();    // Оновити список
    }
}

/** 
 * Приховує модальне вікно підтвердження видалення 
 **/
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none"; // Сховати
    dbToDelete = null; // Очистити значення
}
/**
 * Залишаємо тільки зв'язки через FOREIGN KEY
 **/ 
function resetNonReadonlyRelations() {
    if (!Array.isArray(database.relations)) return;
    database.relations = database.relations.filter(r => r.readonly === true);
    document.querySelectorAll("select.join-table-a, select.join-table-b").forEach(el => el.remove());
   
}
 
/** 
 * Ініціалізує створення нового SQL-запиту 
 * Показує модальне вікно конструктора запиту
 **/
function createQuery() {
    resetNonReadonlyRelations();
    document.getElementById("queryName").value = "Новий_запит"; // Назва за замовчуванням
    document.getElementById("queryBody").innerHTML = ""; // Очистити старі рядки
    // Очистити таблицю JOIN-зв'язків
    const joinTable = document.getElementById("joinBody");
    if (joinTable) {
        const tbody = joinTable.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = ""; // Очистити всі рядки JOIN
        }
        joinTable.style.display = "none"; // Приховати таблицю JOIN
    }
    
    // Очистити базову таблицю (FROM)
    const fromTableSelect = document.getElementById("fromTable");
    if (fromTableSelect) {
        fromTableSelect.value = ""; // Скинути вибір
    }
    addQueryRow(); // Додати перший рядок
    document.getElementById("queryModal").style.display = "flex"; // Показати вікно
    populateTableDropdowns(); // Заповнити випадаючі списки таблиць
    toggleStructureButtonVisibility(true);
}

/** 
 * Приховує модальне вікно конструктора запиту
 **/
function closeQueryModal() {
    document.getElementById("queryModal").style.display = "none";
    toggleStructureButtonVisibility(false);
}

/** 
 * Додає новий рядок до конструктора запиту
 * Рядок містить вибір таблиці, поля, видимість, сортування, фільтр
 **/
function addQueryRow() {
    const tbody = document.getElementById("queryBody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><select class="query-table-select" onchange="populateFieldDropdown(this)"></select></td>
        <td><select class="query-field-select"></select></td>
        <td><input type="checkbox" checked class="query-visible-checkbox"></td>
        <td>
            <select class="query-sort-select">
                <option value="">Невпорядковано</option>
                <option value="ASC">За зростанням</option>
                <option value="DESC">За спаданням</option>
            </select>
        </td>
        <td>
            <div style="display: flex; gap: 4px; align-items: center;">
                <select class="query-operator-select" style="width: 60px;">
                    <option title="рівне" value="==">==</option>
                    <option title="менше" value="<">&lt;</option>
                    <option title="менше або рівне" value="<=">&lt;=</option>
                    <option title="більше" value=">">&gt;</option>
                    <option title="більше або рівне" value=">=">&gt;=</option>
                    <option title="не рівне" value="!=">!=</option>
                    <option title="схоже на шаблон" value="LIKE">LIKE</option>
                    <option title="входить до переліку" value="IN">IN</option>
                    <option title="не входить до переліку" value="NOT IN">NOT IN</option>
                    <option title="входить до проміжку" value="BETWEEN">BETWEEN</option>
                    <option title="не входить до проміжку" value="NOT BETWEEN">NOT BETWEEN</option>
                </select>
                <input type="text" class="query-criteria-input" style="flex: 1;">
            </div>
        </td>
        <td>
            <select class="query-field-role" title="Тип участі у запиті" onchange="toggleAliasInput(this)">
                <option value="select">----</option>               
                <option title="КІЛЬКІСТЬ" value="count">COUNT</option>
                <option title="СУМА" value="sum">SUM</option>
                <option title="СЕРЕДНЄ" value="avg">AVG</option>
                <option title="МІНІМАЛЬНЕ" value="min">MIN</option>
                <option title="МАКСИМАЛЬНЕ" value="max">MAX</option>
            </select>
            <input type="text" class="query-alias-input" placeholder="псевдонім" style="margin-top:4px; display:none; width:100%;height:1.5em;">
        </td>
        <td><select class="group-field-select"></select></td>
        <td><button onclick="deleteQueryRow(this)">❌</button></td>
    `;

    tbody.appendChild(row);
    populateTableDropdownsForRow(row);
}

/**
 * функція для показу/приховування input псевдоніма
 **/
function toggleAliasInput(selectEl) {
    const row = selectEl.closest("tr");
    const aliasInput = row.querySelector(".query-alias-input");
    console.log("toggleAliasInput=",selectEl.value)
    if (selectEl.value !== "select") {
        aliasInput.style.display = "block";
    } else {
        aliasInput.style.display = "none";
        aliasInput.value = "";
    }
}


/** 
 * Видаляє рядок з конструктора запиту
 * Параметр:
 *   button — кнопка ❌, яка викликала подію
 **/
function deleteQueryRow(button) {
    const row = button.closest("tr"); // Знайти відповідний рядок
    row.remove(); // Видалити рядок
}

/** 
 * Заповнює всі випадаючі списки таблиць у конструкторі запиту
 **/
function populateTableDropdowns() {
    const tableSelects = document.querySelectorAll(".query-table-select"); // Всі селекти таблиць
    
    tableSelects.forEach(select => {
        console.log("Заповнюється:", select.id);
        select.innerHTML = "<option value=''>Виберіть таблицю</option>"; // Початковий варіант
        database.tables.forEach(table => {
            const option = document.createElement("option");
            option.value = table.name;
            option.textContent = table.name;
            select.appendChild(option); // Додати назву таблиці
        });
    });
}

/**
 * Заповнює список таблиць у конкретному рядку конструктора запиту
 * Параметр:
 *   row — рядок, у якому потрібно заповнити список
 **/
function populateTableDropdownsForRow(row) {
    const select = row.querySelector(".query-table-select");
    select.innerHTML = "<option value=''>Виберіть таблицю</option>";
    database.tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.name;
        option.textContent = table.name;
        select.appendChild(option);
    });
}


/** 
 * Заповнює список полів таблиці на основі вибраної таблиці
 * Параметр:
 *   tableSelect — select-елемент з вибраною таблицею
 **/
function populateFieldDropdown(tableSelect) {
    const row = tableSelect.closest("tr");
    const fieldSelect = row.querySelector(".query-field-select");
    const groupSelect = row.querySelector(".group-field-select");
    fieldSelect.innerHTML = "";
    groupSelect.innerHTML = "";
    const selectedTableName = tableSelect.value;
    if (!selectedTableName) {
        fieldSelect.disabled = true;
        return;
    }

    const selectedTable = database.tables.find(t => t.name === selectedTableName);
    if (!selectedTable) return;

    fieldSelect.disabled = false;
    groupSelect.disabled = false;

    // Додати опцію "* (всі поля)" на початок
    const starOption = document.createElement("option");
    starOption.value = "*";
    starOption.textContent = "* (Всі поля)";
    fieldSelect.appendChild(starOption);

    // Додати реальні поля таблиці
    selectedTable.schema.forEach(field => {
        const option = document.createElement("option");
        option.value = field.title;
        option.textContent = field.title;
        fieldSelect.appendChild(option);        
    });
    const startOption = document.createElement("option");
    startOption.value = "";
    startOption.textContent = "----";
    groupSelect.appendChild(startOption);
        // Додати реальні поля таблиці
    selectedTable.schema.forEach(field => {
        const option = document.createElement("option");
        option.value = field.title;
        option.textContent = field.title;        
        groupSelect.appendChild(option);
    });
}



/** 
 * Повертає тип поля у вказаній таблиці
 * Параметри:
 *   tableName — назва таблиці
 *   fieldName — назва поля
 * Повертає: тип поля або порожній рядок
 */
function getFieldType(tableName, fieldName) {
    console.log("getFieldType=", database); // Діагностика
    const table = database.tables.find(t => t.name === tableName); // Знайти таблицю
    if (!table) return ""; // Якщо не знайдено — повернути ""
    const field = table.schema.find(f => f.title === fieldName); // Знайти поле
    console.log("getFieldType Field=", field); // Діагностика
    return field?.type || ""; // Повернути тип або "" якщо нема
}

//**************************************************************************
function isParameterPlaceholder(v) {
    return /^\[.*\]$/.test(v.trim());
}
    
function generateSqlQuery() {
    const queryName = document.getElementById("queryName").value.trim();
    const rows = document.querySelectorAll("#queryBody tr");

    let selectFields = [];
    let groupByFields = [];
    let baseTable = null;
    const fromTableEl = document.getElementById("fromTable");
    
    if (fromTableEl && fromTableEl.value.trim() !== "") {
        baseTable = fromTableEl.value.trim();
    } else {
        baseTable = null;
    }
    let joins = [];
    let whereClauses = [];
    let orderByClauses = [];
    const queryConfig = [];

    let hasSelect = false;
    let hasAggregate = false;
    let aggregateAliasCounter = 0;

    // --- helpers ---
    const sqlQuote = (s) => `'${String(s).replace(/'/g, "''")}'`;
    const parseList = (raw) => {
        if (!raw) return [];
        let s = raw.trim();
        if (s.startsWith("(") && s.endsWith(")")) s = s.slice(1, -1);
        return s.split(",").map(v => v.trim()).filter(v => v.length);
    };
    const isNumericLiteral = (v) => /^-?\d+(?:\.\d+)?$/.test(String(v).trim());
    const toIsoDate = (v) => {
        const s = String(v).trim();
        let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) return `${m[1]}-${m[2]}-${m[3]}`;
        m = s.match(/^(\d{2})[.\-\/](\d{2})[.\-\/](\d{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        return s;
    };
    const formatLiteral = (v, fieldType) => {
        const raw = String(v).trim().replace(/^'(.*)'$/, "$1");
        if (fieldType === "Дата") return sqlQuote(toIsoDate(raw));
        if (fieldType === "Так/Ні") {
            const L = raw.toLowerCase();
            if (["так","true","1"].includes(L)) return "1";
            if (["ні","false","0"].includes(L)) return "0";
            return isNumericLiteral(raw) ? raw : sqlQuote(raw);
        }
        return isNumericLiteral(raw) ? raw : sqlQuote(raw);
    };

    rows.forEach(row => {
        const tableName = row.querySelector(".query-table-select").value;
        const fieldName = row.querySelector(".query-field-select")?.value || "";
        const groupName = row.querySelector(".group-field-select")?.value || "";
        const isVisible = row.querySelector(".query-visible-checkbox").checked;
        const sortBy = row.querySelector(".query-sort-select").value;
        const operator = row.querySelector(".query-operator-select").value.trim();
        const criteria = row.querySelector(".query-criteria-input").value.trim();
        const fieldRole = row.querySelector(".query-field-role").value;
        let alias = row.querySelector(".query-alias-input").value.trim();

        if (!tableName || (!fieldName && fieldName !== "*")) return;
        if (!baseTable && tableName !== "*") baseTable = tableName;

        let fieldExpr = fieldName === "*"
            ? `"${tableName}".*`
            : `"${tableName}"."${fieldName}"`;

        // --- SELECT ---
        let selectExpr = "";
        if (fieldName === "*") {
            selectExpr = fieldExpr;
            hasSelect = true;
        } else {
            switch (fieldRole) {
                case "count":
                case "sum":
                case "avg":
                case "min":
                case "max":
                    if (!alias) alias = `${fieldRole}_${aggregateAliasCounter++}`;
                    selectExpr = `${fieldRole.toUpperCase()}(${fieldExpr}) AS ${alias}`;
                    hasAggregate = true;
                    break;
                case "select":
                default:
                    selectExpr = alias ? `${fieldExpr} AS ${alias}` : fieldExpr;
                    hasSelect = true;
                    break;
            }
        }
        if (isVisible && selectExpr) selectFields.push(selectExpr);

        // --- GROUP BY ---
        if (groupName) {
            const expr = `"${tableName}"."${groupName}"`;
            if (!groupByFields.includes(expr)) {
                groupByFields.push(expr);
            }
        }

        // --- WHERE ---
        if (fieldName !== "*" && operator) {
            const fieldType = getFieldType(tableName, fieldName);
            const op = operator.toUpperCase();
            if (op === "IS NULL" || op === "IS NOT NULL") {
                whereClauses.push(`${fieldExpr} ${op}`);
            } else if (op === "IN" || op === "NOT IN") {
                const items = parseList(criteria);
                const values = items.map(v => formatLiteral(v, fieldType));
                if (values.length) whereClauses.push(`${fieldExpr} ${op} (${values.join(", ")})`);
            } else if (op.includes("BETWEEN")) {
                const parts = criteria.split(/\s+AND\s+/i);
                if (parts.length === 2) {
                    const left = formatLiteral(parts[0], fieldType);
                    const right = formatLiteral(parts[1], fieldType);
                    whereClauses.push(`${fieldExpr} ${op} ${left} AND ${right}`);
                }
            } else if (criteria) {
                let right = isParameterPlaceholder(criteria)
                    ? criteria
                    : formatLiteral(criteria, fieldType);
                whereClauses.push(`${fieldExpr} ${op} ${right}`);
            }
        }

        // --- ORDER BY ---
        if (sortBy) {
            if (alias) orderByClauses.push(`${alias} ${sortBy}`);
            else if (fieldName !== "*") orderByClauses.push(`${fieldExpr} ${sortBy}`);
        }

        // --- save config row ---
        queryConfig.push({
            tableName, fieldName, isVisible,
            sortBy, operator, criteria,
            fieldRole, alias, groupName
        });
    });

    // --- JOIN ---
    const joinRows = document.querySelectorAll("#joinBody tbody tr");
    joinRows.forEach(row => {
        const tableA = row.querySelector(".join-table-a").value;
        const fieldA = row.querySelector(".join-field-a").value;
        const tableB = row.querySelector(".join-table-b").value;
        const fieldB = row.querySelector(".join-field-b").value;
        if (tableA && fieldA && tableB && fieldB) {
            joins.push({
                table: tableA,
                condition: `"${tableA}"."${fieldA}" = "${tableB}"."${fieldB}"`
            });
            if (!baseTable) baseTable = tableA;
        }
    });

    if (selectFields.length === 0) {
        Message("Будь ласка, оберіть хоча б одне видиме поле для запиту.");
        return;
    }
    if (!baseTable) {
        if (joins.length > 0) baseTable = joins[0].table;
        else {
            Message("Не вказано базову таблицю для FROM.");
            return;
        }
    }

    // --- SQL ---
    let sql = `SELECT ${selectFields.join(", ")}\nFROM "${baseTable}"`;
    joins.forEach(join => sql += `\nJOIN "${join.table}" ON ${join.condition}`);
    if (whereClauses.length) sql += `\nWHERE ${whereClauses.join(" AND ")}`;
    if (groupByFields.length) sql += `\nGROUP BY ${groupByFields.join(", ")}`;
    if (orderByClauses.length) sql += `\nORDER BY ${orderByClauses.join(", ")}`;

    // --- save query ---
    const queryDefinition = { name: queryName, baseTable: baseTable, config: queryConfig, joins, sql };
    const existingQueryIndex = queries.definitions.findIndex(q => q.name === queryName);
    if (existingQueryIndex !== -1) queries.definitions[existingQueryIndex] = queryDefinition;
    else queries.definitions.push(queryDefinition);
    saveDatabase();
    console.log("queryConfig=",queryDefinition )
    document.getElementById("generatedSql").innerText = sql;
    document.getElementById("sqlModal").style.display = "flex";
    toggleStructureButtonVisibility(true)
}







    


    function closeSqlModal() {
        document.getElementById("sqlModal").style.display = "none";
        toggleStructureButtonVisibility(false)
    }

    let pendingQueryText = "";
    let pendingPlaceholders = [];
    let pendingQueryName = "";
    let currentPlaceholderIndex = 0;
    
    function showNextParameterPrompt() {
        if (currentPlaceholderIndex >= pendingPlaceholders.length) {
            runFinalSqlQuery();
            return;
        }
    
        const placeholder = pendingPlaceholders[currentPlaceholderIndex];
        document.getElementById("parameterPrompt").innerText = placeholder;
        document.getElementById("parameterInput").value = "";
        document.getElementById("parameterModal").style.display = "flex";
    }
    
    function confirmParameter() {
        const value = document.getElementById("parameterInput").value;
        const placeholder = pendingPlaceholders[currentPlaceholderIndex];
        const safeValue = `'${value.replace(/'/g, "''")}'`;
    
        pendingQueryText = pendingQueryText.replace(`[${placeholder}]`, safeValue);
        currentPlaceholderIndex++;
        document.getElementById("parameterModal").style.display = "none";
        showNextParameterPrompt();
    }
    
    function cancelParameter() {
        document.getElementById("parameterModal").style.display = "none";
        Message("Виконання запиту скасовано.");
    }
    

function executeSqlQuery() {
    console.log("executeSqlQuery")
    sqlQuery = document.getElementById("generatedSql").innerText;
    queryName = document.getElementById("queryName").value.trim();
    isOwnSQL = false;
    runSqlQuery(sqlQuery, queryName); 
}

/**
 * Виконати користувацький SQL-запит
 **/ 
function executeOwnSQL() {
    sqlQuery = document.getElementById("ownSqlInput").value.trim();
    queryName = document.getElementById("ownSQLName").value.trim();
    if (!saveOwnSQLquery()) {
        Message("Запит не збережено!")
        }
    isOwnSQL = true;
    runSqlQuery(sqlQuery, queryName);
    
}    

function runSqlQuery(sqlQuery, queryName) {
    pendingQueryName = queryName;
    console.log("runSqlQuery")
    const matches = [...sqlQuery.matchAll(/\[([^\]]+)\]/g)];
    const uniquePlaceholders = [...new Set(matches.map(m => m[1]))];
    
    if (uniquePlaceholders.length > 0) {
            pendingQueryText = sqlQuery;
            pendingPlaceholders = uniquePlaceholders;
            currentPlaceholderIndex = 0;
            showNextParameterPrompt();
        } else {
            pendingQueryText = sqlQuery;
            runFinalSqlQuery();
        }
    }


function updateDatabaseTables() {
    // Очистимо список, щоб не дублювати
    database.tables = [];

    const res = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table';");
    if (res.length > 0) {
        const tableRows = res[0].values;
        tableRows.forEach(([name]) => {
            if (name.startsWith("sqlite_")) return;

            const pragmaRes = db.exec(`PRAGMA table_info("${name}")`);
            if (!pragmaRes.length) return;

            const columns = pragmaRes[0].values;

            // Зчитуємо зовнішні ключі
            const fkRes = db.exec(`PRAGMA foreign_key_list("${name}")`);
            const foreignKeys = fkRes.length ? fkRes[0].values.map(([id, seq, refTable, fromCol, toCol]) => ({
                fromCol, refTable, toCol
            })) : [];

            // Формуємо схему
            const schema = columns.map(([cid, title, type, notnull, dflt_value, pk]) => {
                const fk = foreignKeys.find(f => f.fromCol === title);
                return {
                    title,
                    type: type.toUpperCase() === "INTEGER" ? "Ціле число"
                        : type.toUpperCase() === "REAL" ? "Дробове число"
                        : type.toUpperCase().includes("TEXT") ? "Текст"
                        : type.toUpperCase().includes("BOOL") ? "Так/Ні"
                        : type,
                    primaryKey: pk > 0,
                    comment: pk > 0 ? "Первинний ключ" : "",
                    foreignKey: !!fk,
                    refTable: fk ? fk.refTable : null,
                    refField: fk ? fk.toCol : null
                };
            });

            // Зчитуємо дані
            const selectRes = db.exec(`SELECT * FROM "${name}"`);
            const dataRows = selectRes.length ? selectRes[0].values : [];

            database.tables.push({
                name: name,
                schema: schema,
                data: dataRows
            });
        });
    }
}


function runFinalSqlQuery() {
    const internalQueryName = `запит "${pendingQueryName}"`;
    const menuDisplayName = `*${internalQueryName}`;

    try {
        const isAggregateQuery = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(pendingQueryText);
        const res = db.exec(pendingQueryText); 
        
        if (isOwnSQL) { // оновимо про всяк випадок таблиці та їх структури якщо запит "вручну"
                    updateDatabaseTables();
                    isOwnSQL = false;
        }
        
        if (res.length > 0) {
            const columns = res[0].columns;
            const dataRows = res[0].values;

            const schema = columns.map(col => ({
                title: col,
                type: "Текст",
                primaryKey: false,
                comment: ""
            }));

            const queryResultTable = {
                name: internalQueryName,
                schema: schema,
                data: dataRows
            };

            const existingIndex = queries.results.findIndex(t => t.name === internalQueryName);
            if (existingIndex !== -1) {
                queries.results[existingIndex] = queryResultTable;
                const dataMenu = document.getElementById("data-menu");
                const existingItem = Array.from(dataMenu.children).find(item => item.textContent === menuDisplayName);
                if (existingItem) existingItem.remove();
            } else {
                queries.results.push(queryResultTable);
            }
            
            if (isAggregateQuery) {
                    Message("Запит виконано успішно. Отримано сукупний результат.");
            } else {
                    Message(`Запит виконано успішно.\nЗнайдено ${dataRows.length} відповідних записів`);                   
            }
            addTableToMenu(menuDisplayName);           
            
            closeSqlModal();
            closeQueryModal();
            closeOwnSqlModal() 
            editData(menuDisplayName);
        } else {
            Message("Запит виконано, але результат порожній.");
            closeSqlModal();
        }
        updateQuickAccessPanel(
                  getCurrentTableNames(),
                  getCurrentQueryNames(),
                  getCurrentReportNames(),
                  getCurrentFormNames()
                );  
    } catch (e) {
        Message(`Помилка виконання запиту: ${e.message}`);
    }
    

}

    

    // Functions for managing saved queries
    function showSavedQueriesDialog() {
        const listEl = document.getElementById("savedQueriesList");
        listEl.innerHTML = "";
        selectedQueryName = null;

        queries.definitions.forEach(query => {
            const li = document.createElement("li");
            li.textContent = query.name;
            li.style.padding = "8px";
            li.style.cursor = "pointer";
            li.dataset.queryName = query.name; // Store the query name in a data attribute

            li.addEventListener("click", () => {
                [...listEl.children].forEach(el => el.style.background = "");
                li.style.background = "#d0e0ff";
                selectedQueryName = li.dataset.queryName;
            });
            listEl.appendChild(li);
        });
        document.getElementById("savedQueriesModal").style.display = "flex";
    }

    function closeSavedQueriesDialog() {
        document.getElementById("savedQueriesModal").style.display = "none";
        selectedQueryName = null;
    }

    
    function editSelectedQuery() {
        if (!selectedQueryName) {
            Message("Будь ласка, оберіть запит для редагування.");
            return;
        }
    
        const queryToEdit = queries.definitions.find(q => q.name === selectedQueryName);
        console.log("Edit query=",selectedQueryName, queryToEdit )
        if (queryToEdit) {
            if (queryToEdit.config === null && queryToEdit.joins === null) {
                // Власний SQL-запит
                editOwnQuery(queryToEdit);
            } else {
                populateQueryModal(queryToEdit);
                // Згенерований конструктором запит
            }
            closeSavedQueriesDialog();
        } else {
            Message("Вибраний запит не знайдено.");
        }
    }
    
    
    function executeSelectedQuery() {
        if (!selectedQueryName) {
            Message("Будь ласка, оберіть запит для виконання.");
            return;
        }
    
        const queryDef = queries.definitions.find(q => q.name === selectedQueryName);
        if (!queryDef) {
            Message("Вибраний запит не знайдено.");
            return;
        }
    
        document.getElementById("queryName").value = queryDef.name;
        document.getElementById("generatedSql").innerText = queryDef.sql;
        closeSavedQueriesDialog();
        executeSqlQuery();
    }

function populateQueryModal(queryDefinition) {
    document.getElementById("queryName").value = queryDefinition.name;
    const queryBody = document.getElementById("queryBody");
    queryBody.innerHTML = ""; // Очистити рядки полів
    document.getElementById("joinBody").querySelector("tbody").innerHTML = ""; // Очистити зв’язки
    toggleStructureButtonVisibility(true);
    resetNonReadonlyRelations(); 
    // Відновлення рядків полів
    queryDefinition.config.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><select class="query-table-select" onchange="populateFieldDropdown(this)"></select></td>
            <td><select class="query-field-select"></select></td>
            <td><input type="checkbox" checked class="query-visible-checkbox"></td>
            <td>
                <select class="query-sort-select">
                    <option value="">Невпорядковано</option>
                    <option value="ASC">За зростанням</option>
                    <option value="DESC">За спаданням</option>
                </select>
            </td>
            <td>
                <div style="display: flex; gap: 4px; align-items: center;">
                <select class="query-operator-select" style="width: 60px;">
                    <option title="рівне" value="==">==</option>
                    <option title="менше" value="<">&lt;</option>
                    <option title="менше або рівне" value="<=">&lt;=</option>
                    <option title="більше" value=">">&gt;</option>
                    <option title="більше або рівне" value=">=">&gt;=</option>
                    <option title="не рівне" value="!=">!=</option>
                    <option title="схоже на шаблон" value="LIKE">LIKE</option>
                    <option title="входить до переліку" value="IN">IN</option>
                    <option title="не входить до переліку" value="NOT IN">NOT IN</option>
                    <option title="входить до проміжку" value="BETWEEN">BETWEEN</option>
                    <option title="не входить до проміжку" value="NOT BETWEEN">NOT BETWEEN</option>
                </select>
                    <input type="text" class="query-criteria-input" style="flex: 1;">
                </div>
            </td>
            <td>
                <select class="query-field-role" title="Тип участі у запиті" onchange="toggleAliasInput(this)">
                    <option value="select">----</option>                    
                    <option title="КІЛЬКІСТЬ" value="count">COUNT</option>
                    <option title="СУМА" value="sum">SUM</option>
                    <option title="СЕРЕДНЄ" value="avg">AVG</option>
                    <option title="МІНІМАЛЬНЕ" value="min">MIN</option>
                    <option title="МАКСИМАЛЬНЕ" value="max">MAX</option>
                </select>
                <input type="text" class="query-alias-input" placeholder="Псевдонім" style="margin-top:4px; display:none; width:100%;">
            </td>
            <td><select class="group-field-select"></select></td>
            <td><button onclick="deleteQueryRow(this)">❌</button></td>
        `;
        queryBody.appendChild(row);

        // Заповнити випадаючі списки
        populateTableDropdownsForRow(row);
        row.querySelector(".query-table-select").value = item.tableName;
        populateFieldDropdown(row.querySelector(".query-table-select"));
        row.querySelector(".query-field-select").value = item.fieldName;
        row.querySelector(".group-field-select").value = item.groupName;
        row.querySelector(".query-visible-checkbox").checked = item.isVisible;
        row.querySelector(".query-sort-select").value = item.sortBy;

        const operatorSelect = row.querySelector(".query-operator-select");
        const criteriaInput = row.querySelector(".query-criteria-input");

        // Встановлюємо оператор і критерій

        operatorSelect.value = item.operator;
        criteriaInput.value = item.criteria;

        // Встановлюємо роль поля (важливо!)
        const roleSelect = row.querySelector(".query-field-role");
        roleSelect.value = item.fieldRole || "select";     
        
        // Встановлюємо псевдонім, якщо він був
        const aliasInput = row.querySelector(".query-alias-input");
        if (item.alias) {
            aliasInput.value = item.alias;
        }

        // Оновлюємо видимість інпуту псевдоніма
        toggleAliasInput(roleSelect);
        
        
    });

    // Відновлення JOIN-зв’язків
    if (queryDefinition.joins && queryDefinition.joins.length > 0) {
        const joinTable = document.getElementById("joinBody");
        const tbody = joinTable.querySelector("tbody");
        joinTable.style.display = "table";

        queryDefinition.joins.forEach(join => {
            const match = join.condition.match(/"([^"]+)"\."([^"]+)" = "([^"]+)"\."([^"]+)"/);
            if (!match) return;

            const [, tableA, fieldA, tableB, fieldB] = match;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><select class="join-table-a" onchange="populateJoinFields(this, true)"></select></td>
                <td><select class="join-field-a"></select></td>
                <td><select class="join-table-b" onchange="populateJoinFields(this, false)"></select></td>
                <td><select class="join-field-b"></select></td>
                <td><button onclick="this.closest('tr').remove()">❌</button></td>
            `;
            tbody.appendChild(row);

            const tableSelectA = row.querySelector(".join-table-a");
            const tableSelectB = row.querySelector(".join-table-b");
            const fieldSelectA = row.querySelector(".join-field-a");
            const fieldSelectB = row.querySelector(".join-field-b");

            [tableSelectA, tableSelectB].forEach(select => {
                select.innerHTML = "<option value=''>Виберіть таблицю</option>";
                database.tables.forEach(t => {
                    const opt = document.createElement("option");
                    opt.value = t.name;
                    opt.textContent = t.name;
                    select.appendChild(opt);
                });
            });

            tableSelectA.value = tableA;
            tableSelectB.value = tableB;

            populateJoinFields(tableSelectA, true);
            populateJoinFields(tableSelectB, false);

            fieldSelectA.value = fieldA;
            fieldSelectB.value = fieldB;
        });
    }

    // Відновлення базової таблиці (FROM)
    const fromTableSelect = document.getElementById("fromTable");
    if (fromTableSelect) {
        // Спочатку очистити і заповнити варіанти
        fromTableSelect.innerHTML = "<option value=''>Виберіть таблицю</option>";
        database.tables.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.name;
            opt.textContent = t.name;
            fromTableSelect.appendChild(opt);
        });
    
        // Встановити значення, якщо воно є
        fromTableSelect.value = queryDefinition.baseTable || "";
    }
    document.getElementById("queryModal").style.display = "flex";
}



    function deleteSelectedQuery() {
        if (!selectedQueryName) {
            Message("Будь ласка, оберіть запит для видалення.");
            return;
        }
        const queryIndex = queries.definitions.findIndex(q => q.name === selectedQueryName);
        if (queryIndex !== -1) {
            const deletedQueryName = queries.definitions[queryIndex].name;
            queries.definitions.splice(queryIndex, 1); // Remove from definitions
            saveDatabase(); // Save updated definitions

            // Also remove any corresponding query results from `queries.results` and from the `data-menu`
            const menuDisplayName = `*запит "${deletedQueryName}"`; // Construct the display name for the result
            const resultIndex = queries.results.findIndex(r => r.name === `запит "${deletedQueryname}"`); // Find the result by its internal name
            if (resultIndex !== -1) {
                queries.results.splice(resultIndex, 1); // Remove from results
            }

            const dataMenu = document.getElementById("data-menu");
            const existingMenuItem = Array.from(dataMenu.children).find(item => item.textContent === menuDisplayName);
            if (existingMenuItem) {
                existingMenuItem.remove(); // Remove from menu
            }

            Message(`Запит "${deletedQueryName}" видалено.`);
            showSavedQueriesDialog(); // Refresh the list
        } else {
            Message("Вибраний запит не знайдено.");
        }
    }
    // --------------------

    function addJoinRow() {
        const joinTable = document.getElementById("joinBody");
        const tbody = joinTable.querySelector("tbody");

        joinTable.style.display = "table"; // Показує таблицю, якщо прихована

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><select class="join-table-a" onchange="populateJoinFields(this, true)"></select></td>
            <td><select class="join-field-a"></select></td>
            <td><select class="join-table-b" onchange="populateJoinFields(this, false)"></select></td>
            <td><select class="join-field-b"></select></td>
            <td><button onclick="this.closest('tr').remove()">❌</button></td>
        `;
        tbody.appendChild(row);

        const selects = row.querySelectorAll("select");
        selects.forEach(select => {
            if (select.classList.contains("join-table-a") || select.classList.contains("join-table-b")) {
                select.innerHTML = "<option value=''>Виберіть таблицю</option>";
                database.tables.forEach(t => {
                    const opt = document.createElement("option");
                    opt.value = t.name;
                    opt.textContent = t.name;
                    select.appendChild(opt);
                });
            }
        });
    }


    function populateJoinFields(tableSelect, isLeft) {
        const row = tableSelect.closest("tr");
        const fieldSelect = isLeft ? row.querySelector(".join-field-a") : row.querySelector(".join-field-b");
        fieldSelect.innerHTML = "";

        const table = database.tables.find(t => t.name === tableSelect.value);
        if (table) {
            table.schema.forEach(field => {
                const opt = document.createElement("option");
                opt.value = field.title;
                opt.textContent = field.title;
                fieldSelect.appendChild(opt);
            });
        }
    }
    //

    function openRelationFromQuery() {
        const joinRows = document.querySelectorAll("#joinBody tbody tr");
        database.relations = [];

        joinRows.forEach(row => {
            const tableA = row.querySelector(".join-table-a")?.value;
            const fieldA = row.querySelector(".join-field-a")?.value;
            const tableB = row.querySelector(".join-table-b")?.value;
            const fieldB = row.querySelector(".join-field-b")?.value;

            if (tableA && fieldA && tableB && fieldB) {
                database.relations.push({
                    fromTable: tableA,
                    fromField: fieldA,
                    toTable: tableB,
                    toField: fieldB
                });
            }
        });

        //saveDatabase();
        openRelationDesigner(() => {
            // callback після закриття конструктора — синхронізуємо з JOIN
            loadRelationsToJoinTable();
        });
    }




    // Functions for managing saved tables
    function showSavedTablesDialog() {
        const listEl = document.getElementById("savedTablesList");
        listEl.innerHTML = "";
        selectedTableNameForEdit = null; // Reset selection

        database.tables.forEach(table => {
            const li = document.createElement("li");
            li.textContent = table.name;
            li.style.padding = "8px";
            li.style.cursor = "pointer";
            li.dataset.tableName = table.name; // Store the table name in a data attribute

            li.addEventListener("click", () => {
                [...listEl.children].forEach(el => el.style.background = "");
                li.style.background = "#d0e0ff";
                selectedTableNameForEdit = li.dataset.tableName;
            });
            listEl.appendChild(li);
        });
        document.getElementById("savedTablesModal").style.display = "flex";
    }

    function closeSavedTablesDialog() {
        document.getElementById("savedTablesModal").style.display = "none";
        selectedTableNameForEdit = null;
    }

    function openSelectedTable() {
        if (!selectedTableNameForEdit) {
            Message("Будь ласка, оберіть таблицю для відкриття.");
            return;
        }
        editData(selectedTableNameForEdit); // Use existing editData function
        closeSavedTablesDialog();
    }

    function confirmDeleteTable() {
        if (!selectedTableNameForEdit) {
            Message("Будь ласка, оберіть таблицю для видалення.");
            return;
        }
        selectedTableNameForDelete = selectedTableNameForEdit; // Store for confirmation
        document.getElementById("deleteTableConfirmText").innerHTML =
            `Ви дійсно хочете видалити таблицю <b>"${selectedTableNameForDelete}"</b>?`;
        document.getElementById("deleteTableConfirmModal").style.display = "flex";
    }

    function doDeleteTable() {
        if (selectedTableNameForDelete) {
            try {
                db.run(`DROP TABLE IF EXISTS "${selectedTableNameForDelete}"`);
                // Remove from in-memory database.tables array
                database.tables = database.tables.filter(t => t.name !== selectedTableNameForDelete);
                saveDatabase(); // Persist changes to localStorage

                // Remove from "Дані" menu
                const dataMenu = document.getElementById("data-menu");
                const menuItemToRemove = Array.from(dataMenu.children).find(item => item.textContent === selectedTableNameForDelete);
                if (menuItemToRemove) {
                    menuItemToRemove.remove();
                }

                Message(`Таблицю "${selectedTableNameForDelete}" видалено.`);
                closeDeleteTableConfirmModal();
                showSavedTablesDialog(); // Refresh the list in the dialog
            } catch (e) {
                Message(`Помилка видалення таблиці: ${e.message}`);
            }
        }
    }

    function closeDeleteTableConfirmModal() {
        document.getElementById("deleteTableConfirmModal").style.display = "none";
        selectedTableNameForDelete = null;
    }



let isGridVisible = false; // Track grid visibility


function populateFieldPanelTableSelect() {
    fieldPanelTableSelect.innerHTML = "<option value=''>Виберіть таблицю або запит</option>";
    database.tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.name;
        option.textContent = table.name;
        fieldPanelTableSelect.appendChild(option);
    });
    queries.results.forEach(query => {
        const option = document.createElement("option");
        option.value = `*${query.name}`;
        option.textContent = `*${query.name}`;
        fieldPanelTableSelect.appendChild(option);
    });
}


let startX, startY, startWidth, startHeight;




function cancelFieldSelection() {
    document.getElementById("fieldSelectionModal").style.display = "none";
}

function closeReportCreatorModal() {
    document.getElementById("reportCreatorModal").style.display = "none";
    document.getElementById("reportCanvas").classList.remove('grid-visible');
    isGridVisible = false;
}

let activeElement = null;
let isDragging = false;
let isResizing = false;
let resizeHandle = null;
let initialX, initialY;
let initialLeft, initialTop, initialWidth, initialHeight;

    // --- спільна функція для форм і звітів ---
    
function initFieldPanelListeners(tableSelect, fieldSelect, fieldClass) {
        tableSelect.addEventListener("change", () => {
            const selectedTableName = tableSelect.value;
            const selectedTable =
                database.tables.find(t => t.name === selectedTableName) ||
                queries.results.find(q => `*${q.name}` === selectedTableName);
    
            fieldSelect.innerHTML = "<option value=''>Виберіть поле</option>";
            if (selectedTable) {
                selectedTable.schema.forEach(field => {
                    const option = document.createElement("option");
                    option.value = field.title;
                    option.textContent = field.title;
                    fieldSelect.appendChild(option);
                });
            }
            if (activeElement && activeElement.classList.contains(fieldClass)) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                const currentField = activeElement.dataset.fieldName || "";
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = selectedTableName ? `${selectedTableName}.${currentField}` : "Поле даних";
                }
                activeElement.dataset.tableName = selectedTableName;
            }
        });
    
        fieldSelect.addEventListener("change", () => {
            const selectedTableName = tableSelect.value;
            const selectedFieldName = fieldSelect.value;
            if (activeElement && activeElement.classList.contains(fieldClass) && selectedTableName && selectedFieldName) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = `${selectedTableName}.${selectedFieldName}`;
                }
                activeElement.dataset.tableName = selectedTableName;
                activeElement.dataset.fieldName = selectedFieldName;
            } else if (activeElement && activeElement.classList.contains(fieldClass)) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = tableSelect.value ? `${tableSelect.value}.` : "Поле даних";
                }
                delete activeElement.dataset.fieldName;
            }
        });
    }
    

document.addEventListener('DOMContentLoaded', () => {
    //  обробники 
    initFieldPanelListeners(fieldPanelTableSelect, fieldPanelFieldSelect, "report-field");
    // --- Налаштування тексту ---
    document.getElementById("fontFamilySelect").addEventListener("change", (e) => {
        if (activeElement && isTextElement(activeElement)) activeElement.style.fontFamily = e.target.value;
    });
    document.getElementById("fontSizeInput").addEventListener("input", (e) => {
        if (activeElement && isTextElement(activeElement)) activeElement.style.fontSize = `${e.target.value}px`;
    });
    document.getElementById("fontColorInput").addEventListener("input", (e) => {
        if (activeElement && isTextElement(activeElement)) activeElement.style.color = e.target.value;
    });
    document.getElementById("fontWeightToggle").addEventListener("change", (e) => {
        if (activeElement && isTextElement(activeElement)) activeElement.style.fontWeight = e.target.checked ? 'bold' : 'normal';
    });
    document.getElementById("fontStyleToggle").addEventListener("change", (e) => {
        if (activeElement && isTextElement(activeElement)) activeElement.style.fontStyle = e.target.checked ? 'italic' : 'normal';
    });
    document.getElementById("textDecorationUnderline").addEventListener("change", (e) => {
        if (activeElement && isTextElement(activeElement)) updateTextDecoration();
    });
    document.getElementById("textDecorationStrikethrough").addEventListener("change", (e) => {
        if (activeElement && isTextElement(activeElement)) updateTextDecoration();
    });
});

function populateFieldSelectionPanel() {
    console.log("constructorMode=",constructorMode)
    const fieldPanelTableSelect = document.getElementById("fieldPanelTableSelect");
    fieldPanelTableSelect.innerHTML = "<option value=''>Виберіть таблицю</option>";
    database.tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.name;
        option.textContent = table.name;
        fieldPanelTableSelect.appendChild(option);
    });
    if (constructorMode === "report") {
        queries.results.forEach(query => {
            const option = document.createElement("option");
            option.value = `*${query.name}`;
            option.textContent = `*${query.name}`;
            fieldPanelTableSelect.appendChild(option);
        });
    }
    if (activeElement && activeElement.dataset.tableName) {
        fieldPanelTableSelect.value = activeElement.dataset.tableName;
        const event = new Event('change');
        fieldPanelTableSelect.dispatchEvent(event);
    } else {
        fieldPanelTableSelect.value = "";
    }
    if (activeElement && activeElement.dataset.fieldName) {
        document.getElementById("fieldPanelFieldSelect").value = activeElement.dataset.fieldName;
    } else {
        document.getElementById("fieldPanelFieldSelect").value = "";
    }
}




    function openTextOptions() {
        if (!activeElement || !isTextElement(activeElement)) {
            Message("Будь ласка, оберіть елемент 'Напис' або 'Поле' для налаштування тексту.");
            return;
        }


        // Populate modal with current activeElement styles
        const fontFamilySelect = document.getElementById("fontFamilySelect");
        const fontSizeInput = document.getElementById("fontSizeInput");
        const fontColorInput = document.getElementById("fontColorInput");
        const fontWeightToggle = document.getElementById("fontWeightToggle");
        const fontStyleToggle = document.getElementById("fontStyleToggle");
        const textDecorationUnderline = document.getElementById("textDecorationUnderline");
        const textDecorationStrikethrough = document.getElementById("textDecorationStrikethrough");

        fontFamilySelect.value = activeElement.style.fontFamily || 'Arial';
        fontSizeInput.value = parseInt(activeElement.style.fontSize) || 16;
        fontColorInput.value = activeElement.style.color || '#000000';
        fontWeightToggle.checked = activeElement.style.fontWeight === 'bold';
        fontStyleToggle.checked = activeElement.style.fontStyle === 'italic';

        const textDecoration = activeElement.style.textDecoration;
        textDecorationUnderline.checked = textDecoration.includes('underline');
        textDecorationStrikethrough.checked = textDecoration.includes('line-through');


        document.getElementById("textOptionsModal").style.display = "flex";
    }

    function closeTextOptionsModal() {
        document.getElementById("textOptionsModal").style.display = "none";
    }

    function updateTextDecoration() {
        const textDecorationUnderline = document.getElementById("textDecorationUnderline");
        const textDecorationStrikethrough = document.getElementById("textDecorationStrikethrough");

        let decorations = [];
        if (textDecorationUnderline.checked) {
            decorations.push('underline');
        }
        if (textDecorationStrikethrough.checked) {
            decorations.push('line-through');
        }
        if (activeElement) {
            activeElement.style.textDecoration = decorations.join(' ');
        }
    }

    function saveReport() {
        const reportName = document.getElementById("reportNameInput").value.trim();
        const reportCanvas = document.getElementById("reportCanvas");

        const elements = [...reportCanvas.querySelectorAll('.report-element')].map(el => {
            const type = el.classList.contains("report-label") ? "label" : "field";

            return {
                type,
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                height: el.offsetHeight,
                fontFamily: el.style.fontFamily || "Arial",
                fontSize: el.style.fontSize || "16px",
                fontWeight: el.style.fontWeight || "normal",
                fontStyle: el.style.fontStyle || "normal",
                textDecoration: el.style.textDecoration || "",
                color: el.style.color || "#000000",
                text: el.innerText || "",
                tableName: el.dataset.tableName || null,
                fieldName: el.dataset.fieldName || null
            };
        });

        const reportObject = {
            name: reportName,
            elements
        };

        // Зберігаємо у пам’яті
        const index = database.reports.findIndex(r => r.name === reportName);
        if (index !== -1) {
            database.reports[index] = reportObject;
        } else {
            database.reports.push(reportObject);
        }

        saveDatabase();
        Message(`Звіт "${reportName}" збережено.`);
    }



    function isTextElement(el) {
        return el.classList.contains("report-label") || el.classList.contains("report-field") || el.classList.contains("form-label") || el.classList.contains("form-field");
    }

    function addPx(value) {
        if (typeof value === "number") return value + "px";
        if (typeof value === "string" && !value.endsWith("px") && /^\d+$/.test(value)) {
            return value + "px";
        }
        return value;
    }


    function previewReport(report = null) {
        const previewModal = document.getElementById("reportPreviewModal");
        const previewCanvas = document.getElementById("reportPreviewCanvas");
        const titleEl = document.getElementById("reportPreviewTitle");

        previewCanvas.innerHTML = "";

        let elements = [];
        let reportName = "";

        if (report) {
            reportName = report.name || "Звіт без назви";
            elements = report.elements || [];
        } else {
            reportName = document.getElementById("reportNameInput").value.trim();
            const canvasElements = document.querySelectorAll("#reportCanvas .report-element");
            elements = Array.from(canvasElements).map(el => {
                const type = el.classList.contains("report-label") ? "label" : "field";
                return {
                    type: type,
                    text: el.innerText.trim(),
                    left: el.style.left,
                    top: el.style.top,
                    width: el.style.width,
                    height: el.style.height,
                    fontFamily: el.style.fontFamily || 'Arial',
                    fontSize: el.style.fontSize || '16px',
                    fontWeight: el.style.fontWeight || 'normal',
                    fontStyle: el.style.fontStyle || 'normal',
                    textDecoration: el.style.textDecoration || '',
                    color: el.style.color || '#000000',
                    tableName: el.dataset.tableName || '',
                    fieldName: el.dataset.fieldName || ''
                };
            });
        }

        titleEl.innerText = reportName;

        elements.forEach(el => {
            const clone = document.createElement("div");

            Object.assign(clone.style, {
                position: "absolute",
                left: addPx(el.left),
                top: addPx(el.top),
                width: addPx(el.width),
                height: addPx(el.height),
                fontFamily: el.fontFamily,
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle,
                textDecoration: el.textDecoration,
                color: el.color,
                padding: "5px",
                boxSizing: "border-box",
                overflow: "auto",
                whiteSpace: "pre-line",
                border: "none",
                backgroundColor: "transparent"
            });

            if (el.type === "label") {
                clone.innerText = el.text;
            }

        if (el.type === "field") {
            const tableName = el.tableName;
            const fieldName = el.fieldName;
        
            let lines = [];
            const table = findTableOrQuery(tableName);
        
            if (table && table.data.length > 0) {
                const colIndex = table.schema.findIndex(col => col.title === fieldName);
                if (colIndex !== -1) {
                    const colSchema = table.schema[colIndex];
        
                    // 🆕 Перевіряємо, чи є зовнішній ключ і subst=true
                    if (colSchema.foreignKey && colSchema.subst && colSchema.refTable && colSchema.refField) {
                        const refTable = findTableOrQuery(colSchema.refTable);
                        if (refTable && refTable.data.length > 0) {
                            // Знаходимо індекс поля в таблиці-референсі з тією ж назвою, що і початкове поле
                            const refColIndex = refTable.schema.findIndex(c => c.title === fieldName);
                            console.log("refColIndex=",refColIndex,fieldName)
                            if (refColIndex !== -1) {
                                const refFieldIndex = refTable.schema.findIndex(c => c.title === colSchema.refField);
                            
                                lines = table.data.map(row => {
                                    const fkValue = row[colIndex];
                                    // шукаємо рядок у таблиці-референсі, де значення refField співпадає з fkValue
                                    const refRow = refTable.data.find(r => String(r[refFieldIndex]) === String(fkValue));
                                    return refRow ? refRow[refColIndex] : "";
                                });
                            } else {
                                lines = ["Поле-референс не знайдено"];
                            }
                        } else {
                            lines = ["Таблиця-референс порожня або не знайдена"];
                        }
                    } else {
                        // Звичайне поле без subst
                        lines = table.data.map(row => row[colIndex] ?? "");
                    }
        
                } else {
                    lines = ["Поле не знайдено"];
                }
            } else {
                lines = ["Таблиця порожня або не знайдена"];
            }
        
            clone.innerText = lines.join("\n");
        }
        
        

            previewCanvas.appendChild(clone);
        });

        previewModal.style.display = "flex";
    }

    function findTableOrQuery(tableName) {
        return (
            database.tables.find(t => t.name === tableName) ||
            queries.results.find(q => `*${q.name}` === tableName)
        );
    }




    function closeReportPreview() {
        document.getElementById("reportPreviewModal").style.display = "none";
    }

    let relationLines = [];
    let selectedFieldEl = null;
    let onRelationModalClose = null;

    function openRelationDesigner(callback) {
        const modal = document.getElementById("relationModal");
        const canvas = document.getElementById("relationCanvas");
        canvas.innerHTML = ""; // очистити
        console.log(">database.relations=",database.relations)
        relationLines = [];
        selectedFieldEl = null;
        onRelationModalClose = callback;
        // Видалити попередні системні зв’язки перед оновленням
        database.relations = database.relations.filter(rel => !rel.readonly);
        database.tables.forEach(table => {
            table.schema.forEach(field => {
                if (field.foreignKey && field.refTable && field.refField) {
                    database.relations.push({
                        fromTable: table.name,
                        fromField: field.title,
                        toTable: field.refTable,
                        toField: field.refField,
                        readonly: true, // 👈 Це можна використовувати для стилізації як "червоний і незмінний"
                    });
                }
            });
        });
        console.log(">>database.relations=",database.relations)
    
        const offsetX = 50, offsetY = 50;
    
        // Створити блоки таблиць
        database.tables.forEach((table, i) => {
            const block = document.createElement("div");
            block.className = "relation-table";
            block.style.position = "absolute";
            block.style.left = `${offsetX + (i % 3) * 300}px`;
            block.style.top = `${offsetY + Math.floor(i / 3) * 250}px`;
            block.style.width = "180px";
            block.style.opacity = "0.65";
            block.style.background = "#fff";
            block.style.border = "1px solid #aaa";
            block.style.boxShadow = "2px 2px 4px rgba(0,0,0,0.1)";
            block.style.cursor = "move";
            block.style.padding = "0px";
            block.dataset.tableName = table.name;
    
            const pkField = table.schema.find(col => col.primaryKey)?.title;
    
            const title = document.createElement("div");
            title.innerText = table.name;
            title.style.fontWeight = "bold";
            title.style.padding = "4px 8px";
            title.style.backgroundColor = "#eee";
            title.style.borderBottom = "1px solid #ccc";
            title.style.borderTopLeftRadius = "4px";
            title.style.borderTopRightRadius = "4px";
            block.appendChild(title);
    
            const tableList = document.createElement("table");
            table.schema.forEach(field => {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.innerText = field.title + (field.title === pkField ? " 🔑 " : "");
    
                cell.style.padding = "0px";
                cell.style.border = "1px solid #ddd";
                cell.style.cursor = "pointer";
                cell.style.width = "178px";
                cell.dataset.table = table.name;
                cell.dataset.field = field.title;
    
                cell.addEventListener("click", () => handleFieldClick(cell));
                cell.addEventListener("dblclick", () => {
                    const index = relationLines.findIndex(rel =>
                        (rel.from === cell || rel.to === cell)
                    );
                    if (index !== -1) {
                        const rel = relationLines[index];
                        if (rel.readonly) {
                            Message("Цей зв’язок є системним і не може бути видалений.");
                            return;
                        }
                        relationLines.splice(index, 1);
    
                        // 💾 Оновити database.relations лише для ручних зв’язків
                        const userRelations = relationLines
                            .filter(line => !line.readonly)
                            .map(line => ({
                                fromTable: line.from.dataset.table,
                                fromField: line.from.dataset.field,
                                toTable: line.to.dataset.table,
                                toField: line.to.dataset.field,
                                color: line.color,
                                readonly: false
                            }));
                        
                        const readonlyRelations = database.relations.filter(rel => rel.readonly);
                        database.relations = [...readonlyRelations, ...userRelations];
    
                        saveDatabase();
                        redrawLines();
                    }
                });
    
                row.appendChild(cell);
                tableList.appendChild(row);
            });
    
            block.appendChild(tableList);
            makeDraggable(block);
            canvas.appendChild(block);
        });
    
        // 🔁 Відтворити збережені зв’язки
        relationLines = [];
        console.log(">>>database.relations=",database.relations)
        if (Array.isArray(database.relations)) {
            database.relations.forEach(rel => {
                const fromCell = [...canvas.querySelectorAll("td")]
                    .find(td => td.dataset.table === rel.fromTable && td.dataset.field === rel.fromField);
                const toCell = [...canvas.querySelectorAll("td")]
                    .find(td => td.dataset.table === rel.toTable && td.dataset.field === rel.toField);
    
                if (fromCell && toCell) {
                    relationLines.push({
                        from: fromCell,
                        to: toCell,
                        readonly: rel.readonly || false,
                        color: rel.color || "red"
                    });
                }
            });
        }
    
        requestAnimationFrame(redrawLines); // 🖍 малюємо лінії після DOM
    
        modal.style.display = "flex";
    
        modal.querySelector(".close-btn").onclick = () => {
            modal.style.display = "none";
            if (typeof callback === "function") callback();
        };
    }
    

    function handleFieldClick(cell) {
        if (cell.classList.contains("selected")) {
            cell.classList.remove("selected");
            selectedFieldEl = null;
            redrawLines();
            return;
        }

        if (!selectedFieldEl) {
            cell.classList.add("selected");
            selectedFieldEl = cell;
        } else {
            if (selectedFieldEl === cell) return;

            // Додати зв'язок
            relationLines.push({
                from: selectedFieldEl,
                to: cell
            });

            // 🔄 Зберігаємо у database.relations
            database.relations = relationLines.map(line => ({
                fromTable: line.from.dataset.table,
                fromField: line.from.dataset.field,
                toTable: line.to.dataset.table,
                toField: line.to.dataset.field
            }));
            saveDatabase();


            selectedFieldEl.classList.remove("selected");
            cell.classList.remove("selected");
            selectedFieldEl = null;

            redrawLines();
        }
    }


    function makeDraggable(el) {
        const canvas = document.getElementById("relationCanvas");
        let isDragging = false;
        let offsetX = 0,
            offsetY = 0;

        el.addEventListener("mousedown", e => {
            if (e.target.tagName === "TD") return; // не чіпаємо кліки по полях
            isDragging = true;

            const rect = el.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();

            // Зсув між курсором і верхнім лівим кутом прямокутника
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Додаємо глобальні обробники
            const onMouseMove = (e) => {
                if (!isDragging) return;

                const x = e.clientX - canvasRect.left - offsetX;
                const y = e.clientY - canvasRect.top - offsetY;

                el.style.left = `${x}px`;
                el.style.top = `${y}px`;

                redrawLines();
            };

            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }



function redrawLines() {
    const canvas = document.getElementById("relationCanvas");

    const existingSvg = document.getElementById("relation-svg");
    if (existingSvg) existingSvg.remove();

    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("id", "relation-svg");
    svgEl.style.position = "absolute";
    svgEl.style.top = 0;
    svgEl.style.left = 0;
    svgEl.style.width = "100%";
    svgEl.style.height = "100%";
    svgEl.style.zIndex = "0";
    svgEl.style.pointerEvents = "none";

    // <defs> для стрілок
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    // Червона стрілка (FOREIGN KEY)
    const markerRed = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    markerRed.setAttribute("id", "arrowRed");
    markerRed.setAttribute("markerWidth", "6");
    markerRed.setAttribute("markerHeight", "6");
    markerRed.setAttribute("refX", "6");
    markerRed.setAttribute("refY", "3");
    markerRed.setAttribute("orient", "auto");
    markerRed.setAttribute("markerUnits", "strokeWidth");

    const pathRed = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRed.setAttribute("d", "M 0 0 L 6 3 L 0 6 z");
    pathRed.setAttribute("fill", "red");
    markerRed.appendChild(pathRed);
    defs.appendChild(markerRed);

    // Блакитна стрілка (користувацькі)
    const markerBlue = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    markerBlue.setAttribute("id", "arrowBlue");
    markerBlue.setAttribute("markerWidth", "6");
    markerBlue.setAttribute("markerHeight", "6");
    markerBlue.setAttribute("refX", "6");
    markerBlue.setAttribute("refY", "3");
    markerBlue.setAttribute("orient", "auto");
    markerBlue.setAttribute("markerUnits", "strokeWidth");

    const pathBlue = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathBlue.setAttribute("d", "M 0 0 L 6 3 L 0 6 z");
    pathBlue.setAttribute("fill", "deepskyblue");
    markerBlue.appendChild(pathBlue);
    defs.appendChild(markerBlue);

    svgEl.appendChild(defs);

    const canvasRect = canvas.getBoundingClientRect();

    relationLines.forEach(line => {
        const fromRect = line.from.getBoundingClientRect();
        const toRect = line.to.getBoundingClientRect();

        const fromCenterX = fromRect.left + fromRect.width / 2 - canvasRect.left;
        const toCenterX = toRect.left + toRect.width / 2 - canvasRect.left;

        // базові координати
        let fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
        let toY = toRect.top + toRect.height / 2 - canvasRect.top;

        // якщо користувацький зв'язок → зміщуємо вниз
        if (!line.readonly) {
            fromY += 3;
            toY += 3;
        }

        const H_OFFSET = 12;
        let fromX, toX, fromDir, toDir;

        if (fromCenterX < toCenterX) {
            fromX = fromRect.left + fromRect.width - canvasRect.left;
            toX = toRect.left - canvasRect.left;
            fromDir = +1;
            toDir = -1;
        } else {
            fromX = fromRect.left - canvasRect.left;
            toX = toRect.left + toRect.width - canvasRect.left;
            fromDir = -1;
            toDir = +1;
        }

        const p1 = { x: fromX, y: fromY };
        const p2 = { x: fromX + fromDir * H_OFFSET, y: fromY };
        const p4 = { x: toX + toDir * H_OFFSET, y: toY };
        const p5 = { x: toX, y: toY };

        const points = [p1, p2, p4, p5].map(p => `${p.x},${p.y}`).join(" ");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        path.setAttribute("points", points);
        path.setAttribute("fill", "none");

        if (line.readonly) {
            path.setAttribute("stroke", "red");
            path.setAttribute("marker-end", "url(#arrowRed)");
        } else {
            path.setAttribute("stroke", "deepskyblue");
            path.setAttribute("marker-end", "url(#arrowBlue)");
        }

        path.setAttribute("stroke-width", "2");
        svgEl.appendChild(path);
    });

    canvas.insertBefore(svgEl, canvas.firstChild);
}






    function closeRelationModal() {
        document.getElementById("relationModal").style.display = "none";
        if (typeof onRelationModalClose === "function") {
            onRelationModalClose();
            onRelationModalClose = null; // очистити
        }
    }


    function saveRelations() {
        // Зберігаємо лише користувацькі зв’язки (не readonly)
        const userRelations = relationLines
            .filter(line => !line.readonly)
            .map(line => ({
                fromTable: line.from.dataset.table,
                fromField: line.from.dataset.field,
                toTable: line.to.dataset.table,
                toField: line.to.dataset.field,
                color: line.color || "black",
                readonly: false
            }));
    
        // Залишаємо системні зв’язки (readonly) без змін
        const systemRelations = database.relations.filter(rel => rel.readonly);
    
        // Оновлюємо всі зв’язки
        database.relations = [...systemRelations, ...userRelations];
    
        saveDatabase();
        Message("Зв’язки збережено.");
        closeRelationModal();
    }
    

    function loadRelationsToJoinTable() {
        const joinTable = document.getElementById("joinBody");
        const tbody = joinTable.querySelector("tbody");
        tbody.innerHTML = "";
        joinTable.style.display = "table";
    
        // Беремо лише не-readonly зв’язки
        database.relations
            .filter(rel => !rel.readonly)
            .forEach(rel => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><select class="join-table-a" onchange="populateJoinFields(this, true)"></select></td>
                    <td><select class="join-field-a"></select></td>
                    <td><select class="join-table-b" onchange="populateJoinFields(this, false)"></select></td>
                    <td><select class="join-field-b"></select></td>
                    <td><button onclick="this.closest('tr').remove()">✕</button></td>
                `;
                tbody.appendChild(row);
    
                const tableSelectA = row.querySelector(".join-table-a");
                const tableSelectB = row.querySelector(".join-table-b");
                const fieldSelectA = row.querySelector(".join-field-a");
                const fieldSelectB = row.querySelector(".join-field-b");
    
                [tableSelectA, tableSelectB].forEach(select => {
                    select.innerHTML = "<option value=''>Виберіть таблицю</option>";
                    database.tables.forEach(t => {
                        const opt = document.createElement("option");
                        opt.value = t.name;
                        opt.textContent = t.name;
                        select.appendChild(opt);
                    });
                });
    
                tableSelectA.value = rel.fromTable;
                tableSelectB.value = rel.toTable;
    
                populateJoinFields(tableSelectA, true);
                populateJoinFields(tableSelectB, false);
    
                fieldSelectA.value = rel.fromField;
                fieldSelectB.value = rel.toField;
            });
    }
    


async function exportDTA() {
    const zip = new JSZip();

    // SQLite база
    const dbData = db.export();
    zip.file("database.sqlite", dbData);

    // Запити
    const queriesJson = JSON.stringify(queries.definitions, null, 2);
    zip.file("queries.json", queriesJson);

    // Звіти
    const reportsJson = JSON.stringify(database.reports, null, 2);
    zip.file("reports.json", reportsJson);

    // Результати запитів
    zip.file("query-results.json", JSON.stringify(queries.results || []));

    // Схеми (без data)
    const schemas = database.tables.map(t => ({
        name: t.name,
        schema: t.schema
    }));
    zip.file("schemas.json", JSON.stringify(schemas, null, 2));

    // 🆕 Форми
    const formsJson = JSON.stringify(database.forms || [], null, 2);
    zip.file("forms.json", formsJson);

    // Архів
    const content = await zip.generateAsync({ type: "blob" });
    const filename = (database.fileName || "my_database") + ".dta";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = filename;
    a.click();
}


async function importDTA(file) {
    const zip = await JSZip.loadAsync(file);
    const dbFile = await zip.file("database.sqlite").async("uint8array");
    db = new SQL.Database(dbFile);
    database.fileName = file.name.split('.')[0];

    // Запити
    const queriesText = await zip.file("queries.json").async("string");
    queries.definitions = JSON.parse(queriesText);

    // Звіти
    const reportsText = await zip.file("reports.json").async("string");
    database.reports = JSON.parse(reportsText);

    // Результати запитів
    if (zip.file("query-results.json")) {
        const resultsText = await zip.file("query-results.json").async("string");
        queries.results = JSON.parse(resultsText);
    } else {
        queries.results = [];
    }

    // Схеми
    let savedSchemas = [];
    if (zip.file("schemas.json")) {
        const schemasText = await zip.file("schemas.json").async("string");
        savedSchemas = JSON.parse(schemasText);
    }

    // 🆕 Форми
    if (zip.file("forms.json")) {
        console.log("Знайдено форми")
        const formsText = await zip.file("forms.json").async("string");
        database.forms = JSON.parse(formsText);
        // Валідація форм після імпорту
        database.forms = database.forms.map(form => ({
            ...form,
            elements: form.elements.map(el => {
                if (el.type === "field") {
                    return {
                        ...el,
                        tableName: el.tableName || "",
                        fieldName: el.fieldName || ""
                    };
                }
                return el;
            })
        }));
     console.log(database.forms)   
    } else {
        database.forms = [];
    }

    // Відновлення таблиць через sqlite_master + savedSchemas
    database.tables = [];
    const res = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table';");
    if (res.length > 0) {
        const tableRows = res[0].values;
        tableRows.forEach(([name, sql]) => {
            if (name.startsWith("sqlite_")) return;

            const savedSchema = savedSchemas.find(s => s.name === name)?.schema;

            let schema = [];
            if (savedSchema) {
                schema = savedSchema;
            } else {
                const match = sql.match(/\((.+)\)/s);
                if (match) {
                    const schemaText = match[1];
                    const schemaParts = schemaText.split(",").map(s => s.trim());
                    schema = schemaParts.map(part => {
                        const [titleRaw, typeRaw, ...rest] = part.split(/\s+/);
                        return {
                            title: titleRaw.replace(/"/g, ''),
                            type: typeRaw === "INTEGER" ? "Ціле число" :
                                  typeRaw === "REAL"    ? "Дробове число" :
                                  typeRaw === "BOOLEAN" ? "Так/Ні" :
                                  typeRaw === "TEXT"    ? "Текст" : typeRaw,
                            primaryKey: rest.includes("PRIMARY") || rest.includes("PRIMARY KEY"),
                            comment: rest.includes("PRIMARY") ? "Первинний ключ" : ""
                        };
                    });
                }
            }

            const selectRes = db.exec(`SELECT * FROM "${name}"`);
            const dataRows = selectRes.length ? selectRes[0].values : [];

            database.tables.push({
                name,
                schema,
                data: dataRows
            });
        });
    }

    // Оновлення меню
    document.getElementById("data-menu").innerHTML = "";
    database.tables.forEach(t => addTableToMenu(t.name));
    queries.results.forEach(q => addTableToMenu(`*${q.name}`));

    saveDatabase();
    Message("Базу даних успішно імпортовано з .dta файлу.");
    updateMainTitle();
    updateQuickAccessPanel(
        getCurrentTableNames(),
        getCurrentQueryNames(),
        getCurrentReportNames(),
        getCurrentFormNames()
    );
}
/**
 * Конструктор звітів та форм
 **/
function createConstructor() {
        document.getElementById(constructorMode+"CreatorModal").style.display = "flex";
        let newMode = "Нова_форма";
        if (constructorMode==="report") newMode = "Новий_звіт";
        document.getElementById(constructorMode+"NameInput").value = newMode;
        screenCanvas = document.getElementById(constructorMode+"Canvas");
        screenCanvas.innerHTML = "";
        document.getElementById("fieldSelectionModal").style.display = "none";        
        document.getElementById(constructorMode+"Canvas").classList.remove('grid-visible');
        isGridVisible = false;

}
/**
 * Конструктор звітів
 **/
function createReport() {
        constructorMode = "report";
        createConstructor();
    }
/**
 * Редагування обраного звіту
 **/
function editSelectedReport() {
        if (!selectedReportName) {
            Message("Будь ласка, оберіть звіт для редагування.");
            return;
        }
        document.getElementById("reportListModal").style.display = "none";
        const report = database.reports.find(r => r.name === selectedReportName);
        if (!report) {
            Message("Звіт не знайдено.");
            return;
        }
        constructorMode = "report";
        screenCanvas = document.getElementById(constructorMode+"Canvas");
        renderCanvas(report);

        document.getElementById("reportCreatorModal").style.display = "flex";

        Message(`Звіт "${report.name}" завантажено для редагування.`);
}    
/** **/
let currentFormRecordIndex = 0; // For form viewer navigation
let selectedFormName = null; // To keep track of the selected form in the saved forms dialog 
let selectedFormField = null;   
/**
 * Конструктор форм
 **/
function createForm() {
        constructorMode = "form";
        createConstructor();
    }

function saveForm() {
        const formName = document.getElementById("formNameInput").value.trim();
        const formCanvas = document.getElementById("formCanvas");

        const elements = [...formCanvas.querySelectorAll('.form-element')].map(el => {
            const type = el.classList.contains("form-label") ? "label" : "field";

            return {
                type,
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                height: el.offsetHeight,
                fontFamily: el.style.fontFamily || "Arial",
                fontSize: el.style.fontSize || "16px",
                fontWeight: el.style.fontWeight || "normal",
                fontStyle: el.style.fontStyle || "normal",
                textDecoration: el.style.textDecoration || "",
                color: el.style.color || "#000000",
                text: el.innerText?.trim() || "",
                tableName: el.dataset.tableName || null,
                fieldName: el.dataset.fieldName || null
            };
        });

        const formObject = {
            name: formName,
            elements
        };

        const index = database.forms.findIndex(f => f.name === formName);
        if (index !== -1) database.forms[index] = formObject;
        else database.forms.push(formObject);

        saveDatabase();
        Message(`Форму "${formName}" збережено.`);
}

/**
 * Редагування обраної форми
 **/
function editSelectedForm() {
        if (!selectedFormName) {
            Message("Виберіть форму для редагування.");
            return;
        }

        const form = database.forms.find(f => f.name === selectedFormName);
        if (!form) {
            Message("Форму не знайдено.");
            return;
        }

        document.getElementById("savedFormsModal").style.display = "none";
        constructorMode = "form";
        screenCanvas = document.getElementById(constructorMode+"Canvas");
        renderCanvas(form);

        document.getElementById("formCreatorModal").style.display = "flex";

        Message(`Форма "${form.name}" завантажена для редагування.`);
}

function closeFormModal() {
        document.getElementById("formCreatorModal").style.display = "none";
        // Ensure the field selection panel is hidden when closing the modal
        document.getElementById("fieldSelectionModal").style.display = "none";        
        // Ensure grid is off when closing report creator
        document.getElementById("formCanvas").classList.remove('grid-visible');
        isGridVisible = false;

}
function showSavedFormsDialog() {
        const listEl = document.getElementById("savedFormsList");
        if (!listEl) {
            console.error("Елемент #savedFormsList не знайдено. Переконайтеся, що modal для збережених форм існує.");
            Message("Модальне вікно для збережених форм не знайдено.");
            return;
        }
        listEl.innerHTML = "";
        selectedFormName = null;

        if (database && database.forms) {
            database.forms.forEach(form => {
                const li = document.createElement("li");
                li.textContent = form.name;
                li.style.padding = "8px";
                li.style.cursor = "pointer";
                li.dataset.formName = form.name;

                li.addEventListener("click", () => {
                    [...listEl.children].forEach(el => el.style.background = "");
                    li.style.background = "#d0e0ff";
                    selectedFormName = li.dataset.formName;
                });
                listEl.appendChild(li);
            });
        }
        document.getElementById("savedFormsModal").style.display = "flex";
    }

function deleteSelectedFormElement() {
      if (!activeElement || !activeElement.classList.contains("form-element")) {
        Message("Виберіть елемент форми для видалення.");
        return;
      }
    
      activeElement.remove();
      activeElement = null;
 }    

function closeSavedFormsDialog() {
        const savedFormsModal = document.getElementById("savedFormsModal");
        if (savedFormsModal) {
            savedFormsModal.style.display = "none";
        }
        selectedFormName = null;
}

function previewSelecteForm() {
        if (!selectedFormName) {
            Message("Виберіть форму для перегляду.");
            return;
        }

        const form = database.forms.find(f => f.name === selectedFormName);
        if (!form) {
            Message("Форму не знайдено.");
            return;
        }

        document.getElementById("savedFormsModal").style.display = "none";
        previewForm(form, true);
}

function deleteSelectedForm() {
        if (!selectedFormName) {
            Message("Будь ласка, виберіть форму для видалення.");
            return;
        }
        const formIndex = database.forms.findIndex(q => q.name === selectedFormName);
        if (formIndex !== -1) {
            const deletedFormName = database.forms[formIndex].name;
            database.forms.splice(formIndex, 1); // Remove 
            saveDatabase(); // Save updated

            const dataMenu = document.getElementById("data-menu");

            Message(`Форму "${deletedFormName}" видалено.`);
            showSavedFormsDialog(); // Refresh the list
        } else {
            Message("Вибрану форму  не знайдено.");
        }
}
//*******************************************************************************


/**
* Додає виділення при кліку і показує маркери
**/
function initializeCanvasElement(element) {
    element.addEventListener("click", (e) => {
        e.stopPropagation();
        
        document.querySelectorAll("."+constructorMode+"-element.selected").forEach(el => {
            el.classList.remove("selected");
            el.querySelectorAll(".resize-handle").forEach(h => h.remove());
        });

        element.classList.add("selected");
        addResizeHandles(element);
    });
}
/**
 * Відтворення об'єктів збережених звіту/форми
 **/
function renderCanvas(stored) {
        const cm = constructorMode;
        const cNameInput = document.getElementById(cm+"NameInput");
        const cCanvas = document.getElementById(cm+"Canvas"); 
        cNameInput.value = stored.name;
        cCanvas.innerHTML = "";

        stored.elements.forEach(el => {
            const div = document.createElement("div");
            div.classList.add(cm+"-element");
            div.style.position = "absolute";
            div.style.left = el.left + "px";
            div.style.top = el.top + "px";
            div.style.width = el.width + "px";
            div.style.height = el.height + "px";
            div.style.cursor = "grab";
            div.style.boxSizing = "border-box";
            div.style.fontFamily = el.fontFamily;
            div.style.fontSize = el.fontSize;
            div.style.fontWeight = el.fontWeight;
            div.style.fontStyle = el.fontStyle;
            div.style.textDecoration = el.textDecoration;
            div.style.color = el.color;
            
            if (el.type === "field") {
                div.classList.add(cm+"-field");
                div.dataset.fieldName = el.fieldName;
                div.dataset.tableName = el.tableName;
                div.style.border = "1px dashed green";
                div.style.backgroundColor = "rgba(144, 238, 144, 0.3)";

                const fieldText = document.createElement("div");
                fieldText.classList.add("field-text");
                fieldText.innerText = `${el.tableName}.${el.fieldName}`;
                div.appendChild(fieldText);
            } else if (el.type === "label") {
                div.classList.add(cm+"-label");
                div.contentEditable = "false";
                div.innerText = el.text;
                div.style.border = "1px dashed gray";
                div.style.backgroundColor = "rgba(240,240,240,0.8)";
            }

            cCanvas.appendChild(div);
            initializeCanvasElement(div);
            makeDraggableAndResizable(div); 
        }); 
    }

// Додаємо напис
function addScreenLabel() {    
    const labelElement = document.createElement("div");
    labelElement.className = constructorMode+"-element "+constructorMode+"-label";
    Object.assign(labelElement.style, {
        position: "absolute",
        left: "50px",
        top: "50px",
        width: "150px",
        height: "40px",
        border: "1px solid blue",
        backgroundColor: "rgba(173, 216, 230, 0.3)",
        padding: "5px",
        cursor: "grab",
        boxSizing: "border-box"
    });

    labelElement.contentEditable = "false";
    labelElement.innerText = "Новий напис";
    screenCanvas.appendChild(labelElement);
    // Додаємо resize-маркери
    addResizeHandles(labelElement);    
    makeDraggableAndResizable(labelElement);
}
// Додаємо поле
function addScreenField() {   
    const fieldElement = document.createElement("div");
    fieldElement.className = constructorMode+"-element "+constructorMode+"-field";
    Object.assign(fieldElement.style, {
        position: "absolute",
        left: "200px",
        top: "100px",
        width: "200px",
        height: "40px",
        border: "1px dashed green",
        backgroundColor: "rgba(144,238,144,0.3)",
        padding: "5px",
        cursor: "grab",
        boxSizing: "border-box"
    });

    const fieldText = document.createElement("div");
    fieldText.className = "field-text";
    fieldText.innerText = "Поле";
    fieldElement.appendChild(fieldText);

    // Додаємо resize-маркери
    addResizeHandles(fieldElement);

    // Обробник вибору поля
    fieldElement.addEventListener("click", () => {
        selectedFormField = fieldElement;
    });
    screenCanvas.appendChild(fieldElement);
    makeDraggableAndResizable(fieldElement);
}

let currentEditElement = null;
function editLabel(el) {
    currentEditElement = el;
    const modal = document.getElementById("editLabelModal");
    const input = document.getElementById("editInput");

    input.value = el.innerText;
    modal.style.display = "flex";

    input.focus();
}

// Кнопка Ok
function textOk() {
    if (currentEditElement) {
        currentEditElement.innerText = document.getElementById("editInput").value;
    }
        // Додаємо resize-маркери окремо
    ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(pos => {
        const handle = document.createElement("div");
        handle.className = `resize-handle ${pos}`;
        currentEditElement.appendChild(handle);
    });
    document.getElementById("editLabelModal").style.display = "none";
    currentEditElement = null;
    dragging = false;
   
};

// Кнопка Скасувати
function textCancel() {
    document.getElementById("editLabelModal").style.display = "none";
    currentEditElement = null;
    dragging = false;    
};

/**
 * Зробити об'єкт перетягуваним, зі зміною розмірів та можливістю редагування вмісту
 **/

function makeDraggableAndResizable(el) {
    const parent = el.parentElement;

    // === DRAG ===
    let offsetX, offsetY, dragging = false;
    el.addEventListener("mousedown", startDrag);
    el.addEventListener("touchstart", startDrag);
    
    function startDrag(e) {
        console.log('Click!!!');
    
        // Якщо клік по resize-handle — перетягування заборонено
        if (e.target.classList.contains("resize-handle")) return;
    
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = el.getBoundingClientRect();
    
        // Перевіряємо, чи елемент це "Напис" (report-label або form-label)
        if (el.classList.contains("report-label") || el.classList.contains("form-label")) {
            const dXY = 10; // відступи від краю
            const inRect = (
                clientX > rect.left + dXY &&
                clientX < rect.right - dXY &&
                clientY > rect.top + dXY &&
                clientY < rect.bottom - dXY
            );
            if (inRect) {
                console.log("EDIT");
                editLabel(el);
                stopDrag();
                dragging = false;
                return;
            }
        }
    
        // --- Якщо не "редагування", запускаємо перетягування ---
        dragging = true;
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
    
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("touchmove", onDrag, { passive: false });
        document.addEventListener("touchend", stopDrag);
    }
    

    function onDrag(e) {
        if (!dragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const parentRect = parent.getBoundingClientRect();
        let left = clientX - parentRect.left - offsetX;
        let top = clientY - parentRect.top - offsetY;
        el.style.left = Math.max(0, left) + "px";
        el.style.top = Math.max(0, top) + "px";
    }

    function stopDrag() {
        dragging = false;
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("touchmove", onDrag);
        document.removeEventListener("touchend", stopDrag);
    }

    // === RESIZE ===
    const handles = el.querySelectorAll(".resize-handle");
    handles.forEach(handle => {
        handle.addEventListener("mousedown", startResize);
        handle.addEventListener("touchstart", startResize);

        function startResize(e) {
            e.stopPropagation(); // щоб не рухався сам елемент
            const rect = el.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const startX = e.touches ? e.touches[0].clientX : e.clientX;
            const startY = e.touches ? e.touches[0].clientY : e.clientY;
            const startW = rect.width;
            const startH = rect.height;
            const startL = rect.left - parentRect.left;
            const startT = rect.top - parentRect.top;
            const pos = handle.classList[1];
            console.log("pos=",pos)

            function onResize(ev) {
                const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
                const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
                let dx = clientX - startX;
                let dy = clientY - startY;

                if (pos.includes("right")) {
                    el.style.width = Math.max(40, startW + dx) + "px";
                }
                if (pos.includes("bottom")) {
                    el.style.height = Math.max(20, startH + dy) + "px";
                }
                if (pos.includes("left")) {
                    el.style.width = Math.max(40, startW - dx) + "px";
                    el.style.left = Math.max(0, startL + dx) + "px";
                }
                if (pos.includes("top")) {
                    el.style.height = Math.max(20, startH - dy) + "px";
                    el.style.top = Math.max(0, startT + dy) + "px";
                }
            }

            function stopResize() {
                document.removeEventListener("mousemove", onResize);
                document.removeEventListener("mouseup", stopResize);
                document.removeEventListener("touchmove", onResize);
                document.removeEventListener("touchend", stopResize);
            }

            document.addEventListener("mousemove", onResize);
            document.addEventListener("mouseup", stopResize);
            document.addEventListener("touchmove", onResize);
            document.addEventListener("touchend", stopResize);
        }
    });
}
   


function addScreenGrid() {    
    if (screenGridVisible) {
            screenCanvas.style.backgroundImage = "none";
        } else {
            screenCanvas.style.backgroundImage =
                "repeating-linear-gradient(0deg, #ccc 0, #ccc 1px, transparent 1px, transparent 19px), " +
                "repeating-linear-gradient(90deg, #ccc 0, #ccc 1px, transparent 1px, transparent 19px)";
            screenCanvas.style.backgroundSize = "20px 20px";
        }
        screenGridVisible = !screenGridVisible;
}    
function closeFormPreview() {
    document.getElementById("formPreviewModal").style.display = "none";
    currentPreviewForm = null; 
}

function previewForm(form = null, resetIndex = false) {
    // Зберігаємо поточну форму для навігації
    if (form) {
        currentPreviewForm = form;
    }
    const previewModal = document.getElementById("formPreviewModal");
    const previewCanvas = document.getElementById("formPreviewCanvas");

    previewCanvas.innerHTML = "";

    let formName;
    let elements = [];

    if (form) {
        // Виклик для збереженої форми
        formName = form.name;
        elements = form.elements.map(el => {
            return { 
                type: el.type,
                left: el.left + "px",
                top: el.top + "px",
                width: el.width + "px",
                height: el.height + "px",
                fontFamily: el.fontFamily || 'Arial',
                fontSize: el.fontSize || '16px',
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || '',
                color: el.color || '#000',
                tableName: el.tableName,
                fieldName: el.fieldName,
                text: el.text || ""
            };
        });
    } else {
        // Виклик для поточної форми з конструктора
        formName = document.getElementById("formNameInput").value.trim();
        elements = [...document.querySelectorAll("#formCanvas .form-label, #formCanvas .form-field")].map(el => {
            return {
                type: el.classList.contains("form-field") ? "field" : "label",
                left: el.style.left,
                top: el.style.top,
                width: el.style.width,
                height: el.style.height,
                fontFamily: el.style.fontFamily || 'Arial',
                fontSize: el.style.fontSize || '16px',
                fontWeight: el.style.fontWeight || 'normal',
                fontStyle: el.style.fontStyle || 'normal',
                textDecoration: el.style.textDecoration || '',
                color: el.style.color || '#000',
                tableName: el.dataset.tableName,
                fieldName: el.dataset.fieldName,
                text: el.innerText?.trim() || ""
            };
        });
    }

    // ----------------- Логіка з currentFormRecordIndex -----------------
    const formTables = elements.map(el => el.tableName).filter(Boolean);
    const maxRecordIndex = formTables.length > 0
        ? Math.max(...formTables.map(name => {
            const t = database.tables.find(tbl => tbl.name === name);
            return t ? t.data.length : 0;
        })) - 1
        : 0;
    console.log("maxRecordIndex =",maxRecordIndex )
    if (resetIndex) currentFormRecordIndex = 0;
    currentFormRecordIndex = Math.min(currentFormRecordIndex, maxRecordIndex);

    const isLastRecord = currentFormRecordIndex === maxRecordIndex;
    document.getElementById("formPreviewTitle").innerText =
        `${formName} — запис #${currentFormRecordIndex + 1}${isLastRecord ? " (останній запис)" : ""}`;

    // ----------------- Рендеринг -----------------
    elements.forEach(el => {
        if (el.type === "field") {
            const table = database.tables.find(t => t.name === el.tableName);

            const fieldContainer = document.createElement("div");
            fieldContainer.className = "form-field";
            Object.assign(fieldContainer.style, {
                position: "absolute",
                left: el.left,
                top: el.top,
                width: el.width,
                height: el.height,
                fontFamily: el.fontFamily,
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle,
                textDecoration: el.textDecoration,
                color: el.color,
                borderStyle: "inset",
                borderWidth: "4px",
                borderColor: "#888",
                overflow: "hidden",
                whiteSpace: "nowrap",
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                paddingLeft: "5px"
            });

            fieldContainer.dataset.tableName = el.tableName || "";
            fieldContainer.dataset.fieldName = el.fieldName || "";

            let cellValue = "";
            let colSchema = null;
            let colIndex = -1;

            if (!table) {
                cellValue = "Таблиця не знайдена";
            } else if (table.data.length === 0) {
                cellValue = "Таблиця порожня";
            } else {
                colIndex = table.schema.findIndex(c => c.title === el.fieldName);
                if (colIndex !== -1) {
                    colSchema = table.schema[colIndex];
                    const record = table.data[Math.min(currentFormRecordIndex, table.data.length - 1)];
                    cellValue = record?.[colIndex] ?? "";
                    fieldContainer.dataset.colIndex = String(colIndex);
                } else {
                    cellValue = "Поле не знайдено";
                }
            }

            if (colSchema) {
                const control = advDataInput(
                    fieldContainer,
                    cellValue,
                    colSchema,
                    table?.data?.[Math.min(currentFormRecordIndex, (table?.data.length ?? 1) - 1)],
                    colIndex,
                    false
                );

                if (control) {
                    control.dataset.tableName = fieldContainer.dataset.tableName;
                    control.dataset.fieldName = fieldContainer.dataset.fieldName;
                    control.dataset.colIndex  = fieldContainer.dataset.colIndex;
                }
            } else {
                fieldContainer.textContent = cellValue;
            }

            previewCanvas.appendChild(fieldContainer);

        } else if (el.type === "label") {
            const label = document.createElement("div");
            Object.assign(label.style, {
                position: "absolute",
                left: el.left,
                top: el.top,
                width: el.width,
                height: el.height,
                fontFamily: el.fontFamily,
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle,
                textDecoration: el.textDecoration,
                color: el.color,
                padding: "5px",
                border: "none",
                background: "transparent",
                overflow: "hidden",
                whiteSpace: "nowrap"
            });
            label.innerText = el.text || "";

            previewCanvas.appendChild(label);
        }
    });

    previewModal.style.display = "flex";
}



function saveFormChanges() {
    const fields = [...document.querySelectorAll("#formPreviewCanvas .form-field")];

    if (fields.length === 0) {
        Message("Немає полів для збереження.");
        return;
    }

    // Має бути одна таблиця
    const tableNames = [...new Set(fields.map(f => f.dataset.tableName).filter(Boolean))];
    if (tableNames.length !== 1) {
        Message("Поля форми належать різним таблицям або відсутня назва таблиці.");
        return;
    }

    const tableName = tableNames[0];
    const table = database.tables.find(t => t.name === tableName);
    if (!table) {
        Message("Таблицю не знайдено.");
        return;
    }

    // Допоміжні
    const hasValue = v => !(v === undefined || v === null || (typeof v === "string" && v.trim() === ""));
    const toNullIfEmpty = v => (hasValue(v) ? v : null);
    const normType = t => String(t || "").trim().toLowerCase();

    // Збір і нормалізація значень з форми (тільки для полів, що на формі)
    const values = {};
    let allEmpty = true;

    fields.forEach(f => {
        const colIndex =
            Number(f.dataset.colIndex ??
                  (f.querySelector("[data-col-index]")?.dataset.colIndex));
        const colSchema = table.schema[colIndex];
        if (!colSchema) return;

        const control = f.querySelector("input, select, textarea, [contenteditable='true']");
        let value;

        if (!control) {
            value = f.textContent ?? "";
        } else if (control.tagName === "SELECT") {
            value = control.value === "empty" ? null : control.value;
        } else if (control.hasAttribute("contenteditable")) {
            value = control.innerText;
        } else {
            value = control.value;
        }
        console.log("value 0=",value)
        const t = normType(colSchema.type);
        console.log("normType=",t)
        if (t === "ціле число" || t === "integer") {
            value = hasValue(value) ? parseInt(value, 10) : null;
            if (Number.isNaN(value)) value = null;
        } else if (t === "дробове число" || t === "real" || t === "float" || t === "numeric") {
            value = hasValue(value) ? Number(value) : null;
            if (Number.isNaN(value)) value = null;
        } else if (t === "так/ні" || t === "boolean") {
            const s = String(value).toLowerCase();
            value = (s === "1" || s === "true" || s === "yes" || s === "on") ? 1 : 0;
        } else if (t === "дата" || t === "date") {
            value = (hasValue(value) && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) ? String(value) : null;
        } else {
            // рядки не повинні перетворюватися на null, якщо це не порожні рядки
            if (typeof value === "string") value = value.trim();
            value = toNullIfEmpty(value);
        }
        
        console.log("value 1=",value)
        const fieldName = f.dataset.fieldName;
        console.log("fieldName =",fieldName )
        if (!fieldName) return;

        values[fieldName] = value;
        if (value !== null && value !== "") allEmpty = false;
    });
    console.log("values=",values)
    if (allEmpty) {
        Message("Порожній запис не буде додано.");
        return;
    }

    // Первинний ключ (припускаємо один PK-стовпець)
    const pkIndex = table.schema.findIndex(col => col.primaryKey);
    if (pkIndex === -1) {
        Message("У таблиці відсутній первинний ключ. Збереження неможливе.");
        return;
    }
    const pkCol = table.schema[pkIndex];
    const pkField = pkCol.title;

    // Визначаємо чи PK авто-генерується:
    // 1) явний прапорець autoInc, або
    // 2) тип INTEGER/«ціле число» з PRIMARY KEY у SQLite (SQLite генерує rowid).
    const isIntegerPk = ["integer", "ціле число"].includes(normType(pkCol.type));
    const isAutoPk = !!pkCol.autoInc || isIntegerPk;

    const idx = currentFormRecordIndex ?? 0;
    const pkFromRow = (idx < (table.data?.length ?? 0)) ? table.data[idx]?.[pkIndex] : undefined;

    // Форсований режим: вважаємо новим записом, якщо індекс виходить за межі ТАБ0 є спеціальний прапорець
    const isNewRecordMode = !!isCreatingNewRecord || idx >= (table.data?.length ?? 0);
    
    console.log("isNewRecordMode=",isNewRecordMode,isCreatingNewRecord )
    // Рядок існує, якщо ми не у режимі нового запису і PK є
    const rowExists = !isNewRecordMode && hasValue(pkFromRow);
    let pkValueFromForm = values[pkField];
    
    
console.log("Debug info:", {
    isNewRecordMode,
    currentFormRecordIndex,
    tableDataLength: table.data?.length ?? 0,
    pkFromRow,
    rowExists
});
    // --- Гілка ДОДАВАННЯ ---
    if (!rowExists) {
        console.log("add row from Form")
        if (isAutoPk) {
            // Нехай SQLite згенерує PK — не передаємо його у INSERT
            delete values[pkField];
            pkValueFromForm = undefined;
        } else {
            // Не авто-PK: значення обов'язкове
            if (!hasValue(pkValueFromForm)) {
                Message(`Не вказано значення первинного ключа "${pkField}".`);
                return;
            }
            // Перевірка дублювання PK у пам'яті
            const dup = (table.data || []).some(r => String(r?.[pkIndex]) === String(pkValueFromForm));
            if (dup) {
                Message(`Помилка: значення ключа "${pkField}" = "${pkValueFromForm}" вже існує у таблиці.`);
                return;
            }
        }
    
        // Формуємо INSERT
        const fieldKeys = Object.keys(values);
        if (fieldKeys.length === 0) {
            db.run(`INSERT INTO "${tableName}" DEFAULT VALUES;`);
        } else {
            const placeholders = fieldKeys.map(() => "?").join(", ");
            const sql = `INSERT INTO "${tableName}" (${fieldKeys.map(f => `"${f}"`).join(", ")}) VALUES (${placeholders});`;
            const params = fieldKeys.map(f => values[f]);
            db.run(sql, params);
        }
    
        // Підтягнути згенерований PK (для авто-PK)
        if (isAutoPk) {
            const r = db.exec(`SELECT last_insert_rowid() AS id;`);
            const newId = r?.[0]?.values?.[0]?.[0] ?? null;
            values[pkField] = newId;
        }
    
        // --- Виправлене формування нового рядка для in-memory ---
        // Перезавантажити таблицю з бази
const refreshResult = db.exec(`SELECT * FROM "${tableName}";`);
if (refreshResult.length > 0) {
    table.data = refreshResult[0].values;
    currentFormRecordIndex = table.data.length - 1;
    console.log("Table refreshed from database, new length:", table.data.length);
} else {
    // Якщо таблиця порожня
    table.data = [];
    currentFormRecordIndex = -1;
}
    
        Message("Новий запис додано!");
        saveDatabase();
        return;
    }
    
    

    // --- Гілка РЕДАГУВАННЯ ---
    // Для авто-PK не дозволяємо змінювати PK вручну
    if (isAutoPk) {
        values[pkField] = pkFromRow;
    } else {
        // Якщо користувач змінив PK — перевірка дублювання
        if (hasValue(pkValueFromForm) && String(pkValueFromForm) !== String(pkFromRow)) {
            const dup = (table.data || []).some((r, i) =>
                i !== idx && String(r?.[pkIndex]) === String(pkValueFromForm)
            );
            if (dup) {
                Message(`Помилка: значення ключа "${pkField}" = "${pkValueFromForm}" вже існує у таблиці.`);
                return;
            }
        } else {
            // Якщо у формі PK не заданий — лишаємо старий
            values[pkField] = pkFromRow;
        }
    }

    // Оновлюємо лише колонки, що прийшли з форми (без PK, якщо авто-PK)
    const updateKeys = Object.keys(values).filter(k => !(isAutoPk && k === pkField));
    console.log("updateKeys=",updateKeys,values)
    if (updateKeys.length > 0) {
        const setClause = updateKeys.map(k => `"${k}" = ?`).join(", ");
        const params = updateKeys.map(k => values[k]);
        const sql = `UPDATE "${tableName}" SET ${setClause} WHERE "${pkField}" = ?;`;
        db.run(sql, [...params, pkFromRow]);
    }

    // Оновити in-memory
    const row = table.data[idx];
    const colIndexByTitle = Object.fromEntries(table.schema.map((c, i) => [c.title, i]));
    updateKeys.forEach(k => {
        const ci = colIndexByTitle[k];
        if (ci !== undefined) row[ci] = values[k];
    });
    if (!isAutoPk && hasValue(values[pkField])) {
        row[pkIndex] = values[pkField];
    }

    Message("Дані оновлено!");
    saveDatabase();
}

//
function addResizeHandles(element) {
    const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
    positions.forEach(pos => {
        const handle = document.createElement("div");
        handle.classList.add("resize-handle", pos);
        handle.style.cursor = {
            "top-left": "nwse-resize",
            "top-right": "nesw-resize",
            "bottom-left": "nesw-resize",
            "bottom-right": "nwse-resize"
        }[pos];        
        element.appendChild(handle);
    });
}

//*******************************
document.addEventListener('DOMContentLoaded', () => {
        const reportCanvas = document.getElementById("reportCanvas");
        const formCanvas   = document.getElementById("formCanvas");
        const fieldSelectionModal = document.getElementById("fieldSelectionModal");
        const fieldPanelTableSelect1 = document.getElementById("fieldPanelTableSelect");
        const fieldPanelFieldSelect1 = document.getElementById("fieldPanelFieldSelect");
        initFieldPanelListeners(fieldPanelTableSelect1, fieldPanelFieldSelect1, "form-field");
        
        formCanvas.addEventListener("mousedown", (e) => {
            const element = e.target.closest(".form-element");
            const handle = e.target.closest(".resize-handle");

            document.querySelectorAll(".form-element.selected").forEach(el => el.classList.remove("selected"));            
            fieldSelectionModal.style.display = "none";
            closeTextOptionsModal();

            if (element) {
                activeElement = element;
                activeElement.classList.add("selected");                
                const rect = activeElement.getBoundingClientRect();

                initialLeft = activeElement.offsetLeft;
                initialTop = activeElement.offsetTop;
                initialWidth = rect.width;
                initialHeight = rect.height;
                initialX = e.clientX;
                initialY = e.clientY;

                if (handle) {
                    isResizing = true;
                    resizeHandle = handle;
                    element.style.cursor = handle.style.cursor;
                } else {
                    isDragging = true;
                    element.style.cursor = "grabbing";

                    const BORDER_TOLERANCE = 10;
                    const elementRect = activeElement.getBoundingClientRect();
                    const relativeClickX = e.clientX - elementRect.left;
                    const relativeClickY = e.clientY - elementRect.top;

                    const nearLeft = relativeClickX < BORDER_TOLERANCE;
                    const nearRight = elementRect.width - relativeClickX < BORDER_TOLERANCE;
                    const nearTop = relativeClickY < BORDER_TOLERANCE;
                    const nearBottom = elementRect.height - relativeClickY < BORDER_TOLERANCE;

                    if (activeElement.classList.contains("form-label")) {
                        if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                            isDragging = false;
                            element.focus();
                        }
                    } else if (activeElement.classList.contains("form-field")) {
                        if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                            fieldSelectionModal.style.display = "flex";
                            populateFieldSelectionPanel();
                            
                            isDragging = false;
                        } else {
                            fieldSelectionModal.style.display = "none";
                        }
                    }
                }

                if (isDragging || isResizing || (activeElement.classList.contains("form-label") && !isDragging)) {
                    e.preventDefault();
                }
            } else {
                activeElement = null;
            }
        });
        
        reportCanvas.addEventListener("mousedown", (e) => {
            const element = e.target.closest(".report-element");
            const handle = e.target.closest(".resize-handle");

            document.querySelectorAll(".report-element.selected").forEach(el => el.classList.remove("selected"));            
            fieldSelectionModal.style.display = "none";
            closeTextOptionsModal();

            if (element) {
                activeElement = element;
                activeElement.classList.add("selected");
                //addResizeHandles(element); // 🔧 маркери розміру
                const rect = activeElement.getBoundingClientRect();

                initialLeft = activeElement.offsetLeft;
                initialTop = activeElement.offsetTop;
                initialWidth = rect.width;
                initialHeight = rect.height;
                initialX = e.clientX;
                initialY = e.clientY;

                if (handle) {
                    isResizing = true;
                    resizeHandle = handle;
                    element.style.cursor = handle.style.cursor;
                } else {
                    isDragging = true;
                    element.style.cursor = "grabbing";

                    const BORDER_TOLERANCE = 10;
                    const elementRect = activeElement.getBoundingClientRect();
                    const relativeClickX = e.clientX - elementRect.left;
                    const relativeClickY = e.clientY - elementRect.top;

                    const nearLeft = relativeClickX < BORDER_TOLERANCE;
                    const nearRight = elementRect.width - relativeClickX < BORDER_TOLERANCE;
                    const nearTop = relativeClickY < BORDER_TOLERANCE;
                    const nearBottom = elementRect.height - relativeClickY < BORDER_TOLERANCE;

                    if (activeElement.classList.contains("report-label")) {
                        if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                            isDragging = false;
                            element.focus();
                        }
                    } else if (activeElement.classList.contains("report-field")) {
                        if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                            fieldSelectionModal.style.display = "flex";
                            populateFieldSelectionPanel();
                            
                            isDragging = false;
                        } else {
                            fieldSelectionModal.style.display = "none";
                        }
                    }
                }

                if (isDragging || isResizing || (activeElement.classList.contains("report-label") && !isDragging)) {
                    e.preventDefault();
                }
            } else {
                activeElement = null;
            }
        });


        formCanvas.addEventListener("mousemove", (e) => {
            if (!activeElement) return;
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;

            if (isDragging) {
                activeElement.style.left = `${initialLeft + dx}px`;
                activeElement.style.top = `${initialTop + dy}px`;
            } else if (isResizing) {
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                let newLeft = initialLeft;
                let newTop = initialTop;

                if (resizeHandle.classList.contains("bottom-right")) {
                    newWidth = Math.max(50, initialWidth + dx);
                    newHeight = Math.max(30, initialHeight + dy);
                } else if (resizeHandle.classList.contains("bottom-left")) {
                    newWidth = Math.max(50, initialWidth - dx);
                    newHeight = Math.max(30, initialHeight + dy);
                    newLeft = initialLeft + dx;
                } else if (resizeHandle.classList.contains("top-right")) {
                    newWidth = Math.max(50, initialWidth + dx);
                    newHeight = Math.max(30, initialHeight - dy);
                    newTop = initialTop + dy;
                } else if (resizeHandle.classList.contains("top-left")) {
                    newWidth = Math.max(50, initialWidth - dx);
                    newHeight = Math.max(30, initialHeight - dy);
                    newLeft = initialLeft + dx;
                    newTop = initialTop + dy;
                }

                activeElement.style.width = `${newWidth}px`;
                activeElement.style.height = `${newHeight}px`;
                activeElement.style.left = `${newLeft}px`;
                activeElement.style.top = `${newTop}px`;
            }
        });

        formCanvas.addEventListener("mouseup", () => {
            if (activeElement) activeElement.style.cursor = "grab";
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        });
        
       reportCanvas.addEventListener("mousemove", (e) => {
            if (!activeElement) return;
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;

            if (isDragging) {
                activeElement.style.left = `${initialLeft + dx}px`;
                activeElement.style.top = `${initialTop + dy}px`;
            } else if (isResizing) {
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                let newLeft = initialLeft;
                let newTop = initialTop;

                if (resizeHandle.classList.contains("bottom-right")) {
                    newWidth = Math.max(50, initialWidth + dx);
                    newHeight = Math.max(30, initialHeight + dy);
                } else if (resizeHandle.classList.contains("bottom-left")) {
                    newWidth = Math.max(50, initialWidth - dx);
                    newHeight = Math.max(30, initialHeight + dy);
                    newLeft = initialLeft + dx;
                } else if (resizeHandle.classList.contains("top-right")) {
                    newWidth = Math.max(50, initialWidth + dx);
                    newHeight = Math.max(30, initialHeight - dy);
                    newTop = initialTop + dy;
                } else if (resizeHandle.classList.contains("top-left")) {
                    newWidth = Math.max(50, initialWidth - dx);
                    newHeight = Math.max(30, initialHeight - dy);
                    newLeft = initialLeft + dx;
                    newTop = initialTop + dy;
                }

                activeElement.style.width = `${newWidth}px`;
                activeElement.style.height = `${newHeight}px`;
                activeElement.style.left = `${newLeft}px`;
                activeElement.style.top = `${newTop}px`;
            }
        });

        reportCanvas.addEventListener("mouseup", () => {
            if (activeElement) activeElement.style.cursor = "grab";
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        });

    });
    

    document.addEventListener("click", (e) => {
        let el = e.target.closest(".report-element");
        if (el) {
            activeElement = el;
            return;
        }
        el = e.target.closest(".form-element");
        if (el) {
            activeElement = el;
            return;
        }
    });

    function goToFirstRecord() {
        currentFormRecordIndex = 0;
        reviewForm(currentPreviewForm, false);
    }

    function goToPreviousRecord() {
        currentFormRecordIndex = Math.max(0, currentFormRecordIndex - 1);
        previewForm(currentPreviewForm, false);
    }

    function goToNextRecord() {
        // визначити макс. довжину таблиць
        const tables = database.tables;
        const maxLength = Math.max(...tables.map(t => t.data.length));
        currentFormRecordIndex = Math.min(maxLength - 1, currentFormRecordIndex + 1);
        previewForm(currentPreviewForm, false);
    }

    function goToLastRecord() {
        const tables = database.tables;
        const maxLength = Math.max(...tables.map(t => t.data.length));
        currentFormRecordIndex = maxLength - 1;
        previewForm(currentPreviewForm, false);
    }

function createNewRecord() {
    // зібрати всі таблиці, що використовуються у формі
    const elements = [...document.querySelectorAll("#formCanvas .form-field")];
    const usedTables = [...new Set(elements.map(el => el.dataset.tableName).filter(Boolean))];
    // входимо у режим створення нового запису:
    isCreatingNewRecord = true;
   
    usedTables.forEach(tableName => {
        const table = database.tables.find(t => t.name === tableName);
        if (!table) return;

        // створюємо порожній рядок
        const newRow = table.schema.map(() => "");

        // автопідстановка для PK з autoInc
        table.schema.forEach((col, idx) => {
            if (col && col.primaryKey && col.autoInc) {
                // зібрати всі валідні числові значення по цій колонці
                const nums = (table.data || [])
                    .map(r => r?.[idx])
                    .filter(v => v !== "" && v !== null && v !== undefined)
                    .map(v => Number(v))
                    .filter(n => Number.isFinite(n));

                const maxVal = nums.length ? Math.max(...nums) : 0;
                newRow[idx] = maxVal + 1; // наступне значення
            }
        });

        // додати рядок у дані таблиці
        table.data = table.data || [];
        table.data.push(newRow);
    });

    saveDatabase();
    // перейти до останнього запису (щоб одразу побачити доданий)
    goToLastRecord();
}


    // оновлення інформації
    function updateMainTitle() {
        const titleBar = document.getElementById("mainTitle");
        if (database.fileName) {
            titleBar.textContent = "База даних: " + database.fileName;
        } else {
            titleBar.textContent = "Виберіть або створіть базу даних";
        }
    }

    // імпорт бази даних SQLite
    function importSQLiteDb(file) {
        if (!file) {
            Message("Файл не вибрано.");
            return;
        }
    
        const reader = new FileReader();
    
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            const uIntArray = new Uint8Array(arrayBuffer);
    
            try {
                clearDB();
                const importedDb = new SQL.Database(uIntArray);
                
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const fileName = nameWithoutExt;
    
                // Зберігаємо файл в localStorage
                const base64 = btoa(String.fromCharCode(...uIntArray));
                localStorage.setItem(fileName + ".db-data", base64);    
               
                db = importedDb;    
    
                const res = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table';");
                if (res.length > 0) {
                    const tableRows = res[0].values;
                    tableRows.forEach(([name]) => {
                        if (name.startsWith("sqlite_")) return;
    
                        const pragmaRes = db.exec(`PRAGMA table_info("${name}")`);
                        if (!pragmaRes.length) return;
                        
                        const columns = pragmaRes[0].values;
                        
                        // 🆕 Зчитуємо зовнішні ключі
                        const fkRes = db.exec(`PRAGMA foreign_key_list("${name}")`);
                        const foreignKeys = fkRes.length ? fkRes[0].values.map(([id, seq, refTable, fromCol, toCol]) => ({
                            fromCol, refTable, toCol
                        })) : [];
                        
                        // Формуємо схему
                        const schema = columns.map(([cid, title, type, notnull, dflt_value, pk]) => {
                           
                            const fk = foreignKeys.find(f => f.fromCol === title);
                            if (!(fk ===undefined)) {
                                console.log("FK import=", title,foreignKeys)
                                console.log("fk.refTable import=", fk.refTable)
                                console.log("fk.toCol import=", fk.toCol) }
                            return {
                                title,
                                type: type.toUpperCase() === "INTEGER" ? "Ціле число"
                                    : type.toUpperCase() === "REAL" ? "Дробове число"
                                    : type.toUpperCase().includes("TEXT") ? "Текст"
                                    : type.toUpperCase().includes("BOOL") ? "Так/Ні"
                                    : type,
                                primaryKey: pk > 0,
                                comment: pk > 0 ? "Первинний ключ" : "",
                                foreignKey: !!fk,
                                refTable: fk ? fk.refTable : null,
                                refField: fk ? fk.toCol : null
                            };
                        });
    
                        const selectRes = db.exec(`SELECT * FROM "${name}"`);
                        const dataRows = selectRes.length ? selectRes[0].values : [];
                        console.log("Schema=",schema)
                        database.tables.push({
                            name: name,
                            schema: schema,
                            data: dataRows
                        });
                    });
                }
    
                // 🆕 Додати зовнішні ключі до database.relations
                const fkTables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                if (fkTables.length > 0) {
                    fkTables[0].values.forEach(([tableName]) => {
                        const fkRes = db.exec(`PRAGMA foreign_key_list("${tableName}")`);
                        if (!fkRes.length) return;
    
                        fkRes[0].values.forEach(fk => {
                            const [, , refTable, fromCol, toCol] = fk;
    
                            // Уникаємо дублювання
                            const exists = database.relations.some(r =>
                                r.fromTable === tableName &&
                                r.fromField === fromCol &&
                                r.toTable === refTable &&
                                r.toField === toCol
                            );
    
                            if (!exists) {
                                database.relations.push({
                                    fromTable: tableName,
                                    fromField: fromCol,
                                    toTable: refTable,
                                    toField: toCol,
                                    color: "red",
                                    readonly: true
                                });
                            }
                        });
                    });
                }
                database.fileName = fileName;
                saveDatabase()
                database.tables.forEach(t => addTableToMenu(t.name));
                updateMainTitle();
                Message("Базу даних імпортовано та збережено як '" + fileName + "'.");
                updateQuickAccessPanel(
                    getCurrentTableNames(),
                    getCurrentQueryNames(),
                    getCurrentReportNames(),
                    getCurrentFormNames()
                );
            } catch (e) {
                Message("Помилка при імпорті: " + e.message);
            }
        };
    
        reader.readAsArrayBuffer(file);
    }
    
    // експорт в базу даних SQLite
    function exportSQLiteDb() {
        if (!db) {
            Message("Немає активної бази даних для експорту.");
            return;
        }

        const data = db.export();
        const blob = new Blob([data], {
            type: "application/x-sqlite3"
        });

        // Використовуємо назву з database.fileName або "my_database"
        const fileName = (database.fileName || "my_database") + ".sqlite";

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
    }
/**
 * Імпорт з CVS файлу
 **/ 
// Показати діалог вибору таблиці для імпорту
function showCsvImportDialog() {
    const select = document.getElementById("csvTargetTable");
    select.innerHTML = "";
    database.tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.name;
        option.textContent = table.name;
        select.appendChild(option);
    });
    document.getElementById("csvImportModal").style.display = "flex";
}

// Закрити модальне вікно
function closeCsvImportDialog() {
    document.getElementById("csvImportModal").style.display = "none";
}

// Відкрити вибір файлу
function proceedCsvImport() {
    closeCsvImportDialog();
    document.getElementById("csvFileInput").value = ""; // Скинути попередній файл
    document.getElementById("csvFileInput").click(); // Відкрити діалог вибору файлу
}

// Обробка вибраного CSV-файлу
// Обробка вибраного CSV-файлу
function handleCsvFile(file) {
    if (!file) {
        Message("Файл не вибрано.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const csvText = event.target.result;
        const lines = csvText.trim().split("\n");

        if (lines.length === 0) {
            Message("CSV-файл порожній.");
            return;
        }

        // Визначення роздільника: вибираємо той, що частіше зустрічається в першому рядку
        const firstLine = lines[0];
        const hasSemicolon = (firstLine.split(";").length - 1);
        const hasComma = (firstLine.split(",").length - 1);
        const delimiter = hasSemicolon > hasComma ? ";" : ",";

        // Розбиваємо всі рядки
        const rows = lines.map(line => {
            return line.split(delimiter).map(val => val.trim().replace(/^"(.*)"$/, '$1')); // видаляємо лапки, якщо є
        });

        // Перший рядок — заголовок
        const headerRow = rows[0];
        const dataRows = rows.slice(1); // решта — дані

        if (dataRows.length === 0) {
            Message("Файл не містить даних після заголовка.");
            return;
        }

        // Отримуємо цільову таблицю
        const tableName = document.getElementById("csvTargetTable").value;
        const table = database.tables.find(t => t.name === tableName);
        if (!table) {
            Message("Таблиця не знайдена.");
            return;
        }

        // Перевірка: чи збігаються назви стовпців
        const expectedHeaders = table.schema.map(col => col.title);
        if (headerRow.length !== expectedHeaders.length) {
            Message(`Кількість стовпців у заголовку (${headerRow.length}) не відповідає схемі (${expectedHeaders.length}).`);
            return;
        }

        const mismatch = expectedHeaders.some((expected, i) => headerRow[i] !== expected);
        if (mismatch) {
            Message("Назви стовпців у CSV не відповідають схемі таблиці.");
            console.log("Очікувано:", expectedHeaders);
            console.log("Отримано:", headerRow);
            return;
        }

        // Перевірка кількості стовпців у даних
        console.log("expectedHeaders,dataRows=",expectedHeaders,dataRows)
        const invalidRow = dataRows.find(row => row.length !== expectedHeaders.length);
        if (invalidRow) {
            Message(`Рядок містить неправильну кількість стовпців: ${invalidRow.length} (очікується ${expectedHeaders.length}).`);
            return;
        }

        // Перевірка типів даних
        const typeMap = {
            "Ціле число": val => /^-?\d+$/.test(val),
            "Дробове число": val => /^-?\d+(\.\d+)?$/.test(val),
            "Так/Ні": val => /^(true|false|1|0)$/i.test(val),
            "Текст": val => true,
            "Дата": val => !isNaN(Date.parse(val)) || /^\d{4}-\d{2}-\d{2}$/.test(val)
        };

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            for (let j = 0; j < expectedHeaders.length; j++) {
                const val = row[j];
                const type = table.schema[j].type;
                if (!typeMap[type](val)) {
                    Message(`Помилка типу в рядку ${i + 1}, поле "${table.schema[j].title}" (${type}): "${val}".`);
                    return;
                }
            }
        }

        // Усе гаразд — вставляємо дані
        const colNames = table.schema.map(col => `"${col.title}"`).join(", ");
        db.run("BEGIN TRANSACTION");
        try {
            dataRows.forEach(row => {
                const values = row.map(val => `'${val.replace(/'/g, "''")}'`).join(", ");
                const sql = `INSERT INTO "${table.name}" (${colNames}) VALUES (${values})`;
                db.run(sql);
            });
            db.run("COMMIT");
            
            // 🔄 ОНОВЛЕННЯ ДАНИХ У ПАМ'ЯТІ
            try {
                const res = db.exec(`SELECT * FROM "${tableName}"`);
                table.data = res.length ? res[0].values : [];
                console.log("Дані таблиці оновлено в пам'яті:", table.data.length, "записів");
            } catch (e) {
                console.warn("Не вдалося оновити дані в пам'яті:", e);
            }
            
            Message(`Імпортовано ${dataRows.length} записів у таблицю "${table.name}".`);
            saveDatabase();           
        } catch (e) {
            db.run("ROLLBACK");
            Message("Помилка при вставці даних: " + e.message);
        }
    };

    reader.readAsText(file);
}
/**
 * Перетворюємо на 8-символьний шістнадцятковий рядок 
 **/
 function toHex4Part(num) {
    // Перетворюємо на 8-символьний шістнадцятковий рядок (32 біти = 8 hex)
    const hex = num.toString(16).padStart(8, '0').toUpperCase();
    // Розбиваємо на 4 групи по 2 символи
    return `${hex.slice(0,2)}-${hex.slice(2,4)}-${hex.slice(4,6)}-${hex.slice(6,8)}`;
}

    // Перегляд відомостей про базу даних
function showDatabaseInfo() {
        if (!db || !database.fileName) {
            Message("База даних не завантажена.");
            return;
        }

        let info = `Назва файлу: ${database.fileName}.sqlite\n\n`;

        // Читаємо user_version
        let dbId = null;
        try {
            const res = db.exec("PRAGMA user_version;");
            console.log("PRAGMA user_version=",res)
            if (res.length && res[0].values.length) {
                dbId = res[0].values[0][0]; // це число
            }
        } catch (e) {
            console.error("Помилка читання user_version:", e);
        }

        if (dbId !== null && dbId > 0) {
            const hexId = toHex4Part(dbId);
            info += `Ідентифікатор: ${hexId}\n`;
        } else {
            info += `Ідентифікатор: не встановлено\n`;
        }

        info += "\n";

        if (!database.tables.length) {
            info += "База даних не містить таблиць.";
        } else {
            info += "Таблиці:\n";
            database.tables.forEach(table => {
                try {
                    const res = db.exec(`SELECT COUNT(*) AS count FROM "${table.name}"`);
                    const count = res.length ? res[0].values[0][0] : 0;
                    info += `- ${table.name}: ${count} записів\n`;
                } catch (e) {
                    info += `- ${table.name}: помилка підрахунку\n`;
                }
            });
        }

        // Об’єм бази
        try {
            const exportData = db.export();
            const sizeInBytes = exportData.length;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

            info += `\nОб’єм файлу: ${sizeInBytes} байт (${sizeInKB} KB, ${sizeInMB} MB)`;
        } catch (e) {
            info += `\nНе вдалося обчислити об’єм бази.`;
        }

        document.getElementById("dbInfoContent").innerText = info;
        document.getElementById("dbInfoModal").style.display = "flex";
    }

    function closeDbInfoModal() {
        document.getElementById("dbInfoModal").style.display = "none";
    }
    // Закрити базу даних
    function closeDatabase() {
        if (!db) {
            Message("База даних не відкрита.");
            return;
        }

        // Автоматично зберегти перед закриттям
        saveDatabase();

        // Очистити всі змінні
        db = null;
        clearDB();
        updateMainTitle(); // Змінити заголовок на "Виберіть або створіть базу даних"
        document.getElementById("import-table-link").style.display = "none";
        Message("Базу даних закрито.");       
    }

    // Вихід з програми
    function exitApplication() {
        document.getElementById("exitModal").style.display = "flex";

        setTimeout(() => {
            // Спроба закрити вкладку (не завжди працює, залежно від браузера)
            window.open('', '_self', '');
            window.close();

            // Якщо не вдалось — замість цього очистити інтерфейс
            document.body.innerHTML = "<div style='display:flex; align-items:center; justify-content:center; height:100vh; font-size:32px;'>Роботу завершено.</div>";
        }, 3000);
    }

    // Вікно перегляду створених звітів
    function showReportsList() {
        const listEl = document.getElementById("reportList");
        listEl.innerHTML = "";
        selectedReportName = null;

        database.reports.forEach((report) => {
            console.log("report=", report)
            const li = document.createElement("li");
            li.textContent = report.name;
            li.style.padding = "8px";
            li.style.cursor = "pointer";
            li.dataset.reportName = report.name; // Store the report name in a data attribute

            li.addEventListener("click", () => {
                [...listEl.children].forEach(el => el.style.background = "");
                li.style.background = "#d0e0ff";
                selectedReportName = li.dataset.reportName;
            });
            listEl.appendChild(li);
        });
        document.getElementById("reportListModal").style.display = "flex";
    }

    function closeReportList() {
        document.getElementById("reportListModal").style.display = "none";
    }

    function deleteSelectedReport() {
        if (!selectedReportName) {
            Message("Будь ласка, оберіть звіт для видалення.");
            return;
        }

        const reportIndex = database.reports.findIndex(r => r.name === selectedReportName);
        if (reportIndex === -1) {
            Message("Вибраний звіт не знайдено.");
            return;
        }

        const deletedName = database.reports[reportIndex].name;
        database.reports.splice(reportIndex, 1); // видаляємо зі списку

        saveDatabase(); // зберігаємо зміни

        // Видаляємо зі списку "Дані", якщо він там був
        const dataMenu = document.getElementById("data-menu");
        const menuItem = Array.from(dataMenu.children).find(item => item.textContent === deletedName);
        if (menuItem) menuItem.remove();

        Message(`Звіт "${deletedName}" видалено.`);
        showReportsList(); // оновлюємо список звітів
    }

    function previewSelectedReport() {
        if (!selectedReportName) {
            Message("Будь ласка, оберіть звіт для перегляду.");
            return;
        }

        const report = database.reports.find(r => r.name === selectedReportName);
        if (!report) {
            Message("Звіт не знайдено.");
            return;
        }

        previewReport(report); // функція вже реалізована для перегляду
    }



    function deleteActiveElement() {
        if (!activeElement) {
            Message("Спочатку оберіть елемент для видалення.");
            return;
        }

        const confirmed = confirm("Ви впевнені, що хочете видалити цей елемент?");
        if (!confirmed) return;

        activeElement.remove();
        activeElement = null;

        // Закрити додаткові панелі
        document.getElementById("fieldSelectionModal").style.display = "none";
        closeTextOptionsModal();
    }
    // Ручне створення SQL-запиту
    // Відкриває модальне вікно для ручного введення та виконання SQL-запитів.
    
    function createOwnSQL() {
        document.getElementById("ownSqlInput").value = ""; // Очистити поле вводу
        document.getElementById("ownSqlResults").innerHTML = ""; // Очистити результати попередніх запитів
        document.getElementById("ownSqlModal").style.display = "flex";
        toggleStructureButtonVisibility(true);
    }
    //
    
    function editOwnQuery(query) {
        // Відкриваємо модальне вікно власного SQL
        const modal = document.getElementById("ownSqlModal");
        if (modal) modal.style.display = "flex";
        toggleStructureButtonVisibility(true)
        
    
        // Вставляємо назву запиту
        const nameInput = document.getElementById("ownSQLName");
        if (nameInput) nameInput.value = query.name || "";
    
        // Вставляємо текст SQL-запиту
        const sqlTextarea = document.getElementById("ownSqlInput");
        if (sqlTextarea) sqlTextarea.value = query.sql || "";
        
        document.getElementById("ownSqlResults").innerHTML = ""; // Очистити результати попередніх запитів
    }
    
    // Закриває модальне вікно ручного введення SQL-запитів.
    
    function closeOwnSqlModal() {
        document.getElementById("ownSqlModal").style.display = "none";
        toggleStructureButtonVisibility(false);
    }
    
    
function saveOwnSQLquery() {
        const sql = document.getElementById("ownSqlInput").value.trim();
        const name = document.getElementById("ownSQLName")?.value.trim();
    
        if (!sql) {
            Message("SQL-запит порожній.");
            return false;
        }
    
        if (!name) {
            Message("Введіть ім’я запиту у поле «Назва запиту».");
            return false;
        }
    
        // Формуємо об'єкт запиту
        const query = {
            name: name,
            sql: sql,
            config: null,
            joins: null
        };
    
        // Шукаємо, чи існує вже такий запит
        const existingIndex = queries.definitions.findIndex(q => q.name === name);
    
        if (existingIndex !== -1) {
            if (!confirm("Запит з таким ім’ям вже існує. Перезаписати?")) return false;
            queries.definitions[existingIndex] = query;
        } else {
            queries.definitions.push(query);
        }
    
        saveDatabase();
        return true
    }

function saveOwnSQL() {
        if (saveOwnSQLquery()) {
            Message("Запит збережено.");
        }    
    }

    

function showAboutModal() {
        const modal = document.getElementById("aboutModal");
        modal.style.display = "flex";
    }
    function closeAboutModal() {
        const modal = document.getElementById("aboutModal");
        modal.style.display = "none";
    }
/**
 * Оновлення заголовку таблиці структури 
 * якщо увімкнено хоча б один зовнішній ключ – показуємо два стовпці
 * якщо не увімкнено жодного зовнішнього ключа – приховуємо 
 */
function updateSchemaTableHeader(hasForeign) {
    const thead = document.getElementById("schemaHead");
    thead.innerHTML = ""; // очистити

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>🔑</th>
        <th>Назва поля</th>
        <th>Тип</th>
        <th>📌</th>
        <th id="refTableHeader">Таблиця 📌</th>
        <th id="refFieldHeader">Поле 📌</th>
        <th id="refSubstHeader">🛟</th>
        <th>Коментар</th>
        <th>✂</th>
    `;
    thead.appendChild(headerRow);

    // показати або приховати
    document.getElementById("refTableHeader").style.display = hasForeign ? "" : "none";
    document.getElementById("refFieldHeader").style.display = hasForeign ? "" : "none";
    document.getElementById("refSubstHeader").style.display = hasForeign ? "" : "none";
}


/**
 *  Отримання зовнішніх ключів
 **/
 function getPrimaryKeyFieldsForTable(tableName) {
    console.log("getPrimaryKeyFieldsForTable=",tableName) 
    const tbl = database.tables.find(t => t.name === tableName);
    console.log("tbl=",tbl) 
    if (!tbl || !tbl.schema) return [];
    return tbl.schema.filter(c => c.primaryKey).map(c => c.title);
}



  function editSelectedTableSchema() {
    if (!selectedTableNameForEdit) {
        Message("Будь ласка, оберіть таблицю для редагування.");
        return;
    }
    
    const tableToEdit = database.tables.find(t => t.name === selectedTableNameForEdit);
    if (!tableToEdit) {
        Message("Вибрану таблицю не знайдено.");
        return;
    }
    newDbFile = false;
    isNewTable = false;
    editingTableName = tableToEdit;
    console.log("Edit schema=", selectedTableNameForEdit)
    table.schema = tableToEdit.schema || [];
    document.getElementById("savedTablesModal").style.display = "none";
    const tbody = document.getElementById("schemaBody");
    tbody.innerHTML = "";
    document.getElementById("tableName").value = tableToEdit.name;
    tableList = database.tables.map(t => t.name); // для FK
    const tableOptions = tableList.map(t => `<option value="${t}">${t}</option>`).join("");

    // Створюємо всі рядки одразу
    let rows = [];

    let hasForeign = table.schema.some(f => f.foreignKey);
    console.log("hasForeign=", hasForeign)
    updateSchemaTableHeader(hasForeign);
    table.schema.forEach(field => {
        const row = document.createElement("tr");

        const isPrimary = field.primaryKey ? 'checked' : '';
        const pkCellStyle = (field.primaryKey && field.autoInc) 
            ? 'background-color: #0f56d9; text-align:center;' 
            : 'text-align:center;';
                    
        const isForeign = field.foreignKey ? 'checked' : '';
        const selectedType = field.type || "Текст";
        const fkTable = field.refTable || "";
        const fkField = field.refField || "";
        const fkSubst = field.subst;
        
        console.log("fkSubst=",fkSubst)
        const comment = field.comment || "";

        const tableSelectHtml = `
            <select onchange="updateFieldOptions(this)" ${isForeign ? "" : "disabled"}>
                <option value="">(таблиця)</option>
                ${tableOptions.replace(`value="${fkTable}"`, `value="${fkTable}" selected`)}
            </select>
        `;

        const fkFieldOptions = getPrimaryKeyFieldsForTable(fkTable).map(f =>
            `<option value="${f}" ${f === fkField ? "selected" : ""}>${f}</option>`).join("");

        console.log("fkFieldOptions=",getPrimaryKeyFieldsForTable(fkTable))
        const fieldSelectHtml = `
            <select ${isForeign ? "" : "disabled"}>
                <option value="">(поле)</option>
                ${fkFieldOptions}
            </select>
        `;
        let substCheck = "";
        if (fkSubst) substCheck="checked";
        const substHtm = `<input type="checkbox" ${substCheck}>`;

        // Збір усіх комірок
        const cells = [
            `<td style="${pkCellStyle}"><input type="checkbox" onchange="handlePrimaryKey(this)" ${isPrimary}></td>`,
            `<td contenteditable="true">${field.title}</td>`,
            `<td><select>
                <option ${selectedType === "Текст" ? "selected" : ""}>Текст</option>
                <option ${selectedType === "Ціле число" ? "selected" : ""}>Ціле число</option>
                <option ${selectedType === "Дробове число" ? "selected" : ""}>Дробове число</option>
                <option ${selectedType === "Так/Ні" ? "selected" : ""}>Так/Ні</option>
                <option ${selectedType === "Дата" ? "selected" : ""}>Дата</option>
            </select></td>`,
            `<td style="text-align:center;"><input type="checkbox" onchange="handleForeignKey(this)" ${isForeign}></td>`,
        ];

        // FK стовпці
        if (hasForeign) {
            cells.push(`<td>${tableSelectHtml}</td>`);
            cells.push(`<td>${fieldSelectHtml}</td>`);
            cells.push(`<td>${substHtm}</td>`);
        }

        cells.push(`<td contenteditable="true">${comment}</td>`);
        cells.push(`<td style="text-align:center;"><button onclick="deleteSchemaRow(this)">❌</button></td>`);

        row.innerHTML = cells.join("");
        rows.push(row);
    });

    // Виводимо всі зібрані рядки
    rows.forEach(r => tbody.appendChild(r));

    document.getElementById("makeTable").innerText = `Редагування структури таблиці`;
    document.getElementById("modal").style.display = "flex";
}

/**
 * Копіювання вибраної таблиці зі створенням нового екземпляру
 */    
function copySelectedTable() {
    if (!selectedTableNameForEdit) {
        Message("Виберіть таблицю для копіювання.");
        return;
    }

    const originalTable = database.tables.find(t => t.name === selectedTableNameForEdit);
    if (!originalTable) {
        Message("Таблицю не знайдено.");
        return;
    }

    // Згенерувати нову унікальну назву
    let baseName = "Копія_" + selectedTableNameForEdit;
    let newName = baseName;
    let counter = 1;
    while (database.tables.some(t => t.name === newName)) {
        newName = baseName + "_" + counter++;
    }

    // Копіюємо структуру таблиці
    const newTable = {
        name: newName,
        schema: JSON.parse(JSON.stringify(originalTable.schema)),
        data: JSON.parse(JSON.stringify(originalTable.data || []))
    };

    // Створюємо таблицю в SQLite
    try {
        const fields = newTable.schema.map(field => {
            let type = field.type.toUpperCase();
            if (type === "ЦІЛЕ ЧИСЛО") type = "INTEGER";
            else if (type === "ДРОБОВЕ ЧИСЛО") type = "REAL";
            else if (type === "ТЕКСТ") type = "TEXT";
            else if (type === "ТАК/НІ") type = "BOOLEAN";
            else if (type === "ДАТА") type = "TEXT";

            let def = `"${field.title}" ${type}`;
            if (field.primaryKey) def += " PRIMARY KEY";
            return def;
        });

        const foreignKeys = newTable.schema
            .filter(f => f.foreignKey && f.refTable && f.refField)
            .map(f => `FOREIGN KEY ("${f.title}") REFERENCES "${f.refTable}"("${f.refField}")`);

        const createSQL = `CREATE TABLE "${newTable.name}" (${[...fields, ...foreignKeys].join(", ")});`;
        db.run("PRAGMA foreign_keys = OFF;");
        db.run(createSQL);
       


        // Вставити всі записи
        newTable.data.forEach(row => {
            const columns = newTable.schema.map(f => `"${f.title}"`);
            const values = row.map(v => v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
            const insertSQL = `INSERT INTO "${newTable.name}" (${columns.join(", ")}) VALUES (${values.join(", ")});`;
            db.run(insertSQL);
        });
        db.run("PRAGMA foreign_keys = ON;");
        // Додати таблицю в список
        database.tables.push(newTable);
        addTableToMenu(newTable.name);
        saveDatabase();

        Message(`Створено копію таблиці "${newTable.name}".`);
        showSavedTablesDialog(); // оновити діалог

    } catch (e) {
        console.error("Помилка при копіюванні таблиці:", e);
        Message("Не вдалося створити копію таблиці.");
    }
}

/**
 * Перегляд створеного звіту
 **/
function printReportPreview() {
        const previewContent = document.getElementById("reportPreviewCanvas");
    
        if (!previewContent) {
            alert("Немає звіту для друку.");
            return;
        }
    
        // Створюємо нове вікно для друку
        const printWindow = window.open('', '_blank');
    
        // Формуємо вміст
        printWindow.document.write(`
            <html>
            <head>
                <title>Друк звіту</title>
                <style>
                    body { margin: 0; font-family: Arial, sans-serif; }
                    #reportPreviewCanvas {
                        position: relative;
                        width: 100%;
                        height: auto;
                        border: none;
                    }
                    .report-label, .report-field {
                        position: absolute;
                        box-sizing: border-box;
                        border: 1px solid #ccc;
                        padding: 2px;
                    }
                    .field-text {
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div id="reportPreviewCanvas">
                    ${previewContent.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                </script>
            </body>
            </html>
        `);
    
        printWindow.document.close();
    }
 //
 function openTableByName(name) {
     console.log("edit=",database.tables[name])
     selectedTableNameForEdit = name
     openSelectedTable()
     }
 //
 function editQueryByName(name) { 
    console.log("edit=",name);
    selectedQueryName = name;
    editSelectedQuery()
 }
 function editReportByName(name) { 
    console.log("edit=",name);
    selectedReportName = name;
    editSelectedReport()
 }
 function editFormByName(name) { 
    console.log("edit=",name);
    selectedFormName = name;
    editSelectedForm()
 }
//
/**
 * Експортує вміст таблиці у CSV-файл із назвою "<назва таблиці>.csv".
 * 
 * Структура таблиці:
 * {
 *   name: "Teachers",            // Назва таблиці
 *   schema: [...],              // Масив полів (із назвою, типом, тощо)
 *   data: [[1, "Ім'я"], ...]    // Масив рядків даних
 * }
 *
 * CSV-файл матиме перший рядок — заголовки, далі — значення через роздільник ";"
 * Усі текстові значення будуть обгорнуті в лапки.
 */
function exportTableToCSV() {
    const tableName = selectedTableNameForEdit;
    console.log("CSV name=",tableName);   
    const table = database.tables.find(t => t.name === tableName);
    console.log("CSV table=",table)
    if (!table || !table.name || !table.schema || !table.data) {
        console.error("Неправильна структура таблиці для експорту.");
        return;
    }

    // Отримати назви полів зі схеми
    const headers = table.schema.map(field => field.title);

    // Створити масив рядків CSV, починаючи з заголовків
    const csvRows = [];
    csvRows.push(headers.join(";")); // перший рядок — заголовки

    // Додати дані
    for (const row of table.data) {
        const csvRow = row.map(value => {
            // Якщо значення містить роздільник або лапки — обгорнути в лапки і екранувати лапки
            if (typeof value === "string") {
                const escaped = value.replace(/"/g, '""');
                return `"${escaped}"`;
            }
            return value;
        });
        csvRows.push(csvRow.join(";"));
    }

    // Об’єднати рядки в текст
    const csvContent = csvRows.join("\n");

    // Створити blob і зберегти файл
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileName = `${table.name}.csv`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


 // Панель швидкого доступу
 function updateQuickAccessPanel(tables, qqueries, reports, forms) {
      const panel = document.getElementById("quickAccessPanel");
      const sections = [
          {
            id: "quickTables",
            iconsId: "quickTablesIcons",
            items: tables,
            icon: "📄",
            image: "img/table-icon.png",
            openFunc: openTableByName
          },
          {
            id: "quickQueries",
            iconsId: "quickQueriesIcons",
            items: qqueries,
            icon: "🔍",
            image: "img/query-icon.png",
            openFunc: editQueryByName
          },
          {
            id: "quickReports",
            iconsId: "quickReportsIcons",
            items: reports,
            icon: "📝",
            image: "img/report-icon.png",
            openFunc: editReportByName
          },
          {
            id: "quickForms",
            iconsId: "quickFormsIcons",
            items: forms,
            icon: "📑",
            image: "img/form-icon.png",
            openFunc: editFormByName
          }
        ];
        
    
      let hasAny = false;
    
      sections.forEach(section => {
        const container = document.getElementById(section.id);
        const iconsContainer = document.getElementById(section.iconsId);
        iconsContainer.innerHTML = "";
    
        if (section.items && section.items.length) {
          container.style.display = "block";
          hasAny = true;
          section.items.forEach(name => {
            
            if (section.id==="quickTables") {
                name = database.tables[name].name
            }
            if (section.id==="quickQueries") {
                name = queries.definitions[name].name
            }       
            const el = document.createElement("div");
            el.className = "quick-icon";
            el.innerHTML = `
            <div class='icon'>
            <img src="${section.image}" alt="icon" />
            </div>
            <div>${name}</div>`;
            el.onclick = () => section.openFunc(name);
            iconsContainer.appendChild(el);
          });
        } else {
          container.style.display = "none";
        }
       
      });
    
      panel.style.display = hasAny ? "flex" : "none";
      document.getElementById("startPrompt").style.display = "none";
      document.getElementById("logo-image").style.display = "none";
      document.getElementById("title-image").style.display = "block"; 
    }
    
    function openMainMenu() {
      document.getElementById("mainMenuModal").style.display = "flex";
    }

    function closeMainMenu() {
      document.getElementById("mainMenuModal").style.display = "none";
    }
    
    function closeAllModals() {
      document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
      });
    }
    
    function filesMenu() {
      closeAllModals();
      document.getElementById("files_Modal").style.display = "flex";
    }
    
    function createMenu() {
      closeAllModals();
      document.getElementById("create_Modal").style.display = "flex";
    }
    
    function dataMenu() {
      closeAllModals();
      document.getElementById("data_Modal").style.display = "flex";
      document.getElementById("data_Modal").style.display = "flex";
    }
    
    function tablesMenu() {
      closeAllModals();
      document.getElementById("tables_Modal").style.display = "flex";
    }
    
    function queriesMenu() {
      closeAllModals();
      document.getElementById("queries_Modal").style.display = "flex";
    }
    
    function reportsMenu() {
      closeAllModals();
      document.getElementById("reports_Modal").style.display = "flex";
    }
    
    function formsMenu() {
      closeAllModals();
      document.getElementById("forms_Modal").style.display = "flex";
    }
    
    function helpMenu() {
      closeAllModals();
      document.getElementById("help_Modal").style.display = "flex";
    }
    
window.addEventListener("click", function(event) {
  // Перевіряємо, чи елемент має клас "modal"
  if (event.target.classList.contains("modal")) {

    // Якщо це ownSqlModal — не закриваємо
    if (event.target.id === "ownSqlModal") return; ""
    if (event.target.id === "sqlModal") return;
    // Для всіх інших модалей — закриваємо
    event.target.style.display = "none";
  }
});


function showData() {
        const dropdown = document.getElementById("data-menu");
        if (!dropdown) {
            console.error("Елемент #data-menu не знайдено.");
            return;
        }
    
        // Отримати всі назви таблиць з <a> всередині dropdown
        const tableNames = [...dropdown.querySelectorAll("a")]
            .map(a => a.textContent.trim())
            .filter(name => name);
    
        if (tableNames.length === 0) {
            Message("Список таблиць порожній.");
            return;
        }
    
        const listEl = document.getElementById("tableListInModal");
        listEl.innerHTML = "";
        listEl.style.listStyle = "none";
        selectedTableNameForEdit = null;
    
        tableNames.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.style.padding = "8px";
            li.style.cursor = "pointer";
            li.dataset.tableName = name;
    
            li.addEventListener("click", () => {
                [...listEl.children].forEach(el => el.style.background = "");
                li.style.background = "#d0e0ff";
                selectedTableNameForEdit = li.dataset.tableName;
            });
    
            listEl.appendChild(li);
        });
    
        document.getElementById("dataModal").style.display = "flex";
    }
    function confirmOpenSelectedTable() {
        if (!selectedTableNameForEdit) {
            Message("Оберіть таблицю зі списку.");
            return;
        }
        document.getElementById("dataModal").style.display = "none";
        openSelectedTable(); // Твоя функція для відкриття
    }
    
let selectedDataWorkName = null;

function showDataWorkDialog() {
    const listEl = document.getElementById("dataWorkList");
    listEl.innerHTML = "";
    selectedDataWorkName = null;

    // Додаємо звичайні таблиці
    (database.tables || []).forEach(t => {
        const li = document.createElement("li");
        li.textContent = t.name;
        li.style.padding = "8px";
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            [...listEl.children].forEach(el => el.style.background = "");
            li.style.background = "#d0e0ff";
            selectedDataWorkName = t.name;
        });
        listEl.appendChild(li);
    });

    // Додаємо результати запитів
    (queries.results || []).forEach(q => {
        const li = document.createElement("li");
        li.textContent = "*" + q.name; // * — щоб відрізнити
        li.style.padding = "8px";
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            [...listEl.children].forEach(el => el.style.background = "");
            li.style.background = "#d0e0ff";
            selectedDataWorkName = "*" + q.name;
        });
        listEl.appendChild(li);
    });

    document.getElementById("dataWorkModal").style.display = "flex";
}

function closeDataWorkDialog() {
    document.getElementById("dataWorkModal").style.display = "none";
}

let currentDataView = { columns: [], rows: [] };

function openSelectedDataWork() {
    if (!selectedDataWorkName) {
        Message("Виберіть таблицю або результат запиту.");
        return;
    }
    closeDataWorkDialog();
    openDataView(selectedDataWorkName);
}

function openDataView(tableName) {
    let tableData;
    let columns;

    if (tableName.startsWith('*')) {
        const q = queries.results.find(t => t.name === tableName.substring(1));
        if (!q) return Message("Запит не знайдено");
        columns = q.schema.map(c => c.title);
        tableData = q.data;
    } else {
        const t = database.tables.find(tbl => tbl.name === tableName);
        if (!t) return Message("Таблиця не знайдена");
        columns = t.schema.map(c => c.title);
        tableData = t.data;
    }

    currentDataView.columns = columns;
    currentDataView.rows = [...tableData];

    // Заповнити селект полів
    const select = document.getElementById("dataFieldSelect");
    select.innerHTML = columns.map(c => `<option value="${c}">${c}</option>`).join("");

    // Показати дані
    renderDataViewTable(columns, currentDataView.rows);

    document.getElementById("dataViewTitle").textContent = `Таблиця: ${tableName}`;
    document.getElementById("dataViewModal").style.display = "flex";
    document.getElementById("secondFilterContainer").style.display = "none";
    document.getElementById("logicalOperator").selectedIndex = 0;
    document.getElementById("dataFilterInput1").value= "" ;
    document.getElementById("dataFilterInput2").value= "" ;
    document.getElementById("dataFilterCondition1").selectedIndex = 0;
    document.getElementById("dataFilterCondition2").selectedIndex = 0;
    
}

function renderDataViewTable(columns, rows) {
    const head = document.getElementById("dataViewHead");
    const body = document.getElementById("dataViewBody");

    head.innerHTML = "";
    const trHead = document.createElement("tr");
    columns.forEach(c => {
        const th = document.createElement("th");
        th.textContent = c;
        trHead.appendChild(th);
    });
    head.appendChild(trHead);

    body.innerHTML = "";
    rows.forEach(r => {
        const tr = document.createElement("tr");
        r.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
}

function sortDataTable() {
    const field = document.getElementById("dataFieldSelect").value;
    const order = document.querySelector('input[name="sortOrder"]:checked').value;
    const colIndex = currentDataView.columns.indexOf(field);
    if (colIndex === -1) return;

    currentDataView.rows.sort((a, b) => {
        if (a[colIndex] < b[colIndex]) return order === "asc" ? -1 : 1;
        if (a[colIndex] > b[colIndex]) return order === "asc" ? 1 : -1;
        return 0;
    });

    renderDataViewTable(currentDataView.columns, currentDataView.rows);
}

function toggleSecondFilter() {
    const logicalOp = document.getElementById("logicalOperator").value;
    const container = document.getElementById("secondFilterContainer");
    if (logicalOp === "AND" || logicalOp === "OR") {
        container.style.display = "flex";
    } else {
        container.style.display = "none";
    }
}

function clearFilterInputOnEmpty(selectElement, inputId) {
    if (selectElement.value === "") {
        document.getElementById(inputId).value = "";
    }
}



function applyDataFilter() {
    const condition1 = document.getElementById("dataFilterCondition1").value;
    const mask1 = document.getElementById("dataFilterInput1").value.trim();

    const logicalOp = document.getElementById("logicalOperator").value;
    const condition2 = document.getElementById("dataFilterCondition2").value;
    const mask2 = document.getElementById("dataFilterInput2").value.trim();

    const field = document.getElementById("dataFieldSelect").value;
    const colIndex = currentDataView.columns.indexOf(field);
    if (colIndex === -1) {
        renderDataViewTable(currentDataView.columns, currentDataView.rows);
        return;
    }

    // Функція для оцінки одного фільтра
    function evaluateFilter(value, condition, mask) {
        if (!condition || !mask) return true; // якщо фільтр не заданий — пропускаємо

        const strValue = String(value);

        if (condition === "=" || condition === "!=") {
            const regex = maskToRegex(mask);
            const matches = regex.test(strValue);
            return condition === "=" ? matches : !matches;
        } else {
            // Числове порівняння
            const numValue = parseFloat(strValue);
            const numMask = parseFloat(mask);
            if (isNaN(numValue) || isNaN(numMask)) return false;

            switch (condition) {
                case ">":  return numValue > numMask;
                case "<":  return numValue < numMask;
                case ">=": return numValue >= numMask;
                case "<=": return numValue <= numMask;
                default:   return true;
            }
        }
    }

    let filtered = currentDataView.rows;

    // Якщо обрано "+" або немає другого фільтра — використовуємо лише перший
    if (!logicalOp || !(condition2 && mask2)) {
        if (!condition1 || !mask1) {
            renderDataViewTable(currentDataView.columns, currentDataView.rows);
            return;
        }
        filtered = currentDataView.rows.filter(row =>
            evaluateFilter(row[colIndex], condition1, mask1)
        );
    } else {
        // Обидва фільтри активні
        filtered = currentDataView.rows.filter(row => {
            const pass1 = evaluateFilter(row[colIndex], condition1, mask1);
            const pass2 = evaluateFilter(row[colIndex], condition2, mask2);

            if (logicalOp === "AND") {
                return pass1 && pass2;
            } else if (logicalOp === "OR") {
                return pass1 || pass2;
            }
            return pass1; // fallback
        });
    }

    renderDataViewTable(currentDataView.columns, filtered);
}



function applyDataSearch() {
    const mask= document.getElementById("dataSearchInput").value.toLowerCase();
    if (!mask) {
        renderDataViewTable(currentDataView.columns, currentDataView.rows);
        return;
    }

    const field = document.getElementById("dataFieldSelect").value;
    const colIndex = currentDataView.columns.indexOf(field);
    if (colIndex === -1) return;

    const regex = maskToRegex(mask);

    const filtered = currentDataView.rows.filter(r =>
        regex.test(String(r[colIndex]))
    );

    renderDataViewTable(currentDataView.columns, filtered);
}
function closeDataViewModal() {
    document.getElementById("dataViewModal").style.display = "none";
}
function maskToRegex(mask) {
    // Екрануємо всі спецсимволи RegExp, щоб вони не спрацьовували
    let regexStr = mask.replace(/([.+^${}()|\\])/g, "\\$1");

    // Зірочка (*) → .* (будь-яка кількість символів)
    regexStr = regexStr.replace(/\*/g, ".*");

    // Знак питання (?) → . (один будь-який символ)
    regexStr = regexStr.replace(/\?/g, ".");

    // Решітка (#) → [0-9] (одна будь-яка цифра)
    regexStr = regexStr.replace(/#/g, "[0-9]");

    // [!...] → [^...] (заперечення у регулярках)
    regexStr = regexStr.replace(/\[!([^\]]+)\]/g, "[^$1]");

    // Діапазони та звичайні [ ] залишаємо як є, бо вони вже валідні у RegExp
    // Тут просто забираємо екранування з []
    regexStr = regexStr.replace(/\\\[/g, "[");
    regexStr = regexStr.replace(/\\\]/g, "]");

    return new RegExp("^" + regexStr + "$", "i"); // ^ і $ — щоб збігався весь рядок
}
/**
 * Імпорт таблиці з Excel/LO Calc/WPS Spreadsheet через Ctrl+C/Ctrl+V
 **/
function showImportTableDialog() {
  document.getElementById("importTableModal").style.display = "flex";
  document.getElementById("importMsg").style.display = "block";
  const input = document.getElementById("clipboardInput");
  input.value = "";
  input.focus();

  // повторно активуємо фокус при будь-якому кліку / натисканні клавіші
  document.getElementById("importTableModal").addEventListener("click", () => input.focus());
  document.getElementById("importTableModal").addEventListener("keydown", () => input.focus());

  input.onpaste = function(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    renderPreviewTable(text);
  };
}


function closeImportTableDialog() {
  document.getElementById("importTableModal").style.display = "none";
  document.getElementById("previewArea").innerHTML = "";
}

let importedData = null; // глобально збережені дані після вставки

function renderPreviewTable(text) {
  if (!text.trim()) return;
  const rows = text.trim().split("\n").map(r => r.split("\t"));
  importedData = rows;

  const table = document.createElement("table");
  table.border = "1";
  rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement(i === 0 ? "th" : "td");
      td.textContent = cell.trim();
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  const preview = document.getElementById("previewArea");
  preview.innerHTML = "";
  preview.appendChild(table);
  document.getElementById("importMsg").style.display = "none";
}

function confirmImportTable() {
  if (!importedData || importedData.length < 2) {
    Message("Немає даних для імпорту.");
    return;
  }

  // Структура таблиці
  const headers = importedData[0];
  const sampleRow = importedData[1];
  const schema = headers.map((h, i) => {
    const val = sampleRow[i];
    let type = "Текст";
    if (!isNaN(parseInt(val)) && Number.isInteger(Number(val))) type = "Ціле число";
    else if (!isNaN(parseFloat(val))) type = "Дробове число";
    else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) type = "Дата";
    return { title: h.trim(), type: type };
  });

  // додаємо ID на початку
  const fullSchema = [{ title: "ID", type: "Ціле число", primaryKey: true, autoInc: true }]
    .concat(schema);

  // показ у вікні підтвердження
  document.getElementById("confirmImportModal").style.display = "flex";
  const schemaDiv = document.getElementById("tableSchemaPreview");

  // малюємо таблицю
  let html = `<table border="1" cellpadding="5" style="border-collapse:collapse; width:100%;">`;
  html += `<thead><tr><th>Назва поля</th><th>Тип даних</th><th>PK</th><th>Автоінкремент</th></tr></thead><tbody>`;
  fullSchema.forEach(f => {
    html += `<tr>
      <td>${f.title}</td>
      <td>${f.type}</td>
      <td>${f.primaryKey ? "🔑" : ""}</td>
      <td>${f.autoInc ? "✔️" : ""}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  schemaDiv.innerHTML = html;

  // збереження для наступного кроку
  window._importSchema = fullSchema;
}


function closeConfirmImport() {
  document.getElementById("confirmImportModal").style.display = "none";
}

function saveImportedTable() {
  const name = document.getElementById("importTableName").value.trim();
  if (!checkName(name)) return;

  // 🔍 Перевірка, чи вже існує таблиця з таким іменем
  const exists = database.tables.some(t => t.name === name);
  if (exists) {
    Message(`Таблиця з назвою "${name}" вже існує. Оберіть іншу назву.`);
    return;
  }

  const schema = [].concat(window._importSchema);

  // створення таблиці
  const newTable = { name, schema, data: [] };
  importedData.slice(1).forEach((row, i) => {
    const rec = [i+1].concat(row); // додаємо ID
    newTable.data.push(rec);
  });

  database.tables.push(newTable);

  // створити в SQLite
  const fieldsDef = schema.map(f => {
    let t = f.type.toUpperCase();
    if (t === "ЦІЛЕ ЧИСЛО") t = "INTEGER";
    if (t === "ДРОБОВЕ ЧИСЛО") t = "REAL";
    if (t === "ТЕКСТ") t = "TEXT";
    if (t === "ДАТА") t = "TEXT";
    let def = `"${f.title}" ${t}`;
    if (f.primaryKey) def += " PRIMARY KEY AUTOINCREMENT";
    return def;
  }).join(", ");
  db.run(`CREATE TABLE "${name}" (${fieldsDef});`);

  // вставка даних
  newTable.data.forEach(row => {
    const values = row.map(v => v === null ? "NULL" : `'${String(v).replace(/'/g,"''")}'`);
    db.run(`INSERT INTO "${name}" VALUES (${values.join(", ")});`);
  });

  saveDatabase();
  addTableToMenu(name);
  Message("Таблицю імпортовано.");
  closeImportTableDialog();
  closeConfirmImport();
}

// Глобальний стан панелі
let isStructurePanelOpen = false;

// Показати/приховати кнопку залежно від стану ownSqlModal
function toggleStructureButtonVisibility(show) {
    const toggleBtn = document.getElementById("toggleStructureBtn");
    if (!toggleBtn) return;
    
    // Встановлюємо видимість кнопки
    if (show === undefined) {
        toggleBtn.style.display = toggleBtn.style.display === "none" ? "inline-block" : "none";
    } else {
        toggleBtn.style.display = show ? "inline-block" : "none";
    }
    
    // Якщо кнопка ховається - обов'язково ховаємо панель
    if (toggleBtn.style.display === "none") {
        hideStructurePanel();
    }
}

// Відобразити структуру бази даних у панелі
function renderStructurePanel() {
    const content = document.getElementById("structureContent");
    if (!database.tables || database.tables.length === 0) {
        content.innerHTML = "<p>Немає таблиць</p>";
        return;
    }
    let html = "";
    database.tables.forEach(table => {
        html += `<div style="margin-bottom: 12px;"><strong>${table.name}</strong><ul style="padding-left: 16px; margin: 4px 0;">`;
        table.schema.forEach(field => {
            const pkIcon = field.primaryKey ? " 🔑" : "";
            const fkIcon = field.foreignKey ? " 📌" : "";
            html += `<li>${field.title} (${field.type})${pkIcon}${fkIcon}</li>`;
        });
        html += "</ul></div>";
    });
    content.innerHTML = html;
}

// Відкрити або закрити панель
function toggleStructurePanel() {
    const panel = document.getElementById("structurePanel");
    if (isStructurePanelOpen) {
        panel.style.right = "-300px";
        isStructurePanelOpen = false;
    } else {
        renderStructurePanel();
        panel.style.right = "0px";
        isStructurePanelOpen = true;
    }
}

// Примусово приховати панель (наприклад, при закритті sqlModal)
function hideStructurePanel() {
    const panel = document.getElementById("structurePanel");
    panel.style.right = "-300px";
    isStructurePanelOpen = false;
}

