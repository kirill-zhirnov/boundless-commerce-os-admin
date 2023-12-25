import BasicAuthentication from './basic';

export default class CookieAuthentication extends BasicAuthentication {
	static initClass() {

		this.COOKIE_NAME = 'rememberMe';

		this.TOKEN_TYPE = 'rememberMe';
	}

	// @user - instance of @modules/authentication/user
	constructor(instanceRegistry, site, lang, user, expressRequest, expressResponse) {
		super(instanceRegistry, lang);

		this.site = site;
		this.user = user;
		this.expressRequest = expressRequest;
		this.expressResponse = expressResponse;

		this.PersonToken = this.getDb().model('personToken');
	}

	async getUser() {
		if (this.userJson !== null)
			return this.userJson;

		const cookie = this.getCookie();
		if (!cookie) {
			this.userJson = false;
			return this.userJson;
		}

		const [tokenId, token1, token2] = this.parseCookie(cookie);

		const personToken = await this.PersonToken.findToken(CookieAuthentication.TOKEN_TYPE, tokenId, token1, token2);

		if (personToken) {
//		remove valid token & set new one
			await personToken.destroy();
			await this.clearCookie();

			const select = this.getUserSql();
			select.where('person.person_id = ?', personToken.person_id);
			select.where('person.site_id = ?', this.site.site_id);

			const sql = select.toParam();
			const rows = await this.getDb().sql(sql.text, sql.values);
			this.userJson = this.rowsToUserJson(rows);

			if (this.userJson) {
				await this.createAndSetToken(this.userJson.id);
			}
		}

		if (!this.userJson) {
			this.userJson = false;
		}

		return this.userJson;
	}

	getCookie() {
		return this.expressRequest.signedCookies[CookieAuthentication.COOKIE_NAME];
	}

	parseCookie(cookie) {
		const arr = cookie.split('.');

		const tokenId = arr[0] ? arr[0] : '';
		const token1 = arr[1] ? arr[1] : '';
		const token2 = arr[2] ? arr[2] : '';

		return [tokenId, token1, token2];
	}

//	create token and set it in cookie
	createAndSetToken(userId = null) {
		if ((userId == null)) {
			userId = this.user.getId();

			if (!userId) {
				throw new Error('Cant set token for guest user');
			}
		}

		return this.PersonToken.createToken(CookieAuthentication.TOKEN_TYPE, userId)
			.then(token => {
				this.setCookie(token.token_id, token.token_1, token.token_2);

			});
	}

	setCookie(tokenId, token1, token2) {
		const cookieProps = {
			httpOnly: true,
			signed: true,
			maxAge: 86400000 * 365, // 365 days,
		};

		if (process.env.NODE_ENV === 'production') {
			Object.assign(cookieProps, {
				//for wix (IFrame):
				sameSite: 'none',
				secure: true
			});
		}

		return this.expressResponse.cookie(CookieAuthentication.COOKIE_NAME, `${tokenId}.${token1}.${token2}`, cookieProps);
	}

	clearCookie() {
		try {
			return this.expressResponse.clearCookie(CookieAuthentication.COOKIE_NAME);
		} catch (e) {
			return console.error(e);
		}
	}

	onLogout() {
		return this.clearCookie();
	}
}
CookieAuthentication.initClass();
