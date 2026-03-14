"use client";

import { Modal } from "@pubint/yaboujee";
import { PageMatcherRunControls } from "../page-sidebar/components/page-matcher-run-controls";
import { MatcherRunControls } from "../project-sidebar/components/matcher-run-controls";

export type MatcherDetectionModalProps = {
	open: boolean;
	onClose: () => void;
} & (
	| {
			scope: "project";
			projectId: string;
			projectIndexTypeId: string;
			indexType: string;
			emptyStateMessage: string;
	  }
	| {
			scope: "page";
			projectId: string;
			projectIndexTypeId: string;
			indexType: string;
			documentId: string;
			pageNumber: number;
			emptyStateMessage: string;
	  }
);

export const MatcherDetectionModal = (props: MatcherDetectionModalProps) => {
	const { open, onClose } = props;

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Matcher detection"
			size="lg"
			showCloseButton={true}
		>
			<div className="min-w-0">
				{props.scope === "project" ? (
					<MatcherRunControls
						projectId={props.projectId}
						projectIndexTypeId={props.projectIndexTypeId}
						indexType={props.indexType}
						emptyStateMessage={props.emptyStateMessage}
						showHeading={false}
					/>
				) : (
					<PageMatcherRunControls
						projectId={props.projectId}
						projectIndexTypeId={props.projectIndexTypeId}
						indexType={props.indexType}
						documentId={props.documentId}
						pageNumber={props.pageNumber}
						emptyStateMessage={props.emptyStateMessage}
						showHeading={false}
					/>
				)}
			</div>
		</Modal>
	);
};
