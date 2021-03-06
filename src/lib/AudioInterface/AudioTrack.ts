import { audioInterface } from "./index";
import AudioClip from "./AudioClip";
import { make_guid } from "utils/helpers";


export default class AudioTrack {
    public clips: Array<AudioClip> = [];
    public id: string;
    public name: string;
    public color: string;
    public gain: number = 1;
    public mute: boolean = false;
    public solo: boolean = false;
    constructor({ id, name, color, clips }: { id?: string, name?: string, color?: string, clips?: Array<any> }) {
        this.id = id || make_guid();
        this.name = name;
        this.color = color;
        if (clips) {
            this.clips = clips.map((clipObj) => {
                return new AudioClip(clipObj);
            });
        }
    }

    addClipFromFile(file_id: string) {
        audioInterface.store.dispatch('addClipToTrack', { track_id: this.id, file_id })
    }
    removeClips(clips) {
        audioInterface.store.dispatch('removeClipsFromTrack', { track_id: this.id, clips })
    }
}