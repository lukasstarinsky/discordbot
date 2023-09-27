import { ChatInputCommandInteraction } from "discord.js";
import * as Embed from "~/utils/embed";
import BotData from "~/models/botdata";

export async function Handle(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const action = interaction.options.getString("action");
        const data = interaction.options.getString("data");
        const botData = await BotData.findOne({ guildId: interaction.guildId });
        const movies = botData!.movies;
        const movieNames = movies.map((x) => x.name);
        const moviesWatched = movies.filter(movie => movie.watched).map(movie => movie.name).join('\n');
        const moviesNotWatched = movies.filter(movie => !movie.watched).map(movie => movie.name).join('\n');

        switch (action) {
            case "add":
                let notAdded: string[] = [];
                data!.split(",").forEach(async (movie) => {
                    if (movieNames.includes(movie)) {
                        notAdded.push(movie);
                        return;
                    }

                    await BotData.updateOne({ guildId: interaction.guildId }, { $push: { movies: { name: movie } } });
                });

                if (notAdded.length != 0)
                    await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`These movies are already in list: **${notAdded}**`)] });
                else
                    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed("Movies added successfully")] });

                break;
            case "all":
                let message = moviesWatched.length > 0 ? `**~~${moviesWatched}~~**\n`: ``;
                message += (moviesNotWatched.length > 0 ? `**${moviesNotWatched}**`: ``);
                await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(message)] });

                break;
            case "watched":
                await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(moviesWatched.length > 0 ? `**~~${moviesWatched}~~**`: ``)] });

                break;
            case "notwatched":
                await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(moviesNotWatched.length > 0 ? `**${moviesNotWatched}**`: ``)] });

                break;
            case "markwatched":
                let notMarked: string[] = [];
                data!.split(",").forEach(async (movie) => {
                    if (!movieNames.includes(movie)) {
                        notMarked.push(movie);
                        return;
                    }

                    await BotData.updateOne({ guildId: interaction.guildId, "movies.name": movie }, { $set: { "movies.$.watched": true } });
                });

                if (notMarked.length != 0)
                    await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`These movies were not marked: **${notMarked}**`)] });
                else
                    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed("Movies marked successfully")] });

                break;
            case "random":
                break;
        }
    } catch(err: any) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("Something went wrong.")] });
        console.error(err);
    }
}