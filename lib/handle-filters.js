'use strict';

var dirname = require('path').dirname;
var constantinople = require('constantinople');
var walk = require('jade-walk');
var error = require('jade-error');
var runFilter = require('./run-filter');

module.exports = function handleFilters(ast, filters) {
  walk(ast, function (node) {
    if (node.type === 'Filter') {
      if (node.block.nodes[0] && node.block.nodes[0].type === 'Filter') {
        node.block = handleFilters(node.block, filters).nodes[0].block;
      }
      var text = node.block.nodes.map(
        function(node){ return node.val; }
      ).join('');
      var attrs = {};
      node.attrs.forEach(function (attr) {
        attrs[attr.name] = constantinople.toConstant(attr.val);
      });
      attrs.filename = node.filename;
      node.type = 'Text';
      try {
        node.val = (filters && filters[node.name]) ? filters[node.name](text, attrs) : runFilter(node.name, text, attrs, node.filename ? dirname(node.filename): null);
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
