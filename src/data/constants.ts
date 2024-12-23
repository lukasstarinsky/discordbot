const Constants = {
    LOL_PATCH: "14.24.1"    
}

const Urls = {
    CLASSIC_DUCK: "https://images-ext-1.discordapp.net/external/9XjtWykrwHupmNH8M1nT-9oELKgpHmsW-Ho3eWV86CY/%3Fsize%3D48/https/cdn.discordapp.com/emojis/1058849393370992650.gif",
    LAUGHING_CAT: "https://tenor.com/view/laughing-cat-catlaughing-laughingcat-point-gif-7577620470218150413",
    DDRAGON_BASE: `https://ddragon.leagueoflegends.com/cdn/${Constants.LOL_PATCH}`,
    DDRAGON_CHAMPIONS: `https://ddragon.leagueoflegends.com/cdn/${Constants.LOL_PATCH}/data/en_US/champion.json`,
    DDRAGON_CHAMPION_ICON: `https://ddragon.leagueoflegends.com/cdn/${Constants.LOL_PATCH}/img/champion/`
}

export { Constants, Urls };