const { get, post } = require('axios');
const cron = require('node-cron');
const { getClipRange } = require('./twitch');

const {
    //AUTH_TOKEN,
    //CLIENT_ID,
    WEBHOOK_URL,
    EMBED_COLOR
} = process.env;

function sendClipToDiscord({
    title,
    creator_name,
    created_at,
    url,
    thumbnail_url,
    direct_url,
}) {
    console.log('sending to discord!');

    const embed = {
        embeds: [{
            title,
            color: EMBED_COLOR,
            url: url,
            image: {
                url: thumbnail_url
            },
            timestamp: created_at,
            footer: {
                text: `Clipped by ${creator_name}`
            }
        }, {
            title: "Download clip",
            color: 0,
            url: direct_url
        }]
    };

    post(WEBHOOK_URL, embed).catch(e => {
        console.error('failed to post clip', e);
        return e;
    });

    return true;
}

function sortClipByTimestamp(a, b) {
    console.log('sorting');
    let isOlder = (a.created_at < b.created_at);
    let isNewer = (a.created_at > b.created_at);
    return isOlder ? -1 : (isNewer ? 1 : 0);
}

async function processClips(username) {
    console.log('processing clips');
    /*
    let stream = await getStream(username);
    if (stream.error) {
        console.log('failed processing');
        return {
            error: 'stream not live'
        };
    }
    */

    let clips = await getClipRange(username, previousTimestamp, new Date().toISOString());
    console.log(clips.length);

    let sameClip = clips.length == 1 && clips[0].created_at == previousTimestamp;
    let noClipFound = clips.length == 0;

    if (sameClip || noClipFound) {
        previousTimestamp = new Date().toISOString();
        return [];
    }
    
    clips = clips.sort(sortClipByTimestamp);

    previousTimestamp = clips[clips.length-1].created_at;

    return clips;
}

function createClipTask(channel, minutes) {
    console.log('createClipTask');
    if (!channel) throw new Error('createClipTask: Channel required');

    let cronInterval = `*/${minutes} * * * *`;
    
    if (!cron.validate(cronInterval)) throw new Error('Invalid cron interval');

    console.log('creating task');

    return cron.schedule(cronInterval, async () => {
        console.log('task ran');
        let clips = await processClips(channel);
        console.log(clips.length);
        if (clips.length == 0) {
            console.log('no clips found!');
            return;
        }
    
        for (let clip of clips) {
            await sendClipToDiscord(clip);
        }
    }, { scheduled: false });
}

module.exports = createClipTask;