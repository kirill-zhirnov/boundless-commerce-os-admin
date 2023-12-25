export default function (db) {
	const Product = db.model('product');
	const ProductText = db.model('productText');
	const ProductProp = db.model('productProp');

	Product.hasMany(ProductText, {
		foreignKey: 'product_id'
	});

	Product.hasOne(ProductProp, {
		foreignKey: 'product_id'
	});

	ProductProp.belongsTo(Product, {
		foreignKey: 'product_id'
	});

	const UnitMeasurement = db.model('unitMeasurement');
	const CommodityGroup = db.model('commodityGroup');
	const CommodityGroupText = db.model('commodityGroupText');

	CommodityGroup.hasMany(CommodityGroupText, {
		foreignKey: 'group_id'
	});
	CommodityGroupText.belongsTo(CommodityGroup, {
		foreignKey: 'group_id'
	});
	CommodityGroup.belongsTo(UnitMeasurement, {
		foreignKey: 'unit_id'
	});

	Product.belongsTo(CommodityGroup, {
		foreignKey: 'group_id'
	});

	const Manufacturer = db.model('manufacturer');
	const ManufacturerText = db.model('manufacturerText');

	Manufacturer.hasMany(ManufacturerText, {
		foreignKey: 'manufacturer_id'
	});
	ManufacturerText.belongsTo(Manufacturer, {
		foreignKey: 'manufacturer_id'
	});

	const Category = db.model('category');
	const CategoryText = db.model('categoryText');
	const CategoryProp = db.model('categoryProp');

	Category.hasMany(CategoryText, {
		foreignKey: 'category_id'
	});

	Category.hasOne(CategoryProp, {
		foreignKey: 'category_id'
	});

	CategoryText.belongsTo(Category, {
		foreignKey: 'category_id'
	});

	const Characteristic = db.model('characteristic');
	const CharacteristicText = db.model('characteristicText');
	const CharacteristicTypeCase = db.model('characteristicTypeCase');
	const CharacteristicTypeCaseText = db.model('characteristicTypeCaseText');
	const CharacteristicProp = db.model('characteristicProp');

	Characteristic.hasMany(CharacteristicText, {
		foreignKey: 'characteristic_id'
	});

	Characteristic.hasMany(CharacteristicTypeCase, {
		foreignKey: 'characteristic_id'
	});

	CharacteristicTypeCase.hasMany(CharacteristicTypeCaseText, {
		foreignKey: 'case_id'
	});

	Characteristic.hasOne(CharacteristicProp, {
		foreignKey: 'characteristic_id'
	});

	CommodityGroup.hasMany(Characteristic, {
		foreignKey: 'group_id'
	});

	const Variant = db.model('variant');
	const VariantText = db.model('variantText');
	Variant.hasMany(VariantText, {
		foreignKey: 'variant_id'
	});
	Variant.belongsTo(Product, {
		foreignKey: 'product_id'
	});

	const ProductVariantCharacteristic = db.model('productVariantCharacteristic');
	ProductVariantCharacteristic.belongsTo(Characteristic, {
		foreignKey: 'characteristic_id'
	});

	const CharacteristicVariantVal = db.model('characteristicVariantVal');
	const CharacteristicVariantValText = db.model('characteristicVariantValText');
	CharacteristicVariantVal.hasMany(CharacteristicVariantValText, {
		foreignKey: 'value_id'
	});

	const Price = db.model('price');
	const PriceText = db.model('priceText');

	Price.hasMany(PriceText, {
		foreignKey: 'price_id'
	});

	const Label = db.model('label');
	const LabelText = db.model('labelText');

	Label.hasMany(LabelText, {
		foreignKey: 'label_id'
	});

	const ProductLabelRel = db.model('productLabelRel');
	Product.hasMany(ProductLabelRel, {
		foreignKey: 'product_id'
	});

	const CollectionProductRel = db.model('collectionProductRel');
	Product.hasMany(CollectionProductRel, {
		foreignKey: 'product_id'
	});

	const ProductImage = db.model('productImage');
	Product.hasMany(ProductImage, {
		foreignKey: 'product_id'
	});

	const ProductImport = db.model('productImport');
	const ProductImportLog = db.model('productImportLog');

	ProductImport.hasMany(ProductImportLog, {
		foreignKey: 'import_id'
	});

	const ProductReview = db.model('productReview');
	const ProductReviewImg = db.model('productReviewImg');

	ProductReview.hasMany(ProductReviewImg, {
		foreignKey: 'review_id'
	});
	ProductReviewImg.belongsTo(ProductReview, {
		foreignKey: 'review_id'
	});

	return;
}