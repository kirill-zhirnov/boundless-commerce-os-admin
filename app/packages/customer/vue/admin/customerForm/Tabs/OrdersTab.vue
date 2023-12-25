<template>
	<div class="customer-orders-tab">
		<div
			v-if="fetched"
			class="row"
		>
			<div
				v-if="orders.length > 0"
				class="col-md-10 offset-md-1"
			>
				<table class="table table-striped table-condensed table-hover table-customer-orders">
					<tr>
						<th class="order">
							{{ __('Order') }}
						</th>
						<th>{{ __('Shipping') }}</th>
						<th>{{ __('Total') }}</th>
						<th class="view" />
					</tr>
					<tbody>
						<tr
							v-for="order in orders"
							:key="order.order_id"
						>
							<td
								class="order"
								:style="{'background-color': '#' + order.status_background_color}"
							>
								<p class="id">
									#{{ order.order_id }}
								</p>
								<p class="status">
									{{ order.status_title }}
								</p>
								<p class="time small">
									<i
										class="fa fa-clock-o"
										aria-hidden="true"
									/>
									{{ getLocale().formatDate(order.created_at, 'short') }} {{ getLocale().formatTime(order.created_at) }}
								</p>
							</td>
							<td class="shipping">
								<p>
									{{ order.shipping_type == 'no' ? __('No shipping') : order.delivery_title }}
								</p>
								<p
									v-if="order.delivery_sub_type == 'pickupPoint'"
									class="sub-type small"
								>
									{{ __('to the point of self-delivery') }}
								</p>
							</td>
							<td class="total">
								<p>
									{{ order.total_price_formatted }}
								</p>
								<p class="paid text-muted small">
									{{ order.is_paid == '1' ? __('Paid'):__('Awaiting for payment') }}
								</p>
							</td>
							<td class="view">
								<a
									:href="url('orders/admin/orders/form', {pk: order.order_id})"
									target="_blank"
									rel="noopener noreferrer"
								>
									<i class="fa fa-external-link" />
									{{ ' ' }} {{ __('View') }}
								</a>
							</td>
						</tr>
						<tr>
							<th
								colspan="4"
								style="text-align: left;"
							>
								{{ __('Total orders:') }} {{ ' ' }}{{ ordersTotal.totalEntries || 0 }}
							</th>
						</tr>
					</tbody>
				</table>
				<div class="text-center">
					<widget
						path="system.pagination.@c"
						:params="{collection:[$clear(paging), $clear(orders)],data: {basicUrl: 'test'}}"
					/>
				</div>
			</div>
			<div
				v-else
				class="col-md-10 offset-md-1"
			>
				{{ __('User does not have orders.') }}
			</div>
		</div>
	</div>
</template>
<script>
import {mapActions, mapMutations, mapState} from 'vuex';
import $ from 'jquery';

export default {
	props: ['forms'],
	data() {
		return {
			fetched: false,
		};
	},
	computed: {
		...mapState(['tab', 'orders', 'ordersTotal']),
		paging() {
			return {
				totalEntries: this.ordersTotal.totalEntries,
				perPage: this.ordersTotal.perPage,
				page: this.ordersTotal.page
			};
		}
	},
	watch: {
		tab() {
			if (this.tab === 'orders' && !this.fetched) {
				this.getOrders().then(() => {
					this.fetched = true;
				});
			}
		},
	},
	mounted() {
		if (this.tab === 'orders' && !this.fetched) {
			this.getOrders().then(() => {
				this.fetched = true;
			});
		}

		$(this.$el).on('click', '.pagination a[data-page]', (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.setOrdersPagination({
				...this.ordersTotal,
				page: $(e.currentTarget).data('page')
			});
			this.getOrders();
		});

	},
	methods: {
		...mapActions(['getOrders']),
		...mapMutations(['setOrdersPagination'])
	}
};
</script>