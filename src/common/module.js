/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-14 00:05:00
 * 
 * Copyright 2019-05-14 程巍巍
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

import fs from 'fs-extra';
import crypto from 'crypto';

import depensGraph from '../depens-graph';

let uid = 0;


type Application = {
  resolveDistPath: (absoluteSourcePath: string) => string
};

let __MODULE_INITIAL__ = false;

export default class Module {

  $id: number = uid++;
  $source: string;

  /**
   * 
   */
  constructor(source: string, application: Application) {

    if (source && !__MODULE_INITIAL__) {
      throw new Error(`Create instance with new operator is unsafe, please use ${this.constructor.name.yellow}.${'create'.green}(absoluteSourcePath, application)`);
    }

    this.$id = uid++;
    this.$source = source;
    this.$application = application;

    if (depensGraph.has(source)) throw new Error(
      `Recreate module ${this.constructor.name} with source: ${source}\n`.red
      + `  This maybe an internal parser error, please report to `
      + `littocats@gmail.com`.green
    );
  }

  import() {
    throw new Error(`Abstract method import must be implemented by class `+
      this.constructor.name + ` .`);
  }

  export() {
    throw new Error(`Abstract method export must be implemented by class `+
      this.constructor.name + ` .`);
  }
}

Module.create = function (absoluteSourcePath: string, application: Application) {
  if (depensGraph.has(absoluteSourcePath)) return depensGraph.get(absoluteSourcePath);
  
  __MODULE_INITIAL__ = true;
  module = new (this)(absoluteSourcePath, application);
  __MODULE_INITIAL__ = false;
  
  depensGraph.add(module);
  
  return module;
}

Module.ensureExtension = function(_, ext) {
  return String(_).replace(/(\.[a-z]+$)*$/i, ext);
}

Module.ensureSource = function(source, ...types) {
  for (let ext of types) {
    let _ = Module.ensureExtension(source, ext.replace(/^\.*/, '.'));
    if (!fs.existsSync(_)) continue;
    return _;
  }
  return null;
}