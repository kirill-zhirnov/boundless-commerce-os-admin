import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';

export default class PasswordRestoreMails extends BasicInstanceMail {
	async sendPasswordRestoreEmail(username: string, email: string, token: string|null = null, restoreUrl: string|null = null) {
		const frontController = await this.getFrontController();

		if (token) {
			const linkParams = this.getLinkParams(token);
			restoreUrl = frontController.getClientRegistry().getRouter().url('auth/restore/password', linkParams, true);
		}

		const alias = 'auth.passwordRestore';
		const data = {restoreUrl, username};
		const {html, subject} = await this.renderDbTemplate({
			alias, data
		});
		await this.emitMailEvent({
			alias,
			data,
			html,
			subject,
			recipients: [email]
		});
	}

	getLinkParams(token) {
		return {
			tokenId: token.dataValues.token_id,
			token1: token.dataValues.token_1,
			token2: token.dataValues.token_2
		};
	}
}