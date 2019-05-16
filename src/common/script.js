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

import PluginEnv from '../plugin/env';
import PluginGlobal from '../plugin/global';
import PluginSelect from '../plugin/select';

import Module from './module';

export default class Script extends Module {
  constructor(_, graph) {
    super(_, graph);
  }

  /**
   * 递归编译脚 es 代码
   */
  async resolve() {
    if (this.$resolved) return;
    this.$resolved = true;
    const depens = await new Promise(compile.bind(this));
    for (let depen of depens) {
      await depen.resolve();
    }
  }
}

function compile(onSuccess, onError) {
  // 1. 项目根目录, 指 entry 所在的目录 
  // 2. 项目根目录外的模块，不需要处理 select 语句及使用 babel.config.js 配制
  // 3. 如果不需要 minify, 按原目录结构输出到目标目录
  //    否则，缓存 ast
  // 4. Scanner 是一个 babel plugin，用于记录和重构依赖关系

  const PROJ_DIR = path.dirname(program.entry);

  const DepensScanner = PluginDepensScanner(path.dirname(this.$source), this.$graph);

  const options = {
    plugins: [PluginEnv, PluginGlobal, DepensScanner],
    ast: program.minify,
    code: !program.minify
  };

  if (/^\./.test(path.relative(PROJ_DIR, this.$source))) {
    options.configFile = `${__dirname}/empty.babel.config.js`;
  } else {
    options.plugins.push(PluginSelect);
  }

  babel.transformFile(this.$source, options, async (error, result)=> {
    if (error) return onError(error);
    
    try {
      if (program.minify) {
        this.ast = result.ast;
      } else {
        this.source = this.$source;
        this.content = result.code;
        await this.export();
      }  
      onSuccess(DepensScanner.dependencies());
    } catch (error) {
      onError(error);
    }
  });
}

function PluginDepensScanner(__dirname, __graph) {
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

    const script = Script.create(source, __graph);
    depens.push(script);

    if (program.minify) {
      argument.value = script.$id;
      node.callee.name = '__WEAPPER_REQUIRE__';
    }
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