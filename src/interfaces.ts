export interface AssocArray {
    [key: string]: string;
}

export interface HttpData {
    title: string;
    pageid: number;
    wikitext: any[];
    error?: string;
}

export interface FormatedJson {
    title: string;
    pageid: number;
    wikitext: string;
    distilledtext: object;
}