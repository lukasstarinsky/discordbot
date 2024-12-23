import { CommandInteraction, ChatInputCommandInteraction, Message } from "discord.js";
import Insults from "~/data/insults";
import User from "~/models/user";
import MessageContainEntity, { MessageDocument } from "~/models/message";
import * as Embed from "~/utils/embed";

let messageContains: Array<MessageDocument> = [];

export async function Insult(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user");
    await interaction.editReply("<@" + user + "> " + Insults[Math.floor(Math.random() * Insults.length)]);
}

export async function CheckMessage(message: Message) {
    if (message.author.bot)
        return;

    const messageLower = message.content.toLowerCase();

    messageContains.forEach(record => {
        if (messageLower.includes(record.message) && record.response.length > 1) {
            message.reply(record.response);
        }
    });
}

export async function AddMessage(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message")!.toLowerCase();
    const response = interaction.options.getString("response");

    await MessageContainEntity.findOneAndUpdate({ message: message }, { response: response }, { upsert: true, new: true, setDefaultsOnInsert: true });

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Response set !`)] });

    await UpdateMessage();
}

export async function UpdateMessage() {
    messageContains = await MessageContainEntity.find({});
}

export async function Balance(interaction: CommandInteraction) {
    const user = await User.findOne({ id: interaction.user.id });
    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Your balance is **${user!.money?.toLocaleString("sk-SK")}$**`)] });
}

export async function Top10(interaction: CommandInteraction) {
    const users = await User.find({"money": {$ne : 50000}}).sort({"money":-1}).limit(10); // Selects (max) 10 users desc by balance (excluding users with 50k bal)
    
    let text: string = "";
    let i: number = 1;
    users.forEach(user => {
        text += `**${i}.** <@${user.id}>: **${user.money?.toLocaleString("sk-SK")} $**\n`;
        ++i;
    })

    await interaction.editReply({ embeds: [Embed.CreateEmbed("TOP 10 User Balance", 0x00FFFF, text)] });
}