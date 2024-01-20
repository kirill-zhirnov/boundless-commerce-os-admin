import Form from '../../../modules/form';
import {IPriceModel, IPriceModelStatic} from '../models/price';
import {ICustomerGroupModelStatic} from '../../customer/models/customerGroup';
import {Op} from 'sequelize';
import {notifyEvent} from '../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../@types/rabbitMq';

export interface IAttrs {
	title: string;
	alias: string;
	is_public: string;
	has_old_price: string;
	groups: string[];
	sort: string;
}

export default class PriceForm extends Form<IAttrs, IPriceModel> {
	getRules() {
		return [
			['title, alias', 'required'],
			['alias', 'trim'],
			['alias', 'isAlias'],
			['alias', 'isUnique', {
				field: 'alias',
				row: this.record,
				model: this.getModel('price')
			}],
			['is_public, has_old_price', 'safe'],
			['groups', 'inOptions', {options: 'groups', multiple: true}],
			['sort', 'isNum']
		];
	}

	async save() {
		if (!this.record) {
			this.record = this.getModel('price').build() as IPriceModel;
		}

		const {title, alias, is_public, has_old_price, groups, sort} = this.getSafeAttrs();

		this.record.set({
			is_public: is_public == '1',
			has_old_price: has_old_price == '1',
			sort: sort != '' ? parseInt(sort) : null
		});

		if (!this.record.isSystemPrice()) {
			this.record.set({alias});
		}
		await this.record.save();

		await this.getModel('priceText').update({title}, {
			where: {
				price_id: this.record.price_id,
				lang_id: this.getEditingLang().lang_id
			}
		});

		await this.savePriceGroups(groups || []);

		await notifyEvent(
			'price',
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.scenario == 'insert' ? TQueueEventType.created : TQueueEventType.updated,
			[this.record.price_id]
		);
	}

	async savePriceGroups(groups: string[]) {
		for (const groupId of groups) {
			await this.getDb().sql(`
				insert into price_group_rel (price_id, group_id)
				values (:priceId, :groupId)
				on conflict do nothing
			`, {
				priceId: this.record.price_id, groupId
			});
		}

		const where = {price_id: this.record.price_id};
		if (groups.length > 0) {
			Object.assign(where, {
				group_id: {
					[Op.notIn]: groups
				}
			});
		}

		await this.getModel('priceGroupRel').destroy({where});
	}

	async loadRecord(): Promise<IPriceModel> {
		return await (this.getModel('price') as IPriceModelStatic).findException({
			include: [
				{
					model: this.getModel('priceText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				},
				{
					model: this.getModel('priceGroupRel'),
				},
			],
			where: {
				price_id: this.pk
			}
		}) as IPriceModel;
	}

	setupAttrsByRecord() {
		const attrs: IAttrs = {
			title: this.record.priceTexts[0].title,
			alias: this.record.alias,
			is_public: this.record.is_public ? '1' : '0',
			has_old_price: this.record.has_old_price ? '1' : '0',
			groups: this.record.priceGroupRels.map(({group_id}) => String(group_id)),
			sort: String(this.record.sort)
		};

		this.setAttributes(attrs);
	}

	async getTplData() {
		const out = await super.getTplData();

		Object.assign(out, {
			isSystemPrice: this.record && this.record.isSystemPrice()
		});

		return out;
	}

	rawOptions() {
		return {
			groups: (this.getModel('customerGroup') as ICustomerGroupModelStatic).findCustomerOptions()
		};
	}
}