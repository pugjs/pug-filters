'use strict';

var fs = require('fs');
var assert = require('assert');
var testit = require('testit');
var handleFilters = require('../').handleFilters;

var testCases = fs.readdirSync(__dirname + '/cases').filter(function (name) {
  return /\.input\.json$/.test(name);
});

function read(path) {
  return fs.readFileSync(__dirname + '/cases/' + path, 'utf8');
}
function write(path, body) {
  return fs.writeFileSync(__dirname + '/cases/' + path, body);
}

testCases.forEach(function (filename) {
  testit(filename, function () {
    var expectedAst = JSON.parse(read(filename.replace(/\.input\.json$/, '.expected.json')));
    var actualAst = handleFilters(JSON.parse(read(filename)));
    write(filename.replace(/\.input\.json$/, '.actual.json'), JSON.stringify(actualAst, null, '  '));
    assert.deepEqual(actualAst, expectedAst);
  })
});
