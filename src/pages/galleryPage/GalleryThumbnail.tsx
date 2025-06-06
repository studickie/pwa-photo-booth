import { useState, useEffect } from "react";
import type { GalleryPhoto } from "../../types/storeModel";

interface Props {
    data: GalleryPhoto;
    onRemove: (id: GalleryPhoto['id']) => void;
}

function GalleryThumbnail({ data, onRemove }: Props) {

    const [objectURL, setObjectURL] = useState<string>('#');

    useEffect(() => {
        setObjectURL(URL.createObjectURL(data.blob));
        return () => {
            URL.revokeObjectURL(objectURL);
        }
    }, [data.blob]);

    return (
        <div id={data.id}>
            <img src={objectURL} alt='Gallery photo'/>
            <button onClick={() => onRemove(data.id)}>Remove</button>
        </div>
    );
}

export default GalleryThumbnail;