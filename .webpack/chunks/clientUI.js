const pathAlias = require('path-alias');

let filesList = [
	'node_modules/hammerjs/hammer',

	'node_modules/photoswipe/dist/photoswipe',
	'node_modules/photoswipe/dist/photoswipe-ui-default',

	'node_modules/light-carousel/lc.min',

	'node_modules/bootstrap/js/carousel',

	'node_modules/swiper/dist/js/swiper.esm.bundle',

	'@p-catalog/vue/web/category/filterFormStore',
	'@p-catalog/vue/web/category/FiltersForm',
	'@p-catalog/vue/web/category/FilterForm/SelectableList',
	'@p-catalog/vue/web/category/FilterForm/SelectableList/Item',
	'@p-catalog/vue/web/productsList/ControlBar',

	'@p-cms/vue/web/ItemsSwiper/Component',
	'@p-cms/vue/web/ItemsSwiper/Component/CustomList',
	'@p-cms/vue/web/ItemsSwiper/Component/ProductsCollection',
	'@p-cms/vue/web/ItemsSwiper/store',

	'@p-cms/vue/web/SwiperSlider/Component',
	'@p-cms/vue/web/SwiperSlider/Component/SlideContent',
	'@p-cms/vue/web/SwiperSlider/store',

	'node_modules/vue-slider-component/dist/vue-slider-component.umd.min',
	'node_modules/vue-slider-component/theme/antd',

	'node_modules/node-js-marker-clusterer/src/markerclusterer',
	'node_modules/dom7/dist/dom7.modular',

	'node_modules/image-preloader/src/main',

	'node_modules/dropzone/dist/dropzone',
	'@p-cms/widgets/dropzoneWrapper.@c',

	'node_modules/rateyo/min/jquery.rateyo.min'
];

filesList = filesList.map((filePath) => {
	return pathAlias.resolve(filePath);
});

module.exports = filesList;