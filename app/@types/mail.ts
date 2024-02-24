export interface IMailTransport {
	send(): Promise<undefined>;

	setBodyText(text: string): IMailTransport;

	setBodyHtml(html: string): IMailTransport;

	addTo(email: string|string[]): IMailTransport;

	addReplyTo(email: string|string[]): IMailTransport;

	setReplyTo(email: string|string[]): IMailTransport;

	setSubject(subject: string): IMailTransport;

	setSource(email: string): IMailTransport;
}