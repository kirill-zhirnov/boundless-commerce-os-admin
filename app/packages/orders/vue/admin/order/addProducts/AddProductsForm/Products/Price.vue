<template>
	<div>
		<template v-if="Array.isArray(price)">
			<template v-if="price[0] !== price[1]">
				<span>{{ formatMoney(price[0]) }}</span> - <span>{{ formatMoney(price[1]) }}</span>
			</template>
			<template v-else>
				<span>{{ formatMoney(price[0]) }}</span>
			</template>
		</template>
		<template v-else>
			<span>{{ formatMoney(price) }}</span>
		</template>
	</div>
</template>

<script>
export default {
	props: ['price']
};
</script>