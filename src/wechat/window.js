/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-16 09:41:24
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

import Color from 'color';
import Module from '../common/module';

export default class Window extends Module {
  // #000000 导航栏背景颜色，如 #000000 
  navigationBarBackgroundColor:  Color = new Color('white');
  // white 导航栏标题颜色，仅支持 black / white 
  navigationBarTextStyle: 'black' | 'white' = 'black';
  //  导航栏标题文字内容 
  navigationBarTitleText:  string = "";
  // default 导航栏样式，仅支持以下值：default 默认样式 custom 自定义导航栏，
  // 只保留右上角胶囊按钮。参见注2。  微信客户端 6.6.0
  navigationStyle: 'default' | 'custom' = 'default';
  // #ffffff 窗口的背景色  
  backgroundColor: Color = new Color('white');
  // dark  下拉 loading 的样式，仅支持 dark / light 
  backgroundTextStyle: 'dark' | 'light' = 'dark';
  // #ffffff 顶部窗口的背景色，仅 iOS 支持 微信客户端 6.5.16
  backgroundColorTop:  Color = new Color('white');
  // #ffffff 底部窗口的背景色，仅 iOS 支持 微信客户端 6.5.16
  backgroundColorBottom: Color = new Color('white');
  // false 是否开启全局的下拉刷新。详见 Page.onPullDownRefresh 
  enablePullDownRefresh: boolean = false;
  // 50  页面上拉触底事件触发时距页面底部距离，单位为px。详见 Page.onReachBottom 
  onReachBottomDistance: number = 50;
  // portrait  屏幕旋转设置，支持 auto / portrait / landscape 
  // 详见 响应显示区域变化 2.4.0 (auto) / 2.5.0 (landscape)
  pageOrientation: 'auto' | 'portrait' | 'landscape' = 'portrait';


  async import(config) {
    if (config.navigationBarBackgroundColor !== undefined) {
      this.navigationBarBackgroundColor = new Color(config.navigationBarBackgroundColor);
    }
    if (config.navigationBarTextStyle !== undefined) {
      if (['black', 'white'].includes(config.navigationBarTextStyle)) {
        this.navigationBarTextStyle = config.navigationBarTextStyle;  
      } else {
        console.warn(
          `Invalid navigationBarTextStyle ${config.navigationBarTextStyle} . `+
          `use default ${this.navigationBarTextStyle}`
        );
      }
    }
    if (config.navigationBarTitleText !== undefined) {
      this.navigationBarTitleText = config.navigationBarTitleText;
    }
    if (config.navigationStyle !== undefined) {
      if (['default', 'custom'].includes(config.navigationStyle)) {
        this.navigationStyle = config.navigationStyle;
      } else {
        console.warn(
          `Invalid navigationStyle ${config.navigationStyle} . `+
          `use default ${this.navigationStyle}`
        );
      }
    }
    if (config.backgroundColor !== undefined) {
      this.backgroundColor = new Color(config.backgroundColor);
    }
    if (config.backgroundTextStyle !== undefined) {
      if (['dark', 'light'].includes(config.backgroundTextStyle)) {
        this.backgroundTextStyle = config.backgroundTextStyle;
      } else {
        console.warn(
          `Invalid backgroundTextStyle ${config.backgroundTextStyle} . `+
          `use default ${this.backgroundTextStyle}`
        );
      }
    }
    if (config.backgroundColorTop !== undefined) {
      this.backgroundColorTop = new Color(config.backgroundColorTop);
    }
    if (config.backgroundColorBottom !== undefined) {
      this.backgroundColorBottom = new Color(config.backgroundColorBottom);
    }
    if (config.enablePullDownRefresh !== undefined) {
      this.enablePullDownRefresh = config.enablePullDownRefresh;
    }
    if (config.onReachBottomDistance !== undefined) {
      this.onReachBottomDistance = config.onReachBottomDistance;
    }
    if (config.pageOrientation !== undefined) {
      if (['auto', 'portrait', 'landscape'].includes(config.pageOrientation)) {
        this.pageOrientation = config.pageOrientation;
      } else {
        console.warn(
          `Invalid pageOrientation ${config.pageOrientation} . `+
          `use default ${this.pageOrientation}`
        );
      }
    }
  }

  async export(config) {
    return {
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
    }
  }
}