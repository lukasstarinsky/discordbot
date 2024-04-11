import { Schema, model } from "mongoose";

export type MessageDocument = Document & {
    message: string,
    response: string
};

const messageSchema = new Schema({
    message: {
        unique: true,
        type: String,
        required: true
    }, 
    response: {
        type: String,
        required: true
    }
});

export default model("message", messageSchema);