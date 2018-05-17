"use strict";

var fs = require('fs')
  , path = require('path')
;


//言語ごとに抜き出して_t.jsonにまとめる
var datas = {};
var dataPath = path.join(__dirname, '../data');
var langs = ['ja','en','zh-cn','es'];
fs.readdir(__dirname, function(err,files){
  files.forEach(function(fName){
    if(path.extname(fName) === '.json'){
      var page = require(path.join(__dirname,fName));
      var pageId = path.basename(fName,'.json');
      for(var key in page){
        var item = page[key];
        for(var lang in item){
          if(datas[lang] === undefined){
            datas[lang] = {};
          }
          if(datas[lang][pageId] === undefined){
            datas[lang][pageId] = {};
          }
          datas[lang][pageId][key] = item[lang];
        }
      }
    }
  });
  exportTrans();
});

function exportTrans(){
  for(var lang in datas){
    var fPath = path.join(dataPath, lang, '_i18n.json');
    var data = JSON.stringify(datas[lang],null,1);
    if(fs.existsSync(fPath)){
      var current = fs.readFileSync(fPath,{encoding:'utf8'});
      if(data === current){
        continue;
      }
    }
    console.log('updating i18n file: ' + fPath);
    fs.writeFile(fPath,data,function(err){
      if(err){
        console.warn(err);
      }
    });
  }
}
