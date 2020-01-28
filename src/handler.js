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
                parsedData.parse[distilledtext] = parsedData.parse.wikitext['*'];
                console.log(JSON.stringify(parsedData.parse));
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
//# sourceMappingURL=handler.js.map