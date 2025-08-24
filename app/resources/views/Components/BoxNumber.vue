<script setup>
const props = defineProps({
	number: Number,
});
</script>

<template>
	<div class="border border-black border-2 d-inline-flex align-items-center justify-content-center box">
		<div class="d-flex align-items-center justify-content-center w-100 h-100">{{ props.number }}</div>
	</div>
</template>

<style scoped>
.box {
	aspect-ratio: 1 / 1;
	width: auto;
	height: auto;
	min-width: 2em;
	min-height: 2em;
}
</style>