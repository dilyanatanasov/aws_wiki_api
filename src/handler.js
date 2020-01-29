"use strict";
exports.__esModule = true;
var https = require("https");
var WikiApi = (function () {
    function WikiApi() {
        this.distilledTextLabel = 'distilledtext';
        this.pageNotFound = 'missingtitle';
        this.httpResponseData = '';
        this.errorPage = 'page';
        this.errorLanguage = 'lang';
        this.errorParam = 'param';
        this.noError = 'none';
        this.setUrlProperties();
        this.escapeParams();
        this.getWikiData(this.language, this.pageName);
    }
    WikiApi.prototype.getWikiData = function (language, pageName) {
        var _this = this;
        if ((language === '' || language === undefined) || (pageName === '' || pageName === undefined)) {
            this.returnResponse(this.errorParam);
        }
        else {
            this.setUrlPath(language, pageName);
            https.get(this.url, function (res) {
                res.on('data', function (chunk) {
                    _this.httpResponseData += chunk;
                });
                res.on('end', function () {
                    var parsedHttpData = JSON.parse(_this.httpResponseData);
                    if (parsedHttpData.error !== undefined && parsedHttpData.error.code === _this.pageNotFound) {
                        _this.returnResponse(_this.errorPage);
                    }
                    else {
                        var wikitext = parsedHttpData.parse.wikitext['*'];
                        var distilledText = _this.paragraphsToJson(_this.paragraphsToArray(_this.filterMediaTags(wikitext)));
                        parsedHttpData.parse[_this.distilledTextLabel] = distilledText;
                        _this.returnResponse(_this.noError, parsedHttpData);
                    }
                });
            }).on('error', function (e) {
                _this.returnResponse(_this.errorLanguage);
            });
        }
    };
    WikiApi.prototype.setUrlProperties = function () {
        this.language = 'en';
        this.pageName = 'DoceboLMS';
    };
    WikiApi.prototype.setUrlPath = function (language, page) {
        this.url = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + page + "&prop=wikitext&format=json";
    };
    WikiApi.prototype.escapeParams = function () {
        this.language = encodeURI(this.language);
        this.pageName = encodeURI(this.pageName);
    };
    WikiApi.prototype.regex_replace = function (text, pattern) {
        return text.replace(pattern, "");
    };
    WikiApi.prototype.filterMediaTags = function (wikitext) {
        var patterns = [
            /(<ref .*?<\/ref>)/g,
            /(<ref>.*?<\/ref>)/g,
            /([\[\]])/g,
            /(<ref.*?\/>)/g,
            /({{.*?}})/g
        ];
        var distilled = wikitext;
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var element = patterns_1[_i];
            distilled = this.regex_replace(distilled, element);
        }
        return distilled;
    };
    WikiApi.prototype.paragraphsToArray = function (distilled) {
        return distilled.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    };
    WikiApi.prototype.paragraphsToJson = function (distilled) {
        var paragraphNumber = 1;
        var jsonParagraphs = {};
        distilled.forEach(function (element) {
            jsonParagraphs['paragraph_' + paragraphNumber] = { element: element };
            paragraphNumber++;
        });
        return jsonParagraphs;
    };
    WikiApi.prototype.returnResponse = function (errorCode, response) {
        if (response === void 0) { response = null; }
        var errorMap = {
            "param": "Missing mandatory params",
            "lang": "Invalid Language",
            "page": "Page not foud",
            "none": "Success"
        };
        if (errorCode === 'none') {
            console.log(JSON.stringify((response)));
        }
        else {
            var data = {
                error: errorMap[errorCode]
            };
            console.log(JSON.stringify((data)));
        }
    };
    return WikiApi;
}());
var wiki = new WikiApi();
//# sourceMappingURL=handler.js.map