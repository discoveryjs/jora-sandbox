/* eslint-env browser */
/* global discovery */
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
            return suggestions
                .filter(
                    item => item.value !== item.current && fuzzyStringCmp(item.current, item.value)
                )
                .sort((a, b) => {
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

function createSectionToggle(caption) {
    const el = createElement('div', 'section-toggle', caption);
    el.addEventListener('click', () =>
        el.parentNode.classList.toggle('section-collapsed')
    );
    return el;
}

function loadDataFromEvent(event) {
    const source = event.dataTransfer || event.target;
    const file = source && source.files && source.files[0];

    event.stopPropagation();
    event.preventDefault();

    if (file.type !== 'application/json') {
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        inputData = JSON.parse(event.target.result);

        updateInput();
        updateOutput();
    };
    reader.readAsText(file);
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
    // 'text:" or "',
    // { view: 'button', data: '{ text: "Paste from clipboard" }', onClick: () => alert(1123) },
    'text:" or drop file here"'
]).then(() =>
    inputDataActionsEl.firstElementChild.appendChild(loadInputFileEl)
);

const loadInputFileEl = document.createElement('input');
loadInputFileEl.type = 'file';
loadInputFileEl.accept = 'application/json,.json';
loadInputFileEl.addEventListener('change', e => loadDataFromEvent(e));

// let removeDragOverState;
inputDataEl.addEventListener('drop', e => loadDataFromEvent(e), true);
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
    [
        inputDataEl,
        queryEditorEl,
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

const origLoadDataFromUrl = discovery.loadDataFromUrl;
discovery.loadDataFromUrl = function(...args) {
    return origLoadDataFromUrl.apply(this, args).then(() => {
        if (discovery.data !== undefined) {
            inputData = discovery.data;
            inputDataActionsEl.hidden = true;
        }
    });
};
