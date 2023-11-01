import { ChatInputCommandInteraction } from "discord.js";
import * as Embed from "~/utils/embed";
import BotData from "~/models/botdata";

async function SendMovieListMessage(interaction: ChatInputCommandInteraction) {
    const botData = await BotData.findOne({ guildId: interaction.guildId });
    const movies = botData!.movies;
    const moviesWatched = movies.filter(movie => movie.watched).map(movie => movie.name);
    const moviesNotWatched = movies.filter(movie => !movie.watched).map(movie => movie.name);

    await interaction.deleteReply();
    const messages = await interaction.channel!.messages.fetch({ limit: 5 });
    messages.forEach(async message => {
        await message.delete();
    });
    let message = "----- ***Watched*** -----\n";
    message += moviesWatched.length > 0 ? `~~${moviesWatched.join('\n')}~~\n`: ``;
    message += "\n--- ***Not Watched*** ---\n";
    message += (moviesNotWatched.length > 0 ? `**${moviesNotWatched.join('\n')}**`: ``);
    await interaction.channel!.send({ embeds: [Embed.CreateInfoEmbed(message)] });
}

export async function Handle(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action");
    const data = interaction.options.getString("data");
    const botData = await BotData.findOne({ guildId: interaction.guildId });
    const movies = botData!.movies;
    const movieNames = movies.map((x) => x.name);

    switch (action) {
        case "add":
            let notAdded: string[] = [];
            data!.split(",").forEach(async (movie) => {
                if (movieNames.includes(movie)) {
                    notAdded.push(movie);
                    return;
                }

                BotData.updateOne({ guildId: interaction.guildId }, { $push: { movies: { name: movie } } })
                    .then(async () => {
                        await SendMovieListMessage(interaction);
                    });
            });

            break;
        case "all":
            await SendMovieListMessage(interaction);
            break;
        case "markwatched":
            let notMarked: string[] = [];
            data!.split(",").forEach(async (movie) => {
                if (!movieNames.includes(movie)) {
                    notMarked.push(movie);
                    return;
                }

                BotData.updateOne({ guildId: interaction.guildId, "movies.name": movie }, { $set: { "movies.$.watched": true } })
                    .then(async () => {
                        await SendMovieListMessage(interaction);
                    })
            });
            break;
        case "random":
            const moviesNotWatched = movies.filter(movie => !movie.watched).map(movie => movie.name);
            const outMovie = moviesNotWatched[Math.floor(Math.random() * moviesNotWatched.length)];
            await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Randomly selected movie: **${outMovie}**`)] });
            break;
    }
}