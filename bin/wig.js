#!/usr/bin/env node

'use strict';

var cli = require('commander');

cli.version('0.0.5')

function makeObj(str){
  var arr = str.split(',');
  var res = {};
  for(var i=0,len=arr.length;i<len;i+=2){
    res[arr[i]] = arr[i+1];
  }
  return res;
}

cli.command('build')
  .description('Parse JSON and build HTML')
  .option('-d, --data_dir <path>', 'Data directory (default:./data)')
  .option('-t, --tmpl_dir <path>', 'Template dirctory (default:./templates)')
  .option('-o, --out_dir <path>', 'Output dirctory (default:./dist)')
  .option('-v, --verbose', 'Display rendered files names')
  .option('-r, --renderer <name>', 'Renderer (default:nunjucks)')
  .option('-a, --assign <items>', 'Assign template vars (KEY,VALUE,KEY,VALUE...)(default:"")',makeObj)
  .action(function(cmd){

    // setup options
    var opt = {};

    opt.rootDir = process.cwd();

    if(cmd.data_dir){ opt.dataDir = cmd.data_dir; }
    if(cmd.tmpl_dir){ opt.tmplDir = cmd.tmpl_dir; }
    if(cmd.out_dir){ opt.outDir = cmd.out_dir; }
    if(cmd.verbose){ opt.verbose = cmd.verbose; }
    if(cmd.renderer){ opt.renderer = cmd.renderer; }
    if(cmd.assign){ opt.vars = cmd.assign; }

    // build
    var Wig = require('../lib');
    var builder = new Wig(opt);
    builder.build();
  });

cli.parse(process.argv);
