<template>
	<div
		v-if="variants.length"
		class="variants mt-3"
	>
		<div class="page-header">
			<h4>
				{{ __('Select variants, which will be created:') }}
			</h4>
		</div>
		<ul>
			<li
				v-for="variant in variants"
				:key="variant.id"
			>
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							class="form-check-input"
							type="checkbox"
							name="variant[]"
							:value="variant.id"
							checked="checked"
						>
						<span class="title">
							<span
								v-for="caseRow in variant.cases"
								:key="caseRow.title"
								:style="{color: caseRow.color}"
							>
								{{ caseRow.title }}
							</span>
						</span>
					</label>
				</div>
			</li>
		</ul>
		<div class="form-group">
			<input
				type="hidden"
				name="variant_errors"
			>
		</div>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				{{ __('Create variants') }}
			</button>
		</div>
	</div>
</template>
<script>
export default {
	props: ['forVariants'],

	data() {
		return {
		};
	},

	computed: {
		variants() {
			let out = [];
			this.forVariants.forEach((row) => {
				out = row.cases.reduce((newVarArr, caseRow) => {
					if (out.length) {
						out.forEach((variant) => {
							newVarArr.push(
								this.createVariant(caseRow, variant.cases)
							);
						});
					} else {
						newVarArr.push(this.createVariant(caseRow));
					}

					return newVarArr;
				}, []);
			});

			return out;
		}
	},

	methods: {
		createVariant(caseRow, otherCases = []) {
			let variant = {
				cases: [].concat(otherCases, caseRow)
			};

			let idList = variant.cases.reduce((out, item) => {
				out.push(item.localId);
				return out;
			}, []);

			variant.id = idList.join('X');
			return variant;
		}
	}
};
</script>