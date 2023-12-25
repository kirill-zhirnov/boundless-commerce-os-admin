require('./my/model.client');
require('./my/collection.client');
require('./my/view.client');

if (process.env.__IS_SERVER__) {
	require('backbone-tree-model');
}