import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus,  NoSubscriberBehavior, getVoiceConnection, VoiceConnection, PlayerSubscription, AudioResource } from "@discordjs/voice";
import play from 'play-dl';
import * as Embed from "~/utils/embed";

export async function PlaySoundFromStream(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url")!;

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Playing\n${url}`)] });
    
    const resource = createAudioResource(url);

    await PlaySound(interaction, resource);
}

export async function PlaySoundFromYT(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url")!;

    const yt_info = await play.video_info(url)
    const stream = await play.stream_from_info(yt_info)

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Playing from YT - **${yt_info.video_details.title}**\n${yt_info.video_details.url}`)] });
    
    const resource = createAudioResource(stream.stream, {
        inputType: stream.type
    });

    await PlaySound(interaction, resource);
}


async function PlaySound(interaction: ChatInputCommandInteraction, resource: AudioResource) {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("You need to be in a voice channel to use this command")] });
    } else if (!member.voice.channel.joinable) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I don't have permission to join your voice channel")] });
    } else if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    let connection: VoiceConnection | undefined = getVoiceConnection(interaction.guildId!);

    if (connection) {
        connection.destroy();
    }

    connection = joinVoiceChannel({
        channelId: member.voice.channel!.id,
        guildId: interaction.guild!.id,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    player.play(resource);
    const sub : PlayerSubscription = connection.subscribe(player)!;

    sub.player.on(AudioPlayerStatus.Idle, (error) => {
        player.stop();
        if (connection?.state.status !== 'destroyed')
            connection?.destroy();
    });
}

export async function Stop(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    getVoiceConnection(interaction.guildId!)?.destroy();

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Stopped playing sound`)] });
}