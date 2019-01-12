import * as React from "react";
import Requests from "requests";
import { error } from "utils/console";
import { audioInterface, AudioTrack } from "lib/AudioInterface";
import { AudioFile } from "lib/common";
import { samples_to_timestamp } from "utils/helpers";
import {AudioState} from "app/audio_store";
import StoreComponent from "lib/StoreComponent";

export default class Files extends StoreComponent<AudioState> {
    state: any;
    upload_input: HTMLElement;
    constructor(props) {
        super(audioInterface.store, props);
        this.state = {
            files: []
        };
        this.add_observer(["files.length","files.@each.name"], () => { this.forceUpdate(); });
    }
    fileInputSubmit(){
        let el = this.upload_input as HTMLInputElement;
        this.uploadFiles(el.files);
    }
    uploadFiles(files: FileList){
        var d = new FormData();

        // Better to do request per file, let them process in parallel
        //for (let i = 0; i < el.files.length; i++) {
        //    let file = el.files[i];
        //    d.append(`file${i}`, file);
        //}

        d.append(`file0`, files[0]);
        Requests.post("http://localhost:9095/decode",d, { responseType: "arraybuffer" }).then((arrayBuffer: any)=>{
            audioInterface.loadFile(arrayBuffer, files[0]).then((files) => { console.log('then',files); } );
        }).catch((xhr) => {
            error("Couldn't reach API", xhr);
        });
    }

    removeItem(index) { 
        audioInterface.dereferenceFile(index);
        this.forceUpdate();
    }
    undo(){
        audioInterface.undo();
        this.forceUpdate();
    }
    redo(){
        audioInterface.redo();
        this.forceUpdate();
    }
    renameFile(id){
        audioInterface.renameFile(id,"MY NEW NAME");
        this.forceUpdate();
    }
    addTrack(){
        audioInterface.store.dispatch("newTrack","asdf");
        this.forceUpdate();
    }
    addClip(){
        var file_id = audioInterface.files && audioInterface.files[0].id,
            track_id = audioInterface.tracks && audioInterface.tracks[0].id;
        audioInterface.store.dispatch("addClipToTrack", {track_id, file_id})
        this.forceUpdate();
    }
    play(){
        audioInterface.play();
    }
    stop(){
        audioInterface.stop();
    }

    dragEnter(evt: React.DragEvent) {
        this.setState({ is_dragging: true })
        evt.stopPropagation();
        evt.preventDefault();
    }
    dragLeave(evt: React.DragEvent) {
        this.setState({ is_dragging: false })
        evt.stopPropagation();
        evt.preventDefault();
    }
    dragOver(evt: React.DragEvent) {
        evt.stopPropagation();
        evt.preventDefault();
    }
    fileDrop(evt: React.DragEvent) {
        evt.stopPropagation();
        evt.preventDefault();
        this.uploadFiles(evt.dataTransfer.files);
        this.setState({ is_dragging: false });
    }
    fileDragStart(evt: React.DragEvent, file: AudioFile){
        evt.dataTransfer.setData("text/plain", file.id);
        evt.dataTransfer.dropEffect = 'copy';
        console.log('initializing drag');
    }
    render() {
        const files = audioInterface.files && audioInterface.files.map((file: AudioFile, idx) => {
            return (<li className="files-list-item" key={file.id}
                            draggable
                            onDragStart={evt=>this.fileDragStart(evt, file)}>
                        <div className="files-list-label">{file.file.name}</div>
                        <div className="files-list-timestamp">{samples_to_timestamp(file.file.length, file.file.sample_rate, false)}</div>
                        <div className="files-list-actions"><button className="icon-button-compact"><i className="mdi mdi-dots-horizontal"></i></button></div>
                    </li>);
        });
        const draggingText = this.state.is_dragging ? (<div className="files-dragging-text">Upload Files</div>) : null;
        return (<div className="files-window"
                        onDragEnter={evt => this.dragEnter(evt)} 
                        onDragLeave={evt => this.dragLeave(evt)}
                        onDragOver={evt => this.dragOver(evt)} 
                        onDrop={evt => this.fileDrop(evt)}>
            <div className="section-header">
                Project Files
                <div className="section-header-actions">
                    <input type="file" hidden ref={el=>this.upload_input=el} onChange={evt=>this.fileInputSubmit()} />
                    <button className="icon-button-compact" onClick={evt=>this.upload_input.click()}><i className="mdi mdi-plus"></i></button>
                </div>
            </div>
            <ul className="files-list">
                {files}
            </ul>
            { draggingText }
        </div>)
    }
}
/*
<!--
            <div>
                <input type="file" ref="file_uploader" />
                <button onClick={evt=>this.uploadFiles()}>Upload</button>
                <button onClick={evt=>this.undo()}>Undo</button>
                <button onClick={evt=>this.redo()}>Redo</button>
                <button onClick={evt=>this.addTrack()}>Add Track</button>
                <button onClick={evt=>this.addClip()}>Add Clip</button>
                <button onClick={evt=>this.play()}>Play</button>
                <button onClick={evt=>this.stop()}>Stop</button>
            </div>
            -->
            */