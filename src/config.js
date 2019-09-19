module.exports = {
    name: 'Jora Sandbox',
    viewport: 'width=device-width, initial-scale=1',
    view: {
        basedir: __dirname,
        libs: {
            jora: '../node_modules/jora/dist/jora.min.js'
        },
        assets: [
            'common.css',
            'page/default.css',
            'page/default.js'
        ]
    }
};
