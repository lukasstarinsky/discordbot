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
        name: {
            type: String,
            required: true
        },
        watched: {
            type: Boolean,
            default: false
        }
    }]
});

export default model("bot-data", botDataScheme, "bot-datas");