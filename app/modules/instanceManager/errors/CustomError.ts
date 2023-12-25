export default class CustomError extends Error {
	constructor(public readonly code: TCustomErrorCode, msg: string) {
		super(msg);
	}

	public toJSON() {
		return {code: this.code, error: this.message};
	}
}

export enum TCustomErrorCode {
	InvalidSubdomain = 100,
	SubdomainTaken
}