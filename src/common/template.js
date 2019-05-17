/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-13 23:51:05
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

import fs from 'fs-extra';
import path from 'path';

import Module from './module';

export default class Template extends Module {
  async import() {
    if (!this.$dirty) return;
    this.$dirty = false;
    this.$sync = true;

    this.content = await fs.readFile(this.$source);
  }

  async export() {
    if (!this.$sync) return;
    this.$sync = false;

    const dist = this.$application.resolveDistPath(this.$source);
    await fs.writeFile(dist, this.content);
  }
}
