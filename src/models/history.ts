import { Schema, model } from "mongoose";

const historySchema = new Schema({
    summoner: {
        type: String,
        required: true
    }, 
    history: [{
        type: String,
        required: false
    }]
});

export default model("history", historySchema, "histories");