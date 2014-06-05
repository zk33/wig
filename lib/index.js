'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  ;


var renderers = {
  swig: './swigRenderer'
}


var Wig = function(options){
  // initialize options
  var defaults = {
    rootDir: '',
    dataDir: './data',
    tmplDir: './templates',
    outDir: './dist',
    verbose: false,
    renderer: 'swig',
  }
  this.options = _.extend(defaults,options);

  // initialize other vars
  this.dataRoot = path.join(this.options.rootDir, this.options.dataDir);
  this.tmplRoot = path.join(this.options.rootDir, this.options.tmplDir);
  this.outRoot = path.join(this.options.rootDir, this.options.outDir);
  this.params = {};

  // initialize renderer
  var renderer = renderers[this.options.renderer];
  if(renderer){
    this.renderer = require(renderer)({templateDir:this.tmplRoot});
  }else{
    throw new Error('Renderer "' + this.options.renderer + '" not defined');
  }
}


Wig.prototype = {

  /*
   * build all files
   */
  build: function(){
    this.loadParams();
    this.renderAll();
  },

  /*
   * load all params in data directory
   */
  loadParams: function(){
    var root = fs.readdirSync(this.dataRoot);
    this.processParams(this.dataRoot, root);
  },
  /*
   * process all params in a directory
   */
  processParams: function(currentDir, files, pages){
    var pages = pages || {};
    var baseParams = {};
    files.sort();

    //process __init__.json first
    var initIdx = files.indexOf('__init__.json');
    var initJsIdx = files.indexOf('__init__.js');
    if(initIdx !== -1){
      baseParams = this.readParams(path.join(currentDir,'__init__.json'));
      files.splice(initIdx,1);
    }else if(initJsIdx !== -1){
      baseParams = this.readParams(path.join(currentDir,'__init__.js'));
      files.splice(initJsIdx,1);
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
          var params = this.readParams(fPath);
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
          pages[fNameBody] = this.readParams(fPath);
        }
        
      }else if(fStat.isDirectory()){
        dirs.push(fPath);
      }
    }

    var basePath = currentDir.replace(this.dataRoot,'');
    if(basePath === ''){
      basePath = '/';
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
  renderAll: function(){
    var baseParams
      , allPageParams
      , pageParams
      , fParams
      , fPath
      , fOutput
      ;
    for(var outputDir in  this.params){
      baseParams = this.params[outputDir];
      if(baseParams['_pages']){
        allPageParams = baseParams['_pages']; 
        for(var pageName in allPageParams){
          pageParams = allPageParams[pageName]; 
          // if has '_contents' this is directory, not a page
          if(pageParams['_contents']){
            continue;
          }
          //build params
          fParams = this.buildParams(outputDir,pageName);

          //render
          fPath = path.join(outputDir, pageName + '.' + fParams['_ext']);
          fOutput = this.render(fPath, fParams);

          //write file
          this.savePage(fPath,fOutput.content);

          //output to console
          if(this.options.verbose){
            console.log(fPath + "\t <- \t" + fOutput.templatePath);
          }

        }
      }
    }
  },
  render: function(fPath,params){
    //find template
    var tmplFile = this.findTemplate(fPath);

    //render
    var output = this.renderer.render(tmplFile.file, params);

    return {
      templatePath: tmplFile.path,
      templateFile: tmplFile.file,
      content: output
    };

  },
  savePage: function(fPath, content){
    var outputPath = path.join(this.outRoot, fPath);
    var outputDir = path.dirname(outputPath);
    if(!fs.existsSync(outputDir)){
      fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(outputPath,content);
  },

  buildParams: function(outputDir, pageName){
    var baseParams = this.params[outputDir];
    var pageParams = baseParams['_pages'][pageName];
    var resultParams = _.merge({},baseParams,pageParams);
    var tmpParams = baseParams;
    var parentDirs = outputDir.split('/');
    var parentDir;
    while(true){
      parentDirs.pop();
      if(parentDirs.length){
        parentDir = parentDirs.join('/');
        if(parentDir === ''){
          parentDir = '/';
        }
        if(this.params[parentDir]){
          resultParams = _.merge({},this.params[parentDir],resultParams);
        }
      }else{
        break;
      }
    }
    //remove '_pages' parameter
    if(resultParams['_pages']){
      delete resultParams['_pages'];
    }
    //add utility params
    resultParams['_rel_root'] = path.relative(outputDir,'/');
    if(!resultParams['_ext']){
      //TODO: add default extension option
      resultParams['_ext'] = 'html'
    }
    return resultParams;
  },

  findTemplate: function(outputPath){
    var originalExt = path.extname(outputPath);
    var tmpPath = path.dirname(outputPath) + '/' + path.basename(outputPath,originalExt);
    var examExt = [originalExt];
    if(originalExt != '.html'){
      examExt.push('.html');
    }
    while(true){
      var pathArr = tmpPath.split('/');
      var deleted = pathArr.pop();
      var examBasePaths = [
        tmpPath,
        tmpPath.replace('/','_'),
        path.join(pathArr.join('/'),'__base__')
      ];
      for(var i=0,iLen=examBasePaths.length; i<iLen; i++){
        var basePath = examBasePaths[i];
        for(var j=0, jLen=examExt.length; j<jLen; j++){
          var fExt = examExt[j];
          var fPath = basePath + fExt;
          var tmplPath = path.join(this.tmplRoot,fPath);
          if(fs.existsSync(tmplPath)){
            return { path:fPath, file:tmplPath }
          }
        }
      }
      if(deleted === '' || deleted === undefined){
        break;
      }
      tmpPath = pathArr.join('/');
    }
    throw new Error('Template not found: ' + outputPath);
  },
  /*
   * Read params from file.
   * Use require if JS or JSON, else read file
   */
  readParams: function(fPath){
    if(fPath.substr(-5) === '.json' || fPath.substr(-3) === '.js'){
      //delete cache if exists
      if(require.cache[fPath]){
        delete require.cache[fPath];
      }
      return require(fPath);
    }else{
      return fs.readFileSync(fPath,{encoding:'utf8'});
    }
  }
}

exports = module.exports = Wig
