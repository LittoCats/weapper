"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copy = copy;
exports.dist = dist;
exports.write = write;
exports.ee = void 0;

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _events = _interopRequireDefault(require("events"));

/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-25 00:33:09
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
const ee = new _events.default();
exports.ee = ee;

async function copy(file, to) {
  await _fsExtra.default.ensureDir(_path.default.dirname(to));
  await _fsExtra.default.copy(file, to);
}

function dist(file, options) {
  return _path.default.resolve(options.distdir, _path.default.relative(options.srcdir, file));
}

async function write(file, content) {
  await _fsExtra.default.ensureDir(_path.default.dirname(file));
  await _fsExtra.default.writeFile(file, content);
}