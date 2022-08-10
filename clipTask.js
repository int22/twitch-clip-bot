const cron = require('node-cron');
const { getClipsRange, getUserID } = require('./twitch');
const { buildClipEmbed } = require('./embed');

const { DISCORD_CHANNEL_ID } = process.env;

async function sendClipToDiscord(client, data) {
    var { embed, actions } = buildClipEmbed(data);

    let channel = client.channels.cache.find(channel => channel.id === DISCORD_CHANNEL_ID);
    channel.send({
        embeds: [embed],
        components: [actions]
    });

    return true;
}

function sortClipByTimestamp(a, b) {
    let isOlder = (a.created_at < b.created_at);
    let isNewer = (a.created_at > b.created_at);
    return isOlder ? -1 : (isNewer ? 1 : 0);
}

async function processClips(user_id, channel) {
    let now = new Date().toISOString();

    if (global.previousTimestamp == now) {
        global.previousTimestamp = now;
        return [];
    }

    let start = global.previousTimestamp;

    let clips = await getClipsRange(channel, start, now);

    if (clips.length == 0) {
        previousTimestamp = now;
        return [];
    }

    clips = clips.sort(sortClipByTimestamp);

    global.previousTimestamp = now;

    return clips;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function createClipTask(client, channel, minutes=1) {
    if (!channel) throw new Error('createClipTask: Channel required');

    let cronInterval = `*/${minutes} * * * *`;
    
    if (!cron.validate(cronInterval)) throw new Error('Invalid cron interval');

    console.log('creating task');

    var user_id = await getUserID(channel);
    global.previousTimestamp = new Date().toISOString();

    return cron.schedule(cronInterval, async () => {
        console.log('clip task ran');
        let clips = await processClips(user_id, channel);
        if (clips.length == 0) {
            console.log('no clips found!');
            return;
        }
    
        for (let clip of clips) {
            await sendClipToDiscord(client, clip);
            await sleep(2500);
        }
    }, { scheduled: false });
}

module.exports = createClipTask;