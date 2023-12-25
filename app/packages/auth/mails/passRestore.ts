import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';

export default class PasswordRestoreMails extends BasicInstanceMail {
	async sendPasswordRestoreEmail(username: string, email: string, token: string|null = null, restoreUrl: string|null = null) {
		const frontController = await this.getFrontController();

		if (token) {
			const linkParams = this.getLinkParams(token);
			restoreUrl = frontController.getClientRegistry().getRouter().url('auth/restore/password', linkParams, true);
		}

		const html = await this.render('passRestore', {restoreUrl, username});
		const mail = await this.getMail();

		mail.setSubject(this.frontController.getClientRegistry().getI18n().__('Password restore'));
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		mail.addTo(email);

		await mail.send();
	}

	getLinkParams(token) {
		return {
			tokenId: token.dataValues.token_id,
			token1: token.dataValues.token_1,
			token2: token.dataValues.token_2
		};
	}

	getFileName(): string {
		return __filename;
	}
}