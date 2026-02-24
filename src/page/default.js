const jora = require('jora');

function createElement(tag, attrs, children) {
    const el = document.createElement(tag);

    if (typeof attrs === 'string') {
        attrs = {
            class: attrs
        };
    }

    for (let attrName in attrs) {
        if (attrName.startsWith('on')) {
            el.addEventListener(attrName.substr(2), attrs[attrName]);
        } else {
            el.setAttribute(attrName, attrs[attrName]);
        }
    }

    if (Array.isArray(children)) {
        children.forEach(child =>
            el.appendChild(child instanceof Node ? child : createText(child))
        );
    } else if (typeof children === 'string') {
        el.innerHTML = children;
    }

    return el;
}

function createText(text) {
    return document.createTextNode(String(text));
}

function fuzzyStringCmp(a, b) {
    const startChar = a[0];
    const lastChar = a[a.length - 1];
    const start = startChar === '"' || startChar === "'" ? 1 : 0;
    const end = lastChar === '"' || lastChar === "'" ? 1 : 0;

    return b.toLowerCase().indexOf(a.toLowerCase().substring(start, a.length - end), b[0] === '"' || b[0] === "'") !== -1;
}

function joraSuggestions(query, offset, data, context) {
    const typeOrder = ['property', 'value', 'method'];
    let suggestions;

    try {
        let stat = lastQuerySuggestionsStat;

        if (!stat || stat.query !== query || stat.data !== data || stat.context !== context) {
            const options = {
                tolerant: true,
                stat: true
            };

            lastQuerySuggestionsStat = stat = Object.assign(
                jora(query, options)(data, context),
                { query, data, context }
            );
        }

        suggestions = stat.suggestion(offset);

        if (suggestions) {
            var items = [];

            suggestions.forEach(function(group) {
                group.suggestions.forEach(function(value) {
                    if (value !== group.text && fuzzyStringCmp(group.text, value)) {
                        items.push({
                            type: group.type,
                            from: group.from,
                            to: group.to,
                            text: group.text,
                            value: value
                        });
                    }
                });
            });

            return items.sort((a, b) => {
                const at = typeOrder.indexOf(a.type);
                const bt = typeOrder.indexOf(b.type);
                return at - bt || (a.value < b.value ? -1 : 1);
            });
        }
    } catch (e) {
        console.error(e);
        return;
    }
}

function createResizer(leftEl, rightEl, containerEl) {
    const el = createElement('div', 'column-resizer');
    let startX;
    let startY;
    let startLeftSize;
    let startRightSize;
    let vertical;

    function onMouseDown(e) {
        e.preventDefault();
        vertical = window.matchMedia('(max-width: 850px)').matches;
        startX = e.clientX;
        startY = e.clientY;
        startLeftSize = vertical ? leftEl.offsetHeight : leftEl.offsetWidth;
        startRightSize = vertical ? rightEl.offsetHeight : rightEl.offsetWidth;
        el.classList.add('active');
        containerEl.classList.add('resizing');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
        const delta = vertical ? e.clientY - startY : e.clientX - startX;
        const newLeft = Math.max(28, startLeftSize + delta);
        const newRight = Math.max(28, startRightSize - delta);
        leftEl.style.flex = '0 0 ' + newLeft + 'px';
        rightEl.style.flex = '0 0 ' + newRight + 'px';
    }

    function onMouseUp() {
        el.classList.remove('active');
        containerEl.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    el.addEventListener('mousedown', onMouseDown);
    return el;
}

function createSectionToggle(caption) {
    const el = createElement('div', 'section-toggle', caption);
    el.addEventListener('click', () => {
        el.parentNode.style.flex = '';
        el.parentNode.classList.toggle('section-collapsed');
    });
    return el;
}

function applyJsonFromClipboard() {
    navigator.clipboard.readText().then(function(text) {
        if (text) {
            discovery.loadDataFromStream(new Blob([text]).stream());
        }
    }).catch(function() {
        // clipboard access denied – silently ignore
    });
}

function updateInput() {
    inputDataStructEl.innerHTML = '';
    discovery.view.render(inputDataStructEl, { view: 'struct', expanded: 1 }, inputData);
}

function updateOutput() {
    let outputData = null;

    try {
        outputData = jora(query)(inputData);
    } catch (e) {
        queryEditorErrorEl.innerText = e.message;
        queryEditorErrorEl.classList.add('visible');
        return;
    }

    queryEditorErrorEl.classList.remove('visible');
    outputDataStructEl.innerHTML = '';
    discovery.view.render(outputDataStructEl, {
        view: 'struct',
        expanded: 1
    }, outputData);
}

let inputData = { hello: 'world' };
let query = 'jora-sandbox-query-injection-point'.replace('jora-sandbox-query-injection-point', '');
let lastQuerySuggestionsStat = null;
const getQuerySuggestions = (query, offset) => joraSuggestions(query, offset, inputData);
const queryEditor = new discovery.view.QueryEditor(getQuerySuggestions).on('change', value => {
    query = value;
    updateOutput();
});

const inputDataStructEl = createElement('div', 'input-data-struct');
const inputDataActionsEl = createElement('div', 'input-data-actions');
const inputDataEl = createElement('div', 'input-data', [
    createSectionToggle('Input'),
    inputDataStructEl,
    inputDataActionsEl
]);
const queryEditorEl = createElement('div', 'query-editor', [
    queryEditor.el
]);
const queryEditorErrorEl = createElement('div', 'query-editor-error');
const outputDataStructEl = createElement('div', 'output-data-struct');
const outputDataEl = createElement('div', 'output-data', [
    createSectionToggle('Output'),
    outputDataStructEl,
    queryEditorErrorEl
]);

discovery.view.render(inputDataActionsEl, [
    { view: 'button', data: '{ text: "Open file" }' },
    { view: 'button', data: '{ text: "Paste JSON" }', onClick: applyJsonFromClipboard },
    'text:" or drop file here"'
]).then(() =>
    inputDataActionsEl.firstElementChild.appendChild(loadInputFileEl)
);

inputDataEl.setAttribute('tabindex', '0');
inputDataEl.addEventListener('paste', function(e) {
    var text = e.clipboardData.getData('text/plain');
    if (text) {
        e.preventDefault();
        discovery.loadDataFromStream(new Blob([text]).stream());
    }
});

const loadInputFileEl = document.createElement('input');
loadInputFileEl.type = 'file';
loadInputFileEl.accept = 'application/json,.json';
loadInputFileEl.addEventListener('change', e => discovery.loadDataFromEvent(e));

// let removeDragOverState;
inputDataEl.addEventListener('drop', e => discovery.loadDataFromEvent(e), true);
// document.addEventListener('dragenter', e => {
//     clearTimeout(removeDragOverState);
//     inputDataEl.classList.add('dragover');
// }, false);
// document.addEventListener('dragleave', e => {
//     clearTimeout(removeDragOverState);
//     removeDragOverState = setTimeout(() => inputDataEl.classList.remove('dragover'), 100);
// }, false);
inputDataEl.addEventListener('dragover', e => {
    e.stopPropagation();
    e.preventDefault();
}, true);

discovery.page.define('default', el => {
    const resizerLeft = createResizer(inputDataEl, queryEditorEl, el);
    const resizerRight = createResizer(queryEditorEl, outputDataEl, el);

    [
        inputDataEl,
        resizerLeft,
        queryEditorEl,
        resizerRight,
        outputDataEl
    ].forEach(view => el.appendChild(view));

    updateInput();

    if (query !== queryEditor.getValue()) {
        queryEditor.setValue(query);
    } else {
        updateOutput();
    }

    setTimeout(() => {
        queryEditor.cm.refresh();
        queryEditor.focus();
    }, 10);
});

discovery.on('data', () => {
    inputData = discovery.data;
    inputDataActionsEl.hidden = true;
});

// This point is using for injecting a code for loading data
(function(discovery) {
    'load-data'.replace(discovery);
}(discovery));
