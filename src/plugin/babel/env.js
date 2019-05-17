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
  return {
    visitor: {
      MemberExpression
    }
  };

  function MemberExpression(path) {
    let node = path.node;
    if (node.property.name != 'NODE_ENV') return;
    
    node = node.object;
    if (!bt.isMemberExpression(node)) return;
    if (node.property.name != 'env') return;
    if (node.object.name != 'process') return;

    path.replaceWith(bt.stringLiteral(babel.getEnv()));
  }
}