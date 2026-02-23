import { matcherDictionary } from "../matcher-dictionary";

const reportDuplicateMatchers = Object.entries(matcherDictionary).filter(
	(entry) => entry[1].length > 1,
);

console.log(reportDuplicateMatchers);
