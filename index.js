const fs = require('fs');
const path = require('path');
const queryPlaceholder = 'jora-sandbox-query-injection-point';

function* dataToHtml(source) {
    const CHUNK_SIZE = 1024 * 1024;
    const open = () =>
        '\n<template id="chunk' + idx + '"><script>';
    const close = () =>
        '</script></template>' +
        '\n<script>discoveryLoader.push(document.getElementById("chunk' + (idx++) + '").content.textContent)</script>';
    let idx = 0;
    let bufferSize = 0;

    yield open();

    while (bufferSize < source.length) {
        const chunk = source.slice(bufferSize, CHUNK_SIZE);
        bufferSize += chunk.length;
        yield chunk.replace(/<\/(script)/gi, '</</script><script>$1');

        if (/<(\/(s(c(r(ip?)?)?)?)?)?$/i.test(chunk.slice(-7))) {
            yield '</script><script>';
        }

        if (bufferSize > CHUNK_SIZE) {
            bufferSize = 0;
            yield close() + open();
        }
    }

    if (bufferSize > 0) {
        yield close();
    }

    // yield '<script>[...document.querySelectorAll("[id^=chunk]")].forEach(x => discoveryLoader.push(x.content.textContent))</script>';
    yield '<script>discoveryLoader.finish()</script>';
}

function build(data, name, createdAt, query) {
    return fs
        .readFileSync(path.join(__dirname, 'dist/index.html'), 'utf8')
        .replace(
            new RegExp('([\'"])' + queryPlaceholder + '\\1\\.'),
            () => JSON.stringify(query || queryPlaceholder) + '.'
        )
        .replace(
            /"load-data"\.replace\(([^\)]+)\)/,
            `const loader = $1.lib.utils.loadDataFromPush();
            $1.trackLoadDataProgress(loader);
            window.discoveryLoader = {
                push: loader.push,
                finish: () => {
                    delete window.discoveryLoader;
                    loader.finish();
                }
            };`
        )
        .replace(
            /$/,
            [...dataToHtml(JSON.stringify({
                name,
                createdAt,
                data
            }))].join('')
        );
}

module.exports = function fromData({ name, createdAt, data }, query) {
    return build(
        data,
        String(name || 'Untitled data'),
        new Date(Date.parse(createdAt) || new Date).toISOString(),
        String(query || '')
    );
};
