var assert = require('assert')

describe('grunt-webdriverjs test', function () {

    it('checks if title is WebdriverIO - Contributing', function () {
        browser.url('/contribute.html')
        assert(browser.getTitle(), 'WebdriverIO - Contributing')
        browser.end()
    })
})
