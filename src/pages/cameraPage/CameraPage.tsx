import { useMediaStreamContext } from '../../context/mediaStreamContext';
import ShowError from '../../components/ShowError';
import ShowLoading from '../../components/ShowLoading';
import CameraPlayback from './CameraPlayback';
import PhotoControls from './PhotoControls';
import { VideoPlayerProvider } from '../../context/videoPlayerContext';

function CameraPage() {

    const { isLoading, hasError, mediaStream } = useMediaStreamContext();
    
    return (
        <ShowError hasError={hasError}>
            <ShowLoading isLoading={isLoading} message='Camera Loading...'>
                <VideoPlayerProvider>
                    <CameraPlayback mediaStream={mediaStream} />
                    <PhotoControls mediaStream={mediaStream} />
                </VideoPlayerProvider>
            </ShowLoading>
        </ShowError>
    );
}

export default CameraPage;