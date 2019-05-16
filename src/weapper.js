/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-05-14 13:47:25
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

import 'colors';
import program from 'commander';

program
  .version(process.env.WEAPPER_VERSION, '-v, --version')
  .command('build <entry>', 'Build application source with config file `entry`')
  .command('init [name]', 'Init new project in dir named `name` or in current dir if no name supplied.')
  .parse(process.argv);

