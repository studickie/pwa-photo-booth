import { useEffect } from 'react';

interface Props {
    source: MediaStream;
}

function CameraPlayback({ source }: Props) {

    useEffect(() => {
        const element = document.getElementById('camera-playback') as HTMLMediaElement;
        element.srcObject = source;
        element.play();
    }, [source]);

    return (
        <div>
            <video id='camera-playback'></video>
        </div>
    );
}

export default CameraPlayback;