export const apocryphaOtherMatchers: Record<string, string[]> = {
	// --- Enochic / related ---
	firstenoch: [
		"1 Enoch",
		"1 En",
		"1 En.",
		"I Enoch",
		"First Enoch",
		"Ethiopic Enoch",
		// extra common abbrev variants
		"1 Eno",
		"1 Eno.",
		"Enoch (1)",
		// alt titles / language forms
		"Book of Enoch",
		"1 Henoch",
		"Henoch I",
		"Ge&#39;ez Enoch",
		"H&#39;enok",
		"H&#39;enoch",
	],

	secondenoch: [
		"2 Enoch",
		"2 En",
		"2 En.",
		"II Enoch",
		"Second Enoch",
		"Slavonic Enoch",
		"2 Eno",
		"2 Eno.",
		"Enoch (2)",
		// alt titles
		"Book of the Secrets of Enoch",
		"Secrets of Enoch",
		"Slavonic Book of Enoch",
		"2 Henoch",
		"Henoch II",
	],

	thirdenoch: [
		"3 Enoch",
		"3 En",
		"3 En.",
		"III Enoch",
		"Third Enoch",
		"Sefer Hekhalot",
		"Book of Palaces",
		// extra common abbrev variants
		"3 Eno",
		"3 Eno.",
		"Enoch (3)",
		// alt titles
		"Hebrew Enoch",
		"Hekhalot",
		"Hekhaloth",
		"Sefer Heikhalot",
		"3 Henoch",
		"Henoch III",
	],

	// --- Baruch tradition (non-canonical extras) ---
	secondbaruch: [
		"2 Baruch",
		"2 Bar",
		"2 Bar.",
		"II Baruch",
		"Second Baruch",
		"Apocalypse of Baruch",
		"Syriac Apocalypse of Baruch",
		"Letter of Baruch to the Nine and a Half Tribes",
		// alt titles / shorthand
		"2Bar",
		"Syriac Baruch",
		"Apoc Bar",
		"Apoc. Bar.",
		"Apoc. of Baruch",
	],

	thirdbaruch: [
		"3 Baruch",
		"3 Bar",
		"3 Bar.",
		"III Baruch",
		"Third Baruch",
		"Greek Apocalypse of Baruch",
		// alt titles
		"3Bar",
		"Apocalypse of Baruch (Greek)",
		"Greek Baruch",
		"Apoc Baruch (Greek)",
	],

	// --- Isaiah ---
	ascensionofisaiah: [
		"Ascension of Isaiah",
		"Asc. Isa",
		"Asc. Isa.",
		"Asc Isa",
		"Asc Isa.",
		"Martyrdom and Ascension of Isaiah",
		// alt titles / abbreviations
		"Martyrdom of Isaiah",
		"Vision of Isaiah",
		"Ascensio Isaiae",
		"Ascen. Isa.",
		"Ascen Isa",
		"Ascen Isa.",
	],

	// --- Adam & Eve cycle ---
	lifeofadamandeve: [
		"Life of Adam and Eve",
		"Apocalypse of Moses",
		"Αποκάλυψις Μωυσέως",
		"Apokalypsis Mōuseōs",
		"Penitence of Adam",
		"Book of Adam",
		"Conflict of Adam and Eve",
		"ספר אדם וחוה",
		// Latin / other common titles
		"Vita Adae et Evae",
		"Life of Adam & Eve",
		"Life of Adam &amp; Eve",
		"Apoc. Mos.",
		"Apoc Mos",
		"Apoc Mos.",
	],

	// --- Jubilees ---
	jubilees: [
		"Jubilees",
		"Jub",
		"Jub.",
		"Book of Jubilees",
		"Lesser Genesis",
		"Leptogenesis",
		"Book of Division",
		"Mets&#39;hafe Kufale",
		"መጽሐፈ ኩፋሌ",
		// common alternates
		"Little Genesis",
		"Book of the Division of Times",
		"Jubilaeorum", // Latin-styled form sometimes seen
	],

	// --- Aristeas ---
	letterofaristeas: [
		"Letter of Aristeas",
		"Aristeas",
		"Philocrates",
		"Let Aris",
		"Let. Aris.",
		// extra likely period variants
		"Aris",
		"Aris.",
		// Greek/Latin-ish citation styles
		"Epistle of Aristeas",
		"Pseudo-Aristeas",
	],

	// --- Cave of Treasures ---
	caveoftreasures: [
		"Cave of Treasures",
		"Treasure",
		"Me`ârath Gazzê",
		"Maghârat al-Kanûz",
		"Ba`âta Mazâgebet",
		// common English alternates
		"Cave of the Treasures",
		"Book of the Cave of Treasures",
	],

	// --- Sibylline Oracles ---
	sibyllineoracles: [
		"Sibylline Oracles",
		"Sib. Or.",
		"Sib Or",
		"Sib Or.",
		// extra common compact abbrev
		"Sib Orac",
		"Sib. Orac.",
		// Latin-style
		"Oracula Sibyllina",
		"Sibyllina",
	],

	// --- Testaments / Moses ---
	testamentofabraham: [
		"Testament of Abraham",
		"T. Ab.",
		"T Ab",
		"T Ab.",
		"Test Abr",
		"Test. Abr.",
		// common alternates
		"Testamentum Abrahami",
	],

	testamentofdan: [
		"Testament of Dan",
		"T. Dan.",
		"T Dan",
		"T Dan.",
		"Test Dan",
		"Test. Dan.",
		// common alternates
		"Testamentum Dan",
	],

	testamentofjoseph: [
		"Testament of Joseph",
		"T. Jos.",
		"T Jos",
		"T Jos.",
		"Test Jos",
		"Test. Jos.",
		// common alternates
		"Testamentum Ioseph",
		"Testamentum Joseph",
	],

	testamentofjudah: [
		"Testament of Judah",
		"T. Jud.",
		"T Jud",
		"T Jud.",
		"Test Jud",
		"Test. Jud.",
		// common alternates
		"Testamentum Judae",
		"Testamentum Judah",
	],

	testamentoflevi: [
		"Testament of Levi",
		"T. Levi",
		"T. Levi.",
		"T Levi",
		"T Levi.",
		"Test Levi",
		"Test. Levi.",
		// common alternates
		"Testamentum Levi",
	],

	testamentofreuben: [
		"Testament of Reuben",
		"T. Reu.",
		"T Reu",
		"T Reu.",
		"Test Reu",
		"Test. Reu.",
		// common alternates
		"Testamentum Ruben",
		"Testament of Ruben",
	],

	testamentofmoses: [
		"Testament of Moses",
		"T. Mos.",
		"T Mos",
		"T Mos.",
		"Assumption of Moses",
		"Assump. Mos.",
		// extra likely variant
		"Assump Mos",
		"Assump Mos.",
		// Latin-style
		"Assumptio Mosis",
		"Testamentum Mosis",
	],

	// --- Extra “Maccabees” sometimes cited (esp. tradition-specific) ---
	fifthmaccabees: [
		"5 Maccabees",
		"5 Macc",
		"5 Macc.",
		"5 Mac",
		"5 Mac.",
		"V Maccabees",
		"Fifth Maccabees",
		// tighter forms
		"V Macc",
		"V Macc.",
	],

	sixthmaccabees: [
		"6 Maccabees",
		"6 Macc",
		"6 Macc.",
		"6 Mac",
		"6 Mac.",
		"VI Maccabees",
		"Sixth Maccabees",
		"VI Macc",
		"VI Macc.",
	],

	seventhmaccabees: [
		"7 Maccabees",
		"7 Macc",
		"7 Macc.",
		"7 Mac",
		"7 Mac.",
		"VII Maccabees",
		"Seventh Maccabees",
		"VII Macc",
		"VII Macc.",
	],

	eighthmaccabees: [
		"8 Maccabees",
		"8 Macc",
		"8 Macc.",
		"8 Mac",
		"8 Mac.",
		"VIII Maccabees",
		"Eighth Maccabees",
		"VIII Macc",
		"VIII Macc.",
	],

	// --- Odes / Psalms ---
	odes: [
		"Odes",
		"Ode",
		"Odes.",
		"Ode.",
		"Biblical Odes",
		"Odes of the Bible",
		// common alternates
		"Odae",
		"Odes (Bible)",
	],

	odesofsolomon: [
		"Odes of Solomon",
		"Ode Sol",
		"Ode Sol.",
		"Odes Sol",
		"Odes Sol.",
		"Odae Salomonis",
		// common alternates
		"Odes of Salomon",
		"Odae Solomonis",
	],

	fifthezra: [
		"5 Ezra",
		"V Ezra",
		"5 Esdras",
		"V Esdras",
		// extra period variants
		"5 Ezr",
		"5 Ezr.",
		"V Ezr",
		"V Ezr.",
		// common packaging title
		"5 Ezra (Appendix)",
	],

	sixthezra: [
		"6 Ezra",
		"VI Ezra",
		"6 Esdras",
		"VI Esdras",
		// extra period variants
		"6 Ezr",
		"6 Ezr.",
		"VI Ezr",
		"VI Ezr.",
		// common packaging title
		"6 Ezra (Appendix)",
	],

	greekapocalypseofezra: [
		"Greek Apocalypse of Ezra",
		"Apocalypse of Ezra (Greek)",
		"Vision of Ezra",
		// common alternates
		"Apocalypse of Esdras (Greek)",
		"Greek Ezra Apocalypse",
	],

	// --- Baruch extras ---
	fourthbaruch: [
		"4 Baruch",
		"4 Bar",
		"4 Bar.",
		"IV Baruch",
		"Fourth Baruch",
		"Paralipomena of Jeremiah",
		"Rest of the Words of Baruch",
		// common alternates
		"Paralipomena Jeremiae",
		"Paralipomena of Jeremias",
		"4Bar",
	],

	// --- Additional minor apocalypse literature ---
	apocalypseofabraham: [
		"Apocalypse of Abraham",
		"Apoc Abr",
		"Apoc. Abr.",
		// extra likely variant
		"Apoc. of Abraham",
		// Latin-ish
		"Apocalypsis Abrahae",
	],

	apocalypseofadam: [
		"Apocalypse of Adam",
		"Apoc Adam",
		"Apoc. Adam",
		// extra likely variant
		"Apoc. of Adam",
	],

	apocalypseofelijah: [
		"Apocalypse of Elijah",
		"Apoc Elijah",
		"Apoc. Elijah",
		// extra likely variant
		"Apoc. of Elijah",
		// alt titles
		"Apocalypse of Elias",
		"Apoc. Elias",
		"Apoc Elias",
		"Apoc Elias.",
	],

	ladderofjacob: [
		"Ladder of Jacob",
		"Apocalypse of Jacob",
		// common alternates
		"Jacob&#39;s Ladder",
		"Ladder of Jacob (Apocryphon)",
	],

	historyoftherechabites: [
		"History of the Rechabites",
		"Narrative of Zosimus",
		"Apocalypse of Zosimus",
		// extra likely period variants
		"Hist. of the Rechabites",
		// common alternates
		"Zosimus",
		"Story of Zosimus",
	],
};
