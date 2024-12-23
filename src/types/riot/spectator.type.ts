export type CurrentGameInfoDTO = {
    gameId: number,
    gameType: string,
    gameStartTime: number,
    mapId: number,
    gameLength: number,
    platformId: string,
    gameMode: string,
    bannedChampions: BannedChampionDTO[],
    gameQueueConfigId: number,
    observers: ObserverDTO,
    participants: CurrentGameParticipantDTO[]
}

export type BannedChampionDTO = {
    pickTurn: number,
    championId: number,
    teamId: number
}

export type CurrentGameParticipantDTO = {
    championId: number,
    perks: PerksDTO,
    profileIconId: number,
    bot: boolean,
    teamId: number,
    summonerId: string,
    puuid: string,
    spell1Id: number,
    spell2Id: number,
    gameCustomizationObjects: GameCustomizationObjectDTO[]
}

export type ObserverDTO = {
    encryptionKey: string
}

export type PerksDTO = {
    perkIds: number[],
    perkStyle: number,
    perkSubStyle: number
}

export type GameCustomizationObjectDTO = {
    category: string,
    content: string
}