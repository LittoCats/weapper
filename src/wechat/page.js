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

import Module from '../common/module';

import Script from '../common/script';
import Style from '../common/style';
import Template from '../common/template';

export default class Page extends Module {

  async resolve() {
    await loadConfig.call(this);
    await loadScript.call(this);
    await loadStyle.call(this);
    await loadTemplate.call(this);
  }

  async export() {

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
  const script = Script.create(_, this.$graph);
  this.$depens.push(script);

  await script.resolve();
}

async function loadStyle() {
  const source = Module.ensureSource(this.$source, '.wxss', '.css', '.scss', '.sass');
  if (!source) throw new Error(`No style found for page: ${this.$source}`);

  const style = Style.create(source, this.$graph);
  this.$depens.push(style);
  await style.resolve();
}

async function loadTemplate() {
  const source = Module.ensureSource(this.$source, '.wxml', '.xml');
  const template = Template.create(source, this.$graph);
  
  this.$depens.push(template);
  await template.resolve();
}
