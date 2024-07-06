import { CommandInteraction, ChatInputCommandInteraction, Message, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { load } from "cheerio";
import axios from "axios";
import Canvas from "@napi-rs/canvas";

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
        const logo = $(tds[1]).find("img").attr("src");
        const score = $(tds[2]).text();

        stats.push({ place, name, logo, score });
    });

    const width = 800;
    const rowHeight = 100;
    const paddingTop = 150;
    const height = stats.length * rowHeight + paddingTop;
    const imageSize = 50;
    const imageWidth = 120;

    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.fillStyle = "#505050";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "45px Georgia";
    context.fillStyle = "#FFFFFF";
    context.fillText("Hitpoint 3rd Division Summer Season", width / 2, 50);

    for (let i = 0; i < stats.length; i++) {
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.font = "40px Georgia";
        context.fillStyle = "#FFFFFF";
        const img = await Canvas.loadImage(stats[i].logo);
        context.drawImage(img, 50, i * rowHeight + paddingTop - imageSize / 2, imageWidth, imageSize);

        if (i == 0 || stats[i].place != stats[i - 1].place) {
            context.fillText(stats[i].place + ".", 25, i * rowHeight + paddingTop);
        } else {
            context.fillText("-", 25, i * rowHeight + paddingTop);
        }

        context.fillText(stats[i].name, 175, i * rowHeight + paddingTop);

        context.textAlign = "right";
        context.fillText(stats[i].score, width - 25, i * rowHeight + paddingTop);
    }

    const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "ingame_data.png" });
    await interaction.editReply({ files: [attachment] });
}