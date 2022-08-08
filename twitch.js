const { get, post } = require('axios');
const {
    TWITCH_CHANNEL,
    AUTH_TOKEN,
    CLIENT_ID
} = process.env;

const opts = {
    headers: {
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Client-ID': CLIENT_ID
    }
};

async function apiRequest(resource, params) {
    try {
        console.log('apiRequest', resource, params);
        const response = await get(`https://api.twitch.tv/helix/${resource}?${params}`, opts);
        const { data } = await response;
        return data;
    } catch(e) {
        console.log(e);
    }
}

async function gqlRequest(body) {
    try {
        const response = await post('https://gql.twitch.tv/gql', body, {
            headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko' }
        });
        const { data } = await response;
        return data;
    } catch(e) {
        console.log(e);
    }
}

async function getUserID(username) {
    try {
        const response = await apiRequest('users', `login=${username}`);
        const { data } = await response;
        const { id } = await data[0];
        return id;
    } catch(e) {
        console.log(e);
    }
}

async function getStream(username) {
    let response = await apiRequest('streams', { user_login: username });
    let { data: stream } = await response;
    
    if (stream.length == 0) return {
        error: 'no stream found'
    };

    let {
        id,
        type,
        started_at
    } = stream[0];

    return {
        error: false,
        id,
        type,
        started_at
    };
}

//const clipLengthLimit = 25000;
async function getClip(username) {
    let clipList = [];
    const broadcaster_id = await getUserID(username);

    let response = await apiRequest('clips', `broadcaster_id=${broadcaster_id}&first=100`);
    let { data: clips } = await response;

    for (let clip of clips) {
        let {
            title,
            url,
            thumbnail_url,
            created_at,
            creator_name,
            view_count
        } = clip;

        let direct_url = thumbnail_url.split('-preview')[0] + '.mp4';

        clipList.push({
            title,
            url,
            thumbnail_url,
            direct_url,
            created_at,
            creator_name,
            view_count
        });
    }

    //clips = clipList.sort(() => Math.random() - .5);
    //let index = Math.trunc(Math.random() * (clips.length-1));

    //return clipList.filter(clip => clip.duration < clipLengthLimit);
    //return clips[index];
    return clipList;
}

async function resolveClip(url) {
    let clipUrl;

    try {
        clipUrl = new URL(url);
    } catch {
        return { clip: null };
    }

    if (clipUrl.host != 'clips.twitch.tv') return { clip: null };

    let slug = clipUrl.pathname.substring(1);

    let query = JSON.stringify([{
        'operationName': 'WatchLivePrompt',
        'variables': { slug },
        'extensions': {
            'persistedQuery': {
                'version': 1,
                'sha256Hash': 'dcf741d88e5066ac8c140f1247309c36ce459b9c15a1ef726634081733d7147d'
            }
        }
    }]);

    let [{data}] = await gqlRequest(query);
    if (!data.clip) return { clip: null };

    let { thumbnailURL, broadcaster } = data.clip;
    if (broadcaster.login.toLowerCase() !== TWITCH_CHANNEL.toLowerCase()) return { clip: null };

    return {
        clip: {
            url: thumbnailURL.replace(/-preview?(.*)/, '.mp4'),
            thumbnail: thumbnailURL.replace(/(\d+)x(\d+)/, '480x272')
        }
    };
}

async function getClipRange(username, start, end) {
    let clipList = [];
    const broadcaster_id = await getUserID(username);

    let response = await apiRequest('clips', `broadcaster_id=${broadcaster_id}&first=100&started_at=${start}&ended_at=${end}`);
    let { data: clips } = await response;

    for (let clip of clips) {
        let {
            title,
            url,
            thumbnail_url,
            created_at,
            creator_name
        } = clip;

        let direct_url = thumbnail_url.split('-preview')[0] + '.mp4';

        clipList.push({
            title,
            url,
            thumbnail_url,
            direct_url,
            created_at,
            creator_name
        });
    }

    //clips = clipList.sort(() => Math.random() - .5);
    //let index = Math.trunc(Math.random() * (clips.length-1));

    clipList = clipList.sort(function(a, b) {
        return (a.created_at < b.created_at) ? -1 : ((a.created_at > b.created_at) ? 1 : 0);
    });

    //console.log(clipList[0], clipList[clipList.length-1]);

    return clipList;
}

module.exports = { getClip, resolveClip, getClipRange, getStream };