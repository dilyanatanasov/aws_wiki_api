import * as https from 'https';
import {AssocArray, ReformatedJson} from "./interfaces";

enum ErrorCode {
    PAGE = 'page',
    LANG = 'lang',
    PARAM = 'param',
    OK = 'none',
}
/**
 * Make a request to the public Wikipedia API
 * Use the wikitext param from the returned json object to extract the distilled data without the mediatags
 * @author Dilyan Atnasov
 * @param string: language
 * @param string: pageName
 * @returns json
 */
export class WikiApi {
    // GET params
    language: string;
    pageName: string;
    wikipediaUrl: string;
    // Preset Constant Variables For Comparison
    distilledTextLabel: string = 'distilledtext';
    pageNotFound: string = 'missingtitle';
    // Error Codes
    errorMap: AssocArray = {
        "param":"Missing mandatory params",
        "lang":"Invalid Language",
        "page":"Page not foud",
        "none":"Success"
    };
    errorPage: string = 'page';
    errorLanguage: string = 'lang';
    errorParam: string = 'param';
    noError: string = 'none';

    // Initialize required params and generate url for http request
    constructor(language: string, pageName: string) {
        this.setUrlProperties(language, pageName);
        this.escapeGetParams();
    }

    getConvertedWikiData(){
        // If the GET parameters are not set then disallow search
        if((this.language === '' || this.language === undefined) || (this.pageName === '' || this.pageName === undefined)){
            return this.returnResponse(this.errorParam);
        }else{
            // If the parameters are set then generate the url and make a GET request
            this.setUrlPath();
            https.get(this.wikipediaUrl, (res) => {
                let wikiResponseData = '';
                // Collect the response data into a string response variable
                res.on('data', (chunk) => {
                    wikiResponseData += chunk;
                });
                // The whole response has been received
                res.on('end', () => {
                    const wikiData = JSON.parse(wikiResponseData);
                    if(wikiData.error !== undefined && wikiData.error.code === this.pageNotFound){
                        // If there is an error property in the parsed response and is equal to 'missingtitle'
                        // then the page doesn't exist on wikipedia
                        return this.returnResponse(this.errorPage);
                    }else{
                        // If there are no errors work on the parsed data and return a formatted version
                        const reformatedWikiJson = this.reformatWikiJson(wikiData);
                        const distilledObject = this.convertWikiTextToDistilledJson(reformatedWikiJson);
                        const formatedResponseJson = this.formatResponseJson(reformatedWikiJson, distilledObject);
                        return this.returnResponse(this.noError, formatedResponseJson);
                    }
                });
            // If the page returns an error then the language is incorrectly passed
            }).on('error', (e) => {
                return this.returnResponse(this.errorLanguage);
            });
        }
    }

    // Set the properties used for the https request
    setUrlProperties(language: string, pageName: string){
        this.language = language;
        this.pageName = pageName;
    }

    // Set the url path to be used for the https reques
    setUrlPath(){
        this.wikipediaUrl = "https://" + this.language + ".wikipedia.org/w/api.php?action=parse&page=" + this.pageName + "&prop=wikitext&format=json";
    }

    // Econde passed params for strings that are not supported
    escapeGetParams(){
        this.language = encodeURI(this.language);
        this.pageName = encodeURI(this.pageName);
    }

    // Return filtered text by applying an regex rule
    regex_replace(text: string, pattern: any){
        return text.replace(pattern, "");
    }

    // Remove all mediatags from the wikitext param of the parsed json response
    filterMediaTags(wikitext: string){
        const patterns = [
            /(<ref .*?<\/ref>)/g,
            /(<ref>.*?<\/ref>)/g,
            /(<ref.*?\/>)/g,
            /([\[\]])/g,
            /({{.*?}})/g
        ];
        let distilled: string = wikitext;
        for (const element of patterns) {
            distilled = this.regex_replace(distilled, element);
        }
        return distilled;
    }

    // Convert the distilled text into an array by spliting it by the new line
    paragraphsToArray(distilledText: string){
        return distilledText.split('\n').map(x=>x.trim()).filter(Boolean);
    }

    // Format the array that is passed into a json with key value pairs for every paragraph
    paragraphsToJson(distilled: any[]){
        let paragraphNumber: number = 1;
        const jsonParagraphs: any = {};
        distilled.forEach(element => {
            jsonParagraphs['paragraph_' + paragraphNumber] = element;
            paragraphNumber++;
        });
        return jsonParagraphs;
    }

    // Takes the initial parsed json and formats it into a workable json object
    reformatWikiJson(httpData: any){
        return{
            title : (httpData.parse.title !== undefined) ? httpData.parse.title: undefined,
            pageid : (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
            wikitext : (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
        }
    }

    // Takes the string value, converts it into an array and then it converts it into a json
    convertWikiTextToDistilledJson(reformatedWikiJson: ReformatedJson){
        return this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(reformatedWikiJson.wikitext)))
    }

    // Format the final json and return it
    formatResponseJson(reformatedWikiJson: ReformatedJson, distilledtext: object){
        return {
            'title' : reformatedWikiJson.title,
            'pageid' : reformatedWikiJson.pageid,
            'wikitext' : reformatedWikiJson.wikitext,
            'distilledtext' : distilledtext
        }
    }

    // Return a response json depending on the error code
    returnResponse(errorCode: string, response: object = null){
        if(errorCode === ErrorCode.OK){
            return JSON.stringify((response));
        }else{
            response = {
                error: this.errorMap[errorCode]
            }
            return JSON.stringify((response));
        }
    }
}
