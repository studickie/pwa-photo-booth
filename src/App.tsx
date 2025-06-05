import './App.css'
import { useStoreContext } from './context/storeContext';
import { MediaStreamProvider } from './context/mediaStreamContext';
import CameraPage from './pages/cameraPage/CameraPage';
import ShowLoading from './components/ShowLoading';
import ShowError from './components/ShowError';

function App() {
    const { isLoading, hasError } = useStoreContext();
    return (
        <ShowError hasError={hasError}>
            <ShowLoading isLoading={isLoading} message='Store Loading...'>
                <MediaStreamProvider>
                    <CameraPage />
                </MediaStreamProvider>
            </ShowLoading>
        </ShowError>
    );
}

export default App;