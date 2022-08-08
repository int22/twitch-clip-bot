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
const { buildEmbed } = require('./embed');

const {
    DISCORD_TOKEN,
    DISCORD_CHANNEL_ID,
    TWITCH_CHANNEL,
    EMBED_COLOR
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

        const {
            title,
            url,
            thumbnail_url,
            direct_url,
            created_at,
            creator_name
        } = clip[rnd];

        const clipEmbed = new MessageEmbed()
            .setColor(`#${EMBED_COLOR}`)
            .setTitle(title)
            .setURL(url)
            .setImage(thumbnail_url)
            .setTimestamp(created_at)
            .setFooter(`Clipped by ${creator_name}`);
        
        const actions = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setURL(direct_url)
                    .setLabel('Download clip')
                    .setStyle('LINK')
                    //.setEmoji('👍')
            );

        interaction.editReply({
            embeds: [clipEmbed],
            components: [actions]
        });
    } else if (commandName == 'download') {
        let clipUrl = interaction.options.getString('url');
        if (!clipUrl) return interaction.editReply('url input required');

        let { clip } = await resolveClip(clipUrl);
        if (!clip) return interaction.editReply('clip not found');
        
        let { url, thumbnail } = clip;

        const clipEmbed = new MessageEmbed()
            .setColor(`#${EMBED_COLOR}`)
            .setURL(clipUrl)
            .setImage(thumbnail)
            .setTimestamp(new Date().toISOString())
            .setFooter(`Requested by ${interaction.user.username}#${interaction.user.discriminator}`);
        
        const actions = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setURL(url)
                    .setLabel('Download clip')
                    .setStyle('LINK')
            );

        interaction.editReply({
            content: `Download link for ${clipUrl}`,
            embeds: [clipEmbed],
            components: [actions]
        });
    }
});

client.login(DISCORD_TOKEN);