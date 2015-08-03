'use strict';

var dirname = require('path').dirname;
var constantinople = require('constantinople');
var walk = require('jade-walk');
var runFilter = require('./run-filter');

module.exports = function handleFilters(ast, filters) {
  walk(ast, function (node) {
    if (node.type === 'Filter') {
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
        if (filters && filters[node.name]) {
          node.val = filters[node.name](text, attrs);
        } else {
          var dir = node.filename ? dirname(node.filename) : null;
          node.val = runFilter(node.name, text, attrs, dir);
        }
      } catch (ex) {
        if (ex.code === 'UNKNOWN_FILTER') {
          var err = new Error(ex.message + ' on line ' + node.line + ' of ' + (node.filename || 'jade'));
          err.msg = ex.message;
          err.code = 'JADE:UNKOWN_FILTER';
          err.line = node.line;
          err.filename = node.filename;
          throw err;
        }
      }
    }
  });
  return ast;
};
