<template>
	<form @submit.prevent="save">
		<div class="row">
			<div class="col-sm-5">
				<div class="form-group">
					<input
						v-model="attrs.icon_type"
						type="hidden"
						name="icon_type"
					>
					<input
						v-model="attrs.icon_image"
						type="hidden"
						name="icon_image"
					>
					<input
						v-model="attrs.icon_icon"
						type="hidden"
						name="icon_icon"
					>

					<label class="form-label">{{ __('Icon') }}</label>
					<IconOrImage
						:img-resize="imgResize"
						:picker-options="{cols: 5}"
						:in-val="{
							type: attrs.icon_type,
							image: attrs.icon_image,
							icon: attrs.icon_icon
						}"
						@upVal="setIcon"
					/>
				</div>
			</div>
			<div class="col-sm-7">
				<div class="form-group">
					<label class="form-label">{{ __('Text') }}</label>
					<input
						v-model="attrs.text"
						type="text"
						name="text"
						class="form-control"
					>
				</div>
				<div class="form-group">
					<label class="form-label">{{ __('Link') }}</label>
					<LinkFindAndInsert
						v-model="attrs.link"
						input-name="link"
						@linkMeta="onLinkSet"
					/>
				</div>
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="attrs.new_window"
							class="form-check-input"
							type="checkbox"
							name="new_window"
							value="1"
						> <i class="fa fa-external-link" /> {{ __('Open in new window') }}
					</label>
				</div>
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="attrs.is_visible"
							class="form-check-input"
							type="checkbox"
							name="is_visible"
							value="1"
						> <i class="fa fa-eye" /> {{ __('Show block on the site') }}
					</label>
				</div>
			</div>
		</div>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				<i class="fa fa-floppy-o" /> {{ __('Save') }}
			</button>
		</div>
	</form>
</template>

<script>
import IconOrImage from '../../../theme/vue/image/IconOrImage.vue';
import LinkFindAndInsert from '../../../theme/vue/link/FindAndInsert.vue';

export default {

	components: {
		IconOrImage,
		LinkFindAndInsert
	},
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs,
			imgResize: {
				isOn: true,
				cropperOptions: {
					aspectRatio: 1
				},
				maxWidth: 30
			}
		};
	},

	methods: {
		onLinkSet(value) {
			this.attrs.new_window = ['whatsApp', 'telegram'].includes(value.type) ? 1 : null;
		},

		setIcon(value) {
			Object.keys(value).forEach((key) => this.attrs[`icon_${key}`] = value[key]);
		},

		save() {
			this.$form(this.$el).submit(['theme/bosses/iconWithLink/form', {
				block: this.form.blockId,
				theme: this.form.themeId,
				layout: this.form.layout
			}]);
		}
	}
};
</script>