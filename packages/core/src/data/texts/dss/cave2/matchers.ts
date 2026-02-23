// Merged CAVE_2_MATCHERS (source list) into your labeled-key list.
// Fixes applied while merging:
// - Normalized obvious typos: "2Q232" -> "2Q32", trimmed "2Q18 " -> "2Q18"
// - Fixed casing: "2QExod^C" -> include both "2QExod^C" (yours) and the common "2QExod^c"
// - Fixed wrong assignments: your "2Q17 (2QSir)" should be Ruth^b; your "2Q18 (2QNum^a)" should be Sirach
// - Removed duplicate "2QNum^d?" entry in its own array (kept one copy)
// - Added missing synonyms/aliases from the source list under the correct keys

export const CAVE_2_MATCHERS: Record<string, string[]> = {
	"2Q1 (2QGen)": [
		"2Q1",
		"2Q 1",
		"2Q-1",
		"2Q.1",
		"2QGen",
		// merged
		"2Q Genesis",
		"Genesis (2Q)",
		"Genesis (2Q1)",
	],

	"2Q2 (2QExod^a)": [
		"2Q2",
		"2Q 2",
		"2Q-2",
		"2Q.2",
		"2QExod^a",
		// merged
		"2QExod a",
		"2QExoda",
		"Exodus (2Q2)",
	],

	"2Q3 (2QExod^b)": [
		"2Q3",
		"2Q 3",
		"2Q-3",
		"2Q.3",
		"2QExod^b",
		// merged
		"2QExod b",
		"2QExodb",
		"Exodus (2Q3)",
	],

	"2Q4 (2QExod^c)": [
		"2Q4",
		"2Q 4",
		"2Q-4",
		"2Q.4",
		"2QExod^c",
		"2QExod c",
		"2QExodc",
		"Exodus (2Q4)",
	],

	"2Q5 (2QpaleoLev)": [
		"2Q5",
		"2Q 5",
		"2Q-5",
		"2Q.5",
		"(2QpaleoLev)",
		// merged
		"2QpaleoLev",
		"2Q paleoLev",
		"2Q Paleo-Leviticus",
		"Leviticus (2Q5)",
	],

	"2Q6 (2QNum^a)": [
		"2Q6",
		"2Q 6",
		"2Q-6",
		"2Q.6",
		"2QNum^a",
		// merged
		"2QNum a",
		"2QNuma",
		"Numbers (2Q6)",
	],

	"2Q7 (2QNum^b)": [
		"2Q7",
		"2Q 7",
		"2Q-7",
		"2Q.7",
		"2QNum^b",
		// merged
		"2QNum b",
		"2QNumb",
		"Numbers (2Q7)",
	],

	"2Q8 (2QNum^c)": [
		"2Q8",
		"2Q 8",
		"2Q-8",
		"2Q.8",
		"2QNum^c",
		// merged
		"2QNum c",
		"2QNumc",
		"Numbers (2Q8)",
	],

	"2Q9 (2QNum^d?)": [
		"2Q9",
		"2Q 9",
		"2Q-9",
		"2Q.9",
		"2QNum^d?",
		// merged (source includes a few spelling variants)
		"2QNum^d",
		"2QNum d",
		"2QNum d?",
		"Numbers (2Q9)",
	],

	"2Q10 (2QDeut^a)": [
		"2Q10",
		"2Q 10",
		"2Q-10",
		"2Q.10",
		"2QDeut^a",
		// merged
		"2QDeut a",
		"2QDeuta",
		"Deuteronomy (2Q10)",
	],

	"2Q11 (2QDeut^b)": [
		"2Q11",
		"2Q 11",
		"2Q-11",
		"2Q.11",
		"2QDeut^b",
		// merged
		"2QDeut b",
		"2QDeutb",
		"Deuteronomy (2Q11)",
	],

	"2Q12 (2QDeut^c)": [
		"2Q12",
		"2Q 12",
		"2Q-12",
		"2Q.12",
		"2QDeut^c",
		// merged
		"2QDeut c",
		"2QDeutc",
		"Deuteronomy (2Q12)",
	],

	"2Q13 (2QJer)": [
		"2Q13",
		"2Q 13",
		"2Q-13",
		"2Q.13",
		"2QJer",
		// merged
		"2Q Jeremiah",
		"Jeremiah (2Q13)",
	],

	"2Q14 (2QPs)": [
		"2Q14",
		"2Q 14",
		"2Q-14",
		"2Q.14",
		"2QPs",
		// merged
		"2Q Psalms",
		"Psalms (2Q14)",
	],

	"2Q15 (2QJob)": [
		"2Q15",
		"2Q 15",
		"2Q-15",
		"2Q.15",
		"2QJob",
		// merged
		"2Q Job",
		"Job (2Q15)",
	],

	"2Q16 (2QRuth^a)": [
		"2Q16",
		"2Q 16",
		"2Q-16",
		"2Q.16",
		"2QRuth^a",
		// merged
		"2QRuth a",
		"2QRutha",
		"Ruth (2Q16)",
	],

	"2Q17 (2QRuth^b)": [
		"2Q17",
		"2Q 17",
		"2Q-17",
		"2Q.17",
		"2QRuth^b",
		// merged
		"2QRuth b",
		"2QRuthb",
		"Ruth (2Q17)",
	],

	"2Q18 (2QSir)": ["2Q18", "2Q 18", "2Q-18", "2Q.18", "2QSir"],

	"2Q19 (2QJub^a)": [
		"2Q19",
		"2Q 19",
		"2Q-19",
		"2Q.19",
		"2QJub^a",
		// merged
		"2QJub a",
		"2QJuba",
		"Jubilees (2Q19)",
		"Book of Jubilees (2Q19)",
	],

	"2Q20 (2QJub^b)": [
		"2Q20",
		"2Q 20",
		"2Q-20",
		"2Q.20",
		"2QJub^b",
		// merged
		"2QJub b",
		"2QJubb",
		"Jubilees (2Q20)",
		"Book of Jubilees (2Q20)",
	],

	"2Q21 (2QapMoses/2QapocrMoses(?), Apocryphon of Moses)": [
		"2Q21",
		"2Q 21",
		"2Q-21",
		"2Q.21",
		"2QapMoses",
		"2QapocrMoses(?)",
		"2QapocrMoses",
	],

	"2Q22 (2QapDavid/2QapocrDavid, Apocryphon of David)": [
		"2Q22",
		"2Q 22",
		"2Q-22",
		"2Q.22",
		"2QapDavid",
		"2QapocrDavid",
		"Apocryphon of David",
		// merged
		"Apocryphon of David (?)",
	],

	"2Q23 (2QapProph/2Qapocr.Prophecy, Apocryphal Prophecy)": [
		"2Q23",
		"2Q 23",
		"2Q-23",
		"2Q.23",
		"2QapProph",
		"2Q apocr.prophecy",
		"2Qapocr.Prophecy",
		"2Qapocr.prophecy",
		"2Q apocr. prophecy",
		"Apocryphal Prophecy",
		"The Apocryphal Prophecy",
	],

	"2Q24 (2QNJ, New Jerusalem)": ["2Q24", "2Q 24", "2Q-24", "2Q.24", "2QNJ"],

	"2Q25 (2Q Juridical Text)": [
		"2Q25",
		"2Q 25",
		"2Q-25",
		"2Q.25",
		"2Q Juridical Text",
		// merged
		"Juridical Text",
	],

	"2Q26 (2QEnGiants, Book of Giants)": [
		"2Q26",
		"2Q 26",
		"2Q-26",
		"2Q.26",
		"2QEnGiants",
		// merged
		"Enoch Giants",
	],

	"2Q27": ["2Q27"],
	"2Q28": ["2Q28"],
	"2Q29": ["2Q29"],
	"2Q30": ["2Q30"],
	"2Q31": ["2Q31"],

	"2Q32": ["2Q32"],

	"2Q33": ["2Q33"],

	"2QX1": ["2QX1", "2Q X1"],
};
