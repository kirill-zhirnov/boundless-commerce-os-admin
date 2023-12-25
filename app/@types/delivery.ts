export interface ICountry {
	country_id: number;
	code: string|null;
	vk_id: number|null;
	created_at: string;
	deleted_at: string|null;
}

export interface ICountryText {
	country_id: number;
	lang_id: number;
	title: string|null;
}

export interface IVwCountry {
	country_id: number;
	code: string|null;
	lang_id: number;
	title: string|null;
}