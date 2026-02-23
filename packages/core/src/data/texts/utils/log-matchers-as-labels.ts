// /**
//  * Converts matcher object keys to their corresponding labels and logs the result.
//  * Useful for inspecting matchers keyed by display labels instead of internal keys.
//  */
// import { CHRISTIAN_WRITINGS_LABELS } from "./labels";
// import { CHRISTIAN_WRITINGS_MATCHERS } from "./matchers";

// export function matcherKeysToLabels<T>(
// 	matchers: Record<string, T>,
// 	labels: Record<string, string>,
// ): Record<string, T> {
// 	const result: Record<string, T> = {};
// 	for (const key of Object.keys(matchers)) {
// 		const label = labels[key] ?? key;
// 		result[label] = matchers[key];
// 	}
// 	return result;
// }

// const withLabels = matcherKeysToLabels(
// 	CHRISTIAN_WRITINGS_MATCHERS,
// 	CHRISTIAN_WRITINGS_LABELS,
// );
// console.log(withLabels);
