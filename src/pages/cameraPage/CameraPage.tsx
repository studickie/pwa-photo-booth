import { useMediaStreamContext } from '../../context/mediaStreamContext';
import ShowError from '../../components/ShowError';
import ShowLoading from '../../components/ShowLoading';
import CameraPlayback from './CameraPlayback';
import PhotoControls from './PhotoControls';
import { VideoPlayerProvider } from '../../context/videoPlayerContext';

interface Props {
    store: IDBDatabase
};

function CameraPage({ store }: Props) {
    const { isLoading, hasError, mediaStream } = useMediaStreamContext();
    return (
        <ShowError hasError={hasError}>
            <ShowLoading isLoading={isLoading} message='Camera Loading...'>
                <VideoPlayerProvider>
                    <CameraPlayback mediaStream={mediaStream} />
                    <PhotoControls 
                        mediaStream={mediaStream as MediaStream} 
                        store={store as IDBDatabase} />
                </VideoPlayerProvider>
            </ShowLoading>
        </ShowError>
    );
}

export default CameraPage;