'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , walk = require('walk')
  ;



var Wig = function(options){
  // initialize
  var defaults = {
    rootDir: '',
    dataDir: './data',
    tmplDir: './templates',
    outDir: './dist',
    verbose: false,
    dataFiles:false,
    tmplFiles:false
  }
  this.options = _.extend(defaults,options);
}


Wig.prototype = {

  /*
   * build all files
   */
  build: function(){
    console.log(this.options);
  },

  /*
   *load all template params in data directory
   */
  load_params: function(){
  },
  process_params: function(){
  },
}

exports = module.exports = Wig
