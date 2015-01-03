var path = require('path');
var nunjucks = require('nunjucks');

var NunjucksRenderer = function(){ };
var env, tmplRoot;

NunjucksRenderer.prototype = {
  render: function(fPath, params){
    var tmplName = path.relative(tmplRoot,fPath);
    return env.render(tmplName,params);
  }
}

var renderer = new NunjucksRenderer(); 

exports = module.exports = function(options){
  tmplRoot = options.templateDir; 
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader(options.templateDir));
  return renderer;
}
