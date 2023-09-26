import { ButtonBuilder } from "discord.js"

type MineGame = {
    buttons: ButtonBuilder[],
    mines: number[],
    isOver: boolean,
    isWin: boolean
}

export default MineGame;