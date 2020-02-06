import * as https from 'https';

interface AssocArray {
    [key: string]: string;
}

interface ReformatedJson {
    title: string;
    pageid: number;
    wikitext: string;
}

enum ErrorCode {
    PAGE = 'page',
    LANG = 'lang',
    PARAM = 'param',
    OK = 'none',
}

// GET params
let language: string = '';
let pageName: string = '';
let wikipediaUrl: string = '';
// Preset Constant Variables For Comparison
const distilledTextLabel: string = 'distilledtext';
const pageNotFound: string = 'missingtitle';
// Error Codes
const errorMap: AssocArray = {
    "param": "Missing mandatory params",
    "lang": "Invalid Language",
    "page": "Page not foud",
    "none": "Success"
};
const errorPage: string = 'page';
const errorLanguage: string = 'lang';
const errorParam: string = 'param';
const noError: string = 'none';



exports.handler = (event:any , context: any, callback: any) => {
    setUrlProperties(event.language, event.pageName);
    escapeGetParams();
    // If the GET parameters are not set then disallow search
    if ((event.language === '' || event.language === undefined) || (event.pageName === '' || event.pageName === undefined)) {
        returnResponse(errorParam);
    } else {
        // If the parameters are set then generate the url and make a GET request
        setUrlPath();
        https.get(wikipediaUrl, (res) => {
            let wikiResponseData = '';
            // Collect the response data into a string response variable
            res.on('data', (chunk) => {
                wikiResponseData += chunk;
            });
            // The whole response has been received
            res.on('end', () => {
                const wikiData = JSON.parse(wikiResponseData);
                if (wikiData.error !== undefined && wikiData.error.code === pageNotFound) {
                    // If there is an error property in the parsed response and is equal to 'missingtitle'
                    // then the page doesn't exist on wikipedia
                    callback(returnResponse(errorPage));
                } else {
                    // If there are no errors work on the parsed data and return a formatted version
                    const reformatedWikiJson = reformatWikiJson(wikiData);
                    const distilledObject = convertWikiTextToDistilledJson(reformatedWikiJson);
                    const formatedResponseJson = formatResponseJson(reformatedWikiJson, distilledObject);
                    callback(returnResponse(noError, formatedResponseJson));
                }
            });
            // If the page returns an error then the language is incorrectly passed
        }).on('error', (e) => {
            callback(returnResponse(errorLanguage));
        });
    }
}

// Set the properties used for the https request
function setUrlProperties(lang: string, page: string) {
    language = lang;
    pageName = page;
}

// Set the url path to be used for the https reques
function setUrlPath() {
    wikipediaUrl = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + pageName + "&prop=wikitext&format=json";
}

// Econde passed params for strings that are not supported
function escapeGetParams() {
    language = encodeURI(language);
    pageName = encodeURI(pageName);
}

// Return filtered text by applying an regex rule
function regex_replace(text: string, pattern: any) {
    return text.replace(pattern, "");
}

// Remove all mediatags from the wikitext param of the parsed json response
function filterMediaTags(wikitext: string) {
    const patterns = [
        /(<ref .*?<\/ref>)/g,
        /(<ref>.*?<\/ref>)/g,
        /(<ref.*?\/>)/g,
        /([\[\]])/g,
        /({{.*?}})/g
    ];
    let distilled: string = wikitext;
    for (const element of patterns) {
        distilled = regex_replace(distilled, element);
    }
    return distilled;
}

// Convert the distilled text into an array by spliting it by the new line
function paragraphsToArray(distilledText: string) {
    return distilledText.split('\n').map(x => x.trim()).filter(Boolean);
}

// Format the array that is passed into a json with key value pairs for every paragraph
function paragraphsToJson(distilled: any[]) {
    let paragraphNumber: number = 1;
    const jsonParagraphs: any = {};
    distilled.forEach(element => {
        jsonParagraphs['paragraph_' + paragraphNumber] = element;
        paragraphNumber++;
    });
    return jsonParagraphs;
}

// Takes the initial parsed json and formats it into a workable json object
function reformatWikiJson(httpData: any) {
    return {
        title: (httpData.parse.title !== undefined) ? httpData.parse.title : undefined,
        pageid: (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
        wikitext: (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
    }
}

// Takes the string value, converts it into an array and then it converts it into a json
function convertWikiTextToDistilledJson(reformatedWikiJson: ReformatedJson) {
    return paragraphsToJson(paragraphsToArray(filterMediaTags(reformatedWikiJson.wikitext)))
}

// Format the final json and return it
function formatResponseJson(reformatedWikiJson: ReformatedJson, distilledtext: object) {
    return {
        'title': reformatedWikiJson.title,
        'pageid': reformatedWikiJson.pageid,
        'wikitext': reformatedWikiJson.wikitext,
        'distilledtext': distilledtext
    }
}

// Return a response json depending on the error code
function returnResponse(errorCode: string, response: object = null) {
    if (errorCode === ErrorCode.OK) {
        return JSON.stringify(response);
    } else {
        response = {
            error: errorMap[errorCode]
        }
        return JSON.stringify(response);
    }
}