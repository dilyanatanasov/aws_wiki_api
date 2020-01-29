import * as https from 'https';

interface AssocArray {
    [key: string]: string;
}

class WikiApi {
    // GET params
    language: string;
    pageName: string;
    url: string;
    // Preset Constant Variables For Comparison
    distilledTextLabel: string = 'distilledtext';
    pageNotFound: string = 'missingtitle';
    // Inicialized Variables
    httpResponseData: string = '';
    // Error Codes
    errorPage: string = 'page';
    errorLanguage: string = 'lang';
    errorParam: string = 'param';
    noError: string = 'none';

    constructor() {
        this.setUrlProperties();
        this.escapeParams();
        this.getWikiData(this.language, this.pageName);
    }

    getWikiData(language: string, pageName: string){
        if(
            (language === '' || language === undefined) || (pageName === '' || pageName === undefined)
        ){
            this.returnResponse(this.errorParam);
        }else{
            this.setUrlPath(language, pageName);
            https.get(this.url, (res) => {
                // A chunk of data has been recieved.
                res.on('data', (chunk) => {
                    this.httpResponseData += chunk;
                });

                // The whole response has been received.
                res.on('end', () => {
                    const parsedHttpData = JSON.parse(this.httpResponseData);
                    if(parsedHttpData.error !== undefined && parsedHttpData.error.code === this.pageNotFound){
                        this.returnResponse(this.errorPage);
                    }else{
                        const wikitext = parsedHttpData.parse.wikitext['*'];
                        const distilledText = this.paragraphsToJson(this.paragraphsToArray(this.filterMediaTags(wikitext)));
                        parsedHttpData.parse[this.distilledTextLabel] = distilledText;
                        this.returnResponse(this.noError, parsedHttpData);
                    }
                });
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
        this.url = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + page + "&prop=wikitext&format=json";
    }

    escapeParams(){
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
            /([\[\]])/g,
            /(<ref.*?\/>)/g,
            /({{.*?}})/g
        ]
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

    returnResponse(errorCode: string, response: object = null){
        const errorMap: AssocArray = {
            "param":"Missing mandatory params",
            "lang":"Invalid Language",
            "page":"Page not foud",
            "none":"Success"
        };

        if(errorCode === 'none'){
            console.log(JSON.stringify((response)));
        }else{
            const data = {
                error: errorMap[errorCode]
            }
            console.log(JSON.stringify((data)));
        }
    }
}

const wiki = new WikiApi();