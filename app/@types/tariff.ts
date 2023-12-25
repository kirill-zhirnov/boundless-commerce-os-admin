export interface ITariffModule {
	checkFeatureAccess: (feature: string) => boolean;
	checkStorageLimit: (options?: IStorageLimitOptions) => Promise<boolean>;
	checkUsersLimit: () => Promise<boolean>,

	checkProductLimit: (options?: IProductLimitOptions) => Promise<boolean>
}

export interface IStorageLimitOptions {
	fileSize?: number;
	forceRefresh?: boolean;
}

export interface IProductLimitOptions {
	qty?: number,
	pk?: number,
	action?: string
}