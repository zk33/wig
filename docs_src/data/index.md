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

wigのコンセプトは「**DRY(Don't Repeat Yourself)**」です。  

wig（と、その前身である[negi](https://github.com/zk33/negi)）は元々、更新頻度の高い、多言語展開された中規模Webサイトを、長く更新し続けていくために作られたツールで、多数のページを確実に管理していくため、

* できる限りコピペしないで済む
* 最低限の修正作業で、確実に全ページが更新されるようにする
* 大きなレイアウト変更にも対応できるようにする

ということが必要でした。

その実現のため、

* 継承やマクロなどを駆使してDRYに書けるテンプレートエンジン**[nunjucks](https://mozilla.github.io/nunjucks/)**

を主軸にして、

* テンプレートに渡す変数の管理を便利にする`data`の仕組み

を組み合わせて作られた静的サイトジェネレータがwigです。


# Getting started

## 1.ディレクトリの準備

プロジェクトのルートディレクトリに、３つのディレクトリを準備します。

```text
/data ・・ データを格納します
/templates ・・ テンプレートを格納します
/public ・・ ビルドした静的ファイルが出力されます
```
※ 各ディレクトリはオプションで指定できます

## 2. データとテンプレートの作成

[Setup data](#setup-data)と[Templating](#templating)を参考に、データとテンプレートを用意します。  
https://github.com/zk33/wig/tree/master/sample にサンプルもありますので参考にしてください。

## 3.ビルドする

### 3-1.コマンドラインでビルドする

wigをインストールします

```
npm install -g wig
```

ビルドコマンドを走らせます。

```
wig build
```


### 3-2.タスクランナーでビルドする

wigをインストールします

```
npm install wig gulp gulp-watch
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
  tmplDir:"./templates", // テンプレートを格納するディレクトリ
  verbose: true // ファイル出力時に出力したファイル名と使ったテンプレート名を表示します
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

※最小限のセットアップ（gulpを使う場合）は、[サンプル](https://github.com/zk33/wig/tree/master/sample)に例があります。  
CSSなどを含めたセットアップは、[actless](https://github.com/zk33/actless)を使うと便利です。  
ちなみにこのドキュメントもwigで作られていますので、参考にしてください！

# Setup data

`/data`ディレクトリ内のデータには、２つの役割があります。

1. **どの階層に、どういう名前でページを出力するかを指定する**
2. **各ページで使う変数を定義する**

## 1. 出力するページを指定する

`data`ディテクトリ内に置いたファイル（と、その中身）によって、どのような名前のファイルをどの階層に出力するかを設定することができます。  
出力するページの指定には、２つの方法があります。

### 1-1. 出力したいファイルと同名のファイルを置く

`data`ディレクトリ内に、`/index.json`、`/index.js`、`/index.md`、などのファイルを置いてビルドすると、`public`ディレクトリに、`/index.html`が出力されます。

`data`ディレクトリに置いたファイルの名前/階層と、出力されるファイルの名前/階層は同じになります。

<table>
  <thead>
    <tr>
      <th>'data'に置くファイル</th>
      <th>`public`に出力されるファイル</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>/index.js</td>
      <td>/index.html</td>
    </tr>
    <tr>
      <td>/foo/bar.md</td>
      <td>/foo/bar.html</td>
    </tr>
    <tr>
      <td>/foo/bar/baz.json</td>
      <td>/foo/bar/baz.html</td>
    </tr>
  </tbody>
</table>

※ JSONやJS、YAMLファイルの場合は、ファイル内に書かれたデータ内容が、パラメータとしてテンプレートに渡されます。

※ 出力されるファイルの拡張子は「`_ext`」というパラメータで指定することができます。

※ JSONやJS、YAMLファイルで、ファイル内に`_contents`というパラメータが設定されている場合は、ファイル名がディレクトリとして扱われ、`_contents`に定義されたページがそのディレクトリ内に出力されます。

※ ページとして出力したい場合は、ファイル名を`_`（アンダースコア）から始めることができません。`_`から始まったファイルは、パラメータとして処理されます。


### 1-2.`_contents`パラメータを使う

`data`ディレクトリ内に置いたJSONファイル（またはJSファイル）で、`_contents`というパラメータを設定すると、それに基づいてページが出力されます。  
その際、`_contents`が定義されているファイルの名前がディレクトリ名になります。  

もし、ファイル名をディレクトリ名として使わない場合は、`__init__.json`というファイルに`_contents`パラメータを定義してください。

`_contents`は入れ子にもできるので、1ファイルでサイトの全てのページを定義することもできます。


たとえば以下の内容を、

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

`data'ディレクトリの`/hello.json`に書いた場合は、`public`ディレクトリには

```
/hello/index.html
/hello/profile.html
/hello/works/work1.html
/hello/works/work2.html
/hello/contact.html
```

が出力されます。  
`/__init__.json`に書いた場合は

```
/index.html
/profile.html
/works/work1.html
/works/work2.html
/contact.html
```

が出力されます。



## 2.パラメータの定義

`data`ディレクトリ内のJSON等のファイルで、テンプレートに渡す変数を定義することができます。  
たとえば、ページごとにタイトルやdescriptionを設定したり、テンプレート上でページの処理を分岐させるためにIDを渡すなど、様々に活用できます。

### 2-1. ファイルで定義する

`data`ディレクトリ内に置かれたファイルのうち、ファイル名がアンダースコア（`_`）から始まるものは、パラメータとして扱われます。

たとえば、`data/_hello.txt`の中身は、「hello」という名前でテンプレートに渡されます。

アンダースコア（`_`）を最初につけたファイルが、JSONなどの複数パラメータを設定できるファイルの場合、ファイル名を変数名とした`Object`になります。

たとえば、`data/_foo.json`の中身が

```
{
  "bar":"baz"
}
```
の場合、テンプレート上では

```
{{ foo.bar }}
```

で表示させることができます。

### 2-2. ページ定義と一緒にパラメータを指定する

ページ定義で配置したファイルに、一緒に変数を定義することができます。  
たとえば、以下のようにページと変数をまとめて設定できます。

```
{
  "IMG_DIR":"/assets/img",
  "title":"my cool website",
  "_contents":{
    "index":{
      "title":"top"
    }
    "profile":{
      "title":"my profile",
      "foo":"bar"
    }
  }
}
```

## 3. ディレクトリ構造とパラメータの関係

変数は、ディレクトリごと、もしくはページごとに指定できます。  
ディレクトリ単位で設定された変数は、そのディレクトリと、その子階層のファイルの出力時にテンプレートに渡されます。

```
{
  "IMG_DIR":"/assets/img",
  "_contents":{
    "index":{}
    "profile":{},
    "works":{
      "_contents":{
        "work1":{},
        "work2":{}
      }
    }
  }
}
```

この場合、`IMG_DIR`変数はこのファイルで定義されている全てのページで使えます。

子階層やページで同じ名前で変数を設定すると、親階層の変数定義をオーバーライドすることができます。

```
{
  "title":"my cool website",
  "_contents":{
    "index":{}
    "profile":{
      "title":"my profile"
    },
    "works":{
      "title":"works",
      "_contents":{
        "work1":{},
        "work2":{}
      }
    }
  }
}
```



## 4. `__init__.json`

パラメータ/ページ定義ファイルのうち、`__init__.json`（または`__init__.js`）というファイルは、少し特別な扱いがされます。

* `__init__.json`は、ディレクトリ内で最初に読み出されます
* `__init__.json`に`_contents`が設定されている場合、`_contents`で定義された出力ページは、`__init__`ディレクトリではなく、`__init__json`ファイルの置かれているのと同じ階層に出力されます。


## 5. 特殊変数

基本的に、`data`ディレクトリ内で定義する変数名は、自由に設定して大丈夫なのですが、`_contents`変数のように、デフォルトの挙動を変更するための特殊な変数がいくつか定義されています。

### `_ext`

ファイルを出力する時に、拡張子を指定したものに変更することができます。
たとえばサイト全体をPHPとして出力したい場合は、`data`ディレクトリの`/__init__.json`に

```
{
  "_ext":"php"
}
```
と書くことで、全てのファイルの拡張子を`.php`に変更することができます。  
ページ/ディレクトリ単位で変更したい場合は、

```
{
  "_contents":{
    "index":{
      "_ext":"php"
    }
    "profile":{},
    "works":{
      "_ext":"php",
      "_contents":{
        "work1":{},
        "work2":{},
        "work3":{}
      }
    }
  }
}
```

というように必要なページやディレクトリ単位で`_ext`パラメータを設定してください。

### `_template`

テンプレートのファイル名を指定します。  
wigではテンプレート名は出力するファイル名を元に自動で決定されますが、そのルール外のテンプレートを使いたい場合はこちらを指定してください。

こちらも`_ext`と同様、ディレクトリやファイル単位で指定できます。  

```
{
  "_contents":{
    "index":{
      "_template":"foo/bar/template.html"
    }
    "profile":{},
    "works":{
      "_template":"foo/bar/for_works.html",
      "_contents":{
        "work1":{},
        "work2":{},
        "work3":{}
      }
    }
  }
}
```



# Templating

wigは、テンプレートエンジンとして[nunjucks](https://mozilla.github.io/nunjucks/)を採用しています。
[nunjucks](https://mozilla.github.io/nunjucks/)は、jinja2をベースにしたテンプレートエンジンで、継承の仕組みを持っています。

テンプレートの詳細は、[nunjucks](https://mozilla.github.io/nunjucks/)のドキュメントをご覧ください。

## 出力時に使用されるテンプレート

`public`にファイルを出力する時、`template`フォルダ内のどのテンプレートを使ってレンダリングするかは、`data`で決められた出力ファイル名を元にして、自動的に決まります。

### テンプレートの自動決定のルール

1. 出力ファイルと完全に同じディレクトリ/ファイル名のテンプレートを探します /foo/bar.html -> /foo/bar.html
1. ディレクトリの区切りをアンダースコアに置換したものを探します /foo/bar.html -> foo\_bar.html
1. ディレクトリ内に`__base__.html`があれば、それを使います /foo/bar.html -> foo/\_\_base\_\_.html
1. 1階層上に上がって、同じことを繰り返します。

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

## 自動生成されるテンプレート変数

`data`ディレクトリ内で定義された変数以外に、自動で生成されてテンプレートに渡される変数があります。

### `_rel_root`

`public`のルートディレクトリまでの相対パスを出力します。
サイト内のリンクを相対パスで書きたい場合などに便利です。

```
<img src="{{_rel_root}}/assets/img/logo.png" alt="" />
```

と書くことで、

```
<img src="../../assets/img/logo.png" alt="" />
```

のように、ページの階層に応じた相対パスでルートディレクトリを参照させることができます


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

## wig build

```
wig build
```

dataディレクトリとtemplateディレクトリの内容を元に、静的ファイル一式をビルドします。コマンドラインオプションは以下の通りです。

```
-d, --data_dir <path>    Data directory (default:./data)
-t, --tmpl_dir <path>    Template dirctory (default:./templates)
-p, --public_dir <path>  Output dirctory (default:./public)
-v, --verbose            Display rendered files names
-a, --assign <items>     Assign template vars (KEY,VALUE,KEY,VALUE...)(default:"")
-h, --help               output usage information
```
