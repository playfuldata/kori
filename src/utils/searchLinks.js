import util from "util";
const request = require("request");

export default async (sentence, sentenceOffset, charts, blockKey) => {
    const payload = { text: sentence, sentenceOffset, charts: charts, blockKey};
    const options = {
        uri: process.env.NODE_ENV=='production'?"https://koriserver.namwkim.org/discover-links":'http://0.0.0.0:8885/discover-links',
        
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
        },
        json: true,
        body: payload,
    };

    const requestPromise = util.promisify(request);
    try{
        const response = await requestPromise(options);
        return response?.body?.data;
    }
    catch(e){
        return []
    }
}