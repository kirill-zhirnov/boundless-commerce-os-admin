import BasicForm from './basic';
import _ from 'underscore';
import helpCatalog from '../../../../modules/help';
import {TPublishingStatus} from '../../../../@types/db';
import * as productEvents from '../../components/productEventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class ProductForm extends BasicForm {
	constructor(options) {
		super(options);

		this.statusBeforeSave = null;
	}

	getRules() {
		return [
			['title', 'required'],
			['description', 'safe'],
			['title', 'validateStorageAvailable'],
			[
				'sku',
				'isUnique', {
					field: 'sku',
					row: this.getRecord(),
					model: this.getModel('product')
				}
			],
		];
	}

	async getTplData() {
		const out = await super.getTplData();
		//@ts-ignore
		const {has_variants, status} = this.record;

		Object.assign(out, {
			hasVariants: has_variants,
			commodityGroup: this.getCommodityGroupSettings(),
			status,
			help: {
				form: helpCatalog.get('productForm'),
				whatIsVariant: helpCatalog.get('whatIsVariant'),
			}
		});

		return out;
	}

	async save() {
		//@ts-ignore
		const {sku, title, description} = this.getSafeAttrs();

		await this.getRecord();
		//@ts-ignore
		this.statusBeforeSave = this.record.status;

		//@ts-ignore
		this.record.set({
			sku
		});
		//@ts-ignore
		await this.record.save();


		await this.getModel('productText').update({
			title,
			description
		}, {
			where: {
				//@ts-ignore
				product_id: this.record.product_id,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	setupChildFormKit(childFormKit) {
		childFormKit.setPk(this.pk);
		childFormKit.setOptions({
			record: this.record
		});

		return;
	}

	async onFormsGroupSaved() {
		await this.record.reload();
		//@ts-ignore
		const statusAfterSave = this.record.status;
		if (statusAfterSave === TPublishingStatus.draft) return;

		const type = this.statusBeforeSave === TPublishingStatus.draft && statusAfterSave !== TPublishingStatus.draft
			? TQueueEventType.created
			: TQueueEventType.updated;

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			type,
			this.pk
		);

		// return this.essenceChanged('product', this.pk);
	}

	setupAttrsByRecord() {
		const attrs = {
			//@ts-ignore
			sku: this.record.sku
		};

		//@ts-ignore
		Object.assign(attrs, _.pick(this.record.productTexts[0], [
			'title',
			'description'
		]));

		this.setAttributes(attrs);
	}

	async validateStorageAvailable() {
		const storageAvailable = await this.getInstanceRegistry().getTariff().checkStorageLimit({fileSize: 200000});

		if (!storageAvailable) {
			this.addError('title', 'storageLimit', this.__('Tariff\'s storage limit is reached.'));
			return;
		}
	}
}