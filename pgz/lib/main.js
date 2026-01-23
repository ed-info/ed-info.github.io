$(function () {
    // Автоматичне визначення мови (українська стандартно)
    let userLang = navigator.language || navigator.userLanguage; 
    console.log('user Language:', userLang);
    let selectedLang = 'en';
    if (userLang.startsWith('uk')||userLang.startsWith('ru')){
        selectedLang = 'uk';
    }
        
    function applyTranslations(lang) {
        const translation = translations[lang] || {};

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && translation[key]) {
                element.textContent = translation[key];
            }
        });

        // Обробляємо всі data-i18n-*, наприклад: data-i18n-title="some_key"
        document.querySelectorAll('*').forEach(element => {
            [...element.attributes].forEach(attr => {
                if (attr.name.startsWith('data-i18n-')) {
                    const attrName = attr.name.replace('data-i18n-', ''); 
                    const translationKey = attr.value; 
                    if (translation[translationKey]) {
                        element.setAttribute(attrName, translation[translationKey]);
                    }
                }
            });
        });
        
        // Переклад jQuery UI заголовків діалогових вікон
        
        ukTranslations = translations['uk'];
        enTranslations = translations['en'];

        // Додаємо слухач події для перекладу title в діалогах після їх відкриття
        $(document).on('dialogopen', '.ui-dialog', function() {
            const dialog = $(this); // Отримуємо сам елемент діалогу
            const dialogTitleElement = dialog.find('.ui-dialog-title');
            
            if (dialogTitleElement.length) {
                const dialogTitleText = dialogTitleElement.text().split("\n")[0]; // Отримуємо частину до \n

                // Шукаємо ключ в uk.json
                const key = Object.keys(ukTranslations).find(k => ukTranslations[k] === dialogTitleText);

                if (key && enTranslations[key]) {
                    // Оновлюємо заголовок діалогу через innerHTML
                    const translatedTitle = enTranslations[key];
                    //console.log("Setting dialog title:", translatedTitle);
                    dialogTitleElement[0].innerHTML = translatedTitle; // Заміна тексту через innerHTML
                } else {
                    //console.warn("Key for dialog title not found:", dialogTitleText);
                }
            }
        });
    }
     
applyTranslations(selectedLang);
});
