# 脚本编译说明

目前仅支持 babel 可支持的脚本类型

## 模块引用路径说明

1. `./*` 当前模块所在目录，及其子目录中的模块
2. `../*` 当前模块所在目录的父目录，及其子目录中的模块
3. `/*` 小程序根目录，及其子目录中的路径
    小程序根目录，指小程序配制文件(app.json)所在的目录
4. `*` node_modules 中的模块

## 编译

`$DIST_ROOT` 指小程序编译结果目录

`$DIST` 指源文件编译后的目标文件路径

### 模块输出


* `node_modules` 中的模块，输出到 `$DIST_ROOT/node_modules/` 目录下

* 其它模块，直接输出到 `$DIST_ROOT/` 目录下

  小程序根目录下，不能含有名字为 `node_modules` 的目录

### `$DIST` 文件中模块引用路径

输出文件中的模块引用路径，统一使用当前模块所在目录的相对路径；


### `minify` 模式

当 `minify == true` 时，所有模块将合并为一个文件： `$DIST_ROOT/scripts.js`；

模块间的引用，通过 `id` 进行索引；

`Application` `Page` `Component` 的主文件，通过 `__WEAPPER_REQUIRE__($id)` 加载；
