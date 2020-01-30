"use strict";
exports.__esModule = true;
var https = require("https");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["PAGE"] = "page";
    ErrorCode["LANG"] = "lang";
    ErrorCode["PARAM"] = "param";
    ErrorCode["OK"] = "none";
})(ErrorCode || (ErrorCode = {}));
var WikiApi = (function () {
    function WikiApi() {
        this.distilledTextLabel = 'distilledtext';
        this.pageNotFound = 'missingtitle';
        this.errorMap = {
            "param": "Missing mandatory params",
            "lang": "Invalid Language",
            "page": "Page not foud",
            "none": "Success"
        };
        this.errorPage = 'page';
        this.errorLanguage = 'lang';
        this.errorParam = 'param';
        this.noError = 'none';
        this.setUrlProperties();
        this.escapeGetParams();
        this.getConvertedWikiData(this.language, this.pageName);
    }
    WikiApi.prototype.getConvertedWikiData = function (language, pageName) {
        var _this = this;
        if ((language === '' || language === undefined) || (pageName === '' || pageName === undefined)) {
            this.returnResponse(this.errorParam);
        }
        else {
            this.setUrlPath(language, pageName);
            https.get(this.wikipediaUrl, function (res) {
                var wikiResponseData = '';
                res.on('data', function (chunk) {
                    wikiResponseData += chunk;
                });
                res.on('end', function () {
                    var wikiData = JSON.parse(wikiResponseData);
                    if (wikiData.error !== undefined && wikiData.error.code === _this.pageNotFound) {
                        _this.returnResponse(_this.errorPage);
                    }
                    else {
                        _this.reformatWikiJson(wikiData);
                        _this.convertWikiTextToDistilledJson();
                        _this.formatResponseJson();
                        _this.returnResponse(_this.noError, _this.formatedData);
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
        this.wikipediaUrl = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + page + "&prop=wikitext&format=json";
    };
    WikiApi.prototype.escapeGetParams = function () {
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
            /(<ref.*?\/>)/g,
            /([\[\]])/g,
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
            jsonParagraphs['paragraph_' + paragraphNumber] = element;
            paragraphNumber++;
        });
        return jsonParagraphs;
    };
    WikiApi.prototype.reformatWikiJson = function (httpData) {
        this.parsedHttpData = {
            'title': (httpData.parse.title !== undefined) ? httpData.parse.title : undefined,
            'pageid': (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
            'wikitext': (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
        };
    };
    WikiApi.prototype.convertWikiTextToDistilledJson = function () {
        this.distilledJson = this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(this.parsedHttpData.wikitext)));
    };
    WikiApi.prototype.formatResponseJson = function () {
        this.formatedData = {
            'title': this.parsedHttpData.title,
            'pageid': this.parsedHttpData.pageid,
            'wikitext': this.parsedHttpData.wikitext,
            'distilled': this.distilledJson
        };
    };
    WikiApi.prototype.returnResponse = function (errorCode, response) {
        if (response === void 0) { response = null; }
        if (errorCode === ErrorCode.OK) {
            console.log(JSON.stringify((response)));
        }
        else {
            var data = {
                error: this.errorMap[errorCode]
            };
            console.log(JSON.stringify((data)));
        }
    };
    return WikiApi;
}());
var wiki = new WikiApi();
//# sourceMappingURL=handler.js.map