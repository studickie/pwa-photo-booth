import useCapturePhoto from '../../hooks/useCapturePhoto';
import useStore from '../../hooks/useStore';
import type { GalleryPhoto } from '../../types/storeModel';

function PhotoControls() {

    const capturePhoto = useCapturePhoto('camera-playback');
    const { add } = useStore<GalleryPhoto>('gallery');

    const onCapturePhoto = () => {
        capturePhoto().then((imageBlob) => {
            add({ 
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