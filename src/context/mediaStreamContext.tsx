import { createContext, useContext, useEffect, useReducer, type PropsWithChildren } from 'react';

interface MediaStreamState {
    isLoading: Boolean;
    hasError: Boolean;
    mediaStream: MediaStream | null;
};

type MediaStreamStateAction = {
    type: 'connectSuccess',
    mediaStream: MediaStream
} | {
    type: 'connectError'
};

function reducer(state: MediaStreamState, action: MediaStreamStateAction) {
    const { type } = action;
    switch (type) {
        case 'connectSuccess':
            return {
                ...state,
                isLoading: false,
                hasError: false,
                mediaStream: action.mediaStream
            };
        case 'connectError':
            return {
                ...state,
                isLoading: false,
                hasError: true,
                mediaStream: null
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    };
}

/*
    Media Stream Context:
    
    Trigger a request for user-media permissions, Provide
    subscribers with access resulting MediaStream instance
*/

interface MediaStreamContext extends MediaStreamState {};

const mediaStreamContext = createContext(({} as MediaStreamContext));

interface Props extends PropsWithChildren { };

export function MediaStreamProvider({ children }: Props) {

    const [state, dispatch] = useReducer(reducer, {
        isLoading: true,
        hasError: false,
        mediaStream: null
    });

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(result => {
            dispatch({ type: 'connectSuccess', mediaStream: result });
        }).catch(error => {
            console.log('MediaStream Error - ', error);
            dispatch({ type: 'connectError' });
        });
    }, []);

    return (
        <mediaStreamContext.Provider value={state}>
            {children}
        </mediaStreamContext.Provider>
    );
}

export const useMediaStreamContext = () => useContext(mediaStreamContext);