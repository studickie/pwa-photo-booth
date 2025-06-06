import { useGalleryContext } from '../../context/galleryContext';
import { useVideoPlayerContext } from '../../context/videoPlayerContext';
import useCapturePhoto from '../../hooks/useCapturePhoto';
import useStore from '../../hooks/useStore';
import { getActiveTrackSettings } from '../../services/mediaStream';
import type { GalleryPhoto } from '../../types/storeModel';

interface Props {
    mediaStream: MediaStream;
    store: IDBDatabase;
}

function PhotoControls({ mediaStream, store }: Props ) {

    const videoRef = useVideoPlayerContext();
    const { dispatch: galleryDispatch } = useGalleryContext();
    const { add: addGalleryPhoto } = useStore<GalleryPhoto>(store, 'gallery-photos');
    const capturePhoto = useCapturePhoto();

    const onCapturePhoto = () => {
        const { width, height } = getActiveTrackSettings(mediaStream);
        capturePhoto(videoRef.current, { width, height }).then((imageBlob) => {
            const data = { 
                createdOn: new Date(),
                blob: imageBlob
            };
            addGalleryPhoto(data).then((id) => {
                console.log('created image', id);
                galleryDispatch({ type: 'addEntry', entry: { id, ...data }});
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