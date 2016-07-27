var assert = require('assert')

describe('grunt-webdriverjs test', function () {

    it('checks if title is WebdriverIO - Developer Guide', function () {
        browser.url('/guide.html')
        assert(browser.getTitle(), 'WebdriverIO - Developer Guide')
        browser.end()
    })
})
