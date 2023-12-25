import FeedbackRequestMailer from './mailer/feedbackRequestMailer';

export default class CronMailer {
	async sendAll() {
		await this.sendRequestForFeedback();
	}

	async sendRequestForFeedback() {
		const mailer = new FeedbackRequestMailer();
		await mailer.send();
	}
}