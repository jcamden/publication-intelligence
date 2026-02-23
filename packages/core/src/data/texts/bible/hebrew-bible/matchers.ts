import { additionstoesther } from "../deterocanon/matchers";

export const getHebrewBibleMatchers = ({
	canon = "protestant",
}: {
	canon?: "protestant" | "catholic";
}): Record<string, string[]> => ({
	genesis: [
		"Genesis",
		"Gen",
		"Gen.",
		"Ge",
		"Ge.",
		"Γένεσις",
		"Genesis (LXX)",
		"Liber Genesis",
		"בְּרֵאשִׁית",
		"Bereshit",
		"First Book of Moses",
		"1 Moses",
	],

	exodus: [
		"Exodus",
		"Exod",
		"Exod.",
		"Ex",
		"Ex.",
		"Ἔξοδος",
		"Liber Exodus",
		"שְׁמוֹת",
		"Shemot",
		"Second Book of Moses",
		"2 Moses",
	],

	leviticus: [
		"Leviticus",
		"Lev",
		"Lev.",
		"Le",
		"Le.",
		"Λευιτικόν",
		"Liber Leviticus",
		"וַיִּקְרָא",
		"Vayikra",
		"Third Book of Moses",
		"3 Moses",
	],

	numbers: [
		"Numbers",
		"Num",
		"Num.",
		"Nu",
		"Nu.",
		"Ἀριθμοί",
		"Liber Numeri",
		"בְּמִדְבַּר",
		"Bemidbar",
		"Fourth Book of Moses",
		"4 Moses",
	],

	deuteronomy: [
		"Deuteronomy",
		"Deut",
		"Deut.",
		"Dt",
		"Dt.",
		"Δευτερονόμιον",
		"Liber Deuteronomii",
		"דְּבָרִים",
		"Devarim",
		"Fifth Book of Moses",
		"5 Moses",
	],

	joshua: [
		"Joshua",
		"Josh",
		"Josh.",
		"Jos",
		"Jos.",
		"Ἰησοῦς Ναυή",
		"Liber Iosue",
		"יְהוֹשֻׁעַ",
		"Yehoshua",
	],

	judges: [
		"Judges",
		"Judg",
		"Judg.",
		"Jdg",
		"Jdg.",
		"Κριταί",
		"Liber Iudicum",
		"שֹׁפְטִים",
		"Shoftim",
	],

	ruth: ["Ruth", "Ruth.", "Ῥούθ", "Liber Ruth", "רוּת", "Rūth"],

	"1_samuel": [
		"1 Samuel",
		"1 Sam",
		"1 Sam.",
		"1Sam",
		"I Samuel",
		"First Samuel",
		"First Book of Samuel",
		// These would conflict
		...(canon === "catholic" ? ["1 Kings", "I Kings"] : []),
		"Βασιλειῶν Α",
		"Liber I Regum",
		"Regum I",
	],

	"2_samuel": [
		"2 Samuel",
		"2 Sam",
		"2 Sam.",
		"2Sam",
		"II Samuel",
		"Second Samuel",
		"Second Book of Samuel",
		// These would conflict
		...(canon === "catholic" ? ["2 Kings", "II Kings"] : []),
		"Βασιλειῶν Β",
		"Liber II Regum",
		"Regum II",
	],

	"1_kings": [
		"1 Kings",
		"1 Kgs",
		"1 Kgs.",
		"1Kgs",
		"I Kings",
		"First Kings",
		"First Book of Kings",
		"3 Kings",
		"III Kings", // Catholic usage
		"Βασιλειῶν Γ",
		"Liber III Regum",
		"Regum III",
	],

	"2_kings": [
		"2 Kings",
		"2 Kgs",
		"2 Kgs.",
		"2Kgs",
		"II Kings",
		"Second Kings",
		"Second Book of Kings",
		"4 Kings",
		"IV Kings", // Catholic usage
		"Βασιλειῶν Δ",
		"Liber IV Regum",
		"Regum IV",
	],

	"1_chronicles": [
		"1 Chronicles",
		"1 Chron",
		"1 Chron.",
		"1 Chr",
		"1 Chr.",
		"1Chr",
		"I Chronicles",
		"First Chronicles",
		"First Book of Chronicles",
		"1 Paralipomenon",
		"I Paralipomenon",
		"Paralipomenon I",
		"Par.",
		"Par I",
		"Παραλειπομένων Α",
		"Liber I Paralipomenon",
	],

	"2_chronicles": [
		"2 Chronicles",
		"2 Chron",
		"2 Chron.",
		"2 Chr",
		"2 Chr.",
		"2Chr",
		"II Chronicles",
		"Second Chronicles",
		"Second Book of Chronicles",
		"2 Paralipomenon",
		"II Paralipomenon",
		"Paralipomenon II",
		"Par II",
		"Παραλειπομένων Β",
		"Liber II Paralipomenon",
	],

	ezra: [
		"Ezra",
		"Ezr",
		"Ezr.",
		"Ἔσδρας Α",
		"Liber Esdrae I",
		"1 Ezra",
		"I Ezra",
		"עֶזְרָא",
		"Ezrā",
	],

	nehemiah: [
		"Nehemiah",
		"Neh",
		"Neh.",
		"Ἔσδρας Β",
		"Liber Esdrae II",
		"2 Ezra",
		"II Ezra",
	],

	esther: [
		"Esther",
		"Esth",
		"Esth.",
		"Ἐσθήρ",
		"Liber Esther",
		"אֶסְתֵר",
		"Estēr",
		...(canon === "catholic" ? additionstoesther : []),
	],

	job: ["Job", "Ἰώβ", "Liber Iob", "אִיּוֹב", "Iyyôbh", "Iyov"],

	psalms: [
		"Psalms",
		"Psalm",
		"Ps",
		"Ps.",
		"Pss",
		"Pss.",
		"Ψαλμοί",
		"Liber Psalmorum",
		"תְּהִלִּים",
		"Tehillim",
	],

	proverbs: [
		"Proverbs",
		"Prov",
		"Prov.",
		"Pr",
		"Pr.",
		"Παροιμίαι",
		"Liber Proverbiorum",
		"מִשְׁלֵי",
		"Mishlei",
	],

	ecclesiastes: [
		"Ecclesiastes",
		"Eccl",
		"Eccl.",
		"Ecc",
		"Ecc.",
		"Qohelet",
		"Qoh",
		"Qoh.",
		"Ἐκκλησιαστής",
		"Liber Ecclesiastes",
		"קֹהֶלֶת",
		"Qōheleth",
		"Preacher",
	],

	song_of_songs: [
		"Song of Songs",
		"Song of Solomon",
		"Canticles",
		"Cant",
		"Cant.",
		"Canticle", // singular Catholic usage
		"Canticum Canticorum",
		"ᾎσμα ᾀσμάτων",
		"SoS",
		"SS",
		"שִׁיר הַשִּׁירִים",
		"Shir Hashirim",
	],

	isaiah: [
		"Isaiah",
		"Isa",
		"Isa.",
		"Ἠσαΐας",
		"Liber Isaiae",
		"יְשַׁעְיָהוּ",
		"Yeshayahu",
	],

	jeremiah: [
		"Jeremiah",
		"Jer",
		"Jer.",
		"Ἱερεμίας",
		"Liber Ieremiae",
		"יִרְמְיָהוּ",
		"Yirmeyahu",
	],

	lamentations: [
		"Lamentations",
		"Lam",
		"Lam.",
		"Θρῆνοι",
		"Lamentationes",
		"אֵיכָה",
		"Eikhah",
	],

	ezekiel: [
		"Ezekiel",
		"Ezek",
		"Ezek.",
		"Ἰεζεκιήλ",
		"Liber Ezechielis",
		"יְחֶזְקֵאל",
		"Yehezkel",
	],

	daniel: ["Daniel", "Dan", "Dan.", "Δανιήλ", "Liber Danielis", "דָּנִיֵּאל"],

	hosea: ["Hosea", "Hos", "Hos.", "Ὡσηέ", "Liber Osee", "הוֹשֵׁעַ", "Hoshea"],

	joel: ["Joel", "Ἰωήλ", "Liber Ioel", "יוֹאֵל", "Yoel"],

	amos: ["Amos", "Ἀμώς", "Liber Amos", "עָמוֹס"],

	obadiah: [
		"Obadiah",
		"Obad",
		"Obad.",
		"Ἀβδιού",
		"Liber Abdiae",
		"עֹבַדְיָה",
		"Ovadiah",
	],

	jonah: ["Jonah", "Ἰωνᾶς", "Liber Ionae", "יוֹנָה", "Yonah"],

	micah: [
		"Micah",
		"Mic",
		"Mic.",
		"Μιχαίας",
		"Liber Michaeae",
		"מִיכָה",
		"Mikhah",
	],

	nahum: ["Nahum", "Nah", "Nah.", "Ναούμ", "Liber Nahum", "נַחוּם"],

	habakkuk: [
		"Habakkuk",
		"Hab",
		"Hab.",
		"Ἀμβακούμ",
		"Liber Habacuc",
		"חֲבַקּוּק",
		"Havakkuk",
	],

	zephaniah: [
		"Zephaniah",
		"Zeph",
		"Zeph.",
		"Σοφονίας",
		"Liber Sophoniae",
		"צְפַנְיָה",
		"Tzefanyah",
	],

	haggai: ["Haggai", "Hag", "Hag.", "Ἁγγαῖος", "Liber Aggaei", "חַגַּי"],

	zechariah: [
		"Zechariah",
		"Zech",
		"Zech.",
		"Ζαχαρίας",
		"Liber Zachariae",
		"זְכַרְיָה",
	],

	malachi: ["Malachi", "Mal", "Mal.", "Μαλαχίας", "Liber Malachiae", "מַלְאָכִי"],
});
