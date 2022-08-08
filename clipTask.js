const { get, post } = require('axios');
const cron = require('node-cron');
const { getClipRange, getStream } = require('./twitch');
const { buildEmbed } = require('./embed');

const { DISCORD_CHANNEL_ID } = process.env;

async function sendClipToDiscord(client, data) {
    console.log('sending to discord!');

    var { embed, actions } = buildEmbed(data);
    console.log(embed, actions);

    client.channels.get(DISCORD_CHANNEL_ID).send({
        embeds: [embed],
        components: [actions]
    });

    return true;
}

function sortClipByTimestamp(a, b) {
    console.log('sorting');
    let isOlder = (a.created_at < b.created_at);
    let isNewer = (a.created_at > b.created_at);
    return isOlder ? -1 : (isNewer ? 1 : 0);
}

var previousTimestamp = undefined;
async function processClips(username) {
    console.log('processing clips');

    let stream = await getStream(username);
    console.log(stream);

    let start = previousTimestamp ?? stream.started_at;

    let clips = await getClipRange(username, start, new Date().toISOString());
    console.log(clips);

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

function createClipTask(client, channel, minutes) {
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
            await sendClipToDiscord(client, clip);
        }
    }, { scheduled: false });
}

module.exports = createClipTask;