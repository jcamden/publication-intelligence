import { PdfViewer } from "@pubint/yaboujee";

/**
 * PDF.js Viewer Test Page
 *
 * Simple test harness for the PDF.js viewer component.
 * Renders /sample.pdf from the public directory.
 */
export default function PdfTestPage() {
	return (
		<div className="h-screen">
			<PdfViewer url="/sample.pdf" scale={1.25} />
		</div>
	);
}
