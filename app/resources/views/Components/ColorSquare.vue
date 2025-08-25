<script setup>
import { defineProps } from 'vue';

const props = defineProps({
	color: {
		type: String,
		required: true,
	},
});
</script>

<template>
	<div class="color-square d-inline-block border border-black" :style="{ backgroundColor: props.color }"></div>
</template>

<style scoped>
.color-square {
	width: 30px;
	height: 30px;
	border-radius: 4px;
}
</style>