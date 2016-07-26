import path from 'path'
import resolve from 'resolve'
import merge from 'deepmerge'
import _ from 'lodash'
import async from 'async'
import fs from 'graceful-fs'

module.exports = function (grunt) {
    grunt.registerMultiTask('webdriver_stage', 'run wdio test runner', function () {
        const done = this.async()
        const opts = merge(this.options(), this.data)
        const webdriverPath = path.dirname(resolve.sync('webdriverio'))
        const Launcher = require(path.join(webdriverPath, 'lib/launcher'))
        const ConfigParser = require(path.join(webdriverPath, 'lib/utils/ConfigParser'))

        if (typeof opts.configFile !== 'string') {
            grunt.log.error('You need to define "configFile" property with the path to your wdio.conf.js')
            return done(1)
        }

        // 如果指定了stages属性
        if (!_.isUndefined(opts.stages)) {
            // 必须为数组
            if (_.isArray(opts.stages)) {
                // 配置解析器
                let configParser = new ConfigParser()

                // 获取wdio.conf.js
                var filePath = path.resolve(process.cwd(), opts.configFile)
                let configs = require(filePath).config

                // test files
                let specs = configParser.getSpecs(configs.specs, configs.exclude)

                if (specs) {
                    let files = []
                    let hasError = false
                    opts.stages.forEach((item, index) => {
                        let configParser_ = new ConfigParser()
                        let stageSpecs = configParser_.getSpecs(_.isArray(item) ? item : [item], [])

                        stageSpecs.forEach((spec) => {
                            if (!_.includes(specs, spec)) {
                                grunt.log.error(`无效测试文件 ${spec} , 所有stages中指定的测试文件必须在wdio配置文件中声明`)
                                hasError = true
                            }
                            if (!_.isString(spec)) {
                                grunt.log.error(`无效测试文件 ${spec} , 此处必须为文件路径字符串`)
                                hasError = true
                            }
                        })

                        files[index] = stageSpecs
                    })

                    let preFiles = files.reduce((pre, next) => {
                        return pre.concat(next)
                    })

                    files[files.length] = specs.filter((item) => {
                        return !_.includes(preFiles, item)
                    })

                    if (hasError) {
                        return done(false)
                    } else {
                        async.eachOfLimit(files, 1, (item, key, callback) => {
                            key += 1
                            // 创建新的配置文件
                            let newFilename = opts.configFile + '.' + new Date().getTime() + '.js'
                            let newFilePath = filePath.substring(0, filePath.lastIndexOf('/')) + newFilename
                            let newConfigs = _.clone(configs)
                            newConfigs.specs = item
                            let newFileContent = 'exports.config=' + JSON.stringify(newConfigs)
                            fs.writeFileSync(newFilePath, newFileContent)

                            let wdio = new Launcher(newFilename, opts)

                            grunt.log.debug(`开始执行第 ${key} 阶段测试`)
                            wdio.run().then(code => {
                                grunt.log.debug(`第 ${key} 阶段测试退出, 任务状态码: ${code}`)
                                callback()
                            }, e => {
                                grunt.log.error(`第 ${key} 阶段测试失败`)
                                callback()
                            })
                        }, (err) => {
                            if (err) {
                                return done(false)
                            } else {
                                return done(true)
                            }
                        })
                    }
                }
            } else {
                grunt.log.error('property stages type must be Array.')
                return done(false)
            }
        } else {
            let wdio = new Launcher(opts.configFile, opts)

            grunt.log.debug(`spawn wdio with these attributes:\n${JSON.stringify(opts, null, 2)}`)
            return wdio.run().then(code => {
                grunt.log.debug(`wdio testrunner finished with exit code ${code}`)
                return done(code === 0)
            }, e => {
                grunt.log.error(`Something went wrong: ${e}`)
                return done(false)
            })
        }
    })
}
