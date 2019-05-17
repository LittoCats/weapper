/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-15 14:22:54
 * 
 * Copyright 2019-05-15 程巍巍
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

import * as bt from '@babel/types';

export default function (babel) {
  const env = babel.getEnv();

  return {
    visitor: {
      CallExpression
    }
  };

  function CallExpression(path) {
    if (path.node.callee.name !== 'select') return;
    if (path.node.arguments.length !== 1) return;
    if (!bt.isObjectExpression(path.node.arguments[0])) return;

    // 如果 select 不是 global 标识符
    // 说明在当前作用域有新定义
    // 不再作为环境参数选择标识符
    if (path.scope.globals.select === undefined) return;
    
    const properties = path.node.arguments[0].properties;
    let value;
    if (has(env)) {
      value = select(env);
    } else if (env === 'production') {
      throw path.buildCodeFrameError(`No selectable property found for env: ${env}`);
    } else if (has('development')){
      value = select('development');
    } else {
      throw path.buildCodeFrameError(`No selectable property found for env: ${env}`);
    }

    path.replaceWith(value);

    function has(env) {
      for (var i = properties.length - 1; i >= 0; i--) {
        if (properties[i].key.name === env) return true
      }
      return false;
    }

    function select(env) {
      for (var i = properties.length - 1; i >= 0; i--) {
        if (properties[i].key.name === env) return properties[i].value;
      }
    }
  }
}