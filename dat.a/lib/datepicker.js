// datepicker.js
// Виділений клас кастомного віджета <custom-date-picker> з файлу datepicker.html
// Можна підключати через <script type="module" src="datepicker.js"></script>

export class CustomDateWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._render();
        this._bindEvents();
    }

    static get observedAttributes() {
        return ['value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.value = newValue;
        }
    }

    get value() {
        const y = this._yearInput.value.trim();
        const m = this._monthInput.value.trim();
        const d = this._dayInput.value.trim();
        if (!(y && m && d)) return "";
        return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    set value(dateString) {
        const parts = dateString ? dateString.split("-") : [];
        if (parts.length === 3) {
            this._yearInput.value = parts[0];
            this._monthInput.value = parts[1];
            this._dayInput.value = parts[2];
            this._validate();
        } else {
            this._yearInput.value = '';
            this._monthInput.value = '';
            this._dayInput.value = '';
            this._validate(true);
        }
        this.dispatchEvent(new Event('change'));
    }

    _isValidDate(y, m, d) {
        const date = new Date(`${y}-${m}-${d}`);
        return !isNaN(date) && date.getFullYear() == y && date.getMonth() + 1 == +m && date.getDate() == +d;
    }

    _validate(forceValid = false) {
        const y = this._yearInput.value;
        const m = this._monthInput.value;
        const d = this._dayInput.value;

        if (forceValid) {
            this.shadowRoot.querySelector(".custom-date").classList.remove("invalid");
            return true;
        }

        const isComplete = y.length === 4 && m.length > 0 && d.length > 0;
        let isValid = false;

        if (isComplete) {
            isValid = this._isValidDate(y, m, d);
        }

        this.shadowRoot.querySelector(".custom-date").classList.toggle(
            "invalid",
            !isValid && (y || m || d)
        );

        return isValid;
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; position: relative; }
                .custom-date { display: inline-flex; align-items: center; border: 1px solid #ccc; border-radius: 2px; font-family: inherit; background: #fff; padding: 0; height: 1.2em; transition: border-color 0.2s, box-shadow 0.2s; }
                .custom-date:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.5); }
                .custom-date input[type="text"] { text-align: center; font-size: 1em; border: none; outline: none; padding: 0; margin: 0; background: transparent; line-height: 1; }
                .custom-date input.year { width: 2.7em; }
                .custom-date input.month, .custom-date input.day { width: 1.8em; }
                .custom-date span { opacity: 0.6; margin: 0 -1px; line-height: 1; }
                .custom-date button.calendar-btn { border: none; background: none; cursor: pointer; line-height: 1; padding: 0; font-size: 1em; display: flex; align-items: center; justify-content: center; color: #6b7280; }
                .custom-date button.calendar-btn:hover { color: #4f46e5; }
                .custom-date.invalid { border-color: #ef4444; }
                .custom-date.invalid:focus-within { box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.5); }
                .custom-date input[type="text"]::placeholder { color: #bbb; }
            </style>

            <div class="custom-date">
                <input type="text" class="year" maxlength="4" placeholder="РРРР">
                <span>-</span>
                <input type="text" class="month" maxlength="2" placeholder="ММ">
                <span>-</span>
                <input type="text" class="day" maxlength="2" placeholder="ДД">
                <button type="button" class="calendar-btn" title="Вибрати дату">📅</button>
            </div>
        `;
        this._yearInput = this.shadowRoot.querySelector(".year");
        this._monthInput = this.shadowRoot.querySelector(".month");
        this._dayInput = this.shadowRoot.querySelector(".day");
    }

    _bindEvents() {
        const button = this.shadowRoot.querySelector(".calendar-btn");
        button.addEventListener("click", () => this._showNativeDatePicker());

        [this._yearInput, this._monthInput, this._dayInput].forEach((input, i, arr) => {
            input.addEventListener("input", e => {
                let val = e.target.value.replace(/\D/g, "");
                const maxLen = input.classList.contains("year") ? 4 : 2;
                if (val.length > maxLen) val = val.slice(0, maxLen);
                e.target.value = val;

                const condition = input.classList.contains("year") ? val.length === 4 : val.length === 2;
                if (condition && i < arr.length - 1) arr[i + 1].focus();
                this._validate();
                this.dispatchEvent(new Event('input'));
            });

            input.addEventListener("blur", () => {
                this._validate();
                this.dispatchEvent(new Event('change'));
            });
        });
    }

    _showNativeDatePicker() {
        const tempInput = document.createElement('input');
        tempInput.type = 'date';
        if (this._validate()) tempInput.value = this.value;

        const rect = this.getBoundingClientRect();
        Object.assign(tempInput.style, {
            position: 'fixed', top: `${rect.bottom + window.scrollY}px`, left: `${rect.left + window.scrollX}px`,
            zIndex: 10000, opacity: 0, height: 0, width: 0, pointerEvents: 'none'
        });
        document.body.appendChild(tempInput);

        if (typeof tempInput.showPicker === 'function') tempInput.showPicker(); else tempInput.click();

        tempInput.addEventListener('change', () => {
            if (tempInput.value) {
                const [y, m, d] = tempInput.value.split('-');
                this._yearInput.value = y || '';
                this._monthInput.value = m || '';
                this._dayInput.value = d || '';
                this._validate();
                this.dispatchEvent(new Event('change'));
            }
            document.body.removeChild(tempInput);
        });

        tempInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.body.contains(tempInput)) document.body.removeChild(tempInput);
            }, 100);
        });
    }
}

customElements.define('custom-date-picker', CustomDateWidget);
