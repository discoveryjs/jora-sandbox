module.exports = {
    name: 'Jora Sandbox',
    view: {
        basedir: __dirname,
        libs: {
            jora: '../node_modules/jora/dist/jora.js'
        },
        assets: [
            'common.css',
            'page/default.css',
            'page/default.js'
        ]
    }
};
