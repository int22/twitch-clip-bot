require('dotenv').config();

const { getClip, resolveClip } = require('./twitch');
const clipTask = require('./clipTask');
const {
    Client,
    Intents,
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');

const {
    buildClipEmbed,
    buildDownloadEmbed
} = require('./embed');

const {
    DISCORD_TOKEN,
    DISCORD_CHANNEL_ID,
    TWITCH_CHANNEL
} = process.env;

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

client.once('ready', () => {
    console.log('ready');
    try {
        let task = clipTask(client, TWITCH_CHANNEL, 1);
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
        const clip = await getClip(TWITCH_CHANNEL);

        const clipCount = clip.length;
        const rnd = Math.floor(Math.random() * clipCount);

        if (!clip) return interaction.editReply('No results found');

        var { embed, actions } = buildClipEmbed(clip[rnd]);

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