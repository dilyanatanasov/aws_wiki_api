import {WikiApi} from './wikiApi';

const wiki = new WikiApi("en", "DoceboLMS");
wiki.getConvertedWikiData();

// This is how I was trying to make the request via AWS Lambda
// exports.handler = (event: any, context: any, callback: any) => {
// const wiki = new WikiApi(event.language, event.pageName);
// callback(wiki.getConvertedWikiData());
// }
