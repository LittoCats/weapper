/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-13 16:06:36
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

import program from 'commander';
import fs from 'fs-extra';
import path from 'path';


program
  .version(process.env.WEAPPER_VERSION, '-v, --version')
  .option('-e, --entry <app>', 'Mimi program config file, like app.json')
  .option('-d, --output-dir [dir]', 'Output dir for compiled file, will append ${env}.', './build') 
  .option('-c, --config-file [file]', 'The config file path for weapper.', './weapper.config.js')
  .option('-m, --minify', 'Minify compiled file and optimize them. Default true for production, false for development')
  .option('-w, --watch', 'Watch source file changes and recompile, if true. Default false')
  .parse(process.argv);

const __CWD__ = process.cwd();
const __ENV__ = process.env.NODE_ENV || process.env.ENV || 'development';

if (process.argv.length < 3) program.help() || process.exit();

export const entry = parseEntry();
export const outputDir = path.resolve(__CWD__, program.outputDir);
export const config = loadConfig(); 
export const minify = program.minify || __ENV__ == 'production' || false;
export const watch = !!program.watch;
export const env = __ENV__;

export default {
  entry, outputDir, config, minify, watch, env
};


function parseEntry() {
  if (program.entry == undefined) {
    console.log(`Option entry is required.\n`.red);
    program.help();
  }
  const entry = path.resolve(__CWD__, program.entry);
  if (fs.existsSync(entry)) return entry;

  console.log(`Entry file dose not exists: ${entry}`.red);
}

function loadConfig() {
  const configFile = path.resolve(__CWD__, program.configFile);
  if (fs.existsSync(configFile)) return require(configFile);
  return {};
}

