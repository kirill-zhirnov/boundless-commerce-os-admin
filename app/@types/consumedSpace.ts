export enum TSpaceType {
	s3 = 's3',
	db = 'db'
}

export interface IConsumedSpace {
	space_id: number;
	type: TSpaceType;
	volume: number;
	bucket: string|null;
	updated_at: string;
}