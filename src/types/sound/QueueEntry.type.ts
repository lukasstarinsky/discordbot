import { QueueEntryType } from './QueueEntryType.type';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus,  NoSubscriberBehavior, getVoiceConnection, VoiceConnection, PlayerSubscription, AudioResource } from "@discordjs/voice";
import play from 'play-dl';

export class QueueEntry {
  type: QueueEntryType;
  url: string;

  constructor(type: string, url: string) {
    this.type = QueueEntry.getType(type);
    this.url = url;
  }

  async getName() {
    switch (this.type) {
      case QueueEntryType.Youtube:
        const yt_info = await play.video_info(this.url);

        if (yt_info.video_details.title)
          return yt_info.video_details.title;
      default:
        return "Unknown";
    }
  }

  static getType(type: string): QueueEntryType {
    switch (type) {
      case "stream":
        return QueueEntryType.Stream;
      case "yt":
        return QueueEntryType.Youtube;
      default:
        return QueueEntryType.Stream;
    }
  }

  async getResource() {
    switch (this.type) {
      case QueueEntryType.Youtube:
        const stream = await play.stream(this.url)

        return createAudioResource(stream.stream, {
            inputType: stream.type
        });
      default:
        return createAudioResource(this.url);
    }
  }

};