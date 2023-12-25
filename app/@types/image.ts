export interface IImage {
	image_id: number;
	site_id: number;
	lang_id: number;
	name: string;
	size: number;
	path: string;
	width: number;
	height: number;
	used_in: TImageUsed[]|null;
	mime_type: string;
	created_at: string;
	deleted_at: string|null;
}

export interface IImageData {
	imageId: number|null;
	width?: number;
	height?: number;
	size?: number;
	cloudPath?: string;
}

export enum TImageUsed {
	page = 'page',
	category = 'category',
	product = 'product',
	manufacturer = 'manufacturer',
	carousel = 'carousel',
	instagram = 'instagram',
	background = 'background',
	blog = 'blog',
	form = 'form',
}