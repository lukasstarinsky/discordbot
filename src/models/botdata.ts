import { Schema, model } from "mongoose";

const botDataScheme = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    watchlist: [{
        type: String,
        required: true
    }],
    movies: [{
        type: String,
        required: true
    }]
});

export default model("bot-data", botDataScheme, "bot-datas");