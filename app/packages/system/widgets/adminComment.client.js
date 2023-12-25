import Widget from '../../../modules/widget/widget.client';
import Backbone from '../../../modules/backbone/index.client';
import _ from 'underscore';
import $ from 'jquery';

export default class AdminComment extends Widget {
	attributes() {
		return {
			class : 'admin-comment'
		};
	}

	events() {
		const resizeTextArea = _.throttle(function(e) {
			const $el = $(e.currentTarget);
			return $el.css('height', 'auto').css('height', `${$el.prop('scrollHeight')}px`);
		}
		, 1);

		return {
			'afterSubmit.form .comment-form'() {
				return this.lockForm(true);
			},

			'success.form .comment-form'() {
				this.collection.fetch({reset:true});
				this.$('form textarea').val('').trigger('change');
				return this.lockForm(false);
			},

			'error.form .comment-form'() {
				return this.lockForm(false);
			},

			'focus .comment-form textarea'() {
				const $inputWrapper = this.$('.input-wrapper');
				if (!$inputWrapper.hasClass('is-active')) {
					return $inputWrapper.addClass('is-active');
				}
			},

			'blur .comment-form textarea'() {
				return this.$('.input-wrapper').removeClass('is-active');
			},

			'keydown .comment-form textarea' : resizeTextArea,

			'keyup .comment-form textarea'(e) {
				if (e.ctrlKey && (e.which === 13)) {
					e.preventDefault();
					return $(e.currentTarget).closest('form').trigger('submit');
				} else {
					return resizeTextArea(e);
				}
			},

			'change .comment-form textarea' : resizeTextArea
		};
	}

	run() {
		return this.render(this.getTpl());
	}

	runLazyInit() {
		this.setupCollection();

		this.listenTo(this.collection, 'sync', _.bind(this.reRenderList, this));

		return this.collection.load();
	}

	reRenderList() {
		return this.localRender('adminComment/list')
			.then(res => this.$('.comments').html(res));
	}

	setupCollection() {
		//@ts-ignore
		const Collection = Backbone.My.Collection.extend({
			url : _.bind(this.getListUrl, this)
		});

		return this.collection = new Collection();
	}

	getListUrl() {
		return this.url('system/admin/comment/collection', {
			type : this.data.type,
			pk : this.data.pk
		});
	}

	getTpl() {
		return 'adminComment';
	}

	lockForm(val) {
		this.$('.comment-form').find('button,:input').prop('disabled', val);
	}

	getFileName() {
		return __filename;
	}
}