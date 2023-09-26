import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import * as Embed from "~/utils/embed";
import MineGame from "~/types/minigames/minegame.type";

const NewGame = (): MineGame => {
    let game: MineGame = { buttons: Array(25).fill(new ButtonBuilder()), mines: [], isOver: false, isWin: false };

    for (let i = 0; i < 5; ++i) {
        for (let j = 0; j < 5; ++j) {
            game.buttons[i * 5 + j] = new ButtonBuilder()
                .setCustomId(`btn-${i * 5 + j}`)
                .setLabel("⁪")
                .setStyle(ButtonStyle.Secondary);
        }
    }

    while (game.mines.length != 3) {
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
    const title = `Mines 5x5 (started by ${interaction.user.username})`;

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
        }

        if (game.isOver) {
            DisableAllButtons(game);
            await x.update({ embeds: [Embed.CreateInfoEmbed(`Game over, you ${game.isWin ? "win" : "lose"}!`, title)], components: [...rows as any] });
            collector.stop();
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