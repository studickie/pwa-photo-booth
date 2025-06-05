import { useEffect } from 'react';
import { useVideoPlayerContext } from '../../context/videoPlayerContext';

interface Props {
    mediaStream: MediaStream | null;
}

function CameraPlayback({ mediaStream }: Props) {

    const videoRef = useVideoPlayerContext();
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
        }
    }, [videoRef, mediaStream]);

    return (
        <video id='camera-playback' ref={videoRef} width='1280px' height='720px'></video>
    );
}

export default CameraPlayback;