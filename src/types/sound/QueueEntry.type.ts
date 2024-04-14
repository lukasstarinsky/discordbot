import { createAudioResource } from "@discordjs/voice";
import play from "play-dl";

export enum QueueEntryType {
    Unknown = 0,
    Stream,
    Youtube
};

export class QueueEntry {
    type: QueueEntryType;
    url: string;

    constructor(type: QueueEntryType, url: string) {
        this.type = type;
        this.url = url;
    }

    async getName() {
        if (this.type == QueueEntryType.Youtube) {
            const yt_info = await play.video_info(this.url);

            if (yt_info.video_details.title)
                return yt_info.video_details.title;
        }

        return "Unknown";
    }

    async getResource() {
        if (this.type == QueueEntryType.Youtube) {
            const stream = await play.stream(this.url);

            return createAudioResource(stream.stream, {
                inputType: stream.type
            });
        }

        return createAudioResource(this.url);
    }
};