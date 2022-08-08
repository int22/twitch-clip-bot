require('dotenv').config();
const {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID
} = process.env;

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
    new SlashCommandBuilder()
        .setName('clip')
        .setDescription('Get a random clip'),
    new SlashCommandBuilder()
        .setName('download')
        .setDescription('Get direct download url of clip')
        .addStringOption(option => {
            return option
                .setName('url')
                .setDescription('clip url')
                .setRequired(true);
        })
].map(command => command.toJSON());

const rest = new REST({ version: '9' })
    .setToken(DISCORD_TOKEN);

rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands })
    .then(() => console.log('successfully registered commands'))
    .catch(console.error);