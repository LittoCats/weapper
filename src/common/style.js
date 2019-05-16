/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-13 23:50:55
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
import crypto from 'crypto';
import sass from 'sass';

import Module from './module';

export default class Style extends Module {
  async resolve() {
    if (this.$resolved) return;

    if (/\.(wxss|css)$/i.test(this.$source)) {
      // 直接拷贝
      this.source = this.$source;
      this.content = await fs.readFile(this.$source, 'utf-8');

      this.export();
    } else if (/\.s(c|a)ss$/i.test(this.$source)) {
      const __dirname = path.dirname(this.$source);
      // 提取所有依赖
      const content = await fs.readFile(this.$source, 'utf-8')
      const depens = {};
      const data = content
        .replace(/(?<=^|\n)@import\s+"(.+)"/g, (match, url, location)=> {

          const source = path.resolve(__dirname, url);
          if (!fs.existsSync(source)) 
            throw new Error(`file not found: ${url}\n${match}\n`);

          const style = Style.create(source, this.$graph);
          this.$depens.push(style);

          const hash = crypto.createHash('md5').update(url).digest('hex');
          depens[hash] = url;
          return `#__IMPORT__${hash}{color: red;}`;
        });

      let css = await new Promise(compileSass.bind(this, data));

      css = css.replace(/(?<=^|\n)#__IMPORT__(\S+)\s*\{[^\}]+\}/g, (_, hash)=> {
        return `@import "${depens[hash].replace(/(\.[a-z]+$)*$/i, '')}";`;
      });

      // 处理 url 定义的资源
      const regexp = /(?<=url\s*\().+(?=\))/g;
      while (regexp.exec(css)) {
        const url = RegExp.lastMatch;
        if (/^http/i.test(url)) continue;

        const source = path.resolve(__dirname, url);
        if (!(await fs.exists(source))) {
          throw new Error(`source not found: ${url}`)
        }
        const imageData = await fs.readFile(source);
        if (imageData.length > 2048) console.warn(`样式表中引入了大于 2K 图片：${url}\n=> ${this.$source}\n`.yellow);
        const dataUri = `data:image/${url.replace(/^.+\.(?=[a-z]+$)/, '')};base64,${imageData.toString('base64')}`
        
        css = css.slice(0, regexp.lastIndex - url.length) + dataUri + css.slice(regexp.lastIndex);
        regexp.lastIndex += dataUri.length - url.length;
      }
      
      this.source = this.$source;
      this.content = css;

      await this.export();

      for (let depen of this.$depens) {
        await depen.resolve();
      }
    }
  }
}

async function compileSass(data, onSuccess, onError) {
  sass.render({
    data,
    sourceComments: true
  }, (error, result)=> {
    if (error) return onError(error);

    onSuccess(result.css.toString());
  });

}