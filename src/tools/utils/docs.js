const fs = require('fs');
const { dirname } = require('path');

let doc1 = fs.readFileSync(__dirname + '/doc/niva.md', 'utf8');
let doc2 = fs.readFileSync(__dirname + '/doc/MD3-simple.md', 'utf8');

module.exports = { frontendDevelopDocs: doc1 + '\n\n' + doc2, buildDoc: doc1 };