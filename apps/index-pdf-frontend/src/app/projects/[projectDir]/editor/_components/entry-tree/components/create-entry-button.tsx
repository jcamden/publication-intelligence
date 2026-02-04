import { Plus } from "lucide-react";

export type CreateEntryButtonProps = {
	onClick: () => void;
};

export const CreateEntryButton = ({ onClick }: CreateEntryButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
		>
			<Plus className="w-4 h-4" />
			<span>Create Entry</span>
		</button>
	);
};
