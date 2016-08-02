'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _gracefulFs = require('graceful-fs');

var _gracefulFs2 = _interopRequireDefault(_gracefulFs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tmp = './tmp/';

module.exports = function (grunt) {
    grunt.registerMultiTask('webdriver_stage', 'run wdio test runner', function () {
        if (!_gracefulFs2.default.existsSync(tmp)) {
            _gracefulFs2.default.mkdirSync(tmp);
        }

        var done = this.async();
        var opts = (0, _deepmerge2.default)(this.options(), this.data);
        var webdriverPath = _path2.default.dirname(_resolve2.default.sync('webdriverio'));
        var Launcher = require(_path2.default.join(webdriverPath, 'lib/launcher'));
        var ConfigParser = require(_path2.default.join(webdriverPath, 'lib/utils/ConfigParser'));

        if (typeof opts.configFile !== 'string') {
            grunt.log.error('You need to define "configFile" property with the path to your wdio.conf.js');
            return done(1);
        }

        // 如果指定了stages属性
        if (!_lodash2.default.isUndefined(opts.stages)) {
            // 必须为数组
            if (_lodash2.default.isArray(opts.stages)) {
                var filePath;

                var _ret = function () {
                    // 配置解析器
                    var configParser = new ConfigParser();

                    // 获取wdio.conf.js
                    filePath = _path2.default.resolve(process.cwd(), opts.configFile);

                    var configs = require(filePath).config;

                    // test files
                    var specs = configParser.getSpecs(configs.specs, configs.exclude);

                    if (specs) {
                        var _ret2 = function () {
                            var files = [];
                            var hasError = false;
                            opts.stages.forEach(function (item, index) {
                                var configParser_ = new ConfigParser();
                                var stageSpecs = configParser_.getSpecs(_lodash2.default.isArray(item) ? item : [item], []);

                                stageSpecs.forEach(function (spec) {
                                    if (!_lodash2.default.includes(specs, spec)) {
                                        grunt.log.error('无效测试文件 ' + spec + ' , 所有stages中指定的测试文件必须在wdio配置文件中声明');
                                        hasError = true;
                                    }
                                    if (!_lodash2.default.isString(spec)) {
                                        grunt.log.error('无效测试文件 ' + spec + ' , 此处必须为文件路径字符串');
                                        hasError = true;
                                    }
                                });

                                files[index] = stageSpecs;
                            });

                            var preFiles = files.reduce(function (pre, next) {
                                return pre.concat(next);
                            });

                            files[files.length] = specs.filter(function (item) {
                                return !_lodash2.default.includes(preFiles, item);
                            });

                            if (hasError) {
                                return {
                                    v: {
                                        v: done(false)
                                    }
                                };
                            } else {
                                _async2.default.eachOfLimit(files, 1, function (item, key, callback) {
                                    key += 1;
                                    // 创建新的配置文件
                                    var newFilename = tmp + 'wdio.config.' + new Date().getTime() + '.js';
                                    var newConfigs = _lodash2.default.clone(configs);
                                    newConfigs.specs = item;
                                    var newFileContent = 'exports.config=' + JSON.stringify(newConfigs);
                                    _gracefulFs2.default.writeFileSync(newFilename, newFileContent);

                                    var wdio = new Launcher(newFilename, opts);

                                    grunt.log.debug('开始执行第 ' + key + ' 阶段测试');
                                    wdio.run().then(function (code) {
                                        grunt.log.debug('第 ' + key + ' 阶段测试退出, 任务状态码: ' + code);
                                        callback();
                                    }, function (e) {
                                        grunt.log.error('第 ' + key + ' 阶段测试失败');
                                        callback();
                                    });
                                }, function (err) {
                                    if (err) {
                                        return done(false);
                                    } else {
                                        return done(true);
                                    }
                                });
                            }
                        }();

                        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                    }
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } else {
                grunt.log.error('property stages type must be Array.');
                return done(false);
            }
        } else {
            var wdio = new Launcher(opts.configFile, opts);

            grunt.log.debug('spawn wdio with these attributes:\n' + JSON.stringify(opts, null, 2));
            return wdio.run().then(function (code) {
                grunt.log.debug('wdio testrunner finished with exit code ' + code);
                return done(code === 0);
            }, function (e) {
                grunt.log.error('Something went wrong: ' + e);
                return done(false);
            });
        }
    });
};
