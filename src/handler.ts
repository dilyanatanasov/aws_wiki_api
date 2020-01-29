import * as https from 'https';

const language: string = 'en';
const pageName: string = 'DoceboLMS';
const distilledtext: string = 'distilledtext';
const missingtitle: string = 'missingtitle';

if(
    (language === '' || language === undefined) ||
    (pageName === '' || pageName === undefined)
){
    const data = {
        error: "Missing mandatory params"
    }
    console.log(JSON.stringify(data));
}else{
    const url: string = "https://" + language + ".wikipedia.org/w/api.php?action=parse&page=" + pageName + "&prop=wikitext&format=json";
    https.get(url, (res) => {
        let data: string = '';

        // A chunk of data has been recieved.
        res.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        res.on('end', () => {
            const parsedData = JSON.parse(data);
            if(parsedData.error !== undefined){
                if(parsedData.error.code === missingtitle){
                    const errorData = {
                        error: "Page not foud"
                    }
                    return JSON.stringify(errorData);
                }
            }else{
                const wikitext = parsedData.parse.wikitext['*'];
                const patterns = [
                    /(<ref .*?<\/ref>)/g,
                    /(<ref>.*?<\/ref>)/g,
                    /([\[\]])/g,
                    /(<ref.*?\/>)/g,
                    /({{.*?}})/g
                ]
                let distilled: string = wikitext;
                for (const element of patterns) {
                    distilled = regex_replace(distilled, element);
                }
                const splitDistilled = distilled.split('\n').map(x=>x.trim()).filter(Boolean);
                console.log(splitDistilled);
                const obj = {splitDistilled};
                parsedData.parse[distilledtext] = obj;
                // console.log(parsedData.parse);
            }
        });
    }).on('error', (e) => {
        if(e.code !== undefined){
            const errorData = {
                error: "Invalid Language"
            }
           console.log(JSON.stringify(errorData));
        }
    });
}

function regex_replace(text: string, pattern: any){
    return text.replace(pattern, "");
}
