export interface IProductImport {
	import_id: number;
	person_id: number;
	site_id: number;
	lang_id: number;
	type: TProductImportType;
	run: TProductImportRun;
	source_type: TProductImportSource;
	file_name: string;
	file_path: string;
	url: string|null;
	cloud_path: string|null;
	created_at: null;
	deleted_at: string | null;
	settings: {[key: string]: any}|null;
}

export enum TProductImportAction {
	run = 'run',
	download = 'download'
}

export enum TProductImportType {
	csv = 'csv',
	excel = 'excel',
	yml = 'yml'
}

export enum TProductImportRun {
	once = 'once',
	cron = 'cron'
}

export enum TProductImportSource {
	file = 'file',
	url = 'url'
}