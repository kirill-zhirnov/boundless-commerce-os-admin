import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import ExtendedSequelize from '../../db/sequelize';
import {IConfig} from '../../../@types/config';

/**
 * Prepare DB: creates the right option for delivery_server, user mapping and refresh materialized views.
 */
export default class DbInstaller {
	protected db: ExtendedSequelize;
	protected config: IConfig;

	constructor() {
		this.db = wrapperRegistry.getDb();
		this.config = wrapperRegistry.getConfig();
	}

	async install() {
		await this.createDeliveryViewUser();
		await this.prepareSampleDb();
	}

	async createDeliveryViewUser() {
		try {
			await this.db.sql('create user "' + this.config.deliveryViewDb.user + '"');
		} catch (e) {
			//skip err
		}

		await this.db.sql('alter user "' + this.config.deliveryViewDb.user + '" with password :pass', {
			pass: this.config.deliveryViewDb.pass
		});

		//connect to delivery db and grant permissions:
		const deliveryDbConfig = this.config.packages.delivery.deliveryDb;
		const deliveryDb = new ExtendedSequelize(deliveryDbConfig.name, deliveryDbConfig.user, deliveryDbConfig.pass,
			ExtendedSequelize.getConstructOptions(deliveryDbConfig.config)
		);
		await deliveryDb.sql('grant all privileges on all tables in schema public to "' + this.config.deliveryViewDb.user + '"');
		await deliveryDb.sql('grant all privileges on all sequences in schema public to "' + this.config.deliveryViewDb.user + '"');
		await deliveryDb.close();
	}

	async prepareSampleDb() {
		const sampleDb = new ExtendedSequelize(
			this.config.instanceManager.db.sample,
			this.config.db.user,
			this.config.db.pass,
			ExtendedSequelize.getConstructOptions(this.config.db.config)
		);

		//for the off chances - remove all existing options:
		for (const option of ['dbname', 'host', 'port']) {
			try {
				await sampleDb.sql('alter server delivery_server options (drop ' + option + ')');
			} catch (e) {
			//skip err
			}
		}

		await sampleDb.sql(`
			alter server delivery_server options (host :host, dbname :dbname, port :port)
		`, {
			host: this.config.packages.delivery.deliveryDb.config.host,
			dbname: this.config.packages.delivery.deliveryDb.name,
			port: String(this.config.packages.delivery.deliveryDb.config.port),
		});

		await sampleDb.sql(`
			drop user mapping if exists for "${this.config.db.user}" server delivery_server
		`);

		await sampleDb.sql(`
			create user mapping for "${this.config.db.user}" server delivery_server options (
				"user" :deliveryUser,
				password :deliveryPass
			)
		`, {
			deliveryUser: this.config.deliveryViewDb.user,
			deliveryPass: this.config.deliveryViewDb.pass
		});

		//populate foreign views with the data
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_city');
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_country');
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_delivery_city');
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_delivery_country');
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_region');
		await sampleDb.sql('REFRESH MATERIALIZED VIEW vw_shipping');

		await sampleDb.close();
	}
}