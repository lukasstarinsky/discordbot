import { CommandInteraction, ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import { load } from "cheerio";
import axios from "axios";

export async function HitPointStats(interaction: CommandInteraction) {
    const url = "https://lol.fandom.com/wiki/Hitpoint_3rd_Division/2024_Season/Summer_Season";
    const response = await axios.get(url);

    const $ = load(response.data);
    const table = $(".standings tr");
    const stats: any[] = [];

    table.each((i, el) => {
        const tds = $(el).find("td");
        const place = Number($(tds[0]).text());

        if (isNaN(place) || place == 0) return;

        const name = $(tds[1]).text();
        const score = $(tds[2]).text();
        stats.push({ place, name, score });
    });

    const embed = new EmbedBuilder()
        .setTitle("Hitpoint 3rd Division 2024 Summer Season")
        .setColor(0x00fdfd);

    stats.forEach((s) => { 
        embed.addFields({ name: s.place + ". " + s.name, value: "**" + s.score + "**" });
    });

    interaction.editReply({ embeds: [embed] });
}