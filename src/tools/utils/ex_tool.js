const ops = require('./tools.json');

const names = ops.map(op => {
    return op.name;
});

console.log(names);