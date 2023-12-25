import {SESClient, SendEmailCommand, SendEmailRequest} from '@aws-sdk/client-ses';
import {SendEmailResponse} from 'aws-sdk/clients/ses';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';

export default class InstanceSES {
	protected client: SESClient;
	protected charset: string;
	protected params: SendEmailRequest;

	constructor() {
		this.charset = 'UTF-8';

		this.params = {
			Destination: {
				CcAddresses: [],
				ToAddresses: [],
			},
			Message: {
				Body: {
					Text: {
						Data: '',
						Charset: this.charset
					},
					Html: {
						Charset: this.charset,
						Data: '',
					},
				},
				Subject: {
					Charset: this.charset,
					Data: '',
				},
			},
			Source: '',
			ReplyToAddresses: [],
		};
	}

	async send(): Promise<SendEmailResponse> {
		const command = new SendEmailCommand(this.params);
		return this.getClient().send(command);
	}

	setBodyText(text: string) {
		this.params.Message.Body.Text = {
			Data: text,
			Charset: this.charset
		};

		return this;
	}

	setBodyHtml(html: string) {
		this.params.Message.Body.Html = {
			Data: html,
			Charset: this.charset
		};

		return this;
	}

	addTo(email: string|string[]) {
		if (Array.isArray(email)) {
			this.params.Destination.ToAddresses = this.params.Destination.ToAddresses.concat(email);
		} else {
			this.params.Destination.ToAddresses.push(email);
		}

		return this;
	}

	addReplyTo(email: string|string[]) {
		if (!Array.isArray(this.params.ReplyToAddresses)) {
			this.params.ReplyToAddresses = [];
		}

		if (Array.isArray(email)) {
			this.params.ReplyToAddresses = this.params.ReplyToAddresses.concat(email);
		} else {
			this.params.ReplyToAddresses.push(email);
		}

		return this;
	}

	setReplyTo(email: string|string[]) {
		this.params.ReplyToAddresses = Array.isArray(email) ? email : [email];

		return this;
	}

	setSubject(subject: string) {
		this.params.Message.Subject = {
			Data: subject,
			Charset: this.charset
		};

		return this;
	}

	setSource(email: string) {
		this.params.Source = email;

		return this;
	}

	getClient() {
		if (!this.client) {
			const {aws: {region, accessKeyId, secretAccessKey}} = wrapperRegistry.getConfig();

			this.client = new SESClient({
				region,
				credentials: {
					accessKeyId,
					secretAccessKey
				}
			});
		}

		return this.client;
	}
}