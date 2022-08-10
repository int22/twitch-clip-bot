require('dotenv').config();

const { getClips, resolveClip } = require('./twitch');
const clipTask = require('./clipTask');
const { Client, Intents } = require('discord.js');

const {
    buildClipEmbed,
    buildDownloadEmbed
} = require('./embed');

const { webcrypto } = require('node:crypto');

const {
    DISCORD_TOKEN,
    DISCORD_CHANNEL_ID,
    TWITCH_CHANNEL
} = process.env;

function getRandomValue(limit) {
    let buf = new Uint8Array(1);
    webcrypto.getRandomValues(buf);
    return buf[0] % (limit-1);
}

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.username}`);

    try {
        let task = await clipTask(client, TWITCH_CHANNEL);
        task.start();
    } catch(e) {
        console.log(e);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction?.channelId !== DISCORD_CHANNEL_ID) return;

    const { commandName } = interaction;
    await interaction.deferReply();

    if (commandName == 'clip') {
        const clips = await getClips(TWITCH_CHANNEL);

        const clipCount = clips.length;
        const rnd = getRandomValue(clipCount);

        if (!clips) return interaction.editReply('No results found');

        var { embed, actions } = buildClipEmbed(clips[rnd]);

        interaction.editReply({
            embeds: [embed],
            components: [actions]
        });
    } else if (commandName == 'download') {
        let clipUrl = interaction.options.getString('url');
        if (!clipUrl) return interaction.editReply('url input required');

        let { clip } = await resolveClip(clipUrl);
        if (!clip) return interaction.editReply('clip not found');
        
        let { content, embed, actions } = buildDownloadEmbed(clip, clipUrl, interaction.user);

        interaction.editReply({
            content,
            embeds: [embed],
            components: [actions]
        });
    }
});

client.login(DISCORD_TOKEN);
