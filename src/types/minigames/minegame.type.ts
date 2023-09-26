import { ButtonBuilder } from "discord.js"

type MineGame = {
    buttons: ButtonBuilder[],
    mines: number[],
    revealed: number[],
    isOver: boolean,
    isWin: boolean
}

export default MineGame;