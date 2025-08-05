
    // Структура бази даних
    let database = {
        fileName: "",
        tables: [], // Кожна таблиця — об'єкт з name та schema
        reports: [], // 🆕 Масив для збереження звітів
        relations: [], // 🆕масив для збереження зв'язків
        forms: [] // ⬅️ масив для збереження форм

    };

    // New structure for query definitions and results
    let queries = {
        definitions: [], // Stores query configurations
        results: [] // Stores query result tables (virtual tables)
    };

    let SQL = null;
    let db = null;
    let dbToDelete = null;
    let selectedReportName = null;
    let currentEditTable = null;
    let selectedCell = null;
    let selectedQueryName = null; // To keep track of the selected query in the saved queries dialog
    let selectedTableNameForEdit = null; // To keep track of the selected table in the saved tables dialog for opening
    let selectedTableNameForDelete = null; // To keep track of the selected table in the saved tables dialog for deletion
    let selectedDbFile = null;
    let newDbFile = false; // змінна для фіксації створення нового файлу

    
    closeAllModals();
    
    // Завантаження SQL.js
    initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    }).then(SQLLib => {
        SQL = SQLLib;
        //loadDatabase();
    });
   
     function getCurrentTableNames() {
      return Object.keys(database.tables || {});
    }
    function getCurrentQueryNames() {
      console.log("Queries=",queries.definitions)
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
        const name = database.fileName || "my_database";
        const saved = localStorage.getItem(name + ".db-data");
        console.log("name =",name )
        
        if (saved) {
            const uIntArray = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
            db = new SQL.Database(uIntArray);
            console.log("База даних завантажена з localStorage");
            console.log("db =",db )
            // Завантажити запити тільки якщо є база
            const savedQueries = localStorage.getItem(name + ".queries-data");
            if (savedQueries) {
                queries.definitions = JSON.parse(savedQueries);
                console.log("Визначення запитів завантажено з localStorage");
                
            } else {
                queries.definitions = [];
            }
            
            const savedQueryResults = localStorage.getItem(name + ".query-results");
            if (savedQueryResults) {
                queries.results = JSON.parse(savedQueryResults);
                console.log("Результати запитів завантажено з localStorage");
            } else {
                queries.results = [];
            }

            const savedReports = localStorage.getItem(name + ".reports-data");
            if (savedReports) {
                database.reports = JSON.parse(savedReports);
                console.log("Звіти завантажено з localStorage");
                console.log("Load Report: ",database.reports)
            } else {
                database.reports = [];
            }
            
            const savedForms = localStorage.getItem(name + ".forms-data");
            if (savedForms) {
                database.forms = JSON.parse(savedForms);
                console.log("Форми завантажено з localStorage");
            } else {
                database.forms = [];
            }
            
            const savedRelations = localStorage.getItem(name + ".relations-data");
            if (savedRelations) {
                database.relations = JSON.parse(savedRelations);
                console.log("Зв'язки завантажено з localStorage");
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
        console.log("DBSCHM=", database.tables)
        if (!db) return;
        const data = db.export();
        const base64 = btoa(String.fromCharCode(...data));
        localStorage.setItem(database.fileName + ".db-data", base64);
        console.log("Save file: ", database.fileName)
        localStorage.setItem(database.fileName + ".tables-data", JSON.stringify(database.tables));
        // Зберігаємо запити та їх результати
        localStorage.setItem(database.fileName + ".queries-data", JSON.stringify(queries.definitions));
        localStorage.setItem(database.fileName + ".query-results", JSON.stringify(queries.results || []));


        // Зберігаємо звіти
        localStorage.setItem(database.fileName + ".reports-data", JSON.stringify(database.reports || []));
        console.log("Report: ",database.reports)
        // Зберігаємо форми
        localStorage.setItem(database.fileName + ".forms-data", JSON.stringify(database.forms || []));
        // Зберігаємо зв'язки
        console.log("Зберігаємо зв'язки=",database.relations)
        localStorage.setItem(database.fileName + ".relations-data", JSON.stringify(database.relations || []));
        
        console.log("База даних збережена у localStorage");
        updateQuickAccessPanel(
                  getCurrentTableNames(),
                  getCurrentQueryNames(),
                  getCurrentReportNames(),
                  getCurrentFormNames()
                );                
                    
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

        // 🔄 Очистити database, queries та меню
        database.fileName = selectedDbFile;
        database.tables = [];
        queries.definitions = []; // Clear query definitions on new DB load
        queries.results = []; // Clear query results on new DB load
        database.forms = [];
        database.reports = [];

        const dataMenu = document.getElementById("data-menu");
        dataMenu.innerHTML = "";

        // Завантажити дані з локального сховища
        const fullDatabase = JSON.parse(localStorage.getItem(selectedDbFile + ".tables-data"));
        console.log("fullDatabase=",fullDatabase)
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
        
                    // Додати FOREIGN KEY (якщо є)
                    const foreignKeys = t.schema
                        .filter(f => f.foreignKey && f.refTable && f.refField)
                        .map(f => `FOREIGN KEY ("${f.title}") REFERENCES "${f.refTable}"("${f.refField}")`);
        
                    const fullFields = [...fields, ...foreignKeys].join(", ");
                    db.run(`CREATE TABLE "${t.name}" (${fullFields});`);
                }
        
                // Завантажити дані
                const res = db.exec(`SELECT * FROM "${t.name}"`);
                t.data = res.length ? res[0].values : [];
            });
        } else {
            Message("Файл даних пошкоджено або не містить таблиць.");
            return;
        }
        

        // Load queries definitions
        loadDatabase() 

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
                        readonly: true, // 👈 Це можна використовувати для стилізації як "червоний і незмінний"
                    });
                }
            });
        });
        console.log("database.relations=",database.relations)

        console.log("database.tables=", database.tables)
        database.tables.forEach(t => addTableToMenu(t.name)); // 🔧 Оновити меню "Дані"
        Message("Базу даних '" + selectedDbFile + "' завантажено.");
        closeStorageDialog();
        updateMainTitle();
    }



    // -------------

/*
 * Функція editData
 * ------------------
 * Призначення: Відображає інтерфейс редагування таблиці або перегляду запиту у модальному вікні.
 * Параметри: tableName — назва таблиці або запиту (з * на початку).
 * Результат: Відкриває модальне вікно з даними для редагування або перегляду.
 * Робота:
 * - Завантажує дані таблиці або результатів запиту з SQLite або об'єкта database.
 * - Якщо таблиці не існує — створює її, базуючись на схемі.
 * - Відображає дані у вигляді таблиці з можливістю редагування.
 */
function editData(tableName) {
    let table = null; // Поточна таблиця або результат запиту
    let isReadOnly = false; // Чи є таблиця доступною лише для читання
    let columns = []; // Список назв колонок
    let rows = [];    // Масив рядків таблиці
    document.getElementById("savedTablesModal").style.display = "none";
   
    const isQueryTable = tableName.startsWith('*'); // Чи є це результатом запиту
    console.log("Edit=", tableName);

    if (isQueryTable) {
        const originalQueryName = tableName.substring(1);
        table = queries.results.find(t => t.name === originalQueryName);
        isReadOnly = true;
        if (table) {
            columns = table.schema.map(col => col.title);
            rows = table.data;
        }
    } else {
        table = database.tables.find(t => t.name === tableName);
        isReadOnly = false;

        if (table) {
            try {
                const res = db.exec(`SELECT * FROM "${tableName}"`);
                rows = res.length ? res[0].values : [];
                columns = res.length ? res[0].columns : table.schema.map(col => col.title);
            } catch (e) {
                console.warn(`Таблиця "${tableName}" не існує в SQLite. Створюємо...`);

                const fields = table.schema.map(field => {
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

                const foreignKeys = table.schema
                    .filter(f => f.foreignKey && f.refTable && f.refField)
                    .map(f => `FOREIGN KEY (\"${f.title}\") REFERENCES \"${f.refTable}\"(\"${f.refField}\")`);

                const createSQL = `CREATE TABLE \"${tableName}\" (${[...fields, ...foreignKeys].join(", ")});`;
                try {
                    db.run("PRAGMA foreign_keys = ON;");
                    db.run(createSQL);
                    console.log("Таблицю створено:", createSQL);
                } catch (err) {
                    console.error("Не вдалося створити таблицю:", err);
                    Message(`Помилка створення таблиці \"${tableName}\"`);
                    return;
                }

                table.data = table.data || [];
                table.data.forEach(record => {
                    const columns = table.schema.map(f => `\"${f.title}\"`);
                    const values = record.map(v => v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
                    const insertSQL = `INSERT INTO \"${tableName}\" (${columns.join(", ")}) VALUES (${values.join(", ")});`;
                    try {
                        db.run(insertSQL);
                    } catch (e) {
                        console.warn("Не вдалося вставити дані:", insertSQL, e);
                        Message(`Не вдалося вставити запис: ${e.message}`);
                    }
                });

                const res = db.exec(`SELECT * FROM \"${tableName}\"`);
                rows = res.length ? res[0].values : [];
                columns = res.length ? res[0].columns : table.schema.map(col => col.title);
            }

            table.data = rows;
            console.log("table.data=", table.data);
        }
    }

    if (!table) {
        Message("Таблицю/Запит не знайдено");
        return;
    }

    currentEditTable = table;
    document.getElementById("editTitle").innerText = isReadOnly
        ? `Перегляд результатів запиту \"${table.name}\"`
        : `Редагування таблиці \"${table.name}\"`;

    const head = document.getElementById("editHead");
    const body = document.getElementById("editBody");
    head.innerHTML = "";
    body.innerHTML = "";
    selectedCell = null;

    const headerRow = document.createElement("tr");
    columns.forEach((colTitle, i) => {
        const th = document.createElement("th");
        th.textContent = colTitle;
        th.style.backgroundColor = "#eee";
        if (!isReadOnly && table.schema[i] && table.schema[i].primaryKey) th.classList.add("pk");
        headerRow.appendChild(th);
    });
    head.appendChild(headerRow);

    dataRows = rows || [];
    console.log("dataRows=", dataRows);

    dataRows.forEach(rowData => {
        const tr = document.createElement("tr");
        rowData.forEach((cellData, index) => {
            const td = document.createElement("td");
            const col = table.schema[index];

            const isPrimaryKey = !isQueryTable && col && col.primaryKey;
            const isForeignKey = !isQueryTable && col && col.foreignKey && col.refTable && col.refField;

            if (isForeignKey) {
                const select = document.createElement("select");

                const emptyOption = document.createElement("option");
                emptyOption.value = "empty";
                emptyOption.textContent = "(пусто)";
                select.appendChild(emptyOption);

                const refTableObj = database.tables.find(t => t.name === col.refTable);
                if (refTableObj) {
                    const refIdIndex = refTableObj.schema.findIndex(f => f.title === col.refField);
                    const refTextIndex = refTableObj.schema.findIndex(f => f.title.toLowerCase().includes("name") || f.title !== col.refField);

                    if (refIdIndex !== -1) {
                        console.log("refTableObj=",refTableObj)
                        refTableObj.data.forEach(refRow => {
                            console.log("refTextIndex,refRow[refIdIndex]=",refTextIndex,refRow[refIdIndex])
                            const option = document.createElement("option");
                            option.value = refRow[refIdIndex];
                            option.textContent = refTextIndex !== -1 ? refRow[refTextIndex] : refRow[refIdIndex];
                            select.appendChild(option);
                        });
                        select.value = cellData ?? "empty";
                    }
                }
                td.appendChild(select);
                select.disabled = isQueryTable;
                select.addEventListener("change", () => {
                    rowData[index] = select.value === "empty" ? null : select.value;
                });
            } else if (col.type === "Так/Ні" || col.type.toLowerCase() === "boolean") {
                const select = document.createElement("select");
                const optionYes = document.createElement("option");
                optionYes.value = "1";
                optionYes.textContent = "Так";
                select.appendChild(optionYes);

                const optionNo = document.createElement("option");
                optionNo.value = "0";
                optionNo.textContent = "Ні";
                select.appendChild(optionNo);

                select.value = cellData == 1 ? "1" : "0";
                select.disabled = isQueryTable;
                td.appendChild(select);
                select.addEventListener("change", () => {
                    rowData[index] = Number(select.value);
                });
            } else if (col.type === "Дата") {
                const input = document.createElement("input");
                input.type = "date";
                let value = typeof cellData === "string" && cellData.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? cellData
                    : new Date().toISOString().split("T")[0];
                input.value = value;
                input.disabled = isQueryTable;
                td.appendChild(input);
                input.addEventListener("change", () => {
                    rowData[index] = input.value;
                });
                rowData[index] = input.value;
            } else {
                td.innerText = cellData ?? "";
                td.contentEditable = !isQueryTable && !isPrimaryKey;
                if (!isQueryTable && isPrimaryKey) td.classList.add("pk");
            }

            td.addEventListener("click", () => {
                selectedCell = td;
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

/*
 * Додаємо рядок даних
 */
 
 function addDataRow() {
        if (!currentEditTable || currentEditTable.name.startsWith('*')) return; // Заборонити додавання рядків до результатів запитів
        const tbody = document.getElementById("editBody");
        const tr = document.createElement("tr");
    
        currentEditTable.schema.forEach((col, index) => {
            const td = document.createElement("td");
            console.log("Add data row, col=",col)
    
            if ((col.primaryKey)&&(col.type=="Ціле число")) {
                // Знайти найбільше значення PK у колонці
                let max = 0;
                const rows = tbody.querySelectorAll("tr");
                rows.forEach(row => {
                    const val = parseInt(row.children[index].innerText);
                    if (!isNaN(val)) max = Math.max(max, val);
                });
                td.innerText = max + 1;
                td.contentEditable = "false";
            }
            else if (col.foreignKey && col.refTable && col.refField) {
                const select = document.createElement("select");
            
                const refTableObj = database.tables.find(t => t.name === col.refTable);
                if (refTableObj) {
                    const refFieldObj = refTableObj.schema.find(f => f.title === col.refField);
                    const refIdIndex = refTableObj.schema.findIndex(f => f.title === col.refField);
            
                    let refTextIndex = -1;
            
                    if (refFieldObj) {
                        if (refFieldObj.type === "Текст") {
                            // Показуємо значення самого refField
                            refTextIndex = refIdIndex;
                        } else if (refFieldObj.type === "Ціле число") {
                            // Шукаємо інше поле з таким самим title, як поле у головній таблиці
                            refTextIndex = refTableObj.schema.findIndex(f => f.title === col.title);
                        }
                    }
            
                    if (refIdIndex !== -1 && refTextIndex !== -1) {
                        refTableObj.data.forEach(refRow => {
                            const option = document.createElement("option");
                            option.value = refRow[refIdIndex];     // id, що зберігається
                            option.textContent = refRow[refTextIndex]; // відображуваний текст
                            select.appendChild(option);
                        });
                    }
                }
            
                td.appendChild(select);
            }
            
            
            else if (col.type === "Так/Ні" || col.type.toLowerCase() === "boolean") {
                const select = document.createElement("select");
            
                const optionYes = document.createElement("option");
                optionYes.value = "1";
                optionYes.textContent = "Так";
                select.appendChild(optionYes);
            
                const optionNo = document.createElement("option");
                optionNo.value = "0";
                optionNo.textContent = "Ні";
                select.appendChild(optionNo);
            
                td.appendChild(select);
            } else if (col.type === "Дата") {
                const input = document.createElement("input");
                input.type = "date";
            
                // Значення за замовчуванням — сьогоднішня дата
                const today = new Date().toISOString().split("T")[0];
                input.value = today;
            
                td.appendChild(input);           

            }
             else {
                td.contentEditable = "true";
                td.innerText = "";
            }
            
    
            td.addEventListener("click", () => {
                selectedCell = td;
            });
    
            tr.appendChild(td);
        });
    
        tbody.appendChild(tr);
    }
    
   

/*
Функція deleteSelectedRow()
---------------------------
Призначення: Видаляє вибраний рядок із таблиці редагування, якщо вона не є запитом і має первинний ключ.
Параметри: Відсутні (використовує глобальні selectedCell та currentEditTable).
Результат: Видаляє рядок з DOM і з бази даних, викликає збереження.
Спосіб роботи:
- Перевіряє, чи клітинка вибрана та чи таблиця не є запитом;
- Знаходить індекс стовпця з первинним ключем;
- Формує SQL-запит DELETE і виконує його;
- Видаляє рядок із таблиці і зберігає БД.
*/
function deleteSelectedRow() {
    if (!selectedCell || currentEditTable.name.startsWith('*')) { // Запобігає видаленню з запиту або без вибору клітинки
        Message("Спочатку клацніть у комірку рядка, який хочете видалити, або це вікно не є редагованим.");
        return;
    }

    const row = selectedCell.parentElement; // Отримуємо HTML-елемент рядка
    const cells = row.querySelectorAll("td"); // Всі клітинки рядка

    const pkColIndex = currentEditTable.schema.findIndex(col => col.primaryKey); // Знаходимо індекс первинного ключа
    if (pkColIndex === -1) {
        Message("У таблиці немає первинного ключа, тому неможливо видалити запис з бази.");
        return;
    }

    const pkValue = cells[pkColIndex].innerText.trim(); // Значення первинного ключа
    const sql = `DELETE FROM "${currentEditTable.name}" WHERE "${currentEditTable.schema[pkColIndex].title}" = '${pkValue}';`; // Формування SQL-запиту
    db.run(sql); // Виконання запиту
    row.remove(); // Видалення рядка з DOM
    saveDatabase(); // Збереження БД
}

/*
Функція saveTableData()
------------------------
Призначення: Зберігає всі дані з таблиці редагування у базу даних, враховуючи різні типи елементів (select, input).
Параметри: Відсутні (використовує DOM та currentEditTable).
Результат: Дані записуються у БД, таблиця оновлюється.
Спосіб роботи:
- Проходить усі рядки таблиці;
- Для кожної клітинки бере значення з select / input / тексту;
- Якщо рядок не порожній — формує INSERT OR REPLACE SQL;
- Зберігає базу та оновлює currentEditTable.data.
*/
function saveTableData() {
    if (!currentEditTable || currentEditTable.name.startsWith('*')) {
        Message("Ця таблиця не підлягає редагуванню.");
        return;
    }

    const rows = document.querySelectorAll("#editBody tr"); // Всі редаговані рядки
    const newData = []; // Масив для нових даних таблиці

    rows.forEach(row => {
        const cells = row.querySelectorAll("td"); // Клітинки поточного рядка
        const values = []; // Масив значень для SQL-запиту
        const rowData = {}; // Об'єкт даних для збереження в currentEditTable
        let allEmpty = true; // Прапорець порожнього рядка

        currentEditTable.schema.forEach((col, index) => {
            const cell = cells[index];
            let val = "";

            // 1. Якщо є <select> — беремо значення з нього
            const select = cell.querySelector("select");
            if (select) {
                val = select.value;
            }
            // 2. Якщо є <input type="date"> — беремо його значення
            else {
                const input = cell.querySelector("input[type='date']");
                if (input) {
                    val = input.value;
                } else {
                    // 3. Інакше беремо звичайний текст
                    val = cell.innerText.trim();
                }
            }

            if (val !== "") allEmpty = false; // Якщо хоч одне поле не порожнє — зберігаємо рядок

            const escaped = val.replace(/'/g, "''"); // Екранування лапок у SQL
            values.push(`'${escaped}'`); // Додаємо значення до масиву
            rowData[col.title] = val; // Додаємо у внутрішній об'єкт
        });

        if (allEmpty) return; // Пропускаємо порожній рядок

        newData.push(rowData); // Додаємо об'єкт до нових даних

        const columns = currentEditTable.schema.map(col => `"${col.title}"`); // Масив назв стовпців
        const sql = `INSERT OR REPLACE INTO "${currentEditTable.name}" (${columns.join(", ")}) VALUES (${values.join(", ")});`; // SQL-запит
        db.run(sql); // Виконання запиту
    });

    saveDatabase(); // Збереження змін
    currentEditTable.data = newData; // Оновлюємо копію даних у змінній
    Message("Дані збережено."); // Повідомлення користувачу
    closeEditModal(); // Закриваємо вікно редагування
}

/*
Функція closeEditModal()
-------------------------
Призначення: Закриває вікно редагування таблиці, скидаючи вибрані значення.
Параметри: Відсутні.
Результат: Модальне вікно зникає, змінні очищуються.
*/
function closeEditModal() {
    document.getElementById("editModal").style.display = "none"; // Ховаємо вікно
    currentEditTable = null; // Скидаємо редаговану таблицю
    selectedCell = null; // Скидаємо вибрану клітинку
}

/* 
Функція createDbFile()
Призначення: Відкриває модальне вікно для створення нового файлу бази даних.
Параметри: відсутні.
Результат: Показ модального вікна з полем для введення назви бази.
*/
function createDbFile() {
    newDbFile = true;
    document.getElementById("dbName").value = "my_database"; // встановлюємо значення за замовчуванням
    document.getElementById("dbModal").style.display = "flex"; // відкриваємо модальне вікно
}

/* 
Функція closeDbModal()
Призначення: Закриває модальне вікно створення бази даних.
Параметри: відсутні.
Результат: Сховує вікно з вибором назви БД.
*/
function closeDbModal() {
    document.getElementById("dbModal").style.display = "none";
}
/*
 * Перевірка но новий файл
 */
function saveNewDb() {
    console.log("Save new file")
    newDbFile = true; 
    const name = document.getElementById("dbName").value.trim() || "my_database"; // зчитування назви БД або використання за замовчуванням
    console.log("Save new file=",name + ".db-data")
    // Якщо створюємо новий файл і такий вже існує
    if (localStorage.getItem(name + ".tables-data")) {
        console.log("Overwrite!!!")
        const msg = document.getElementById("overwtiteConfirmText");
        msg.innerHTML = `<p>Файл з назвою <b>${name}</b> вже існує.</p><p>Що робити?</p>`;
        showOverwriteConfirm(name);
    } else newDbFile = false; 
    saveDb()
} 
/*
 * Вікно підтвердження при перезапису файлу бази даних
 */ 
function showOverwriteConfirm(name) {
     document.getElementById("overwriteModal").style.display = "flex"; // показати вікно вибору
}
function doOverwriteDb() {
    newDbFile = false;
}

function doNewNameDb() {
    document.getElementById("overwriteModal").style.display = "none"; // ховаємо вікно вибору     
    newDbFile = true; 
}

function doCloseOverwriteConfirm() {
    document.getElementById("overwriteModal").style.display = "none"; // ховаємо вікно вибору     
    newDbFile = false;
    closeDbModal()
}



/* 
Функція saveDb()
Призначення: Створює новий файл бази даних у памʼяті та зберігає його.
Параметри: відсутні.
Результат: Створення SQLite бази, очищення попередніх даних, збереження у localStorage.
*/
function saveDb() {
    const name = document.getElementById("dbName").value.trim() || "my_database"; // зчитування назви БД або використання за замовчуванням
    
    // Якщо створюємо файл з назвою що існує
    if (newDbFile) return;    
    
    database.fileName = name; // збереження назви у структурі database
    database.tables = []; // очищення списку таблиць
    queries.definitions = []; // очищення визначень запитів
    queries.results = []; // очищення результатів запитів
    const dataMenu = document.getElementById("data-menu"); // посилання на меню таблиць
    dataMenu.innerHTML = ""; // очищення меню
    db = new SQL.Database(); // створення нової порожньої SQLite бази
    saveDatabase(); // збереження бази у localStorage
    newDbFile = false;
    console.log("Файл бази даних створено:", database);
    Message("Базу даних збережено."); // повідомлення користувачу
    closeDbModal(); // закриваємо модальне вікно
    updateMainTitle(); // оновлюємо заголовок
}

/* 
Функція saveDbAndCreateTable()
Призначення: Створює базу даних та одразу відкриває інтерфейс для створення таблиці.
Параметри: відсутні.
Результат: Створення бази та перехід до створення структури таблиці.
*/
function saveDbAndCreateTable() {
    saveDb(); // зберігаємо базу
    closeDbModal(); // закриваємо модальне вікно
    createTable(); // відкриваємо створення таблиці
}

// Обʼєкт для збереження тимчасової інформації про створювану таблицю
let table = {
    name: "Неназвана таблиця", // назва таблиці за замовчуванням
    schema: [] // структура таблиці
};

// Список усіх таблиць бази, використовується для перевірок у редакторі
let tableList = [];

/* 
Функція createTable()
Призначення: Відкриває модальне вікно для створення нової таблиці та ініціалізує її структуру.
Параметри: відсутні.
Результат: Очищення попередньої структури, додавання першого рядка полів таблиці.
*/
function createTable() {
    table.schema = []; // очищення схеми
    document.getElementById("schemaBody").innerHTML = ""; // очищення HTML
    document.getElementById("tableName").value = "Неназвана таблиця"; // встановлення імені
    tableList = database.tables.map(t => t.name); // оновлення списку таблиць (для звʼязків)
    addSchemaRow(); // Додати перший рядок
    document.getElementById("makeTable").innerText = `Створення структури таблиці`; // заголовок
    document.getElementById("modal").style.display = "flex"; // показ модального вікна
}

/* 
Функція closeModal()
Призначення: Закриває модальне вікно створення таблиці.
Параметри: відсутні.
Результат: Сховує вікно.
*/
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

/* 
Функція deleteSchemaRow(button)
Призначення: Видаляє один рядок зі структури створюваної таблиці.
Параметри: button — кнопка "❌", натиснута користувачем.
Результат: Видалення відповідного рядка з DOM.
*/
function deleteSchemaRow(button) {
    const row = button.closest("tr"); // знаходження батьківського рядка
    if (row) row.remove(); // видалення з DOM
}

/* 
Функція addSchemaRow()
Призначення: Додає новий рядок до структури таблиці, що створюється.
Параметри: відсутні.
Результат: Вставка HTML-елементів до тіла таблиці зі всіма полями для нового стовпця.
*/
function addSchemaRow() {
    const tbody = document.getElementById("schemaBody");
    const row = document.createElement("tr");

    const tableOptions = tableList.map(t => `<option value="${t}">${t}</option>`).join("");

    // Перевірка: чи хоч один чекбокс "Зовн. ключ" активний?
    const anyChecked = Array.from(document.querySelectorAll('#schemaBody tr input[type="checkbox"]'))
        .some(cb => cb.closest('td')?.cellIndex === 3 && cb.checked);
    console.log("anyChecked=",anyChecked)
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
          <select>
            <option value="">(поле)</option>
          </select>
        </td>` : ''}
        <td contenteditable="true"></td>
        <td style="text-align:center;">
          <button onclick="deleteSchemaRow(this)">❌</button>
        </td>
    `;

    tbody.appendChild(row);
}


    
 /*
Функція getFieldsForTable(tableName)
Призначення: Повертає список назв полів для заданої таблиці.
Параметри:
 - tableName (string): назва таблиці.
Результат: Масив назв полів або порожній масив, якщо таблиця не знайдена.
*/
function getFieldsForTable(tableName) {
    const table = database.tables.find(t => t.name === tableName);
    if (!table) return [];
    return table.schema.map(field => field.title);
}

/*
Функція handlePrimaryKey(checkbox)
Призначення: Обробляє встановлення або зняття первинного ключа для поля таблиці.
Параметри:
 - checkbox (HTMLInputElement): прапорець первинного ключа.
Результат: Оновлює тип поля та коментар до нього.
*/
function handlePrimaryKey(checkbox) {
    const row = checkbox.closest("tr");

    // Структура рядка:
    // 0 - чекбокс PK
    // 1 - назва поля
    // 2 - тип
    // 3 - чекбокс FK
    // 4 - таблиця FK
    // 5 - поле FK
    // 6 - коментар
    // 7 - видалення

    const commentCell = row.cells[6]; 
    const typeSelect = row.cells[2].querySelector("select");

    if (checkbox.checked) {
        if (!commentCell.innerText.includes("Первинний ключ")) {
            commentCell.innerText = "Первинний ключ";
        }
        if (typeSelect) {
            typeSelect.value = "Ціле число";
        }
    } else {
        if (commentCell.innerText === "Первинний ключ") {
            commentCell.innerText = "";
        }
    }
}

/*
Функція handleForeignKey(checkbox)
Призначення: Обробляє встановлення або зняття зовнішнього ключа для поля.
Параметри:
 - checkbox (HTMLInputElement): прапорець зовнішнього ключа.
Результат: Увімкнення/вимкнення селекторів таблиці/поля для FK.
*/
function handleForeignKey(checkbox) {
    const tbody = document.getElementById("schemaBody");
    const rows = tbody.querySelectorAll("tr");

    const anyChecked = Array.from(rows).some(row => {
        const cb = row.cells[3]?.querySelector('input[type="checkbox"]');
        return cb?.checked;
    });

    rows.forEach(row => {
        // Перевіряємо кількість комірок у рядку
        const hasForeignKeyColumns = row.cells.length > 6;

        if (anyChecked && !hasForeignKeyColumns) {
            // Додаємо 2 комірки: Таблиця ЗК і Поле ЗК
            const tableSelect = document.createElement("td");
            const fieldSelect = document.createElement("td");

            const tableOptions = tableList.map(t => `<option value="${t}">${t}</option>`).join("");

            tableSelect.innerHTML = `<select onchange="updateFieldOptions(this)">
                <option value="">(таблиця)</option>
                ${tableOptions}
            </select>`;
            fieldSelect.innerHTML = `<select><option value="">(поле)</option></select>`;

            // Вставити перед коментарем і кнопкою видалення
            row.insertBefore(tableSelect, row.cells[6]);
            row.insertBefore(fieldSelect, row.cells[7]);
        }

        if (!anyChecked && hasForeignKeyColumns) {
            // Видаляємо 2 зайві комірки
            row.deleteCell(5); // поле ЗК
            row.deleteCell(4); // таблиця ЗК
        }
    });
}


/*
Функція updateFieldOptions(tableSelect)
Призначення: Оновлює список доступних полів при виборі таблиці у зовнішньому ключі.
Параметри:
 - tableSelect (HTMLSelectElement): селектор таблиці.
Результат: Оновлення списку полів у відповідному селекторі.
*/
function updateFieldOptions(tableSelect) {
    const row = tableSelect.closest("tr");
    const fieldSelect = row.cells[5].querySelector("select");
    const selectedTable = tableSelect.value;

    fieldSelect.innerHTML = `<option value="">Завантаження...</option>`;

    const fields = getFieldsForTable(selectedTable);
    fieldSelect.innerHTML = fields.map(f => `<option value="${f}">${f}</option>`).join("");
}

/*
Функція saveSchema()
Призначення: Зберігає структуру таблиці, створює відповідну таблицю в SQLite, вставляє дані, оновлює UI та базу.
Параметри: відсутні.
Результат: Створена або оновлена таблиця з новою схемою в БД.
*/
function saveSchema() {
    let tableName = document.getElementById("tableName").value.trim() || "Неназвана таблиця";
    const rows = document.querySelectorAll("#schemaBody tr");

    const schema = [];
    const fieldNames = new Set();
    let hasDuplicate = false;
    let hasPrimaryKey = false;

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

        // Перевірка на наявність checkbox для зовнішнього ключа (у клітинці 3)
        let isForeignKey = false;
        const foreignKeyCell = row.cells[3];
        if (foreignKeyCell) {
            const fkCheckbox = foreignKeyCell.querySelector("input[type=checkbox]");
            if (fkCheckbox) {
                isForeignKey = fkCheckbox.checked;
            }
        }

        // Безпечний доступ до клітинок 4 і 5 та їх select-елементів
        let refTable = null;
        let refField = null;

        if (isForeignKey) {
            const refTableCell = row.cells[4];
            const refFieldCell = row.cells[5];

            if (refTableCell) {
                const refTableSelect = refTableCell.querySelector("select");
                if (refTableSelect) {
                    refTable = refTableSelect.value || null;
                }
            }

            if (refFieldCell) {
                const refFieldSelect = refFieldCell.querySelector("select");
                if (refFieldSelect) {
                    refField = refFieldSelect.value || null;
                }
            }
        }

        if (isPrimaryKey) hasPrimaryKey = true;

        schema.push({
            primaryKey: isPrimaryKey,
            title: title,
            type: type,
            comment: comment,
            foreignKey: isForeignKey,
            refTable: isForeignKey ? refTable : null,
            refField: isForeignKey ? refField : null
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

    if (!hasPrimaryKey) {
        Message("Не вказано жодного первинного ключа. Таблиця не буде збережена.");
        return;
    }

    // Далі без змін...
    console.log("Schema=", schema);

    const table = {
        name: tableName,
        schema: schema,
        data: []
    };

    // Зчитування старих даних
    let oldData = [];
    let oldSchema = [];
    const existingIndex = database.tables.findIndex(t => t.name === tableName);
    if (existingIndex !== -1) {
        try {
            const stmt = db.prepare(`SELECT * FROM "${tableName}"`);
            while (stmt.step()) {
                oldData.push(stmt.getAsObject());
            }
            stmt.free();
        } catch (e) {
            console.warn("Не вдалося зчитати старі дані таблиці:", e);
        }
        oldSchema = database.tables[existingIndex].schema || [];
    }

    // Видалення старої таблиці
    try {
        db.run(`DROP TABLE IF EXISTS "${tableName}"`);
    } catch (e) {
        console.error("Не вдалося видалити стару таблицю:", e);
    }

    // Побудова SQL для нової таблиці
    db.run("PRAGMA foreign_keys = ON;");

    let fieldsSQL = schema.map(field => {
        let type = field.type.toUpperCase();
        if (type === "ЦІЛЕ ЧИСЛО") type = "INTEGER";
        else if (type === "ДРОБОВЕ ЧИСЛО") type = "REAL";
        else if (type === "ТЕКСТ") type = "TEXT";
        else if (type === "ТАК/НІ") type = "BOOLEAN";
        else if (type === "ДАТА") type = "TEXT";

        let fieldDef = `"${field.title}" ${type}`;
        if (field.primaryKey) fieldDef += " PRIMARY KEY";
        return fieldDef;
    });

    const foreignKeys = schema
      .filter(f => f.foreignKey && f.refTable && f.refField)
      .map(f => `FOREIGN KEY ("${f.title}") REFERENCES "${f.refTable}"("${f.refField}")`);

    const fullFieldsSQL = [...fieldsSQL, ...foreignKeys].join(", ");
    const createSQL = `CREATE TABLE "${tableName}" (${fullFieldsSQL});`;
    try {
        db.run(createSQL);
    } catch (e) {
        console.warn("Не вдалося створити таблицю:", e, createSQL);
    }

    // Вставлення даних назад (за спільними назвами полів)
    let newFieldNames = schema.map(f => f.title);
    oldData.forEach(record => {
        let insertFields = [];
        let insertValues = [];
        for (let key of newFieldNames) {
            if (key in record) {
                insertFields.push(`"${key}"`);
                insertValues.push(JSON.stringify(record[key]));
            }
        }
        if (insertFields.length > 0) {
            let insertSQL = `INSERT INTO "${tableName}" (${insertFields.join(", ")}) VALUES (${insertValues.join(", ")});`;
            try {
                db.run(insertSQL);
            } catch (e) {
                console.warn("Не вдалося вставити запис:", e, insertSQL);
            }
        }
    });

    // Оновлення або додавання таблиці до списку
    if (existingIndex !== -1) {
        database.tables[existingIndex] = table;
    } else {
        database.tables.push(table);
    }

    addTableToMenu(tableName);
    saveDatabase();
    Message("Структуру таблиці збережено.");
    closeModal();
    console.log("Table.schema=", table.schema);
}


/*
Функція addTableToMenu(tableName)
Призначення: Додає назву таблиці до списку таблиць у меню.
Параметри:
 - tableName (string): назва таблиці.
Результат: Елемент меню для редагування цієї таблиці додається до DOM.
*/
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
}

/* 
 * Відображає модальне вікно з повідомленням
 * Параметри:
 *   msg — текст повідомлення, яке потрібно показати
 * Результат: показує вікно з заданим текстом
 */
function Message(msg) {
    const modal = document.getElementById("messageModal"); // Отримати елемент модального вікна
    const content = document.getElementById("messageContent"); // Отримати блок для тексту

    content.innerText = msg; // Встановити текст повідомлення
    modal.style.display = "flex"; // Показати вікно
}

/* 
 * Приховує модальне вікно повідомлення 
 */
function closeMessage() {
    document.getElementById("messageModal").style.display = "none"; // Сховати вікно
}

/* 
 * Запит на підтвердження видалення обраної бази даних
 * Показує модальне вікно підтвердження
 */
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

/* 
 * Видаляє базу даних із localStorage
 * Після видалення оновлює список
 */
function doDeleteDb() {
    if (dbToDelete) {
        // Видалити дані бази та запити
        localStorage.removeItem(dbToDelete + ".db-data");
        localStorage.removeItem(dbToDelete + ".queries-data");

        Message(`Файл "${dbToDelete}" видалено.`); // Показати повідомлення

        closeDeleteModal();     // Закрити підтвердження
        closeStorageDialog();   // Закрити список
        showStorageDialog();    // Оновити список
    }
}

function doDeleteDb() {
    if (dbToDelete) {
        // Якщо видаляється поточна база даних — спочатку її закриваємо
        if (dbToDelete === database.fileName) {
                    // Очистити поточну базу, обнулити структуру, UI тощо           
                    // Автоматично зберегти перед закриттям
                    saveDatabase();
            
                    // Очистити всі змінні
                    db = null;
                    database.fileName = "";
                    database.tables = [];
                    database.reports = [];
                    database.relations = [];
                    database.forms = [];
            
                    queries.definitions = [];
                    queries.results = [];
            
                    const dataMenu = document.getElementById("data-menu");
                    dataMenu.innerHTML = "";
            
                    updateMainTitle(); // Змінити заголовок на "Виберіть або створіть базу даних"                    
                    updateQuickAccessPanel([], [], [], []);            
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

/* 
 * Приховує модальне вікно підтвердження видалення 
 */
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none"; // Сховати
    dbToDelete = null; // Очистити значення
}

/* 
 * Ініціалізує створення нового SQL-запиту 
 * Показує модальне вікно конструктора запиту
 */
function createQuery() {
    document.getElementById("queryName").value = "Новий запит"; // Назва за замовчуванням
    document.getElementById("queryBody").innerHTML = ""; // Очистити старі рядки
    addQueryRow(); // Додати перший рядок
    document.getElementById("queryModal").style.display = "flex"; // Показати вікно
    populateTableDropdowns(); // Заповнити випадаючі списки таблиць
}

/* 
 * Приховує модальне вікно конструктора запиту
 */
function closeQueryModal() {
    document.getElementById("queryModal").style.display = "none";
}

/* 
 * Додає новий рядок до конструктора запиту
 * Рядок містить вибір таблиці, поля, видимість, сортування, фільтр
 */
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
                    <option value="==">==</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="!=">!=</option>
                    <option value="IN">IN</option>
                    <option value="NOT IN">NOT IN</option>
                </select>
                <input type="text" class="query-criteria-input" style="flex: 1;">
            </div>
        </td>
        <td>
            <select class="query-field-role" title="Тип участі у запиті">
                <option value="select">Поле</option>
                <option value="group">Групування</option>
                <option value="count">Кількість</option>
                <option value="sum">Сума</option>
                <option value="avg">Середнє</option>
                <option value="min">Мінімальне</option>
                <option value="max">Максимальне</option>
            </select>
        </td>
        <td><button onclick="deleteQueryRow(this)">❌</button></td>
    `;

    tbody.appendChild(row);
    populateTableDropdownsForRow(row);
}


/* 
 * Видаляє рядок з конструктора запиту
 * Параметр:
 *   button — кнопка ❌, яка викликала подію
 */
function deleteQueryRow(button) {
    const row = button.closest("tr"); // Знайти відповідний рядок
    row.remove(); // Видалити рядок
}

/* 
 * Заповнює всі випадаючі списки таблиць у конструкторі запиту
 */
function populateTableDropdowns() {
    const tableSelects = document.querySelectorAll(".query-table-select"); // Всі селекти таблиць
    tableSelects.forEach(select => {
        select.innerHTML = "<option value=''>Виберіть таблицю</option>"; // Початковий варіант
        // Додаємо опцію "*"
        const starOption = document.createElement("option");
        starOption.value = "*";
        starOption.textContent = "* (Всі таблиці)";
        select.appendChild(starOption);
        database.tables.forEach(table => {
            const option = document.createElement("option");
            option.value = table.name;
            option.textContent = table.name;
            select.appendChild(option); // Додати назву таблиці
        });
    });
}

/* 
 * Заповнює список таблиць у конкретному рядку конструктора запиту
 * Параметр:
 *   row — рядок, у якому потрібно заповнити список
 */
function populateTableDropdownsForRow(row) {
    const select = row.querySelector(".query-table-select"); // Знайти select у рядку
    select.innerHTML = "<option value=''>Виберіть таблицю</option>";
    // Додаємо опцію "*"
    const starOption = document.createElement("option");
    starOption.value = "*";
    starOption.textContent = "* (Всі таблиці)";
    select.appendChild(starOption);
    database.tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.name;
        option.textContent = table.name;
        select.appendChild(option);
    });
}

/* 
 * Заповнює список полів таблиці на основі вибраної таблиці
 * Параметр:
 *   tableSelect — select-елемент з вибраною таблицею
 */
function populateFieldDropdown(tableSelect) {
    const row = tableSelect.closest("tr"); // Знайти відповідний рядок
    const fieldSelect = row.querySelector(".query-field-select"); // Select полів
    fieldSelect.innerHTML = ""; // Очистити

    const selectedTableName = tableSelect.value; // Вибрана таблиця

    if (selectedTableName === "*") {
        // Якщо вибрано "*", то поле вибору поля робимо порожнім або з пустою опцією
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = ""; // або "Немає полів"
        fieldSelect.appendChild(emptyOption);
        fieldSelect.disabled = true; // опціонально - заблокуємо вибір поля
    } else {
        fieldSelect.disabled = false;
        const selectedTable = database.tables.find(t => t.name === selectedTableName); // Знайти таблицю
        if (selectedTable) {
            fieldSelect.innerHTML = "<option value=''>Виберіть поле</option>"; // Очистити та додати початкову опцію
            selectedTable.schema.forEach(field => {
                const option = document.createElement("option");
                option.value = field.title;
                option.textContent = field.title;
                fieldSelect.appendChild(option); // Додати кожне поле
            });
        }
    }
}


/* 
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
    
function generateSqlQuery() {
    const queryName = document.getElementById("queryName").value.trim();
    const rows = document.querySelectorAll("#queryBody tr");

    let selectFields = [];
    let groupByFields = [];
    let baseTable = null;
    let joins = [];
    let whereClauses = [];
    let orderByClauses = [];
    const queryConfig = [];

    let hasSelect = false;
    let hasAggregate = false;
    let aggregateAliasCounter = 0; // лічильник для унікальних alias

    rows.forEach(row => {
        const tableSelect = row.querySelector(".query-table-select");
        const fieldSelect = row.querySelector(".query-field-select");
        const visibleCheckbox = row.querySelector(".query-visible-checkbox");
        const sortSelect = row.querySelector(".query-sort-select");
        const operatorSelect = row.querySelector(".query-operator-select");
        const criteriaInput = row.querySelector(".query-criteria-input");
        const roleSelect = row.querySelector(".query-field-role");

        const tableName = tableSelect.value;
        const fieldName = fieldSelect ? fieldSelect.value : "";
        const isVisible = visibleCheckbox.checked;
        const sortBy = sortSelect.value;
        const operator = operatorSelect.value.trim();
        let criteria = criteriaInput.value.trim();
        const fieldRole = roleSelect.value;

        // Якщо tableName = "*", тоді поле може бути пустим (агрегат без поля)
        if (tableName && (fieldName || tableName === "*")) {
            if (tableName !== "*" && !baseTable) baseTable = tableName;

            let selectExpr = "";
            let alias = "";
            let fieldExpr = "";

            if (tableName === "*") {
                // Агрегати без конкретного поля
                switch (fieldRole) {
                    case "count":
                        alias = `count_${aggregateAliasCounter++}`;
                        selectExpr = `COUNT(*) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    default:
                        // Якщо потрібно, можна додати інші агрегати без поля
                        selectExpr = "*";
                        hasSelect = true;
                        break;
                }
            } else {
                fieldExpr = `"${tableName}"."${fieldName}"`;
                switch (fieldRole) {
                    case "select":
                        selectExpr = fieldExpr;
                        hasSelect = true;
                        break;
                    case "group":
                        selectExpr = fieldExpr;
                        groupByFields.push(fieldExpr);
                        break;
                    case "count":
                        alias = `count_${aggregateAliasCounter++}`;
                        selectExpr = `COUNT(${fieldExpr}) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    case "sum":
                        alias = `sum_${aggregateAliasCounter++}`;
                        selectExpr = `SUM(${fieldExpr}) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    case "avg":
                        alias = `avg_${aggregateAliasCounter++}`;
                        selectExpr = `AVG(${fieldExpr}) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    case "min":
                        alias = `min_${aggregateAliasCounter++}`;
                        selectExpr = `MIN(${fieldExpr}) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    case "max":
                        alias = `max_${aggregateAliasCounter++}`;
                        selectExpr = `MAX(${fieldExpr}) AS ${alias}`;
                        hasAggregate = true;
                        break;
                    default:
                        selectExpr = fieldExpr;
                        hasSelect = true;
                        break;
                }
            }

            if (isVisible && selectExpr) {
                selectFields.push(selectExpr);
            }

            // WHERE умова можна застосувати лише якщо є конкретне поле (не "*")
            if (tableName !== "*" && criteria.length > 0 && operator.length > 0) {
                const fieldType = getFieldType(tableName, fieldName);
                let processedCriteria = criteria;

                if (fieldType === "Так/Ні") {
                    let value = processedCriteria.toLowerCase();
                    if (["так", "true", "1"].includes(value)) value = "1";
                    else if (["ні", "false", "0"].includes(value)) value = "0";
                    processedCriteria = `${operator} ${value}`;
                } else if (fieldType === "Дата") {
                    const match = processedCriteria.match(/^([0-9]{2})[.\-\/]([0-9]{2})[.\-\/]([0-9]{4})$/);
                    if (match) {
                        const [ , dd, mm, yyyy ] = match;
                        const isoDate = `${yyyy}-${mm}-${dd}`;
                        processedCriteria = `${operator} '${isoDate}'`;
                    } else {
                        processedCriteria = `${operator} '${processedCriteria}'`;
                    }
                } else {
                    processedCriteria = isNaN(processedCriteria)
                        ? `${operator} '${processedCriteria}'`
                        : `${operator} ${processedCriteria}`;
                }

                whereClauses.push(`${fieldExpr} ${processedCriteria}`);
            }

            if (sortBy) {
                if (alias) {
                    orderByClauses.push(`${alias} ${sortBy}`);
                } else if (tableName !== "*") {
                    orderByClauses.push(`${fieldExpr} ${sortBy}`);
                } else {
                    // Якщо tableName = "*", але сортування є — сортуємо за alias якщо є, або пропускаємо
                    // Тут можна додати логіку, якщо потрібно
                }
            }

            queryConfig.push({
                tableName,
                fieldName,
                isVisible,
                sortBy,
                operator,
                criteria,
                fieldRole,
                alias
            });
        }
    });

    // JOIN-зв’язки
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

    // Якщо baseTable не вказано і є хоча б один рядок з реальною таблицею
    if (!baseTable) {
        // Спроба встановити базову таблицю з JOIN-ів, якщо є
        if (joins.length > 0) {
            baseTable = joins[0].table;
        } else {
            Message("Не вказано базову таблицю для FROM.");
            return;
        }
    }

    // Побудова SQL-запиту
    let sql = `SELECT ${selectFields.join(", ")}`;
    sql += `\nFROM "${baseTable}"`;

    joins.forEach(join => {
        sql += `\nJOIN "${join.table}" ON ${join.condition}`;
    });

    if (whereClauses.length > 0) {
        sql += `\nWHERE ${whereClauses.join(" AND ")}`;
    }

    if (groupByFields.length > 0) {
        sql += `\nGROUP BY ${groupByFields.join(", ")}`;
    } else if (hasSelect && hasAggregate) {
        // Якщо є агрегати і вибіркові поля без групування — додати всі select поля (окрім агрегатів) у GROUP BY
        const groupByFromSelects = selectFields
            .filter(f => !f.match(/^(COUNT|SUM|AVG|MIN|MAX)\(/i)) // виключити агрегати
            .map(f => {
                // Прибрати псевдоніми, якщо є
                const aliasMatch = f.match(/ AS (.+)$/i);
                if (aliasMatch) {
                    return aliasMatch[1];
                }
                return f;
            });
        if (groupByFromSelects.length > 0) {
            sql += `\nGROUP BY ${groupByFromSelects.join(", ")}`;
        }
    }

    if (orderByClauses.length > 0) {
        sql += `\nORDER BY ${orderByClauses.join(", ")}`;
    }

    const queryDefinition = {
        name: queryName,
        config: queryConfig,
        joins: joins,
        sql: sql
    };

    const existingQueryIndex = queries.definitions.findIndex(q => q.name === queryName);
    if (existingQueryIndex !== -1) {
        queries.definitions[existingQueryIndex] = queryDefinition;
    } else {
        queries.definitions.push(queryDefinition);
    }
    saveDatabase();

    document.getElementById("generatedSql").innerText = sql;
    document.getElementById("sqlModal").style.display = "flex";
}




    


    function closeSqlModal() {
        document.getElementById("sqlModal").style.display = "none";
    }

    let pendingQueryText = "";
    let pendingPlaceholders = [];
    let pendingQueryName = "";
    let currentPlaceholderIndex = 0;
    
    function showNextParameterPrompt() {
        if (currentPlaceholderIndex >= pendingPlaceholders.length) {
            executeFinalSqlQuery();
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
    

    function validateSqlQuery(sql) {
        try {
            const errors = [];
    
            // 1. Прибрати розриви рядків (у лапкованих назвах це може зламати аналіз)
            sql = sql.replace(/\s+/g, ' ').trim();
    
            // 2. Побудова map таблиць -> полів
            const tableMap = new Map();
            database.tables.forEach(table => {
                const fieldTitles = table.schema.map(col => col.title);
                tableMap.set(table.name, fieldTitles);
            });
    
            // 3. Отримати назву таблиці з FROM
            const fromMatch = sql.match(/FROM\s+["'`](.*?)["'`]/i);
            if (!fromMatch) {
                Message("Не вказано таблицю в запиті.");
                return false;
            }
            
            const tableName = fromMatch[1].trim();
            if (!tableMap.has(tableName)) {
                Message(`Таблиця "${tableName}" не існує.`);
                return false;
            }
    
            const currentFields = tableMap.get(tableName);
    
            // 4. Витягнути всі лапковані поля, крім назви таблиці з FROM
            const allMatches = [...sql.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    
            // Видалити назву таблиці, бо вона теж лапкована, але не є полем
            const fieldNames = allMatches.filter(name => name !== tableName);
    
            // 5. Уникнути дублювання полів (може бути одне й те саме поле в SELECT та WHERE)
            const uniqueFieldNames = [...new Set(fieldNames)];
    
            for (const field of uniqueFieldNames) {
                if (!currentFields.includes(field)) {
                    errors.push(`Поле "${field}" не існує в таблиці "${tableName}".`);
                }
            }
    
            if (errors.length > 0) {
                Message("Помилка в запиті:\n" + errors.join("\n"));
                return false;
            }
    
            return true;
        } catch (err) {
            Message("Неможливо проаналізувати запит: " + err.message);
            return false;
        }
    }
    
    
    

    function executeSqlQuery() {
        const sqlQuery = document.getElementById("generatedSql").innerText;
        const queryName = document.getElementById("queryName").value.trim();
        pendingQueryName = queryName;
    
        const matches = [...sqlQuery.matchAll(/\[([^\]]+)\]/g)];
        const uniquePlaceholders = [...new Set(matches.map(m => m[1]))];
    
        if (uniquePlaceholders.length > 0) {
            pendingQueryText = sqlQuery;
            pendingPlaceholders = uniquePlaceholders;
            currentPlaceholderIndex = 0;
            showNextParameterPrompt();
        } else {
            pendingQueryText = sqlQuery;
            executeFinalSqlQuery();
        }
    }

function executeFinalSqlQuery() {
    const internalQueryName = `запит "${pendingQueryName}"`;
    const menuDisplayName = `*${internalQueryName}`;

    try {
        if (!validateSqlQuery(pendingQueryText)) return;
        const res = db.exec(pendingQueryText); 
        
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

            addTableToMenu(menuDisplayName);
            Message(`Запит виконано успішно.\nЗнайдено ${dataRows.length} відповідних записів`);
            closeSqlModal();
            closeQueryModal();
            editData(menuDisplayName);
        } else {
            Message("Запит виконано, але результат порожній.");
            closeSqlModal();
        }
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

    // Відновлення рядків полів
    queryDefinition.config.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><select class="query-table-select" onchange="populateFieldDropdown(this)"></select></td>
            <td><select class="query-field-select"></select></td>
            <td><input type="checkbox" class="query-visible-checkbox"></td>
            <td>
                <select class="query-sort-select">
                    <option value="">Невпорядковано</option>
                    <option value="ASC">За зростанням</option>
                    <option value="DESC">За спаданням</option>
                </select>
            </td>
            <td>
                <div style="display: flex; gap: 4px;">
                    <select class="query-operator-select">
                        <option value="==">==</option>
                        <option value="<"><</option>
                        <option value="<="><=</option>
                        <option value=">">></option>
                        <option value=">=">>=</option>
                        <option value="!=">!=</option>
                        <option value="IN">IN</option>
                        <option value="NOT IN">NOT IN</option>
                    </select>
                    <input type="text" class="query-criteria-input">
                </div>
            </td>
            <td>
                <select class="query-field-role" title="Тип участі у запиті">
                    <option value="select">Поле</option>
                    <option value="group">Групування</option>
                    <option value="count">Кількість</option>
                    <option value="sum">Сума</option>
                    <option value="avg">Середнє</option>
                    <option value="min">Мінімальне</option>
                    <option value="max">Максимальне</option>
                </select>
            </td>
            <td><button onclick="deleteQueryRow(this)">❌</button></td>
        `;
        queryBody.appendChild(row);

        // Заповнити випадаючі списки
        populateTableDropdownsForRow(row);
        row.querySelector(".query-table-select").value = item.tableName;
        populateFieldDropdown(row.querySelector(".query-table-select"));
        row.querySelector(".query-field-select").value = item.fieldName;
        row.querySelector(".query-visible-checkbox").checked = item.isVisible;
        row.querySelector(".query-sort-select").value = item.sortBy;

        const operatorSelect = row.querySelector(".query-operator-select");
        const criteriaInput = row.querySelector(".query-criteria-input");

        // Визначаємо оператор і критерій з item.criteria
        const opMatch = item.criteria?.match(/^(\!\=|\>\=|\<\=|\=\=|\<|\>|\bIN\b|\bNOT IN\b)?\s*(.*)$/i);
        if (opMatch) {
            const [, operator = "==", value = ""] = opMatch;
            operatorSelect.value = operator.trim();
            criteriaInput.value = value.trim();
        } else {
            operatorSelect.value = "==";
            criteriaInput.value = item.criteria;
        }

        // Встановлюємо роль поля (важливо!)
        const roleSelect = row.querySelector(".query-field-role");
        roleSelect.value = item.fieldRole || "select";
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
            const resultIndex = queries.results.findIndex(r => r.name === `запит "${deletedQuery_name}"`); // Find the result by its internal name
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

        saveDatabase();
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


    // New function for Report Creator
    let isGridVisible = false; // Track grid visibility

    function createReport(report = null) {
        const modal = document.getElementById("reportBuilderModal");
        const canvas = document.getElementById("reportCanvas");
        const nameInput = document.getElementById("reportNameInput");
        document.getElementById("reportTitle").textContent = "Створення звіту";

        canvas.innerHTML = ""; // Очистити старі елементи
        populateFieldPanelTableSelect();

        if (report) {
            nameInput.value = report.name || "Звіт без назви";
            document.getElementById("reportTitle").textContent = "Редагування звіту";

            report.elements.forEach(el => {
                const div = document.createElement("div");
                console.log("el.x,el.y=", el.x, el.y)
                div.classList.add("report-element");

                if (el.type === "label") {
                    div.classList.add("report-label");
                    div.innerText = el.text || "Напис";

                    // Робимо текст редагованим
                    div.contentEditable = true;
                    div.style.cursor = "text";

                    // (опціонально) — можна відловлювати Enter і Blur
                    div.addEventListener("keydown", (e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            div.blur();
                        }
                    });
                } else if (el.type === "field") {
                    div.classList.add("report-field");
                    const textDiv = document.createElement("div");
                    textDiv.classList.add("field-text");
                    textDiv.innerText = `${el.tableName}.${el.fieldName}`;

                    div.dataset.tableName = el.tableName;
                    div.dataset.fieldName = el.fieldName;

                    div.appendChild(textDiv);
                }

                Object.assign(div.style, {
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
                    backgroundColor: "transparent",
                    padding: "5px",
                    cursor: "move"
                });
                initializeReportElement(div);
                addResizeHandles(div);
                canvas.appendChild(div);
            });
        } else {
            nameInput.value = "Новий звіт";
        }

        reportCreatorModal.style.display = "flex";
    }
    
    function populateFieldPanelTableSelect() {
            fieldPanelTableSelect.innerHTML = "<option value=''>Виберіть таблицю або запит</option>";
            console.log("queries.results=",queries.results)
            // Таблиці
            database.tables.forEach(table => {
                const option = document.createElement("option");
                option.value = table.name;
                option.textContent = table.name;
                fieldPanelTableSelect.appendChild(option);
            });
        
            // Запити
            queries.results.forEach(query => {
                const option = document.createElement("option");
                option.value = `*${query.name}`;
                option.textContent = `*${query.name}`; // Наприклад: *запит "Успішність"
                fieldPanelTableSelect.appendChild(option);
            });
        }

    let resizing = false;
    let resizeElement = null;
    let startX, startY, startWidth, startHeight;
    
    function startResize(e) {
        e.stopPropagation(); // Щоб не активувався drag
        e.preventDefault();
        resizing = true;
        resizeElement = e.target.parentElement;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = resizeElement.offsetWidth;
        startHeight = resizeElement.offsetHeight;
    
        document.addEventListener("mousemove", doResize);
        document.addEventListener("mouseup", stopResize);
    }
    
    function doResize(e) {
        if (!resizing || !resizeElement) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
    
        // Можна ускладнити для кожного кута, але спростимо:
        resizeElement.style.width = (startWidth + dx) + "px";
        resizeElement.style.height = (startHeight + dy) + "px";
    }
    
    function stopResize() {
        resizing = false;
        resizeElement = null;
        document.removeEventListener("mousemove", doResize);
        document.removeEventListener("mouseup", stopResize);
    }

    function addResizeHandles(element) {
        const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
        positions.forEach(pos => {
            const handle = document.createElement("div");
            handle.classList.add("resize-handle", pos);
            handle.addEventListener("mousedown", startResize); // 👈 ДОДАЙ ЦЕ
            element.appendChild(handle);
        });
    }
    

    // ******************
    function initializeReportElement(el) {
        el.classList.add("report-element");
        el.style.cursor = "grab";

        el.onmousedown = function(e) {
            const reportCanvas = document.getElementById("reportCanvas");                     
            const fieldSelectionModal = document.getElementById("fieldSelectionModal");
            
            const handle = e.target.closest(".resize-handle");
            activeElement = el;
            document.querySelectorAll(".report-element").forEach(el => {
                el.classList.remove("selected");
                el.querySelectorAll(".resize-handle").forEach(h => h.remove()); // прибрати маркери
            });
            document.querySelectorAll(".report-element.selected").forEach(el => el.classList.remove("selected"));
            el.classList.add("selected");
            addResizeHandles(el);                     
            closeTextOptionsModal();

            const rect = el.getBoundingClientRect();
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;
            initialWidth = rect.width;
            initialHeight = rect.height;
            initialX = e.clientX;
            initialY = e.clientY;

            if (handle) {
                isResizing = true;
                resizeHandle = handle;
                el.style.cursor = handle.style.cursor;
            } else {
                isDragging = true;
                el.style.cursor = "grabbing";

                const BORDER_TOLERANCE = 10;
                const elementRect = el.getBoundingClientRect();
                const relativeClickX = e.clientX - elementRect.left;
                const relativeClickY = e.clientY - elementRect.top;

                const nearLeft = relativeClickX < BORDER_TOLERANCE;
                const nearRight = elementRect.width - relativeClickX < BORDER_TOLERANCE;
                const nearTop = relativeClickY < BORDER_TOLERANCE;
                const nearBottom = elementRect.height - relativeClickY < BORDER_TOLERANCE;

                if (el.classList.contains("report-label")) {
                    if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                        isDragging = false;
                        el.focus();
                    }
                } else if (el.classList.contains("report-field")) {
                    if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                        document.getElementById("fieldSelectionModal").style.display = "flex";
                        populateFieldSelectionPanel();
                        isDragging = false;
                    } else {
                        fieldSelectionModal.style.display = "none";
                    }
                }
            }

            if (isDragging || isResizing || (el.classList.contains("report-label") && !isDragging)) {
                e.preventDefault();
            }
        };
    }

    //*******************
    function cancelFieldSelection() {
        document.getElementById("fieldSelectionModal").style.display = "none";
    }
    function closeReportCreatorModal() {
        document.getElementById("reportCreatorModal").style.display = "none";                
        // Ensure grid is off when closing report creator
        document.getElementById("reportCanvas").classList.remove('grid-visible');
        isGridVisible = false;
    }

    let activeElement = null; // The element currently being dragged or resized
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let initialX, initialY; // Initial mouse position
    let initialLeft, initialTop, initialWidth, initialHeight; // Initial element properties

    // Ensure DOM is loaded before attempting to access reportCanvas
    document.addEventListener('DOMContentLoaded', () => {
        const reportCanvas = document.getElementById("reportCanvas");
        const fieldSelectionModal = document.getElementById("fieldSelectionModal");        
        const fieldPanelTableSelect = document.getElementById("fieldPanelTableSelect");
        const fieldPanelFieldSelect = document.getElementById("fieldPanelFieldSelect");
        

        reportCanvas.addEventListener("mousedown", (e) => {
            // Check if the click is on an element or a resize handle
            const element = e.target.closest(".report-element");
            const handle = e.target.closest(".resize-handle");

            // Deselect all elements first and hide field selection panel
            document.querySelectorAll(".report-element.selected").forEach(el => {
                el.classList.remove("selected");
            });
            closeTextOptionsModal(); // Close text options modal on canvas click or new element selection


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
                    element.style.cursor = handle.style.cursor; // Set cursor for the element during resize
                } else { // No handle, so it's a click on the element itself for drag or edit
                    // Default action for click on element: assume drag
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
                            // Click is inside and not near a border, allow editing
                            isDragging = false; // Prevent dragging
                            element.focus(); // Focus for editing
                        } else {
                            // Click is near border, allow dragging (isDragging remains true)
                            // No additional action needed, fall through to default drag setup
                        }
                    } else if (activeElement.classList.contains("report-field")) {
                        if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
                            // Click is inside and not near a border, show panel                           
                            
                            populateFieldSelectionPanel();
                            fieldSelectionModal.style.display = "flex";
                            isDragging = false; // Prevent dragging when panel is shown for field selection
                        } else {
                            // Click is near border, allow dragging (isDragging remains true)       
                            fieldSelectionModal.style.display = "none"; // Ensure panel is hidden
                        }
                    }
                }
                // Prevent default browser drag behavior (e.g., for images or text selection)
                // if we are actively dragging, resizing, or initiating a custom edit
                if (isDragging || isResizing || (activeElement.classList.contains("report-label") && !isDragging)) {
                    e.preventDefault();
                }

            } else {
                activeElement = null; // No element selected
            }
        });

        reportCanvas.addEventListener("mousemove", (e) => {
            if (!activeElement) return;

            if (isDragging) {
                const dx = e.clientX - initialX;
                const dy = e.clientY - initialY;

                activeElement.style.left = `${initialLeft + dx}px`;
                activeElement.style.top = `${initialTop + dy}px`;
            } else if (isResizing) {
                const dx = e.clientX - initialX;
                const dy = e.clientY - initialY;

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
            if (activeElement) {
                activeElement.style.cursor = "grab"; // Reset cursor
            }
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        });

        // Populate the field selection panel when a table is selected
        fieldPanelTableSelect.addEventListener("change", () => {
            const selectedTableName = fieldPanelTableSelect.value;            
            const selectedTable =
                    database.tables.find(t => t.name === selectedTableName) ||
                    queries.results.find(q => `*${q.name}` === selectedTableName);


            fieldPanelFieldSelect.innerHTML = "<option value=''>Виберіть поле</option>";

            if (selectedTable) {
                selectedTable.schema.forEach(field => {
                    const option = document.createElement("option");
                    option.value = field.title;
                    option.textContent = field.title;
                    fieldPanelFieldSelect.appendChild(option);
                });
            }

            // ⛔ НЕ скидати fieldName автоматично — лише при явній зміні таблиці
            if ((activeElement && activeElement.classList.contains("report-field"))||(activeElement && activeElement.classList.contains("form-field"))) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    // Якщо поле вже є — залишаємо, інакше оновлюємо тільки table
                    const currentField = activeElement.dataset.fieldName || "";
                    fieldTextDiv.innerText = selectedTableName ? `${selectedTableName}.${currentField}` : "Поле даних";
                }
                activeElement.dataset.tableName = selectedTableName;
            }
        });


        // Update the active element's text when a field is selected
        fieldPanelFieldSelect.addEventListener("change", () => {
            const selectedTableName = fieldPanelTableSelect.value;
            const selectedFieldName = fieldPanelFieldSelect.value;
            if ((activeElement && activeElement.classList.contains("report-field") && selectedTableName && selectedFieldName)||(activeElement && activeElement.classList.contains("form-field") && selectedTableName && selectedFieldName)) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = `${selectedTableName}.${selectedFieldName}`;
                }
                activeElement.dataset.tableName = selectedTableName;
                activeElement.dataset.fieldName = selectedFieldName;
            } else if ((activeElement && activeElement.classList.contains("report-field"))||(activeElement && activeElement.classList.contains("report-field"))) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = fieldPanelTableSelect.value ? `${fieldPanelTableSelect.value}.` : "Поле даних";
                }
                delete activeElement.dataset.fieldName;
            }
        });

       

        // Text options modal listeners
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
    }); // End DOMContentLoaded

    // Helper to populate the field selection panel when a report-field is selected
    function populateFieldSelectionPanel() {
        const fieldSelectionModal = document.getElementById("fieldSelectionModal");
        const fieldPanelTableSelect = document.getElementById("fieldPanelTableSelect");
        const fieldPanelFieldSelect = document.getElementById("fieldPanelFieldSelect");        
        const reportCanvas = document.getElementById("reportCanvas");

        fieldPanelTableSelect.innerHTML = "<option value=''>Виберіть таблицю</option>";
        database.tables.forEach(table => {
            const option = document.createElement("option");
            option.value = table.name;
            option.textContent = table.name;
            fieldPanelTableSelect.appendChild(option);
            console.log("table=", table.name)
        });
        // Запити
        queries.results.forEach(query => {
            const option = document.createElement("option");
            option.value = `*${query.name}`;
            option.textContent = `*${query.name}`; // Наприклад: *запит "Успішність"
            fieldPanelTableSelect.appendChild(option);
        });

        // Set initial values if activeElement has data- attributes
        if (activeElement && activeElement.dataset.tableName) {
            fieldPanelTableSelect.value = activeElement.dataset.tableName;
            // Manually trigger change to populate fieldSelect
            const event = new Event('change');
            fieldPanelTableSelect.dispatchEvent(event);
        } else {
            fieldPanelTableSelect.value = ""; // Clear selection
        }

        if (activeElement && activeElement.dataset.fieldName) {
            fieldPanelFieldSelect.value = activeElement.dataset.fieldName;
        } else {
            fieldPanelFieldSelect.value = ""; // Clear selection
        }

        // Show popup message

    }


    function addReportLabel() {
        const reportCanvas = document.getElementById("reportCanvas");
        const labelElement = document.createElement("div");
        labelElement.className = "report-element report-label";
        labelElement.style.left = "50px";
        labelElement.style.top = "50px";
        labelElement.style.width = "150px";
        labelElement.style.height = "50px";
        labelElement.contentEditable = "true";
        labelElement.innerText = "Новий напис";

        // Add resize handles (simplified)
        labelElement.innerHTML += `
            <div class="resize-handle top-left"></div>
            <div class="resize-handle top-right"></div>
            <div class="resize-handle bottom-left"></div>
            <div class="resize-handle bottom-right"></div>
        `;

        reportCanvas.appendChild(labelElement);
        Message("Елемент 'Напис' додано. Клацніть всередині нього (подалі від країв), щоб відредагувати текст, або перетягніть.");
    }

    function addReportField() {
        const reportCanvas = document.getElementById("reportCanvas");
        const fieldElement = document.createElement("div");
        fieldElement.className = "report-element report-field";
        fieldElement.style.left = "200px";
        fieldElement.style.top = "100px";
        fieldElement.style.width = "200px";
        fieldElement.style.height = "60px";

        // Create an inner div for text content to preserve resize handles
        const fieldTextDiv = document.createElement("div");
        fieldTextDiv.className = "field-text";
        fieldTextDiv.innerText = "Поле даних";
        fieldElement.appendChild(fieldTextDiv);

        // Add resize handles
        fieldElement.innerHTML += `
            <div class="resize-handle top-left"></div>
            <div class="resize-handle top-right"></div>
            <div class="resize-handle bottom-left"></div>
            <div class="resize-handle bottom-right"></div>
        `;

        reportCanvas.appendChild(fieldElement);
        Message("Елемент 'Поле' додано. Клацніть всередині нього (подалі від країв), щоб обрати таблицю та поле.");
    }


    function addReportGrid() {
        const reportCanvas = document.getElementById("reportCanvas");
        if (isGridVisible) {
            reportCanvas.classList.remove('grid-visible');
            Message("Сітка прихована.");
        } else {
            reportCanvas.classList.add('grid-visible');
            Message("Сітка відображена.");
        }
        isGridVisible = !isGridVisible; // Toggle the state
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
            const table = findTableOrQuery(tableName);  // 🆕 універсально
        
            if (table && table.data.length > 0) {
                const colIndex = table.schema.findIndex(col => col.title === fieldName);
                if (colIndex !== -1) {
                    lines = table.data.map(row => row[colIndex] ?? "");
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

        const canvasRect = canvas.getBoundingClientRect();

        relationLines.forEach(line => {
            const fromRect = line.from.getBoundingClientRect();
            const toRect = line.to.getBoundingClientRect();

            const fromCenterX = fromRect.left + fromRect.width / 2 - canvasRect.left;
            const toCenterX = toRect.left + toRect.width / 2 - canvasRect.left;

            const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
            const toY = toRect.top + toRect.height / 2 - canvasRect.top;

            const H_OFFSET = 12; // горизонтальний зсув від точки

            let fromX, toX, fromDir, toDir;

            if (fromCenterX < toCenterX) {
                // Зліва направо
                fromX = fromRect.left + fromRect.width - canvasRect.left;
                toX = toRect.left - canvasRect.left;
                fromDir = +1;
                toDir = -1;
            } else {
                // Справа наліво
                fromX = fromRect.left - canvasRect.left;
                toX = toRect.left + toRect.width - canvasRect.left;
                fromDir = -1;
                toDir = +1;
            }

            // Ламана: 5 точок
            const p1 = {
                x: fromX,
                y: fromY
            }; // вихід з поля
            const p2 = {
                x: fromX + fromDir * H_OFFSET,
                y: fromY
            }; // горизонтальний зсув
            const p3 = {
                x: p2.x,
                y: toY
            }; // вертикальний до рівня to
            const p4 = {
                x: toX + toDir * H_OFFSET,
                y: toY
            }; // горизонтальний до to
            const p5 = {
                x: toX,
                y: toY
            }; // вхід в to

            const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            const points = [p1, p2, p3, p4, p5].map(p => `${p.x},${p.y}`).join(" ");
            path.setAttribute("points", points);
            path.setAttribute("fill", "none");
            //path.setAttribute("stroke", "#3498db");
            path.setAttribute("stroke", line.color || "#3498db");
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

        // Додай SQLite базу
        const dbData = db.export();
        zip.file("database.sqlite", dbData);

        // Додай запити
        const queriesJson = JSON.stringify(queries.definitions, null, 2);
        zip.file("queries.json", queriesJson);

        // Додай звіти
        const reportsJson = JSON.stringify(database.reports, null, 2);
        zip.file("reports.json", reportsJson);
        
        // Додай результати запитів
        zip.file("query-results.json", JSON.stringify(queries.results || []));


        // Генеруємо архів і завантажуємо
        const content = await zip.generateAsync({
            type: "blob"
        });
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
        // Відновити запити
        const queriesText = await zip.file("queries.json").async("string");
        queries.definitions = JSON.parse(queriesText);

        // Відновити звіти
        const reportsText = await zip.file("reports.json").async("string");
        database.reports = JSON.parse(reportsText);
        
        // 🆕 Відновити результати запитів (якщо є)
        if (zip.file("query-results.json")) {
                const resultsText = await zip.file("query-results.json").async("string");
                queries.results = JSON.parse(resultsText);
                console.log("Результати запитів імпортовано з DTA");
            } else {
                queries.results = [];
        }

        // Оновити меню даних
        database.tables = [];
        const res = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table';");
        if (res.length > 0) {
            const tableRows = res[0].values;
            tableRows.forEach(([name, sql]) => {
                if (name.startsWith("sqlite_")) return;
                const match = sql.match(/\((.+)\)/s);
                if (!match) return;
                const schemaText = match[1];
                const schemaParts = schemaText.split(",").map(s => s.trim());
                const schema = schemaParts.map(part => {
                    const [titleRaw, typeRaw, ...rest] = part.split(/\s+/);
                    return {
                        title: titleRaw.replace(/"/g, ''),
                        type: typeRaw === "INTEGER" ? "Ціле число" : typeRaw === "REAL" ? "Дробове число" : typeRaw === "BOOLEAN" ? "Так/Ні" : typeRaw === "TEXT" ? "Текст" : typeRaw,
                        primaryKey: rest.includes("PRIMARY") || rest.includes("PRIMARY KEY"),
                        comment: rest.includes("PRIMARY") ? "Первинний ключ" : ""
                    };
                });

                const selectRes = db.exec(`SELECT * FROM "${name}"`);
                const dataRows = selectRes.length ? selectRes[0].values : [];

                database.tables.push({
                    name,
                    schema,
                    data: dataRows
                });
            });
        }

        // Оновити меню
        document.getElementById("data-menu").innerHTML = "";
        database.tables.forEach(t => addTableToMenu(t.name));
        queries.results.forEach(q => {
                addTableToMenu(`*${q.name}`);
        });

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

    //


    let currentFormRecordIndex = 0; // For form viewer navigation
    let selectedFormName = null; // To keep track of the selected form in the saved forms dialog

    // createForm function
    function createForm() {
        document.getElementById("formCreatorModal").style.display = "flex";
        document.getElementById("formNameInput").value = "Нова форма";
        document.getElementById("formCanvas").innerHTML = "";
        document.getElementById("fieldSelectionModal").style.display = "none";        
        document.getElementById("formCanvas").classList.remove('grid-visible');
        isGridVisible = false;


    }


    function closeFormModal() {
        document.getElementById("formCreatorModal").style.display = "none";
        // Ensure the field selection panel is hidden when closing the modal
        document.getElementById("fieldSelectionModal").style.display = "none";        
        // Ensure grid is off when closing report creator
        document.getElementById("formCanvas").classList.remove('grid-visible');
        isGridVisible = false;

    }
    //*******************************************************************************

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
//
//
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
    //
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
            const resultIndex = queries.results.findIndex(r => r.name === `запит "${deletedQuery_name}"`); // Find the result by its internal name
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
    //
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

        const formNameInput = document.getElementById("formNameInput");
        const formCanvas = document.getElementById("formCanvas");

        formNameInput.value = form.name;
        formCanvas.innerHTML = "";

        form.elements.forEach(el => {
            const div = document.createElement("div");
            div.classList.add("form-element");
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
            console.log("el(edit)=", el)
            if (el.type === "field") {
                div.classList.add("form-field");
                div.dataset.fieldName = el.fieldName;
                div.dataset.tableName = el.tableName;
                div.style.border = "1px dashed green";
                div.style.backgroundColor = "rgba(144, 238, 144, 0.3)";

                const fieldText = document.createElement("div");
                fieldText.classList.add("field-text");
                fieldText.innerText = `${el.tableName}.${el.fieldName}`;
                div.appendChild(fieldText);
            } else if (el.type === "label") {
                div.classList.add("form-label");
                div.contentEditable = "true";
                div.innerText = el.text;
                div.style.border = "1px dashed gray";
                div.style.backgroundColor = "rgba(240,240,240,0.8)";
            }

            formCanvas.appendChild(div);
        });

        // Показати конструктор форми, якщо він прихований
        document.getElementById("formCreatorModal").style.display = "flex";

        Message(`Форма "${form.name}" завантажена для редагування.`);
    }


    //


    function closeFormModal() {
        document.getElementById("formCreatorModal").style.display = "none";
        // selectFormElement(null); // Deselect any active element
    }

    // Functions for managing saved forms (assuming showSavedFormsDialog, openSelectedFormForEdit, deleteSelectedForm are called from elsewhere, e.g., a menu)
    function showSavedFormsDialog() {
        // This modal and its elements are not in the provided index.html snippet.
        // Assuming such a modal (e.g., id="savedFormsModal" with list id="savedFormsList") exists or will be handled externally.
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

    //


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
        previewSavedForm(form);
    }


    // Form Viewer
    let currentViewedForm = null;
    let currentFormDataTable = null;
    let currentFormData = [];

    function previewSavedForm(form) {
        const previewModal = document.getElementById("formPreviewModal");
        const previewCanvas = document.getElementById("formPreviewCanvas");

        console.log("form =", form);
        console.log("form.elements =", form.elements);
        console.log(database.forms);

        previewCanvas.innerHTML = "";
        currentFormRecordIndex = 0;
        document.getElementById("formPreviewTitle").innerText = `${form.name} — запис #1`;

        const table = database.tables.find(t => t.name === form.table);
        const record = table?.data?.[0] || [];

        form.elements.forEach(el => {
            if (el.type === "field") {
                const table = database.tables.find(t => t.name === el.tableName);
                const record = table?.data?.[currentFormRecordIndex] || [];
                const colIndex = table?.schema.findIndex(c => c.title === el.fieldName);

                const input = document.createElement("input");
                input.type = "text";
                input.style.position = "absolute";
                input.style.left = el.left + "px";
                input.style.top = el.top + "px";
                input.style.width = el.width + "px";
                input.style.height = el.height + "px";
                input.style.fontFamily = el.fontFamily;
                input.style.fontSize = el.fontSize;
                input.style.fontWeight = el.fontWeight;
                input.style.fontStyle = el.fontStyle;
                input.style.textDecoration = el.textDecoration;
                input.style.color = el.color;
                input.style.background = "#ccc";
                input.style.padding = "2px";
                input.style.borderStyle = "inset";
                input.style.borderWidth = "3px";
                input.style.borderColor = "#888";
                input.style.overflow = "hidden";
                input.style.whiteSpace = "nowrap";

                input.dataset.tableName = el.tableName;
                input.dataset.fieldName = el.fieldName;
                input.dataset.colIndex = colIndex;

                input.value = colIndex !== -1 ? (record?.[colIndex] ?? "") : "Поле не знайдено";

                previewCanvas.appendChild(input);
            } else if (el.type === "label") {
                const label = document.createElement("div");
                label.innerText = el.text || "";
                label.style.position = "absolute";
                label.style.left = el.left + "px";
                label.style.top = el.top + "px";
                label.style.width = el.width + "px";
                label.style.height = el.height + "px";
                label.style.fontFamily = el.fontFamily;
                label.style.fontSize = el.fontSize;
                label.style.fontWeight = el.fontWeight;
                label.style.fontStyle = el.fontStyle;
                label.style.textDecoration = el.textDecoration;
                label.style.color = el.color;
                label.style.padding = "5px";
                label.style.border = "none";
                label.style.background = "transparent";
                label.style.overflow = "hidden";
                label.style.whiteSpace = "nowrap";
                label.contentEditable = "true";

                previewCanvas.appendChild(label);
            }
        });


        previewModal.style.display = "flex";
    }



    function addFormLabel() {
        const formCanvas = document.getElementById("formCanvas");
        const labelElement = document.createElement("div");
        labelElement.className = "form-element form-label";
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
        labelElement.contentEditable = "true";
        labelElement.innerText = "Новий напис";

        // Додати кутові маркери
        labelElement.innerHTML += `
        <div class="resize-handle top-left"></div>
        <div class="resize-handle top-right"></div>
        <div class="resize-handle bottom-left"></div>
        <div class="resize-handle bottom-right"></div>
    `;

        formCanvas.appendChild(labelElement);
    }

    let selectedFormField = null;

    function addFormField() {
        const formCanvas = document.getElementById("formCanvas");
        const fieldElement = document.createElement("div");
        fieldElement.className = "form-element form-field";
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

        // Додати resize-маркери
        fieldElement.innerHTML += `
        <div class="resize-handle top-left"></div>
        <div class="resize-handle top-right"></div>
        <div class="resize-handle bottom-left"></div>
        <div class="resize-handle bottom-right"></div>
        <div class="field-text">Поле</div>
    `;

        // Обробник вибору поля
        fieldElement.addEventListener("click", () => {
            selectedFormField = fieldElement;
            //showFieldSelectionPanel();
        });

        formCanvas.appendChild(fieldElement);
    }




    let formGridVisible = false;

    function addFormGrid() {
        const formCanvas = document.getElementById("formCanvas");
        if (formGridVisible) {
            formCanvas.style.backgroundImage = "none";
        } else {
            formCanvas.style.backgroundImage =
                "repeating-linear-gradient(0deg, #ccc 0, #ccc 1px, transparent 1px, transparent 19px), " +
                "repeating-linear-gradient(90deg, #ccc 0, #ccc 1px, transparent 1px, transparent 19px)";
            formCanvas.style.backgroundSize = "20px 20px";
        }
        formGridVisible = !formGridVisible;
    }

    function previewForm() {
        const formName = document.getElementById("formNameInput").value.trim();
        const previewModal = document.getElementById("formPreviewModal");
        const previewCanvas = document.getElementById("formPreviewCanvas");

        previewCanvas.innerHTML = "";
        document.getElementById("formPreviewTitle").innerText = `${formName} — запис #${currentFormRecordIndex + 1}`;

        const elements = [...document.querySelectorAll("#formCanvas .form-label, #formCanvas .form-field")];
        elements.forEach(el => {
            if (el.classList.contains("form-field")) {
                const tableName = el.dataset.tableName;
                const fieldName = el.dataset.fieldName;
                const table = database.tables.find(t => t.name === tableName);

                const input = document.createElement("input");
                input.type = "text";
                input.style.position = "absolute";
                input.style.left = el.style.left;
                input.style.top = el.style.top;
                input.style.width = el.style.width;
                input.style.height = el.style.height;
                input.style.fontFamily = el.style.fontFamily || 'Arial';
                input.style.fontSize = el.style.fontSize || '16px';
                input.style.fontWeight = el.style.fontWeight || 'normal';
                input.style.fontStyle = el.style.fontStyle || 'normal';
                input.style.textDecoration = el.style.textDecoration || '';
                input.style.color = el.style.color || '#000000';
                input.style.background = "#ccc";
                input.style.padding = "2px";
                input.style.borderStyle = "inset";
                input.style.borderWidth = "3px";
                input.style.borderColor = "#888";
                input.style.overflow = "hidden";
                input.style.whiteSpace = "nowrap";
                input.dataset.tableName = tableName;
                input.dataset.fieldName = fieldName;

                if (table && table.data.length > currentFormRecordIndex) {
                    const colIndex = table.schema.findIndex(c => c.title === fieldName);
                    if (colIndex !== -1) {
                        const record = table.data[currentFormRecordIndex];
                        input.value = record?.[colIndex] ?? "";
                        input.dataset.colIndex = colIndex;
                    } else {
                        input.value = "Поле не знайдено";
                    }
                } else {
                    input.value = "Таблиця порожня або не знайдена";
                }

                previewCanvas.appendChild(input);
            } else {
                const label = document.createElement("div");
                label.style.position = "absolute";
                label.style.left = el.style.left;
                label.style.top = el.style.top;
                label.style.width = el.style.width;
                label.style.height = el.style.height;
                label.style.fontFamily = el.style.fontFamily || 'Arial';
                label.style.fontSize = el.style.fontSize || '16px';
                label.style.fontWeight = el.style.fontWeight || 'normal';
                label.style.fontStyle = el.style.fontStyle || 'normal';
                label.style.textDecoration = el.style.textDecoration || '';
                label.style.color = el.style.color || '#000000';
                label.style.padding = "5px";
                label.style.border = "none";
                label.style.background = "transparent";
                label.style.overflow = "hidden";
                label.style.whiteSpace = "nowrap";
                label.innerText = el.innerText.trim();

                previewCanvas.appendChild(label);
            }
        });

        previewModal.style.display = "flex";
    }

    function saveFormChanges() {
        const inputs = [...document.querySelectorAll("#formPreviewCanvas input")];

        if (inputs.length === 0) {
            Message("Немає полів для збереження.");
            return;
        }

        const tableName = inputs[0].dataset.tableName;
        const table = database.tables.find(t => t.name === tableName);
        if (!table) {
            Message("Таблицю не знайдено.");
            return;
        }

        console.log("currentFormRecordIndex =", currentFormRecordIndex);

        const values = {};
        let allEmpty = true;

        inputs.forEach(input => {
            const field = input.dataset.fieldName;
            const val = input.value.trim();
            values[field] = val;
            if (val !== "") allEmpty = false;
        });

        if (allEmpty) {
            Message("Порожній запис не буде додано.");
            return;
        }

        const pkField = table.schema.find(col => col.primaryKey)?.title;
        const pkIndex = table.schema.findIndex(col => col.primaryKey);

        if (!pkField) {
            Message("У таблиці відсутній первинний ключ. Збереження неможливе.");
            return;
        }

        const existingRow = table.data[currentFormRecordIndex];
        console.log("existingRow=", existingRow, table.data.length)
        const isNewRecord = currentFormRecordIndex === undefined || (currentFormRecordIndex + 1) === table.data.length;


        if (isNewRecord) {
            // 🆕 INSERT
            const fields = Object.keys(values);
            const placeholders = fields.map(() => "?").join(", ");
            const sql = `INSERT INTO "${tableName}" (${fields.map(f => `"${f}"`).join(", ")}) VALUES (${placeholders})`;
            const params = fields.map(f => values[f]);
            console.log("INSERT SQL:", sql, params);
            db.run(sql, params);


            // Оновлюємо in-memory
            const newRow = table.schema.map(col => values[col.title] ?? "");
            table.data.push(newRow);

            currentFormRecordIndex = table.data.length - 1;
            Message("Новий запис додано!");
        } else {
            // ✏️ UPDATE
            const setClause = Object.keys(values)
                .filter(field => field !== pkField)
                .map(field => `"${field}" = ?`)
                .join(", ");

            const sql = `UPDATE "${tableName}" SET ${setClause} WHERE "${pkField}" = ?`;
            const params = Object.keys(values)
                .filter(f => f !== pkField)
                .map(f => values[f]);

            const pkValue = existingRow[pkIndex];
            params.push(pkValue);

            console.log("UPDATE SQL:", sql, params);
            db.run(sql, params);


            // Оновлюємо in-memory
            Object.keys(values).forEach(field => {
                const colIndex = table.schema.findIndex(col => col.title === field);
                if (colIndex >= 0) {
                    table.data[currentFormRecordIndex][colIndex] = values[field];
                }
            });

            Message("Зміни збережено!");
        }

        saveDatabase();
    }



    document.addEventListener('DOMContentLoaded', () => {
        const formCanvas = document.getElementById("formCanvas");
        const fieldSelectionModal = document.getElementById("fieldSelectionModal");
        const fieldPanelTableSelect = document.getElementById("fieldPanelTableSelect");
        const fieldPanelFieldSelect = document.getElementById("fieldPanelFieldSelect");
        
        formCanvas.addEventListener("mousedown", (e) => {
            const element = e.target.closest(".form-element");
            const handle = e.target.closest(".resize-handle");




            document.querySelectorAll(".form-element.selected").forEach(el => el.classList.remove("selected"));
            fieldSelectionModal.style.display = "none";
            closeTextOptionsModal();

            if (element) {
                activeElement = element;
                activeElement.classList.add("selected");
                addResizeHandles(element); // 🔧 маркери розміру
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


        // Populate the field selection panel when a table is selected
        fieldPanelTableSelect1.addEventListener("change", () => {
            const selectedTableName = fieldPanelTableSelect.value;
            const selectedTable = database.tables.find(t => t.name === selectedTableName);

            fieldPanelFieldSelect.innerHTML = "<option value=''>Виберіть поле</option>";

            if (selectedTable) {
                selectedTable.schema.forEach(field => {
                    const option = document.createElement("option");
                    option.value = field.title;
                    option.textContent = field.title;
                    fieldPanelFieldSelect.appendChild(option);
                });
            }

            // ⛔ НЕ скидати fieldName автоматично — лише при явній зміні таблиці
            if (activeElement && activeElement.classList.contains("form-field")) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    // Якщо поле вже є — залишаємо, інакше оновлюємо тільки table
                    const currentField = activeElement.dataset.fieldName || "";
                    fieldTextDiv.innerText = selectedTableName ? `${selectedTableName}.${currentField}` : "Поле даних";
                }
                activeElement.dataset.tableName = selectedTableName;
            }
        });

        // Update the active element's text when a field is selected
        fieldPanelFieldSelect1.addEventListener("change", () => {
            const selectedTableName = fieldPanelTableSelect.value;
            const selectedFieldName = fieldPanelFieldSelect.value;
            if (activeElement && activeElement.classList.contains("form-field") && selectedTableName && selectedFieldName) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = `${selectedTableName}.${selectedFieldName}`;
                }
                activeElement.dataset.tableName = selectedTableName;
                activeElement.dataset.fieldName = selectedFieldName;
            } else if (activeElement && activeElement.classList.contains("form-field")) {
                const fieldTextDiv = activeElement.querySelector('.field-text');
                if (fieldTextDiv) {
                    fieldTextDiv.innerText = fieldPanelTableSelect.value ? `${fieldPanelTableSelect.value}.` : "Поле даних";
                }
                delete activeElement.dataset.fieldName;
            }
        });

        // Стилі для тексту
        document.getElementById("fontFamilySelect").addEventListener("change", e => {
            if (activeElement && isTextElement(activeElement)) activeElement.style.fontFamily = e.target.value;
        });
        document.getElementById("fontSizeInput").addEventListener("input", e => {
            if (activeElement && isTextElement(activeElement)) activeElement.style.fontSize = `${e.target.value}px`;
        });
        document.getElementById("fontColorInput").addEventListener("input", e => {
            if (activeElement && isTextElement(activeElement)) activeElement.style.color = e.target.value;
        });
        document.getElementById("fontWeightToggle").addEventListener("change", e => {
            if (activeElement && isTextElement(activeElement)) activeElement.style.fontWeight = e.target.checked ? 'bold' : 'normal';
        });
        document.getElementById("fontStyleToggle").addEventListener("change", e => {
            if (activeElement && isTextElement(activeElement)) activeElement.style.fontStyle = e.target.checked ? 'italic' : 'normal';
        });
        document.getElementById("textDecorationUnderline").addEventListener("change", e => {
            if (activeElement && isTextElement(activeElement)) updateTextDecoration();
        });
        document.getElementById("textDecorationStrikethrough").addEventListener("change", e => {
            if (activeElement && isTextElement(activeElement)) updateTextDecoration();
        });
    });


    document.addEventListener("click", (e) => {
        const el = e.target.closest(".form-element");
        if (el) {
            activeElement = el;
        }
    });

    function goToFirstRecord() {
        currentFormRecordIndex = 0;
        previewForm();
    }

    function goToPreviousRecord() {
        currentFormRecordIndex = Math.max(0, currentFormRecordIndex - 1);
        previewForm();
    }

    function goToNextRecord() {
        // визначити макс. довжину таблиць
        const tables = database.tables;
        const maxLength = Math.max(...tables.map(t => t.data.length));
        currentFormRecordIndex = Math.min(maxLength - 1, currentFormRecordIndex + 1);
        previewForm();
    }

    function goToLastRecord() {
        const tables = database.tables;
        const maxLength = Math.max(...tables.map(t => t.data.length));
        currentFormRecordIndex = maxLength - 1;
        previewForm();
    }

    function createNewRecord() {
        // додати порожній запис до всіх таблиць, які використовуються у формі
        const elements = [...document.querySelectorAll("#formCanvas .form-field")];
        const usedTables = [...new Set(elements.map(el => el.dataset.tableName))];

        usedTables.forEach(tableName => {
            const table = database.tables.find(t => t.name === tableName);
            if (!table) return;

            const emptyRow = table.schema.map(() => "");
            table.data.push(emptyRow);
        });

        saveDatabase();

        // перейти до останнього запису
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
                const importedDb = new SQL.Database(uIntArray);
    
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const fileName = nameWithoutExt;
    
                // Зберігаємо файл в localStorage
                const base64 = btoa(String.fromCharCode(...uIntArray));
                localStorage.setItem(fileName + ".db-data", base64);
    
                // Очищаємо поточну пам’ять
                database.fileName = fileName;
                database.tables = [];
                database.relations = []; // 🆕
                queries.definitions = [];
                queries.results = [];
                database.forms = [];
                database.reports = [];
                db = importedDb;
    
                const dataMenu = document.getElementById("data-menu");
                dataMenu.innerHTML = "";
    
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
                                primaryKey: pk === 1,
                                comment: pk === 1 ? "Первинний ключ" : "",
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

    // імпорт даних з CSV
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

    function closeCsvImportDialog() {
        document.getElementById("csvImportModal").style.display = "none";
    }

    function proceedCsvImport() {
        closeCsvImportDialog();
        document.getElementById("csvFileInput").value = ""; // Скинути попередній файл
        document.getElementById("csvFileInput").click(); // Відкрити вибір файлу
    }

    function handleCsvFile(file) {
        if (!file) {
            Message("Файл не вибрано.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const csvText = event.target.result;
            const rows = csvText.trim().split("\n").map(line => line.split(",").map(val => val.trim()));

            if (rows.length === 0) {
                Message("CSV-файл порожній.");
                return;
            }

            const tableName = document.getElementById("csvTargetTable").value;
            const table = database.tables.find(t => t.name === tableName);
            if (!table) {
                Message("Таблиця не знайдена.");
                return;
            }

            const expectedCols = table.schema.length;

            // Перевірка кількості стовпців
            const invalidRow = rows.find(r => r.length !== expectedCols);
            if (invalidRow) {
                Message("Кількість стовпців у CSV не відповідає кількості полів у таблиці.");
                return;
            }

            // Перевірка типів даних
            const typeMap = {
                "Ціле число": val => /^-?\d+$/.test(val),
                "Дробове число": val => /^-?\d+(\.\d+)?$/.test(val),
                "Так/Ні": val => /^(true|false|1|0)$/i.test(val),
                "Текст": val => true,
                "Дата": val => true // можна ускладнити перевірку
            };

            for (let i = 0; i < rows.length; i++) {
                for (let j = 0; j < expectedCols; j++) {
                    const val = rows[i][j];
                    const type = table.schema[j].type;
                    if (!typeMap[type](val)) {
                        Message(`Помилка типу в рядку ${i + 1}, поле "${table.schema[j].title}" має бути типу "${type}".`);
                        return;
                    }
                }
            }

            // Усе гаразд — вставляємо дані
            const colNames = table.schema.map(col => `"${col.title}"`).join(", ");
            db.run("BEGIN TRANSACTION");
            rows.forEach(row => {
                const values = row.map(val => `'${val.replace(/'/g, "''")}'`).join(", ");
                const sql = `INSERT INTO "${table.name}" (${colNames}) VALUES (${values})`;
                db.run(sql);
            });
            db.run("COMMIT");

            Message(`Імпортовано ${rows.length} записів у таблицю "${table.name}".`);
            saveDatabase();
        };

        reader.readAsText(file);
    }

    // Перегляд відомостей про базу даних
    function showDatabaseInfo() {
        if (!db || !database.fileName) {
            Message("База даних не завантажена.");
            return;
        }

        let info = `Назва файлу: ${database.fileName}.sqlite\n\n`;

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
        database.fileName = "";
        database.tables = [];
        database.reports = [];
        database.relations = [];
        database.forms = [];

        queries.definitions = [];
        queries.results = [];

        const dataMenu = document.getElementById("data-menu");
        dataMenu.innerHTML = "";

        updateMainTitle(); // Змінити заголовок на "Виберіть або створіть базу даних"
        Message("Базу даних закрито.");
        updateQuickAccessPanel([], [], [], []);
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

        createReport(report); // відкриває звіт у режимі редагування
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
    }
    //
    
    function editOwnQuery(query) {
        // Відкриваємо модальне вікно власного SQL
        const modal = document.getElementById("ownSqlModal");
        if (modal) modal.style.display = "flex";
    
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
    }
/* Виконання користувацького SQL-запиту */    
function executeOwnSQL() {
    const sqlQuery = document.getElementById("ownSqlInput").value.trim();
    const queryName = document.getElementById("ownSQLName").value.trim();
    const resultsDiv = document.getElementById("ownSqlResults");
    resultsDiv.innerHTML = ""; // Очистити попередні результати

    if (!sqlQuery) {
        resultsDiv.innerHTML = "<p style='color: orange;'>Будь ласка, введіть SQL-запит.</p>";
        return;
    }

    if (!db) {
        resultsDiv.innerHTML = "<p style='color: red;'>База даних не завантажена. Будь ласка, завантажте або створіть базу даних.</p>";
        return;
    }

    try { 
        if (!validateSqlQuery(sqlQuery)) return;
        const res = db.exec(sqlQuery);                

        if (res.length > 0) {
            const columns = res[0].columns;
            const dataRows = res[0].values;

            // ✅ Показ повідомлення про кількість записів
            const info = document.createElement("p");
            info.style.color = "green";
            info.style.fontWeight = "bold";
            info.textContent = `Результати – знайдено ${dataRows.length} записів`;
            resultsDiv.appendChild(info);

            // --- Виведення таблиці результату ---
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.marginTop = "10px";

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            columns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                th.style.border = "1px solid #ddd";
                th.style.padding = "8px";
                th.style.backgroundColor = "#f2f2f2";
                th.style.textAlign = "left";
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            dataRows.forEach(rowData => {
                const tr = document.createElement("tr");
                rowData.forEach(cellData => {
                    const td = document.createElement("td");
                    td.textContent = cellData ?? "";
                    td.style.border = "1px solid #ddd";
                    td.style.padding = "8px";
                    td.style.textAlign = "left";
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            resultsDiv.appendChild(table);

            // --- Збереження результатів у таблицю ---
            const internalQueryName = `запит "${queryName}"`;
            const menuDisplayName = `*${internalQueryName}`;

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

            addTableToMenu(menuDisplayName);
        } else {
            resultsDiv.innerHTML = "<p style='color: green;'>Запит виконано успішно, але результат порожній або не повертає даних (наприклад, INSERT, UPDATE, DELETE).</p>";
        }
    } catch (e) {
        resultsDiv.innerHTML = `<p style='color: red;'>Помилка виконання запиту: ${e.message}</p>`;
    }
}

    
    
    function saveOwnSQL() {
        const sql = document.getElementById("ownSqlInput").value.trim();
        const name = document.getElementById("ownSQLName")?.value.trim();
    
        if (!sql) {
            Message("SQL-запит порожній.");
            return;
        }
    
        if (!name) {
            Message("Введіть ім’я запиту у поле «Назва запиту».");
            return;
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
            if (!confirm("Запит з таким ім’ям вже існує. Перезаписати?")) return;
            queries.definitions[existingIndex] = query;
        } else {
            queries.definitions.push(query);
        }
    
        saveDatabase();
        Message("Запит збережено.");
    }
    

    function showAboutModal() {
        const modal = document.getElementById("aboutModal");
        modal.style.display = "flex";
    }
    function closeAboutModal() {
        const modal = document.getElementById("aboutModal");
        modal.style.display = "none";
    }
//
    function updateSchemaTableHeader(hasForeign) {
        const thead = document.getElementById("schemaHead");
        thead.innerHTML = ""; // очистити

        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
        <th>🔑</th>
        <th>Назва поля</th>
        <th>Тип</th>
        <th>📌</th>
        ${hasForeign ? "<th>Таблиця 📌</th><th>Поле 📌</th>" : ""}
        <th>Коментар</th>
        <th>✂</th>
        `;
        thead.appendChild(headerRow);
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
        const isForeign = field.foreignKey ? 'checked' : '';
        const selectedType = field.type || "Текст";
        const fkTable = field.refTable || "";
        const fkField = field.refField || "";
        const comment = field.comment || "";

        const tableSelectHtml = `
            <select onchange="updateFieldOptions(this)" ${isForeign ? "" : "disabled"}>
                <option value="">(таблиця)</option>
                ${tableOptions.replace(`value="${fkTable}"`, `value="${fkTable}" selected`)}
            </select>
        `;

        const fkFieldOptions = getFieldsForTable(fkTable).map(f =>
            `<option value="${f}" ${f === fkField ? "selected" : ""}>${f}</option>`).join("");

        const fieldSelectHtml = `
            <select ${isForeign ? "" : "disabled"}>
                <option value="">(поле)</option>
                ${fkFieldOptions}
            </select>
        `;

        // Збір усіх комірок
        const cells = [
            `<td style="text-align:center;"><input type="checkbox" onchange="handlePrimaryKey(this)" ${isPrimary}></td>`,
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
  if (event.target.classList.contains("modal")) {
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
    


