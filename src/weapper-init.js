/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-14 13:46:09
 * 
 * Copyright 2019-05-14 程巍巍
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
import 'colors';

program
  .usage('[options] [project]'+'\nIf has no name, init project in current dictionary.'.yellow)
  .option('-n, --name [name]', 'Name of the miniprogram')
  .option('-t, --type [type]', 'Type for miniprogram to build, only support wechat now.', 'wechat')
  .parse(process.argv);

!function (name = program.args.shift()) {
  /*
   * 1. 如果设置了 name
   *    1. name 对应的文件夹不存在，创建空文件夹
   *    2. name 对应的文件夹存在
   *        1. 不是文件夹
   *        2. 不是空文件夹
   */
  if (name) {
    const dir = path.resolve(process.cwd(), name);
    if (!fs.existsSync(dir)) fs.mkdirpSync(dir);
    else {
      const stat = fs.statSync(dir);
      if (!stat.isDirectory()) 
        console.log(`Not a directory: ${name}\n`) || program.help();
      if (fs.readdirSync(dir).length > 0)
        console.log(`Not an empty directory: ${name}\n`) || program.help();
    }

    name = dir;

    process.chdir(dir);
  }
  /*
   * 2. 如果没有设置 name
   *    1. 当前文件夹不是空文件夹
   */
  else {
    const dir = process.cwd();
    if (fs.readdirSync(dir).length > 0)
      console.log(`Not an empty directory: .\n`) || program.help();
  }
}()

/*****************************************************************************
 *                                                                           *
 *****************************************************************************/

import meta from './weapper-init-meta.json';

// Just now, only support wechat
async function main() {
  const data = meta[program.type];
  for (let _ in data) {
    const file = path.resolve(process.cwd(), _);
    await fs.mkdirp(path.dirname(file));
    await fs.writeFile(file, data[_]);
  }
}

main();