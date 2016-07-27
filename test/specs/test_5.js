var assert = require('assert')

describe('grunt-webdriverjs test', function () {

    it('checks if title is WebdriverIO - Test Runner Configuration File', function () {
        browser.url('/guide/testrunner/configurationfile.html')
        assert(browser.getTitle(), 'WebdriverIO - Test Runner Configuration File')
        browser.end()
    })
})
