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
      handleNestedFilters(node, filters);
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

function handleNestedFilters(node, filters) {
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
    try {
      attrs[attr.name] = constantinople.toConstant(attr.val);
    } catch (ex) {
      if (/not constant/.test(ex.message)) {
        throw error('FILTER_OPTION_NOT_CONSTANT', ex.message + ' All filters are rendered compile-time so filter options must be constants.', node);
      }
      throw ex;
    }
  });
  return attrs;
}
