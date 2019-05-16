/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-13 17:17:41
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
import program from 'commander';

import Module from '../common/module';

import Script from '../common/script';
import Style from '../common/style';
import Template from '../common/template';

export default class Page extends Module {

  pages: Page = [];

  async import() {
    await loadConfig.call(this);
    await loadScript.call(this);
    await loadStyle.call(this);
    await loadTemplate.call(this);
  }

  async export() {
    await exportConfig.call(this);
    await exportScript.call(this);
    await exportStyle.call(this);
    await exportTemplate.call(this);
  }

  // 相对 SRC_ROOT 的相对路径，例如 /pages/home/index
  path(): string {
    const SRC_ROOT = path.dirname(program.entry);
    return path.relative(SRC_ROOT, this.$source)
      .replace(/^\/*/, '/')
      .replace(/\.[a-z]+$/i, '');
  }
}

async function loadConfig() {
  const content = await fs.readFile(this.$source, 'utf-8');
  const config = (/\.yaml$/i.test(this.$source) ? YAML : JSON).parse(content);

  Object.assign(this, config);

  // TODO: resove custom commponent
}

async function loadScript() {
  const _ = Module.ensureExtension(this.$source, '.js');
  this.script = Script.create(_, this.$application);
  await this.script.import();
}

async function loadStyle() {
  const source = Module.ensureSource(this.$source, '.wxss', '.css', '.scss', '.sass');
  if (!source) throw new Error(`No style found for page: ${this.$source}`);

  this.style = Style.create(source, this.$application);
  // await this.style.import();
}

async function loadTemplate() {
  const source = Module.ensureSource(this.$source, '.wxml', '.xml');
  this.template = Template.create(source, this.$application);
  // await this.template.import();
}

async function exportConfig() {

}
async function exportScript() {
  await this.script.export();
}
async function exportStyle() {

}
async function exportTemplate() {

}