"use strict";

var assert = require("assert")
  , fs = require('fs')
  , path = require('path')
  , rimraf = require('rimraf')
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
      assert.equal(w.options.renderer,'swig');
    });
    it('should override default values', function(){
      var w = new Wig({
        rootDir: 'root',
        dataDir: './data2',
        tmplDir: './templates2',
        outDir: './dist2',
        verbose: true
        //renderer: 'handlebars',//renderer not implemented
      });
      assert.equal(w.options.dataDir, './data2');
      assert.equal(w.options.tmplDir, './templates2');
      assert.equal(w.options.outDir,'./dist2');
      assert.equal(w.options.verbose,true);
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
      verbose: false
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
      var deep = path.join(dist,'dir/deep-page.html');
      var quiteDeep = path.join(dist,'dir/dir2/quite-deep-page.html');

      assert(fs.existsSync(index),'index.html should generated');
      assert(fs.existsSync(php),'_ext parameter should override extension and should output php.php');
      assert(fs.existsSync(sub),'sub.html should generated');
      assert(fs.existsSync(pagefile),'page-as-file.html should generated via data/page-as-file.json');
      assert(fs.existsSync(deep),'dir/deep-page.html should generated via data/__init.json');
      assert(fs.existsSync(quiteDeep),'dir/dir2/quite-deep-page.html should generated via data/__init__.json');

      //content
      var indexContents = fs.readFileSync(index,{encoding:'utf8'}).split("\n");
      var subContents = fs.readFileSync(sub,{encoding:'utf8'}).split("\n");
      var quiteDeepContents = fs.readFileSync(quiteDeep,{encoding:'utf8'}).split("\n");

      //data inheritance
      assert.equal(indexContents[0],'index','data properly setted in index.html');
      assert.equal(quiteDeepContents[0],'quite deep page','data properly setted in dir/dir2/quite-deep-page.html');
      assert.equal(quiteDeepContents[6],'this is text','data properly inherited in dir/dir2/quite-deep-page.html');

      //template finder
      assert.equal(quiteDeepContents[2],'base in dir','dir/dir2/quite-deep-page.html should use dir.html');



    });
  });
});
