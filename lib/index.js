'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  ;


var renderers = {
  swig: './swigRenderer',
  nunjucks: './nunjucksRenderer'
}


var Wig = function(options){
  // initialize options
  var defaults = {
    rootDir: '',
    dataDir: './data',
    tmplDir: './templates',
    outDir: './dist',
    verbose: false,
    renderer: 'nunjucks',
    vars: {}
  }
  this.options = _.merge(defaults,options);

  // initialize other vars
  this.dataRoot = path.join(this.options.rootDir, this.options.dataDir);
  if(_.isArray(this.options.tmplDir)){
    this.tmplRoot = this.options.tmplDir.map(function(tmplDir){
      if(tmplDir.charAt(0)==='/'){
        return tmplDir;
      }else{
        return path.resolve(path.join(this.options.rootDir, tmplDir));
      }
    },this);
  }else{
    this.tmplRoot = [ path.resolve(path.join(this.options.rootDir, this.options.tmplDir))];
  }
  this.outRoot = path.join(this.options.rootDir, this.options.outDir);
  this.params = {};

  // initialize renderer
  var renderer = renderers[this.options.renderer];
  if(renderer){
    this.renderer = require(renderer)({templateDir:(this.tmplRoot.length > 1 ? this.tmplRoot : this.tmplRoot[0])});
  }else{
    throw new Error('Renderer "' + this.options.renderer + '" not defined');
  }
}


Wig.prototype = {

  /*
   * build all files
   */
  build: function(options){
    this.options = _.merge({},this.options,options);
    this.loadParams();
    this.renderAll();
  },

  /*
   * load all params in data directory
   */
  loadParams: function(){
    var root = fs.readdirSync(this.dataRoot);
    this.processParams(this.dataRoot, root, {}, _.clone(this.options.vars,true));
  },
  /*
   * process all params in a directory
   */
  processParams: function(currentDir, files, pages, baseParams){
    var pages = pages || {};
    var baseParams = baseParams || {};
    files.sort();

    //process __init__.json first
    var initIdx = files.indexOf('__init__.json');
    var initJsIdx = files.indexOf('__init__.js');
    if(initIdx !== -1){
      baseParams = _.merge(baseParams,this.readParams(path.join(currentDir,'__init__.json')));
      files.splice(initIdx,1);
    }else if(initJsIdx !== -1){
      baseParams = _.merge(baseParams,this.readParams(path.join(currentDir,'__init__.js')));
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
    baseParams['__pages'] = pages;

    // save params as self.params['path/to/directory/from/root']
    this.params[basePath] = baseParams;

    //if pages[xxxx] has '_contents', call _process_params recursively
    for(var key in pages){
      if(pages[key]['_contents']){
        var pageParams = _.clone(pages[key],true);
        delete pageParams['_contents'];
        this.processParams(path.join(currentDir,key), [], pages[key]['_contents'], pageParams );
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
      ;
    //build all page list
    var allPages = [];
    for(var outputDir in  this.params){
      baseParams = this.params[outputDir];
      if(baseParams['__pages']){
        allPageParams = baseParams['__pages'];
        for(var pageName in allPageParams){
          pageParams = allPageParams[pageName];
          // if has '_contents' this is directory, not a page
          if(pageParams['_contents']){
            continue;
          }
          //build params
          var fParams = this.buildParams(outputDir,pageName);
          //build output path
          var fName = pageName + '.' + fParams._ext;
          var fPath = path.join(outputDir, fName);
          //insert
          var page = {
            dir: outputDir,
            name: fName,
            path: fPath,
            params: fParams
          };
          allPages.push(page);
        }
      }
    }
    // bulid page list for each directories
    var dirPages = {};
    allPages.forEach(function(item){
      var fDir = item.dir;
      while(true){
        if(!_.isArray(dirPages[fDir])){
          dirPages[fDir] = [];
        }
        dirPages[fDir].push(item);
        if(fDir === '/'){
          break;
        }
        fDir = path.resolve(fDir,'..');
      }
    },this);
    //sort
    var compareFunc = function(a,b){
      var aDate = a.params._updated || a.params._created || new Date(0);
      var bDate = b.params._updated || b.params._created || new Date(0);
      if(aDate > bDate){
        return -1;
      }else if(aDate < bDate){
        return 1;
      }
      return 0;
    }
    for(var key in dirPages){
      var pagesArr = dirPages[key];
      pagesArr.sort(compareFunc);
    }
    //render
    allPages.forEach(function(item){
      //add '_pages' parameter
      item.params._pages = dirPages[item.dir]
      //render
      var fOutput = this.render(item.path, item.params);
      //encoding
      var fContent = fOutput.content;
      if(item.params['_encoding']){
        var Iconv = require('iconv').Iconv;
        var iconv = new Iconv('UTF-8',item.params['_encoding']);
        fContent = iconv.convert(fContent);
      }

      //write file
      this.savePage(item.path,fContent);
      //output to console
      if(this.options.verbose){
        console.log(item.path + "\t <- \t" + fOutput.templatePath);
      }
    },this);
  },
  render: function(fPath,params){
    var tmplFile;
    if(params._template){
      this.tmplRoot.forEach(function(pt){
        if(tmplFile){
          return;
        }
        var tmplPath = path.join(pt,params._template);
        if(fs.existsSync(tmplPath)){
          tmplFile = {
            path: params._template,
            file: tmplPath
          }
        }
      },this);
      if(!tmplFile){
        throw new Error('Assigned Template (via _template param) not found: ' + fPath + ':' + params._template);
      }
    }else{
      //find template
      tmplFile = this.findTemplate(fPath);
    }

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
    var pageParams = baseParams['__pages'][pageName];
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
    //remove '__pages' parameter
    if(resultParams['__pages']){
      delete resultParams['__pages'];
    }
    //add utility params
    resultParams['_rel_root'] = path.relative(outputDir,'/') || '.';
    if(!resultParams['_ext']){
      //TODO: add default extension option
      resultParams['_ext'] = 'html'
    }
    return resultParams;
  },

  findTemplate: function(outputPath){
    var originalExt = path.extname(outputPath);
    var tmpDir = path.dirname(outputPath);
    if(tmpDir !== '/'){
      tmpDir += '/';
    }
    var tmpPath = tmpDir + path.basename(outputPath,originalExt);
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
          var foundPath = '';
          this.tmplRoot.forEach(function(pt){
            if(foundPath){
              return;
            }
            var tmplPath = path.join(pt,fPath);
            if(fs.existsSync(tmplPath)){
              foundPath = tmplPath;
            }
          },this);
          if(foundPath){
            return { path:fPath, file:foundPath }
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
   * Use require if JS or JSON
   * Use markedelse read file
   */
  readParams: function(fPath){
    var params;
    if(fPath.substr(-5) === '.json' || fPath.substr(-3) === '.js'){
      //delete cache if exists
      if(require.cache[fPath]){
        delete require.cache[fPath];
      }
      params = _.clone(require(fPath),true);
    }else{
      var content = fs.readFileSync(fPath,{encoding:'utf8'});
      if(fPath. substr(-3) === '.md'){
        // markdown
        var marked = require('marked');
        var yaml = require('js-yaml');
        var res = {};
        res._raw = content;
        res._html = marked(content);
        //extract comment(yaml) block if exists
        if(content.indexOf('<!--') === 0){
          var tmpArr = content.split('\n');
          tmpArr.shift();
          var yml = [];
          for(var i=0,len=tmpArr.length;i<len;i++){
            if(tmpArr[i].trim().substr(-3) === '-->'){
              break;
            }
            yml.push(tmpArr[i]);
          }
          var ymlObj = yaml.safeLoad(yml.join('\n'));
          if(ymlObj){
            _.assign(res,ymlObj);
          }
        }
        params = res;
      }else if(fPath. substr(-4) === '.yml'){
        // yaml
        var yaml = require('js-yaml');
        params = yaml.safeLoad(content);
      }else{
        params = content;
      }
    }
    if(!_.isString(params)){
      if(params._created){
        params._created = new Date(Date.parse(params._created));
      }
      if(params._updated){
        params._updated = new Date(Date.parse(params._updated));
      }
    }
    return params;
  },
  addRendererFilter:function(name,func){
    this.renderer.addFilter(name,func);
  }
}

exports = module.exports = Wig
