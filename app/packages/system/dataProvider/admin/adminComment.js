import DataProvider from '../../../../modules/dataProvider/index';
import {TDateFormatType} from '../../../../modules/locale';

export default class AdminComment extends DataProvider {
	constructor(options) {
		super(options);
	}

	getRules() {
		return [
			['pk, type', 'required'],
			['pk', 'isNum']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.field('admin_comment.*');

		this.q.field('person.email');
		this.q.field('person_profile.first_name');
		this.q.field('person_profile.last_name');
		this.q.field('person_profile.patronymic');

		this.q.from('admin_comment');
		this.q.join('essence', null, 'essence.essence_id = admin_comment.essence_id');
		this.q.left_join('person', null, 'person.person_id = admin_comment.person_id');
		this.q.left_join('person_profile', null, 'person.person_id = person_profile.person_id');

		this.q.where('essence.type = ?', this.getSafeAttr('type'));
		this.q.where('essence.essence_local_id = ?', this.getSafeAttr('pk'));
	}

	sortRules() {
		return {
			default: [{created: 'desc'}],
			attrs: {
				created: 'admin_comment.created_at'
			}
		};
	}

	async prepareData(rows) {
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			rows[i].created_at = this.getLocale().formatDateTime(row.created_at, TDateFormatType.short);
			//@ts-ignore
			rows[i].person_title = this.getModel('person').getPersonTitleByRow(row);
		}

		return rows;
	}

	getPageSize() {
		return false;
	}
}