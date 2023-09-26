import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
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

    while (game.mines.length != 4) {
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

    if (user.money! < bet) {
        interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Insufficient balance (your balance: ${user.money}$)`)] });
        return;
    }

    const title = `Mines 5x5 for ${bet}$, possible win: ${bet * 14}$ (started by ${interaction.user.username})`;

    const game = NewGame();
    const rows = CreateActionRow(game);
    const response = await interaction.editReply({ embeds: [Embed.CreateInfoEmbed("", title)], components: [...rows as any] });
    
    const collector = response.createMessageComponentCollector({ time: 30_000 });

    collector.on("collect", async x => {
        if (x.user.id !== interaction.user.id) {
            x.reply({ embeds: [Embed.CreateErrorEmbed("This session is not yours!")], ephemeral: true });
            return;
        }

        const index = parseInt(x.customId.slice(4));
        const button = game.buttons.at(index)!;

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
            game.revealed.push(index);

            if (game.revealed.length == game.buttons.length - game.mines.length) {
                game.isOver = true;
                game.isWin = true;
            }
        }

        if (game.isOver) {
            DisableAllButtons(game);
            collector.stop();

            if (game.isWin) {
                await x.update({ embeds: [Embed.CreateInfoEmbed(`Game over, you win ${bet * 14}$`, title)], components: [...rows as any] });
                await User.updateOne({ id: interaction.user.id }, { $inc: { money: bet * 14 } });
            } else {
                await x.update({ embeds: [Embed.CreateInfoEmbed(`Game over, you lost ${bet}$`, title)], components: [...rows as any] });
                await User.updateOne({ id: interaction.user.id }, { $inc: { money: -bet } });
            }
        } else {
            await x.update({ embeds: [Embed.CreateInfoEmbed("", title)], components: [...rows as any] });
            collector.resetTimer();
        }
    });

    collector.on('end', async x => {
        if (!game.isOver)
            await response.edit({ embeds: [Embed.CreateInfoEmbed("This game is no longer active (didn't receive input in more than 30 seconds).", title)], components: [] });
    });
}