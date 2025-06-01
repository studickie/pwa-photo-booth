import { useContext } from 'react';
import { mediaStreamContext } from '../context/mediaStreamContext';
import { getActiveTrackSettings } from '../services/mediaStream';

const useCapturePhoto = (videoId: string) => {
    const { mediaStream } = useContext(mediaStreamContext);
    return (): Promise<Blob> => new Promise((resolve, reject) => {
        // get active track
        const activeTrack = getActiveTrackSettings(mediaStream);
        const trackWidth = activeTrack.width as number;
        const trackHeight = activeTrack.height as number;

        // ? HTMLCanvasElement method 'drawImage' accepts HTMLVideoElement only because interface is comparable with expected HTMLImageElement
        const video = document.getElementById(videoId) as HTMLImageElement;
        const canvas = document.createElement('canvas');
        canvas.width = trackWidth;
        canvas.height = trackHeight;
        // todo: 'getContext' possibly returns null; add error handling
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // const dataUrl = canvas.toDataURL('image/jpeg');
        canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg');
    });
}

export default useCapturePhoto;