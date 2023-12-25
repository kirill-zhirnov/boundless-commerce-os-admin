import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IQueueModelChangedData, TQueueEventType} from '../../../@types/rabbitMq';
import ExtendedSequelize from '../../db/sequelize';

export default abstract class BasicModelHandler {
	protected db: ExtendedSequelize;

	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected type: TQueueEventType,
		protected data: IQueueModelChangedData
	) {
		this.db = instanceRegistry.getDb();
	}

	abstract handle();
}