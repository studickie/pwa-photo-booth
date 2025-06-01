
export interface StoreModel {
    id: string;
}

export interface GalleryPhoto extends StoreModel {
    createdOn: Date;
    blob: Blob;
}