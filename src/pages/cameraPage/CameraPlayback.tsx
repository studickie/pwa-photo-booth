import { useEffect, useRef } from 'react';
import { useVideoPlayerContext } from '../../context/videoPlayerContext';

interface Props {
    mediaStream: MediaStream | null;
}

function CameraPlayback({ mediaStream }: Props) {

    const loadingRef = useRef<Boolean>(false);
    const videoRef = useVideoPlayerContext();
    
    useEffect(() => {
        // "playback doesn't necessarily start immediately after video.play() is executed" -- needs check to avoid error
        if (loadingRef.current === false && videoRef.current !== null) {
            loadingRef.current = true;
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().then(() => {
                loadingRef.current = false;
            });
        }
    }, [videoRef.current, mediaStream]);

    return (
        <div className='camera-playback-wrapper'>
            <video className='camera-playback-video' ref={videoRef}></video>
        </div>
    );
}

export default CameraPlayback;