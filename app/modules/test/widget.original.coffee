pathAlias = require 'path-alias'
Widget = pathAlias '@widget'

class TestWidget extends Widget
#	just redefine this method to don't throw an exception
	run : ->


module.exports = TestWidget