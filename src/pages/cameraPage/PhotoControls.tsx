import { useVideoPlayerContext } from '../../context/videoPlayerContext';
import useCapturePhoto from '../../hooks/useCapturePhoto';
import useStore from '../../hooks/useStore';
import { getActiveTrackSettings } from '../../services/mediaStream';
import type { GalleryPhoto } from '../../types/storeModel';

interface Props {
    mediaStream: MediaStream | null;
}

function PhotoControls({ mediaStream }: Props ) {

    const videoRef = useVideoPlayerContext();
    const capturePhoto = useCapturePhoto();
    const { add: addGalleryPhoto } = useStore<GalleryPhoto>('gallery-photos');

    const onCapturePhoto = () => {
        const { width, height } = getActiveTrackSettings(mediaStream);
        capturePhoto(videoRef.current, { width, height }).then((imageBlob) => {
            addGalleryPhoto({ 
                createdOn: new Date(),
                blob: imageBlob
            }).then((id) => {
                console.log('created image', id);
            });
        });
    }

    return (
        <div>
            <button onClick={onCapturePhoto}>Click!</button>
        </div>
    );
}

export default PhotoControls;