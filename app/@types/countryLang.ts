export interface ILang {
	lang_id: number;
	code: string;
	is_backend: boolean;
	titles: {
		[langId: string]: string
	}
}

export interface IShortCountry {
	country_id: number;
	code: string;
}