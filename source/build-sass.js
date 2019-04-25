/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-25 16:04:15
 * 
 * Copyright 2019-04-25 程巍巍
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
import sass from 'sass';
import * as utils from './utils';

function build(
	resolve, reject,
	file
) {
	const options = utils.buildOptions;
	const dependencies = [];
	sass.render({
		file: file,
		importer: (url)=> {
			dependencies.push(url);
			return {contents: `/*@import "${url}";*/`}
		}
	}, (error, result)=> {
		if (error) return reject(error);
		const css = result.css.toString()
		.replace(/\/\*@import .+\*\//g, ()=> {
			const dependency = dependencies.shift();
			if (!dependency) return '';
			return `@import "${dependency.replace(/\.s(a|c)ss$/, '.wxss')}";`
		});
		
		const distfile = utils.dist(file, options).replace(/\.s(a|c)ss$/, '.wxss');
		utils.write(distfile, css)
		.then(resolve, reject);
	});
	resolve();
}

export default async function (file) {
	await new Promise((resolve, reject)=> build(
		resolve, reject,
		file
	));
}