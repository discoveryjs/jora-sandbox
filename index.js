const fs = require('fs');
const path = require('path');
const queryPlaceholder = 'jora-sandbox-query-injection-point';

function build(data, name, createdAt, query) {
    return fs
        .readFileSync(path.join(__dirname, 'dist/index.html'), 'utf8')
        .replace(
            new RegExp('([\'"])' + queryPlaceholder + '\\1\\.'),
            () => JSON.stringify(query || queryPlaceholder) + '.'
        )
        .replace(
            /(\.loadDataFromUrl\()[^,]+/,
            (m, mc) => mc + JSON.stringify({
                name,
                createdAt,
                data
            })
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
