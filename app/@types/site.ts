export interface ISite {
	site_id: number;
	host: string;
	point_id: number;
	settings: {
		useHttps: boolean;
		langUrlPrefix: boolean;
	},
	aliases: string[];
	system_host: string;
	validUrlPrefix: string[];
	default: {
		lang: number;
		country: number;
		urlPrefix: boolean;
	}
}

export interface ISitesByHost {
	[host: string]: ISite
}