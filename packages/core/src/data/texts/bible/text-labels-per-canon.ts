const BASE_LABELS: Record<string, string> = {
	// Pentateuch
	genesis: "Genesis",
	exodus: "Exodus",
	leviticus: "Leviticus",
	numbers: "Numbers",
	deuteronomy: "Deuteronomy",

	// Historical
	joshua: "Joshua",
	judges: "Judges",
	ruth: "Ruth",
	"1_samuel": "1 Samuel",
	"2_samuel": "2 Samuel",
	"1_kings": "1 Kings",
	"2_kings": "2 Kings",
	"1_chronicles": "1 Chronicles",
	"2_chronicles": "2 Chronicles",
	ezra: "Ezra",
	nehemiah: "Nehemiah",
	esther: "Esther",

	// Wisdom
	job: "Job",
	psalms: "Psalms",
	proverbs: "Proverbs",
	ecclesiastes: "Ecclesiastes",
	song_of_songs: "Song of Solomon",

	// Prophets
	isaiah: "Isaiah",
	jeremiah: "Jeremiah",
	lamentations: "Lamentations",
	ezekiel: "Ezekiel",
	daniel: "Daniel",
	hosea: "Hosea",
	joel: "Joel",
	amos: "Amos",
	obadiah: "Obadiah",
	jonah: "Jonah",
	micah: "Micah",
	nahum: "Nahum",
	habakkuk: "Habakkuk",
	zephaniah: "Zephaniah",
	haggai: "Haggai",
	zechariah: "Zechariah",
	malachi: "Malachi",

	// NT
	matthew: "Matthew",
	mark: "Mark",
	luke: "Luke",
	john: "John",
	acts: "Acts",
	romans: "Romans",
	firstcorinthians: "1 Corinthians",
	secondcorinthians: "2 Corinthians",
	galatians: "Galatians",
	ephesians: "Ephesians",
	philippians: "Philippians",
	colossians: "Colossians",
	firstthessalonians: "1 Thessalonians",
	secondthessalonians: "2 Thessalonians",
	firsttimothy: "1 Timothy",
	secondtimothy: "2 Timothy",
	titus: "Titus",
	philemon: "Philemon",
	hebrews: "Hebrews",
	james: "James",
	firstpeter: "1 Peter",
	secondpeter: "2 Peter",
	firstjohn: "1 John",
	secondjohn: "2 John",
	thirdjohn: "3 John",
	jude: "Jude",
	revelation: "Revelation",
};

export function getProtestantLabel(dataKey: string): string {
	return BASE_LABELS[dataKey] ?? dataKey;
}

const CATHOLIC_OVERRIDES: Record<string, string> = {
	tobit: "Tobit",
	judith: "Judith",
	wisdomofsolomon: "Wisdom of Solomon",
	sirach: "Sirach", // aka Ecclesiasticus
	baruch: "Baruch",
	letterofjeremiah: "Letter of Jeremiah",
	firstmaccabees: "1 Maccabees",
	secondmaccabees: "2 Maccabees",

	additionstoesther: "Additions to Esther",
	prayerofazariah: "Prayer of Azariah",
	songofthethree: "Song of the Three",
	susanna: "Susanna",
	belandthedragon: "Bel and the Dragon",
};

export function getRomanCatholicLabel(dataKey: string): string {
	return CATHOLIC_OVERRIDES[dataKey] ?? BASE_LABELS[dataKey] ?? dataKey;
}

const ORTHODOX_OVERRIDES: Record<string, string> = {
	// Kingdoms renaming
	"1_samuel": "1 Kingdoms",
	"2_samuel": "2 Kingdoms",
	"1_kings": "3 Kingdoms",
	"2_kings": "4 Kingdoms",

	// Naming preferences
	song_of_songs: "Song of Songs",

	// Additional books
	thirdmaccabees: "3 Maccabees",
	fourthmaccabees: "4 Maccabees",

	firstesdras: "1 Esdras",
	secondesdras: "2 Esdras",

	psalm151: "Psalm 151",
	prayerofmanasseh: "Prayer of Manasseh",

	// Shared deutero books
	tobit: "Tobit",
	judith: "Judith",
	wisdomofsolomon: "Wisdom",
	sirach: "Sirach",
	baruch: "Baruch",
	letterofjeremiah: "Letter of Jeremiah",
	firstmaccabees: "1 Maccabees",
	secondmaccabees: "2 Maccabees",

	additionstoesther: "Additions to Esther",
	prayerofazariah: "Prayer of Azariah",
	songofthethree: "Song of the Three",
	susanna: "Susanna",
	belandthedragon: "Bel and the Dragon",
};

export function getEasternOrthodoxLabel(dataKey: string): string {
	return ORTHODOX_OVERRIDES[dataKey] ?? BASE_LABELS[dataKey] ?? dataKey;
}

// Hebrew/Tanakh-style labels (English transliterations)
// Keep keys = your existing dataKeys, just change the display labels.

export const HEBREW_LABELS: Record<string, string> = {
	// Torah
	genesis: "Bereshit",
	exodus: "Shemot",
	leviticus: "Vayikra",
	numbers: "Bamidbar",
	deuteronomy: "Devarim",

	// Nevi'im (Prophets)
	joshua: "Yehoshua",
	judges: "Shoftim",
	"1_samuel": "Shmuel I",
	"2_samuel": "Shmuel II",
	"1_kings": "Melakhim I",
	"2_kings": "Melakhim II",
	isaiah: "Yeshayahu",
	jeremiah: "Yirmeyahu",
	ezekiel: "Yehezkel",
	hosea: "Hoshea",
	joel: "Yoel",
	amos: "Amos",
	obadiah: "Ovadiah",
	jonah: "Yonah",
	micah: "Mikhah",
	nahum: "Nahum",
	habakkuk: "Havakkuk",
	zephaniah: "Tzefanyah",
	haggai: "Haggai",
	zechariah: "Zekharyah",
	malachi: "Malakhi",

	// Ketuvim (Writings)
	psalms: "Tehillim",
	proverbs: "Mishlei",
	job: "Iyov",
	song_of_songs: "Shir HaShirim",
	ruth: "Rut",
	lamentations: "Eikhah",
	ecclesiastes: "Kohelet",
	esther: "Esther",
	daniel: "Daniel",
	ezra: "Ezra",
	nehemiah: "Nechemyah",
	"1_chronicles": "Divrei HaYamim I",
	"2_chronicles": "Divrei HaYamim II",
};

export function getHebrewLabel(dataKey: string): string {
	return HEBREW_LABELS[dataKey] ?? dataKey;
}
