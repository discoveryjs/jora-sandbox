# Jora sandbox

A Web interface to play with jora syntax or transform some JSON with zero setup

[Try it online](https://discoveryjs.github.io/jora-sandbox/)

## Using as a package

[![NPM version](https://img.shields.io/npm/v/jora-sandbox.svg)](https://www.npmjs.com/package/jora-sandbox)

Install

```
npm i jora-sandbox
```

Generate a sandbox HTML file content

```js
const createSandboxFileContent = require('jora-sandbox');

createSandboxFileContent(
    {
        data: { hello: 'world' },
        name: 'Source of data',   // not using currently
        createdAt: new Date()     // not using currently
    },
    'hello' // query by default
);
// returns a content of html with injected data and 
```

## License

MIT
