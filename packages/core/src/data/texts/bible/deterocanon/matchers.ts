export const additionstoesther = [
	"Additions to Esther",
	"Greek Esther",
	"Esther (Greek)",
	"Rest of Esther",
	// Greek / Latin
	"Ἐσθήρ (Greek)",
	"Ἐσθήρ",
	"Additions of Esther",
	"Additiones Esther",
	"Additamenta Esther",
	"Additamenta in Esther",
];

export const getDeuterocanonMatchers = ({
	canon = "protestant",
}: {
	canon?: "protestant" | "catholic";
}): Record<string, string[]> => ({
	tobit: [
		"Tobit",
		"Tob",
		"Tob.",
		"Tb",
		"Tb.",
		// Greek / Latin
		"Τωβίτ",
		"Τωβιτ",
		"Tōbit",
		"Tobiae",
		"Liber Tobiae",
	],

	judith: [
		"Judith",
		"Jdt",
		"Jdt.",
		"Jdth",
		"Jdth.",
		// Greek / Latin
		"Ἰουδίθ",
		"Ioudith",
		"Iudith",
		"Liber Iudith",
	],

	wisdomofsolomon: [
		"Wisdom of Solomon",
		"Wisdom",
		"Wis",
		"Wis.",
		"Wisd",
		"Wisd.",
		"Sapientia",
		"Sap",
		"Sap.",
		"Wis Sol",
		"Ws",
		"Ws.",
		// Greek / Latin fuller forms
		"Σοφία Σαλoμῶνος",
		"Σοφία Σολομῶντος",
		"Sophia Salomōnos",
		"Sophia Salomonos",
		"Liber Sapientiae",
		"Sapientia Salomonis",
		"Wisdom of Salomon", // older spelling sometimes encountered
	],

	sirach: [
		"Sirach",
		"Ecclesiasticus",
		"Ecclus",
		"Ecclus.",
		"Sir",
		"Sir.",
		"Ben Sira",
		"Wisdom of Jesus Son of Sirach",
		"Jesus Sirach",
		// Greek / Latin
		"Σειράχ",
		"Sirach (Greek)",
		"Σοφία Ἰησοῦ υἱοῦ Σειράχ",
		"Sophia Iēsou huiou Seirach",
		"Liber Ecclesiasticus",
		"Ecclesiasticus (Latin)",
	],

	baruch: [
		"Baruch",
		"Bar",
		"Bar.",
		// Greek / Latin
		"Βαρούχ",
		"Barouch",
		"Baruch (Greek)",
		"Liber Baruch",
		"Baruch (Latin)",
	],

	letterofjeremiah: [
		"Letter of Jeremiah",
		"Epistle of Jeremiah",
		"Ep Jer",
		"Ep. Jer.",
		"EpJer",
		"Let Jer",
		"Ltr Jer",
		// Greek / Latin
		"Ἐπιστολὴ Ἰερεμίου",
		"Epistole Ieremiou",
		"Epistola Ieremiae",
		"Baruch 6",
		"Baruch VI",
		"Bar 6",
		"Bar. 6", // common Catholic reference
	],

	firstmaccabees: [
		"1 Maccabees",
		"1 Macc",
		"1 Macc.",
		"1 Mac",
		"1 Mac.",
		"I Maccabees",
		"First Maccabees",
		// Greek / Latin
		"Μακκαβαίων Αʹ",
		"Makkabaiōn A",
		"Liber I Machabaeorum",
		"I Machabaeorum",
		"1 Machabaeorum",
	],

	secondmaccabees: [
		"2 Maccabees",
		"2 Macc",
		"2 Macc.",
		"2 Mac",
		"2 Mac.",
		"II Maccabees",
		"Second Maccabees",
		// Greek / Latin
		"Μακκαβαίων Βʹ",
		"Makkabaiōn B",
		"Liber II Machabaeorum",
		"II Machabaeorum",
		"2 Machabaeorum",
	],

	thirdmaccabees: [
		"3 Maccabees",
		"3 Macc",
		"3 Macc.",
		"3 Mac",
		"3 Mac.",
		"III Maccabees",
		"Third Maccabees",
		// Greek / Latin
		"Μακκαβαίων Γʹ",
		"Makkabaiōn G",
		"III Machabaeorum",
		"3 Machabaeorum",
		"Liber III Machabaeorum",
	],

	fourthmaccabees: [
		"4 Maccabees",
		"4 Macc",
		"4 Macc.",
		"4 Mac",
		"4 Mac.",
		"IV Maccabees",
		"Fourth Maccabees",
		// Greek / Latin
		"Μακκαβαίων Δʹ",
		"Makkabaiōn D",
		"IV Machabaeorum",
		"4 Machabaeorum",
		"Liber IV Machabaeorum",
	],

	firstesdras: [
		"1 Esd.",
		"1 Esd",
		"1 Esdras",
		"3 Esdrae",
		"3 Esdras",
		"3 Ezra",
		"Esdras (Greek)",
		"Esdras A",
		"First Esdras",
		"Greek Ezra",
		"I Esdras",
		"III Esdrae",
		"III Esdras",
		"III Ezra",
		"Liber Esdrae III",
		"Ἔσδρας Αʹ",
	],

	secondesdras: [
		"2 Esdras",
		"2 Esd.",
		"2 Esd",
		"4 Esdrae",
		"4 Esdras",
		"4 Ezra",
		"Apocalypse of Ezra",
		"Ezra Apocalypse",
		"II Esdras",
		"IV Esdrae",
		"IV Ezra",
		"Latin Ezra",
		"Liber Esdrae IV",
		"Second Esdras",
	],

	additionstoesther: canon === "catholic" ? additionstoesther : [],

	prayerofazariah: [
		"Prayer of Azariah",
		"Pr Az",
		"Pr. Az.",
		"Azariah",
		// Greek / Latin
		"Προσευχὴ Ἀζαρίου",
		"Proseuchē Azariou",
		"Oratio Azariae",
		"Prayer of Azarias", // alternate transliteration
	],

	songofthethree: [
		"Song of the Three Young Men",
		"Song of the Three Holy Children",
		"Song of the Three",
		"Three Holy Children",
		"The Three Holy Children",
		"Song of the Three Children",
		"Benedicite",
		// Greek / Latin
		"Ὕμνος τῶν τριῶν παίδων",
		"Hymnos tōn triōn paidōn",
		"Canticum Trium Puerorum",
		"Benedicite, omnia opera",
		"Benedicite omnia opera", // often cited by incipit
	],

	susanna: [
		"Susanna",
		"Sus",
		"Sus.",
		"Susanna (Daniel)",
		"History of Susanna",
		// Greek / Latin
		"Σουσάννα",
		"Sousanna",
		"Historia Susannae",
	],

	belandthedragon: [
		"Bel and the Dragon",
		"Bel & the Dragon",
		"Bel and Dragon",
		"Bel",
		"Dragon",
		// Greek / Latin
		"Βὴλ καὶ Δράκων",
		"Bēl kai Drakōn",
		"Bel et Draco",
		"History of Bel and the Dragon",
	],

	psalm151: [
		"Psalm 151",
		"Ps 151",
		"Ps. 151",
		"Ps151",
		// Greek / Latin
		"Ψαλμὸς ρναʹ",
		"Psalm ρναʹ", // 151 in Greek numerals (sometimes shown)
		"Psalmus 151",
		"Ps 151 (LXX)",
	],

	prayerofmanasseh: [
		"Prayer of Manasseh",
		"Pr Man",
		"Pr. Man.",
		"Manasseh",
		// Greek / Latin
		"Προσευχὴ Μανασσῆ",
		"Proseuchē Manassē",
		"Oratio Manasse",
	],
});
