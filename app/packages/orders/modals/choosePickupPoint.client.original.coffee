pathAlias = require 'path-alias'
Modal = pathAlias '@modules/modal/modal.@c'
_ = require 'underscore'

class ChoosePoint extends Modal
	attributes : ->
		return _.extend super, {
			'class' : 'modal choose-point'
		}

	events : ->
		return _.extend super, {
			"change input[name='point']" : "onPointSelect"
		}

	onPointSelect : (e) ->
		$el = @$("input[name='point']:checked")

		if $el.length == 0
			return

		data =
			id : $el.val()
			title : $el.parents('.list-group-item-heading:eq(0)').text()
			address : $el.parents('.list-group:eq(0)').find('address').text()

		@$('.choose-pickup-point-form').trigger('pickupPointSelected.form', [data])

		@close()
	
module.exports = ChoosePoint