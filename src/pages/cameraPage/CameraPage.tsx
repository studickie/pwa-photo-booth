import { useContext } from 'react';
import { mediaStreamContext } from '../../context/mediaStreamContext';
import ShowError from '../../components/ShowError';
import ShowLoading from '../../components/ShowLoading';
import CameraPlayback from './CameraPlayback';
import PhotoControls from './PhotoControls';

function CameraPage() {
    const { isLoading, hasError, mediaStream } = useContext(mediaStreamContext);
    return (
        <ShowError hasError={hasError}>
            <ShowLoading isLoading={isLoading} message='Camera Loading...'>
                <CameraPlayback source={mediaStream}/>
                <PhotoControls />
            </ShowLoading>
        </ShowError>
    );
}

export default CameraPage;