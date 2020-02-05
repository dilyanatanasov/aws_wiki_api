import {assert} from 'chai';
import {WikiApi} from './src/wikiApi';
const wikiApi = new WikiApi('en','DoceboLMS');
describe('WikiApi', function(){
    it("should return a json", function(){
        assert.(wikiApi.getConvertedWikiData(), "Hello");
    })
})