const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js');

const { EMBED_COLOR } = process.env;

function buildEmbed(data) {
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
        .setFooter(`Clipped by ${creator_name}`);

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

module.exports = { buildEmbed };