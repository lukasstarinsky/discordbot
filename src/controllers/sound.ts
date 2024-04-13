import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus,  NoSubscriberBehavior, getVoiceConnection } from "@discordjs/voice";
import play from 'play-dl';
import * as Embed from "~/utils/embed";

export async function PlaySound(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url");

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("You need to be in a voice channel to use this command")] });
    } else if (!member.voice.channel.joinable) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I don't have permission to join your voice channel")] });
    } else if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Playing sound from ${url}`)] });

    const connection = joinVoiceChannel({
        channelId: member.voice.channel!.id,
        guildId: interaction.guild!.id,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        connection.disconnect();
    });

    player.play(createAudioResource(url!));
}

export async function PlaySoundFromYT(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url");

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("You need to be in a voice channel to use this command")] });
    } else if (!member.voice.channel.joinable) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I don't have permission to join your voice channel")] });
    } else if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Playing YT sound from ${url}`)] });

    const connection = joinVoiceChannel({
        channelId: member.voice.channel!.id,
        guildId: interaction.guild!.id,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    const stream = await play.stream(url!);

    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    });

    let player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    player.on(AudioPlayerStatus.Idle, () => {
        connection.disconnect();
    });

    player.play(resource);
    connection.subscribe(player);
}

export async function Stop(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    getVoiceConnection(interaction.guildId!)?.destroy();

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Stopped playing sound`)] });
}