export interface IReserveItem {
	reserve_item_id: number;
	reserve_id: number;
	stock_id: number|null;
	item_id: number;
	qty: number;
	total_price: number|null;
	item_price_id: number|null;
	created_at: string;
	completed_at: string|null;
}