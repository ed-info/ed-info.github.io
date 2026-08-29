/*!
███████ ██████  ██ ████████  ██████  ██████
██      ██   ██ ██    ██    ██    ██ ██   ██
█████   ██   ██ ██    ██    ██    ██ ██████
██      ██   ██ ██    ██    ██    ██ ██   ██
███████ ██████  ██    ██     ██████  ██   ██
2021 ~ Mark Hillard | (mark@)markhillard.com
*/


/*! Table Of Contents:
// ------------------------------
// INITIALIZE CODEMIRROR
// CODE LOADING
// DEFAULTS
// LOCAL STORAGE
// EDITOR UPDATES
// DEPENDENCY INJECTION
// RESIZE FUNCTIONS
// GENERAL FUNCTIONS
// UTILITY FUNCTIONS
// REFRESH EDITOR
// ------------------------------
*/


// make jQuery play nice
var E = $.noConflict(true);

// detect touch devices
if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
    document.documentElement.className += ' touch';
}

E(document).ready(function () {
    
    // ensure fold helpers resolve for the editor modes (auto range finder)
    if (window.CodeMirror && CodeMirror.fold && CodeMirror.registerHelper) {
        CodeMirror.registerHelper('fold', 'javascript', CodeMirror.fold.brace);
        CodeMirror.registerHelper('fold', 'css', CodeMirror.fold.brace);
        CodeMirror.registerHelper('fold', 'xml', CodeMirror.fold.xml);
        CodeMirror.registerHelper('fold', 'htmlmixed', CodeMirror.fold.xml);
    }
    
    // INITIALIZE CODEMIRROR
    // ------------------------------
    // html code
    var editorHTML = document.editor = CodeMirror.fromTextArea(htmlcode, {
        mode: 'htmlmixed',
        profile: 'html',
        keyMap: 'sublime',
        lineNumbers: true,
        lineWrapping: false,
        theme: 'dracula',
        tabSize: 4,
        indentUnit: 4,
        extraKeys: {
            'Tab': 'indentMore'
        },
        foldGutter: true,
        gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        matchTags: {
            bothTags: true
        },
        matchBrackets: false,
        autoCloseTags: true,
        autoCloseBrackets: true,
        scrollbarStyle: 'overlay',
        styleActiveLine: true,
        showTrailingSpace: true,
        lint: false
    });
    
    // css code
    var editorCSS = document.editor = CodeMirror.fromTextArea(csscode, {
        mode: 'css',
        profile: 'css',
        keyMap: 'sublime',
        lineNumbers: true,
        lineWrapping: false,
        theme: 'dracula',
        tabSize: 4,
        indentUnit: 4,
        extraKeys: {
            'Tab': 'indentMore'
        },
        foldGutter: true,
        gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        matchBrackets: true,
        autoCloseBrackets: true,
        scrollbarStyle: 'overlay',
        styleActiveLine: true,
        showTrailingSpace: true,
        lint: false
    });
    
    // js code
    var editorJS = document.editor = CodeMirror.fromTextArea(jscode, {
        mode: 'javascript',
        keyMap: 'sublime',
        lineNumbers: true,
        lineWrapping: false,
        theme: 'dracula',
        tabSize: 4,
        indentUnit: 4,
        extraKeys: {
            'Tab': 'indentMore'
        },
        foldGutter: true,
        gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        matchBrackets: true,
        autoCloseBrackets: true,
        scrollbarStyle: 'overlay',
        styleActiveLine: true,
        showTrailingSpace: true,
        lint: false
    });
    
    // gutter reveal at left edge
    var gutterRevealZone = 64;
    function updateGutterWidth(editor) {
        var g = editor.getWrapperElement().querySelector('.CodeMirror-gutters');
        if (g) {
            editor.getWrapperElement().style.setProperty('--gutter-w', g.getBoundingClientRect().width + 'px');
        }
    }
    function bindGutterReveal(editor) {
        updateGutterWidth(editor);
        var wrap = editor.getWrapperElement();
        wrap.addEventListener('mousemove', function (e) {
            var r = wrap.getBoundingClientRect();
            wrap.classList.toggle('show-gutter', (e.clientX - r.left) <= gutterRevealZone);
        });
        wrap.addEventListener('mouseleave', function () {
            wrap.classList.remove('show-gutter');
        });
        if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
            wrap.addEventListener('touchstart', function (e) {
                var t = e.touches[0];
                var r = wrap.getBoundingClientRect();
                wrap.classList.toggle('show-gutter', (t.clientX - r.left) <= gutterRevealZone);
            }, { passive: true });
        }
    }
    // numbers layer pinned to the gutter strip
    function createGutterVeil(editor) {
        var wrap = editor.getWrapperElement();
        var veil = document.createElement('div');
        veil.className = 'gutter-veil';
        var sheet = document.createElement('div');
        sheet.className = 'gutter-veil-lines';
        veil.appendChild(sheet);
        wrap.appendChild(veil);
        
        function adoptGutters() {
            var guts = wrap.querySelector('.CodeMirror-gutters');
            if (!guts) {
                return;
            }
            if (guts.parentNode !== veil) {
                veil.appendChild(guts);
            }
            var w = guts.getBoundingClientRect().width;
            veil.style.width = w + 'px';
            wrap.style.setProperty('--gutter-w', w + 'px');
            var gcs = getComputedStyle(guts);
            veil.style.backgroundColor = gcs.backgroundColor;
            veil.style.borderRight = '1px solid ' + gcs.borderRightColor;
            var ref = wrap.querySelector('.CodeMirror-linenumber');
            if (ref) {
                var cs = getComputedStyle(ref);
                veil.style.fontFamily = cs.fontFamily;
                veil.style.fontSize = cs.fontSize;
                veil.style.fontWeight = cs.fontWeight;
                veil.style.color = cs.color;
                veil.style.lineHeight = cs.lineHeight;
            }
        }
        
        var foldColumnLeft = null;
        function foldColumn() {
            var col = wrap.querySelector('.CodeMirror-gutters .CodeMirror-foldgutter');
            if (col) {
                foldColumnLeft = col.offsetLeft;
                return foldColumnLeft;
            }
            var dl = editor.display;
            var v = dl.gutterLeft && dl.gutterLeft['CodeMirror-foldgutter'];
            if (v) {
                foldColumnLeft = v;
                return foldColumnLeft;
            }
            foldColumnLeft = dl.gutters.offsetWidth || null;
            return foldColumnLeft || 0;
        }
        // те саме, але для колонки CodeMirror-lint-markers
        var lintColumnLeft = null;
        function lintColumn() {
            var col = wrap.querySelector('.CodeMirror-gutters .CodeMirror-lint-markers');
            if (col) {
                lintColumnLeft = col.offsetLeft;
                return lintColumnLeft;
            }
            var dl = editor.display;
            var v = dl.gutterLeft && dl.gutterLeft['CodeMirror-lint-markers'];
            lintColumnLeft = v || 0;
            return lintColumnLeft;
        }
        
        function render() {
            adoptGutters();
            updateGutterWidth(editor);
            var scInfo = editor.getScrollInfo();
            sheet.style.transform = 'translateY(' + (-scInfo.top) + 'px)';
            var margin = 5;
            var from = Math.max(0, editor.lineAtHeight(scInfo.top, 'local') - margin);
            var to = Math.min(editor.lineCount(), editor.lineAtHeight(scInfo.top + scInfo.clientHeight, 'local') + 1 + margin);
            var sig = [];
            for (var i = from; i < to; i++) {
                var glh = editor.getLineHandle(i);
                if (glh.height === 0) { // прихований (згорнутий) рядок — пропускаємо
                    sig.push('H');
                    continue;
                }
                var gm = glh.gutterMarkers;
                var mm = gm && gm['CodeMirror-foldgutter'];
                sig.push(mm ? (mm.className && mm.className.indexOf('folded') >= 0 ? 'F' : 'O') : '-');
            }
            sig = sig.join('');
            if (sheet.children.length && from === sheet._from && to === sheet._to && sig === sheet._sig) {
                return;
            }
            var textH = editor.defaultTextHeight();
            var frag = document.createDocumentFragment();
            for (var i = from; i < to; i++) {
                var lh = editor.getLineHandle(i);
                if (lh.height === 0) { // прихований (згорнутий) рядок — не малюємо номер/іконки
                    continue;
                }
                var top = editor.heightAtLine(i, 'local') + 'px';
                var sp = document.createElement('span');
                sp.textContent = String(i + 1);
                sp.style.top = top;
                sp.style.height = textH + 'px';
                sp.style.lineHeight = textH + 'px';
                frag.appendChild(sp);
                var mm = lh.gutterMarkers && lh.gutterMarkers['CodeMirror-foldgutter'];
                if (mm) {
                    var fs = document.createElement('span');
                    fs.className = 'gutter-veil-fold ' + mm.className;
                    var glyphH = parseFloat(getComputedStyle(veil).fontSize) || textH;
                    fs.style.top = (parseFloat(top) + (textH - glyphH) / 2) + 'px';
                    fs.style.left = foldColumn() + 'px';
                    frag.appendChild(fs);
                }
                var lmark = lh.gutterMarkers && lh.gutterMarkers['CodeMirror-lint-markers'];
                if (lmark) {
                    var ls = document.createElement('span');
                    ls.className = 'gutter-veil-lint ' + lmark.className;
                    ls.style.top = top;
                    ls.style.height = textH + 'px';
                    ls.style.left = lintColumn() + 'px';
                    frag.appendChild(ls);
                }
            }
            sheet.innerHTML = '';
            sheet.appendChild(frag);
            sheet._from = from;
            sheet._to = to;
            sheet._sig = sig;
            if (!sheet.children.length && !sheet._retried) {
                sheet._retried = true;
                window.setTimeout(render, 120);
            }
        }
        
        veil.addEventListener('mousedown', function (e) {
            var st = editor.state.foldGutter;
            if (!st) {
                return;
            }
            var r = veil.getBoundingClientRect();
            if (e.clientX - r.left < foldColumn() || e.clientX - r.left > r.width) {
                return;
            }
            var sc = editor.getScrollInfo();
            var line = editor.lineAtHeight(e.clientY - r.top + sc.top, 'local');
            var Pos = CodeMirror.Pos;
            var folded = null;
            var marks = editor.findMarks(Pos(line, 0), Pos(line + 1, 0));
            for (var i = 0; i < marks.length; i++) {
                if (marks[i].__isFold) {
                    var fp = marks[i].find(-1);
                    if (fp && fp.line === line) {
                        folded = marks[i];
                        break;
                    }
                }
            }
            if (folded) {
                folded.clear();
            } else {
                editor.foldCode(Pos(line, 0), st.options);
            }
            render();
            window.setTimeout(render, 800);
        });
        
        editor.on('scroll', render);
        editor.on('viewportChange', function () {
            render();
            window.setTimeout(render, 500);
        });
        editor.on('refresh', function () {
            render();
            window.setTimeout(render, 700);
        });
        editor.on('gutterChanged', function () {
            render();
            window.setTimeout(render, 650);
        });
        editor.on('change', function () {
            render();
            window.setTimeout(render, 650);
        });
        editor.on('fold', render);
        editor.on('unfold', render);
        render();
    }
    
    bindGutterReveal(editorHTML);
    bindGutterReveal(editorCSS);
    bindGutterReveal(editorJS);
    createGutterVeil(editorHTML);
    createGutterVeil(editorCSS);
    createGutterVeil(editorJS);
    
    // font size
    var fontSize = E('.font-size input');
    function updateFontSize(editor, size) {
        editor.getWrapperElement().style['font-size'] = size + '%';
        editor.refresh();
        updateGutterWidth(editor);
    }
    
    
    // CODE LOADING
    // ------------------------------
    // preview window
    var iframe = document.getElementById('preview'),
        preview;
        
    if (iframe.contentDocument) {
        preview = iframe.contentDocument;
    } else if (iframe.contentWindow) {
        preview = iframe.contentWindow.document;
    } else {
        preview = iframe.document;
    }
    
    // load html
    function loadHTML() {
        var body = E('#preview').contents().find('body'),
            html = editorHTML.getValue();
            
        body.html(html);
        loadCSS();
    }
    
    // start html
    function startHTML() {
        var html = editorHTML.getValue();
        preview.open();
        preview.write(html);
        preview.close();
        loadCSS();
    }
    
    // load css
    function loadCSS() {
		var resetCSS = 'button,hr,input{overflow:visible}progress,sub,sup{vertical-align:baseline}[type=checkbox],[type=radio],legend{box-sizing:border-box;padding:0}html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}details,main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:ButtonText dotted 1px}fieldset{padding:.35em .75em .625em}legend{color:inherit;display:table;max-width:100%;white-space:normal}textarea{overflow:auto}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}[hidden],template{display:none}';
        var head = E('#preview').contents().find('head'),
            reset = '<link rel="stylesheet" href="./css/reset.css">',
            css = editorCSS.getValue();
            
        head.html('<style>' + resetCSS + css + '</style>');
    }
    
    // load js
    function loadJS() {
        var html = editorHTML.getValue(),
            js = editorJS.getValue();
            
        preview.open();
        preview.write(html + '<script>' + js + '<\/script>');
        preview.close();
    }
    
    // run html
    startHTML();
    
    
    // DEFAULTS
    // ------------------------------
    var defaultHTML = '<html>\n    <body>\n        <h1>Hello, world!</h1>\n        <p>Try this real-time HTML/CSS/JS code editor</p>\n        <p style="color:red">\n            <b>\n                HTML is a markup language for creating web pages.\n            </b>\n        </p>\n        <p  style="color:green">\n            <i>\n              HTML is easy to learn - take the first step to creating your own website!\n            </i>\n       </p>\n    </body>\n</html>',
        defaultCSS = '',
        defaultJS = '',
        defaultFontSize = '100';
        
    
    // LOCAL STORAGE
    // ------------------------------
    // set default html value
    if (localStorage.getItem('htmlcode') === null) {
        localStorage.setItem('htmlcode', defaultHTML);
    }
    
    // set default css value
    if (localStorage.getItem('csscode') === null) {
        localStorage.setItem('csscode', defaultCSS);
    }
    
    // set default js value
    if (localStorage.getItem('jscode') === null) {
        localStorage.setItem('jscode', defaultJS);
    }
    
    // set default font size
    if (localStorage.getItem('fontsize') === null) {
        localStorage.setItem('fontsize', defaultFontSize);
    }
    
    // load code values
    editorHTML.setValue(localStorage.getItem('htmlcode'));
    editorCSS.setValue(localStorage.getItem('csscode'));
    editorJS.setValue(localStorage.getItem('jscode'));
    
    // load font size
    fontSize.val(localStorage.getItem('fontsize'));
    
    
    // EDITOR UPDATES
    // ------------------------------
    // editor update (html)
    var delayHTML;
    editorHTML.on('change', function () {
        if (watch) {
            clearTimeout(delayHTML);
            delayHTML = setTimeout(loadHTML, 1000);
        }
        localStorage.setItem('htmlcode', editorHTML.getValue());
    });
    
    // editor update (css)
    editorCSS.on('change', function () {
        if (watch) {
            loadCSS();
        }
        localStorage.setItem('csscode', editorCSS.getValue());
    });
    
    // editor update (js)
    editorJS.on('change', function () {
        localStorage.setItem('jscode', editorJS.getValue());
    });
    
    // run font size update
    updateFontSize(editorHTML, fontSize.val());
    updateFontSize(editorCSS, fontSize.val());
    updateFontSize(editorJS, fontSize.val());
    
    // run editor update (html)
    loadHTML();
    
    
    // DEPENDENCY INJECTION
    // ------------------------------
    // cdnjs typeahead search
    var query = E('.cdnjs-search .query');
    E.get('https://api.cdnjs.com/libraries?fields=version,description').done(function (data) {
        var searchData = data.results,
            search = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: searchData
            });
            
        query.typeahead(null, {
            display: 'name',
            name: 'search',
            source: search,
            limit: Infinity,
            templates: {
                empty: function () {
                    return '<p class="no-match">unable to match query!</p>';
                },
                suggestion: function (data) {
                    return '<p class="lib"><span class="name">' + data.name + '</span> <span class="version">' + data.version + '</span><br><span class="description">' + data.description + '</span></p>';
                }
            }
        }).on('typeahead:select', function (e, datum) {
            var latest = datum.latest;
            loadDep(latest);
            clearSearch();
        }).on('typeahead:change', function () {
            clearSearch();
        });
    }).fail(function () {
        alert('error getting cdnjs libraries!');
    });
    
    // clear typeahead search and close results list
    function clearSearch() {
        query.typeahead('val', '');
        query.typeahead('close');
    }
    
    // load dependency
    function loadDep(url) {
        var dep;
        if (url.indexOf('<') !== -1) {
            dep = url;
        } else {
            if (url.endsWith('.js')) {
                dep = '<script src="' + url + '"><\/script>';
            } else if (url.endsWith('.css')) {
                dep = '@import url("' + url + '");';
            }
        }
        
        function insertDep(elem, line) {
            elem.replaceRange(dep + '\n', {
                line: line,
                ch: 0
            });
        }
        
        if (editorHTML.getValue().indexOf(dep) !== -1 || editorCSS.getValue().indexOf(dep) !== -1) {
            alert('dependency already included!');
        } else {
            var line;
            if (url.endsWith('.js')) {
                line = editorHTML.getValue().split('<\/script>').length - 1;
                insertDep(editorHTML, line);
                E('.code-swap-html').click();
            } else if (url.endsWith('.css')) {
                line = editorCSS.getValue().split('@import').length - 1;
                insertDep(editorCSS, line);
                E('.code-swap-css').click();
            }
            
            alert('dependency added successfully!');
        }
    }
    
    
    // RESIZE FUNCTIONS
    // ------------------------------
    // drag handle to resize code pane
    var resizeHandle = E('.code-pane'),
        widthBox = E('.preview-width'),
        previewPane = E('.preview-pane'),
        previewIframe = previewPane.find('iframe'),
        windowWidth = E(window).width();
        
    resizeHandle.resizable({
        handles: 'e',
        minWidth: 0,
        maxWidth: windowWidth - 16,
        create: function () {
            var currentWidth = resizeHandle.width(),
                previewWidth = windowWidth - currentWidth - 16;
            widthBox.text(previewWidth + 'px');
        },
        start: function (e, ui) {
            // disable pointer-events BEFORE the first move, otherwise the
            // very first pixel of movement over the iframe swallows the
            // mousemove/mouseup and the drag gets stuck ("залипає") or
            // stops responding past that point (used to target .next(),
            // but .drag-divider now sits between .code-pane and
            // .preview-pane in the markup, so that call was silently
            // finding no iframe at all and doing nothing)
            previewIframe.css('pointer-events', 'none');
        },
        resize: function (e, ui) {
            var currentWidth = ui.size.width,
                previewWidth = windowWidth - currentWidth - 16;
            previewPane.css('width', windowWidth - currentWidth + 'px');
            widthBox.show();
            if (currentWidth <= 0) {
                widthBox.text(windowWidth - 16 + 'px');
            } else {
                widthBox.text(previewWidth + 'px');
            }
        },
        stop: function (e, ui) {
            previewIframe.css('pointer-events', 'inherit');
            widthBox.hide();
            editorHTML.refresh();
            editorCSS.refresh();
            editorJS.refresh();
        }
    });
    
    // safety net: if the mouse button is released while the cursor is over
    // the preview iframe, jQuery UI's own document-level mouseup can be
    // missed and the resizable stays "engaged" forever. Whenever a
    // mousemove reports no button held, replay a mouseup so jQuery UI's
    // handler (a no-op if it isn't resizing) can clean up its state.
    E(document).on('mousemove.resizableSafety', function (e) {
        if (e.buttons === 0) {
            E(document).trigger('mouseup');
        }
    });
    
    // relocate cdnjs search into the tools menu on mobile
    // (font-size now lives permanently inside .code-tools)
    function relocateUtils() {
        var mobile = E(window).width() <= 800,
            tools = E('.code-tools');
        if (mobile) {
            if (E('.cdnjs-search').parent()[0] !== tools[0]) {
                tools.append(E('.cdnjs-search'));
            }
        } else {
            if (E('.cdnjs-search').parent()[0] === tools[0]) {
                E('.cdnjs-search').insertAfter(tools);
            }
            var pane = E('.code-pane')[0];
            if (pane && pane.style.width === '100%') {
                pane.style.width = '';
            }
            if (pane && pane.style.height) {
                pane.style.height = '';
            }
        }
    }
    
    // run relocate utils on load and on resize
    relocateUtils();
    E(window).on('resize', function () {
        relocateUtils();
    });
    
    // drag divider between code and preview panes on mobile
    var editorEl = E('#editor')[0],
        codePaneEl = document.getElementById('codepane'),
        dividerEl = document.querySelector('.drag-divider'),
        previewIframeEl = document.getElementById('preview'),
        dividerHeight = 16,
        minCodePx = 60,
        minPreviewPx = 60,
        dragging = false,
        startDragY = 0,
        startDragHeight = 0;
    
    function beginDrag(e) {
        if (E(window).width() > 800) return;
        dragging = true;
        startDragY = e.clientY;
        startDragHeight = codePaneEl.getBoundingClientRect().height;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        // disable pointer-events on the preview iframe for the WHOLE drag
        // (not just from the first move onward) - otherwise as soon as the
        // cursor slides over the still-interactive iframe (e.g. dragging
        // back down to grow the preview pane), it swallows mousemove/mouseup
        // and the divider stops responding or "sticks"
        if (previewIframeEl) previewIframeEl.style.pointerEvents = 'none';
        e.preventDefault();
    }
    
    function moveDrag(e) {
        if (!dragging) return;
        // if the button was released while the pointer was over the iframe,
        // the mouseup/pointerup never reached us - detect that here instead
        // of letting the drag stay "stuck" on every later mouse movement
        if (e.buttons === 0) {
            endDrag();
            return;
        }
        var editorH = editorEl.getBoundingClientRect().height,
            maxH = editorH - dividerHeight - minPreviewPx,
            h = startDragHeight + (e.clientY - startDragY);
        h = Math.max(minCodePx, Math.min(h, maxH));
        codePaneEl.style.height = h + 'px';
        e.preventDefault();
    }
    
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (previewIframeEl) previewIframeEl.style.pointerEvents = '';
        editorHTML.refresh();
        editorCSS.refresh();
        editorJS.refresh();
    }
    
    if (dividerEl) {
        if (window.PointerEvent) {
            dividerEl.addEventListener('pointerdown', beginDrag);
            document.addEventListener('pointermove', moveDrag);
            document.addEventListener('pointerup', endDrag);
            document.addEventListener('pointercancel', endDrag);
        } else {
            dividerEl.addEventListener('mousedown', beginDrag);
            dividerEl.addEventListener('touchstart', function (e) {
                if (e.touches[0]) beginDrag(e.touches[0]);
            }, { passive: false });
            document.addEventListener('mousemove', moveDrag);
            document.addEventListener('touchmove', function (e) {
                if (e.touches[0]) moveDrag(e.touches[0]);
            }, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }
    }
    
    
    // GENERAL FUNCTIONS
    // ------------------------------
    // code pane and wrap button swapping
    function swapOn(elem) {
        elem.css({
            'position': 'relative',
            'visibility': 'visible'
        });
    }
    
    function swapOff(elem) {
        elem.css({
            'position': 'absolute',
            'visibility': 'hidden'
        });
    }
    
    E('.code-swap span').not('.toggle-view').on('click', function () {
        var codeHTML = E('.code-pane-html'),
            codeCSS = E('.code-pane-css'),
            codeJS = E('.code-pane-js'),
            wrapHTML = E('.toggle-lineWrapping.html'),
            wrapCSS = E('.toggle-lineWrapping.css'),
            wrapJS = E('.toggle-lineWrapping.js'),
            preview = E('.preview-pane');
        
        E(this).addClass('active').siblings().removeClass('active');
        document.getElementById("codepane").style.width = E(window).width() <= 800 ? "100%" : "50%";
        E('.help-pane').removeClass('active');
        
        if (E(this).is(':contains("HTML")')) {
            swapOn(codeHTML);
            swapOn(wrapHTML);
            swapOff(codeCSS);
            swapOff(wrapCSS);
            swapOff(codeJS);
            swapOff(wrapJS);
        } else if (E(this).is(':contains("CSS")')) {
            swapOn(codeCSS);
            swapOn(wrapCSS);
            swapOff(codeHTML);
            swapOff(wrapHTML);
            swapOff(codeJS);
            swapOff(wrapJS);
        } else if (E(this).is(':contains("JS")')) {
            swapOn(codeJS);
            swapOn(wrapJS);
            swapOff(codeHTML);
            swapOff(wrapHTML);
            swapOff(codeCSS);
            swapOff(wrapCSS);
        } else if (E(this).is(':contains("preview")')) {
            swapOff(codeHTML);
            swapOff(wrapHTML);
            swapOff(codeCSS);
            swapOff(wrapCSS);
            swapOff(codeJS);
            swapOff(wrapJS);
        }
        
        swapOn(preview);
        
        editorHTML.refresh();
        editorCSS.refresh();
        editorJS.refresh();
    });
    
    // expanding scrollbars
    var vScroll = E('.CodeMirror-overlayscroll-vertical'),
        hScroll = E('.CodeMirror-overlayscroll-horizontal');
        
    vScroll.on('mousedown', function () {
        E(this).addClass('hold');
    });
    
    hScroll.on('mousedown', function () {
        E(this).addClass('hold');
    });
    
    E(document).on('mouseup', function () {
        vScroll.removeClass('hold');
        hScroll.removeClass('hold');
    });
    
    // touch drag of overlay scrollbars (mobile)
    function bindOverlayScrollbarTouch() {
        var bars = document.querySelectorAll('.CodeMirror-overlayscroll-horizontal, .CodeMirror-overlayscroll-vertical');
        Array.prototype.forEach.call(bars, function (bar) {
            var state = null;
            function wrapper() {
                var el = bar;
                while (el && el.className.indexOf('CodeMirror ') !== 0) { el = el.parentNode; }
                return el;
            }
            bar.addEventListener('touchstart', function (e) {
                if (e.touches.length !== 1) { return; }
                var cm = wrapper();
                if (!cm) { return; }
                var scroller = cm.querySelector('.CodeMirror-scroll'),
                    horizontal = bar.className.indexOf('horizontal') >= 0;
                state = {
                    scroller: scroller,
                    horizontal: horizontal,
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    left: scroller.scrollLeft,
                    top: scroller.scrollTop,
                    moved: false
                };
                e.preventDefault();
            }, { passive: false });
            bar.addEventListener('touchmove', function (e) {
                if (!state) { return; }
                e.preventDefault();
                state.moved = true;
                var t = e.touches[0];
                if (state.horizontal) {
                    if (state.scroller.scrollWidth > state.scroller.clientWidth) {
                        state.scroller.scrollLeft = state.left + (t.clientX - state.x) * (state.scroller.scrollWidth / state.scroller.clientWidth);
                    }
                } else {
                    if (state.scroller.scrollHeight > state.scroller.clientHeight) {
                        state.scroller.scrollTop = state.top + (t.clientY - state.y) * (state.scroller.scrollHeight / state.scroller.clientHeight);
                    }
                }
            }, { passive: false });
            function end() {
                if (!state) { return; }
                var st = state;
                state = null;
                var r = bar.getBoundingClientRect();
                if (!st.moved && r.width && r.height) {
                    if (st.horizontal) {
                        st.scroller.scrollLeft = (st.x - r.left) / r.width * (st.scroller.scrollWidth - st.scroller.clientWidth);
                    } else {
                        st.scroller.scrollTop = (st.y - r.top) / r.height * (st.scroller.scrollHeight - st.scroller.clientHeight);
                    }
                }
            }
            bar.addEventListener('touchend', end);
            bar.addEventListener('touchcancel', end);
        });
    }
    bindOverlayScrollbarTouch();
    
    // indent wrapped lines
    function indentWrappedLines(editor) {
        var charWidth = editor.defaultCharWidth(),
            basePadding = 4;
        editor.on('renderLine', function (cm, line, elt) {
            var off = CodeMirror.countColumn(line.text, null, cm.getOption('tabSize')) * charWidth;
            elt.style.textIndent = '-' + off + 'px';
            elt.style.paddingLeft = (basePadding + off) + 'px';
        });
    }
    
    // run indent wrapped lines
    indentWrappedLines(editorHTML);
    indentWrappedLines(editorCSS);
    indentWrappedLines(editorJS);
    
    
    // UTILITY FUNCTIONS
    // ------------------------------
    // font size
    fontSize.on('change keyup', function () {
        var size = E(this).val();
        updateFontSize(editorHTML, size);
        updateFontSize(editorCSS, size);
        updateFontSize(editorJS, size);
        localStorage.setItem('fontsize', size);
    });
    
    // toggle view
    E('.toggle-view').on('click', function () {
        E(this).toggleClass('enabled');
        if (E(this).hasClass('enabled')) {
            E(this).html('view<span class="fa-solid fa-fw fa-chevron-up"></span>');
        } else {
            E(this).html('view<span class="fa-solid fa-fw fa-chevron-down"></span>');
        }
    });
    
    // toggle tools
    E('.toggle-tools').on('click', function () {
        E(this).toggleClass('active');
    });
    
    // toggle theme
    function applyTheme(theme) {
        var editors = [editorHTML, editorCSS, editorJS],
            cmTheme = theme === 'light' ? 'default' : 'dracula',
            icon = theme === 'light' ? 'fa-sun' : 'fa-moon',
            i;
        E('html').attr('data-theme', theme);
        for (i = 0; i < editors.length; i++) {
            editors[i].setOption('theme', cmTheme);
        }
        localStorage.setItem('theme', theme);
        E('.toggle-theme').html('theme<span class="fa-solid fa-fw ' + icon + '"></span>');
        E('meta[name="theme-color"]').attr('content', theme === 'light' ? '#e8eaee' : '#282a36');
    }
    
    applyTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
    
    E('.toggle-theme').on('click', function () {
        var current = E('html').attr('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
    
    // toggle line wrapping (html)
    E('.toggle-lineWrapping.html').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            editorHTML.setOption('lineWrapping', true);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            editorHTML.setOption('lineWrapping', false);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // toggle line wrapping (css)
    E('.toggle-lineWrapping.css').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            editorCSS.setOption('lineWrapping', true);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            editorCSS.setOption('lineWrapping', false);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // toggle line wrapping (js)
    E('.toggle-lineWrapping.js').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            editorJS.setOption('lineWrapping', true);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            editorJS.setOption('lineWrapping', false);
            E(this).html('wrap<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // emmet
    E('.toggle-emmet').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            emmetCodeMirror(editorHTML);
            emmetCodeMirror(editorCSS);
            E(this).html('emmet<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            emmetCodeMirror.dispose(editorHTML);
            emmetCodeMirror.dispose(editorCSS);
            E(this).html('emmet<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // linting
    E('.toggle-lint').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            editorHTML.setOption('lint', true);
            editorCSS.setOption('lint', true);
            editorJS.setOption('lint', true);
            E(this).html('lint<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            editorHTML.setOption('lint', false);
            editorCSS.setOption('lint', false);
            editorJS.setOption('lint', false);
            E(this).html('lint<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // watch for changes
    var watch = true;
    E('.toggle-watch').on('click', function () {
        E(this).toggleClass('active');
        if (E(this).hasClass('active')) {
            watch = true;
            loadHTML();
            loadCSS();
            E(this).html('watch<span class="fa-solid fa-fw fa-toggle-on"></span>');
        } else {
            watch = false;
            E(this).html('watch<span class="fa-solid fa-fw fa-toggle-off"></span>');
        }
    });
    
    // help HTML pane
    function positionHelpPane() {
        var editorRect = document.getElementById('editor').getBoundingClientRect(),
            helpPane = document.querySelector('.help-pane');
        helpPane.style.top = editorRect.top + 'px';
        helpPane.style.left = editorRect.left + 'px';
        helpPane.style.width = editorRect.width + 'px';
        helpPane.style.height = editorRect.height + 'px';
    }

    E('.help-html').on('click', function () {
        E('.help-pane').addClass('active');
        positionHelpPane();
	    var codeHTML = E('.code-pane-html'),
            codeCSS = E('.code-pane-css'),
            codeJS = E('.code-pane-js'),
            wrapHTML = E('.toggle-lineWrapping.html'),
            wrapCSS = E('.toggle-lineWrapping.css'),
            wrapJS = E('.toggle-lineWrapping.js'),
            preview = E('.preview-pane');
            if (E(window).width() > 800) {
                swapOff(preview);
            } else {
                swapOn(preview);
            }
            swapOff(codeHTML);
            swapOff(wrapHTML);
            swapOff(codeCSS);
            swapOff(wrapCSS);
            swapOff(codeJS);
            swapOff(wrapJS);
            document.getElementById("codepane").style.width = "100%";       
    }); 

    E(window).on('resize', function () {
        if (E('.help-pane').hasClass('active')) {
            positionHelpPane();
        }
    });
       
    // reset editor
    E('.reset-editor').on('click', function () {
        editorHTML.setValue(defaultHTML);
        editorCSS.setValue(defaultCSS);
        editorJS.setValue(defaultJS);
    });
    
    // refresh editor
    E('.refresh-editor').on('click', function () {
        location.reload();
    });
    
    // clear editor
    E('.clear-editor').on('click', function () {
        editorHTML.setValue('');
        editorCSS.setValue('');
        editorJS.setValue('');
    });
    
    // run script
    E('.run-script').on('click', function () {
        loadJS();
        loadCSS();
        loadHTML();
    });
    
    // save as html file
    E('.save').on('click', function () {
        var textHTML = editorHTML.getValue()+'\n',
			textCSS  = editorCSS.getValue(),
			textJS   = editorJS.getValue(),
            blobHTML = new Blob([textHTML], {
                type: 'text/html; charset=utf-8'
            }),
            blobCSS = new Blob([textCSS], {
                type: 'text/html; charset=utf-8'
            }),
            blobJS = new Blob([textJS], {
                type: 'text/html; charset=utf-8'
            });
        var file_name = prompt("Please enter file name", "myWebCode");    
        saveAs(blobHTML, file_name+'.html');
        if (textCSS.length>0) {
			saveAs(blobCSS, file_name+'.css');
		}
		if (textJS.length>0) {
			saveAs(blobJS, file_name+'.js');
		}
        
    });
    
    
    // REFRESH EDITOR
    // ------------------------------
    editorHTML.refresh();
    editorCSS.refresh();
    editorJS.refresh();
    
    
});
