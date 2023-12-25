// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const pathAlias = require('path-alias');
const Widget = pathAlias('@widget');

class TestWidget extends Widget {
//	just redefine this method to don't throw an exception
	run() {}
}


module.exports = TestWidget;