import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MediaItem {
    id: bigint;
    title: string;
    blob: ExternalBlob;
    timestamp: bigint;
    mediaType: string;
}
export interface backendInterface {
    addMedia(blob: ExternalBlob, mediaType: string, title: string): Promise<MediaItem>;
    deleteMedia(id: bigint): Promise<boolean>;
    getMedia(): Promise<Array<MediaItem>>;
}
