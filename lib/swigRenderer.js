var swig = require('swig');
var _ = require('lodash');

var SwigRenderer = function(){ }

SwigRenderer.prototype = {
  render: function(fPath, params){
    return swig.renderFile(fPath,params);
  }
}

var renderer = new SwigRenderer();

exports = module.exports = function(options){

  swig.setDefaults({ cache: false });
  if(options.templateDir && _.isString(options.templateDir)){
    swig.setDefaults({ loader: swig.loaders.fs(options.templateDir) });
  }else{
    throw new Error('Swig renderer can not accept multiple template directories');
  }
  return renderer;
}
