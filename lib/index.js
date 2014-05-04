'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
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
  this.dataRoot = path.join(this.options.rootDir, this.options.dataDir);
  this.tmplRoot = path.join(this.options.rootDir, this.options.tmplDir);
  this.outRoot = path.join(this.options.rootDir, this.options.outDir);
  this.params = {};
}


Wig.prototype = {

  /*
   * build all files
   */
  build: function(){
    this.loadParams();
  },

  /*
   *load all params in data directory
   */
  loadParams: function(){
    if(this.options.dataFiles){
    }else{

      var root = fs.readdirSync(this.dataRoot);
      this.processParams(this.dataRoot, root);
    }
  },
  processParams: function(currentDir, files, pages){
    var pages = pages || {};
    var baseParams = {};
    files.sort();

    //process __init__.json first
    var initIdx = files.indexOf('__init__.json');
    if(initIdx !== -1){
      baseParams = require(path.join(currentDir,'__init__.json'));
      files.splice(initIdx,1);
    }

    //process _contens in __init__.json
    if(baseParams['_contents']){
      pages = _.merge(pages,baseParams['_contents']);
      delete baseParams['_contents'];
    }

    // process files
    var fName
      , fPath
      , fStat
      , dirs = [] 
    ;
    for(var i=0,len=files.length; i<len; i++){
      fName = files[i];
      fPath = path.join(currentDir,fName);
      // skip dot file
      if(fName.charAt(0) === '.'){
        continue;
      }
      // process
      fStat = fs.statSync(fPath);
      if(fStat.isFile()){
        var fNameArr = fName.split('.');
        var fNameExt = fNameArr.pop();
        var fNameBody = fNameArr.join('.');
        var uscoreIdx = fNameBody.indexOf('_');

        //if has '_', this is param file. Otherwise, page definition file.
        if(uscoreIdx !== -1){
          var paramName = fNameBody.substr(uscoreIdx + 1);
          var params = this.readFile(fPath);
          if(uscoreIdx === 0){
            baseParams[paramName] = params;
          }else{
            var pageName = fNameBody.substr(0,uscoreIdx);
            if(!pages[pageName]){
              pages[pageName] = {};
            }
            pages[pageName][paramName] = params;
          }
        }else{
          pages[fNameBody] = require(fPath);
        }
        
      }else if(fStat.isDirectory()){
        dirs.push(fPath);
      }
    }

    var basePath = currentDir.replace(this.dataRoot,'');
    if(basePath === ''){
      basePath = '/';
    }else{
      var parentArr = basePath.split('/');
      parentArr.pop();
      var parentPath = parentArr.join('/');
      if(this.params[parentPath]){
        baseParams['_parent'] = this.params[parentPath];
      }
      
    }

    // save pages
    baseParams['_pages'] = pages;

    // save params as self.params['path/to/directory/from/root']
    this.params[basePath] = baseParams;


    //if pages[xxxx] has '_contents', call _process_params recursively
    for(var key in pages){
      if(pages[key]['_contents']){
        this.processParams(path.join(currentDir,key), [], pages[key]['_contents']);
      }
    }
    for(var k=0,klen=dirs.length; k<klen; k++){
      fPath = dirs[k];
      this.processParams(fPath, fs.readdirSync(fPath),{});
    }
  },
  readFile: function(fPath){
    if(fPath.substr(-5) === '.json' || fPath.substr(-3) === '.js'){
      return require(fPath);
    }else{
      return fs.readFileSync(fPath,{encoding:'utf8'});
    }
  }
}

exports = module.exports = Wig
