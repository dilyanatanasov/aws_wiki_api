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
var language = '';
var pageName = '';
var wikipediaUrl = '';
var distilledTextLabel = 'distilledtext';
var pageNotFound = 'missingtitle';
var errorMap = {
    "param": "Missing mandatory params",
    "lang": "Invalid Language",
    "page": "Page not foud",
    "none": "Success"
};
var errorPage = 'page';
var errorLanguage = 'lang';
var errorParam = 'param';
var noError = 'none';
exports.handler = function (event, context, callback) {
    setUrlProperties(event.language, event.pageName);
    escapeGetParams();
    if ((event.language === '' || event.language === undefined) || (event.pageName === '' || event.pageName === undefined)) {
        returnResponse(errorParam);
    }
    else {
        setUrlPath();
        https.get(wikipediaUrl, function (res) {
            var wikiResponseData = '';
            res.on('data', function (chunk) {
                wikiResponseData += chunk;
            });
            res.on('end', function () {
                var wikiData = JSON.parse(wikiResponseData);
                if (wikiData.error !== undefined && wikiData.error.code === pageNotFound) {
                    callback(returnResponse(errorPage));
                }
                else {
                    var reformatedWikiJson = reformatWikiJson(wikiData);
                    var distilledObject = convertWikiTextToDistilledJson(reformatedWikiJson);
                    var formatedResponseJson = formatResponseJson(reformatedWikiJson, distilledObject);
                    callback(returnResponse(noError, formatedResponseJson));
                }
            });
        }).on('error', function (e) {
            callback(returnResponse(errorLanguage));
        });
    }
};
function setUrlProperties(lang, page) {
    language = lang;
    pageName = page;
}
function setUrlPath() {
    wikipediaUrl = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + pageName + "&prop=wikitext&format=json";
}
function escapeGetParams() {
    language = encodeURI(language);
    pageName = encodeURI(pageName);
}
function regex_replace(text, pattern) {
    return text.replace(pattern, "");
}
function filterMediaTags(wikitext) {
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
        distilled = regex_replace(distilled, element);
    }
    return distilled;
}
function paragraphsToArray(distilledText) {
    return distilledText.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
}
function paragraphsToJson(distilled) {
    var paragraphNumber = 1;
    var jsonParagraphs = {};
    distilled.forEach(function (element) {
        jsonParagraphs['paragraph_' + paragraphNumber] = element;
        paragraphNumber++;
    });
    return jsonParagraphs;
}
function reformatWikiJson(httpData) {
    return {
        title: (httpData.parse.title !== undefined) ? httpData.parse.title : undefined,
        pageid: (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
        wikitext: (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
    };
}
function convertWikiTextToDistilledJson(reformatedWikiJson) {
    return paragraphsToJson(paragraphsToArray(filterMediaTags(reformatedWikiJson.wikitext)));
}
function formatResponseJson(reformatedWikiJson, distilledtext) {
    return {
        'title': reformatedWikiJson.title,
        'pageid': reformatedWikiJson.pageid,
        'wikitext': reformatedWikiJson.wikitext,
        'distilledtext': distilledtext
    };
}
function returnResponse(errorCode, response) {
    if (response === void 0) { response = null; }
    if (errorCode === ErrorCode.OK) {
        return JSON.stringify(response);
    }
    else {
        response = {
            error: errorMap[errorCode]
        };
        return JSON.stringify(response);
    }
}
//# sourceMappingURL=aws_code.js.map