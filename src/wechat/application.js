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

import Page from './page';

export default class Application extends Module {
  constructor(source, graph) {
    super(source, graph);
    this.pages = [];
  }

  async resolve() {
    await loadConfig.call(this);
    await loadScript.call(this);
    await loadStyle.call(this);
  }

  async export() {
   console.log('app export'); 
  }

}

const ExtMap = Application.ExtMap = {
  yaml: 'json',
  xml: 'xml',
  css: 'wxss',
  scss: 'wxss',
  sass: 'wxss'
};

async function loadConfig() {
  const content = await fs.readFile(this.$source, 'utf-8');
  const {
    pages,
    ...config
  } = (/\.yaml$/i.test(this.$source) ? YAML : JSON).parse(content);
  
  Object.assign(this, config);

  for (let _ of pages) {
    _ = path.resolve(path.dirname(this.$source), Module.ensureExtension(_, '.json'));
    const page = new Page(_, this.$graph);
    this.pages.push(page);
    
    await page.resolve();
  }
}

async function loadScript() {

  const _ = Module.ensureExtension(this.$source, '.js');
  const script = Script.create(_, this.$graph);
  this.$depens.push(script);

  await script.resolve();
}

async function loadStyle() {
  const source = Module.ensureSource(this.$source, '.wxss', '.css', '.scss', '.sass');
  if (!source) throw new Error(`No style found for app.`);

  const style = Style.create(source, this.$graph);
  this.$depens.push(style);
  await style.resolve();
}

// 实现 Module 的默认导出功能
Module.prototype.export = async function () {
  const PROJ_ROOT = path.dirname(program.entry);
  
  let DIST_ROOT = program.outputDir;
  let source = path.relative(PROJ_ROOT, this.source);

  const regexp = /^\..*?node_modules\/+/;
  if (regexp.test(source)) {
    DIST_ROOT = path.resolve(DIST_ROOT, 'miniprogram_npm');
    source = source.replace(regexp, '');
  }

  const dist = path.resolve(DIST_ROOT, source).replace(/(?=.)[a-z]+$/i, (ext)=> {
    // 影射文件名后缀
    return ExtMap[ext.toLowerCase()] || ext;
  });

  await fs.mkdirp(path.dirname(dist));
  await fs.writeFile(dist, this.content);
}