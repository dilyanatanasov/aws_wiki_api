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
    function WikiApi(language, pageName) {
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
        this.setUrlProperties(language, pageName);
        this.escapeGetParams();
    }
    WikiApi.prototype.getConvertedWikiData = function () {
        var _this = this;
        if ((this.language === '' || this.language === undefined) || (this.pageName === '' || this.pageName === undefined)) {
            return this.returnResponse(this.errorParam);
        }
        else {
            this.setUrlPath();
            https.get(this.wikipediaUrl, function (res) {
                var wikiResponseData = '';
                res.on('data', function (chunk) {
                    wikiResponseData += chunk;
                });
                res.on('end', function () {
                    var wikiData = JSON.parse(wikiResponseData);
                    if (wikiData.error !== undefined && wikiData.error.code === _this.pageNotFound) {
                        return _this.returnResponse(_this.errorPage);
                    }
                    else {
                        var reformatedWikiJson = _this.reformatWikiJson(wikiData);
                        var distilledObject = _this.convertWikiTextToDistilledJson(reformatedWikiJson);
                        var formatedResponseJson = _this.formatResponseJson(reformatedWikiJson, distilledObject);
                        return _this.returnResponse(_this.noError, formatedResponseJson);
                    }
                });
            }).on('error', function (e) {
                return _this.returnResponse(_this.errorLanguage);
            });
        }
    };
    WikiApi.prototype.setUrlProperties = function (language, pageName) {
        this.language = language;
        this.pageName = pageName;
    };
    WikiApi.prototype.setUrlPath = function () {
        this.wikipediaUrl = "https://" + this.language + ".wikipedia.org/w/api.php?action=parse&page=" + this.pageName + "&prop=wikitext&format=json";
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
    WikiApi.prototype.paragraphsToArray = function (distilledText) {
        return distilledText.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
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
        return {
            title: (httpData.parse.title !== undefined) ? httpData.parse.title : undefined,
            pageid: (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
            wikitext: (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
        };
    };
    WikiApi.prototype.convertWikiTextToDistilledJson = function (reformatedWikiJson) {
        return this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(reformatedWikiJson.wikitext)));
    };
    WikiApi.prototype.formatResponseJson = function (reformatedWikiJson, distilledtext) {
        return {
            'title': reformatedWikiJson.title,
            'pageid': reformatedWikiJson.pageid,
            'wikitext': reformatedWikiJson.wikitext,
            'distilledtext': distilledtext
        };
    };
    WikiApi.prototype.returnResponse = function (errorCode, response) {
        if (response === void 0) { response = null; }
        if (errorCode === ErrorCode.OK) {
            return JSON.stringify((response));
        }
        else {
            response = {
                error: this.errorMap[errorCode]
            };
            return JSON.stringify((response));
        }
    };
    return WikiApi;
}());
exports.WikiApi = WikiApi;
//# sourceMappingURL=wikiApi.js.map