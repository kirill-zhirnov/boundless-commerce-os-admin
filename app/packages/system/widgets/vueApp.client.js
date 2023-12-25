import Widget from '../../../modules/widget/widget.client';
import gHtml from '../../../modules/gHtml/index.client';
import * as bundles from '../../../modules/utils/bundles.client';
import Vuex from 'vuex';
import Vue from 'vue';

/**
 * Widget allows to call Vue app from .jade templates:
 *
 * !=widget('system.vueApp.@c', {data:{app: 'catalog/variant/setPrices', props: {someVar: 'val'}}})
 */
export default class VueApp extends Widget {
	async run() {
		return this.wrapInWrapper(gHtml.tag('div', {class: 'app'}, ''), true);
	}

	async runLazyInit() {
		await this.preloadBundles();

		const {App, store} = this.getVueApp();

		if (!App)
			throw new Error('No app:' + this.data.app);

		const options = {
			render: (h) => {
				return h(App.default, {
					props: this.data.props
				});
			}
		};

		if (store) {
			if (store instanceof Vuex.Store) {
				options.store = store;
			} else if (typeof (store.default) != 'undefined') {
				options.store = store.default;
			}
		}

		this.vues.push(
			new Vue(options).$mount(this.$('.app').get(0))
		);
	}

	getVueApp() {
		let store, App;

		switch (this.data.app) {
			case 'catalog/productForm': {
				store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../catalog/vue/admin/product/form/components/ProductForm.vue');

				return {App, store};
			}
			case 'auth/tokens': {
				// store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../auth/vue/admin/Tokens.vue');

				return {App};
			}

			case 'dashboard/salesOverTime': {
				App = require('../../dashboard/vue/admin/SalesOverTime.vue');

				return {App};
			}

			case 'catalog/variant/form': {
				store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../catalog/vue/admin/product/form/components/VariantForm.vue');

				return {App, store};
			}
			case 'catalog/categoryForm': {
				store = require('../../catalog/vue/admin/category/form/store/index');
				App = require('../../catalog/vue/admin/category/form/components/Form.vue');

				return {App, store};
			}
			case 'catalog/variant/create': {
				store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../catalog/vue/admin/product/form/components/CreateMultipleVariantsForm.vue');

				return {App, store};
			}

			case 'catalog/product/crossSell': {
				App = require('../../catalog/vue/admin/product/form/components/FindCrossSellForm.vue');
				return {App};
			}

			case 'catalog/manufacturer/title': {
				App = require('../../catalog/vue/admin/manufacturer/Title.vue');
				return {App};
			}

			case 'catalog/feeds/form': {
				App = require('../../catalog/vue/admin/feeds/form/FeedsForm.vue');
				return {App};
			}

			case 'orders/form/topNav': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/form/TopNav.vue');

				//reset order's form state in case in contains data from previous page
				store.default.commit('reset');

				return {App, store};
			}

			case 'orders/form/orderForm': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/form/OrderForm.vue');

				return {App, store};
			}

			case 'orders/form/editOrderShipping': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/shipping/Form.vue');

				return {App, store};
			}

			case 'orders/form/discount': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/discount/Form.vue');

				return {App, store};
			}

			case 'orders/form/addProducts': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/addProducts/AddProductsForm.vue');

				return {App, store};
			}

			case 'orders/form/customItem': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/customItem/CustomItemForm.vue');

				return {App, store};
			}

			case 'orders/form/itemPrice': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/itemPrice/ItemPriceForm.vue');

				return {App, store};
			}

			case 'orders/form/attribute': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/attribute/Form.vue');

				return {App, store};
			}

			case 'orders/form/trackNumber': {
				store = require('../../orders/vue/admin/order/form/store');
				App = require('../../orders/vue/admin/order/trackNumber/Form.vue');

				return {App, store};
			}

			case 'catalog/product/grid/bulkCategory': {
				App = require('../../catalog/vue/admin/product/grid/BulkCategory.vue');

				return {App};
			}

			case 'catalog/product/grid/bulkSetPrices': {
				App = require('../../catalog/vue/admin/product/grid/BulkSetPrices.vue');

				return {App};
			}

			case 'catalog/product/grid/bulkSetStock': {
				App = require('../../catalog/vue/admin/product/grid/BulkSetStock.vue');

				return {App};
			}

			case 'customer/customerForm': {
				store = require('../../customer/vue/admin/customerForm/store');
				App = require('../../customer/vue/admin/customerForm/CustomerForm.vue');

				return {App, store};
			}

			case 'orders/form/customer': {
				App = require('../../orders/vue/admin/order/customer/Form.vue');

				return {App};
			}

			case 'customer/attribute': {
				store = require('../../customer/vue/admin/customerForm/store');
				App = require('../../customer/vue/admin/attribute/Form.vue');

				return {App, store};
			}

			case 'system/account/subscription': {
				App = require('../vue/admin/Subscription.vue');

				return {App};
			}

			// case 'system/selliosAccount': {
			// 	App = require('../vue/admin/SelliosAccount.vue');
			//
			// 	return {App};
			// }

			case 'system/admin/locale': {
				App = require('../../system/vue/admin/Locale.vue');

				return {App};
			}

			case 'system/seoTpl': {
				App = require('../vue/admin/SeoTpl.vue');

				return {App};
			}

			case 'orders/form/emailNotification': {
				App = require('../../orders/vue/admin/setup/NotificationsForm.vue');

				return {App};
			}

			case 'catalog/product/exportForm': {
				App = require('../../catalog/vue/admin/product/export/Form.vue');

				return {App};
			}

			case 'catalog/variant/setPrices': {
				store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../catalog/vue/admin/product/form/components/Variants/SetPrices.vue');

				return {App, store};
			}

			case 'catalog/variant/setQty': {
				store = require('../../catalog/vue/admin/product/form/store/index');
				App = require('../../catalog/vue/admin/product/form/components/Variants/SetQty.vue');

				return {App, store};
			}

			case 'orders/checkout/settings': {
				App = require('../../orders/vue/admin/order/checkout/Form.vue');

				return {App};
			}

			case 'settings/tax/editTaxClass': {
				App = require('../vue/admin/EditTaxClassForm.vue');

				return {App};
			}
			//
			//
			//
			//
			//
			//
			// case 'catalog/product/simpleForm':
			// 	store = require('../../catalog/vue/admin/product/form/store/index');
			// 	App = require('../../catalog/vue/admin/product/form/components/SimpleForm.vue');
			// 	break;
			//
			//
			// case 'theme/product/further':
			// 	App = require('../../theme/vue/product/FurtherSection.vue');
			// 	break;
			//
			// case 'theme/bosses/smallIcons':
			// 	App = require('../../theme/vue/bosses/SmallIcons.vue');
			// 	break;
			//
			// case 'catalog/product/chooseVariant':
			// 	App = require('../../catalog/vue/web/product/ChooseVariant.vue');
			// 	break;
			//
			// case 'catalog/product/crossSell':
			// 	App = require('../../catalog/vue/admin/product/form/components/FindCrossSellForm.vue');
			// 	break;
			//
			// case 'theme/uploadAndResize':
			// 	App = require('../../theme/vue/image/UploadAndResize.vue');
			// 	break;
			//
			// case 'theme/iconOrImage':
			// 	App = require('../../theme/vue/image/IconOrImage.vue');
			// 	break;


			// case 'catalog/category/filterForm':
			// 	store = require('../../catalog/vue/web/category/filterFormStore');
			// 	App = require('../../catalog/vue/web/category/FiltersForm.vue');
			// 	break;
			//
			// case 'catalog/productsList/controlBar':
			// 	store = require('../../catalog/vue/web/category/filterFormStore');
			// 	App = require('../../catalog/vue/web/productsList/ControlBar.vue');
			// 	break;
			//
			// case 'catalog/productReview/form':
			// 	App = require('../../catalog/vue/admin/product/review/ProductsReviewForm.vue');
			// 	break;
			//
			// case 'theme/link/findAndInsert':
			// 	App = require('../../theme/vue/link/FindAndInsert.vue');
			// 	break;
			//
			// case 'cms/iconWithLink':
			// 	App = require('../../cms/vue/admin/IconWithLink.vue');
			// 	break;
			//
			//
			// case 'cms/itemsSwiper':
			// 	App = require('../../cms/vue/web/ItemsSwiper/Component.vue');
			// 	storeKit = require('../../cms/vue/web/ItemsSwiper/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'cms/swiperSlider':
			// 	App = require('../../cms/vue/web/SwiperSlider/Component.vue');
			// 	storeKit = require('../../cms/vue/web/SwiperSlider/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'theme/swiperSlider/slideForm':
			// 	App = require('../../theme/vue/bosses/SwiperSlider/SlideForm.vue');
			// 	storeKit = require('../../cms/vue/web/SwiperSlider/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'theme/swiperSlider/stylesForm':
			// 	App = require('../../theme/vue/bosses/SwiperSlider/StylesForm.vue');
			// 	storeKit = require('../../cms/vue/web/SwiperSlider/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'theme/itemsSwiper/tabForm':
			// 	App = require('../../theme/vue/bosses/ItemsSwiper/TabForm.vue');
			// 	storeKit = require('../../cms/vue/web/ItemsSwiper/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'theme/itemsSwiper/itemForm':
			// 	App = require('../../theme/vue/bosses/ItemsSwiper/ItemForm.vue');
			// 	storeKit = require('../../cms/vue/web/ItemsSwiper/store');
			//
			// 	store = storeKit.getStoreById(this.data.blockId);
			//
			// 	break;
			//
			// case 'theme/itemsSwiper/stylesForm':
			// 	App = require('../../theme/vue/bosses/ItemsSwiper/StylesForm.vue');
			//
			// 	break;
			//
			// case 'theme/customMargins':
			// 	App = require('../../theme/vue/bosses/components/CustomMargins.vue');
			//
			// 	break;
			//
			// case 'theme/imgsTiger/item':
			// 	App = require('../../theme/vue/bosses/ImgsTiger/ItemForm.vue');
			//
			// 	break;
			//
			// case 'theme/imgsTiger/styles':
			// 	App = require('../../theme/vue/bosses/ImgsTiger/StylesForm.vue');
			//
			// 	break;
			//
			// case 'theme/bobcatGallery/imgs':
			// 	App = require('../../theme/vue/bosses/BobcatGallery/Imgs.vue');
			//
			// 	break;
			//
			// case 'theme/bobcatGallery/styles':
			// 	App = require('../../theme/vue/bosses/BobcatGallery/Styles.vue');
			//
			// 	break;
			//
			// case 'orders/checkout/payment':
			// 	App = require('../../orders/vue/checkout/Payment.vue');
			//
			// 	break;
			//
			// case 'orders/checkout/basket':
			// 	App = require('../../orders/vue/checkout/Basket.vue');
			//
			// 	break;
			//
			// case 'orders/delivery/markUp':
			// 	App = require('../../orders/vue/delivery/MarkUpField.vue');
			//
			// 	break;
			//
			// case 'orders/leaveReview':
			// 	App = require('../../orders/vue/review/LeaveForm.vue');
			// 	break;
			//
			// case 'theme/elephantMenu/edit':
			// 	App = require('../../theme/vue/bosses/ElephantMenu/Edit.vue');
			//
			// 	break;
			//
			// case 'theme/flexHeader/edit':
			// 	App = require('../../theme/vue/bosses/FlexHeader/Edit.vue');
			//
			// 	break;
		}
	}

	async preloadBundles() {
		switch (this.data.app) {
			case 'catalog/category/filterForm':
			case 'catalog/productsList/controlBar':
			case 'cms/itemsSwiper':
			case 'cms/swiperSlider':
				await bundles.load('clientUI');
				break;
		}
	}

	getFileName() {
		return __filename;
	}
}