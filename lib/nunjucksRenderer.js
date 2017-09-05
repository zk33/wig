var path = require('path');
var nunjucks = require('nunjucks');
var _ = require('lodash');

var NunjucksRenderer = function() {};
var env, tmplRoot;

NunjucksRenderer.prototype = {
  getTemplate(fPath, callback) {
    var tmplName;
    if (_.isArray(tmplRoot)) {
      tmplRoot.forEach(function(item) {
        if (tmplName) {
          return;
        }
        if (fPath.indexOf(item) === 0) {
          tmplName = path.relative(item, fPath);
        }
      }, this)
    } else {
      tmplName = path.relative(tmplRoot, fPath);
    }
    return env.getTemplate(tmplName, true, callback);
  },
  addFilter: function(name, func) {
    env.addFilter(name, func);
  }
}

var renderer = new NunjucksRenderer();

exports = module.exports = function(options) {
  tmplRoot = options.templateDir;
  env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(options.templateDir, {
      watch: true
    }), {
      autoescape: true
    }
  );
  return renderer;
}
