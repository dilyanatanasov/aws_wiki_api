"use strict";
exports.__esModule = true;
var https = require("https");
var language = 'en';
var pageName = 'DoceboLMS';
var distilledtext = 'distilledtext';
var missingtitle = 'missingtitle';
if ((language === '' || language === undefined) ||
    (pageName === '' || pageName === undefined)) {
    var data = {
        error: "Missing mandatory params"
    };
    console.log(JSON.stringify(data));
}
else {
    var url = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + pageName + "&prop=wikitext&format=json";
    https.get(url, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var parsedData = JSON.parse(data);
            if (parsedData.error !== undefined) {
                if (parsedData.error.code === missingtitle) {
                    var errorData = {
                        error: "Page not foud"
                    };
                    return JSON.stringify(errorData);
                }
            }
            else {
                var wikitext = parsedData.parse.wikitext['*'];
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
                    distilled = regex_replace(distilled, element);
                }
                var splitDistilled = distilled.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
                console.log(splitDistilled);
                var obj = { splitDistilled: splitDistilled };
                parsedData.parse[distilledtext] = obj;
            }
        });
    }).on('error', function (e) {
        if (e.code !== undefined) {
            var errorData = {
                error: "Invalid Language"
            };
            console.log(JSON.stringify(errorData));
        }
    });
}
function regex_replace(text, pattern) {
    return text.replace(pattern, "");
}
//# sourceMappingURL=handler.js.map