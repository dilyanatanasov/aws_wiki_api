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
                parsedData.parse[distilledtext] = parsedData.parse.wikitext['*'];
                console.log(JSON.stringify(parsedData.parse));
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
