'use strict';

var path = require('path');

var gulp = require('gulp');
var watch = require('gulp-watch');
var shell = require('gulp-shell');

var Wig = require('wig');

var builder;
var opt = {
  rootDir:__dirname, // プロジェクトのrootディレクトリ
  dataDir:"data", // dataを格納するディレクトリ
  publicDir:"public", // 出力（＝公開）ディレクトリ
  tmplDir:"templates", // テンプレートを格納するディレクトリ
  verbose:true
};

gulp.task('wig', function() {
  if (!builder) {
    builder = new Wig(opt);
  }
  try {
    builder.build();
  } catch (e) {
    console.log(e);
  }
});

var watchSrc = [
  path.join(__dirname, opt.dataDir, '**', '*'),
  path.join(__dirname, opt.tmplDir, '**', '*')
]

gulp.task('wig:watch', function() {
  watch(watchSrc, function() {
    gulp.start('wig');
  });
});


gulp.task('i18n', shell.task([
  'node i18n/updatei18n.js'
]));

gulp.task('i18n:watch', function() {
  watch([ path.join(__dirname, 'i18n/**/*.json') ], function() {
    gulp.start('i18n');
  })
});




gulp.task('default',['i18n','i18n:watch','wig','wig:watch']);
