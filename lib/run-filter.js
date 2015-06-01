'use strict';

var jstransformer = require('jstransformer');
var uglify = require('uglify-js');
var CleanCSS = require('clean-css');

module.exports = filter;
function filter(name, str, options) {
  if (typeof filter[name] === 'function') {
    return filter[name](str, options);
  } else {
    var tr;
    try {
      tr = jstransformer(require('jstransformer-' + name));
    } catch (ex) {}
    if (tr) {
      // TODO: we may want to add a way for people to separately specify "locals"
      var result = tr.render(str, options, options).body;
      if (options && options.minify) {
        try {
          switch (tr.outputFormat) {
            case 'js':
              result = uglify.minify(result, {fromString: true}).code;
              break;
            case 'css':
              result = new CleanCSS().minify(result).styles;
              break;
          }
        } catch (ex) {
          // better to fail to minify than output nothing
        }
      }
      return result;
    } else {
      var err = new Error('unknown filter ":' + name + '"');
      err.code = 'UNKNOWN_FILTER';
      throw err;
    }
  }
}
