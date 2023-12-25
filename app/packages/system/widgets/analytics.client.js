//спрашиваем о GDPR, если согласен - запускаем аналитику
import Widget from '../../../modules/widget/widget.client';
import Cookies from 'js-cookie';
import {initMetrika} from '../../../modules/analytics/index.client';

const COOKIE_NAME = 'boundless-analytics';
const VISIBLE_CLASS = 'analytics-warning__card_visible';
const HIDDEN_CLASS = 'analytics-warning__card_hidden';

export default class Analytics extends Widget {
	attributes() {
		return {
			class: 'analytics-warning'
		};
	}

	run() {
		return this.render('analytics');
	}

	runLazyInit() {
		if (!this.getClientRegistry().getConfig().analytics.metrikaId) {
			return;
		}

		const cookieValue = Cookies.get(COOKIE_NAME);
		const $card = this.$('.card');
		setTimeout(() => {
			if (cookieValue === undefined) {
				$card.animateCss('fadeInUp', () => $card.addClass(VISIBLE_CLASS));
			} else {
				this.hideCard();
				if (cookieValue == '1') {
					this.startAnalytics();
				}
			}
		}, 1000);
	}

	hideCard() {
		this.$('.card').addClass(HIDDEN_CLASS);
	}

	startAnalytics() {
		initMetrika();
	}

	events() {
		return {
			'click button.agree': (e) => {
				e.preventDefault();
				Cookies.set(COOKIE_NAME, '1', {
					expires: 365,
					sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
					secure: process.env.NODE_ENV === 'production'
				});
				this.hideCard();
				this.startAnalytics();
			}
		};
	}

	getFileName() {
		return __filename;
	}
}