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
import Color from 'color';

import Module from '../common/module';

import Script from '../common/script';
import Style from '../common/style';
import Template from '../common/template';
import Component from './component';

export default class Page extends Module {

  // 导航栏背景颜色
  navigationBarBackgroundColor: Color = new Color('white');  
  // 导航栏标题颜色
  navigationBarTextStyle: 'black' | 'white' = 'black';
  // 导航栏标题文字内容   
  navigationBarTitleText:  string;          
  // 导航栏样式，仅支持以下值：default 默认样式 custom 自定义导航栏，只保留右上角胶囊按钮  微信客户端 7.0.0  
  navigationStyle: 'default' | 'custom' = 'default';
  // 窗口的背景色
  backgroundColor: Color = new Color('white');
  // 下拉 loading 的样式
  backgroundTextStyle: 'dark' | 'light' = 'dark';
  // 顶部窗口的背景色，仅 iOS 支持 微信客户端 6.5.16  
  backgroundColorTop: Color = new Color('white');
  // 底部窗口的背景色，仅 iOS 支持 微信客户端 6.5.16
  backgroundColorBottom: Color = new Color('white');            
  // 是否开启当前页面下拉刷新。详见 Page.onPullDownRefresh   
  enablePullDownRefresh: boolean = false;
  // 页面上拉触底事件触发时距页面底部距离，单位为px。详见 Page.onReachBottom
  onReachBottomDistance: number = 50;
  // 屏幕旋转设置，支持 auto / portrait / landscape
  pageOrientation: 'auto' | 'portrait' | 'landscape' = 'portrait';
  // 设置为 true 则页面整体不能上下滚动。只在页面配置中有效，无法在 app.json 中设置    
  disableScroll: boolean = false;
  // 禁止页面右滑手势返回  微信客户端 7.0.0  
  disableSwipeBack:  boolean = false;               
  // 否 页面自定义组件配置 1.6.3
  usingComponents: Object<string, Component>;

  async import() {
    await loadConfig.call(this);
    await loadScript.call(this);
    await loadStyle.call(this);
    await loadTemplate.call(this);
  }

  async export() {
    await exportConfig.call(this);
    if (!program.minify) await exportScript.call(this);
    await exportStyle.call(this);
    await exportTemplate.call(this);
  }

  // 所有依赖的脚本，递规 usingComponents pages
  get scripts() {
    const scripts = new Set();
    
    for (let [_, component] of Object.entries(this.usingComponents || {})) {
      for (let subscript of component.scripts) {
        scripts.add(subscript);
      }
    }

    function walk(script) {
      scripts.add(script);
      for (let subscript of script.dependencies || []) {
        walk(subscript);
      }
    }
    walk(this.script);
    return scripts;
  }
}

async function loadConfig() {
  const content = await fs.readFile(this.$source, 'utf-8');
  const {
    usingComponents,
    ...config
  } = (/\.yaml$/i.test(this.$source) ? YAML : JSON).parse(content);

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
  await this.style.import();
}

async function loadTemplate() {
  const source = Module.ensureSource(this.$source, '.wxml', '.xml');
  this.template = Template.create(source, this.$application);
  await this.template.import();
}

async function exportConfig() {
  const exports = {
    navigationBarBackgroundColor: this.navigationBarBackgroundColor.hex(),
    navigationBarTextStyle: this.navigationBarTextStyle,
    navigationBarTitleText: this.navigationBarTitleText,
    navigationStyle: this.navigationStyle,
    backgroundColor: this.backgroundColor.hex(),
    backgroundTextStyle: this.backgroundTextStyle,
    backgroundColorTop: this.backgroundColorTop.hex(),
    backgroundColorBottom: this.backgroundColorBottom.hex(),
    enablePullDownRefresh: this.enablePullDownRefresh,
    onReachBottomDistance: this.onReachBottomDistance,
    pageOrientation: this.pageOrientation,
    disableScroll: this.disableScroll,
    disableSwipeBack: this.disableSwipeBack,
  };

  // TODO: export components

  // output
  const dist = this.$application.resolveDistPath(this.$source);
  await fs.mkdirp(path.dirname(dist));
  await fs.writeFile(dist, JSON.stringify(exports, null, program.minify ? 0 : 2));
}
async function exportScript() {
  await this.script.export();
}
async function exportStyle() {
  await this.style.export();
}
async function exportTemplate() {
  await this.template.export();
}
