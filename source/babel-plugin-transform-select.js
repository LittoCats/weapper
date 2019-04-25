/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-25 13:45:33
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

// Just used in source file, not node_modules

import * as t from "babel-types"
import * as utils from './utils'

function travelSelect(path, {opts}) {
	const options = utils.buildOptions;

	if (path.node.callee.name != 'select') return;
	const node = path.node;
	if (node.arguments.length != 1) return;
	const config = node.arguments[0];
	if (!t.isObjectExpression(config)) return;

	const env = options.env;

	const properties = config.properties.filter((node)=> node.key.name == env);
	// production 环境中，如果没有配制 production，抛出错误
	if (properties.length == 0) {
		if (env == 'production') 
			throw new Error(`No config found for env: ${env.red}`);

		console.log(`No config found for env: ${env.yellow}, 
			use config for env: ${'development'.yellow}`);

		const property = config.properties.filter(
			(node)=> node.key.name == 'development'
		).pop();
		if (property) properties.push(property);
	}

	if (properties.length == 0)
		throw new Error(`No config found for env: ${env.red}`);

	const property = properties[0];
	path.replaceWith(property.value);
}

const Visitor = {};

Visitor.CallExpression = function (path, stat) {
	try {
		if (travelSelect(path, stat)) return;
	}catch(error){
		throw path.buildCodeFrameError(error.message);
	}
}

let done = false;
export default function plugin(config) {
	return {
		visitor: Visitor
	};
}