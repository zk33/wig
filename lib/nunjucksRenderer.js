var path = require('path');
var nunjucks = require('nunjucks');
var _ = require('lodash');

var NunjucksRenderer = function(){ };
var env, tmplRoot;

NunjucksRenderer.prototype = {
  render: function(fPath, params){
    var tmplName;
    if(_.isArray(tmplRoot)){
      tmplRoot.forEach(function(item){
        if(tmplName){
          return;
        }
        if(fPath.indexOf(item) === 0){
          tmplName = path.relative(item,fPath);
        }
      },this)
    }else{
      tmplName = path.relative(tmplRoot,fPath);
    }
    return env.render(tmplName,params);
  }
}

var renderer = new NunjucksRenderer();

exports = module.exports = function(options){
  tmplRoot = options.templateDir;
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader(options.templateDir));
  return renderer;
}
