import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import * as Embed from "~/utils/embed";
import MineGame from "~/types/minigames/minegame.type";
import User from "~/models/user";

const NewGame = (): MineGame => {
    let game: MineGame = { buttons: Array(25).fill(new ButtonBuilder()), revealed: [], mines: [], isOver: false, isWin: false };

    for (let i = 0; i < 5; ++i) {
        for (let j = 0; j < 5; ++j) {
            game.buttons[i * 5 + j] = new ButtonBuilder()
                .setCustomId(`btn-${i * 5 + j}`)
                .setLabel("⁪")
                .setStyle(ButtonStyle.Secondary);
        }
    }

    while (game.mines.length != 5) {
        const mine = Math.floor(Math.random() * 26);
        game.mines.push(mine);
    }

    return game;
}

const CreateActionRow = (game: MineGame): ActionRowBuilder[] => {
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
    game.buttons.forEach(button => {
        button.setDisabled(true);
    });
}

export async function Handle(interaction: ChatInputCommandInteraction) {
    const user = await User.findOne({ id: interaction.user.id });
    if (!user)
        return;

    const bet = interaction.options.getNumber("bet")!;

    if (user.money! < bet || bet < 0) {
        interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Insufficient balance (Your balance: **${user.money}$**)`)] });
        return;
    }

    const game = NewGame();
    const title = `Mines 5x5 - ${game.mines.length} mines`;
    const rows = CreateActionRow(game);
    let win = game.revealed.length > 0 ? bet * game.revealed.length * 1.2 : bet;
    const message = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x000)
        .setFields(
            { name: "Bet", value: `**${bet}$**`, inline: true },
            { name: "Possible win", value: `**${bet * (game.buttons.length - game.mines.length) * 1.2}$**`, inline: true },
            { name: "Current cashout", value: `**${win}$**` },
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
            button.setLabel("⁪");
            button.setDisabled(true);
            button.setStyle(ButtonStyle.Success);
            win = bet * game.revealed.length * 1.2;
            message.setFields(
                { name: "Bet", value: `**${bet}$**`, inline: true },
                { name: "Possible win", value: `**${bet * (game.buttons.length - game.mines.length) * 1.2}$**`, inline: true },
                { name: "Current cashout", value: `**${win}$**` },
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
                await x.update({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, you win **${win}$**`)], components: [...rows as any] });
                await User.updateOne({ id: interaction.user.id }, { $inc: { money: win } });
            } else {
                await x.update({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, you lost **${bet}$**`)], components: [...rows as any] });
                await User.updateOne({ id: interaction.user.id }, { $inc: { money: -bet } });
            }
        } else {
            await x.update({ embeds: [message], components: [...rows as any] });
            collector.resetTimer();
        }
    });

    collector.on('end', async x => {
        if (!game.isOver) {
            DisableAllButtons(game);
            await response.edit({ embeds: [Embed.CreateEmbed(title, 0x000, `Game over, cashout **${win}$**`)], components: [...rows as any] });
            await User.updateOne({ id: interaction.user.id }, { $inc: { money: win } });
        }
    });
}