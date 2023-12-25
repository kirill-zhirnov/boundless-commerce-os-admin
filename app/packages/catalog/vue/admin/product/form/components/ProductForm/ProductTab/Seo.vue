<template>
	<form
		name="seo"
		class="seo-form tinted-box"
		@submit.prevent="$emit('submit')"
	>
		<label>
			{{ __('Preview in search results') }}
			<a
				v-if="!showForm"
				href="#"
				@click.prevent="showForm = true"
			>
				{{ __('Edit') }}
			</a>
		</label>
		<div class="preview">
			<!-- eslint-disable-next-line vue/no-v-html -->
			<h4 v-html="seoTitle" />
			<a> {{ seoUrl }} </a>
			<!-- eslint-disable-next-line vue/no-v-html -->
			<p v-html="seoDescription" />
		</div>
		<div
			v-show="showForm"
			class="fields"
		>
			<div class="form-group">
				<div class="with-help">
					<label
						class="form-label"
						for="seo_custom_title"
					> {{ __('Page title') }} </label>
					<!-- <a
						v-if="form.help"
						:href="form.help.url"
						class="small text-muted"
						target="_blank"
					>
						<i class="fa fa-question-circle" /> {{ form.help.title }} <i class="fa fa-external-link" />
					</a> -->
				</div>
				<input
					id="seo_custom_title"
					v-model="attrs.custom_title"
					type="text"
					name="custom_title"
					class="form-control"
					:placeholder="compiled.title"
				>
			</div>
			<div class="form-group">
				<label
					class="form-label"
					for="seo_meta_description"
				> {{ __('Meta description') }} </label>
				<textarea
					id="seo_meta_description"
					v-model="attrs.meta_description"
					name="meta_description"
					class="form-control"
					:placeholder="compiled.metaDesc"
					rows="5"
				/>
			</div>
			<p class="text-end small">
				<a
					:href="url('system/admin/cms/seo')"
					target="_blank"
				>
					{{ __('Setup seo templates') }}
					<i
						class="fa fa-external-link"
						aria-hidden="true"
					/>
				</a>
			</p>
			<div class="form-group">
				<label
					class="form-label"
					for="seo_url_key"
				> {{ __('URL key (slug)') }}</label>
				<div class="input-group">
					<span class="input-group-text">{{ form.baseUrl }}</span>
					<input
						id="seo_url_key"
						v-model="attrs.url_key"
						type="text"
						class="form-control"
						name="url_key"
						@input="generateUrlByTitle = false"
					>
				</div>
			</div>
			<p class="text-end small">
				<a
					:href="url('system/admin/frontend/urls')"
					target="_blank"
				>
					{{ __('Setup frontend URLs') }}
					<i
						class="fa fa-external-link"
						aria-hidden="true"
					/>
				</a>
			</p>
		</div>
	</form>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import $ from 'jquery';
import _ from 'underscore';

export default {
	props: {
		form: {
			type: Object,
			default: function () {
				return {};
			}
		},

		routes: {
			type: Object,
			default: function () {
				return {
					compile: 'catalog/admin/product/seo/compile',
					createUrl: 'catalog/admin/product/createUrl'
				};
			}
		},

		storeKeys: {
			type: Object,
			default: function () {
				return {
					title: 'productTitle'
				};
			}
		}
	},

	data() {
		return {
			attrs: this.form.attrs,
			showForm: false,
			generateUrlByTitle: false,
			compiled: {
				title: '',
				metaDesc: ''
			}
		};
	},

	computed: {
		seoTitle() {
			if ($.trim(this.attrs.custom_title) != '')
				return this.attrs.custom_title;

			return this.compiled.title;
		},

		seoDescription() {
			if ($.trim(this.attrs.meta_description) != '')
				return this.attrs.meta_description;

			return this.compiled.metaDesc;
		},

		seoUrl() {
			return `${this.form.baseUrl}${this.attrs.url_key || ''}`;
		},

		itemTitle() {
			return this.$store.state[this.storeKeys.title];
		},

		...mapState([
			'status',
			'tabWithErr',
			'onSuccess'
		])
	},

	watch: {
		itemTitle(val) {
			if (!this.generateUrlByTitle)
				return;

			if (val == '') {
				this.attrs.url_key = '';
			} else {
				this.createUrl(val);
			}
		},

		status() {
			if (!this.generateUrlByTitle)
				return;

			this.generateUrlByTitle = this.ifUrlByStatus();
		},

		tabWithErr(val) {
			if (Array.isArray(val) && !val.length) {
				$(this.$el).removeClass('has-errors');
			}
		},

		onSuccess() {
			this.compile();
		},

		attrs: {
			handler: function () {
				this.setSaved(false);
			},
			deep: true
		},
	},

	beforeDestroy() {
		$(this.$el).off('error.form');
	},

	beforeMount() {
		this.generateUrlByTitle = this.ifUrlByStatus();

		this.compile();
		this.createUrl = _.debounce((title) => {
			this.$ajax.get([this.routes.createUrl], {
				title: title,
				pk: this.form.pk
			}, {hidden: true})
				.then(result => this.attrs.url_key = result.url);
		}, 200);
	},

	mounted() {
		$(this.$el).on('error.form', () => {
			this.showForm = true;
			$(this.$el).addClass('has-errors');
		});
	},

	methods: {
		ifUrlByStatus() {
			return (this.status == 'draft') ? true : false;
		},

		compile() {
			this.$ajax.get([this.routes.compile], {id: this.form.pk})
				.then(res => this.compiled = res);
		},

		...mapMutations([
			'setSaved',
		])
	}
};
</script>