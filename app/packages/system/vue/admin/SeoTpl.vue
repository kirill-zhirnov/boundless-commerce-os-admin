<template>
	<form
		ref="form"
		name="seoTpl"
		data-form=""
	>
		<div class="page-header">
			<h3> {{ __('Product page') }} </h3>
			<!--			<a-->
			<!--				v-if="form.helpProduct"-->
			<!--				class="help"-->
			<!--				:href="form.helpProduct.url"-->
			<!--				target="_blank"-->
			<!--			>-->
			<!--				<i class="fa fa-question-circle" /> {{ form.helpProduct.title }} <i class="fa fa-external-link" />-->
			<!--			</a>-->
		</div>
		<h4> &lt;title&gt; </h4>
		<div class="row">
			<div class="col-sm-6 col-tpl">
				<div class="form-group">
					<label class="form-label"> {{ __('Template') }}</label>
					<textarea
						v-model="attrs.product_title"
						name="product_title"
						class="form-control tpl"
						rows="5"
					/>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label"> {{ __('Preview') }}</label>
					<textarea
						v-model="compiled.product_title"
						class="form-control"
						rows="5"
						readonly
					/>
				</div>
			</div>
		</div>
		<h4> &lt;meta name="Description"&gt; </h4>
		<div class="row">
			<div class="col-sm-6 col-tpl">
				<div class="form-group">
					<label class="form-label"> {{ __('Template') }}</label>
					<textarea
						v-model="attrs.product_metaDescription"
						name="product_metaDescription"
						class="form-control tpl"
						rows="5"
					/>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label"> {{ __('Preview') }}</label>
					<textarea
						v-model="compiled.product_metaDescription"
						class="form-control"
						rows="5"
						readonly
					/>
				</div>
			</div>
		</div>
		<div class="page-header">
			<h3> {{ __('Category page') }} </h3>
		</div>
		<h4> &lt;title&gt; </h4>
		<div class="row">
			<div class="col-sm-6 col-tpl">
				<div class="form-group">
					<label class="form-label"> {{ __('Template') }}</label>
					<textarea
						v-model="attrs.category_title"
						name="category_title"
						class="form-control tpl"
						rows="5"
					/>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label"> {{ __('Preview') }}</label>
					<textarea
						v-model="compiled.category_title"
						class="form-control"
						rows="5"
						readonly
					/>
				</div>
			</div>
		</div>
		<h4> &lt;meta name="Description"&gt; </h4>
		<div class="row">
			<div class="col-sm-6 col-tpl">
				<div class="form-group">
					<label class="form-label"> {{ __('Template') }}</label>
					<textarea
						v-model="attrs.category_metaDescription"
						name="category_metaDescription"
						class="form-control tpl"
						rows="5"
					/>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label"> {{ __('Preview') }}</label>
					<textarea
						v-model="compiled.category_metaDescription"
						class="form-control"
						rows="5"
						readonly
					/>
				</div>
			</div>
		</div>
	</form>
</template>
<script>
import $ from 'jquery';
import _ from 'underscore';

export default {
	props: ['form'],
	data() {
		return {
			attrs: this.form.attrs,
			compiled: {},
			CodeMirror: null
		};
	},

	watch: {
		attrs: {
			deep: true,
			handler() {
				this.compile();
			}
		}
	},

	beforeMount() {
		this.codeMirrors = [];
		this.tab = null;

		this.compile = _.debounce(() => {
			this.$ajax.post(['system/admin/seoTpl/compile'], this.attrs, {hidden: true})
				.then((res) => this.compiled = res.compiled);
		}, 300);
	},

	mounted() {
		this.$bundle('adminUI').then(() => {
			this.CodeMirror = require('codemirror');
			require('codemirror/addon/mode/simple');
			require('codemirror/mode/handlebars/handlebars');
			require('codemirror/mode/htmlmixed/htmlmixed');

			this.$nextTick(this.setupCodemirror);
		});

	},

	beforeDestroy() {
		this.codeMirrors.forEach(cm => cm.toTextArea());

		if (this.tab)
			this.tab.off('.seo');
	},

	methods: {
		refreshCm() {
			this.codeMirrors.forEach(cm => cm.refresh());
		},
		setupCodemirror() {
			$(this.$el).find('.tpl').each((i, el) => {
				if (!this.CodeMirror) return;
				const cm = this.CodeMirror.fromTextArea(el, {
					mode: 'handlebars',
					lineWrapping: true
				});

				cm.setSize(null, 117);
				cm.on('change', (editor) => {
					this.attrs[$(el).attr('name')] = editor.getValue();
				});

				this.codeMirrors.push(cm);
			});

			//fix for codeMirrors:
			// https://stackoverflow.com/questions/8349571/codemirror-editor-is-not-loading-content-until-clicked
			const $tabpanel = $('ul[role="tablist"]');

			if ($tabpanel.length) {
				this.tab = $tabpanel.find('button[data-bs-target="#seoTpl"]').on('shown.bs.tab.seo', () => {
					this.refreshCm();
					this.compile();
				});
			}
		}
	}
};
</script>