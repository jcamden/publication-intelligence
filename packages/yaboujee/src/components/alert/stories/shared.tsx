import { Alert } from "../alert";

export const AllVariantsStack = ({ customStyle }: { customStyle?: string }) => (
	<div className="flex flex-col gap-4">
		<Alert variant="info" className={customStyle}>
			<strong>Info:</strong> This is a much longer alert message that will test
			how the component handles <em>text wrapping</em> and maintains proper
			spacing and visual hierarchy when content spans multiple lines.
		</Alert>
		<Alert variant="success" className={customStyle}>
			<strong>Success:</strong> Changes <em>saved</em>
		</Alert>
		<Alert variant="warning" className={customStyle}>
			<strong>Warning:</strong> Action <em>cannot be undone</em>
		</Alert>
		<Alert variant="error" className={customStyle}>
			<strong>Error:</strong> Connection <em>failed</em>
		</Alert>
	</div>
);
