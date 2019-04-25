/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-24 22:07:28
 * 
 * Copyright 2019-04-24 程巍巍
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
import program from 'commander';

import build from './build';

const info = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);
const cwd = process.cwd();

program
	.version(info.version, '-v, --version')
	.command('build [srcdir]')
	.option('-e, --env [string]', 'ENV, defalut development')
	.option('-d, --distdir [string]', 'Output dir, default process.cwd()/build/$env')
	.option('-w, --watch', 'Watch file modify after build done.')
	.action(async (srcdir = 'src', cmd)=> {
		srcdir = path.resolve(cwd, srcdir);
		const env = cmd.env || 'development';
		const distdir = path.resolve(cwd, cmd.distdir || `build/${env}`);
		const watch = cmd.watch || false;

		try {
			await build({
				srcdir, distdir,
				env, watch
			})	
		}catch(error){
			console.error(error);
		}
		
	})

program.parse(process.argv);