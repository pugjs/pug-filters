'use strict';

var dirname = require('path').dirname;
var constantinople = require('constantinople');
var walk = require('jade-walk');
var error = require('jade-error');
var runFilter = require('./run-filter');

module.exports = handleFilters;
function handleFilters(ast, filters) {
  walk(ast, function (node) {
    if (node.type === 'Filter') {
      handleNestedFitlers(node);
      var text = getBodyAsText(node);
      var attrs = getAttributes(node);
      attrs.filename = node.filename;
      node.type = 'Text';
      try {
        if (filters && filters[node.name]) {
          node.val = filters[node.name](text, attrs);
        } else {
          var dir = node.filename ? dirname(node.filename) : null;
          node.val = runFilter(node.name, text, attrs, dir);
        }
      } catch (ex) {
        if (ex.code === 'UNKNOWN_FILTER') {
          var err = error(ex.code, ex.message, {
            line: node.line,
            filename: node.filename
          });
          throw err;
        }
        throw ex;
      }
    }
  });
  return ast;
};

function handleNestedFilters(node) {
  if (node.block.nodes[0] && node.block.nodes[0].type === 'Filter') {
    node.block.nodes[0] = handleFilters(node.block, filters).nodes[0];
  }
}

function getBodyAsText(node) {
  return node.block.nodes.map(
    function(node){ return node.val; }
  ).join('');
}

function getAttributes(node) {
  var attrs = {};
  node.attrs.forEach(function (attr) {
    attrs[attr.name] = constantinople.toConstant(attr.val);
  });
  return attrs;
}
