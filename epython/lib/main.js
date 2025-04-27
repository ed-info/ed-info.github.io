$(function () {
    // Автоматичне визначення мови (українська стандартно)
    let userLang = navigator.language || navigator.userLanguage; 
    console.log('Мова вебпереглядача:', userLang);
    let selectedLang = userLang.startsWith('en') ? 'en' : 'uk';
        
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
        const dialogTitles = {
            "#ui-id-2": "recover_title",
            "#ui-id-4": "save_title",
            "#ui-id-5": "project_title",
            "#ui-id-6": "file_title",
            "#ui-id-7": "settings_title"
        };

        Object.entries(dialogTitles).forEach(([selector, key]) => {
            const el = document.querySelector(selector);
            if (el && translation[key]) {
                el.textContent = translation[key];
            }
        });
    }
     
applyTranslations(selectedLang);
});
