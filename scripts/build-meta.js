/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-14 23:40:39
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

import path from 'path';
import fs from 'fs-extra';

/**
 * 递归遍历文件夹
 * 返回文件列表
 */
async function walk(dir) {
  const files = [];
  for (let _ of await fs.readdir(dir)) {
    _ = path.resolve(dir, _);
    const stat = await fs.stat(_);
    if (stat.isFile()) files.push(_);
    else if (stat.isDirectory()) files.push(... await walk(_));
  }
  return files;
}

async function main() {
  const dir = path.resolve(__dirname, '../templates');
  const templates = await fs.readdir(dir);

  const meta = {};

  for (let _ of templates) {
    const data = meta[_] = {};
    const files = await walk(path.resolve(dir, _));
    for (let file of files) {
      const key = path.relative(dir, file).slice(_.length + 1);
      data[key] = await fs.readFile(file, 'utf-8');
    }
  }

  await fs.mkdirp(path.resolve(__dirname, '../build'));
  await fs.writeFile(
    path.resolve(__dirname, '../build/weapper-init-meta.json'),
    JSON.stringify(meta, null, 2)
  );
}

if (module === require.main) main();