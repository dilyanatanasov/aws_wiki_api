"use strict";
exports.__esModule = true;
var chai_1 = require("chai");
var wikiApi_1 = require("./src/wikiApi");
var wikiApi = new wikiApi_1.WikiApi('en', 'DoceboLMS');
describe('WikiApi', function () {
    it("should return a json", function () {
        chai_1.assert.(wikiApi.getConvertedWikiData(), "Hello");
    });
});
//# sourceMappingURL=testWikiApi.js.map