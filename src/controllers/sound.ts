import { ChatInputCommandInteraction, Colors, GuildMember } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus,  NoSubscriberBehavior, getVoiceConnection } from "@discordjs/voice";
import { QueueEntry } from "~/types/sound/QueueEntry.type";
import * as Embed from "~/utils/embed";

let queues: Map<string, QueueEntry[]> = new Map();

export async function Play(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url")!;

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("You need to be in a voice channel to use this command")] });
    } else if (!member.voice.channel.joinable) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I don't have permission to join your voice channel")] });
    } else if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }
    
    const entry = new QueueEntry(url);
    const name = await entry.getName();

    if (queues.has(interaction.guildId!)) {
        queues.get(interaction.guildId!)!.push(entry);
        await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Added to queue - **${name}**\n${url}`)] });
    } else {
        queues.set(interaction.guildId!, [entry]);
        await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Queue created, playing - **${name}**\n${url}`)] });
    }

    if (getVoiceConnection(interaction.guildId!)) {
        return;
    }

    const connection = joinVoiceChannel({
        channelId: member.voice.channel.id,
        guildId: interaction.guildId!,
        // TODO(peto): fix
        adapterCreator: interaction.guild.voiceAdapterCreator as any
    });

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    player.on(AudioPlayerStatus.Idle, async (error) => {
        if (!queues.get(interaction.guildId!)) {
            if (connection.state.status != "destroyed")
                connection.destroy();
            return;
        } else if (queues.get(interaction.guildId!)!.length == 0) {
            if (connection.state.status != "destroyed")
                connection.destroy();
            queues.delete(interaction.guildId!);
            return;
        }

        const nextEntry = queues.get(interaction.guildId!)!.shift()!;
        const resource = await nextEntry.getResource();

        player.play(resource);
    });

    const initialEntry = queues.get(interaction.guildId!)!.shift()!;
    const initialResource = await initialEntry.getResource();

    player.play(initialResource);
    connection.subscribe(player)!;
}

export async function Stop(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    }

    if (queues.has(interaction.guildId!)) {
        queues.delete(interaction.guildId!);
    }

    getVoiceConnection(interaction.guildId!)?.destroy();

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Stopped playing sound`)] });
}

export async function ListQueue(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("I can't find the guild you are in")] });
    } else if (!queues.has(interaction.guildId!)) {
        return await interaction.editReply({ embeds: [Embed.CreateInfoEmbed("Nothing is playing")] });
    } else if (queues.get(interaction.guildId!)?.length == 0) {
        return await interaction.editReply({ embeds: [Embed.CreateInfoEmbed("Queue is empty")] });
    }

    let queue = "";
    
    for (let i = 0; i < queues.get(interaction.guildId!)!.length; ++i) {
        const entry = queues.get(interaction.guildId!)![i];
        const name = await entry.getName();

        queue += `${i + 1}. ${name} - ${entry.url}\n`;
    }

    await interaction.editReply({ embeds: [Embed.CreateEmbed("Queue list", Colors.Aqua, queue)] });
}