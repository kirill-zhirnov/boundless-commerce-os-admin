<template>
	<div class="order-tab">
		<template v-if="additionTabFetched">
			<div class="row">
				<div class="col-lg-8 offset-lg-2">
					<h3>Payment transactions</h3>
					<table class="table table-striped">
						<thead>
						<tr>
							<th scope="col">ID</th>
							<th scope="col">Payment method</th>
							<th scope="col">Amount</th>
							<th scope="col">Markup</th>
							<th scope="col">Status</th>
							<th scope="col">External ID</th>
							<th scope="col">Date</th>
						</tr>
						</thead>
						<tbody>
						<tr v-for="transaction in paymentTransactions"
								:key="transaction.payment_transaction_id"
						>
							<td>{{ transaction.payment_transaction_id }}</td>
							<td>{{ transaction.payment_method_title }}</td>
							<td>{{ formatMoney(transaction.total_amount) }}</td>
							<td>{{ formatMoney(transaction.mark_up_amount) }}</td>
							<td>{{ transaction.status }}</td>
							<td>{{ transaction.external_id }}</td>
							<td>{{ formatTransactionDate(transaction.created_at) }}</td>
						</tr>
						</tbody>
					</table>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
import {mapActions, mapState} from 'vuex';
import {TDateFormatType} from '../../../../../../../modules/locale';

export default {
	computed: {
		...mapState([
			'additionTabFetched',
			'tab',
			'paymentTransactions'
		])
	},
	methods: {
		...mapActions(['fetchAdditionTab']),

		formatTransactionDate(date) {
			return this.getLocale().formatDateTime(date, TDateFormatType.long);
		}
	},
	watch: {
		tab() {
			if (this.tab === 'additions' && !this.additionTabFetched) {
				this.fetchAdditionTab();
			}
		}
	}
};
</script>