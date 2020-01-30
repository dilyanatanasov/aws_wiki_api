import * as https from 'https';

interface AssocArray {
    [key: string]: string;
}

interface HttpData {
    title: string;
    pageid: number;
    wikitext: string;
    error?: string;
}

interface FormatedJson {
    title: string;
    pageid: number;
    wikitext: string;
    distilled: object;
}

class WikiApi {
    // GET params
    language: string;
    pageName: string;
    wikipediaUrl: string;
    // Preset Constant Variables For Comparison
    distilledTextLabel: string = 'distilledtext';
    pageNotFound: string = 'missingtitle';
    // Inicialized Variables
    httpResponseData: string = '';
    parsedHttpData: HttpData;
    formatedData: FormatedJson;
    distilledJson: object;
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

    constructor() {
        this.setUrlProperties();
        this.escapeGetParams();
        this.getConvertedWikiData(this.language, this.pageName);
    }

    getConvertedWikiData(language: string, pageName: string){
        // If the GET parameters are not set then disallow search
        if((language === '' || language === undefined) || (pageName === '' || pageName === undefined)){
            this.returnResponse(this.errorParam);
        }else{
            // If the parameters are set then generate the url and make a GET request
            this.setUrlPath(language, pageName);
            https.get(this.wikipediaUrl, (res) => {
                // Collect the response data into a string response variable
                res.on('data', (chunk) => {
                    this.httpResponseData += chunk;
                });
                // The whole response has been received
                res.on('end', () => {
                    const httpData = JSON.parse(this.httpResponseData);
                    if(httpData.error !== undefined && httpData.error.code === this.pageNotFound){
                        // If there is an error property in the parsed response and is equal to 'missingtitle'
                        // then the page doesn't exist on wikipedia
                        this.returnResponse(this.errorPage);
                    }else{
                        // If there are no errors work on the parsed data and return a formatted version
                        this.reformatWikiJson(httpData);
                        this.convertWikiTextToDistilledJson();
                        this.formatResponseJson();
                        this.returnResponse(this.noError, this.formatedData);
                    }
                });
            // If the page returns an error then the language is incorrectly passed
            }).on('error', (e) => {
                this.returnResponse(this.errorLanguage);
            });
        }
    }

    setUrlProperties(){
        this.language = 'en';
        this.pageName = 'DoceboLMS';
    }

    setUrlPath(language: string, page: string){
        this.wikipediaUrl = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + page + "&prop=wikitext&format=json";
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

    paragraphsToArray(distilled: string){
        return distilled.split('\n').map(x=>x.trim()).filter(Boolean)
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
        this.parsedHttpData = {
            'title' : (httpData.parse.title !== undefined) ? httpData.parse.title: undefined,
            'pageid' : (httpData.parse.pageid !== undefined) ? httpData.parse.pageid : undefined,
            'wikitext' : (httpData.parse.wikitext['*'] !== undefined) ? httpData.parse.wikitext['*'] : undefined
        }
    }

    convertWikiTextToDistilledJson(){
        this.distilledJson = this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(this.parsedHttpData.wikitext)))
    }

    formatResponseJson(){
        this.formatedData = {
            'title' : this.parsedHttpData.title,
            'pageid' : this.parsedHttpData.pageid,
            'wikitext' : this.parsedHttpData.wikitext,
            'distilled' : this.distilledJson
        }
    }

    returnResponse(errorCode: string, response: object = null){
        if(errorCode === 'none'){
            console.log(JSON.stringify((response)));
        }else{
            const data = {
                error: this.errorMap[errorCode]
            }
            console.log(JSON.stringify((data)));
        }
    }
}

const wiki = new WikiApi();