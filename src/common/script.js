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
import * as bt from '@babel/types';

import depensGraph from '../depens-graph';
import PluginEnv from '../plugin/babel/env';
import PluginGlobal from '../plugin/babel/global';
import PluginSelect from '../plugin/babel/select';

import Module from './module';

export default class Script extends Module {

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
  // 替换 require(path) 为 __WEAPPER_MODULES__($id)
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
    options.plugins.unshift(PluginSelect);
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
  const __WEAPPER_MODULES__ = bt.identifier('__WEAPPER_MODULES__');
  const __WEAPPER_REQUIRE__ = bt.identifier('__WEAPPER_REQUIRE__');
  const ast = wrapper(scripts);
  const file = bt.program([ast]);
  const result = await new Promise(minify);
  
  return result.code;

  function minify(onSuccess, onError) {
    const options = {
      presets: ['babel-preset-minify'],
      plugins: [RequireTransformer],
      ast: false, code: true, 
      configFile: path.resolve(__dirname, 'empty.babel.config.js')
    };
    babel.transformFromAst(file, '', options, (error, result)=> {
      if (error) return onError(error);
      onSuccess(result);

      // options.presets = ['babel-preset-minify']
      // babel.transform(result.code, options, (error, result)=> {
      //   if (error) return onError(error);
      //   onSuccess(result);
      // });
    });
  }

  function RequireTransformer() {
    return {
      visitor: { CallExpression }
    }
  }

  function CallExpression(path) {
    const node = path.node;
    if (node.callee.name != 'require') return;

    const source = node.arguments[0].value;
    const script = depensGraph.get(source);
    node.callee = __WEAPPER_REQUIRE__;
    node.arguments[0].value = script.$id;
  }

  function wrapper(scripts = []) {
    // return parser.parseExpression("!function(){}()")

    const modules = __WEAPPER_MODULES__;
    const require = __WEAPPER_REQUIRE__;
    const define = bt.identifier('define');
    const id = bt.identifier('id');
    const exports = bt.identifier('exports');
    const error = bt.identifier('error');

    const body = [
      // const modules = {};
      bt.variableDeclaration('var', [bt.variableDeclarator(
        modules, bt.objectExpression([])
      )]),
      // function require(id) {}
      function() {
        const factory = bt.identifier('factory');
        const module = bt.identifier('module');
        const isLoaded = bt.identifier('isLoaded');
        
        return bt.functionDeclaration(require, [id], bt.blockStatement([
          // const module = modules[id];
          bt.variableDeclaration('var', [bt.variableDeclarator(
            module, bt.memberExpression(modules, id, true)
          )]),
          bt.ifStatement(bt.unaryExpression('!', bt.memberExpression(module, isLoaded)), bt.blockStatement([
            bt.tryStatement(bt.blockStatement([
              bt.expressionStatement(bt.assignmentExpression('=', bt.memberExpression(module, isLoaded), bt.booleanLiteral(true))),
              bt.expressionStatement(bt.assignmentExpression('=', 
                bt.memberExpression(module, exports), bt.objectExpression([])
              )),
              bt.expressionStatement(bt.callExpression(bt.memberExpression(module, bt.identifier('factory')), [module, bt.memberExpression(module, exports)])),
              bt.expressionStatement(bt.unaryExpression('delete', bt.memberExpression(module, bt.identifier('factory'))))
            ]), bt.catchClause(error, bt.blockStatement([
              bt.expressionStatement(bt.callExpression(
                bt.memberExpression(bt.identifier('console'), bt.identifier('error')),
                [error]
              ))
            ])))
          ])),
          bt.returnStatement(bt.memberExpression(module, exports))
        ]))
      }(),
      // function define(id, factory) { modules[id] = {factory: factory};}
      function(){
        const factory = bt.identifier('factory');
        return bt.functionDeclaration(define, [id, factory], bt.blockStatement([
          bt.expressionStatement(bt.assignmentExpression('=', bt.memberExpression(
            modules, id, true
          ), bt.objectExpression([bt.objectProperty(bt.identifier('factory'), factory)])))
        ]))
      }(),
    ];

    for (let script of scripts) {
      const wrapped = bt.expressionStatement(bt.callExpression(
        define,[
        bt.numericLiteral(script.$id),
        bt.functionExpression(
          bt.identifier(''), [bt.identifier('module'), bt.identifier('exports')],
          bt.blockStatement(script.ast.program.body)
        )
      ]));
      body.push(wrapped);
    }

    body.push(
      // module.exports = require;
      bt.expressionStatement(bt.assignmentExpression('=', bt.memberExpression(
        bt.identifier('module'), bt.identifier('exports')
      ),require))
    )

    const main = bt.unaryExpression('!', bt.callExpression(
      bt.functionExpression(bt.identifier(''),[],bt.blockStatement(body)),
      []
    ));
    return bt.expressionStatement(main);
  }
}

