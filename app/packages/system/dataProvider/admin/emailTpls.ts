import DataProvider from '../../../../modules/dataProvider';
import {IEmailTpl} from '../../../../@types/system';

export default class EmailTplsDataProvider extends DataProvider<IEmailTpl> {

	getRules() {
		return super.getRules().concat([
			['title,alias,subject', 'safe']
		]);
	}

	createQuery() {
		this.q.from('email_tpl');

		this.compare('title', this.getSafeAttr('title'), true);
		this.compare('alias', this.getSafeAttr('alias'), true);
		this.compare('subject', this.getSafeAttr('subject'), true);
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'title',
				alias: 'alias',
				subject: 'subject'
			}
		};
	}
}