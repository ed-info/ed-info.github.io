// керування модальним вікном для message/confirm/input
const ModalUI = {
            container: document.getElementById('modal-container'),
            title: document.getElementById('modal-title'),
            text: document.getElementById('modal-text'),
            inputWrapper: document.getElementById('modal-input-wrapper'),
            inputField: document.getElementById('modal-input-field'),
            okBtn: document.getElementById('modal-ok-btn'),
            cancelBtn: document.getElementById('modal-cancel-btn'),

            show(title, text, type) {
                return new Promise((resolve) => {
                    // Налаштування контенту
                    this.title.innerText = title;
                    this.text.innerText = text;
                    this.inputField.value = '';
                    
                    // Налаштування видимості елементів
                    this.inputWrapper.style.display = (type === 'input') ? 'block' : 'none';
                    this.cancelBtn.style.display = (type === 'message') ? 'none' : 'inline-block';
                    this.container.style.display = 'flex';

                    // Обробка кнопок
                    const cleanup = () => {
                        this.container.style.display = 'none';
                    };

                    this.okBtn.onclick = () => {
                        cleanup();
                        resolve(type === 'input' ? this.inputField.value : true);
                    };

                    this.cancelBtn.onclick = () => {
                        cleanup();
                        resolve(type === 'input' ? null : false);
                    };

                    // Фокус на полі введення, якщо це input
                    if (type === 'input') {
                        setTimeout(() => this.inputField.focus(), 100);
                    }
                });
            }
        };
// виведення та введення
async function message(title, text) {
			document.getElementById('modal-container').style.display = 'none'
            return await ModalUI.show(title, text, 'message');
            
}

async function askConfirm(title, text) {
            return await ModalUI.show(title, text, 'confirm');
}

async function input(title, text) {
            return await ModalUI.show(title, text, 'input');
}
