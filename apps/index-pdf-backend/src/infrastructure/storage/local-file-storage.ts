import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
	GetFileResult,
	SaveFileInput,
	SaveFileResult,
	StorageService,
} from "./storage.types";

// ============================================================================
// Local File Storage Implementation
// ============================================================================
// MVP storage using local filesystem
// Production: replace with S3/GCS/Azure Blob Storage

const BASE_STORAGE_PATH = path.join(process.cwd(), ".data", "source-documents");

export const createLocalFileStorage = (): StorageService => {
	const saveFile = async ({
		buffer,
		originalFilename,
	}: SaveFileInput): Promise<SaveFileResult> => {
		await mkdir(BASE_STORAGE_PATH, { recursive: true });

		const extension = path.extname(originalFilename) || ".pdf";
		const storageKey = `${randomUUID()}${extension}`;
		const filePath = path.join(BASE_STORAGE_PATH, storageKey);

		await writeFile(filePath, buffer);

		return {
			storageKey,
			sizeBytes: buffer.length,
		};
	};

	const getFile = async ({
		storageKey,
	}: {
		storageKey: string;
	}): Promise<GetFileResult | null> => {
		const filePath = path.join(BASE_STORAGE_PATH, storageKey);

		try {
			const buffer = await readFile(filePath);
			const stats = await stat(filePath);

			const extension = path.extname(storageKey);
			const mimeType =
				extension === ".pdf" ? "application/pdf" : "application/octet-stream";

			return {
				buffer,
				mimeType,
				sizeBytes: stats.size,
			};
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return null;
			}
			throw error;
		}
	};

	const deleteFile = async ({
		storageKey,
	}: {
		storageKey: string;
	}): Promise<void> => {
		const filePath = path.join(BASE_STORAGE_PATH, storageKey);

		try {
			await rm(filePath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return;
			}
			throw error;
		}
	};

	const exists = async ({
		storageKey,
	}: {
		storageKey: string;
	}): Promise<boolean> => {
		const filePath = path.join(BASE_STORAGE_PATH, storageKey);

		try {
			await stat(filePath);
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return false;
			}
			throw error;
		}
	};

	return {
		saveFile,
		getFile,
		deleteFile,
		exists,
	};
};

export const localFileStorage = createLocalFileStorage();
