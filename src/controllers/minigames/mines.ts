import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import * as Embed from "~/utils/embed";
import MineGame from "~/types/minigames/minegame.type";
import User from "~/models/user";

const CreateNewGame = (mineCount: number): MineGame => {
    let game: MineGame = { buttons: Array(25).fill(new ButtonBuilder()), revealed: [], mines: [], isOver: false, isWin: false };

    for (let i = 0; i < 5; ++i) {
        for (let j = 0; j < 5; ++j) {
            game.buttons[i * 5 + j] = new ButtonBuilder()
                .setCustomId(`btn-${i * 5 + j}`)
                .setLabel("⁪")
                .setStyle(ButtonStyle.Secondary);
        }
    }

    while (game.mines.length != mineCount) {
        const mine = Math.floor(Math.random() * game.buttons.length);

        if (!game.mines.includes(mine))
            game.mines.push(mine);
    }

    return game;
}

const CreateActionRows = (game: MineGame): ActionRowBuilder[] => {
    let rows: ActionRowBuilder[] = [];
    for (let i = 0; i < 5; ++i) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 5; ++j) {
            row.addComponents(game.buttons[i * 5 + j]);
        }
        rows.push(row);
    }

    return rows;
}

const DisableAllButtons = (game: MineGame) => {
    game.buttons.forEach((button, i) => {
        button.setDisabled(true);

        if (game.mines.includes(i)) {
            button.setStyle(ButtonStyle.Danger);
            button.setEmoji("💣");
        }
    });
}

const CalculateWin = (fields: number, mines: number, revealed: number, bet: number): number => {
    let percentage = 1.0;
    for (let i = 0; i < revealed; ++i) {
        percentage *= 1 - (mines / (fields - i));
    }

    return Math.round(bet * (1 / percentage));
}

export async function Handle(interaction: ChatInputCommandInteraction) {
    const user = await User.findOne({ id: interaction.user.id });
    if (!user)
        return;

    const bet = Math.floor(interaction.options.getNumber("bet")!);

    if (user.money! < bet || bet < 0) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Insufficient balance (Your balance: **${user.money!.toLocaleString("sk-SK")}$**)`)] });
        return;
    }
    await user.updateOne({ $inc: { money: -bet } });

    const game = CreateNewGame(5);
    const title = `Mines 5x5 - ${game.mines.length} mines`;
    const rows = CreateActionRows(game);
    let win = bet;
    const message = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x000)
        .setFields(
            { name: "Bet", value: `**${bet.toLocaleString("sk-SK")}$**`, inline: true },
            { name: "Possible win", value: `**${CalculateWin(game.buttons.length, game.mines.length, game.buttons.length - game.mines.length, bet).toLocaleString("sk-SK")}$**`, inline: true },
            { name: "Current cashout", value: `**${win.toLocaleString("sk-SK")}$**` },
            { name: "Player", value: `${interaction.user}`, inline: true }
        )
        .setFooter({ text: "Do not interact for 15 seconds to cashout." });

    const response = await interaction.editReply({ embeds: [message], components: [...rows as any] });
    const collector = response.createMessageComponentCollector({ time: 15_000 });

    collector.on("collect", async x => {
        if (x.user.id !== interaction.user.id) {
            await x.reply({ embeds: [Embed.CreateErrorEmbed("This session is not yours!")], ephemeral: true });
            return;
        }

        const index = parseInt(x.customId.slice(4));
        const button = game.buttons.at(index)!;
        game.revealed.push(index);

        if (game.mines.includes(index)) {
            button.setEmoji("💣");
            button.setDisabled(true);
            button.setStyle(ButtonStyle.Danger);
            game.isOver = true;
            game.isWin = false;
        } else {
            button.setLabel("💎");
            button.setDisabled(true);
            button.setStyle(ButtonStyle.Primary);

            win = CalculateWin(game.buttons.length, game.mines.length, game.revealed.length, bet);
            message.setFields(
                { name: "Bet", value: `**${bet.toLocaleString("sk-SK")}$**`, inline: true },
                { name: "Possible win", value: `**${CalculateWin(game.buttons.length, game.mines.length, game.buttons.length - game.mines.length, bet).toLocaleString("sk-SK")}$**`, inline: true },
                { name: "Current cashout", value: `**${win.toLocaleString("sk-SK")}$**` },
                { name: "Player", value: `${interaction.user}`, inline: true }
            );

            if (game.revealed.length == game.buttons.length - game.mines.length) {
                game.isOver = true;
                game.isWin = true;
            }
        }

        if (game.isOver) {
            DisableAllButtons(game);
            collector.stop();

            if (game.isWin) {
                await x.update({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, you win **${win.toLocaleString("sk-SK")}$**`)], components: [...rows as any] });
                await user.updateOne({ $inc: { money: win } });
            } else {
                await x.update({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, you lost **${bet.toLocaleString("sk-SK")}$**`)], components: [...rows as any] });
            }
        } else {
            await x.update({ embeds: [message], components: [...rows as any] });
            collector.resetTimer();
        }
    });

    collector.on('end', async x => {
        if (!game.isOver) {
            DisableAllButtons(game);
            await response.edit({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, cashout **${win.toLocaleString("sk-SK")}$**`)], components: [...rows as any] });
            await user.updateOne({ $inc: { money: win } });
        }
    });
}