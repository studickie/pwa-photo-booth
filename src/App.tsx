import { useContext } from 'react';
import './App.css'
import { storeContext } from './context/storeContext';

function App() {
    const { isReady } = useContext(storeContext);
    return (
        <>
            {
                isReady
                    ? <p>Loaded IndexedDB</p>
                    : <p>Loading...</p>
            }
        </>
    );
}

export default App;