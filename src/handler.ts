import * as https from 'https';
import {AssocArray} from "./interfaces";

enum ErrorCode {
    PAGE = 'page',
    LANG = 'lang',
    PARAM = 'param',
    OK = 'none',
}

class WikiApi {
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

    constructor(language: string, pageName: string) {
        this.setUrlProperties(language, pageName);
        this.escapeGetParams();
    }

    getConvertedWikiData(){
        // If the GET parameters are not set then disallow search
        if((this.language === '' || this.language === undefined) || (this.pageName === '' || this.pageName === undefined)){
            this.returnResponse(this.errorParam);
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
                        this.returnResponse(this.errorPage);
                    }else{
                        // If there are no errors work on the parsed data and return a formatted version
                        const reformatedWikiJson = this.reformatWikiJson(wikiData);
                        const distilledObject = this.convertWikiTextToDistilledJson(reformatedWikiJson);
                        const formatedResponseJson = this.formatResponseJson(reformatedWikiJson, distilledObject);
                        this.returnResponse(this.noError, formatedResponseJson);
                    }
                });
            // If the page returns an error then the language is incorrectly passed
            }).on('error', (e) => {
                this.returnResponse(this.errorLanguage);
            });
        }
    }

    setUrlProperties(language: string, pageName: string){
        this.language = language;
        this.pageName = pageName;
    }

    setUrlPath(){
        this.wikipediaUrl = "https://" + this.language + ".wikipedia.org/w/api.php?action=parse&page=" + this.pageName + "&prop=wikitext&format=json";
    }

    escapeGetParams(){
        this.language = encodeURI(this.language);
        this.pageName = encodeURI(this.pageName);
    }

    regex_replace(text: string, pattern: any){
        return text.replace(pattern, "");
    }

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

    paragraphsToArray(distilledText: string){
        return distilledText.split('\n').map(x=>x.trim()).filter(Boolean);
    }

    paragraphsToJson(distilled: any[]){
        let paragraphNumber: number = 1;
        const jsonParagraphs: any = {};
        distilled.forEach(element => {
            jsonParagraphs['paragraph_' + paragraphNumber] = element;
            paragraphNumber++;
        });
        return jsonParagraphs;
    }

    reformatWikiJson(httpData: any){
        return{
            title : (httpData.parse.title !== undefined) ? httpData.parse.title: undefined,
            pageid : (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
            wikitext : (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
        }
    }

    convertWikiTextToDistilledJson(reformatedWikiJson: any){
        return this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(reformatedWikiJson.wikitext)))
    }

    formatResponseJson(reformatedWikiJson: any, distilledtext: any){
        return {
            'title' : reformatedWikiJson.title,
            'pageid' : reformatedWikiJson.pageid,
            'wikitext' : reformatedWikiJson.wikitext,
            'distilledtext' : distilledtext
        }
    }

    returnResponse(errorCode: string, response: object = null){
        if(errorCode === ErrorCode.OK){
            console.log(JSON.stringify((response)));
        }else{
            const data = {
                error: this.errorMap[errorCode]
            }
            console.log(JSON.stringify((data)));
        }
    }
}

const wiki = new WikiApi('en','DoceboLMS');
wiki.getConvertedWikiData();