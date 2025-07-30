import { useEffect } from 'react';
import useStore from '../../hooks/useStore';
import type { GalleryPhoto } from '../../types/storeModel';
import GalleryThumbnail from './GalleryThumbnail';
import { useGalleryContext } from '../../context/galleryContext';

interface Props {
    store: IDBDatabase;
};

function GalleryPage({ store }: Props) {

    const { getAll: getAllGalleryPhotos, remove: removeGalleryPhoto } = useStore<GalleryPhoto>(store, 'gallery-photos');
    const { state: galleryState, dispatch: galleryDispatch } = useGalleryContext();

    useEffect(() => {
        getAllGalleryPhotos().then(entries => {
            galleryDispatch({ type: 'setEntries', entries });
        });
    }, []);

    const onRemoveGalleryPhoto = (id: GalleryPhoto['id']) => {
        removeGalleryPhoto(id).then(() => {
            galleryDispatch({ type: 'removeEntry', entryId: id });
        });
    }

    return (
        <div>
        {
            galleryState.entries.map(item => {
                return (
                    <li key={item.id}>
                        <GalleryThumbnail data={item} onRemove={onRemoveGalleryPhoto}/>
                    </li>
                );
            })
        }
        </div>
    );
}

export default GalleryPage;