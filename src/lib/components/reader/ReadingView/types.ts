export type LineWord = {
	text: string;
	lineNumber: number;
	verseKey: string;
	charTypeName: string;
	position: number;
};

export type LineMap = Map<number, LineWord[]>;
