const pako = require('pako');
const test = { my: 'super', puper: [456, 567], awesome: 'pako' };
const compressed = pako.deflate(JSON.stringify(test));
const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));
console.log(restored)