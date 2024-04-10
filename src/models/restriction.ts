import { Schema, model } from "mongoose";

const restrictionSchema = new Schema({
    user: {
        unique: true,
        type: String,
        required: true
    }, 
    until: {
        type: Date,
        required: true
    }
});

export default model("restriction", restrictionSchema);