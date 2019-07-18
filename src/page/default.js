/* eslint-env browser */
/* global discovery, jora */

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

let inputData;
let query = '';
let lastQuerySuggestionsStat = null;
const inputDataEl = document.createElement('div');
const inputDataStructEl = document.createElement('div');
const inputDataActionsEl = document.createElement('div');
const queryEditorEl = document.createElement('div');
const queryEditorErrorEl = document.createElement('div');
const outputDataEl = document.createElement('div');
const outputDataStructEl = document.createElement('div');
const getQuerySuggestions = (query, offset) => joraSuggestions(query, offset, inputData);
const queryEditor = new discovery.view.QueryEditor(getQuerySuggestions).on('change', value => {
    query = value;
    updateOutput();
});

inputDataEl.className = 'input-data';
inputDataStructEl.className = 'input-data-struct';
inputDataActionsEl.className = 'input-data-actions';
outputDataEl.className = 'output-data';
outputDataStructEl.className = 'output-data-struct';
queryEditorEl.className = 'query-editor';
queryEditorErrorEl.className = 'query-editor-error';
queryEditorEl.appendChild(queryEditor.el);
outputDataEl.appendChild(outputDataStructEl);
outputDataEl.appendChild(queryEditorErrorEl);
inputDataEl.appendChild(inputDataStructEl);
inputDataEl.appendChild(inputDataActionsEl);

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
    updateOutput();
    setTimeout(() => {
        queryEditor.cm.refresh();
        queryEditor.focus();
    }, 10);
});
