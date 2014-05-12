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
      verbose: true
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
    });
  });
});


