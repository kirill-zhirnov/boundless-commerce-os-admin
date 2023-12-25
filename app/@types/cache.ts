export interface IServerCache {
	warmUp: () => Promise<void>;
	load: (key: string, fallback?: () => any, dependencies?: any) => Promise<any>;
	save: (key: string, data: any, dependencies?: any) => Promise<any>;
	remove: (key: string|string[]) => Promise<any>;
	clean: (dependencies?: any) => Promise<any>;
	clearByPattern: (pattern: string) => Promise<any>;
}