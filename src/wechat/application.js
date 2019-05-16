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

import SubPackage from './subpackage';
import Window from './window';
import Tabbar from './tabbar';
import Page from './page';


export default class Application extends Module {

  window: Window = new Window(null, this);
  pages: Set<Page> = new Set();
  tabBar: ?Tarbar;
  subpackages: ?Set<SubPackage>;
  
  script: Script;
  style: Style;

  // 网络超时时间, 单位毫秒
  networkTimeout: number = 3000;

  // 是否开启 debug 模式，默认关闭
  debug: boolean = false;

  // 是否启用插件功能页，默认关闭
  functionalPages: boolean = false;

  // Worker 代码放置的目录
  workers: ?string;

  // 需要在后台使用的能力，如「音乐播放」
  requiredBackgroundModes: ?Array<string>;

  // 使用到的插件
  plugins: ?Object;

  // 分包预下载规则
  preloadRule: ?Object;

  // iPad 小程序是否支持屏幕旋转，默认关闭
  resizable: ?boolean = false;

  // 需要跳转的小程序列表，详见 https://developers.weixin.qq.com/miniprogram/dev/api/wx.navigateToMiniProgram.html
  navigateToMiniProgramAppIdList: ?Array<string>;

  // 全局自定义组件配置
  usingComponents: ?Object;

  // 小程序接口权限相关设置  
  // 微信客户端 7.0.0
  permission: ?Object;

  async import() {
    await importConfig.call(this);
    await importScript.call(this);
    await importStyle.call(this);
  }

  async export() {
    await exportConfig.call(this);
    await exportScript.call(this);
    await exportStyle.call(this);
    await exportPackages.call(this);
  }

  // 源文件在编译结果目录中的绝对路径
  resolveDist(absoluteSourcePath: string) {
    const src = path.dirname(program.entry);
    const dist = program.outputDir;
    const relative = path.relative(src, absoluteSourcePath)
      .replace(/^\.\.\/node_modules/, 'node_modules');

    return path.resolve(dist, relative);
  }

  async write(absolutePath: string, data: string | Buffer) {

  }
}

const ExtMap = Application.ExtMap = {
  yaml: 'json',
  xml: 'xml',
  css: 'wxss',
  scss: 'wxss',
  sass: 'wxss'
};

async function importConfig() {
  const content = await fs.readFile(this.$source, 'utf-8');
  const {
    window,
    pages,
    subpackages,
    tabBar,
    ...config
  } = (/\.yaml$/i.test(this.$source) ? YAML : JSON).parse(content);
  
  Object.assign(this, config);

  await this.window.import(window);

  if (tabBar) {
    this.tabBar = new Tabbar(null, this);
    this.tabBar.import(tabBar);
  }

  for (let _ of pages) {
    _ = path.resolve(path.dirname(this.$source), Module.ensureExtension(_, '.json'));
    const page = Page.create(_, this);
    this.pages.add(page);
    await page.import();
  }

  if (subpackages !== undefined) {
    this.subpackages = new Set();
    for (let _ of subpackages || []) {
      const subpackage = SubPackage.create(_, this);
      this.subpackages.add(subpackage);
      await subpackage.import();
    }  
  }
  
}

async function importScript() {
  const _ = Module.ensureExtension(this.$source, '.js');
  const script = Script.create(_, this);
  this.script = script;
  await script.import();
}

async function importStyle() {
  const source = Module.ensureSource(this.$source, '.wxss', '.css', '.scss', '.sass');
  if (!source) throw new Error(`No style found for app.`);

  const style = Style.create(source, this);
  this.style = style;
  // await style.import();
}

async function exportConfig() {
  const SRC_ROOT = path.dirname(this.$source);

  const exports = {};
  exports.window = await this.window.export();

  // pages 只需要保存相对路径
  exports.pages = [];
  for (let page of this.pages) {
    const pagePath = path.relative(SRC_ROOT, page.$source)
      .replace(/\.[a-z]+$/, '');
    exports.pages.push(pagePath);
  }
  if (this.tabBar) {
    exports.tabBar = await this.tabBar.export();
  }
  
  if (this.subpackages) {
    exports.subpackages = await this.subpackages.export();
  }
  
  if (this.networkTimeout !== undefined) {
    exports.networkTimeout = this.networkTimeout;
  }
  if (this.debug !== undefined) {
    exports.debug = this.debug;
  }
  if (this.functionalPages !== undefined) {
    exports.functionalPages = this.functionalPages;
  }
  if (this.workers !== undefined) {
    exports.workers = this.workers;
  }
  if (this.requiredBackgroundModes !== undefined) {
    exports.requiredBackgroundModes = this.requiredBackgroundModes;
  }
  if (this.plugins !== undefined) {
    exports.plugins = this.plugins;
  }
  if (this.preloadRule !== undefined) {
    exports.preloadRule = this.preloadRule;
  }
  if (this.resizable !== undefined) {
    exports.resizable = this.resizable;
  }
  if (this.navigateToMiniProgramAppIdList !== undefined) {
    exports.navigateToMiniProgramAppIdList = this.navigateToMiniProgramAppIdList;
  }
  if (this.usingComponents !== undefined) {
    exports.usingComponents = this.usingComponents;
  }
  if (this.permission !== undefined) {
    exports.permission = this.permission;
  }

  const DIST_ROOT = program.outputDir;
  const DIST = path.resolve(DIST_ROOT, 'app.json');
  await fs.mkdirp(DIST_ROOT);
  await fs.writeFile(DIST, JSON.stringify(exports, null, program.minify ? 0 : 2));

  for (let page of this.pages) {
    await page.export();
  }
}

async function exportScript() {

  if (program.minify) {
    // 1. 合并所有 script , 扫描 require 方法，替换为 __WEAPPER_REQUIRE__($id)
    // 2. 输出到 $DIST_ROOT/scripts.js
    // 3. 输出 Application Page Component 脚本
    
    // const combined = Script.concat(scripts);
    // const dist = path.resolve(dist_root, 'scripts.js');
    // await fs.mkdirp(path.dirname(dist));
    // await fs.writeFile(dist, await combined.generate());


  } else {
    await this.script.export();

  }
  
}

async function exportStyle() {

}

async function exportPackages() {
  
}