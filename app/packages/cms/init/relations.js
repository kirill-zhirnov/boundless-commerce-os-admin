export default function (db) {
	const Page = db.model('page');
	const PageProps = db.model('pageProps');

	Page.hasOne(PageProps, {
		foreignKey: 'page_id'
	});

	const MenuItem = db.model('menuItem');
	const MenuBlock = db.model('menuBlock');
	const MenuItemRel = db.model('menuItemRel');

	MenuItem.hasOne(MenuItemRel, {
		foreignKey: 'item_id'
	});

	MenuItem.belongsTo(MenuBlock, {
		foreignKey: 'block_id'
	});

	MenuItemRel.belongsTo(MenuItem, {
		foreignKey: 'item_id'
	});

	const Article = db.model('article');
	const Image = db.model('image');

	Article.hasOne(Image, {
		foreignKey: 'image_id'
	});

	const ProductReviewImg = db.model('productReviewImg');
	ProductReviewImg.belongsTo(Image, {
		foreignKey: 'image_id'
	});

	return;
}