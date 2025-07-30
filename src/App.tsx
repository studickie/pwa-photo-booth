import { useStoreContext } from './context/storeContext';
import { MediaStreamProvider } from './context/mediaStreamContext';
import CameraPage from './pages/cameraPage/CameraPage';
import ShowLoading from './components/ShowLoading';
import ShowError from './components/ShowError';
import './App.css';
// import GalleryPage from './pages/galleryPage/GalleryPage';
import { GalleryProvider } from './context/galleryContext';

function App() {
    const { isLoading, hasError, store } = useStoreContext();
    return (
        <ShowError hasError={hasError}>
            <ShowLoading isLoading={isLoading} message='Store Loading...'>
                <GalleryProvider>
                    <MediaStreamProvider>
                        <CameraPage store={store as IDBDatabase} />
                    </MediaStreamProvider>
                    {/* <GalleryPage store={store as IDBDatabase} /> */}
                </GalleryProvider>
            </ShowLoading>
        </ShowError>
    );
}

export default App;