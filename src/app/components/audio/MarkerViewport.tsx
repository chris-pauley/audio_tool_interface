import * as React from "react";
import StoreComponent from "lib/StoreComponent";
import { StoreType } from "app/audio_store";
import { audioInterface } from "lib/AudioInterface";
import { seconds_to_timestamp } from "utils/helpers";

interface MarkerViewportProps {
    editor: React.RefObject<HTMLDivElement>
}

export default class MarkerViewport extends StoreComponent<StoreType, MarkerViewportProps> {
    ctx: CanvasRenderingContext2D;
    editorEl: any;
    constructor(props: MarkerViewportProps) {
        super(audioInterface.store, props);
        var markerViewportObserver = () => { this.forceUpdate() };
        this.store.add_observer(["editorInfo.window_scale", "editorInfo.current_position"], markerViewportObserver);
    }

    componentDidUpdate() {
        if (!this.editorEl) {
            this.editorEl = this.props.editor.current;
            if (!this.editorEl)
                return;
            this.editorEl.addEventListener('scroll', this.scroll.bind(this));
        }
        this.ctx = (this.refs.canvas as HTMLCanvasElement).getContext('2d');
        var canvas = this.refs.canvas as HTMLCanvasElement;
        canvas.height = this.editorEl.clientHeight;
        canvas.width = this.editorEl.clientWidth;
        this.scroll();
    }

    get editorInfo() {
        return this.store.state.editorInfo;
    }

    pixels_to_seconds(pixel_width) {
        return (pixel_width / (this.editorInfo.project_length * this.editorInfo.window_scale)) * (this.editorInfo.project_length);
    }
    seconds_to_pixels(seconds) {
        return (seconds * (this.editorInfo.project_length * this.editorInfo.window_scale)) / (this.editorInfo.project_length);
    }
    nearestPow10(num) {
        return Math.pow(10, Math.floor(Math.log10(num)));
    }

    scroll() {
        window.requestAnimationFrame(() => {
            var parent = this.editorEl,
                ctx = this.ctx,
                canvas = this.refs.canvas as HTMLCanvasElement;
            if (this.refs.canvas && parent) {
                var start = this.pixels_to_seconds(parent.scrollLeft),
                    end = start + this.pixels_to_seconds(parent.clientWidth);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.strokeStyle = "#FFFFFF";

                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();

                    var grouping = this.nearestPow10(this.pixels_to_seconds(700)),
                        grouping_size = this.seconds_to_pixels(grouping),
                        precision_str = grouping + '',
                        precision_idx = precision_str.indexOf('.'),
                        subdivisions = [],
                        idx;

                    if (precision_idx > -1) {
                        let conv = Math.pow(10, precision_str.length - (precision_idx + 1));
                        idx = Math.round(start * conv) / conv;
                    } else {
                        let conv = Math.pow(10, 1 - (precision_str.length));
                        idx = Math.round(start * conv) / conv;
                    }

                    while (idx < Math.ceil(end)) {
                        var xpos = this.seconds_to_pixels(idx) - parent.scrollLeft;

                        ctx.moveTo(xpos, 0);
                        ctx.lineTo(xpos, canvas.height);

                        // subdivisions can easily be configurable
                        for (var sub = 1; sub <= 4; sub++) {
                            subdivisions.push(xpos + ((grouping_size / 4) * sub));
                        }

                        ctx.fillText(seconds_to_timestamp(idx), xpos + 10, 10);

                        idx += grouping;
                    }
                    ctx.stroke();

                    ctx.globalAlpha = 0.1;
                    ctx.beginPath();
                    for (let x = 0; x < subdivisions.length; x++) {
                        ctx.moveTo(subdivisions[x], 0);
                        ctx.lineTo(subdivisions[x], canvas.height);
                    }
                    ctx.stroke();

                }
                ctx.restore();
            }
        });
    }

    render() {
        return (<canvas className="marker-viewport" ref="canvas" />)
    }

    componentWillUnmount() {
        this.editorEl.removeEventListener("scroll", this.scroll);
    }
}