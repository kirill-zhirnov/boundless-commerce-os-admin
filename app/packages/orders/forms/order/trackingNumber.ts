import {diff} from 'deep-object-diff';
import Form, {IFormOptions, ITplData} from '../../../../modules/form';
import * as orderEvents from '../../components/orderEventNotification';
import {ITrackNumberModel, ITrackNumberModelStatic} from '../../models/trackNumber';

interface IAttrs {
	track_number: string;
}

export default class TrackingNumber extends Form<IAttrs, ITrackNumberModel> {
	protected orderId: number;
	protected trackNumsBeforeSave: {[key: string]: any} | null = null;

	constructor(options: IFormOptions<ITrackNumberModel> & {orderId: number}) {
		super(options);

		this.orderId = options.orderId;
	}

	getRules() {
		return [
			['track_number', 'required']
		];
	}

	async save() {
		if (!this.record) {
			this.record = (this.getModel('trackNumber') as ITrackNumberModelStatic).build().set({
				order_id: this.orderId
			});
		}

		const attrs = this.getSafeAttrs();

		await this.record.set({
			track_number: attrs.track_number
		}).save();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.orderId,
			{trackingNumbers: diff(this.trackNumsBeforeSave, await this.loadAllTrackNums())}
		);
	}

	async loadRecord() {
		this.trackNumsBeforeSave = await this.loadAllTrackNums();

		return await (this.getModel('trackNumber') as ITrackNumberModelStatic).findException({
			where: {
				track_number_id: this.pk,
				order_id: this.orderId
			}
		}) as ITrackNumberModel;
	}

	async getTplData() {
		const data: ITplData<IAttrs> & {orderId?: number} = await super.getTplData();
		data.orderId = this.orderId;

		return data;
	}

	async loadAllTrackNums() {
		const rows = await (this.getModel('trackNumber') as ITrackNumberModelStatic).findAll({
			where: {
				order_id: this.orderId
			},
			order: [['created_at', 'asc']]
		});

		return rows.map(el => el.toJSON());
	}
}