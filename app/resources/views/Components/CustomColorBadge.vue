<script setup>
import { computed } from 'vue';

const props = defineProps({
	color: {
		type: String,
		required: true
	},
});

function hexToRgb(hex) {
	let c = hex.replace('#', '');
	if (c.length === 3) c = c.split('').map(x => x + x).join('');
	const num = parseInt(c, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255
	};
}

// Compute text color based on luminance
function getTextColor(bg) {
	const { r, g, b } = hexToRgb(bg); // custom color selector uses hex
	const luminance = 0.299 * r + 0.587 * g + 0.114 * b; // ITU-R BT.601 standard
	return luminance < 128 ? '#fff' : '#000';
}

const textColor = computed(() => getTextColor(props.color));
</script>

<template>
	<span class="badge" :style="{ backgroundColor: props.color, color: textColor }">
		<slot />
	</span>
</template>