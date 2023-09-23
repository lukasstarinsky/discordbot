import { Schema, model } from "mongoose";

const watchlistSchema = new Schema({
    summoners: [{
        type: String,
        required: true
    }]
});

export default model("watchlist", watchlistSchema);