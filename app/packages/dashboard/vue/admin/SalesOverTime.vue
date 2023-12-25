<template>
	<form
		class="sales-over-time"
		@submit.prevent="submit"
	>
		<h3>{{ __('Sales Over Time') }}</h3>
		<div v-if="!fetched">
			Loading...
		</div>
		<div
			v-else
			class="row"
		>
			<div class="col-md-9 mb-4">
				<div class="filters d-flex flex-wrap">
					<div class="form-group me-5">
						<div class="d-flex align-items-center">
							<label class="text-nowrap me-2">{{ __('Date range:') }}</label>
							<input
								ref="orderFrom"
								name="from"
								class="form-control form-control-sm me-2"
							>
							{{ ' - ' }}
							<input
								ref="orderTo"
								name="to"
								class="form-control form-control-sm ms-2"
							>
						</div>
					</div>
					<div class="form-group">
						<div class="d-flex align-items-center">
							<label class="text-nowrap me-2">{{ __('Group by:') }}</label>
							<select
								v-model="attrs.groupByPeriod"
								name="groupByPeriod"
								class="form-select form-select-sm"
								@change.prevent="submit"
							>
								<option
									v-for="option in options.groupByPeriod"
									:key="option[0]"
									:value="option[0]"
								>
									{{ option[1] }}
								</option>
							</select>
						</div>
					</div>
				</div>
				<div class="mb-3">
					<Chart
						v-if="chartData"
						:data="chartData"
						:group-by="attrs.groupByPeriod"
					/>
				</div>
				<div class="">
					<table class="table table-striped">
						<thead>
							<tr>
								<th />
								<th class="text-center">
									{{ __('Main chart') }}
								</th>
								<th
									v-if="chartData.secondary_chart_sum"
									class="text-center"
								>
									{{ __('Second chart') }}
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="text-end">
									{{ __('Total orders for the amount ') }}
								</td>
								<td class="text-center">
									{{ formatMoney(chartData.primary_total_sum) }}
								</td>
								<td
									v-if="chartData.secondary_chart_sum"
									class="text-center"
								>
									{{ formatMoney(chartData.secondary_total_sum) }}
								</td>
							</tr>
							<tr>
								<td class="text-end">
									{{ __('Total orders ') }}
								</td>
								<td class="text-center">
									{{ chartData.primary_total_qty }}
								</td>
								<td
									v-if="chartData.secondary_chart_sum"
									class="text-center"
								>
									{{ chartData.secondary_total_qty }}
								</td>
							</tr>
							<tr>
								<td class="text-end">
									{{ __('Average check ') }}
								</td>
								<td class="text-center">
									{{ primaryAverage }}
								</td>
								<td
									v-if="chartData.secondary_chart_sum"
									class="text-center"
								>
									{{ secondaryAverage }}
								</td>
							</tr>
							<tr>
								<td class="text-end">
									{{ __('Total amount for the shipping ') }}
								</td>
								<td class="text-center">
									{{ formatMoney(chartData.primary_total_shipping) }}
								</td>
								<td
									v-if="chartData.secondary_chart_sum"
									class="text-center"
								>
									{{ formatMoney(chartData.secondary_total_shipping) }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			<div class="col-md-3 mb-3">
				<div class="chart-statuses bg-light p-2 rounded mb-3">
					<div class="row mx-0">
						<div class="col-md-12 col-12 col-sm-6">
							<h5>{{ __('Main chart') }}</h5>
							<div class="form-group mb-0">
								<label>{{ __('Orders with statuses:') }}</label>
								<div
									v-for="option in options.orderStatuses"
									:key="option[0]"
									class="form-check"
								>
									<label class="form-check-label">
										<input
											v-model="attrs.primary_statuses"
											class="form-check-input"
											type="checkbox"
											name="primary_statuses[]"
											:value="option[0]"
											@change="formChanged = true"
										>
										{{ option[1] }}
									</label>
								</div>
							</div>
						</div>
						<div class="col-md-12 col-12 col-sm-6">
							<h5>{{ __('Second chart') }}</h5>
							<div class="form-group mb-0">
								<label>{{ __('Orders with statuses:') }}</label>
								<div
									v-for="option in options.orderStatuses"
									:key="option[0]"
									class="form-check"
								>
									<label class="form-check-label">
										<input
											v-model="attrs.secondary_statuses"
											name="secondary_statuses[]"
											class="form-check-input"
											type="checkbox"
											:value="option[0]"
											@change="formChanged = true"
										>
										{{ option[1] }}
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="text-md-end text-center">
					<button
						type="submit"
						class="btn btn-primary"
						:disabled="!formChanged"
					>
						{{ __('Show') }}
					</button>
				</div>
			</div>
		</div>
	</form>
</template>

<script>
import $ from 'jquery';
import Chart from './SalesOverTime/Chart.vue';

export default {
	components: {Chart},

	data() {
		return {
			fetched: false,
			formChanged: false,
			options: {},
			chartData: null,
			attrs: {},
			$orderFrom: null,
			$orderTo: null,
			dateFormat: this.getLocale().getDatePickerFormat()
		};
	},

	computed: {
		primaryAverage() {
			if (!this.chartData.primary_total_qty) return 0;
			const val = this.chartData.primary_total_sum / this.chartData.primary_total_qty;
			return this.formatMoney(val);
		},
		secondaryAverage() {
			if (!this.chartData.secondary_total_qty) return 0;
			const val = this.chartData.secondary_total_sum / this.chartData.secondary_total_qty;
			return this.formatMoney(val);
		}
	},

	watch: {
		'attrs.secondary_statuses': function (val) {
			if (!val) this.attrs.secondary_statuses = [];
		}
	},

	mounted() {
		this.fetchData();
	},

	methods: {
		fetchData() {
			this.$ajax.get(['dashboard/admin/salesOverTime'])
				.then(({attrs, data, options}) => {
					this.fetched = true;
					this.attrs = attrs;
					this.options = options;
					this.chartData = data;

					this.$nextTick(() => {
						this.setupDatePickers();
					});
				})
				.catch((e) => console.error(e))
			;
		},

		setupDatePickers() {
			this.$orderFrom = $(this.$refs.orderFrom).datepicker({
				dateFormat: this.dateFormat,
			})
				.on('change', (e) => {
					this.$orderTo.datepicker('option', 'minDate', this.parseDate(e.currentTarget.value));
					this.submit();
				})
				.datepicker('setDate', this.attrs.from);

			this.$orderTo = $(this.$refs.orderTo).datepicker({
				dateFormat: this.dateFormat
			})
				.on('change', (e) => {
					this.$orderFrom.datepicker('option', 'maxDate', this.parseDate(e.currentTarget.value));
					this.submit();
				})
				.datepicker('setDate', this.attrs.to);
		},

		parseDate(value) {
			let date;
			try {
				date = $.datepicker.parseDate(this.dateFormat, value);
			} catch (error) {
				date = null;
			}

			return date;
		},

		submit() {
			this.$form(this.$el).submit(['dashboard/admin/salesOverTime', {submitted: '1'}])
				.then(({attrs, data, options}) => {
					this.attrs = attrs;
					this.options = options;
					this.chartData = data;
					this.formChanged = false;
				})
				.catch(e => {
					if (e.errors && Object.values(e.errors).length) {
						this.getRegistry().getTheme().alertDanger(Object.values(e.errors)[0][0]);
					}
				})
			;
		}
	}

};
</script>