/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-25 00:41:18
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
import crypto from 'crypto';

import shorthash from 'shorthash';
import * as babel from '@babel/core';
import * as t from "babel-types"

import * as utils from './utils';

function getmid(name, file) {
	const options = utils.buildOptions;
	if (options.env == 'development') return {
		name,
		path: file.replace(/^.+?node_modules\/+/, '')
	};
	const mid = shorthash.unique(file);
	return {name: mid, path: `${mid}.js`};
}

// 缓存已经编译过的依赖，依赖只会被处理一次
const DMap = {};
function buildDependency(mid, file) {
	if (DMap[file]) return;
	DMap[file] = true;

	const options = utils.buildOptions;
	const distFile = path.resolve(
		options.distdir, 'miniprogram_npm', mid.path
	);

	// 如果目标文件存在，不需要重新生成
	if (fs.existsSync(distFile)) return;
	
	const babelConfig = {
		plugins: [
			plugin
		],
		// node_modules 依赖，不再次进行 babel 转码
		// 这就要求 node_modules 依赖，已经对兼容性进行了处理
		configFile: path.resolve(__dirname, 'babel.config.js')
	}
	const result = babel.transformFileSync(file, babelConfig);
	utils.write(distFile, result.code);
}

function walkDependency(origin, node) {
	const options = utils.buildOptions;

	if (/^\./.test(node.value)) {
		// 如果时相对于源码目录中的模块，不做作何处理
		if (origin.indexOf(options.srcdir) == 0) return;
		
		const __dirname = path.dirname(origin);
		// current 是依赖相当前模块目录的相对跳径
		const file = require.resolve(path.resolve(__dirname, node.value));
		const current = path.relative(__dirname, file);
		const mid = getmid(current, file, options);
		node.value = mid.name;
		buildDependency(mid, file, options);
	} else {
		// node_modules 中的模块
		const __dirname = path.resolve(process.cwd(), 'node_modules');
		// current 是依赖模块相对 node_modules 目录的相对路径
		const file = require.resolve(path.resolve(__dirname, node.value));
		const current = path.relative(__dirname, file);
		const mid = getmid(current, file, options);
		node.value = mid.name;
		buildDependency(mid, file, options);
	}
}

function travelProcessEnvNODE_ENV(path, {opts}) {
	const options = utils.buildOptions;

	if (path.node.property.name != 'NODE_ENV') return;
	if (!t.isMemberExpression(path.node.object)) return;
	const object = path.node.object;
	if (!t.isIdentifier(object.property)) return;
	if (!t.isIdentifier(object.object)) return;
	if (object.object.name != 'process') return;
	if (object.property.name != 'env') return;
	
	path.replaceWith(t.stringLiteral(options.env));
	return true;
}

// 处理 依赖
function travelRequire(path, stat) {
	if (path.node.callee.name != 'require') return;
	const name = path.node.arguments[0];
	if (!t.isStringLiteral(name)) 
		throw new Error(`Argument of require must be StringLiteral.`);
	walkDependency(
		path.hub.file.opts.filename,
		name
	);
	return true;
}

// 小程序中 使用 Function("return this")() 无法获取 globalObject
// 需要替换为 (function(){return this;})()
function travelGlobalCheat(path, stat) {
	if (path.node.callee.name != 'Function') return;
	const script = path.node.arguments.slice(-1).pop();
	if (!script) return;
	if (!t.isStringLiteral(script)) return;
	if (!/^\s*return\s+this\s*;*$/.test(script.value)) return;
	path.replaceWithSourceString("(function(){return this})");
}

const Visitor = {};

Visitor.CallExpression = function (path, stat) {
	try {
		if (travelRequire(path, stat)) return;
		if (travelGlobalCheat(path, stat)) return;
	}catch(error){
		throw path.buildCodeFrameError(error.message);
	}
}

Visitor.MemberExpression = function (path, stat) {
	try {
		if (travelProcessEnvNODE_ENV(path, stat)) return;	
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