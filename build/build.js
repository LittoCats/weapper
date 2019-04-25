"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _klaw = _interopRequireDefault(require("klaw"));

require("colors");

var utils = _interopRequireWildcard(require("./utils"));

var _buildJs = _interopRequireDefault(require("./build-js"));

var _buildSass = _interopRequireDefault(require("./build-sass"));

/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-24 22:17:42
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
async function validOptions(options) {
  // 1. srcdir must exists and must be a directory
  const srcdir = options.srcdir;

  if (await _fsExtra.default.exists(srcdir)) {
    const stat = await _fsExtra.default.stat(srcdir);
    if (!stat.isDirectory()) throw new Error(`srcdir must be directory: ${srcdir}`);
  } else {
    throw new Error(`srcdir not exists: ${srcdir}`);
  } // 2. distdir must be a directory or not exists


  const distdir = options.distdir;

  if (await _fsExtra.default.exists(distdir)) {
    const stat = await _fsExtra.default.stat(distdir);
    if (!stat.isDirectory()) throw new Error(`srcdir must be directory: ${distdir}`);
  }

  return options;
}

async function build(file, options) {
  const extname = _path.default.extname(file);

  if (/\.js$/.test(extname)) return await (0, _buildJs.default)(file, options);
  if (/\.s(a|c)ss$/.test(extname)) return await (0, _buildSass.default)(file, options);
  return await utils.copy(file, utils.dist(file, options));
}

async function walk(options) {
  let task = Promise.resolve();
  await new Promise((resolve, reject) => (0, _klaw.default)(options.srcdir).on('end', () => resolve(task)).on('error', error => reject(error)).on('data', item => {
    if (item.stats.isFile()) task = task.then(() => build(item.path, options));
  }));
}

async function watch(options) {
  const watcher = _chokidar.default.watch(options.srcdir, {
    ignored: /^\./,
    persistent: true
  });

  let isReady = false;

  function srcfile(file) {
    return _path.default.relative(options.srcdir, file);
  }

  function distfile(file) {
    return _path.default.resolve(options.distdir, srcfile(file));
  }

  watcher.on('add', async path => {
    if (!isReady) return;
    console.log("Add: ", srcfile(path));

    try {
      build(path, options);
    } catch (error) {
      console.error(error);
    }
  }).on('change', async path => {
    console.log("Modify: ", srcfile(path));

    try {
      build(path, options);
    } catch (error) {
      console.error(error);
    }
  }).on('unlink', async path => {
    try {
      const dist = distfile(path);
      if (await _fsExtra.default.exists(dist)) await _fsExtra.default.unlink(dist);
    } catch (error) {
      console.error(error);
    }
  }).on('unlinkDir', async path => {
    try {
      const dist = distfile(path);
      if (await _fsExtra.default.exists(dist)) await _fsExtra.default.rmdir(dist);
    } catch (error) {
      console.error(error);
    }
  }).on('error', error => log(`Watcher error: ${error}`)).on('ready', () => {
    isReady = true;
    console.log(`Watching ...`);
  });
}

async function _default(options) {
  options = await validOptions(options);
  utils.buildOptions = options;
  await walk(options);
  if (options.watch) await watch(options);
}