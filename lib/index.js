'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var hash = require('object-hash');
var mkdirp = require('mkdirp');

var marked, highlight;

var renderers = {
  swig: './swigRenderer',
  nunjucks: './nunjucksRenderer'
}

var Wig = function(options) {
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
  this.options = _.merge(defaults, options);

  // initialize other vars
  this.dataLastModified = {};
  this.dataCaches = {};
  this.outputHashes = {};
  this.timeoutId = null;

  this.dataRoot = path.join(this.options.rootDir, this.options.dataDir);
  if (_.isArray(this.options.tmplDir)) {
    this.tmplRoot = this.options.tmplDir.map(function(tmplDir) {
      if (tmplDir.charAt(0) === '/') {
        return tmplDir;
      } else {
        return path.resolve(path.join(this.options.rootDir, tmplDir));
      }
    }, this);
  } else {
    this.tmplRoot = [path.resolve(path.join(this.options.rootDir, this.options.tmplDir))];
  }
  this.outRoot = path.join(this.options.rootDir, this.options.outDir);
  this.params = {};

  // initialize renderer
  var renderer = renderers[this.options.renderer];
  if (renderer) {
    this.renderer = require(renderer)({
      templateDir: (this.tmplRoot.length > 1 ? this.tmplRoot : this.tmplRoot[0])
    });
  } else {
    throw new Error('Renderer "' + this.options.renderer + '" not defined');
  }
}


Wig.prototype = {

  /*
   * build
   */
  build: function(options) {
    // to avoid too many build...
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(function() {
      this.options = _.merge({}, this.options, options);
      // use try-catch to prevent stopping build tool(gulp etc) process.
      try {
        this.loadParams();
        this.renderAll();
      } catch (e) {
        console.log(e);
      }
      this.timeoutId = null;
    }.bind(this), 300);
  },


  /*
   * load all params in data directory
   */
  loadParams: function() {
    this.params = {
      '/': this.options.vars
    };
    this.processParams(this.dataRoot);
  },


  /*
   * process all params in a directory
   */
  processParams: function(currentDir) {
    // load files
    var files = fs.readdirSync(currentDir);

    // set dir name from root
    var dirPath = currentDir.replace(this.dataRoot, '');
    if (dirPath.substr(-1) !== '/') {
      dirPath += '/';
    }

    // save params as self.params['path/to/directory/from/root/']
    // Directory if param name ended with '/'.
    // File if param name ended without '/'

    var fName, fPath, fStat;
    for (var i = 0, len = files.length; i < len; i++) {
      fName = files[i];
      fPath = path.join(currentDir, fName);
      // skip dot file
      if (fName.charAt(0) === '.') {
        continue;
      }
      // process
      fStat = fs.statSync(fPath);
      if (fStat.isFile()) {
        var fNameArr = fName.split('.');
        var fNameExt = fNameArr.pop();
        var fNameBody = fNameArr.join('.');
        var uscoreIdx = fNameBody.indexOf('_');

        // read params from file
        var params = this.readParams(fPath, fStat);
        var paramPath = dirPath;
        var paramName = '';

        // first letter is '_' -> param
        if (uscoreIdx !== -1) {
          var pName = fNameBody.substr(uscoreIdx + 1);
          if (uscoreIdx === 0) {
            if (fNameBody !== '__init__') {
              // simple param
              paramName = pName;
            }
          } else {
            var pageName = fNameBody.substr(0, uscoreIdx);
            // page param
            paramPath = paramPath + pageName;
          }
        } else {
          // page or directory
          paramPath = paramPath + fNameBody;
          if (params._contents) {
            // directory
            paramPath = paramPath + '/';
          }
        }

        if (params._contents) {
          if (paramPath.substr(-1) !== '/') {
            throw new Error('Parameter file can not contain "_contents" : ' + fPath);
          }
          this.processContents(paramPath, params._contents);
          delete params._contents;
        }

        this.params[paramPath] = this.params[paramPath] || {};
        if (paramName) {
          this.params[paramPath][paramName] = params;
        } else {
          if (typeof params === 'object') {
            this.params[paramPath] = Object.assign({}, this.params[paramPath], params);
          } else {
            console.log('NOTE:You should return Object : ' + fPath);
          }
        }
      } else if (fStat.isDirectory()) {
        this.processParams(fPath);
      }
    }
  },
  /*
   * process _contents
   */
  processContents: function(dirPath, contentsObj) {
    var params;
    for (var key in contentsObj) {
      params = contentsObj[key];
      if (params._contents) {
        this.processContents(dirPath + key + '/', params._contents);
        delete params._contents;
        key = key + '/';
      }
      this.params[dirPath + key] = Object.assign({}, this.params[dirPath + key] || {}, params);
    }
  },

  // render and save files
  renderAll: function() {
    // build params
    for (var fPath in this.params) {
      //skip if directory
      if (fPath.substr(-1) !== '/') {
        let p = this.buildParams(fPath);
        let outputPath = fPath + (p._ext ? '.' + p._ext : '');
        let tmplFile;
        if (p._template) {
          tmplFile = false;
          this.tmplRoot.forEach(function(pt) {
            if (tmplFile) {
              return;
            }
            var tmplPath = path.join(pt, p._template);
            if (fs.existsSync(tmplPath)) {
              tmplFile = {
                path: p._template,
                file: tmplPath
              }
            }
          }, this);
          if (!tmplFile) {
            throw new Error('Assigned Template (via _template param) not found: ' + fPath + ':' + p._template);
          }
        } else {
          //find template
          tmplFile = this.findTemplate(outputPath);
        }

        //get template
        this.renderer.getTemplate(tmplFile.file, (err, template) => {
          if (err) {
            throw err;
          }
          template.render(p, (err, fOutput) => {
            if (err) {
              throw err;
            }
            if (p._encoding) {
              var iconv = require('iconv-lite');
              fOutput = iconv.encode(fOutput, p._encoding);
            }
            let outputHash = hash(fOutput);
            if (this.outputHashes[outputPath] !== outputHash) {
              this.savePage(outputPath, fOutput, () => {
                //output to console
                if (this.options.verbose) {
                  console.log(outputPath + "\t <- \t" + tmplFile.path);
                }
              });
              this.outputHashes[outputPath] = outputHash;
            }
          });
        });
      }
    }
  },

  buildParams: function(fPath) {
    var p = [{}];
    var dirParam;
    var slashIdx = -1;
    while (true) {
      slashIdx = fPath.indexOf('/', slashIdx + 1);
      if (slashIdx !== -1) {
        dirParam = this.params[fPath.substring(0, slashIdx + 1)];
        if (dirParam !== undefined) {
          p.push(dirParam);
        }
      } else {
        dirParam = this.params[fPath];
        if (dirParam !== undefined) {
          p.push(dirParam);
        }
        break;
      }
    }
    var res = Object.assign.apply(this, p);
    // add utility params
    res._rel_root = path.relative(fPath.substring(0, fPath.lastIndexOf('/') + 1), '/') || '.';
    if (res._ext === undefined) {
      res._ext = 'html';
    }
    return res;
  },

  savePage: function(fPath, content, callback) {
    var outputPath = path.join(this.outRoot, fPath);
    var outputDir = path.dirname(outputPath);
    mkdirp(outputDir, (err) => {
      if (err) {
        throw err;
      }
      fs.writeFile(outputPath, content, (err) => {
        if (err) {
          throw err;
        }
        callback();
      });
    });
  },

  getPageContent: function(fPath) {
    var filePath = path.join(this.outRoot, fPath);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, {
        encoding: 'utf8'
      });
    } else {
      return '';
    }
  },



  findTemplate: function(outputPath) {
    var originalExt = path.extname(outputPath);
    var tmpDir = path.dirname(outputPath);
    if (tmpDir !== '/') {
      tmpDir += '/';
    }
    var tmpPath = tmpDir + path.basename(outputPath, originalExt);
    var examExt = [originalExt];
    if (originalExt != '.html') {
      examExt.push('.html');
    }
    while (true) {
      var pathArr = tmpPath.split('/');
      var deleted = pathArr.pop();
      var examBasePaths = [
        tmpPath,
        tmpPath.replace('/', '_'),
        path.join(pathArr.join('/'), '__base__')
      ];
      for (var i = 0, iLen = examBasePaths.length; i < iLen; i++) {
        var basePath = examBasePaths[i];
        for (var j = 0, jLen = examExt.length; j < jLen; j++) {
          var fExt = examExt[j];
          var fPath = basePath + fExt;
          var foundPath = '';
          this.tmplRoot.forEach(function(pt) {
            if (foundPath) {
              return;
            }
            var tmplPath = path.join(pt, fPath);
            if (fs.existsSync(tmplPath)) {
              foundPath = tmplPath;
            }
          }, this);
          if (foundPath) {
            return {
              path: fPath,
              file: foundPath
            }
          }
        }
      }
      if (deleted === '' || deleted === undefined) {
        break;
      }
      tmpPath = pathArr.join('/');
    }
    throw new Error('Template not found: ' + outputPath);
  },

  /*
   * Read params from file.
   * Use require if JS or JSON
   * Use marked if .md file
   * else read file as text
   */
  readParams: function(fPath, fStat) {
    var params;
    var mtime = fStat.mtime.getTime();
    if (mtime > (this.dataLastModified[fPath] || 0)) {
      // update data
      if (fPath.substr(-5) === '.json' || fPath.substr(-3) === '.js') {
        //delete cache if exists
        if (require.cache[fPath]) {
          delete require.cache[fPath];
        }
        params = require(fPath);
      } else {
        var content = fs.readFileSync(fPath, {
          encoding: 'utf8'
        });
        if (fPath.substr(-3) === '.md') {
          if (!marked) {
            // initialize marked if not initialized
            marked = require('marked');
            // enable syntax highlight
            highlight = require('highlight.js');
            marked.setOptions({
              highlight: function(code, lang) {
                return highlight.highlightAuto(code, (lang ? [lang] : null)).value;
              }
            });
          }
          var yaml = require('js-yaml');
          var res = {};
          res._raw = content;
          res._html = marked(content);
          //extract comment(yaml) block if exists
          if (content.indexOf('<!--') === 0) {
            var tmpArr = content.split('\n');
            tmpArr.shift();
            var yml = [];
            for (var i = 0, len = tmpArr.length; i < len; i++) {
              if (tmpArr[i].trim().substr(-3) === '-->') {
                break;
              }
              yml.push(tmpArr[i]);
            }
            var ymlObj = yaml.safeLoad(yml.join('\n'));
            if (ymlObj) {
              _.assign(res, ymlObj);
            }
          }
          params = res;
        } else if (fPath.substr(-4) === '.yml') {
          // yaml
          var yaml = require('js-yaml');
          params = yaml.safeLoad(content);
        } else {
          params = content;
        }
      }
      this.dataLastModified[fPath] = mtime;
      this.dataCaches[fPath] = _.cloneDeep(params);
    }
    return _.cloneDeep(this.dataCaches[fPath]);
  },
  addRendererFilter: function(name, func) {
    this.renderer.addFilter(name, func);
  }
}

exports = module.exports = Wig
