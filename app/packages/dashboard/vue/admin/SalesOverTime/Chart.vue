<template>
	<div class="graph">
		<canvas ref="salesOverTime" />
	</div>
</template>

<script>
import $ from 'jquery';
import getWeek from 'date-fns/getWeek';
import format from 'date-fns/format';

const datasetsCommonOptions = {
	fill: true,
	borderWidth: 1,
	pointBorderColor: 'rgba(67, 142, 185, 1)',
	pointBackgroundColor: '#ffffff',
	pointRadius: 3,
};

export default {
	props: ['data', 'groupBy'],
	data() {
		return {
			dateFormat: this.getLocale().getFormatDateOptions().dateShort,
			dateLongFormat: this.getLocale().getFormatDateOptions().dateLong,
			datasetsOptions: {
				primary: {
					label: this.__('Main chart'),
					type: 'line',
					backgroundColor: 'rgba(67, 142, 185, 0.4)',
					borderColor: 'rgba(67, 142, 185, 1)',
					cubicInterpolationMode: 'monotone',
				},
				secondary: {
					label: this.__('Second chart'),
					type: 'bar',
					backgroundColor: 'rgba(240, 173, 78, 0.6)',
					borderColor: '#EEA236',

				}
			}
		};
	},

	watch: {
		data: function (val) {
			if (!this.chart) return;
			const datasets = [{
				...datasetsCommonOptions,
				...this.datasetsOptions.primary,
				data: val.primary_chart_sum
			}];

			if (val.secondary_chart_sum) datasets.push({
				...datasetsCommonOptions,
				...this.datasetsOptions.secondary,
				data: val.secondary_chart_sum,
			});

			this.chart.data = {
				labels: val.chart_dates,
				datasets
			};
			this.chart.options.scales.x.time.unit = this.groupBy;

			this.chart.update();
		},
	},
	mounted() {
		this.$bundle('chartJs').then(() => this.setUpChart());
	},

	methods: {
		setUpChart() {
			const data = {
				labels: this.data.chart_dates,
				datasets: [
					{
						...datasetsCommonOptions,
						...this.datasetsOptions.primary,
						data: this.data.primary_chart_sum
					},
					{
						...datasetsCommonOptions,
						...this.datasetsOptions.secondary,
						data: this.data.secondary_chart_sum,
					},
				]
			};

			const options = {
				interaction: {
					mode: 'index',
					intersect: false,
				},
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom'
					},
					tooltip: {
						callbacks: {
							title: ([context]) => {
								const {chart, parsed} = context;
								if (chart.options.scales.x.time.unit === 'week') {
									return `Week #${getWeek(parsed.x)}\n${format(parsed.x, this.dateLongFormat)}`;
								}
								return format(parsed.x, this.dateLongFormat);
							},
							label: ({dataset, raw}) => {
								return `${dataset.label}: ${this.formatMoney(raw)}`;
							}
						}
					}
				},
				scales: {
					x: {
						categoryPercentage: 0.3,
						ticks: {
							autoSkip: true,
							autoSkipPadding: 10,
							maxRotation: 0,
						},
						type: 'time',
						time: {
							parser: this.dateFormat,
							unit: 'day',
							displayFormats: {
								'day': this.dateFormat,
								'week': 'ww/yy',
								'month': 'MMMM yy'
							}
						},
					},
					y: {
						type: 'linear',
						ticks: {
							beginAtZero: true,
							callback: (val) => this.formatMoney(val)
						}
					}
				}
			};
			const {
				Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Legend, Filler,
				Tooltip, BarElement, BarController
			} = require('chart.js');
			require('chartjs-adapter-date-fns');
			Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Legend, Filler, Tooltip, BarController, BarElement);

			const ctx = $(this.$refs.salesOverTime).get(0).getContext('2d');
			this.chart = new Chart(ctx, {type: 'line', data, options});
		}
	}
};
</script>