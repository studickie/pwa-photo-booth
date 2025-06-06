import { createContext, useContext, useReducer, type PropsWithChildren } from "react";
import type { GalleryPhoto } from "../types/storeModel";

interface GalleryState {
    entries: GalleryPhoto[];
};

type GalleryStateAction = {
    type: 'addEntry',
    entry: GalleryPhoto
} | {
    type: 'removeEntry',
    entryId: GalleryPhoto['id']
} | {
    type: 'setEntries',
    entries: GalleryPhoto[]
};

function reducer(state: GalleryState, action: GalleryStateAction) {
    const { type } = action;
    switch(type) {
        case 'addEntry': 
            return { ...state, 
                entries: [action.entry, ...state.entries]
            };
        case 'removeEntry':
            return { ...state,
                entries: state.entries.filter(e => e.id !== action.entryId)
            };
        case 'setEntries':
            return { ...state,
                entries: action.entries
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    };
}

/*
    Gallery Context:

    Allows shared state & state management of Gallery items across components
*/

interface GalleryContext {
    state: GalleryState,
    dispatch: (action: GalleryStateAction) => void
};

const galleryContext = createContext({} as GalleryContext);

interface Props extends PropsWithChildren {};

export function GalleryProvider({ children }: Props) {

    const [state, dispatch] = useReducer(reducer, {
        entries: []
    });

    return (
        <galleryContext.Provider value={{ state, dispatch }}>
            { children }
        </galleryContext.Provider>
    );
}

export const useGalleryContext = () => useContext(galleryContext);