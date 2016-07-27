var assert = require('assert')

describe('grunt-webdriverjs test', function () {

    it('checks if title is WebdriverIO - API Docs', function () {
        browser.url('/api.html')
        assert(browser.getTitle(), 'WebdriverIO - API Docs')
        browser.end()
    })
})
