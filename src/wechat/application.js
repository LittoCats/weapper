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
    await exportConfig.call(this);
    await exportScript.call(this);
    await exportStyle.call(this);
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

async function exportConfig() {

}

async function exportScript() {
  const scripts = Object.values(this.$graph).filter((_)=> _ instanceof Script);
  const dist_root = program.outputDir;
  
  // TODO: 如果支持分包，需要过滤分包内容

  if (program.minify) {
    // 1. 合并所有 script , 扫描 require 方法，替换为 __WEAPPER_REQUIRE__($id)
    // 2. 输出到 $DIST_ROOT/scripts.js
    // 3. 输出 Application Page Component 脚本
    
    const combined = Script.concat(scripts);
    const dist = path.resolve(dist_root, 'scripts.js');
    await fs.mkdirp(path.dirname(dist));
    await fs.writeFile(dist, await combined.generate());

    for (page of this.pages) {
      await page.export();
    }

  } else {
    // 1. 扫描 require 方法，替换为 __WEAPPER_REQUIRE__($relative_to_current_dirname)
    // 2. 输出到 $DIST
    for (let script of scripts) {

    }
  }
  
}

async function exportStyle() {

}
