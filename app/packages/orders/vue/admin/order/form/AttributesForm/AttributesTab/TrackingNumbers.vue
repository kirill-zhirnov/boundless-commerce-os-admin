<template>
	<div class="order-form__tinted-box">
		<h5 class="mb-3"><i class="fa fa-truck me-2" aria-hidden="true"></i>{{ __("Tracking numbers") }}</h5>
		<div
			v-for="track in trackingNumbers"
			:key="track.track_number_id"
			class="mb-2 mt-2"
		>
			<a
				:href="url('orders/admin/order/tracking/form', {pk:track.track_number_id, order: order.order_id})"
				data-modal=""
			>
				{{ track.track_number }}
			</a>
			<a
				href="#"
				@click.prevent="rmTrack(track.track_number_id)"
				class="btn btn-outline-secondary btn-sm ms-3"
			>
				<span
					class="fa fa-trash-o"
					aria-hidden="true"
				/>
			</a>
			<p class="text-muted">
				<em>{{ __('Added') }} {{ formatDate(track.created_at) }}</em>
			</p>
		</div>
		<div>
			<a
				:href="url('orders/admin/order/tracking/form', {order: order.order_id})"
				data-modal=""
				class="btn btn-outline-secondary btn-sm"
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/> {{ __('Add track number') }}
			</a>
		</div>
	</div>
</template>
<script>
import {mapActions, mapState} from 'vuex';
import {TDateFormatType} from '../../../../../../../../modules/locale/index';

export default {
	data() {
		return {
			fetched: false
		};
	},
	computed: {
		...mapState(['tab', 'order', 'trackingNumbers']),
	},
	watch: {
		tab() {
			if (this.tab === 'attributes' && !this.fetched) {
				this.getTrackingNumbers().then(() => {
					this.fetched = true;
				});
			}
		},
	},
	methods: {
		...mapActions(['getTrackingNumbers', 'rmTrackNumber']),
		rmTrack(id) {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.rmTrackNumber(id);
		},
		formatDate(date) {
			return this.getLocale().formatDate(date, TDateFormatType.short);
		}
	}
};
</script>