/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-16 09:55:56
 * 
 * Copyright 2019-05-16 程巍巍
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

import 'colors';
import Color from 'color';
import program from 'commander';

import Module from '../common/module';
import Image from '../common/image';

import DepensGraph from '../depens-graph';

import Page from './page';

export class Tab extends Module {
  // 是 页面路径，必须在 pages 中先定义
  page:  Page;
  // 是 tab 上按钮文字ing;
  text:  string;
  // 否 图片路径，icon 大小限制为40kb，建议尺寸为 81px * 81px，不支持网络图片。
  // 当 postion 为 top 时，不显示 icon。
  icon: Image;
  // 否 选中时的图片路径，icon 大小限制为40kb，建议尺寸为 81px * 81px，
  // 不支持网络图片。当 postion 为 top 时，不显示 icon。
  selectedIcon: Image;

  async import(config) {
    const SRC_ROOT = path.dirname(program.entry);

    if (!config.pagePath) {
      throw new Error(`Tabbar's item must have pagePath`);
    } else {
      const pathPath = config.pagePath.replace(/^\/+/, '')
        .replace(/(\.[a-z]+$)*$/, '.json');
      const source = path.resolve(SRC_ROOT, pagePath);
      if (!(await fs.exists(source))) {
        throw new Error(`Page not found: ${config.pagePath.yellow}`.red);
      } else {
        const page = Page.create(source);
        await page.resolve();
        this.page = page;
      }
    }

    if (config.text) {
      this.text = config.text
    } else {
      console.warn(`text is not set for tab page: ${config.pagePath}`);
    }

    if (config.iconPath) {
      const iconPath = path.resolve(SRC_ROOT, config.iconPath);
      this.icon = Image.create(iconPath);
    } else {
      console.warn(`iconPath is not set for tab page: ${config.pagePath}`);
    }

    if (config.selectedIconPath) {
      const selectedIconPath = path.resolve(SRC_ROOT, config.selectedIconPath);
      this.selectedIcon = Image.create(selectedIconPath);
    } else {
      console.warn(`selectedIconPath is not set for tab page: ${config.pagePath}`);
    }
  }

  export(): Object {
    
  }
}

export default class Tabbar extends Module {

  static Tab: typeof Tab = Tab;

  // required   tab 上的文字默认颜色，仅支持十六进制颜色  
  color: Color = new Color('gray');

  // required   tab 上的文字选中时的颜色，仅支持十六进制颜色  
  selectedColor: Color = new Color('black');

  // required   tab 的背景色，仅支持十六进制颜色  
  backgroundColor: Color = new Color('white');

  // optional tabbar上边框的颜色， 仅支持 black / white 
  borderStyle: 'black' | 'white' = 'white';

  // optional bottom  tabBar的位置，仅支持 bottom / top  
  position: 'bottom' | 'top' = 'bottom';

  // optional false 自定义 tabBar，见详情
  custom:  boolean = false;

  // required   tab 的列表，详见 list 属性说明，最少2个、最多5个 tab  
  list:  Array<Tab> = [];

  async import(config: Object) {
    if (config.color) {
      this.color = new Color(config.color);
    }
    if (config.selectedColor) {
      this.selectedColor = new Color(config.selectedColor);
    }
      
    if (config.backgroundColor) {
      this.backgroundColor = new Color(config.backgroundColor);
    }
      
    if (['black', 'white'].includes(config.borderStyle)) {
      this.borderStyle = config.borderStyle;
    } else {
      console.warn(`Invalid tabbar config, borderStyle must be ` +
        `${'black'.green} or ${'white'.green}, ` +
        `received ${config.borderStyle.red}`.yellow)
    }
    if (['bottom', 'top'].includes(config.position)) {
      this.position = config.position;
    } else {
      console.warn(`Invalid tabbar config, position must be ` +
        `${'bottom'.green} or ${'top'.green}, ` +
        `received ${config.borderStyle.red}`.yellow)
    }

    if (config.custom) {
      console.error(`Will supported soon`.red);
    }

    if (!config.list || config.list.length == 0) {
      throw new Error(`tabbar.list config not found.`);
    }

    this.list = [];
    for (let item of config.list) {
      const tab = new Tab(null);
      this.list.push(tab);
      await tab.import(item);
    }
  }

  async export() {
    const list = [];
    for (let item of this.lists || []) {
      list.push(await item.export());
    }

    return {
      color: this.color.hex(),
      selectedColor: this.selectedColor.hex(),
      backgroundColor: this.backgroundColor.hex(),
      borderStyle: this.borderStyle,
      position: this.position,
      custom: this.custom,
      list: list
    };
  }
}
