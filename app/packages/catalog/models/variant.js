import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';

export default function (sequelize, DataTypes) {
	class Variant extends ExtendedModel {
		static getVariantTitleByRow(row) {
			for (let key of ['variant_product_title', 'variant_title']) {
				if (_.isUndefined(row[key])) {
					throw new Error(`Key '${key}' is undefined in row!`);
				}
			}

			return `${row.variant_product_title}, ${row.variant_title}`;
		}

		static async countVariants(productId) {
			const result = await this.sequelize.sql(`
				select
					count(*) as total
				from
					variant
				where
					product_id = :productId
					and deleted_at is null
			`, {
				productId
			});

			//@ts-ignore
			return result.total;
		}

		static async loadVariants(productId, pointId, langId, trackInventory, priceAlias = 'selling_price') {
			const rows = await this.sequelize.sql(`
				select
					v.variant_id,
					v.sku,
					t.title,
					p.value as price,
					p.old as price_old,
					i.available_qty,
					i.reserved_qty,
					i.item_id,
					v.product_id,
					pg.not_track_inventory as product_not_track_inventory,
					img.path as default_image
				from
					variant v
					inner join variant_text t on v.variant_id = t.variant_id and t.lang_id = :lang
					inner join inventory_item i on i.variant_id = v.variant_id
					inner join product on product.product_id = v.product_id
					left join variant_image vi on v.variant_id = vi.variant_id and is_default is true
					left join image img on vi.image_id = img.image_id
					left join commodity_group pg on pg.group_id = product.group_id
					left join (
						select
							f.item_id,
							f.value,
							f.old
						from
							final_price f
							inner join price on price.price_id = f.price_id and price.alias = :price
						where
							f.point_id = :point
					) p on p.item_id = i.item_id
				where
					v.product_id = :product
					and v.deleted_at is null
				order by
					v.variant_id
			`, {
				point: pointId,
				lang: langId,
				price: priceAlias,
				product: productId
			});

			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				this.isInStock(trackInventory, row);

				rows[i] = row;
			}

			return rows;
		}

		static async loadVariant(variantId, pointId, langId, trackInventory, priceAlias = 'selling_price') {
			const [row] = await this.sequelize.sql(`
				select
					v.variant_id,
					v.sku,
					vt.*,
					i.item_id,
					i.available_qty,
					i.reserved_qty,
					price.price_id,
					f.value as price,
					f.old as price_old,
					v.product_id,
					pg.not_track_inventory as product_not_track_inventory,
					product_text.title as variant_product_title,
					img.path as img_path,
					img.width as img_width,
					img.height as img_height
				from
					variant v
				inner join variant_text vt on v.variant_id = vt.variant_id and vt.lang_id = :lang
				inner join inventory_item i on i.variant_id = v.variant_id
				left join final_price f on f.item_id = i.item_id
				left join price on price.price_id = f.price_id
				inner join product on product.product_id = v.product_id
				inner join product_text on product.product_id = product_text.product_id and product_text.lang_id = :lang
				left join commodity_group pg on pg.group_id = product.group_id
				left join product_image pi on pi.product_id = product.product_id and pi.is_default is true
				left join image img on img.image_id = pi.image_id
				where
					v.variant_id = :variant
					and v.deleted_at is null
					and (f.point_id = :point or f.point_id is null)
					and (price.alias = :price or price.alias is null)
			`, {
				variant: variantId,
				point: pointId,
				lang: langId,
				price: priceAlias
			});

			if (row) {
				this.isInStock(trackInventory, row);
			}

			return row;
		}

		static isInStock(trackInventory, row) {
			//@ts-ignore
			row.trackInventory = this.sequelize.model('inventoryItem').shallTrackInventoryByRow(trackInventory, row);

			if (row.trackInventory) {
				return row.inStock = row.available_qty > 0;
			} else {
				return row.inStock = true;
			}
		}

		static loadVariantsForTpl(productId, pointId, langId, trackInventory, priceAlias = 'selling_price') {
			let out = null;

			return this.loadCharacteristics(productId, langId)
				.then(res => {
					out = res;
					return this.loadVariants(productId, pointId, langId, trackInventory, priceAlias);
				}).then(res => {
					out.variants = res;
					return out;
				});
		}

		static async loadCharacteristics(productId, langId) {
			const rows = await this.sequelize.sql(`
				select
					variant.variant_id,
					pvc.characteristic_id,
					characteristic_text.title as characteristic_title,
					characteristic_type_case.case_id,
					characteristic_type_case_text.title as case_title
				from
					product_variant_characteristic pvc
				inner join characteristic_variant_val cvv on pvc.characteristic_id = cvv.characteristic_id
				inner join variant on cvv.variant_id = variant.variant_id
				inner join characteristic_text on
					characteristic_text.characteristic_id = pvc.characteristic_id
					and characteristic_text.lang_id = :lang
				inner join characteristic_type_case on characteristic_type_case.case_id = cvv.case_id
				inner join characteristic_type_case_text on
					characteristic_type_case.case_id = characteristic_type_case_text.case_id
					and characteristic_type_case_text.lang_id = :lang
				inner join characteristic on characteristic.characteristic_id = pvc.characteristic_id
				where
					pvc.product_id = :product
					and pvc.rel_type = :relType
					and cvv.rel_type = :relType
					and variant.product_id = :product
					and variant.deleted_at is null
				order by
					pvc.sort asc,
					characteristic_type_case.sort asc
			`, {
				product: productId,
				relType: 'variant',
				lang: langId
			});

			const characteristics = [];
			const combinations = {};
			const idCombinations = {};
			const id2Key = {};
			const idCases = {};

			for (const row of Array.from(rows)) {
				var characteristicRow;
				//@ts-ignore
				const {characteristic_id, characteristic_title, case_id, case_title, variant_id} = row;
				if (characteristic_id in id2Key) {
					characteristicRow = characteristics[id2Key[characteristic_id]];
				} else {
					characteristicRow = {
						id: characteristic_id,
						title: characteristic_title,
						cases: []
					};

					characteristics.push(characteristicRow);
					id2Key[characteristic_id] = characteristics.length - 1;
				}

				if (!(case_id in idCases)) {
					characteristicRow.cases.push({
						id: case_id,
						title: case_title
					});
					idCases[case_id] = true;
				}

				if (!(variant_id in combinations)) {
					combinations[variant_id] = [];
					idCombinations[variant_id] = {};
				}

				const characteristicKey = `${characteristic_id}-${case_id}`;

				if (_.indexOf(combinations[variant_id], characteristicKey) === -1) {
					combinations[variant_id].push(characteristicKey);
				}

				if (!(characteristic_id in idCombinations[variant_id])) {
					idCombinations[variant_id][characteristic_id] = case_id;
				}
			}

			return {
				characteristics,
				combinations,
				idCombinations
			};
		}

		//			safeDelete : (options = {}) ->
		//				deferred = Q.defer()
		//
		//				attrs = {}
		//				attrs[@options.deletedAt] = @sequelize.fn('NOW')
		//
		//				Q @update(attrs, options)
		//				.then () =>
		//					return @sphinxReIndexAll options
		//				.then () =>
		//					deferred.resolve()
		//				.catch (e) ->
		//					deferred.reject e
		//				.done()
		//
		//				return deferred.promise
		//
		//			recover : (options = {}) ->
		//				deferred = Q.defer()
		//
		//				attrs = {}
		//				attrs[@options.deletedAt] = null
		//
		//				Q @update(attrs, options)
		//				.then () =>
		//					return @sphinxReIndexAll options
		//				.then () =>
		//					deferred.resolve()
		//				.catch (e) ->
		//					deferred.reject e
		//				.done()
		//
		//				return deferred.promise

		static async sphinxReIndexAll(options = {}) {
			console.log(options); //FIXME inserted to hide eslint/ts warning on unused var
		}
		//				return Q @findAll(options)
		//				.then (rows) =>
		//					if _.isArray rows
		//						return @sequelize.model('product').sphinxReIndexAll {
		//							where :
		//								product_id : _.uniq(_.pluck(rows, 'product_id'))
		//						}
		//				.then () =>
		//					return

		/**
		cases - Array[caseIdA, caseIdB, ...]
		sqlOptions - options, e.g. transaction
		*/
		static async findVariantByCases(productId, cases, sqlOptions = {}) {
			const sqlParts = [];
			const params = {
				product: productId,
				length: cases.length
			};

			for (let i = 0; i < cases.length; i++) {
				const item = cases[i];
				const param = `case${i}`;
				sqlParts.push(`:${param} = ANY (v.cases)`);
				params[param] = item;
			}

			const [row] = await this.sequelize.sql(`
				select
					v.variant_id,
					v.deleted_at
				from
					variant v
				where
					product_id = :product
					and ${sqlParts.join(' and ')}
					and array_length(v.cases,1) = :length
				limit 1
			`, params, sqlOptions);

			return row || null;
		}

		static async updateSkuIfUnique(productId, variantId, sku) {
			let updated = false;

			const rows = await this.sequelize.sql(`
				select
					variant_id
				from
					variant
				where
					product_id = :product
					and sku = :sku
					and variant_id != :variant
			`, {
				product: productId,
				variant: variantId,
				sku
			});
			if (!rows.length) {
				updated = true;

				await this.update({sku}, {
					where: {
						variant_id: variantId
					}
				});
			}

			return updated;
		}

		static async updateVariantsDefaultImg(variants) {
			if (!Array.isArray(variants) && typeof variants === 'number') {
				variants = [variants];
			}

			for (const variant of variants) {
				await this.sequelize.sql(`
					select variant_check_default_img(:variant)
				`, {
					variant
				});
			}
		}
	}

	Variant.init({
		variant_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		sku: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		//		Cases will be filled by trigger, do not fill it manually
		cases: {
			type: DataTypes.ARRAY(DataTypes.INTEGER),
			allowNull: true
		},

		size: {
			type: DataTypes.JSONB
		},

		created_at: {
			type: DataTypes.DATE
		},

		//		this field is not used any more, but it uses in too much places to
		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'variant',
		deletedAt: 'deleted_at',
		modelName: 'variant',
		sequelize
	});

	return Variant;
}