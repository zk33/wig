'use strict';

var actless = require('actless');
var gulp = require('gulp');

var options = actless.options;

// =================================
// you can modify defaul options
// ==================================

// sass compile options ======================
//options.sass.destDir = 'public/assets/css';
//options.sass.style = 'compact';
//options.sass.cssnext.options.xxx = 'xxx';
//options.sass.mqpacker.enabled = true;
//options.sass.cssnano.enabled = true;

// js compile options ========================
//options.js.srcDir = 'assets/js';
//options.js.destDir = 'public/assets/js';
//options.js.entry = 'assets/js/*.js';
//options.js.watch = ['assets/js/**/*.js', 'assets/js/**/*.jsx'];
//options.js.commonFileName = 'common.js';
//options.js.babelPresets = ['es2015', "react"];

// icon font compile options ==================
//options.icon.srcDir = 'assets/icons/';
//options.icon.destDir = 'public/assets/fonts/';
//options.icon.sassDir = '';
//options.icon.fontName = 'icon';
//options.icon.iconSassName = '_icon';
//options.icon.sassTemplate = './node_modules/actless/lib/templates/_icon.scss';
//options.icon.sassHashTemplate = './node_modules/actless/lib/templates/_iconhash.scss';
//options.icon.sassFontPath = '../fonts/';
//options.icon.className = 'icon';

// wig(HTML builder) compile options ================
//options.wig.publicDir = 'public';
//options.wig.dataDir = 'data';
//options.wig.tmplDir = 'templates';
//options.wig.verbose = true;

// test server options ===================
//options.server.type = 'node' // 'node' || 'python' || 'php' || 'gae' || 'none'
//options.server.livereload = true;
//options.server.rootDir = 'public';
//options.server.gaeAppRoot = 'app'; // for app engine only
/*
options.server.url = {
  protocol: 'http',
  hostname: 'localhost',
  port: 3000
}
*/

// HTML prettify options =================
//options.prettify.enabled = true;
//options.prettify.tmpDir = 'tmp_html';
/*
options.prettify.options = {
  indent_size: 2,
};
*/

// generate assetHash for cache busterring ===========
//options.assetHash.enabled = true;
//options.assetHash.destDir = '';
//options.assetHash.extraAssetDir = [];

// ==========================================

gulp = actless.initTasks(gulp, __dirname, options);
