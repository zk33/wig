"use strict";

var assert = require("assert")
  , fs = require('fs')
  , path = require('path')
  , rimraf = require('rimraf')
  , iconv = require('iconv')
  , bufferEqual = require('buffer-equal')
;

var Wig = require('../');

describe('Constructor', function(){
  describe('initial params', function(){
    it('should have default values', function(){
      var w = new Wig();
      assert.equal(w.options.rootDir, '');
      assert.equal(w.options.dataDir, './data');
      assert.equal(w.options.tmplDir,'./templates');
      assert.equal(w.options.outDir,'./dist');
      assert.equal(w.options.verbose,false);
      assert.equal(typeof(w.options.vars),'object');
      assert.equal(w.options.renderer,'swig');
    });
    it('should override default values', function(){
      var w = new Wig({
        rootDir: 'root',
        dataDir: './data2',
        tmplDir: './templates2',
        outDir: './dist2',
        verbose: true,
        vars: {'initial':'initial var'}
        //renderer: 'handlebars',//renderer not implemented
      });
      assert.equal(w.options.dataDir, './data2');
      assert.equal(w.options.tmplDir, './templates2');
      assert.equal(w.options.outDir,'./dist2');
      assert.equal(w.options.verbose,true);
      assert.equal(w.options.vars.initial,'initial var');
      //assert.equal('handlebars', w.options.renderer);
    });
  });
});


describe('Wig', function(){
  var dist = path.join(__dirname, 'dist');
  var template = path.join(__dirname, 'templates');
  var data = path.join(__dirname, 'data');
  var options = {}
  beforeEach(function(){
    options = {
      dataDir: data,
      tmplDir: template,
      outDir: dist,
      verbose: false,
      vars: {'initial':'initial var'}
    }
    if(fs.existsSync(dist)){
      rimraf.sync(dist);
    }
  });
  describe('build()', function(){
    it('should fail if data directory is wrong', function(){
      options.dataDir = options.dataDir + '_fail';
      var w = new Wig(options);
      assert.throws(w.build);
    });
    it('should fail if template directory is wrong', function(){
      options.tmplDir = options.tmplDir + '_fail';
      var w = new Wig(options);
      assert.throws(w.build);
    });
    it('should load datas and create files', function(){
      var w = new Wig(options);
      w.build();
      
      //pages
      var index = path.join(dist,'index.html');
      var php = path.join(dist,'php.php');
      var sub = path.join(dist,'sub.html');
      var pagefile = path.join(dist,'page-as-file.html');
      var sjis = path.join(dist,'sjis.html');
      var deep = path.join(dist,'dir/deep-page.html');
      var quiteDeep = path.join(dist,'dir/dir2/quite-deep-page.html');
      var js = path.join(dist,'js/index.html');
      var forced = path.join(dist,'forced-template.html');

      // output files
      assert(fs.existsSync(index),'index.html should generated');
      assert(fs.existsSync(php),'_ext parameter should override extension and should output php.php');
      assert(fs.existsSync(sub),'sub.html should generated');
      assert(fs.existsSync(pagefile),'page-as-file.html should generated via data/page-as-file.json');
      assert(fs.existsSync(deep),'dir/deep-page.html should generated via data/__init__.json');
      assert(fs.existsSync(sjis),'sjis.html should generated via data/__init__.json');
      assert(fs.existsSync(quiteDeep),'dir/dir2/quite-deep-page.html should generated via data/__init__.json');
      assert(fs.existsSync(js),'js/index.html should generated via data/js/index.js');
      assert(fs.existsSync(forced),'forced-template.html should generated via data/__init__.json');

      //content
      var indexContents = fs.readFileSync(index,{encoding:'utf8'}).split("\n");
      var subContents = fs.readFileSync(sub,{encoding:'utf8'}).split("\n");
      var deepContents = fs.readFileSync(deep,{encoding:'utf8'}).split("\n");
      var quiteDeepContents = fs.readFileSync(quiteDeep,{encoding:'utf8'}).split("\n");
      var jsContents = fs.readFileSync(js,{encoding:'utf8'}).split("\n");
      var forcedContents = fs.readFileSync(forced,{encoding:'utf8'}).split("\n");

      //data inheritance
      assert.equal(indexContents[0],'index','data properly setted in index.html');
      assert.equal(quiteDeepContents[0],'quite deep page','data properly setted in dir/dir2/quite-deep-page.html');
      assert.equal(quiteDeepContents[7],'this is text','data properly inherited in dir/dir2/quite-deep-page.html');

      //utility params
      assert.equal(indexContents[5],'.','_rel_root parameter in dist/index.html shoud be "."');
      assert.equal(quiteDeepContents[5],'../..','_rel_root parameter in dist/dir/dir2/quite-deep-page.html shoud be "../.."');

      //directory-assigned value
      assert.equal(deepContents[1],'dir value','param written in directory shoud be used');
      assert.equal(quiteDeepContents[1],'dir2 value','param written in directory shoud be used');

      //template finder
      assert.equal(quiteDeepContents[2],'base in dir','dir/dir2/quite-deep-page.html should use dir.html');
      //template forced
      assert.equal(forcedContents[2],'forced','template must be forced via "_template" parameter');

      //js loading
      assert.equal(jsContents[1],'js','js/index.html should rendered with params in data/js/__init__.json');
      assert.equal(jsContents[0],'js','js/index.html should rendered with params in data/js/index.json');

      //encoding
      var sjisContents = fs.readFileSync(sjis);
      var Iconv = require('iconv').Iconv;
      var iconv = new Iconv('UTF-8','SHIFT_JIS');
      var expected = iconv.convert('シフトJISの日本語');
      assert(bufferEqual(expected, sjisContents.slice(0,expected.length)),'dist/sjis.html should be SHIFT_JIS encoding because _encoding param in __init__.json is setted to "SHIFT_JIS"');

      //parameters assigned with constructor,build()
      assert.equal(indexContents[6],'initial var','parameter assigned with constructor should be used');

      w.build({vars:{'initial':'assigned on build'}});
      indexContents = fs.readFileSync(index,{encoding:'utf8'}).split("\n");

      assert.equal(indexContents[6],'assigned on build','parameter assigned with build() shoud be used');


    });
  });
});
