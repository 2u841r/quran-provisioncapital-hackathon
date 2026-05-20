export const JUZ_SURAHS: Record<number, number[]> = {
	1: [1, 2], 2: [2], 3: [2, 3], 4: [3, 4], 5: [4],
	6: [4, 5], 7: [5, 6], 8: [6, 7], 9: [7, 8], 10: [8, 9],
	11: [9, 10, 11], 12: [11, 12], 13: [12, 13, 14], 14: [15, 16], 15: [17, 18],
	16: [18, 19, 20], 17: [21, 22], 18: [23, 24, 25], 19: [25, 26, 27], 20: [27, 28, 29],
	21: [29, 30, 31, 32, 33], 22: [33, 34, 35, 36], 23: [36, 37, 38, 39], 24: [39, 40, 41],
	25: [41, 42, 43, 44, 45], 26: [46, 47, 48, 49, 50, 51], 27: [51, 52, 53, 54, 55, 56, 57],
	28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
	29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
	30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
};

export const SURAH_VERSE_COUNTS: Record<number, number> = {
	1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
	11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
	21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
	31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
	41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
	51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
	61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
	71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
	81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
	91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
	101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
	111: 5, 112: 4, 113: 5, 114: 6
};

export const SURAH_NAMES: Record<number, { en: string; ar: string }> = {
	1: { en: 'Al-Fatihah', ar: 'الفاتحة' }, 2: { en: 'Al-Baqarah', ar: 'البقرة' },
	3: { en: "Ali 'Imran", ar: 'آل عمران' }, 4: { en: 'An-Nisa', ar: 'النساء' },
	5: { en: "Al-Ma'idah", ar: 'المائدة' }, 6: { en: "Al-An'am", ar: 'الأنعام' },
	7: { en: "Al-A'raf", ar: 'الأعراف' }, 8: { en: 'Al-Anfal', ar: 'الأنفال' },
	9: { en: 'At-Tawbah', ar: 'التوبة' }, 10: { en: 'Yunus', ar: 'يونس' },
	11: { en: 'Hud', ar: 'هود' }, 12: { en: 'Yusuf', ar: 'يوسف' },
	13: { en: "Ar-Ra'd", ar: 'الرعد' }, 14: { en: 'Ibrahim', ar: 'إبراهيم' },
	15: { en: 'Al-Hijr', ar: 'الحجر' }, 16: { en: 'An-Nahl', ar: 'النحل' },
	17: { en: "Al-Isra'", ar: 'الإسراء' }, 18: { en: 'Al-Kahf', ar: 'الكهف' },
	19: { en: 'Maryam', ar: 'مريم' }, 20: { en: 'Ta-Ha', ar: 'طه' },
	21: { en: 'Al-Anbiya', ar: 'الأنبياء' }, 22: { en: 'Al-Hajj', ar: 'الحج' },
	23: { en: "Al-Mu'minun", ar: 'المؤمنون' }, 24: { en: 'An-Nur', ar: 'النور' },
	25: { en: 'Al-Furqan', ar: 'الفرقان' }, 26: { en: "Ash-Shu'ara", ar: 'الشعراء' },
	27: { en: 'An-Naml', ar: 'النمل' }, 28: { en: 'Al-Qasas', ar: 'القصص' },
	29: { en: 'Al-Ankabut', ar: 'العنكبوت' }, 30: { en: 'Ar-Rum', ar: 'الروم' },
	31: { en: 'Luqman', ar: 'لقمان' }, 32: { en: 'As-Sajdah', ar: 'السجدة' },
	33: { en: 'Al-Ahzab', ar: 'الأحزاب' }, 34: { en: "Saba'", ar: 'سبأ' },
	35: { en: 'Fatir', ar: 'فاطر' }, 36: { en: 'Ya-Sin', ar: 'يس' },
	37: { en: 'As-Saffat', ar: 'الصافات' }, 38: { en: 'Sad', ar: 'ص' },
	39: { en: 'Az-Zumar', ar: 'الزمر' }, 40: { en: 'Ghafir', ar: 'غافر' },
	41: { en: 'Fussilat', ar: 'فصلت' }, 42: { en: 'Ash-Shura', ar: 'الشورى' },
	43: { en: 'Az-Zukhruf', ar: 'الزخرف' }, 44: { en: 'Ad-Dukhan', ar: 'الدخان' },
	45: { en: 'Al-Jathiyah', ar: 'الجاثية' }, 46: { en: 'Al-Ahqaf', ar: 'الأحقاف' },
	47: { en: 'Muhammad', ar: 'محمد' }, 48: { en: 'Al-Fath', ar: 'الفتح' },
	49: { en: 'Al-Hujurat', ar: 'الحجرات' }, 50: { en: 'Qaf', ar: 'ق' },
	51: { en: 'Adh-Dhariyat', ar: 'الذاريات' }, 52: { en: 'At-Tur', ar: 'الطور' },
	53: { en: 'An-Najm', ar: 'النجم' }, 54: { en: 'Al-Qamar', ar: 'القمر' },
	55: { en: 'Ar-Rahman', ar: 'الرحمن' }, 56: { en: "Al-Waqi'ah", ar: 'الواقعة' },
	57: { en: 'Al-Hadid', ar: 'الحديد' }, 58: { en: 'Al-Mujadila', ar: 'المجادلة' },
	59: { en: 'Al-Hashr', ar: 'الحشر' }, 60: { en: 'Al-Mumtahanah', ar: 'الممتحنة' },
	61: { en: 'As-Saf', ar: 'الصف' }, 62: { en: "Al-Jumu'ah", ar: 'الجمعة' },
	63: { en: 'Al-Munafiqun', ar: 'المنافقون' }, 64: { en: 'At-Taghabun', ar: 'التغابن' },
	65: { en: 'At-Talaq', ar: 'الطلاق' }, 66: { en: 'At-Tahrim', ar: 'التحريم' },
	67: { en: 'Al-Mulk', ar: 'الملك' }, 68: { en: 'Al-Qalam', ar: 'القلم' },
	69: { en: 'Al-Haqqah', ar: 'الحاقة' }, 70: { en: "Al-Ma'arij", ar: 'المعارج' },
	71: { en: 'Nuh', ar: 'نوح' }, 72: { en: 'Al-Jinn', ar: 'الجن' },
	73: { en: 'Al-Muzzammil', ar: 'المزمل' }, 74: { en: 'Al-Muddaththir', ar: 'المدثر' },
	75: { en: 'Al-Qiyamah', ar: 'القيامة' }, 76: { en: 'Al-Insan', ar: 'الإنسان' },
	77: { en: 'Al-Mursalat', ar: 'المرسلات' }, 78: { en: "An-Naba'", ar: 'النبأ' },
	79: { en: "An-Nazi'at", ar: 'النازعات' }, 80: { en: 'Abasa', ar: 'عبس' },
	81: { en: 'At-Takwir', ar: 'التكوير' }, 82: { en: 'Al-Infitar', ar: 'الانفطار' },
	83: { en: 'Al-Mutaffifin', ar: 'المطففين' }, 84: { en: 'Al-Inshiqaq', ar: 'الانشقاق' },
	85: { en: 'Al-Buruj', ar: 'البروج' }, 86: { en: 'At-Tariq', ar: 'الطارق' },
	87: { en: "Al-A'la", ar: 'الأعلى' }, 88: { en: 'Al-Ghashiyah', ar: 'الغاشية' },
	89: { en: 'Al-Fajr', ar: 'الفجر' }, 90: { en: 'Al-Balad', ar: 'البلد' },
	91: { en: 'Ash-Shams', ar: 'الشمس' }, 92: { en: 'Al-Layl', ar: 'الليل' },
	93: { en: 'Ad-Duha', ar: 'الضحى' }, 94: { en: 'Ash-Sharh', ar: 'الشرح' },
	95: { en: 'At-Tin', ar: 'التين' }, 96: { en: 'Al-Alaq', ar: 'العلق' },
	97: { en: 'Al-Qadr', ar: 'القدر' }, 98: { en: 'Al-Bayyinah', ar: 'البينة' },
	99: { en: 'Az-Zalzalah', ar: 'الزلزلة' }, 100: { en: "Al-'Adiyat", ar: 'العاديات' },
	101: { en: "Al-Qari'ah", ar: 'القارعة' }, 102: { en: 'At-Takathur', ar: 'التكاثر' },
	103: { en: "Al-'Asr", ar: 'العصر' }, 104: { en: 'Al-Humazah', ar: 'الهمزة' },
	105: { en: 'Al-Fil', ar: 'الفيل' }, 106: { en: 'Quraysh', ar: 'قريش' },
	107: { en: "Al-Ma'un", ar: 'الماعون' }, 108: { en: 'Al-Kawthar', ar: 'الكوثر' },
	109: { en: 'Al-Kafirun', ar: 'الكافرون' }, 110: { en: 'An-Nasr', ar: 'النصر' },
	111: { en: 'Al-Masad', ar: 'المسد' }, 112: { en: 'Al-Ikhlas', ar: 'الإخلاص' },
	113: { en: 'Al-Falaq', ar: 'الفلق' }, 114: { en: 'An-Nas', ar: 'الناس' }
};

export function getSurahsInRange(juzStart: number, juzEnd: number): number[] {
	const set = new Set<number>();
	for (let j = juzStart; j <= juzEnd; j++) {
		for (const s of JUZ_SURAHS[j] ?? []) set.add(s);
	}
	return [...set].sort((a, b) => a - b);
}

export function validateGuestName(name: string): string | null {
	const trimmed = name.trim();
	if (trimmed.length < 2) return 'Name must be at least 2 characters';
	if (trimmed.length > 30) return 'Name must be 30 characters or less';
	if (/@/.test(trimmed)) return 'Name cannot contain email addresses';
	if (/https?:\/\/|www\./i.test(trimmed)) return 'Name cannot contain URLs';
	if (/\d{4,}/.test(trimmed)) return 'Name cannot contain 4 or more consecutive digits';
	return null;
}
