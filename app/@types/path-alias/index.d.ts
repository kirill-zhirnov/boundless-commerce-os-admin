declare module 'path-alias' {
	export function resolve(shortPath: string): string;

	export function getRoot(): string;

	export function setAliases(aliases: {}, resolve: boolean): void;

	export function setRequireCallback(callback: (filePath: string, resolved: string) => void): void;
}