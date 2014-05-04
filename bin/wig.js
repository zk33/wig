#!/usr/bin/env node

'use strict';

var cli = require('commander');

cli.version('0.0.1')


cli.command('build')
  .description('Parse JSON and build HTML')
  .option('-d, --data_dir <path>', 'JSON data directory (default:./data)')
  .option('-t, --tmpl_dir <path>', 'Swig template dirctory (default:./templates)')
  .option('-o, --out_dir <path>', 'Output dirctory (default:./dist)')
  .option('-v, --verbose', 'Display rendered files names')
  .action(function(cmd){

    // setup options
    var opt = {};

    opt.rootDir = process.cwd();

    if(cmd.data_dir){ opt.dataDir = cmd.data_dir; }
    if(cmd.tmpl_dir){ opt.tmplDir = cmd.tmpl_dir; }
    if(cmd.out_dir){ opt.outDir = cmd.out_dir; }
    if(cmd.verbose){ opt.verbose = cmd.verbose; }

    // build
    var Wig = require('../lib');
    var builder = new Wig(opt);
    builder.build();
  });

cli.parse(process.argv);
