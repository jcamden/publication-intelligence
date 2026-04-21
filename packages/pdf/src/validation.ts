import { createHash } from "node:crypto";

// ============================================================================
// PDF Utilities
// ============================================================================

const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

export const isPdfBuffer = ({ buffer }: { buffer: Buffer }): boolean => {
	if (buffer.length < 4) {
		return false;
	}
	return buffer.subarray(0, 4).equals(PDF_MAGIC_BYTES);
};

export const isPdfMimeType = ({ mimeType }: { mimeType: string }): boolean => {
	return mimeType === "application/pdf";
};

export const validatePdfFile = ({
	buffer,
	mimeType,
}: {
	buffer: Buffer;
	mimeType: string;
}): { valid: boolean; reason?: string } => {
	if (!isPdfMimeType({ mimeType })) {
		return {
			valid: false,
			reason: "Invalid MIME type. Expected application/pdf",
		};
	}

	if (!isPdfBuffer({ buffer })) {
		return {
			valid: false,
			reason:
				"Invalid PDF file format. File does not start with PDF magic bytes",
		};
	}

	return { valid: true };
};

export const computeFileHash = ({ buffer }: { buffer: Buffer }): string => {
	return createHash("sha256").update(buffer).digest("hex");
};
