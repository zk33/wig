<!---
#_created: 2015-08-01
#_updated: 2015-08-01
#author: your name
--->

# What is wig?

wigは、素早く確実にWebサイトを更新し続けるために作られた、静的サイトジェネレータです。  
JSON等で定義されたデータと、テンプレートを結合し、静的ページを出力します。

<div class="main-chart">
  <div class="main-chart-conbine">
    <div class="main-chart-conbine-item">
      <h2>data</h2>
      <p>json, js, Markdown, yaml, text etc.</p>
    </div>
    <div class="main-chart-conbine-item mode-plus">+</div>
    <div class="main-chart-conbine-item">
      <h2>template</h2>
      <p>nunjucks template</p>
    </div>
  </div>
  <div class="main-chart-command">
    <p><code>wig build / wig.build()</code></p>
  </div>
  <div class="main-chart-result">
    <h2>static web site/document<h2>
  </div>
</div>


# Concept

wigのコンセプトは「DRY(Don't Repeat Yourself)」です。

Webサイトを作っている時に、まれによくある

* グローバルナビゲーションに修正が入って、全ページを書き換えないといけなくなった
* 大量にある同じレイアウトのページでレイアウト変更が入って、全部書き換えないといけなくなった

そんな時、わざわざ全てのページを開いて、HTMLを書き換えるのは、手間もかかりますしミスも多くなります。
そんな苦労から一切おさらばし、より安全確実に、スピーディにWebサイトを更新し続けられるようにと作られたのがwigです。

wigでは、テンプレートエンジンや、JSON等によるデータ定義を活用することで、早く確実なサイト構築を実現します。


# Getting started

## 1.ディレクトリの準備

プロジェクトのルートディレクトリに、３つのディレクトリを準備します。

```text
/data ・・ データを格納します
/templates ・・ テンプレートを格納します
/public ・・ ビルドした静的ファイルが出力されます
```
※ 各ディレクトリはオプションで指定できます

## 2-1.コマンドラインでビルドする

wigをインストールします

```
npm install -g wig
```

データとテンプレートを用意したら、ビルドコマンドを走らせます。

```
wig build
```


## 2-2.タスクランナーでビルドする

wigをインストールします

```
npm install wig
```

gulpfile.jsにタスクを用意します。

```
var path = require('path');

var gulp = require('gulp');
var watch = require('gulp-watch');

var Wig = require('wig');

var builder;
var opt = {
  rootDir:__dirname, // プロジェクトのrootディレクトリ指定
  dataDir:"./data", // dataを格納するディレクトリ
  publicDir:"./public", // 出力（＝公開）ディレクトリ
  tmplDir:"./templates" // テンプレートを格納するディレクトリ
}

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
    gulp.start('actless:wig');
  });
});

gulp.task('default',['wig','wig:watch']);
```

gulpを走らせます

```
gulp
```

----

※最小限のセットアップ（gulpを使う場合）は、[サンプル](#)に例があります。  
CSSなどを含めたセットアップは、[actless](https://github.com/zk33/actless)を使うと便利です。  
このドキュメントもwigで作られていますので、参考にしてください！

# Setup data

`/data`ディレクトリ内のデータには、２つの役割があります。

1. **どの階層に、どういう名前でページを出力するかを決める**
2. **各ページで使う変数を定義する**

## 1. 出力するページを指定する

出力するページの指定には、２つの方法があります。

### 1-1. 出力したいファイルと同名のファイルを置く

`data`ディレクトリ内に、`data/index.txt`、`data/index.md`などのファイルを置いてビルドすると、
`public`ディレクトリに、`public/index.html`が出力されます。

Markdownファイル（`.md`）を中心にサイトを作っていくような場合にはこちらの方法を使うと便利です。

※この場合のファイル名は、`_`（アンダースコア）から始めることはできません。（_から始まったファイルは、パラメータとして処理されます）

### 1-2.`_contents`パラメータを使う

`data`ディレクトリ内に置いたJSONファイル（またはJSファイル）で、`_contents`というパラメータを設定すると、それに基づいてページが出力されます。  
その際、`_contents`が定義されているファイルの名前がディレクトリ名になります。
もし、ファイル名をディレクトリ名として使わない場合は、`__init__.json`というファイルに`_contents`パラメータを定義してください。

たとえば、以下の内容を、

```json
{
  "_contents":{
    "index":{
      "title":"indexページ"
    },
    "profile":{
      "title":"プロフィール"
    },
    "works":{
      "_contents":{
        "work1":{
          "title":"作品1"
        },
        "work2":{
          "title":"作品2"
        }
      }
    }
    "contact":{
      "title":"お問い合わせ"
    }
  }
}

```

`data/hello.json`に書いた場合は、`public`ディレクトリに

```
hello/index.html
hello/profile.html
hello/works/work1.html
hello/works/work2.html
hello/contact.html
```

が出力されます。  
`data/__init__.json`に書いた場合は

```
index.html
profile.html
works/work1.html
works/work2.html
contact.html
```

が出力されます。

## 2.パラメータの定義

`data`ディレクトリのJSONファイルで、テンプレートに渡す変数を定義することができます。
たとえば、ページのタイトルやdescriptionをdataページで決めたり、ページの処理を分岐させるためにIDを渡すなど、様々に活用できます。

### 2-1. ファイルで定義する

アンダースコア（`_`）を最初につけたファイルは、パラメータとして扱われます。

たとえば、`data/_hello.txt`の中身は、「hello」という名前でテンプレートに渡されます。

アンダースコア（`_`）を最初につけたファイルが、JSONなどの複数パラメータを設定できるファイルの場合、ファイル名を変数名とした`Object`になります。

`data/_hello.json`の中身が

```
{
  "world":"yay!"
}
```
の場合、テンプレート上では

```
{{ hello.world }}
```

で表示させることができます。

### 2-2. JSONやyamlなどのファイルで複数のパラメータを定義する



## 3. パラメータの継承

親階層で定義したパラメータは、子階層で使うことができます。


## 4. 特殊パラメータ

* `_ext`：ファイルを出力する時に、拡張子を指定したものに変更することができます。
* `_template`：テンプレートのファイル名を指定します。

# Templating

wigは、テンプレートエンジンとして[nunjucks](https://mozilla.github.io/nunjucks/)を採用しています。
[nunjucks](https://mozilla.github.io/nunjucks/)は、jinja2をベースにしたテンプレートエンジンで、継承の仕組みを持っています。

テンプレートの詳細は、[nunjucks](https://mozilla.github.io/nunjucks/)のドキュメントをご覧ください。
[nunjucks](https://mozilla.github.io/nunjucks/)以外のテンプレートエンジンを使いたい場合は、rendererを書くことで対応できます。

## テンプレートの決定の仕組み

ファイルを出力する際、`template`フォルダ内のどのテンプレートを使ってレンダリングするかは、`data`で決められたファイル名を元にして、自動的に決まる仕組みになっています。

### テンプレートのルール

1. 出力ファイルと完全に同じディレクトリ/ファイル名のテンプレートを探します /foo/bar.html -> /foo/bar.html
2. ディレクトリの区切りをアンダースコアに置換したものを探します /foo/bar.html -> foo\_bar.html
3. ディレクトリ内に`__base__.html`があれば、それを使います /foo/bar.html -> foo/\_\_base\_\_.html
4. 1階層上に上がって、同じことを繰り返します。

たとえば、出力するファイルが、`/spam/egg/ham.php`の場合、

```
/spam/egg/ham.php
/spam/egg/ham.html
/spam_egg_ham.php
/spam_egg_ham.html
/spam/egg/__base__.php
/spam/egg/__base__.html
/spam/egg.php
/spam/egg.html
/spam_egg.php
/spam_egg.html
/spam/__base__.php
/spam/__base__.html
/spam.php
/spam.html
/__base__.php
/__base__.html
```

これを上から順に探して、見つかったテンプレートを使います。

このルールから外れたテンプレートを使いたい場合は、dataで該当するファイル/ディレクトリのところに`_template`変数で指定してください。

## 自動出力されるテンプレート変数

`data`ディレクトリ内で定義された変数以外に、自動で生成されてテンプレートに渡される変数があります。

`_rel_root`
`public`のルートディレクトリまでの相対パスを出力します。
サイト内のリンクを相対パスで書きたい場合などに便利です。


# JS API

## constructor

wigを初期化します。

```
let Wig = require('wig');
let options = {}
let wigInstance = new Wig(options);
```

### constructor options

```
let options = {
  rootDir: '', // 処理する際のrootになるディレクトリの指定
  dataDir: './data', // データ・パラメータのファイル格納用ディレクトリ
  tmplDir: './templates', // テンプレートディレクトリ
  publicDir: './public', // 出力先ディレクトリ
  verbose: true, // trueにすると、ファイル出力時に、出力パスなどの情報を出力します
  vars: {} // テンプレート向けのグローバル変数を初期化時に指定する
}
```

## .build()

静的ファイルを出力します。

```
let Wig = require('wig');
let options = {}
let wigInstance = new Wig(options);

wigInstance.build();
```

## .addRendererFilter(filterName,filterFunc)

nunjucksにフィルタを追加します。

```
let Wig = require('wig');
let options = {}
let wigInstance = new Wig(options);

wigInstance.addRendererFilter('date', function(date,postfix){
  var d = new Date(Date.parse(date));
  return d.toDateString() + postfix;
});

wigInstance.build();
```

# Command line API

## install

```
npm install -g wig
```

## wig

```
wig
```

バージョン等を表示します。

```
-V, --version    output the version number
-h, --help       output usage information
```

## wig build

```
wig build
```

dataディレクトリとtemplateディレクトリの内容を元に、静的ファイル一式をビルドします。

```
-d, --data_dir <path>    Data directory (default:./data)
-t, --tmpl_dir <path>    Template dirctory (default:./templates)
-p, --public_dir <path>  Output dirctory (default:./public)
-v, --verbose            Display rendered files names
-a, --assign <items>     Assign template vars (KEY,VALUE,KEY,VALUE...)(default:"")
-h, --help               output usage information
```
