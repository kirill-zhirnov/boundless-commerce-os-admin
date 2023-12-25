import ExtendedModel from '../../db/model';
import Q from 'q';
import _ from 'underscore';
import ExtendedSequelize from '../../db/sequelize';
import {BuildOptions} from 'sequelize';
import {ITariff, ITariffInfo} from '../../../@types/instances';
import JedExtended from '../../i18n/jed.client';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Tariff extends ExtendedModel {
		static checkTariffAvailable(tariffId) {
			let isAvailable = true;
			let tariffInfo = null;
			let resetInstances = null;

			return this.countTariffClients(tariffId)
				//@ts-ignore
				.then(info => {
					tariffInfo = info;

					if ((tariffInfo.max_client_amount != null) && (tariffInfo.clients_number >= tariffInfo.max_client_amount)) {
						isAvailable = false;

						if (!tariffInfo.next_tariff_id) {
							return console.error(`Tariff's clients limit is reached, but next tariff is not specified (tariff_id = ${tariffId})`);
						} else {
							return this.sequelize.model('instance').update({
								tariff_id: tariffInfo.next_tariff_id
							}, {
								returning: true,
								where: {
									tariff_id: tariffId,
									is_demo: true
								}
							});
						}
					}
				})
				.then(rows => {
					// rows[0] - meta
					if (rows != null) {
						resetInstances = _.pluck(rows[1], 'instance_id');
					}

					if (!isAvailable && tariffInfo.is_default && tariffInfo.next_tariff_id) {
						return this.makeDefault(tariffInfo.next_tariff_id, true);
					}
				}).then(() => {
					return {
						isAvailable,
						resetInstances
					};
				});
		}

		static async makeDefault(tariffId, deletePreviousDefault = false) {
			const deferred = Q.defer();

			let trx = null;

			Q(this.sequelize.transaction({autocommit: false}))
				.then(t => {
					trx = t;
					const data = {is_default: false};

					if (deletePreviousDefault) {
						//@ts-ignore
						data.deleted_at = this.sequelize.fn('now');
					}

					return this.update(data, {
						transaction: trx,
						where: {
							is_default: true
						}
					});
				})
				.then(() => {
					return this.update({
						is_default: true
					}, {
						transaction: trx,
						where: {
							tariff_id: tariffId
						}
					});
				})
				.then(() => {
					return trx.commit();
				}).then(() => {
					return deferred.resolve();
				}).catch(e => {
					return Q()
						.then(() => {
							if (trx != null) {
								return trx.rollback();
							}
						}).then(() => {
							return deferred.reject(e);
						}).done();
				}).done();

			return deferred.promise;
		}

		static async countTariffClients(tariffId) {
			const rows = await this.sequelize.sql<{
				tariff_id: number,
				clients_number: number,
				is_default: boolean,
				max_client_amount: number,
				next_tariff_id: number
			}>(`
				select
					tariff_id,
					coalesce(temp.clients_number, 0)::integer as clients_number,
					is_default,
					max_client_amount,
					next_tariff_id
				from
					tariff
					inner join tariff_prop using(tariff_id)
					left join (
						select
							tariff_id,
							count(instance_id) as clients_number
						from
							instance
							inner join tariff using(tariff_id)
							inner join tariff_prop using(tariff_id)
						where
							tariff_id = :tariffId
							and is_demo = false
							and status in ('available', 'unavailable')
						group by
							tariff_id
					) temp using (tariff_id)
				where
					tariff_id = :tariffId
			`, {
				tariffId
			});

			return rows[0];
		}

		static async findTariffOptions(i18n: JedExtended, langId: number, currencyId: number, currentTariffId: number|null = null): Promise<TTariffOptionRow[]> {
			const params = {
				currencyId,
				langId
			};

			let deletedWhere = '';
			if (currentTariffId) {
				deletedWhere = 'or tariff.tariff_id = :currentTariffId';
				//@ts-ignore
				params.currentTariffId = currentTariffId;
			}

			const rows = await this.sequelize.sql<{
				tariff_id: number,
				amount: string,
				title: string,
				description: string|null,
				deleted_at: string|null
			}>(`
				select
					tariff.tariff_id,
					tariff.amount,
					tariff_text.title,
					tariff_text.description,
					tariff.deleted_at
				from
					tariff
					inner join tariff_text using (tariff_id)
				where
					(tariff.deleted_at is null ${deletedWhere})
					and tariff.currency_id = :currencyId
					and tariff_text.lang_id = :langId
				order by
					tariff.deleted_at, tariff.amount asc
			`, params);

			const out = [];
			for (const row of rows) {
				let {title} = row;
				const {tariff_id, amount, description, deleted_at} = row;

				if (deleted_at) {
					title += ` (${i18n.__('Archived tariff')})`;
				}

				out.push([tariff_id, title, amount, description]);
			}

			return out;
		}

		static async findTariffInfo(tariffId: number, langId: number): Promise<ITariffInfo|undefined> {
			const [row] = await this.sequelize.sql<ITariffInfo>(`
				select
					tariff.*,
					tariff_text.*,
					currency.alias as currency_alias
				from
					tariff
				inner join tariff_text using(tariff_id)
				inner join currency using(currency_id)
				where
					tariff_id = :tariffId
					and lang_id = :langId
			`, {
				tariffId, langId
			});

			return row;
		}
	}

	Tariff.init({
		tariff_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(20)
		},

		billing_period: {
			type: DataTypes.STRING(40)
		},

		amount: {
			type: DataTypes.DECIMAL(20, 2)
		},

		currency_id: {
			type: DataTypes.INTEGER
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'tariff',
		deletedAt: 'deleted_at',
		modelName: 'tariff',
		sequelize
	});

	return Tariff;
}

export type TTariffOptionRow = [tariff_id: number, title: string, amount: number, description: string];

export interface ITariffModel extends ExtendedModel, ITariff {
}

export type ITariffModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ITariffModel;

	findTariffInfo: (tariffId: number, langId: number) => Promise<ITariffInfo|undefined>;
	findTariffOptions: (i18n: JedExtended, langId: number, currencyId: number, currentTariffId?: number|null) => Promise<TTariffOptionRow[]>
}