import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import Creator from './creator';
import CreatorFromSample from './creator/fromSample';
import {IInstanceModel} from '../models/instance';
import {ISampleModel} from '../models/sample';
import _ from 'underscore';

const DEFAULT_ALIAS = '_default';

export default class CreateAwaiting {
	testPromises = [];

	async create() {
		const aliases = [DEFAULT_ALIAS].concat(await this.loadSampleAliases());
		const creators = [];

		for (const alias of aliases) {
			creators.push(...(await new Promise((resolve, reject) => this.handleAlias(alias, resolve, reject))));
		}
	}

	async handleAlias(alias, resolve, reject, creators = []) {
		const config = wrapperRegistry.getConfig();
		const {awaitingAmountPerCategory} = config.instanceManager;

		try {
			let awaiting = await this.countAwaitingByAlias(alias);
			if (awaiting >= awaitingAmountPerCategory) {
				return resolve(creators);
			}

			const creator = alias === DEFAULT_ALIAS ? new Creator() : new CreatorFromSample(alias);
			for (let i = awaiting; i < awaitingAmountPerCategory; i++) {
				await creator.create();
				creators.push(creator);
			}

			return setImmediate(() => this.handleAlias(alias, resolve, reject, creators));
		} catch (e) {
			return reject(e);
		}
	}

	async loadSampleAliases() {
		const db = wrapperRegistry.getDb();
		const samples = await db.model('sample').findAll({
			where: {
				status: 'available'
			}
		});

		return _.pluck(samples, 'alias');
	}

	async countAwaitingByAlias(alias) {
		let join = '';
		let where = 'from_sample_id is null';
		let params = {};

		if (alias !== DEFAULT_ALIAS) {
			join = 'left join sample on sample.sample_id = instance.from_sample_id';
			where = 'sample.alias = :alias';
			params.alias = alias;
		}

		const db = wrapperRegistry.getDb();
		const result = await db.sqlOne(`
			select
				count(*) as qty
			from
				instance
				${join}
			where
				${where}
				and instance.status in ('awaitingForClient')
				and instance.client_id is null
		`, params);

		// @ts-ignore
		return Number(result.qty);
	}

	//needs for debug purpose
	async fakeCreator(alias) {
		const db = wrapperRegistry.getDb();
		console.log(' ----- fakeCreator -----', alias);
		const props = {status: 'inTheMaking', from_sample_id: undefined};

		if (alias !== DEFAULT_ALIAS) {
			const sample = await db.model('sample').findOne({where: {alias: alias}});
			// @ts-ignore
			props.from_sample_id = sample.sample_id;
		}

		const instance = await db.model('instance').build(props).save();

		this.testPromises.push(new Promise((resolve) => {
			setTimeout(async () => {
				// @ts-ignore
				await instance.set({status: 'awaitingForClient'}).save();
				resolve();
			}, 1000 * 30);
		}));
	}
}