'use strict';

var path = require('path');

var gulp = require('gulp');
var watch = require('gulp-watch');

var Wig = require('wig');

var builder;
var opt = {
  dataDir:"./data", // dataを格納するディレクトリ
  publicDir:"./public", // 出力（＝公開）ディレクトリ
  tmplDir:"./templates" // テンプレートを格納するディレクトリ
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

gulp.task('default',['wig','wig:watch']);
