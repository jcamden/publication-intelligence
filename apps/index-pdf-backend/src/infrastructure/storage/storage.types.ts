// ============================================================================
// Storage Abstraction Types
// ============================================================================
// Enables swapping between local filesystem (MVP) and cloud storage (future)
// without changing domain logic

export type SaveFileInput = {
	buffer: Buffer;
	originalFilename: string;
	mimeType: string;
};

export type SaveFileResult = {
	storageKey: string;
	sizeBytes: number;
};

export type GetFileResult = {
	buffer: Buffer;
	mimeType: string;
	sizeBytes: number;
};

export type StorageService = {
	saveFile: (input: SaveFileInput) => Promise<SaveFileResult>;
	getFile: (params: { storageKey: string }) => Promise<GetFileResult | null>;
	deleteFile: (params: { storageKey: string }) => Promise<void>;
	exists: (params: { storageKey: string }) => Promise<boolean>;
};
