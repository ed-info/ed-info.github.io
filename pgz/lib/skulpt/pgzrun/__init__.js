var $builtinmodule = function(name) {
    document.getElementById("gameModal").style.display = "flex"; // game canvas 
    var s = {};
    var TWEEN_FUNCTIONS = {
        linear: function(n) {
            return n;
        },
        accelerate: function(n) {
            return n * n;
        },
        decelerate: function(n) {
            return -1.0 * n * (n - 2.0);
        },
        accel_decel: function(n) {
            var p = n * 2;
            if (p < 1) return 0.5 * p * p;
            p -= 1.0;
            return -0.5 * (p * (p - 2.0) - 1.0);
        },
        bounce_end: function(n) {
            if (n < (1.0 / 2.75)) {
                return 7.5625 * n * n;
            } else if (n < (2.0 / 2.75)) {
                n -= (1.5 / 2.75);
                return 7.5625 * n * n + 0.75;
            } else if (n < (2.5 / 2.75)) {
                n -= (2.25 / 2.75);
                return 7.5625 * n * n + 0.9375;
            } else {
                n -= (2.625 / 2.75);
                return 7.5625 * n * n + 0.984375;
            }
        },
        bounce_start: function(n) {
            return 1.0 - TWEEN_FUNCTIONS.bounce_end(1.0 - n);
        },
        bounce_start_end: function(n) {
            var p = n * 2.0;
            if (p < 1.0) {
                return TWEEN_FUNCTIONS.bounce_start(p) * 0.5;
            } else {
                return TWEEN_FUNCTIONS.bounce_end(p - 1.0) * 0.5 + 0.5;
            }
        },
        in_elastic: function(n) {
            var p = 0.3;
            var s = p / 4.0;
            var q = n;
            if (q === 1) return 1.0;
            q -= 1.0;
            return -(Math.pow(2, 10 * q) * Math.sin((q - s) * (2 * Math.PI) / p));
        },
        out_elastic: function(n) {
            var p = 0.3;
            var s = p / 4.0;
            var q = n;
            if (q === 1) return 1.0;
            return Math.pow(2, -10 * q) * Math.sin((q - s) * (2 * Math.PI) / p) + 1.0;
        },
        in_out_elastic: function(n) {
            var p = 0.3 * 1.5;
            var s = p / 4.0;
            var q = n * 2;
            if (q === 2) return 1.0;
            if (q < 1) {
                q -= 1.0;
                return -0.5 * (Math.pow(2, 10 * q) * Math.sin((q - s) * (2.0 * Math.PI) / p));
            } else {
                q -= 1.0;
                return Math.pow(2, -10 * q) * Math.sin((q - s) * (2.0 * Math.PI) / p) * 0.5 + 1.0;
            }
        }
    };
    var handlers = {
        "Sk.debug": function(e) {
            debugger;
            var r = PythonIDE.debugHandler(e);
            if (r.then) {
                return r;
            }
            return false;
        }
    };
    // Переконуємося, що jsfs існує
    if (typeof window.jsfs === 'undefined') {
        if (typeof window.FileSystem !== 'undefined') {
            window.jsfs = new window.FileSystem("PGZfs");
        } else {
            throw new Error("FileSystem not available");
        }
    }
    var promises = [];
    var animations = {};
    var startTime = new Date().getTime();
    var width = undefined;
    var height = undefined;
    Sk.globals.dbg = new Sk.builtin.func(function(x) {
        console.log(x, Sk.ffi.remapToJs(x));
    });

    function updateCoordsFromProps(props, size, pos) {
        //  resolve positioning props 
        if (props.topleft) {
            props.left = props.topleft[0];
            props.top = props.topleft[1];
        }
        if (props.bottomleft) {
            props.left = props.bottomleft[0];
            props.bottom = props.bottomleft[1];
        }
        if (props.topright) {
            props.right = props.topright[0];
            props.top = props.topright[1];
        }
        if (props.bottomright) {
            props.right = props.bottomright[0];
            props.bottom = props.bottomright[1];
        }
        if (props.midtop) {
            props.centerx = props.midtop[0];
            props.top = props.midtop[1];
        }
        if (props.midleft) {
            props.left = props.midleft[0];
            props.centery = props.midleft[1];
        }
        if (props.midbottom) {
            props.centerx = props.midbottom[0];
            props.bottom = props.midbottom[1];
        }
        if (props.midright) {
            props.right = props.midright[0];
            props.centery = props.midright[1];
        }
        if (props.center) {
            props.centerx = props.center[0];
            props.centery = props.center[1];
        }
        var x = pos ? pos[0] : null;
        var y = pos ? pos[1] : null;
        var hanchor = props.anchor ? props.anchor[0] : null;
        var vanchor = props.anchor ? props.anchor[1] : null;
        //  resolve anchor from positioning 
        if (props.left !== undefined) {
            x = props.left;
            hanchor = 0;
        }
        if (props.centerx !== undefined) {
            x = props.centerx;
            hanchor = 0.5;
        }
        if (props.right !== undefined) {
            x = props.right;
            hanchor = 1;
        }
        if (props.top !== undefined) {
            y = props.top;
            vanchor = 0;
        }
        if (props.centery !== undefined) {
            y = props.centery;
            vanchor = 0.5;
        }
        if (props.bottom !== undefined) {
            y = props.bottom;
            vanchor = 1;
        }
        if (x === null || x === undefined) {
            throw new Sk.builtin.ValueError("Unable to determine horizontal position");
        }
        if (y === null || y === undefined) {
            throw new Sk.builtin.ValueError("Unable to determine vertical position");
        }
        //  default anchor if not set 
        if (hanchor === null || hanchor === undefined) {
            hanchor = 0.5; // за замовчуванням - центр по горизонталі
        }
        if (vanchor === null || vanchor === undefined) {
            vanchor = 0.5; // за замовчуванням - центр по вертикалі
        }
        //  resolve align from anchor 
        if (props.align === undefined || props.align === null) {
            if (typeof hanchor === "number") {
                if (hanchor === 0) props.align = "left";
                else if (hanchor === 0.5) props.align = "center";
                else if (hanchor === 1) props.align = "right";
                else props.align = hanchor; // numeric align
            } else {
                props.align = hanchor; // string align
            }
        }
        // calculate final position 
        // Тепер позиція розраховується відносно точки прив'язки (anchor) 
        // незалежно від наявності обертання
        props.x = x - hanchor * size.width;
        props.y = y - vanchor * size.height;
    }

    function getColor(c) {
        // специфічні відтінки кольорів (як у Pygame Zero)
        var SPECIAL_COLORS = {
            'green': [0, 255, 0],
            'gray': [190, 190, 190],
            'purple': [160, 32, 240],
            'maroon': [176, 48, 96]
        };
        // Обробка об'єктів Skulpt
        if (c && c.v !== undefined) {
            // Якщо це кортеж/список Skulpt - конвертуємо в масив JS
            c = c.v.map(function(item) {
                return Sk.ffi.remapToJs(item);
            });
        }
        var type = typeof c;
        // рядкові значення - повертаємо як є ===
        if (type === 'string') {
            // спочатку перевіряємо специфічні кольори
            var lowerC = c.toLowerCase().replace(/\s+/g, '');
            if (SPECIAL_COLORS[lowerC]) {
                var col = SPECIAL_COLORS[lowerC];
                return "rgb(" + col[0] + ", " + col[1] + ", " + col[2] + ")";
            }
            // будь-який інший рядок повертаємо без змін
            // (наприклад: 'red', '#ff0000', 'rgb(255,0,0)', 'rgba(255,0,0,0.5)' тощо)
            return c;
        }
        //кортежі - конвертуємо в rgb 
        if (Array.isArray(c)) {
            var r = c[0];
            var g = c[1];
            var b = c[2];
            // Якщо є альфа-канал
            if (c.length >= 4) {
                var a = c[3];
                return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
            }
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }
        // ЗА ЗАМОВЧУВАННЯМ
        return "rgb(255, 255, 255)";
    }
    var canvas = undefined;
    var cx = undefined;
    var loadedAssets = {}; // завантажені ресурси
    // Завантаження зображень--
    // PRELOAD ALL IMAGES FROM /images
    var loadedAssets = window.PGZ_IMAGE_CACHE;

    function loadImage(name) {
        var jsName = Sk.ffi.remapToJs(name);
        var asset = loadedAssets[jsName];
        if (!asset) {
            console.warn("Image not found in cache:", jsName);
            return null;
        }
        return asset;
    }
    //
    function get_XY(key, x1, y1, w, h) {
        var coordXY;
        switch (key) {
            case 'x':
            case 'y':
                coordsXY = [x1, y1];
                break;
            case 'pos':
            case 'topleft':
                coordsXY = [x1, y1];
                break;
            case 'topright':
                coordsXY = [x1 - w, y1];
                break;
            case 'bottomleft':
                coordsXY = [x1, y1 - h];
                break;
            case 'bottomright':
                coordsXY = [x1 - w, y1 - h];
                break;
            case 'midtop':
                coordsXY = [x1 - w / 2, y1];
                break;
            case 'midbottom':
                coordsXY = [x1 - w / 2, y1 - h];
                break;
            case 'midleft':
                coordsXY = [x1, y1 - h / 2];
                break;
            case 'midright':
                coordsXY = [x1 - w, y1 - h / 2];
                break;
            case 'center':
                coordsXY = [x1 - w / 2, y1 - h / 2];
                break;
            default:
                coordsXY = [x1, y1];
        }
        return coordsXY;
    }
    // Отримати поточні значення атрибута як список (1 або 2 елементи)
    function getCurrentValues(obj, attr) {
        let rawValue;
        if (obj.coords && !obj.attributes?.image) { // Rect
            // Для Rect читаємо напряму з coords з урахуванням прив'язки
            const x1 = obj.coords.x1,
                y1 = obj.coords.y1;
            const x2 = obj.coords.x2,
                y2 = obj.coords.y2;
            const w = x2 - x1,
                h = y2 - y1;
            const ax = obj.anchorVal?.x || 0,
                ay = obj.anchorVal?.y || 0;
            switch (attr) {
                case 'x':
                    rawValue = x1 + w * ax;
                    break;
                case 'y':
                    rawValue = y1 + h * ay;
                    break;
                case 'width':
                    rawValue = w;
                    break;
                case 'height':
                    rawValue = h;
                    break;
                case 'left':
                    rawValue = x1;
                    break;
                case 'top':
                    rawValue = y1;
                    break;
                case 'right':
                    rawValue = x2;
                    break;
                case 'bottom':
                    rawValue = y2;
                    break;
                default:
                    rawValue = 0;
            }
        } else { // Actor
            // Для Actor використовуємо існуючу функцію отримання атрибута
            const pyAttr = Sk.ffi.remapToPy(attr);
            rawValue = Sk.ffi.remapToJs(getActorAttribute(obj, pyAttr));
        }
        // Формуємо список результатів через push() — без припущень про ключ
        const result = [];
        if (Array.isArray(rawValue)) {
            // Якщо отримали масив/кортеж — беремо елементи (максимум 2)
            if (rawValue.length >= 1) result.push(Number(rawValue[0]));
            if (rawValue.length >= 2) result.push(Number(rawValue[1]));
        } else {
            // Якщо отримали число — один елемент
            result.push(Number(rawValue));
        }
        return result; // завжди список з 1 або 2 елементами
    }
    // Застосувати значення до атрибута (універсально)
    function applyValues(obj, attr, values) {
        if (obj.coords && !obj.attributes?.image) { // Rect
            // Для Rect оновлюємо напряму через існуючі функції
            updateRectAttribute(obj, attr, values[0]);
            // Якщо значень більше одного і атрибут підтримує другий компонент (наприклад, 'pos' → 'y')
            // це буде оброблено окремими анімаціями для кожного атрибута
        } else { // Actor
            // Для Actor формуємо правильний тип даних
            let pyValue;
            if (values.length === 1) {
                pyValue = Sk.ffi.remapToPy(values[0]);
            } else {
                // Для двох значень створюємо кортеж
                pyValue = new Sk.builtin.tuple([
                    Sk.ffi.remapToPy(values[0]),
                    Sk.ffi.remapToPy(values[1])
                ]);
            }
            updateActorAttribute(obj, Sk.ffi.remapToPy(attr), pyValue);
        }
    }
    //ANIMATION CLASS 
    var Animation = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self, object, tween, duration, onFinished, targets) {
            Sk.builtin.pyCheckArgs("__init__", 2, 6);
            self.object = object;
            self.tween = tween || 'linear';
            self.duration = duration !== undefined ? duration : 1.0;
            self.onFinished = onFinished || null;
            self.targets = targets || {};
            self.startTime = Date.now();
            self._running = true;
            self._tweenFunc = TWEEN_FUNCTIONS[self.tween] || TWEEN_FUNCTIONS.linear;
            // Зберігаємо початкові значення для кожного атрибута
            self.startValues = {};
            self.endValues = {};
            self.deltas = {};
            for (var attr in self.targets) {
                // Отримуємо початкові значення
                var startVals = getCurrentValues(self.object, attr);
                var endRaw = Sk.ffi.remapToJs(self.targets[attr]);
                // Формуємо кінцеві значення
                var endVals = [];
                if (Array.isArray(endRaw)) {
                    if (endRaw.length >= 1) endVals.push(Number(endRaw[0]));
                    if (endRaw.length >= 2 && startVals.length >= 2) endVals.push(Number(endRaw[1]));
                } else {
                    endVals.push(Number(endRaw));
                    if (startVals.length >= 2) {
                        endVals.push(Number(endRaw));
                    }
                }
                // Обчислюємо дельти
                var deltas = [];
                for (var i = 0; i < startVals.length; i++) {
                    var end = i < endVals.length ? endVals[i] : endVals[0] || 0;
                    deltas.push(end - startVals[i]);
                }
                self.startValues[attr] = startVals;
                self.endValues[attr] = endVals;
                self.deltas[attr] = deltas;
            }
            // Скасовуємо попередні анімації для цих атрибутів
            for (var attr in self.targets) {
                var animKey = self.object.id + "_" + attr;
                if (animations[animKey]) {
                    animations[animKey].stop(false);
                }
                animations[animKey] = self;
            }
        });
        // Метод stop(complete=False)
        $loc._stop = new Sk.builtin.func(function(self, complete) {
            Sk.builtin.pyCheckArgs("stop", 1, 2);
            var doComplete = complete !== undefined ? Sk.ffi.remapToJs(complete) : false;
            self._running = false;
            // Якщо complete=True, встановлюємо кінцеві значення
            if (doComplete) {
                for (var attr in self.targets) {
                    applyValues(self.object, attr, self.endValues[attr]);
                }
            }
            // Видаляємо анімацію з глобального об'єкта
            for (var attr in self.targets) {
                var animKey = self.object.id + "_" + attr;
                if (animations[animKey] === self) {
                    delete animations[animKey];
                }
            }
            return Sk.builtin.none.none$;
        });
        // Властивість running
        Object.defineProperty($loc, 'running', {
            get: function() {
                return Sk.ffi.remapToPy(this._running);
            }
        });
        // Властивість on_finished (геттер та сеттер)
        Object.defineProperty($loc, 'on_finished', {
            get: function() {
                return this.onFinished;
            },
            set: function(value) {
                this.onFinished = value;
            }
        });
        // Внутрішній метод для оновлення анімації
        $loc._update = new Sk.builtin.func(function(self, now) {
            if (!self._running) {
                return false;
            }
            var elapsed = now - self.startTime;
            var progress = Math.min(elapsed / (self.duration * 1000), 1);
            var eased = self._tweenFunc(progress);
            for (var attr in self.targets) {
                var currentVals = [];
                for (var i = 0; i < self.startValues[attr].length; i++) {
                    currentVals.push(self.startValues[attr][i] + self.deltas[attr][i] * eased);
                }
                applyValues(self.object, attr, currentVals);
            }
            if (progress >= 1) {
                self.stop(true);
                if (self.onFinished) {
                    setTimeout(function() {
                        Sk.misceval.asyncToPromise(() => Sk.misceval.callsim(self.onFinished)).catch(window.onerror);
                    }, 0);
                }
                return false;
            }
            return true;
        });
    }, 'Animation', []);
    Animation.prototype.update = function(now) {
        return Sk.ffi.remapToJs(Sk.misceval.callsim(this._update, this, now));
    };
    Animation.prototype.stop = function(complete) {
        return Sk.ffi.remapToJs(Sk.misceval.callsim(this._stop, this, complete));
    };
    Sk.globals.Animation = Animation;
    // animate()
    var animate = function(kwa, object) {
        Sk.builtin.pyCheckArgs("animate", 1, 1);
        var props = unpackKWA(kwa);
        if (!object.id) {
            object.id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        // Витягуємо спеціальні параметри
        var duration = props.duration !== undefined ? props.duration : 1.0;
        var tweenName = props.tween !== undefined ? props.tween : 'linear';
        var onFinished = props.on_finished;
        // Витягуємо цільові атрибути (усі, крім спеціальних)
        var targets = {};
        for (var key in props) {
            if (!['tween', 'duration', 'on_finished'].includes(key)) {
                targets[key] = props[key];
            }
        }
        // Створюємо та повертаємо екземпляр Animation
        var animation = Sk.misceval.callsim(Animation, object, tweenName, duration, onFinished, targets);
        return animation;
    };
    animate.co_kwargs = true;
    Sk.globals.animate = new Sk.builtin.func(animate);
    //
    function updateRectFromXY(self) {
        var i = loadedAssets[self.attributes.image];
        if (i == undefined) {
            i = {
                width: 0,
                height: 0
            };
        }
        var a = self.attributes;
        a.width = i.width;
        a.height = i.height;
        a.left = a.x;
        a.right = a.x + a.width;
        a.top = a.y;
        a.bottom = a.y + a.height;
        self.coords = {
            x1: a.left,
            y1: a.top,
            x2: a.right,
            y2: a.bottom
        }
    }
    //
    var updateRectAttribute = function(self, key, newVal) {
        Sk.builtin.pyCheckArgs("__setattr__", 3, 3);
        comsole.log("updateRectAttribute=", key, newVal)
        var w = self.coords.x2 - self.coords.x1;
        var h = self.coords.y2 - self.coords.y1;
        switch (key) {
            case 'x':
            case 'left':
                self.coords.x1 = newVal;
                self.coords.x2 = self.coords.x1 + w;
                break;
            case 'y':
            case 'top':
                self.coords.y1 = newVal;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'right':
                self.coords.x2 = newVal;
                self.coords.x1 = self.coords.x2 - w;
                break;
            case 'bottom':
                self.coords.y2 = newVal;
                self.coords.y1 = self.coords.y2 - h;
                break;
            case 'centerx':
                self.coords.x1 = newVal - w / 2;
                self.coords.x2 = self.coords.x1 + w;
                break;
            case 'centery':
                self.coords.y1 = newVal - h / 2;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'width':
            case 'w':
                self.coords.x2 = self.coords.x1 + newVal;
                break;
            case 'height':
            case 'h':
                self.coords.y2 = self.coords.y1 + newVal;
                break;
            case 'topleft':
                self.coords.x1 = newVal[0];
                self.coords.y1 = newVal[1];
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'topright':
                self.coords.x2 = newVal[0];
                self.coords.y1 = newVal[1];
                self.coords.x1 = self.coords.x2 - w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'bottomleft':
                self.coords.x1 = newVal[0];
                self.coords.y2 = newVal[1];
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y1 = self.coords.y2 - h;
                break;
            case 'bottomright':
                self.coords.x2 = newVal[0];
                self.coords.y2 = newVal[1];
                self.coords.x1 = self.coords.x2 - w;
                self.coords.y1 = self.coords.y2 - h;
                break;
            case 'midtop':
                self.coords.x1 = newVal[0] - w / 2;
                self.coords.y1 = newVal[1];
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'midleft':
                self.coords.x1 = newVal[0];
                self.coords.y1 = newVal[1] - h / 2;
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'midbottom':
                self.coords.x1 = newVal[0] - w / 2;
                self.coords.y2 = newVal[1];
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y1 = self.coords.y2 - h;
                break;
            case 'midright':
                self.coords.x2 = newVal[0];
                self.coords.y1 = newVal[1] - h / 2;
                self.coords.x1 = self.coords.x2 - w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'center':
                self.coords.x1 = newVal[0] - w / 2;
                self.coords.y1 = newVal[1] - h / 2;
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            case 'size':
                self.coords.x2 = self.coords.x1 + newVal[0];
                self.coords.y2 = self.coords.y1 + newVal[1];
                break;
            case 'pos':
                self.coords.x1 = newVal[0] - w / 2;
                self.coords.y1 = newVal[1] - h / 2;
                self.coords.x2 = self.coords.x1 + w;
                self.coords.y2 = self.coords.y1 + h;
                break;
            default:
                var validAttrs = "x y top left bottom right topleft bottomleft topright bottomright midtop midleft midbottom midright center centerx centery size width height w h".split(" ");
                var suggestions = [];
                for (var i = 0; i < validAttrs.length; i++) {
                    if (validAttrs[i].includes(key) || key.includes(validAttrs[i])) {
                        suggestions.push(validAttrs[i]);
                    }
                }
                var msg = "Rect object has no attribute '" + key + "'";
                if (suggestions.length > 0) {
                    msg += "; did you mean '" + suggestions[0] + "'?";
                }
                throw new Sk.builtin.AttributeError(msg);
        }
        // === Синхронізація всіх атрибутів ===
        w = self.coords.x2 - self.coords.x1;
        h = self.coords.y2 - self.coords.y1;
        // Базові атрибути
        self.attributes.x = self.coords.x1;
        self.attributes.y = self.coords.y1;
        self.attributes.width = w;
        self.attributes.height = h;
        self.attributes.w = w;
        self.attributes.h = h;
        self.attributes.left = self.coords.x1;
        self.attributes.top = self.coords.y1;
        self.attributes.right = self.coords.x2;
        self.attributes.bottom = self.coords.y2;
        // Центри та середини
        self.attributes.centerx = self.coords.x1 + w / 2;
        self.attributes.centery = self.coords.y1 + h / 2;
        self.attributes.midtop = [self.coords.x1 + w / 2, self.coords.y1];
        self.attributes.midleft = [self.coords.x1, self.coords.y1 + h / 2];
        self.attributes.midbottom = [self.coords.x1 + w / 2, self.coords.y2];
        self.attributes.midright = [self.coords.x2, self.coords.y1 + h / 2];
        self.attributes.center = [self.coords.x1 + w / 2, self.coords.y1 + h / 2];
        // Кути
        self.attributes.topleft = [self.coords.x1, self.coords.y1];
        self.attributes.topright = [self.coords.x2, self.coords.y1];
        self.attributes.bottomleft = [self.coords.x1, self.coords.y2];
        self.attributes.bottomright = [self.coords.x2, self.coords.y2];
        // Розмір
        self.attributes.size = [w, h];
    };
    //
    var updateActorAttribute = function(self, name, value) {
        Sk.builtin.pyCheckArgs("__setattr__", 3, 3);
        name = Sk.ffi.remapToJs(name);
        var a = self.attributes;
        a[name] = Sk.ffi.remapToJs(value);
        var pos = Sk.ffi.remapToJs(value);
        switch (name) {
            case 'x':
                a.x = a.x - self.anchorVal.x;
                break;
            case 'y':
                a.y = a.y - self.anchorVal.y;
                break;
            case 'left':
                a.x = a.left;
                break;
            case 'right':
                a.x = a.right - a.width;
                break;
            case 'top':
                a.y = a.top;
                break;
            case 'bottom':
                a.y = a.bottom - a.height;
                break;
            case 'topleft':
                a.x = pos[0];
                a.y = pos[1];
                break;
            case 'topright':
                a.x = pos[0] - a.width;
                a.y = pos[1];
                break;
            case 'midtop':
                a.x = pos[0] - a.width / 2;
                a.y = pos[1];
                break;
            case 'bottomleft':
                a.x = pos[0];
                a.y = pos[1] - a.height;
                break;
            case 'bottomright':
                a.x = pos[0] - a.width;
                a.y = pos[1] - a.height;
                break;
            case 'midbottom':
                a.x = pos[0] - a.width / 2;
                a.y = pos[1] - a.height;
                break;
            case 'midleft':
                a.x = pos[0];
                a.y = pos[1] - a.height / 2;
                break;
            case 'midright':
                a.x = pos[0] - a.width;
                a.y = pos[1] - a.height / 2;
                break;
            case 'pos':
            case 'center':
                a.x = pos[0] - a.width / 2;
                a.y = pos[1] - a.height / 2;
                break;
            case 'anchor':
                self.anchor = Sk.ffi.remapToJs(value);
                updateAnchor(self);
                // Оновлюємо позицію з урахуванням нового якоря
                a.x = a.x - self.anchorVal.x;
                a.y = a.y - self.anchorVal.y;
                break;
            case 'flip_x':
                a.flip_x = !!Sk.ffi.remapToJs(value);
                break;
            case 'flip_y':
                a.flip_y = !!Sk.ffi.remapToJs(value);
                break;
            case 'fps':
                self.fps = Math.max(0.1, Sk.ffi.remapToJs(value)); // avoid zero or negative
                break;
            case 'direction':
                self.direction = Sk.ffi.remapToJs(value);
                break;
            case 'angle':
                self.angle = Sk.ffi.remapToJs(value);
                break;
            case 'images':
                var newImages = Sk.ffi.remapToJs(value);
                self.images = newImages;
                self.image_index = 0;
                if (newImages.length > 0) {
                    // Завантажуємо всі зображення зі списку 
                    if (newImages.length > 0) {
                        var firstImg = loadImage(newImages[0]);
                        if (firstImg) {
                            a.image = newImages[0];
                            updateRectFromXY(self);
                        } else {
                            console.warn("No valid image loaded from 'images' list");
                        }
                    }
                } else {
                    a.image = null;
                }
                break;
            case 'image':
                var jsName = Sk.ffi.remapToJs(value);
                a.image = jsName;
                if (!loadedAssets[jsName]) {
                    var img = loadImage(jsName);
                    if (img) updateRectFromXY(self);
                } else {
                    updateRectFromXY(self);
                }
                break;
            default:
                self.others[name] = value;
                break;
        }
        updateRectFromXY(self);
    };
    var getActorAttribute = function(self, name) {
        Sk.builtin.pyCheckArgs("__getattr__", 2, 2);
        name = Sk.ffi.remapToJs(name);
        if (name === 'pos') {
            name = 'center';
        }
        switch (name) {
            case 'x':
                return Sk.ffi.remapToPy(self.attributes.x + self.anchorVal.x);
            case 'y':
                return Sk.ffi.remapToPy(self.attributes.y + self.anchorVal.y);
            case 'centery':
                return Sk.ffi.remapToPy((self.coords.y1 + self.coords.y2) / 2);
            case 'center':
                return new Sk.builtin.tuple(Sk.ffi.remapToPy([
                    (self.coords.x1 + self.coords.x2) / 2,
                    (self.coords.y1 + self.coords.y2) / 2
                ]));
        }
        // Інші атрибути
        if (self.others[name] !== undefined) {
            return self.others[name];
        }
        if (self.attributes[name] !== undefined) {
            return Sk.ffi.remapToPy(self.attributes[name]);
        }
        if (name === 'anchor') {
            return new Sk.builtin.tuple(Sk.ffi.remapToPy(self.anchor));
        }
        // Якщо нічого не знайдено — помилка
        throw new Sk.builtin.AttributeError("'" + self.tp$name + "' object has no attribute '" + name + "'");
    };
    var idCount = 0;
    Sk.globals.ZRect = Sk.globals.Rect = Sk.misceval.buildClass(s, function($gbl, $loc) {
        function updateRectFromXY(self) {
            self.attributes.width = self.coords.x2 - self.coords.x1;
            self.attributes.height = self.coords.y2 - self.coords.y1;
            self.attributes.x = self.coords.x1;
            self.attributes.y = self.coords.y1;
            self.attributes.left = self.coords.x1;
            self.attributes.top = self.coords.y1;
            self.attributes.right = self.coords.x2;
            self.attributes.bottom = self.coords.y2;
        }
        $loc.__repr__ = new Sk.builtin.func(function(self) {
            var x = self.coords.x1;
            var y = self.coords.y1;
            var w = self.coords.x2 - self.coords.x1;
            var h = self.coords.y2 - self.coords.y1;
            return Sk.ffi.remapToPy("Rect (x:" + x + " y:" + y + " w:" + w + " h:" + h + ")");
        });
        $loc.__init__ = new Sk.builtin.func(function(self) {
            Sk.builtin.pyCheckArgs("__init__", 2, 5);
            self.coords = {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            }
            self.attributes = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            };
            self.anchorVal = {
                x: 0,
                y: 0
            }; // Прямокутники завжди мають якір у лівому верхньому куті
            switch (arguments.length) {
                case 2:
                    // either a 4-tuple or rect like object
                    switch (arguments[1].tp$name) {
                        case 'tuple':
                            var coords = Sk.ffi.remapToJs(arguments[1]);
                            self.coords = {
                                x1: coords[0],
                                y1: coords[1],
                                x2: coords[2] + coords[0],
                                y2: coords[3] + coords[1]
                            }
                            break;
                        default:
                            var other = arguments[1];
                            self.coords = {
                                x1: other.coords.x1,
                                x2: other.coords.x2,
                                y1: other.coords.y1,
                                y2: other.coords.y2
                            }
                    }
                    break;
                case 3:
                    // pair of 2-tuples
                    var topLeft = Sk.ffi.remapToJs(arguments[1]);
                    if (topLeft.length == 2) {
                        self.coords.x1 = topLeft[0];
                        self.coords.y1 = topLeft[1];
                    }
                    var dims = Sk.ffi.remapToJs(arguments[2]);
                    if (dims.length == 2) {
                        self.coords.x2 = self.coords.x1 + dims[0];
                        self.coords.y2 = self.coords.y1 + dims[1];
                    }
                    break;
                case 5:
                    // individual coordinates
                    self.coords.x1 = Sk.ffi.remapToJs(arguments[1]);
                    self.coords.y1 = Sk.ffi.remapToJs(arguments[2]);
                    self.coords.x2 = self.coords.x1 + Sk.ffi.remapToJs(arguments[3]);
                    self.coords.y2 = self.coords.y1 + Sk.ffi.remapToJs(arguments[4]);
                    break;
            }
            // Синхронізуємо attributes з coords
            updateRectFromXY(self);
        });
        $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
            var jsName = Sk.ffi.remapToJs(name);
            var makePyTuple = function(arr) {
                return new Sk.builtin.tuple(arr.map(function(item) {
                    return Sk.ffi.remapToPy(item);
                }));
            };
            switch (jsName) {
                case 'centerx':
                    return Sk.ffi.remapToPy((self.coords.x1 + self.coords.x2) / 2);
                case 'centery':
                    return Sk.ffi.remapToPy((self.coords.y1 + self.coords.y2) / 2);
                case 'center':
                    return makePyTuple([(self.coords.x1 + self.coords.x2) / 2, (self.coords.y1 + self.coords.y2) / 2]);
                case 'y':
                case 'top':
                    return Sk.ffi.remapToPy(self.coords.y1);
                case 'x':
                case 'left':
                    return Sk.ffi.remapToPy(self.coords.x1);
                case 'right':
                    return Sk.ffi.remapToPy(self.coords.x2);
                case 'bottom':
                    return Sk.ffi.remapToPy(self.coords.y2);
                case 'w':
                case 'width':
                    return Sk.ffi.remapToPy(self.coords.x2 - self.coords.x1);
                case 'h':
                case 'height':
                    return Sk.ffi.remapToPy(self.coords.y2 - self.coords.y1);
                case 'midtop':
                    return makePyTuple([(self.coords.x1 + self.coords.x2) / 2, self.coords.y1]);
                case 'midbottom':
                    return makePyTuple([(self.coords.x1 + self.coords.x2) / 2, self.coords.y2]);
                case 'midleft':
                    return makePyTuple([self.coords.x1, (self.coords.y1 + self.coords.y2) / 2]);
                case 'midright':
                    return makePyTuple([self.coords.x2, (self.coords.y1 + self.coords.y2) / 2]);
                case 'size':
                    return makePyTuple([self.coords.x2 - self.coords.x1, self.coords.y2 - self.coords.y1]);
                case 'pos':
                case 'topleft':
                    return makePyTuple([self.coords.x1, self.coords.y1]);
                case 'topright':
                    return makePyTuple([self.coords.x2, self.coords.y1]);
                case 'bottomleft':
                    return makePyTuple([self.coords.x1, self.coords.y2]);
                case 'bottomright':
                    return makePyTuple([self.coords.x2, self.coords.y2]);
                default:
                    if (self.attributes.hasOwnProperty(jsName)) {
                        var val = self.attributes[jsName];
                        // Переконуємось, що повертаємо об'єкт Skulpt, а не число JS
                        return (val instanceof Sk.builtin.object) ? val : Sk.ffi.remapToPy(val);
                    }
                    return undefined;
            }
        });
        $loc.__setattr__ = new Sk.builtin.func(function(self, name, value) {
            var jsName = Sk.ffi.remapToJs(name);
            var jsVal = Sk.ffi.remapToJs(value);
            switch (jsName) {
                case 'x':
                case 'left':
                    var w = self.coords.x2 - self.coords.x1;
                    self.coords.x1 = jsVal;
                    self.coords.x2 = self.coords.x1 + w;
                    break;
                case 'y':
                case 'top':
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.y1 = jsVal;
                    self.coords.y2 = self.coords.y1 + h;
                    break;
                case 'right':
                    var w = self.coords.x2 - self.coords.x1;
                    self.coords.x2 = jsVal;
                    self.coords.x1 = self.coords.x2 - w;
                    break;
                case 'bottom':
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.y2 = jsVal;
                    self.coords.y1 = self.coords.y2 - h;
                    break;
                case 'centerx':
                    var oX = jsVal - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
                    self.coords.x1 += oX;
                    self.coords.x2 += oX;
                    break;
                case 'centery':
                    var oY = jsVal - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
                    self.coords.y1 += oY;
                    self.coords.y2 += oY;
                    break;
                case 'topleft':
                    var w = self.coords.x2 - self.coords.x1;
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.x1 = jsVal[0];
                    self.coords.y1 = jsVal[1];
                    self.coords.x2 = self.coords.x1 + w;
                    self.coords.y2 = self.coords.y1 + h;
                    break;
                case 'topright':
                    var w = self.coords.x2 - self.coords.x1;
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.x2 = jsVal[0];
                    self.coords.y1 = jsVal[1];
                    self.coords.x1 = self.coords.x2 - w;
                    self.coords.y2 = self.coords.y1 + h;
                    break;
                case 'bottomleft':
                    var w = self.coords.x2 - self.coords.x1;
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.x1 = jsVal[0];
                    self.coords.y2 = jsVal[1];
                    self.coords.x2 = self.coords.x1 + w;
                    self.coords.y1 = self.coords.y2 - h;
                    break;
                case 'bottomright':
                    var w = self.coords.x2 - self.coords.x1;
                    var h = self.coords.y2 - self.coords.y1;
                    self.coords.x2 = jsVal[0];
                    self.coords.y2 = jsVal[1];
                    self.coords.x1 = self.coords.x2 - w;
                    self.coords.y1 = self.coords.y2 - h;
                    break;
                case 'midtop':
                    var w = self.coords.x2 - self.coords.x1;
                    var newCenterX = jsVal[0];
                    var newTop = jsVal[1];
                    self.coords.x1 = newCenterX - w / 2;
                    self.coords.x2 = newCenterX + w / 2;
                    self.coords.y1 = newTop;
                    break;
                case 'midbottom':
                    var w = self.coords.x2 - self.coords.x1;
                    var newCenterX = jsVal[0];
                    var newBottom = jsVal[1];
                    self.coords.x1 = newCenterX - w / 2;
                    self.coords.x2 = newCenterX + w / 2;
                    self.coords.y2 = newBottom;
                    break;
                case 'midleft':
                    var h = self.coords.y2 - self.coords.y1;
                    var newLeft = jsVal[0];
                    var newCenterY = jsVal[1];
                    self.coords.x1 = newLeft;
                    self.coords.y1 = newCenterY - h / 2;
                    self.coords.y2 = newCenterY + h / 2;
                    break;
                case 'midright':
                    var h = self.coords.y2 - self.coords.y1;
                    var newRight = jsVal[0];
                    var newCenterY = jsVal[1];
                    self.coords.x2 = newRight;
                    self.coords.y1 = newCenterY - h / 2;
                    self.coords.y2 = newCenterY + h / 2;
                    break;
                case 'center':
                    var oX = jsVal[0] - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
                    var oY = jsVal[1] - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
                    self.coords.x1 += oX;
                    self.coords.x2 += oX;
                    self.coords.y1 += oY;
                    self.coords.y2 += oY;
                    break;
                case 'size':
                    var newW = jsVal[0];
                    var newH = jsVal[1];
                    var cx = (self.coords.x1 + self.coords.x2) / 2;
                    var cy = (self.coords.y1 + self.coords.y2) / 2;
                    self.coords.x1 = cx - newW / 2;
                    self.coords.x2 = cx + newW / 2;
                    self.coords.y1 = cy - newH / 2;
                    self.coords.y2 = cy + newH / 2;
                    break;
                case 'width':
                case 'w':
                    self.coords.x2 = jsVal + self.coords.x1;
                    break;
                case 'height':
                case 'h':
                    self.coords.y2 = jsVal + self.coords.y1;
                    break;
                case 'pos':
                    var oX = jsVal[0] - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
                    var oY = jsVal[1] - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
                    self.coords.x1 += oX;
                    self.coords.x2 += oX;
                    self.coords.y1 += oY;
                    self.coords.y2 += oY;
                    break;
                default:
                    throw new Sk.builtin.AttributeError("Rect object has no attribute '" + jsName + "'");
            }
            updateRectFromXY(self);
        });
        $loc.colliderect = new Sk.builtin.func(function(self) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var other = Sk.misceval.callsim(Sk.globals.Rect, ...args);
            var collide = self.coords.x1 < other.coords.x2 && self.coords.y1 < other.coords.y2 && self.coords.x2 > other.coords.x1 && self.coords.y2 > other.coords.y1
            return Sk.ffi.remapToPy(collide);
        });
        $loc.collidepoint = new Sk.builtin.func(function(self) {
            Sk.builtin.pyCheckArgs("collidepoint", 2, 3);
            var x, y;
            if (arguments.length === 3) {
                // collidepoint(x, y)
                x = Sk.ffi.remapToJs(arguments[1]);
                y = Sk.ffi.remapToJs(arguments[2]);
            } else {
                // collidepoint((x, y)) або інший об'єкт з координатами
                var arg = arguments[1];
                if (arg.tp$name === 'tuple' || (arg.v && arg.v.length >= 2)) {
                    // Кортеж або список
                    var coords = Sk.ffi.remapToJs(arg);
                    x = coords[0];
                    y = coords[1];
                } else if (arg.x !== undefined || arg.y !== undefined) {
                    // Об'єкт з атрибутами x/y (наприклад, інший Rect)
                    x = Sk.ffi.remapToJs(arg.x !== undefined ? arg.x : arg.left);
                    y = Sk.ffi.remapToJs(arg.y !== undefined ? arg.y : arg.top);
                } else {
                    throw new Sk.builtin.TypeError("collidepoint() argument must be (x, y) tuple or object with x/y attributes");
                }
            }
            // Перевірка: точка всередині прямокутника (включно з лівою/верхньою межею,
            // але НЕ включно з правою/нижньою — як у оригінального Pygame)
            var collide = (x >= self.coords.x1 && x < self.coords.x2 && y >= self.coords.y1 && y < self.coords.y2);
            return Sk.ffi.remapToPy(collide);
        });
        $loc.collidelist = new Sk.builtin.func(function(self, others) {
            Sk.builtin.pyCheckArgs("collidelist", 2, 2);
            if (others && others.v && others.v.length) {
                for (var i = 0; i < others.v.length; i++) {
                    var other = others.v[i];
                    if (self.coords.x1 < other.coords.x2 && self.coords.y1 < other.coords.y2 && self.coords.x2 > other.coords.x1 && self.coords.y2 > other.coords.y1) {
                        return Sk.ffi.remapToPy(i);
                    }
                }
            }
            return Sk.ffi.remapToPy(-1);
        });
        $loc.collidelistall = new Sk.builtin.func(function(self, others) {
            Sk.builtin.pyCheckArgs("collidelistall", 2, 2);
            var result = [];
            if (others && others.v && others.v.length) {
                for (var i = 0; i < others.v.length; i++) {
                    var other = others.v[i];
                    if (self.coords.x1 < other.coords.x2 && self.coords.y1 < other.coords.y2 && self.coords.x2 > other.coords.x1 && self.coords.y2 > other.coords.y1) {
                        result.push(i);
                    }
                }
            }
            return Sk.ffi.remapToPy(result);
        });
        $loc.contains = new Sk.builtin.func(function(self, other) {
            Sk.builtin.pyCheckArgs("contains", 2, 2);
            // Переконуємось, що other — це Rect
            var otherRect = other;
            if (other.tp$name !== 'Rect') {
                // Спробуємо конвертувати з кортежу
                otherRect = Sk.misceval.callsim(Sk.globals.Rect, other);
            }
            var result = (self.coords.x1 <= otherRect.coords.x1 && self.coords.y1 <= otherRect.coords.y1 && self.coords.x2 >= otherRect.coords.x2 && self.coords.y2 >= otherRect.coords.y2);
            return Sk.ffi.remapToPy(result);
        });
        // Метод inflate(dx, dy) або inflate((dx, dy)) — повертає новий збільшений прямокутник
        $loc.inflate = new Sk.builtin.func(function(self) {
            Sk.builtin.pyCheckArgs("inflate", 2, 3);
            var dx, dy;
            if (arguments.length === 3) {
                // Два аргументи: inflate(dx, dy)
                dx = Sk.ffi.remapToJs(arguments[1]);
                dy = Sk.ffi.remapToJs(arguments[2]);
            } else {
                // Один аргумент-кортеж: inflate((dx, dy))
                var arg = Sk.ffi.remapToJs(arguments[1]);
                if (Array.isArray(arg) && arg.length >= 2) {
                    dx = arg[0];
                    dy = arg[1];
                } else {
                    throw new Sk.builtin.TypeError("inflate() argument must be (dx, dy) tuple or two separate arguments");
                }
            }
            // Обчислюємо нові координати (збільшуємо навколо центру)
            var cx = (self.coords.x1 + self.coords.x2) / 2;
            var cy = (self.coords.y1 + self.coords.y2) / 2;
            var newWidth = (self.coords.x2 - self.coords.x1) + dx;
            var newHeight = (self.coords.y2 - self.coords.y1) + dy;
            var newX1 = cx - newWidth / 2;
            var newY1 = cy - newHeight / 2;
            var newX2 = cx + newWidth / 2;
            var newY2 = cy + newHeight / 2;
            // Створюємо новий Rect
            var newRect = Sk.misceval.callsim(Sk.globals.Rect, Sk.ffi.remapToPy(newX1), Sk.ffi.remapToPy(newY1), Sk.ffi.remapToPy(newWidth), Sk.ffi.remapToPy(newHeight));
            return newRect;
        });
        // Метод inflate_ip(dx, dy) або inflate_ip((dx, dy)) — змінює прямокутник "на місці"
        $loc.inflate_ip = new Sk.builtin.func(function(self) {
            Sk.builtin.pyCheckArgs("inflate_ip", 2, 3);
            var dx, dy;
            if (arguments.length === 3) {
                dx = Sk.ffi.remapToJs(arguments[1]);
                dy = Sk.ffi.remapToJs(arguments[2]);
            } else {
                var arg = Sk.ffi.remapToJs(arguments[1]);
                if (Array.isArray(arg) && arg.length >= 2) {
                    dx = arg[0];
                    dy = arg[1];
                } else {
                    throw new Sk.builtin.TypeError("inflate_ip() argument must be (dx, dy) tuple or two separate arguments");
                }
            }
            // Обчислюємо нові координати
            var cx = (self.coords.x1 + self.coords.x2) / 2;
            var cy = (self.coords.y1 + self.coords.y2) / 2;
            var newWidth = (self.coords.x2 - self.coords.x1) + dx;
            var newHeight = (self.coords.y2 - self.coords.y1) + dy;
            self.coords.x1 = cx - newWidth / 2;
            self.coords.y1 = cy - newHeight / 2;
            self.coords.x2 = cx + newWidth / 2;
            self.coords.y2 = cy + newHeight / 2;
            updateRectFromXY(self); // оновлюємо атрибути x, y, width, height
            return Sk.builtin.none.none$;
        });
    }, "Rect", []);

    function unpackKWA(kwa) {
        result = {};
        for (var i = 0; i < kwa.length; i += 2) {
            var key = Sk.ffi.remapToJs(kwa[i]);
            var val = kwa[i + 1];
            result[key] = val;
        }
        return result;
    }
    var Surface = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.blit = new Sk.builtin.func(function(self, source, dest, area, special_flags) {
            Sk.builtin.pyCheckArgs("blit", 3, 5);
            if (self.actor !== undefined) {
                throw new Sk.builtin.NotImplementedError("You can currently only blit to the screen surface");
            }
            if (!(source && source.actor && source.actor.attributes && source.actor.attributes.image)) {
                throw new Sk.builtin.TypeError("The source must be a pygame surface");
            }
            var i = loadedAssets[source.actor.attributes.image];
            var coords = Sk.ffi.remapToJs(dest);
            area = Sk.ffi.remapToJs(area);
            if (area && area.length >= 4) {
                cx.drawImage(i, area[0], area[1], area[2], area[3], coords[0], coords[1], area[2], area[3]);
            } else {
                cx.drawImage(i, coords[0], coords[1]);
            }
        });
        $loc.__init__ = new Sk.builtin.func(function(self, actor) {
            self.actor = actor;
        });
        $loc.set_at = new Sk.builtin.func(function(self, pos, color) {
            Sk.builtin.pyCheckArgs("set_at", 3, 3);
            // отримуємо координати
            var jsPos = Sk.ffi.remapToJs(pos);
            var x = Math.round(jsPos[0]);
            var y = Math.round(jsPos[1]);
            // конвертуємо колір у RGBA
            var jsColor = Sk.ffi.remapToJs(color);
            var rgba = getColor(jsColor);
            // використовуємо глобальний контекст
            cx.save();
            cx.fillStyle = rgba;
            cx.fillRect(x, y, 1, 1);
            cx.restore();
            return Sk.builtin.none.none$;
        });
        $loc.get_at = new Sk.builtin.func(function(self, pos) {
            Sk.builtin.pyCheckArgs("get_at", arguments, 2, 2);
            var jsPos = Sk.ffi.remapToJs(pos);
            var x = Math.round(jsPos[0]);
            var y = Math.round(jsPos[1]);
            // перевірка меж як у pygame
            if (x < 0 || y < 0 || x >= width || y >= height) {
                return Sk.ffi.remapToPy([0, 0, 0, 0]);
            }
            var data = cx.getImageData(x, y, 1, 1).data;
            return Sk.ffi.remapToPy([
                data[0], // R
                data[1], // G
                data[2], // B
                data[3] // A
            ]);
        });
    });

    function updateAnchor(self) {
        var i = loadedAssets[self.attributes.image];
        if (i) {
            self.anchorVal.x = calculateAnchor(self.anchor[0], 'x', i.width);
            self.anchorVal.y = calculateAnchor(self.anchor[1], 'y', i.height);
        }
    }
    Sk.globals.Actor = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.distance_to = new Sk.builtin.func(function(self, target) {
            Sk.builtin.pyCheckArgs("distance_to", 2, 2);
            var pos = Sk.ffi.remapToJs(target);
            var tx = 0;
            var ty = 0;
            if (pos) {
                tx = pos[0];
                ty = pos[1];
            } else {
                tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
                ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
            }
            var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
            var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
            var dx = tx - myx
            var dy = myy - ty
            return Sk.ffi.remapToPy(Math.sqrt(dx * dx + dy * dy));
        });
        $loc.angle_to = new Sk.builtin.func(function(self, target) {
            Sk.builtin.pyCheckArgs("angle_to", 2, 2);
            var pos = Sk.ffi.remapToJs(target);
            var tx = 0;
            var ty = 0;
            if (pos) {
                tx = pos[0];
                ty = pos[1];
            } else {
                tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
                ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
            }
            var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
            var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
            var dx = tx - myx
            var dy = myy - ty
            return Sk.ffi.remapToPy(Math.atan2(dy, dx) * 180 / Math.PI);
        });
        $loc.collidepoint = new Sk.builtin.func(function(self, pos) {
            Sk.builtin.pyCheckArgs("collidepoint", 2, 2);
            var c = Sk.ffi.remapToJs(pos);
            var pt = {
                x: c[0],
                y: c[1]
            }
            return new Sk.builtin.bool(pt.x >= self.attributes.x && pt.x <= self.attributes.right && pt.y >= self.attributes.y && pt.y <= self.attributes.bottom);
        });
        // величини для обчислення "якорів"
        var anchors = {
            x: {
                left: 0.0,
                center: 0.5,
                middle: 0.5,
                right: 1.0
            },
            y: {
                top: 0.0,
                center: 0.5,
                middle: 0.5,
                bottom: 1.0
            }
        }

        function calculateAnchor(value, dim, total) {
            if (typeof value == 'string') {
                try {
                    return total * anchors[dim][value];
                } catch (e) {
                    throw new Sk.builtin.ValueError(value + " is not a valid " + dim + "-anchor name");
                }
            }
            return value;
        }

        function transformAnchor(ax, ay, w, h, angle) {
            var theta = -angle * Math.PI / 180;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            var tw = abs(w * cosTheta) + abs(h * sinTheta);
            var th = abs(w * sinTheta) + abs(h * cosTheta);
            var cax = ax - w * 0.5;
            var cay = ay - h * 0.5;
            var rax = cax * cosTheta - cay * sinTheta;
            var ray = cax * sinTheta + cay * cosTheta;
            return {
                x: tw * 0.5 + rax,
                y: th * 0.5 + ray
            };
        }
        // обчислюємо відносні координати "якоря" 
        function updateAnchor(self) {
            var i = loadedAssets[self.attributes.image];
            if (i) {
                self.anchorVal.x = calculateAnchor(self.anchor[0], 'x', i.width);
                self.anchorVal.y = calculateAnchor(self.anchor[1], 'y', i.height);
            }
        }
        $loc.__getattr__ = new Sk.builtin.func(getActorAttribute);
        $loc.__setattr__ = new Sk.builtin.func(updateActorAttribute);
        //-----------------------------------
        var init = function(kwa, self, name, posArg) {
            Sk.builtin.pyCheckArgs("_init_", 2, 3);
            self.id = idCount++;
            self.attributes = {
                x: 0,
                y: 0,
                angle: 0,
                scale: 1,
                opacity: 1,
                flip_x: false,
                flip_y: false,
                image: Sk.ffi.remapToJs(name)
            };
            self.direction = 0;
            self.fps = 5;
            self.image_index = 0;
            self.images = [];
            self.others = {};
            self.others._surf = Sk.misceval.callsim(Surface, self);
            self.anchor = ['center', 'center'];
            self.anchorVal = {
                x: 0,
                y: 0
            };
            var args = unpackKWA(kwa);
            if (args.anchor) {
                self.anchor[0] = args.anchor.v[0].v;
                self.anchor[1] = args.anchor.v[1].v;
            }
            // позиція
            var desiredX = 0,
                desiredY = 0;
            var pos = posArg ?? args.pos;
            if (pos) {
                pos = Sk.ffi.remapToJs(pos);
                desiredX = pos[0];
                desiredY = pos[1];
            }
            self._loaded = false;
            var jsName = Sk.ffi.remapToJs(name);
            var img = loadImage(jsName);
            if (img) {
                self.attributes.width = img.width;
                self.attributes.height = img.height;
                updateAnchor(self);
                self.attributes.x = desiredX - self.anchorVal.x;
                self.attributes.y = desiredY - self.anchorVal.y;
                updateRectFromXY(self);
                self._loaded = true;
            } else {
                throw new Sk.builtin.KeyError("Image '" + jsName + "' not found or invalid.");
                self.attributes.width = 0;
                self.attributes.height = 0;
                updateAnchor(self);
                self.attributes.x = desiredX - self.anchorVal.x;
                self.attributes.y = desiredY - self.anchorVal.y;
                updateRectFromXY(self);
                self._loaded = true;
            }
            return Sk.builtin.none.none$;
        };
        init.co_kwargs = true;
        $loc.__init__ = new Sk.builtin.func(init);
        // width / height як геттери
        Object.defineProperty($loc, 'width', {
            get: function() {
                return this.attributes.width;
            }
        });
        Object.defineProperty($loc, 'height', {
            get: function() {
                return this.attributes.height;
            }
        });
        //
        $loc.draw = new Sk.builtin.func(function(self) {
            if (!loadedAssets[self.attributes.image]) {
                return;
            }
            updateRectFromXY(self); // Оновлюємо rect для колізій (важливо для інших методів)
            var i = loadedAssets[self.attributes.image];
            var a = self.attributes;
            // Масштабовані розміри зображення
            var w = a.width * a.scale;
            var h = a.height * a.scale;
            var radians = a.angle * Math.PI / 180;
            // Масштабовані координати якоря відносно оригіналу (в пікселях)
            var ax_scaled = self.anchorVal.x * a.scale;
            var ay_scaled = self.anchorVal.y * a.scale;
            cx.save();
            cx.globalAlpha = a.opacity;
            // 1. Переміщуємося до світових координат якоря
            cx.translate(a.x + ax_scaled, a.y + ay_scaled);
            // 2. Обертаємо навколо якоря (від'ємний кут для проти годинникової стрілки, як у Pygame)
            if (a.angle !== 0) {
                cx.rotate(-radians);
            }
            // 3. Застосовуємо віддзеркалення ВІДНОСНО ЯКОРЯ
            var sx = a.flip_x ? -1 : 1;
            var sy = a.flip_y ? -1 : 1;
            cx.scale(sx, sy);
            // 4. Малюємо зображення так, щоб якор в оригіналі потрапляв у (0,0) поточної системи координат
            // Після scale(sx, sy) зміщення коректно враховує віддзеркалення
            cx.drawImage(i, -ax_scaled, -ay_scaled, w, h);
            cx.restore();
        });
        $loc.next_image = new Sk.builtin.func(function(self) {
            if (self.images.length === 0) {
                return Sk.builtin.none.none$;
            }
            self.image_index = (self.image_index + 1) % self.images.length;
            self.attributes.image = self.images[self.image_index];
            updateRectFromXY(self); // оновлюємо розміри, якщо нове зображення іншого розміру
            return Sk.builtin.none.none$;
        });
        $loc.animate = new Sk.builtin.func(function(self) {
            if (!self.images || self.images.length === 0) {
                return Sk.builtin.none.none$;
            }
            // Ініціалізуємо лічильник кадрів, якщо ще не існує
            if (self.frame_counter === undefined) {
                self.frame_counter = 0;
            }
            self.frame_counter += 1;
            // Обчислюємо інтервал у кадрах: 60 FPS / self.fps
            var interval = 60 / self.fps;
            if (self.frame_counter >= interval) {
                // Перемикаємо зображення
                self.image_index = (self.image_index + 1) % self.images.length;
                self.attributes.image = self.images[self.image_index];
                updateRectFromXY(self);
                self.frame_counter = 0; // скидаємо лічильник
            }
            return Sk.builtin.none.none$;
        });
        $loc.move_forward = new Sk.builtin.func(function(self, distance) {
            var d = Sk.ffi.remapToJs(distance);
            var angleRad = self.attributes.angle * Math.PI / 180;
            self.attributes.x += d * Math.cos(angleRad);
            self.attributes.y += d * Math.sin(angleRad);
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.move_back = new Sk.builtin.func(function(self, distance) {
            var d = Sk.ffi.remapToJs(distance);
            var angleRad = self.attributes.angle * Math.PI / 180;
            self.attributes.x -= d * Math.cos(angleRad);
            self.attributes.y -= d * Math.sin(angleRad);
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.move_right = new Sk.builtin.func(function(self, distance) {
            var d = Sk.ffi.remapToJs(distance);
            var angleRad = (self.attributes.angle + 90) * Math.PI / 180; // 90° to the right of forward
            self.attributes.x += d * Math.cos(angleRad);
            self.attributes.y += d * Math.sin(angleRad);
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.move_left = new Sk.builtin.func(function(self, distance) {
            var d = Sk.ffi.remapToJs(distance);
            var angleRad = (self.attributes.angle - 90) * Math.PI / 180; // 90° to the left of forward
            self.attributes.x += d * Math.cos(angleRad);
            self.attributes.y += d * Math.sin(angleRad);
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.move_in_direction = new Sk.builtin.func(function(self, distance) {
            var d = Sk.ffi.remapToJs(distance);
            var angleRad = self.direction * Math.PI / 180;
            self.attributes.x += d * Math.cos(angleRad);
            self.attributes.y += d * Math.sin(angleRad);
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.distance_to = new Sk.builtin.func(function(self, other) {
            Sk.builtin.pyCheckArgs("distance_to", 2, 2);
            // Отримуємо центри обох акторів
            var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var other_center = Sk.ffi.remapToJs(getActorAttribute(other, Sk.ffi.remapToPy("center")));
            var dx = other_center[0] - self_center[0];
            var dy = other_center[1] - self_center[1];
            var distance = Math.sqrt(dx * dx + dy * dy);
            return Sk.ffi.remapToPy(distance);
        });
        $loc.direction_to = new Sk.builtin.func(function(self, other) {
            Sk.builtin.pyCheckArgs("direction_to", 2, 2);
            // Отримуємо центри обох акторів
            var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var other_center = Sk.ffi.remapToJs(getActorAttribute(other, Sk.ffi.remapToPy("center")));
            var dx = other_center[0] - self_center[0];
            var dy = other_center[1] - self_center[1];
            // atan2(dy, dx) дає кут від осі X, з урахуванням квадранту
            // У системі canvas: Y зростає вниз → це вже враховано
            var angleRad = Math.atan2(dy, dx);
            var angleDeg = angleRad * 180 / Math.PI;
            return Sk.ffi.remapToPy(angleDeg);
        });
        $loc.move_towards = new Sk.builtin.func(function(self, target, distance) {
            Sk.builtin.pyCheckArgs("move_towards", 3, 3);
            var dist = Sk.ffi.remapToJs(distance);
            // Отримуємо центри обох акторів
            var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var target_center = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("center")));
            var dx = target_center[0] - self_center[0];
            var dy = target_center[1] - self_center[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) {
                // Ціль у тій самій точці — нічого не робимо
                return Sk.builtin.none.none$;
            }
            // Нормалізований вектор, помножений на відстань
            var stepX = (dx / length) * dist;
            var stepY = (dy / length) * dist;
            self.attributes.x += stepX;
            self.attributes.y += stepY;
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.point_towards = new Sk.builtin.func(function(self, target) {
            Sk.builtin.pyCheckArgs("point_towards", 2, 2);
            // Отримуємо центри обох акторів
            var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var target_center = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("center")));
            var dx = target_center[0] - self_center[0];
            var dy = target_center[1] - self_center[1];
            var angleRad = Math.atan2(dy, dx);
            self.attributes.angle = angleRad * 180 / Math.PI;
            updateRectFromXY(self);
            return Sk.builtin.none.none$;
        });
        $loc.circle_collidepoint = new Sk.builtin.func(function(self, pos, radius) {
            Sk.builtin.pyCheckArgs("circle_collidepoint", 2, 3);
            var center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var px = Sk.ffi.remapToJs(pos)[0];
            var py = Sk.ffi.remapToJs(pos)[1];
            var r = (radius !== undefined) ? Sk.ffi.remapToJs(radius) : Math.max(self.attributes.width, self.attributes.height) / 2;
            var dx = px - center[0];
            var dy = py - center[1];
            var distanceSquared = dx * dx + dy * dy;
            var radiusSquared = r * r;
            return Sk.ffi.remapToPy(distanceSquared <= radiusSquared);
        });
        $loc.circle_collidepoints = new Sk.builtin.func(function(self, points, radius) {
            Sk.builtin.pyCheckArgs("circle_collidepoints", 2, 3);
            var center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
            var r = (radius !== undefined) ? Sk.ffi.remapToJs(radius) : Math.max(self.attributes.width, self.attributes.height) / 2;
            var radiusSquared = r * r;
            var pyPoints = Sk.ffi.remapToJs(points);
            for (var i = 0; i < pyPoints.length; i++) {
                var pt = pyPoints[i];
                var px = pt[0];
                var py = pt[1];
                var dx = px - center[0];
                var dy = py - center[1];
                var distanceSquared = dx * dx + dy * dy;
                if (distanceSquared <= radiusSquared) {
                    return Sk.ffi.remapToPy(true);
                }
            }
            return Sk.ffi.remapToPy(false);
        });
        $loc.__repr__ = new Sk.builtin.func(function(self) {
            return Sk.ffi.remapToPy(self.attributes.image + " (x:" + (self.attributes.x + self.anchorVal.x) + "," + (self.attributes.y + self.anchorVal.y) + ")");
        });
    }, 'Actor', [Sk.globals.Rect]);

    var EnumValue = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self, enumName, key, value) {
            self.enumName = enumName;
            self.key = key;
            self.value = value;
        });
        $loc.__str__ = new Sk.builtin.func(function(self) {
            return new Sk.builtin.str(self.enumName + "." + self.key);
        });
        // 
        $loc.__repr__ = new Sk.builtin.func(function(self) {
            return new Sk.builtin.str("<" + self.enumName + "." + self.key + ": " + self.value + ">");
        });
        //
        $loc.__getattr__ = new Sk.builtin.func(function(self, a) {
            switch (Sk.ffi.remapToJs(a)) {
                case 'name':
                    return Sk.ffi.remapToPy(self.key);
                case 'value':
                    return Sk.ffi.remapToPy(self.value);
            }
        });
        $loc.__int__ = new Sk.builtin.func(function(self) {
            return Sk.ffi.remapToPy(self.value);
        });
        $loc.__eq__ = new Sk.builtin.func(function(self, other) {
            var cmpTo = Sk.ffi.remapToJs(other);
            if (other.value !== undefined) {
                cmpTo = Sk.ffi.remapToJs(other.value);
            }
            return Sk.ffi.remapToPy(Sk.ffi.remapToJs(self.value) == cmpTo);
        });
    }, 'enum', []);
    
    var Enum = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self, name) {
            self.values = {};
            self.name = name;
        });
        $loc.__str__ = new Sk.builtin.func(function(self) {
            return new Sk.builtin.str("enum '" + self.name + "'");
        });
    }, 'Enum', []);
    
    var keysPressed = {}
    var keysCodePressed = new Set();

    function isKeyPressed(key) {
        return new Sk.builtin.bool(keysPressed[key.toLowerCase()] == true);
    }
    var Keyboard = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {});
        $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
            var key = Sk.ffi.remapToJs(name);
            if (key === "_pressed") {
                var codesArray = [];
                keysCodePressed.forEach(function(code) {
                    codesArray.push(new Sk.builtin.int_(code));
                });
                return new Sk.builtin.set(codesArray);
            }
            if (key.match(/__/)) return;
            return isKeyPressed(key);
        });
        // keyboard[key]
        $loc.__getitem__ = new Sk.builtin.func(function(self, key) {
            key = Sk.ffi.remapToJs(key);
            return isKeyPressed(key);
        });
    }, 'pgzero.keyboard.Keyboard', []);
    Sk.globals.keyboard = Sk.misceval.callsim(Keyboard);
    var mouse = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var id = 1;

        function addVal(key, value) {
            if (value == undefined) {
                value = id++;
            }
            $loc[key] = Sk.misceval.callsim(EnumValue, "mouse", key, value);
        }
        addVal('LEFT');
        addVal('MIDDLE');
        addVal('RIGHT');
    }, 'mouse', [Enum]);
    Sk.globals.mouse = Sk.misceval.callsim(mouse, 'mouse');
    var keys = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var values = {
            // Special keys
            BACKSPACE: 8,
            TAB: 9,
            CLEAR: 12,
            RETURN: 13,
            ENTER: 13,
            PAUSE: 19,
            ESCAPE: 27,
            SPACE: 32,
            // Arrow keys
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            // Modifier keys
            SHIFT: 16,
            LSHIFT: 16,
            RSHIFT: 16,
            CTRL: 17,
            LCTRL: 17,
            RCTRL: 17,
            ALT: 18,
            LALT: 18,
            RALT: 18,
            META: 91,
            LMETA: 91,
            RMETA: 92,
            // Function keys
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123,
            F13: 124,
            F14: 125,
            F15: 126,
            // Navigation keys
            HOME: 36,
            END: 35,
            PAGEUP: 33,
            PAGEDOWN: 34,
            INSERT: 45,
            DELETE: 46,
            // Lock keys
            CAPSLOCK: 20,
            NUMLOCK: 144,
            SCROLLOCK: 145,
            // Numeric keypad
            KP0: 96,
            KP1: 97,
            KP2: 98,
            KP3: 99,
            KP4: 100,
            KP5: 101,
            KP6: 102,
            KP7: 103,
            KP8: 104,
            KP9: 105,
            KP_PERIOD: 110,
            KP_DIVIDE: 111,
            KP_MULTIPLY: 106,
            KP_MINUS: 109,
            KP_PLUS: 107,
            KP_ENTER: 108,
            KP_EQUALS: 187,
            // Letters
            A: 65,
            B: 66,
            C: 67,
            D: 68,
            E: 69,
            F: 70,
            G: 71,
            H: 72,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            M: 77,
            N: 78,
            O: 79,
            P: 80,
            Q: 81,
            R: 82,
            S: 83,
            T: 84,
            U: 85,
            V: 86,
            W: 87,
            X: 88,
            Y: 89,
            Z: 90,
            // Numbers (main keyboard)
            K_0: 48,
            K_1: 49,
            K_2: 50,
            K_3: 51,
            K_4: 52,
            K_5: 53,
            K_6: 54,
            K_7: 55,
            K_8: 56,
            K_9: 57,
            // Symbols
            EXCLAIM: 49, // '!'
            QUOTEDBL: 222, // '"'
            HASH: 51, // '#'
            DOLLAR: 52, // '$'
            AMPERSAND: 55, // '&'
            QUOTE: 222, // "'"
            LEFTPAREN: 57, // '('
            RIGHTPAREN: 48, // ')'
            ASTERISK: 56, // '*'
            PLUS: 187, // '+'
            COMMA: 188, // ','
            MINUS: 189, // '-'
            PERIOD: 190, // '.'
            SLASH: 191, // '/'
            COLON: 186, // ':'
            SEMICOLON: 186, // ';'
            LESS: 188, // '<'
            EQUALS: 187, // '='
            GREATER: 190, // '>'
            QUESTION: 191, // '?'
            AT: 50, // '@'
            LEFTBRACKET: 219, // '['
            BACKSLASH: 220, // '\'
            RIGHTBRACKET: 221, // ']'
            CARET: 54, // '^'
            UNDERSCORE: 189, // '_'
            BACKQUOTE: 192, // '`'
            // Additional keys
            HELP: 47,
            PRINT: 42,
            SYSREQ: 124,
            BREAK: 19,
            MENU: 93,
            POWER: 0,
            EURO: 0,
            LAST: 0
        };
        for (var key in values) {
            $loc[key] = Sk.misceval.callsim(EnumValue, "keys", key, values[key]);
        }
    }, 'keys', [Enum]);
    Sk.globals.keys = Sk.misceval.callsim(keys, 'keys');
    var SurfacePainter = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var line = function(kwa, self, coord1, coord2, color) {
            var jsColor = "black";
            var x1, y1, x2, y2;
            var jsCoord1 = Sk.ffi.remapToJs(coord1);
            var jsCoord2 = coord2 !== undefined ? Sk.ffi.remapToJs(coord2) : undefined;
            var jsColorArg = color !== undefined ? Sk.ffi.remapToJs(color) : undefined;
            // line((x1, y1, x2, y2), color, ...)
            // coord1 - масив з 4 елементів
            if (Array.isArray(jsCoord1) && jsCoord1.length === 4) {
                x1 = jsCoord1[0];
                y1 = jsCoord1[1];
                x2 = jsCoord1[2];
                y2 = jsCoord1[3];
                // Якщо другий аргумент - рядок, це колір
                if (jsCoord2 !== undefined && typeof jsCoord2 === 'string') {
                    jsColor = jsCoord2;
                }
            }
            // line(((x1, y1), (x2, y2)), color, ...)
            // coord1 - масив з 2 елементів, кожен з яких масив
            else if (Array.isArray(jsCoord1) && jsCoord1.length === 2 && Array.isArray(jsCoord1[0]) && Array.isArray(jsCoord1[1])) {
                x1 = jsCoord1[0][0];
                y1 = jsCoord1[0][1];
                x2 = jsCoord1[1][0];
                y2 = jsCoord1[1][1];
                // Якщо другий аргумент - рядок, це колір
                if (jsCoord2 !== undefined && typeof jsCoord2 === 'string') {
                    jsColor = jsCoord2;
                }
            }
            // line((x1, y1), (x2, y2), color, ...)
            // coord1 і coord2 - окремі масиви з 2 елементів
            else if (Array.isArray(jsCoord1) && jsCoord1.length === 2 && Array.isArray(jsCoord2) && jsCoord2.length === 2) {
                x1 = jsCoord1[0];
                y1 = jsCoord1[1];
                x2 = jsCoord2[0];
                y2 = jsCoord2[1];
                // Якщо третій аргумент - рядок, це колір
                if (jsColorArg !== undefined) {
                    jsColor = jsColorArg;
                }
            } else {
                // Невідомий формат - помилка
                throw new Error("Invalid line coordinates format. Expected: (x1,y1,x2,y2) or ((x1,y1),(x2,y2)) or (x1,y1),(x2,y2)");
            }
            // Обробка kwargs (може перевизначити колір)
            var props = unpackKWA(kwa);
            if (props.color) {
                jsColor = Sk.ffi.remapToJs(props.color);
            }
            cx.strokeStyle = getColor(jsColor);
            var lineWidth = props.width !== undefined ? props.width : 1;
            cx.lineWidth = lineWidth;
            cx.beginPath();
            cx.moveTo(x1, y1);
            cx.lineTo(x2, y2);
            cx.stroke();
        }
        line.co_kwargs = true;
        $loc.line = new Sk.builtin.func(line);
        var circle = function(kwa, self, coords, radius, color) {
            Sk.builtin.pyCheckArgs("circle", 3, 3);
            var jsCoords = Sk.ffi.remapToJs(coords);
            var jsRadius = Sk.ffi.remapToJs(radius);
            var jsColor = Sk.ffi.remapToJs(color);
            var props = unpackKWA(kwa);
            var lineWidth = (props && props.width !== undefined) ? props.width : 1;
            cx.strokeStyle = getColor(jsColor);
            cx.lineWidth = Sk.ffi.remapToJs(lineWidth);
            cx.beginPath();
            cx.arc(jsCoords[0], jsCoords[1], jsRadius, 0, 2 * Math.PI);
            cx.stroke();
        };
        circle.co_kwargs = true;
        $loc.circle = new Sk.builtin.func(circle);
        var rect = function(kwa, self, coord, color) {
            // 1. rect(Rect object, color, width=...)
            // 2. rect((x, y, w, h), color, width=...)
            // 3. rect((x, y), (w, h), color, width=...)
            var jsColor = Sk.ffi.remapToJs(color);
            cx.strokeStyle = getColor(jsColor);
            var props = unpackKWA(kwa);
            var lineWidth = props.width !== undefined ? props.width : 1;
            cx.lineWidth = Sk.ffi.remapToJs(lineWidth);
            var x, y, w, h;
            // Перевіряємо, чи це об'єкт Rect
            if (coord && coord.coords) {
                // Rect object
                x = coord.coords.x1;
                y = coord.coords.y1;
                w = coord.coords.x2 - coord.coords.x1;
                h = coord.coords.y2 - coord.coords.y1;
            } else {
                // Звичайний кортеж
                var jsCoords = Sk.ffi.remapToJs(coord);
                // rect((x, y, w, h), color, ...)
                if (jsCoords.length === 4) {
                    x = jsCoords[0];
                    y = jsCoords[1];
                    w = jsCoords[2];
                    h = jsCoords[3];
                }
                // rect((x, y), (w, h), color, ...)
                else if (jsCoords.length === 2) {
                    x = jsCoords[0][0];
                    y = jsCoords[0][1];
                    w = jsCoords[1][0];
                    h = jsCoords[1][1];
                } else {
                    throw new Sk.builtin.TypeError("rect() takes either Rect object, (left, top, width, height) or ((left, top), (width, height))");
                }
            }
            cx.beginPath();
            cx.rect(x, y, w, h);
            cx.stroke();
        };
        rect.co_kwargs = true;
        $loc.rect = new Sk.builtin.func(rect);
        $loc.filled_rect = new Sk.builtin.func(function(self, rect, color) {
            Sk.builtin.pyCheckArgs("filled_rect", 3, 3);
            var args = {
                x1: rect.coords.x1,
                y1: rect.coords.y1,
                x2: rect.coords.x2,
                y2: rect.coords.y2,
                color: Sk.ffi.remapToJs(color)
            }
            cx.fillStyle = getColor(args.color);
            cx.beginPath();
            cx.rect(args.x1, args.y1, args.x2 - args.x1, args.y2 - args.y1);
            cx.fill();
        });
        $loc.filled_circle = new Sk.builtin.func(function(self, pos, radius, color) {
            Sk.builtin.pyCheckArgs("filled_circle", arguments, 4, 4);
            var args = {
                coords: Sk.ffi.remapToJs(pos),
                radius: Sk.ffi.remapToJs(radius),
                color: Sk.ffi.remapToJs(color)
            };
            cx.fillStyle = getColor(args.color);
            cx.beginPath();
            cx.arc(args.coords[0], args.coords[1], args.radius, 0, 2 * Math.PI);
            cx.closePath();
            cx.fill();
        });
        //
        function fitSize(text, fontname, bold, width, height, lineheight, strip) {
            function fits(size) {
                cx.font = (bold ? "bold " : "") + size + "px " + fontname;
                const lines = wrapLines(cx, text, width, strip);
                const widths = lines.map(l => cx.measureText(l).width);
                const w = Math.max(...widths, 0);
                // 🔥 pygame-style height calculation
                const metrics = cx.measureText("Mg");
                const fontHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                const lineSize = fontHeight * lineheight;
                const h = Math.round((lines.length - 1) * lineSize) + fontHeight;
                return w <= width && h <= height;
            }
            let a = 1,
                b = 256;
            if (!fits(a)) return a;
            if (fits(b)) return b;
            while (b - a > 1) {
                const c = (a + b) >> 1;
                if (fits(c)) a = c;
                else b = c;
            }
            return a;
        }
        //	
        var textbox = function(kwa, self, text, box) {
            Sk.builtin.pyCheckArgs("textbox", arguments, 3, 4);
            const jsText = Sk.ffi.remapToJs(text);
            const props = {};
            for (let i = 0; i < kwa.length; i += 2) props[Sk.ffi.remapToJs(kwa[i])] = Sk.ffi.remapToJs(kwa[i + 1]);
            props.fontname ??= "Arial";
            props.color ??= "white";
            props.lineheight ??= 1.0; // pygame default
            props.align ??= "center";
            props.valign ??= "middle";
            props.angle ??= 0;

            const rect = box.coords ? {
                x: box.coords.x1,
                y: box.coords.y1,
                width: box.coords.x2 - box.coords.x1,
                height: box.coords.y2 - box.coords.y1
            } : {
                x: box.v[0].v,
                y: box.v[1].v,
                width: box.v[2].v,
                height: box.v[3].v
            };
            const fontsize = fitSize(jsText, props.fontname, true, // bold
                rect.width, rect.height, props.lineheight, true);
            cx.save();
			const angle = (props.angle || 0) * Math.PI / 180;
			if (angle !== 0) {
				const pivotX = rect.x + rect.width / 2;
				const pivotY = rect.y;

				cx.translate(pivotX, pivotY);
				cx.rotate(-angle);
				cx.translate(-pivotX, -pivotY);			}

            if (props.background) {
                cx.fillStyle = getColor(props.background);
                cx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
            cx.font = "bold " + fontsize + "px " + props.fontname;
            cx.textBaseline = "top";
            cx.fillStyle = getColor(props.color);
            const lines = wrapLines(cx, jsText, rect.width, true);
            const metrics = cx.measureText("Mg");
            const fontHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            const lineSize = fontHeight * props.lineheight;
            let totalHeight = (lines.length - 1) * lineSize + fontHeight;
            let y = rect.y;
            if (props.valign === "middle") y += (rect.height - totalHeight) / 2;
            else if (props.valign === "bottom") y += rect.height - totalHeight;
            for (let line of lines) {
                const w = cx.measureText(line).width;
                let x = rect.x;
                if (props.align === "center") x += (rect.width - w) / 2;
                else if (props.align === "right") x += rect.width - w;
                cx.fillText(line, x, y);
                y += lineSize;
            }
            cx.restore();
        };
        textbox.co_kwargs = true;
        $loc.textbox = new Sk.builtin.func(textbox);
        //
        /*   Word wrap helper  */
        function wrapLines(ctx, text, maxWidth) {
            if (!maxWidth) return text.split("\n");
            const result = [];
            const paragraphs = text.split("\n");
            for (let p of paragraphs) {
                const words = p.split(" ");
                let line = "";
                for (let w of words) {
                    const test = line ? line + " " + w : w;
                    if (ctx.measureText(test).width > maxWidth && line) {
                        result.push(line);
                        line = w;
                    } else {
                        line = test;
                    }
                }
                result.push(line);
            }
            return result;
        }
        /* screen.draw.text */
        var text = function(kwa, self, text, pos) {
            Sk.builtin.pyCheckArgs("text", arguments, 2, 4);
            var jsText = Sk.ffi.remapToJs(text);
            // ---------- kwargs ---------- 
            var props = {};
            for (var i = 0; i < kwa.length; i += 2) {
                var key = Sk.ffi.remapToJs(kwa[i]);
                props[key] = Sk.ffi.remapToJs(kwa[i + 1]);
            }
            // ---------- defaults ---------- 
            props.fontname ??= "Arial";
            props.fontsize ??= 24;
            props.color ??= "white";
            props.ocolor ??= "#000";
            props.owidth ??= 0;
            //props.align ??= "center";
            props.angle ??= 0;
            props.alpha ??= 1.0;
            props.lineheight ??= 1.0;
            props.x ??= 0;
            props.y ??= 0;
            props.y ??= 0;
            const PYGAME_FONT_SCALE = 0.70;
            cx.font = "bold " + (props.fontsize * PYGAME_FONT_SCALE) + "px " + props.fontname;
            cx.textBaseline = "top";
            var maxWidth = props.width || null;
            if (props.widthem) {
                maxWidth = props.widthem * props.fontsize;
            }
            var lines = wrapLines(cx, jsText, maxWidth);
            var lineHeight = props.lineheight * props.fontsize;
            var size = {
                width: 0,
                height: lineHeight * lines.length,
                lineWidths: []
            };
            for (var i = 0; i < lines.length; i++) {
                var w = cx.measureText(lines[i]).width;
                size.lineWidths.push(w);
                if (w > size.width) size.width = w;
            }
            // визначаємо точку позиціонування (якір) до виклику updateCoordsFromProps 
            var anchorPoint = null;
            // Перевіряємо всі можливі параметри позиціонування
            if (props.pos) {
                props.topleft = props.pos;
            }
            if (props.center) {
                anchorPoint = {
                    x: props.center[0],
                    y: props.center[1]
                };
            } else if (props.centerx !== undefined && props.centery !== undefined) {
                anchorPoint = {
                    x: props.centerx,
                    y: props.centery
                };
            } else if (props.topleft) {
                anchorPoint = {
                    x: props.topleft[0],
                    y: props.topleft[1]
                };
            } else if (props.topright) {
                anchorPoint = {
                    x: props.topright[0],
                    y: props.topright[1]
                };
            } else if (props.bottomleft) {
                anchorPoint = {
                    x: props.bottomleft[0],
                    y: props.bottomleft[1]
                };
            } else if (props.bottomright) {
                anchorPoint = {
                    x: props.bottomright[0],
                    y: props.bottomright[1]
                };
            } else if (props.midtop) {
                anchorPoint = {
                    x: props.midtop[0],
                    y: props.midtop[1]
                };
            } else if (props.midleft) {
                anchorPoint = {
                    x: props.midleft[0],
                    y: props.midleft[1]
                };
            } else if (props.midbottom) {
                anchorPoint = {
                    x: props.midbottom[0],
                    y: props.midbottom[1]
                };
            } else if (props.midright) {
                anchorPoint = {
                    x: props.midright[0],
                    y: props.midright[1]
                };
            } else if (props.left !== undefined && props.top !== undefined) {
                anchorPoint = {
                    x: props.left,
                    y: props.top
                };
            } else if (props.right !== undefined && props.top !== undefined) {
                anchorPoint = {
                    x: props.right,
                    y: props.top
                };
            } else if (props.left !== undefined && props.bottom !== undefined) {
                anchorPoint = {
                    x: props.left,
                    y: props.bottom
                };
            } else if (props.right !== undefined && props.bottom !== undefined) {
                anchorPoint = {
                    x: props.right,
                    y: props.bottom
                };
            } else if (props.centerx !== undefined && props.top !== undefined) {
                anchorPoint = {
                    x: props.centerx,
                    y: props.top
                };
            } else if (props.left !== undefined && props.centery !== undefined) {
                anchorPoint = {
                    x: props.left,
                    y: props.centery
                };
            } else if (props.centerx !== undefined && props.bottom !== undefined) {
                anchorPoint = {
                    x: props.centerx,
                    y: props.bottom
                };
            } else if (props.right !== undefined && props.centery !== undefined) {
                anchorPoint = {
                    x: props.right,
                    y: props.centery
                };
            }
            // якщо точка позиціонування не була визначена, використовуємо верхній лівий кут
            if (!anchorPoint) {
                props.topleft = [pos?.v?.[0]?.v ?? 0, pos?.v?.[1]?.v ?? 0];
                anchorPoint = {
                    x: props.topleft[0],
                    y: props.topleft[1]
                };
            }
            //  coords (обчислює props.x, props.y - верхній лівий кут) 
            updateCoordsFromProps(props, size, Sk.ffi.remapToJs(pos));
            if (props.background) {
                cx.fillStyle = getColor(props.background);
                cx.fillRect(props.x, props.y, size.width, size.height);
            }
            cx.shadowOffsetX = 0;
            cx.shadowOffsetY = 0;
            if (props.scolor) {
                cx.shadowOffsetX = 2;
                cx.shadowOffsetY = 2;
                cx.shadowColor = props.scolor;
            }
            for (var i = 0; i < lines.length; i++) {
                var x = props.x;
                var y = props.y + i * lineHeight * 0.8;
                if (maxWidth) {
                    if (props.topleft || props.bottomleft || props.midleft) {
                        props.align = "left"
                    }
                    if (props.topright || props.bottomright || props.midright) {
                        props.align = "right"
                    }
                    if (props.midtop || props.midbottom || props.center) {
                        props.align = "center"
                    }
                }
                switch (props.align) {
                    // align для кожного рядка
                    case "center":
                        x += (size.width - size.lineWidths[i]) / 2;
                        break;
                    case "right":
                        x += (size.width - size.lineWidths[i]);
                        break;
                }
                cx.save();
                // обертання навколо точки позиціонування (якоря)
                if (props.angle !== 0) {
                    cx.translate(anchorPoint.x, anchorPoint.y);
                    cx.rotate(-props.angle * Math.PI / 180);
                    cx.translate(-anchorPoint.x, -anchorPoint.y);
                }
                cx.translate(x, y);
                cx.globalAlpha = props.alpha;
                if (props.gcolor) {
                    const grad = cx.createLinearGradient(0, 0, 0, props.fontsize);
                    grad.addColorStop(0, getColor(props.color));
                    grad.addColorStop(0.8, getColor(props.gcolor));
                    cx.fillStyle = grad;
                } else {
                    cx.fillStyle = getColor(props.color);
                }
                if (props.owidth) {
                    cx.strokeStyle = getColor(props.ocolor);
                    cx.lineJoin = "round";
                    cx.lineWidth = props.owidth * props.fontsize / 10;
                    cx.strokeText(lines[i], 0, 0);
                }
                cx.fillText(lines[i], 0, 0);
                cx.restore();
            }
        };
        text.co_kwargs = true;
        $loc.text = new Sk.builtin.func(text);
    }, 'pgzero.screen.SurfacePainter', []);
    
    var Clock = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            self.callbacks = {};
        });
        $loc.schedule_unique = new Sk.builtin.func(function(self, callback, delay) {
            Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
            if (self.callbacks[callback]) {
                clearTimeout(self.callbacks[callback]);
                delete self.callbacks[callback];
            }
            self.callbacks[callback] = setTimeout(function() {
                delete self.callbacks[callback];
                Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
                    window.onerror(e);
                });
            }, Sk.ffi.remapToJs(delay) * 1000);
        });
        $loc.schedule = new Sk.builtin.func(function(self, callback, delay) {
            Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
            self.callbacks[callback] = setTimeout(function() {
                delete self.callbacks[callback];
                Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
                    window.onerror(e);
                });
            }, Sk.ffi.remapToJs(delay) * 1000);
        });
        $loc.schedule_interval = new Sk.builtin.func(function(self, callback, delay) {
            Sk.builtin.pyCheckArgs("schedule_schedule", 3, 3);
            self.callbacks[callback] = setInterval(function() {
                delete self.callbacks[callback];
                Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
                    window.onerror(e);
                });
            }, Sk.ffi.remapToJs(delay) * 1000);
        });
        $loc.unschedule = new Sk.builtin.func(function(self, callback) {
            Sk.builtin.pyCheckArgs("unschedule", arguments, 2, 2);
            var id = self.callbacks[callback];
            if (id !== undefined) {
                clearTimeout(id);
                clearInterval(id);
                delete self.callbacks[callback];
            }
        });
        $loc.each_tick = new Sk.builtin.func(function(self, callback) {
            Sk.builtin.pyCheckArgs("each_tick", arguments, 2, 2);
            // 60 FPS ≈ 0.0167 сек
            scheduleInternal(self, callback, 1 / 60, true);
        });
        $loc.tick = $loc.each_tick;
    }, 'pgzero.clock', []);
    Sk.globals.clock = Sk.misceval.callsim(Clock);
    var Screen = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.clear = new Sk.builtin.func(function(self) {
            Sk.builtin.pyCheckArgs("clear", arguments, 1, 1);
            cx.clearRect(0, 0, width, height);
        });
        $loc.surface = Sk.misceval.callsim(Surface);
        $loc.blit = new Sk.builtin.func(function(self, image, ccoords) {
            var coords = Sk.ffi.remapToJs(ccoords);
            var jsName = Sk.ffi.remapToJs(image);
            // якщо зображення вже завантажено — малюємо одразу
            if (loadedAssets[jsName]) {
                cx.drawImage(loadedAssets[jsName], coords[0], coords[1]);
                return Sk.builtin.none.none$;
            }
            // інакше завантажуємо через loadImage
            var img = loadImage(jsName);
            if (img) {
                cx.drawImage(img, coords[0], coords[1]);
            } else {
                throw new Sk.builtin.KeyError("Image '" + jsName + "' not found or invalid.");
            }
            return Sk.builtin.none.none$;
        });
        $loc.fill = new Sk.builtin.func(function(self, color) {
            Sk.builtin.pyCheckArgs("fill", arguments, 2, 2);
            var rgb = Sk.ffi.remapToJs(color);
            cx.fillStyle = getColor(rgb);
            cx.fillRect(0, 0, width, height);
        });
        $loc.draw = Sk.misceval.callsim(SurfacePainter);
        $loc.bounds = new Sk.builtin.func(function(self) {
            // Повертаємо ZRect(0, 0, width, height)
            return Sk.misceval.callsim(Sk.globals.ZRect, Sk.ffi.remapToPy(0), Sk.ffi.remapToPy(0), Sk.ffi.remapToPy(width), Sk.ffi.remapToPy(height));
        });
    }, 'pgzero.screen.Screen', []);
    //  MUSIC 
    var MusicSystem = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var currentAudio = null;
        var queuedTracks = [];
        var isPaused = false;
        var volume = 1.0;
        async function loadTrack(name) {
            const extensions = ['.mp3', '.ogg', '.wav'];
            for (const ext of extensions) {
                const path = 'music/' + name + ext;
                try {
                    const type = await jsfs.type(path);
                    if (type === 'file') {
                        const dataUrl = await jsfs.read(path);
                        return dataUrl;
                    }
                } catch (e) {
                    // файл не знайдено — пробуємо наступне розширення
                    continue;
                }
            }
            throw new Sk.builtin.Exception("Music file not found: " + name);
        }

        function createAudio(dataUrl) {
            const audio = new Audio(dataUrl);
            audio.volume = volume;
            return audio;
        }

        function onTrackEnd() {
            if (queuedTracks.length > 0) {
                const next = queuedTracks.shift();
                playTrack(next.name, next.once, false);
            } else {
                currentAudio = null;
            }
        }
        async function playTrack(name, once = false, stopCurrent = true) {
            if (stopCurrent && currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            try {
                const dataUrl = await loadTrack(name);
                const audio = createAudio(dataUrl);
                if (once) {
                    audio.addEventListener('ended', onTrackEnd, {
                        once: true
                    });
                } else {
                    audio.loop = true;
                }
                if (isPaused) {
                    currentAudio = audio;
                } else {
                    try {
                        await audio.play();
                    } catch (e) {
                        console.warn("Autoplay blocked:", e);
                        PythonIDE.showHint("Звук заблоковано браузером. Натисніть будь-яку кнопку.");
                    }
                    currentAudio = audio;
                }
            } catch (e) {
                PythonIDE.handleError("Music error: " + String(e));
            }
        }
        $loc.play = new Sk.builtin.func(function(self, name) {
            Sk.builtin.pyCheckArgs("play", arguments, 2, 2);
            const jsName = Sk.ffi.remapToJs(name);
            playTrack(jsName, false, true);
            return Sk.builtin.none.none$;
        });
        $loc.play_once = new Sk.builtin.func(function(self, name) {
            Sk.builtin.pyCheckArgs("play_once", arguments, 2, 2);
            const jsName = Sk.ffi.remapToJs(name);
            playTrack(jsName, true, true);
            return Sk.builtin.none.none$;
        });
        $loc.queue = new Sk.builtin.func(function(self, name) {
            Sk.builtin.pyCheckArgs("queue", arguments, 2, 2);
            const jsName = Sk.ffi.remapToJs(name);
            queuedTracks.push({
                name: jsName,
                once: true
            });
            return Sk.builtin.none.none$;
        });
        $loc.fadeout = new Sk.builtin.func(function(self, duration) {
            Sk.builtin.pyCheckArgs("fadeout", arguments, 2, 2);
            const dur = Sk.ffi.remapToJs(duration);
            if (currentAudio) {
                const steps = 50;
                const stepTime = (dur * 1000) / steps;
                const volStep = currentAudio.volume / steps;
                let i = 0;
                const fade = setInterval(() => {
                    i++;
                    if (i >= steps || !currentAudio) {
                        clearInterval(fade);
                        if (currentAudio) {
                            currentAudio.pause();
                            currentAudio = null;
                        }
                    } else if (currentAudio) {
                        currentAudio.volume = Math.max(0, currentAudio.volume - volStep);
                    }
                }, stepTime);
            }
            return Sk.builtin.none.none$;
        });
        $loc.set_volume = new Sk.builtin.func(function(self, vol) {
            Sk.builtin.pyCheckArgs("set_volume", arguments, 2, 2);
            volume = Math.max(0, Math.min(1, Sk.ffi.remapToJs(vol)));
            if (currentAudio) {
                currentAudio.volume = volume;
            }
            return Sk.builtin.none.none$;
        });
        $loc.stop = new Sk.builtin.func(function(self) {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            queuedTracks = [];
            return Sk.builtin.none.none$;
        });
        $loc.pause = new Sk.builtin.func(function(self) {
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                isPaused = true;
            }
            return Sk.builtin.none.none$;
        });
        $loc.unpause = new Sk.builtin.func(function(self) {
            if (currentAudio && isPaused) {
                currentAudio.play().catch(e => {
                    console.warn("Autoplay blocked on unpause:", e);
                });
                isPaused = false;
            }
            return Sk.builtin.none.none$;
        });
        $loc.is_playing = new Sk.builtin.func(function(self) {
            const playing = currentAudio && !currentAudio.paused && !isPaused;
            return Sk.ffi.remapToPy(playing);
        });
        $loc.get_volume = new Sk.builtin.func(function(self) {
            return Sk.ffi.remapToPy(volume);
        });
    }, 'MusicSystem', []);
    Sk.globals.music = Sk.misceval.callsim(MusicSystem);
    //
    var SoundLoader = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var soundCache = {}; // кеш для уникнення повторного завантаження
        $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
            var soundName = Sk.ffi.remapToJs(name);
            if (soundCache[soundName]) {
                return soundCache[soundName];
            }
            // Створюємо новий Sound
            var soundObj = Sk.misceval.callsim(Sound, Sk.ffi.remapToPy(soundName));
            soundCache[soundName] = soundObj;
            return soundObj;
        });
    }, 'pgzero.loaders.SoundLoader', []);
    //
    //  SOUND
    var Sound = Sk.misceval.buildClass(s, function($gbl, $loc) {
        // кеш завантажених dataURL
        var soundCache = {};
        var extensions = ['.mp3', '.ogg', '.wav'];
        async function loadDataUrl(name) {
            if (soundCache[name]) {
                return soundCache[name];
            }
            for (const ext of extensions) {
                const path = 'sounds/' + name + ext;
                try {
                    const type = await jsfs.type(path);
                    if (type === 'file') {
                        const dataUrl = await jsfs.read(path);
                        soundCache[name] = dataUrl;
                        return dataUrl;
                    }
                } catch (e) {
                    continue;
                }
            }
            throw new Sk.builtin.Exception("Sound file not found: " + name);
        }

        function createAudio(dataUrl) {
            const audio = new Audio(dataUrl);
            audio.preload = 'auto';
            return audio;
        }
        $loc.__init__ = new Sk.builtin.func(function(self, name) {
            Sk.builtin.pyCheckArgs("__init__", 2, 2);
            self.name = Sk.ffi.remapToJs(name);
            self.dataUrl = null;
            self.audio = null;
            self._loading = null;
        });
        $loc.play = new Sk.builtin.func(function(self, loops) {
            Sk.builtin.pyCheckArgs("play", 1, 2);
            const loopCount = (loops === undefined) ? 0 : Sk.ffi.remapToJs(loops);
            async function playImpl() {
                try {
                    // lazy loading (як music)
                    if (!self.dataUrl) {
                        self.dataUrl = await loadDataUrl(self.name);
                    }
                    const audio = createAudio(self.dataUrl);
                    let played = 0;
                    const onEnded = () => {
                        if (loopCount === -1) {
                            audio.currentTime = 0;
                            audio.play().catch(() => {});
                            return;
                        }
                        if (played < loopCount) {
                            played++;
                            audio.currentTime = 0;
                            audio.play().catch(() => {});
                            return;
                        }
                        audio.removeEventListener('ended', onEnded);
                    };
                    audio.addEventListener('ended', onEnded);
                    await audio.play().catch(e => {
                        console.warn("Autoplay blocked:", e);
                        PythonIDE.showHint("Звук заблоковано браузером. Натисніть будь-яку кнопку.");
                    });
                    self.audio = audio;
                } catch (e) {
                    PythonIDE.handleError("Sound error: " + String(e));
                }
                return Sk.builtin.none.none$;
            }
            return Sk.misceval.promiseToSuspension(playImpl());
        });
        $loc.stop = new Sk.builtin.func(function(self) {
            if (self.audio) {
                self.audio.pause();
                self.audio.currentTime = 0;
            }
            return Sk.builtin.none.none$;
        });
        $loc.get_length = new Sk.builtin.func(function(self) {
            if (!self.audio) return Sk.ffi.remapToPy(0.0);
            return Sk.ffi.remapToPy(self.audio.duration || 0.0);
        });
    }, 'Sound', []);
    Sk.globals.sounds = Sk.misceval.callsim(SoundLoader);
    // TONE GENERATOR 
    var ToneGenerator = Sk.misceval.buildClass(s, function($gbl, $loc) {
        var audioContext = null;
        var activeSources = [];
        var noteFreqs = {
            'C': 16.35,
            'C#': 17.32,
            'Db': 17.32,
            'D': 18.35,
            'D#': 19.45,
            'Eb': 19.45,
            'E': 20.60,
            'F': 21.83,
            'F#': 23.12,
            'Gb': 23.12,
            'G': 24.50,
            'G#': 25.96,
            'Ab': 25.96,
            'A': 27.50,
            'A#': 29.14,
            'Bb': 29.14,
            'B': 30.87
        };
        // Initialize audio context (lazy initialization)
        function getAudioContext() {
            if (!audioContext) {
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    audioContext = new AudioContext();
                    // Resume context on user interaction (browser requirement)
                    document.addEventListener('click', function() {
                        if (audioContext && audioContext.state === 'suspended') {
                            audioContext.resume();
                        }
                    }, {
                        once: true
                    });
                }
            }
            return audioContext;
        }
        // Parse note string like 'A#4' or 'Bb3'
        function parseNote(noteStr) {
            if (typeof noteStr !== 'string') return noteStr;
            var match = noteStr.match(/^([A-G])([#b]?)(\d+)$/);
            if (!match) {
                throw new Sk.builtin.ValueError("Invalid note format: " + noteStr);
            }
            var note = match[1];
            var accidental = match[2];
            var octave = parseInt(match[3]);
            var noteName = note;
            if (accidental === '#') noteName = note + '#';
            if (accidental === 'b') noteName = note + 'b';
            // Adjust for enharmonic equivalents
            if (noteName === 'B#') {
                noteName = 'C';
                octave += 1;
            }
            if (noteName === 'E#') {
                noteName = 'F';
            }
            if (noteName === 'Fb') {
                noteName = 'E';
            }
            if (noteName === 'Cb') {
                noteName = 'B';
                octave -= 1;
            }
            var baseFreq = noteFreqs[noteName];
            if (!baseFreq) {
                throw new Sk.builtin.ValueError("Invalid note: " + noteStr);
            }
            return baseFreq * Math.pow(2, octave);
        }
        // ADSR envelope function
        function applyADSREnvelope(t, duration) {
            var attackTime = Math.min(0.005, duration * 0.05);
            var decayTime = Math.min(0.03, duration * 0.15);
            var sustainLevel = 0.7;
            var releaseTime = Math.min(0.2, duration * 0.4);
            var envelope = 0.0;
            if (t < attackTime) {
                envelope = Math.pow(t / attackTime, 0.5);
            } else if (t < attackTime + decayTime) {
                var decayProgress = (t - attackTime) / decayTime;
                envelope = 1.0 - (1.0 - sustainLevel) * decayProgress;
            } else if (t < duration - releaseTime) {
                envelope = sustainLevel;
            } else {
                var releaseProgress = (t - (duration - releaseTime)) / releaseTime;
                releaseProgress = Math.max(0, Math.min(releaseProgress, 1));
                envelope = sustainLevel * Math.exp(-5.0 * releaseProgress);
            }
            return envelope;
        }
        // Generate tone buffer with harmonics
        function generateToneBuffer(frequency, duration) {
            var ctx = getAudioContext();
            if (!ctx) return null;
            var sampleRate = ctx.sampleRate;
            var length = Math.floor(sampleRate * duration);
            var buffer = ctx.createBuffer(1, length, sampleRate);
            var data = buffer.getChannelData(0);
            // Гармоніки для більш насиченого звуку (як у реальних інструментів)
            var harmonics = [{
                    freq: 1.0,
                    amp: 1.0
                }, // Основна частота
                {
                    freq: 2.0,
                    amp: 0.3
                }, // Октава
                {
                    freq: 3.0,
                    amp: 0.15
                }, // Квінта + октава
                {
                    freq: 4.0,
                    amp: 0.08
                }, // Дві октави
                {
                    freq: 5.0,
                    amp: 0.04
                } // Терція + дві октави
            ];
            for (var i = 0; i < length; i++) {
                var t = i / sampleRate;
                var envelope = applyADSREnvelope(t, duration);
                // Сума гармонік
                var sample = 0.0;
                for (var h = 0; h < harmonics.length; h++) {
                    var harmonic = harmonics[h];
                    sample += Math.sin(2 * Math.PI * frequency * harmonic.freq * t) * harmonic.amp;
                }
                // Нормалізація та застосування огинаючої
                data[i] = (sample / 1.57) * envelope; // 1.57 ≈ сума амплітуд гармонік
            }
            return buffer;
        }
        // Play tone immediately
        $loc.play = new Sk.builtin.func(function(self, pitch, duration) {
            Sk.builtin.pyCheckArgs("play", arguments, 3, 3);
            var frequency = Sk.ffi.remapToJs(pitch);
            var dur = Sk.ffi.remapToJs(duration);
            if (typeof frequency === 'string') {
                frequency = parseNote(frequency);
            }
            if (typeof frequency !== 'number' || frequency <= 0) {
                throw new Sk.builtin.ValueError("Invalid frequency: " + frequency);
            }
            if (typeof dur !== 'number' || dur <= 0) {
                throw new Sk.builtin.ValueError("Invalid duration: " + dur);
            }
            var ctx = getAudioContext();
            if (!ctx) {
                console.warn("Web Audio API not supported");
                return Sk.builtin.none.none$;
            }
            if (ctx.state === 'suspended') {
                ctx.resume().catch(function(e) {
                    console.warn("Could not resume audio context:", e);
                });
            }
            // Generate and play the tone
            var buffer = generateToneBuffer(frequency, dur);
            if (!buffer) {
                return Sk.builtin.none.none$;
            }
            var source = ctx.createBufferSource();
            source.buffer = buffer;
            // Додаємо легкий low-pass фільтр для м'якості
            var filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = Math.min(8000, frequency * 6); // Обрізаємо високі частоти
            filter.Q.value = 0.5;
            source.connect(filter);
            filter.connect(ctx.destination);
            source.start();
            // Clean up after playback
            source.onended = function() {
                var index = activeSources.indexOf(source);
                if (index > -1) {
                    activeSources.splice(index, 1);
                }
                source.disconnect();
                filter.disconnect();
            };
            activeSources.push(source);
            return Sk.builtin.none.none$;
        });
        // Create a ToneSound class for deferred playback
        var ToneSound = Sk.misceval.buildClass(s, function($gbl2, $loc2) {
            $loc2.__init__ = new Sk.builtin.func(function(self, pitch, duration) {
                self.frequency = Sk.ffi.remapToJs(pitch);
                self.duration = Sk.ffi.remapToJs(duration);
                // Convert note string to frequency if needed
                if (typeof self.frequency === 'string') {
                    self.frequency = parseNote(self.frequency);
                }
            });
            $loc2.play = new Sk.builtin.func(function(self) {
                var ctx = getAudioContext();
                if (!ctx) {
                    console.warn("Web Audio API not supported");
                    return Sk.builtin.none.none$;
                }
                // Validate inputs
                if (typeof self.frequency !== 'number' || self.frequency <= 0) {
                    throw new Sk.builtin.ValueError("Invalid frequency: " + self.frequency);
                }
                if (typeof self.duration !== 'number' || self.duration <= 0) {
                    throw new Sk.builtin.ValueError("Invalid duration: " + self.duration);
                }
                // Ensure context is running
                if (ctx.state === 'suspended') {
                    ctx.resume().catch(function(e) {
                        console.warn("Could not resume audio context:", e);
                    });
                }
                // Generate and play the tone
                var buffer = generateToneBuffer(self.frequency, self.duration);
                if (!buffer) {
                    return Sk.builtin.none.none$;
                }
                var source = ctx.createBufferSource();
                source.buffer = buffer;
                // Додаємо low-pass фільтр
                var filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = Math.min(8000, self.frequency * 6);
                filter.Q.value = 0.5;
                source.connect(filter);
                filter.connect(ctx.destination);
                source.start();
                // Clean up after playback
                source.onended = function() {
                    var index = activeSources.indexOf(source);
                    if (index > -1) {
                        activeSources.splice(index, 1);
                    }
                    source.disconnect();
                    filter.disconnect();
                };
                activeSources.push(source);
                return Sk.builtin.none.none$;
            });
            $loc2.stop = new Sk.builtin.func(function(self) {
                // Note: Web Audio API doesn't have a simple stop for buffer sources
                // once started. This would need more complex implementation.
                return Sk.builtin.none.none$;
            });
            $loc2.__repr__ = new Sk.builtin.func(function(self) {
                return new Sk.builtin.str("ToneSound(freq=" + self.frequency + ", duration=" + self.duration + ")");
            });
        }, 'ToneSound', []);
        // Create tone for later use
        $loc.create = new Sk.builtin.func(function(self, pitch, duration) {
            Sk.builtin.pyCheckArgs("create", arguments, 3, 3);
            return Sk.misceval.callsim(ToneSound, pitch, duration);
        });
        // Helper method to get frequency from note
        $loc.note_to_freq = new Sk.builtin.func(function(self, note) {
            Sk.builtin.pyCheckArgs("note_to_freq", arguments, 2, 2);
            var noteStr = Sk.ffi.remapToJs(note);
            var freq = parseNote(noteStr);
            return Sk.ffi.remapToPy(freq);
        });
        // Stop all active tones
        $loc.stop_all = new Sk.builtin.func(function(self) {
            while (activeSources.length > 0) {
                var source = activeSources.pop();
                try {
                    source.stop();
                    source.disconnect();
                } catch (e) {
                    // Ignore errors if source already stopped
                }
            }
            return Sk.builtin.none.none$;
        });
    }, 'ToneGenerator', []);
    Sk.globals.tone = Sk.misceval.callsim(ToneGenerator);
    // STORAGE ================================
    var STORAGE_KEY = "pgzero_storage_" + (window.location.pathname || "game");
    var Storage = Sk.misceval.buildClass(s, function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            self._data = {};
            self.path = Sk.ffi.remapToPy(STORAGE_KEY);
            self._load();
            return Sk.builtin.none.none$;
        });
        $loc._save = new Sk.builtin.func(function(self) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(self._data));
            return Sk.builtin.none.none$;
        });
        $loc._load = new Sk.builtin.func(function(self) {
            var raw = localStorage.getItem(STORAGE_KEY);
            self._data = raw ? JSON.parse(raw) : {};
            return Sk.builtin.none.none$;
        });
        // dict behaviour
        $loc.__getitem__ = new Sk.builtin.func(function(self, key) {
            key = Sk.ffi.remapToJs(key);
            if (!(key in self._data)) {
                throw new Sk.builtin.KeyError(key);
            }
            return Sk.ffi.remapToPy(self._data[key]);
        });
        $loc.__setitem__ = new Sk.builtin.func(function(self, key, value) {
            key = Sk.ffi.remapToJs(key);
            self._data[key] = Sk.ffi.remapToJs(value);
            // autosave як у pgzero
            localStorage.setItem(STORAGE_KEY, JSON.stringify(self._data));
            return Sk.builtin.none.none$;
        });
        $loc.setdefault = new Sk.builtin.func(function(self, key, defaultVal) {
            key = Sk.ffi.remapToJs(key);
            if (!(key in self._data)) {
                self._data[key] = Sk.ffi.remapToJs(defaultVal);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(self._data));
            }
            return Sk.ffi.remapToPy(self._data[key]);
        });
        $loc.get = new Sk.builtin.func(function(self, key, defaultVal) {
            key = Sk.ffi.remapToJs(key);
            if (key in self._data) {
                return Sk.ffi.remapToPy(self._data[key]);
            }
            return defaultVal !== undefined ? defaultVal : Sk.builtin.none.none$;
        });
        $loc.clear = new Sk.builtin.func(function(self) {
            self._data = {};
            localStorage.removeItem(STORAGE_KEY);
            return Sk.builtin.none.none$;
        });
        $loc.save = new Sk.builtin.func(function(self) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(self._data));
            return Sk.builtin.none.none$;
        });
        $loc.load = new Sk.builtin.func(function(self) {
            var raw = localStorage.getItem(STORAGE_KEY);
            self._data = raw ? JSON.parse(raw) : {};
            return Sk.builtin.none.none$;
        });
    }, "Storage", []);
    Storage.prototype._save = function() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    };
    Storage.prototype._load = function() {
        var raw = localStorage.getItem(STORAGE_KEY);
        this._data = raw ? JSON.parse(raw) : {};
    };
    Sk.globals.storage = Sk.misceval.callsim(Storage);
    //  ВІРТУАЛЬНИЙ ГЕЙМПАД 
    let gamepadElement = null;
    let gamepadVisible = false;
    // УНІВЕРСАЛЬНИЙ ВИКЛИК PYTHON HANDLER
    function callHandler(func, args) {
        if (!func) return;
        var co_argcount = null;
        if (func.$code && typeof func.$code.co_argcount !== 'undefined') {
            co_argcount = func.$code.co_argcount;
        } else if (func.func_code && typeof func.func_code.co_argcount !== 'undefined') {
            co_argcount = func.func_code.co_argcount;
        } else if (typeof func.co_argcount !== 'undefined') {
            co_argcount = func.co_argcount;
        }
        var realArgs;
        if (co_argcount !== null) {
            realArgs = args.slice(0, co_argcount);
        } else {
            realArgs = args;
        }
        try {
            var result = Sk.misceval.callsimAsync(null, func, ...realArgs);
            if (result && result.catch) {
                result.catch(function(err) {
                    console.error("Python Runtime Error:", err.toString());
                    if (window.onerror) window.onerror(err.toString());
                });
            }
        } catch (e) {
            console.error("Skulpt Call Error:", e.toString());
        }
    }
    // Налаштування обробників подій кнопок
    function setupGamepadListeners() {
        // Мапінг кнопок геймпада → коди клавіш
        const KEY_MAP = {
            'UP': 38, // ArrowUp
            'DOWN': 40, // ArrowDown
            'LEFT': 37, // ArrowLeft
            'RIGHT': 39, // ArrowRight
            'SPACE': 32, // Space
            'Z': 90 // Z
        };
        // Універсальний обробник натискання
        function handlePress(e) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.currentTarget;
            const keyName = btn.dataset.key;
            const keyCode = KEY_MAP[keyName];
            if (keyCode === undefined) return;
            // 1. Оновлюємо стан клавіш
            keysPressed[keyName.toLowerCase()] = true;
            keysCodePressed.add(keyCode);
            // 2. Додаємо візуальну зворотний зв'язок
            btn.classList.add('pressed');
            // 3. Емулюємо подію keydown
            if (Sk.globals.on_key_down) {
                const pyKey = Sk.misceval.callsim(EnumValue, "keys", keyName.toUpperCase(), keyCode);
                const pyMod = new Sk.builtin.int_(0);
                const pyUnicode = new Sk.builtin.str(keyName === 'SPACE' ? ' ' : '');
                callHandler(Sk.globals.on_key_down, [
                    pyKey,
                    pyMod,
                    pyUnicode
                ]);
            }
        }
        // Універсальний обробник відпускання
        function handleRelease(e) {
            e.preventDefault();
            if (e.type !== 'touchcancel') e.stopPropagation();
            const btn = e.currentTarget;
            const keyName = btn.dataset.key;
            const keyCode = KEY_MAP[keyName];
            if (keyCode === undefined) return;
            // 1. Оновлюємо стан клавіш
            keysPressed[keyName.toLowerCase()] = false;
            keysCodePressed.delete(keyCode);
            // 2. Знімаємо візуальну зворотну зв'язок
            btn.classList.remove('pressed');
            // 3. Емулюємо подію keyup
            if (Sk.globals.on_key_up) {
                const pyKey = Sk.misceval.callsim(EnumValue, "keys", keyName.toUpperCase(), keyCode);
                const pyMod = new Sk.builtin.int_(0);
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_key_up, pyKey, pyMod);
            }
            // 3. Емулюємо подію keydown
            if (Sk.globals.on_key_up) {
                const pyKey = Sk.misceval.callsim(EnumValue, "keys", keyName.toUpperCase(), keyCode);
                const pyMod = new Sk.builtin.int_(0);
                callHandler(Sk.globals.on_key_up, [
                    pyKey,
                    pyMod
                ]);
            }
        }
        // Додаємо обробники до всіх кнопок
        const buttons = gamepadElement.querySelectorAll('button');
        buttons.forEach(btn => {
            // Сенсорні події
            btn.addEventListener('touchstart', handlePress, {
                passive: false
            });
            btn.addEventListener('touchend', handleRelease, {
                passive: false
            });
            btn.addEventListener('touchcancel', handleRelease, {
                passive: false
            });
            // Мишеві події (для десктопу)
            btn.addEventListener('mousedown', handlePress, {
                passive: false
            });
            btn.addEventListener('mouseup', handleRelease, {
                passive: false
            });
            btn.addEventListener('mouseleave', handleRelease, {
                passive: false
            });
        });
    }
    // Функція показу геймпада
    function gamepadShow() {
        gamepadElement = document.getElementById('virtual-gamepad')
        setupGamepadListeners();
        gamepadElement.style.display = 'flex';
        gamepadVisible = true;
        // Автоматично показуємо на мобільних пристроях
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            gamepadElement.style.display = 'flex';
        }
    }
    // Функція приховування геймпада
    function gamepadHide() {
        if (gamepadElement) {
            gamepadElement.style.display = 'none';
            gamepadVisible = false;
            // Знімаємо всі активні стани кнопок
            gamepadElement.querySelectorAll('.pressed').forEach(btn => {
                btn.classList.remove('pressed');
                const keyName = btn.dataset.key;
                keysPressed[keyName.toLowerCase()] = false;
                const keyCode = {
                    'UP': 38,
                    'DOWN': 40,
                    'LEFT': 37,
                    'RIGHT': 39,
                    'SPACE': 32,
                    'Z': 90
                } [keyName];
                if (keyCode) keysCodePressed.delete(keyCode);
            });
        }
    }
    Sk.globals.gamepad_show = new Sk.builtin.func(function() {
        gamepadShow();
        return Sk.builtin.none.none$;
    });
    Sk.globals.gamepad_hide = new Sk.builtin.func(function() {
        gamepadHide();
        return Sk.builtin.none.none$;
    });
    // Автоматичне відображення на мобільних пристроях при старті гри
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(gamepadShow, 500); // Трішки затримки для завантаження інтерфейсу
    }
    //--------------------------------------------------------
    s.go = new Sk.builtin.func(function() {
        console.log("pgzrun.go")
        // create globals
        Sk.globals.screen = Sk.misceval.callsim(Screen);
        width = 800;
        if (Sk.globals.WIDTH) {
            width = Sk.ffi.remapToJs(Sk.globals.WIDTH);
        }
        height = 600;
        if (Sk.globals.HEIGHT) {
            height = Sk.ffi.remapToJs(Sk.globals.HEIGHT);
            console.log("Height:", height);
        }
        if (Sk.globals.TITLE) {
            var title = Sk.ffi.remapToJs(Sk.globals.TITLE);
            document.getElementById('gameTitle').innerHTML = title;
        }
        if (Sk.globals.ASSETS) {
            //width = Sk.ffi.remapToJs(Sk.globals.WIDTH);
            assets.images["missile"] = {
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABgCAYAAAAKGMITAAAABmJLR0QAaACfADiOTMCgAAAFXklEQVRo3u3aa2xTVRwA8P+5d0k3xp6sLI5MxlCD2WIK+OCD4zUHOMZAh9EQiTExGP1ofMVP8oXEGPnkBzXBiAajYQEiASNBExGChDdso+vG+hxru3bt7uPc9zl+4BHX9q637W2Jsefbveec++v/f3tOz72nAHmWy++8tCvw2Qe78u3P5NNJCXhYORb/RA36P6aUonyuwebTaSfDbRRGzr+/QIg2q4J0Zv+J370liVgMTOyhugSgiSC7b75dklQPffh6vRr1bbt/rIc82yIH99cXHRbjs7uJlKi6f0wS/irJO7G76LA6PTWQek6f9A0UFR759N0WnZvuSj1vzIS7Yse+aykaLERifQTH0/qQhI/hz5/pLhqsxSObzeqoqu4oChw+/BWr84l1ZvXGTGQdvnWJtR2Oj3qeMxKBRWb1+pR7EX/14hrbYX506GlKdPMGugR4+Npq22FtJrIqWxsjNrXK/i9XRWWXham/y1bYve+9OkPi27NGnIwsjR05UGMbTAjtMBK+7O2m3SzRaadtMD8+ugwQY+lyeOR6u22wJvDLrd47Yyb2mG0w5aPLrMIUJ9tsg1HdI0ssf/sdtUtsg42Y12k5Yj7qtAUOH/+BYRqWtlqG2arFePQaUzCcvHAaURyzvLRhKthmxedGBcPYPwYEJy3fYiLEQbk9XHiqpXAIiIotw1RMgOJzZ5+BszWQBRkoYSF9AkFAGQcAzM2qoWCQJjyFw9888xYApRnGGILlbSZDFgHA4J7CYAIAFKEMLgKC8np6sQYzLAvUJCiGYUwDzjopZWtwLKCyAKCkPmchAOisZzJdwAAAR3tthVFQxMgkneheXb7JZuAhlTJchstwGS7D/0+Y/rcjDv19qgUgpze0TNBzq6Vg+E4o1E+p9cxQShlvMNRf+JMEx7+YaxoTnLClIPjg0ZPVWJY35ApjWdlwachTnTd82xdcK8rKglxhUZKrR73+tXnDMxzXn+94is/O39cUPnXuAiMr6pZ8h4skK5t9kxEmZ/jmrfEODktt+cKcKC0bHpvoyBkORaJ9hJC8JwiDEAiGo305wwLGmwudnTgRb8oJ/vGX35plVXu+UFhW1K5LQ+5my/CVYfd6SVHZQmGsqOw19/h6y7CkKDvApiJgabsl+NyVGw4sKy/YBWNZ6QmGo46s8PE/zroESW6yL2K56czF666ssKaqOymldrlAKAVOEAfmhbGqoyQv2Jbmf00mPam7rnPgrw8dbpVV1WU3jGXFdercxVZTeCo6vVXRdNuXOYqmQWAqstUUnhXErcVaY3ECzgx/f/TXSlXVuosFy6rWfeHGSGUa7PH6unlJriwWzGOpctw/2Z0Gc4LYV+wl7cws15cGY1npLTYsyWrvHPiLA4dcHJZaiw3Pirj15J/nXQ/gwJ1wDyEEFRs2CEHeyXDPA1jT9QEoUVG1uxbz7eDxpiQvukoFJwXRdfbyjSbGM+HfpOq6o1SwomqOMX+oh8Gy3A8lLrwobWeSgrix5DCWNjJYVpwPAXaW34GU4TJsW6mw1CrDOpuiu+dp+lsfe2BKCHj/OpFhfwkBaXGmnaeUWsItRUwJAUjb+KImEVtPtWGhHZsaBULoXmQZPpCFa1YggHl/Epsb6xm3Z+xqghc65iYaINrWlpaJxtqFw82NdSvD8eS87zEsLXc++vzLV28H7/yUGnHq/jFCACvaWl97Y8eWn20ZTiuWtw/W11SPZGvXULNwpPPx9kHbxvGbL/caDbU1e9E8G9UIIXA21O1d3fGEYesE8uzKp47ULqgy/btD/cLq4TWuziO2z1yvbFqvL17UsM+svsXZuO/J9kctP2r+A3UXdUdhId83AAAAAElFTkSuQmCC',
                width: 30,
                height: 96
            }
        }
        let canvas = document.getElementById('gameCanvas');
        const modalContainer = document.querySelector('#gameModal > div'); // внутрішній контейнер
        if (modalContainer && document.getElementById('gameCanvas')) {
            // встановлюємо розміри контейнера (заголовок + canvas)
            modalContainer.style.width = width + 'px';
            modalContainer.style.height = (height + 30) + 'px';
        }
        // встановлюємо фактичні розміри canvas
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        document.activeElement.blur();
        cx = canvas.getContext("2d");
        document.addEventListener('contextmenu', event => event.preventDefault());
        var lastUpdate = new Date().getTime();
        //  update() 
        function update() {
            const now = Date.now();
            const tasks = [];
            // Обробка анімацій
            for (const animKey in animations) {
                const anim = animations[animKey];
                // викликаємо внутрішній метод _update
                anim.update(now);
            }
            // Виклик користувацьких функцій update/draw
            if (Sk.globals.update !== undefined) {
                const newTime = Date.now();
                const dt = (newTime - lastUpdate) / 1000;
                lastUpdate = newTime;
                const func = Sk.globals.update;
                const argCount = func.func_code ? func.func_code.co_argcount : 0;
                const varNames = func.func_code ? func.func_code.co_varnames : [];
                if (argCount > 0 || varNames.length > 0) {
                    tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update, Sk.ffi.remapToPy(dt)));
                } else {
                    tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update));
                }
            }
            if (Sk.globals.draw) {
                tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.draw));
            }
            return Promise.all(tasks).then(() => window.requestAnimationFrame(update)).catch(PythonIDE.handleError);
        }
        // add event handlers
        // Універсальна функція для отримання координат
        function getEventCoords(e) {
            let x, y;
            if (e.touches && e.touches[0]) {
                // Тач-подія (touchstart)
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches[0]) {
                // touchend/touchcancel
                x = e.changedTouches[0].clientX;
                y = e.changedTouches[0].clientY;
            } else {
                // Миша
                x = e.offsetX;
                y = e.offsetY;
            }
            return {
                x: Math.round(x),
                y: Math.round(y)
            };
        }
        if (Sk.globals.on_mouse_down) {
            // Миша
            canvas.addEventListener('mousedown', handleMouseDown);
            // Тач - початок дотику
            canvas.addEventListener('touchstart', function(e) {
                e.preventDefault();
                handleMouseDown(e);
            });
        }

        function handleMouseDown(e) {
            // Визначаємо кнопку миші (для тач - завжди ліва)
            let mouseButton = 0;
            if (e.type === 'touchstart') {
                mouseButton = Sk.globals.mouse.LEFT;
            } else {
                if (e.buttons === 1) mouseButton = Sk.globals.mouse.LEFT;
                if (e.buttons === 2) mouseButton = Sk.globals.mouse.RIGHT;
                if (e.buttons === 4) mouseButton = Sk.globals.mouse.MIDDLE;
            }
            // Отримуємо координати
            const coords = getEventCoords(e);
            const pos = new Sk.builtin.tuple([
                new Sk.builtin.int_(coords.x),
                new Sk.builtin.int_(coords.y)
            ]);
            const button = new Sk.builtin.int_(mouseButton);
            // Отримуємо параметри Python-функції
            let params = [];
            if (Sk.globals.on_mouse_down.func_code && Sk.globals.on_mouse_down.func_code.co_varnames) {
                params = Sk.globals.on_mouse_down.func_code.co_varnames;
            }
            // Виклик з потрібною кількістю аргументів
            if (params.length === 2) {
                // def on_mouse_down(pos, button)
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, pos, button);
            } else if (params.length === 1) {
                // def on_mouse_down(pos)
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, pos);
            } else {
                // def on_mouse_down()
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down);
            }
        }
        if (Sk.globals.on_mouse_up) {
            // Миша
            canvas.addEventListener('mouseup', handleMouseUp);
            // Тач - завершення дотику
            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleMouseUp(e);
            });
            // Тач - скасування дотику (наприклад, при втраті фокусу)
            canvas.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                handleMouseUp(e);
            });
        }

        function handleMouseUp(e) {
            // Визначаємо кнопку миші (для тач - завжди ліва)
            let mouseButton = 0;
            if (e.type === 'touchend' || e.type === 'touchcancel') {
                mouseButton = Sk.globals.mouse.LEFT;
            } else {
                if (e.button === 0) mouseButton = Sk.globals.mouse.LEFT;
                if (e.button === 1) mouseButton = Sk.globals.mouse.MIDDLE;
                if (e.button === 2) mouseButton = Sk.globals.mouse.RIGHT;
            }
            // Отримуємо координати
            const coords = getEventCoords(e);
            const pos = new Sk.builtin.tuple([
                new Sk.builtin.int_(coords.x),
                new Sk.builtin.int_(coords.y)
            ]);
            const button = new Sk.builtin.int_(mouseButton);
            // Отримуємо параметри Python-функції
            let params = [];
            if (Sk.globals.on_mouse_up.func_code && Sk.globals.on_mouse_up.func_code.co_varnames) {
                params = Sk.globals.on_mouse_up.func_code.co_varnames;
            }
            // Виклик з потрібною кількістю аргументів
            if (params.length === 2) {
                // def on_mouse_up(pos, button)
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up, pos, button);
            } else if (params.length === 1) {
                // def on_mouse_up(pos)
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up, pos);
            } else {
                // def on_mouse_up()
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up);
            }
        }
        if (Sk.globals.on_mouse_move) {
            // зберігаємо попередні координати як JS числа
            let px = null;
            let py = null;
            // Миша
            canvas.addEventListener('mousemove', handleMouseMove);
            // Тач - рух пальцем
            canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                handleMouseMove(e);
            });

            function handleMouseMove(e) {
                // Отримуємо координати
                const coords = getEventCoords(e);
                const x = coords.x;
                const y = coords.y;
                //POS
                const pos = new Sk.builtin.tuple([
                    new Sk.builtin.int_(x),
                    new Sk.builtin.int_(y)
                ]);
                //REL
                if (px === null) {
                    px = x;
                    py = y;
                }
                const rel = new Sk.builtin.tuple([
                    new Sk.builtin.int_(x - px),
                    new Sk.builtin.int_(y - py)
                ]);
                px = x;
                py = y;
                //BUTTONS
                const buttonsList = [];
                // Для тач-подій завжди вважаємо, що натиснута ліва кнопка
                if (e.type === 'touchmove' || (e.touches && e.touches.length > 0)) {
                    buttonsList.push(new Sk.builtin.int_(Sk.globals.mouse.LEFT));
                } else {
                    if (e.buttons & 1) buttonsList.push(new Sk.builtin.int_(Sk.globals.mouse.LEFT));
                    if (e.buttons & 2) buttonsList.push(new Sk.builtin.int_(Sk.globals.mouse.RIGHT));
                    if (e.buttons & 4) buttonsList.push(new Sk.builtin.int_(Sk.globals.mouse.MIDDLE));
                }
                const pyButtonsSet = new Sk.builtin.set(buttonsList);
                //PARAMS
                let params = [];
                if (Sk.globals.on_mouse_move.func_code && Sk.globals.on_mouse_move.func_code.co_varnames) {
                    params = Sk.globals.on_mouse_move.func_code.co_varnames;
                }
                // ARGS
                const args = [];
                for (let name of params) {
                    switch (name) {
                        case 'pos':
                            args.push(pos);
                            break;
                        case 'rel':
                            args.push(rel);
                            break;
                        case 'buttons':
                            args.push(pyButtonsSet);
                            break;
                        default:
                            args.push(Sk.builtin.none.none$);
                    }
                }
                //CALL
                Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move, ...args);
            }
        }
        // wait for assets to load
        Promise.all(promises).then(function() {
            update();
        }, function(e) {
            PythonIDE.handleError(e);
        }).catch(PythonIDE.handleError);
        ////
        function getModifiers(e) {
            var mod = 0;
            if (e.ctrlKey) mod |= 1;
            if (e.shiftKey) mod |= 2;
            if (e.altKey) mod |= 4;
            if (e.metaKey) mod |= 8;
            return mod;
        }
        PythonIDE.keyHandlers.push(function(e) {
            e.preventDefault();
            var key = (e.key || "").replace("Arrow", "").toLowerCase();
            switch (key) {
                case " ":
                    key = "space";
                    break;
                case "enter":
                    key = "return";
                    break;
                case "backspace":
                    key = "backspace";
                    break;
                case "tab":
                    key = "tab";
                    break;
                case "escape":
                    key = "escape";
                    break;
                case "delete":
                    key = "delete";
                    break;
                case "insert":
                    key = "insert";
                    break;
                case "home":
                    key = "home";
                    break;
                case "end":
                    key = "end";
                    break;
                case "pageup":
                    key = "pageup";
                    break;
                case "pagedown":
                    key = "pagedown";
                    break;
            }
            var pyKey = Sk.misceval.callsim(EnumValue, "keys", key.toUpperCase(), e.keyCode);
            var pyMod = new Sk.builtin.int_(getModifiers(e));
            var unicodeChar = (e.type === "keydown" && e.key && e.key.length === 1) ? e.key : "";
            var pyUnicode = new Sk.builtin.str(unicodeChar);
            if (e.type === "keydown") {
                if (typeof keysPressed !== 'undefined') keysPressed[key] = true;
                if (typeof keysCodePressed !== 'undefined') keysCodePressed.add(e.keyCode);
                if (Sk.globals.on_key_down) {
                    callHandler(Sk.globals.on_key_down, [
                        pyKey,
                        pyMod,
                        pyUnicode
                    ]);
                }
            }
            if (e.type === "keyup") {
                if (typeof keysPressed !== 'undefined') keysPressed[key] = false;
                if (typeof keysCodePressed !== 'undefined') keysCodePressed.delete(e.keyCode);
                if (Sk.globals.on_key_up) {
                    callHandler(Sk.globals.on_key_up, [
                        pyKey,
                        pyMod
                    ]);
                }
            }
        });
        return PythonIDE.runAsync(function(resolve, reject) {});
    });
    return s;
};
