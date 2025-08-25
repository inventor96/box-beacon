<script setup>
import { defineEmits, defineProps, useAttrs, defineOptions } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
	id: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: false,
		default: null,
	},
	options: {
		type: Object,
		required: true,
	},
	label: {
		type: String,
		required: false,
		default: null,
	},
	modelValue: {
		type: String,
		required: false,
		default: '',
	},
	error: {
		type: String,
		required: false,
		default: null,
	},
	noMb: {
		type: Boolean,
		required: false,
		default: false,
	},
});

const emit = defineEmits(['update:modelValue']);
const $attrs = useAttrs();

function onChange(event) {
	emit('update:modelValue', event.target.value);
}
</script>

<template>
	<div :class="{'mb-3': !props.noMb}">
		<select
			@change="onChange"
			:id="props.id"
			:name="props.name ?? props.id"
			class="form-select"
			:class="{'is-invalid': props.error}"
			:value="props.modelValue"
			v-bind="$attrs"
		>
			<option v-for="(value, key) in props.options" :key="key" :value="value">
				{{ value }}
			</option>
		</select>
		<div v-if="props.error" class="invalid-feedback d-block">
			{{ props.error }}
		</div>
	</div>
</template>