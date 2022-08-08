const cron = require('node-cron');
const { getClipRange, getStream } = require('./twitch');
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

var previousTimestamp = undefined;
var firstRun = true;

async function processClips(username) {
    let stream = await getStream(username);

    let start = (firstRun)
        ? (stream?.started_at ?? new Date().toISOString())
        : previousTimestamp;

    let clips = await getClipRange(username, start, new Date().toISOString());

    let sameClip = clips.length == 1 && clips[0].created_at == previousTimestamp;
    let noClipFound = clips.length == 0;

    if (sameClip || noClipFound) {
        previousTimestamp = new Date().toISOString();
        return [];
    }
    
    clips = clips.sort(sortClipByTimestamp);

    previousTimestamp = new Date().toISOString();
    firstRun = false;

    return clips;
}

function createClipTask(client, channel, minutes) {
    console.log('createClipTask');
    if (!channel) throw new Error('createClipTask: Channel required');

    let cronInterval = `*/${minutes} * * * *`;
    
    if (!cron.validate(cronInterval)) throw new Error('Invalid cron interval');

    console.log('creating task');

    return cron.schedule(cronInterval, async () => {
        console.log('task ran');
        let clips = await processClips(channel);
        if (clips.length == 0) {
            console.log('no clips found!');
            return;
        }
    
        for (let clip of clips) {
            await sendClipToDiscord(client, clip);
        }
    }, { scheduled: false });
}

module.exports = createClipTask;