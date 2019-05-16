/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-13 23:50:48
 * 
 * Copyright 2019-05-13 程巍巍
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

import path from 'path';
import fs from 'fs-extra';
import program from 'commander';

import * as babel from '@babel/core';
import generate from '@babel/generator';
import * as bt from 'babel-types';

import depensGraph from '../depens-graph';
import PluginEnv from '../plugin/babel/env';
import PluginGlobal from '../plugin/babel/global';
import PluginSelect from '../plugin/babel/select';

import Module from './module';

export default class Script extends Module {

  // 源码发生改变时，变为 true
  $dirty: boolean = true;

  // 需要重新输出时，变为 true
  $sync: boolean = true;

  dependencies: Set<Module> = new Set();

  constructor(_, graph) {
    super(_, graph);
  }

  /**
   * 递归编译脚 es 代码
   */
  async import() {
    if (!this.$dirty) return;
    this.$dirty = false;
    this.$sync = true;

    const depens = await new Promise(compile.bind(this));
    for (let depen of depens) {
      this.dependencies.add(depen);

      await depen.import();
    }
  }

  async export() {
    if (!this.$sync) return;
    this.$sync = false;

    const ast = await new Promise(transformRequire.bind(this));
    const result = generate(ast, {}, '');
    
    const dist = this.$application.resolveDistPath(this.$source);

    await fs.mkdirp(path.dirname(dist));
    await fs.writeFile(dist, result.code);

    for (let dependency of this.dependencies) {
      await dependency.export();
    }
  }

  // 合并 scripts
  // 替换 require(path) 为 __weapper_module__($id)
  // 输出压缩代码
  static async contact(scripts: Array<Script>): string {
    return await contact(scripts);
  }
}

function compile(onSuccess, onError) {
  // 1. 项目根目录, 指 entry 所在的目录 
  // 2. 项目根目录外的模块，不需要处理 select 语句及使用 babel.config.js 配制
  // 3. 如果不需要 minify, 按原目录结构输出到目标目录
  //    否则，缓存 ast
  // 4. Scanner 是一个 babel plugin，用于记录和重构依赖关系

  const PROJ_DIR = path.dirname(program.entry);

  const DepensScanner = PluginDepensScanner(path.dirname(this.$source), this.$application);

  const options = {
    plugins: [PluginEnv, PluginGlobal, DepensScanner],
    ast: true,
    code: false
  };

  if (/^\./.test(path.relative(PROJ_DIR, this.$source))) {
    options.configFile = `${__dirname}/empty.babel.config.js`;
  } else {
    options.plugins.push(PluginSelect);
  }

  babel.transformFile(this.$source, options, async (error, result)=> {
    if (error) return onError(error);
    
    try {
      this.ast = result.ast; 
      onSuccess(DepensScanner.dependencies());
    } catch (error) {
      onError(error);
    }
  });
}

/**
 *
 */
function PluginDepensScanner(__dirname, application) {
  const depens = [];
  plugin.dependencies = function () {
    return depens;
  };

  return plugin;

  function plugin() {
    return {
      visitor: {
        CallExpression
      }
    }
  }

  function CallExpression(path) {

    const node = path.node;
    if (node.callee.name != 'require') return;
    
    const argument = node.arguments[0];
    if (!argument) {
      throw path.buildCodeFrameError("module name is required.");
    }

    const value = argument.value;
    const source = resolveModulePath(value, __dirname)

    if (!source) throw path.buildCodeFrameError(`Module not found: ${value}`);

    if (!/\.js$/i.test(source)) {
      throw path.buildCodeFrameError(`Unsupported module: ${value}`)
    }
    const script = Script.create(source, application);
    depens.push(script);

    argument.value = source;
  }
}

/**
 * 在项目根目录中查找 name 对应的模块
 */
function resolveModulePath(name, __dirname) {
  try {
    if (/^\./.test(name)) return require.resolve(path.resolve(__dirname, name));
    __dirname = process.cwd();
    const file = path.resolve(__dirname, 'node_modules', name);
    return require.resolve(file);
  } catch (error) {
    return null;
  }
}

function transformRequire(onSuccess, onError) {
  const module = this;
  const application = this.$application;

  babel.transformFromAst(this.ast, '', {
    plugins: [RequireTransformer],
    ast: true, code: false, 
    configFile: path.resolve(__dirname, 'empty.babel.config.js')
  }, (error, result)=> {
    if (error) return onError(error);

    onSuccess(result.ast);
  });

  function RequireTransformer() {
    return {
      visitor: { CallExpression }
    }
  }

  function CallExpression($path) {
    const node = $path.node;
    if (node.callee.name != 'require') return;

    let relative = path.relative(
      path.dirname(application.resolveDistPath(module.$source)),
      application.resolveDistPath(node.arguments[0].value)
    );

    if (!/^\./.test(relative)) relative = `./${relative}`;
    node.arguments[0].value = relative;
  }
}

async function contact(scripts) {

  const file =
    babel.parseSync(`
      var __weaper_modules__ = {};
      function define(id, factory) {
        __weaper_modules__[id] = {factory: factory};
      }
      function __weapper_require__(id) {
        if (!__weaper_modules__[id]) throw new Error("Module not found with id: " + id);
        const module = __weaper_modules__[id];
        if (module.exports) return module.exports;
        module.exports = {};
        module.factory(module, module.exports);
        delete module.factory;
        return module.exports;
      }
      module.exports = __weapper_require__;
      `
    );

  for (let script of scripts) {
    script.comments = [];
    file.program.body.push(bt.expressionStatement(bt.callExpression(
      bt.identifier('define'),[
      bt.numericLiteral(script.$id),
      bt.functionExpression(
        bt.identifier(''),
        [bt.identifier('module'), bt.identifier('exports')],
        bt.blockStatement(script.ast.program.body)
      )
    ])));
  }
  file.comments = [];
  const result = await new Promise(minify);
  return result.code;

  function minify(onSuccess, onError) {
    babel.transformFromAst(file, '', {
      presets:['babel-preset-minify'],
      plugins: [RequireTransformer],
      ast: false, code: true, 
      configFile: path.resolve(__dirname, 'empty.babel.config.js')
    }, (error, result)=> {
      if (error) return onError(error);

      onSuccess(result);
    });
  }

  function RequireTransformer() {
    return {
      visitor: { CallExpression }
    }
  }

  function CallExpression($path) {
    const node = $path.node;
    if (node.callee.name != 'require') return;

    const source = node.arguments[0].value;
    const script = depensGraph.get(source);
    node.callee.name = '__weapper_require__';
    node.arguments[0].value = script.$id;
  }


}

