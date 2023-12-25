export default function (db) {
	const Warehouse = db.model('warehouse');
	const WarehouseText = db.model('warehouseText');
	Warehouse.hasMany(WarehouseText, {
		foreignKey: 'warehouse_id'
	});


	const Option = db.model('inventoryOption');
	const OptionText = db.model('inventoryOptionText');
	Option.hasMany(OptionText, {
		foreignKey: 'option_id'
	});

	const InventoryMovement = db.model('inventoryMovement');
	const InventoryMovementItem = db.model('inventoryMovementItem');

	InventoryMovement.hasMany(InventoryMovementItem, {
		foreignKey: 'movement_id'
	});

	InventoryMovementItem.belongsTo(InventoryMovement, {
		foreignKey: 'movement_id'
	});

	const Transfer = db.model('transfer');
	Transfer.belongsTo(InventoryMovement, {
		as: 'completedMovement',
		foreignKey: 'completed_movement_id'
	});
	Transfer.belongsTo(InventoryMovement, {
		as: 'cancelledMovement',
		foreignKey: 'cancelled_movement_id'
	});

	const TransferItem = db.model('transferItem');
	Transfer.hasMany(TransferItem, {
		foreignKey: 'transfer_id'
	});

	const Product = db.model('product');
	const Variant = db.model('variant');
	const InventoryItem = db.model('inventoryItem');

	Product.hasOne(InventoryItem, {
		foreignKey: 'product_id'
	});
	Variant.hasOne(InventoryItem, {
		foreignKey: 'variant_id'
	});
	InventoryItem.belongsTo(Product, {
		foreignKey: 'product_id'
	});

	return;
}
