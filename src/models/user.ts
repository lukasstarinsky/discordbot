import { Schema, model } from "mongoose";

const userSchema = new Schema({
    id: {
        type: String,
        required: true
    }, 
    money: {
        type: Number,
        required: false,
        default: 50000
    }
});

export default model("user", userSchema);