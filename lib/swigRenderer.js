var swig = require('swig');



var SwigRenderer = function(){ }

SwigRenderer.prototype = {
  render: function(fPath, params){
    return swig.renderFile(fPath,params);
  }
}

var renderer = new SwigRenderer(); 

exports = module.exports = function(options){
  
  swig.setDefaults({ cache: false });
  if(options.templateDir){
    swig.setDefaults({ loader: swig.loaders.fs(options.templateDir) });
  }
  return renderer;
}
