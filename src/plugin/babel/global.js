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

/**
 * 将 new Function("return this;") 替换为 function(){return this;}
 * 因为小程序中，通过第一种方法，无法获得 globalObject
 */

export default function () {
  return {};
}