const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');

const { EMBED_COLOR } = process.env;

function buildClipEmbed(data) {
    const {
        title,
        url,
        thumbnail_url,
        direct_url,
        created_at,
        creator_name
    } = data;

    const embed = new MessageEmbed()
        .setColor(`#${EMBED_COLOR}`)
        .setTitle(title)
        .setURL(url)
        .setImage(thumbnail_url)
        .setTimestamp(created_at)
        .setFooter({
            text: `Clipped by ${creator_name}`
        });

    const actions = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setURL(direct_url)
                .setLabel('Download clip')
                .setStyle('LINK')
                //.setEmoji('👍')
        );

    return {
        embed,
        actions
    };
}

function buildDownloadEmbed(data, clipUrl, user) {
    let {
        url,
        thumbnail
    } = data;

    const embed = new MessageEmbed()
        .setColor(`#${EMBED_COLOR}`)
        .setURL(clipUrl)
        .setImage(thumbnail)
        .setTimestamp(new Date().toISOString())
        .setFooter({
            text: `Requested by ${user.username}#${user.discriminator}`
        });

    const actions = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setURL(url)
                .setLabel('Download clip')
                .setStyle('LINK')
        );

    return {
        content: `Download link for ${clipUrl}`,
        embed,
        actions
    };
}

module.exports = { buildClipEmbed, buildDownloadEmbed };