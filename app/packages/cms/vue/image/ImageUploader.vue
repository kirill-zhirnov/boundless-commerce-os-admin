<template>
	<div
		class="icon-or-img"
		:class="{loaded: loaded}"
	>
		<div class="preview">
			<div
				v-if="!loaded"
				class="loading"
			/>
			<div
				v-if="value.image"
				class="content"
			>
				<div class="image">
					<img :src="makeImgUrl(value.image)">
				</div>
			</div>
			<div
				v-else
				class="no-image"
			/>
			<div
				v-if="loaded && value.image"
				class="overlay"
			>
				<a
					v-if="allowRm"
					href="#"
					@click.prevent="setVal()"
				>
					<i class="fa fa-trash" />
				</a>
			</div>
		</div>
		<p
			v-show="loaded"
			class="drop-instructions"
			:class="(value.image) ? 'small' : 'intro'"
		>
			{{ __('Drop image here to upload or ') }}
			<a
				ref="clickToUpload"
				href="#"
				@click.prevent=""
			><i class="fa fa-cloud-upload" /> {{ __('click here') }}.</a>
		</p>
		<div class="landing">
			{{ __('Drop files here') }}
		</div>
	</div>
</template>

<script>
import DropzoneWrapper from '../../widgets/dropzoneWrapper.client';
import {getImgCloudUrl} from '../../../../modules/s3Storage/cloudUrl';
import $ from 'jquery';

export default {
	props: {
		inVal: {
			type: Object,
			default: function () {
				return {
					//src to image
					image: null,
				};
			}
		},

		allowRm: {
			type: Boolean,
			default: true
		},

		dzUrl: {
			type: String,
			default: ''
		}
	},

	data() {
		return {
			value: this.inVal,
			loaded: false,
		};
	},

	watch: {
		value(val) {
			this.$emit('upVal', val);
			$(this.$el).trigger('upVal.icon', [val]); //FIXME
		}
	},

	mounted() {
		this.$bundle('adminUI').then(() => this.setup());
	},

	beforeDestroy() {
		if (this.dz)
			this.dz.remove();
	},

	methods: {
		setup() {
			this.dz = new DropzoneWrapper(
				this.$el,
				this.url('catalog/admin/category/iconUpload/tplImage'),
				{
					successMessage: false,
					clickable: this.$refs.clickToUpload,
					onSuccessHook: (file, response) => {
						const {src, imageId} = response.files[0];
						this.setVal(src, imageId);
					}
				}
			);

			this.loaded = true;
		},

		setVal(image, image_id = null) {
			this.value = {
				image,
				image_id
			};
		},

		makeImgUrl(localPath) {
			return getImgCloudUrl(localPath, 200);
		}
	}
};
</script>