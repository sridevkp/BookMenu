require('dotenv').config()
const { createClient } =  require('redis');

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})
client.on('error', err => console.log('Redis Client Error', err))
client.connect();

const cache = async (req, res, next) => {
    const { url } = req.query;
    if( !url ) return res.sendStatus(400);

    try {        
        const data = await client.get(url);
        if (data != null) {
            const preview = JSON.parse(data);
            return res.json({ src: 'cache', ...preview });
        } else {
            next(); 
        }
    } catch (err) {
        console.log('Cache Error:', err);
        next(); 
    }
}

async function fetchSitePreview( url ){
    try {
        const valid = new URL(url);
        const res = await fetch( `https://api.linkpreview.net/?q=${url}`, {
            method : "GET",
            headers : {
                "X-Linkpreview-Api-Key" : process.env.LINK_PREVIEW_API_KEY
            }
        });
        const preview = await res.json();
        const val = JSON.stringify(preview);
        client.set( url, val );
        
        return { src : "linkpreview api", ...preview}    
    } 
    catch (err) {
        console.log(err)
        throw new Error(500) 
    }
}

module.exports = { cache, fetchSitePreview };