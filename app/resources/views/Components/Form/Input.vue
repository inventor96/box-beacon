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
	type: {
		type: String,
		required: false,
		default: 'text',
	},
	label: {
		type: String,
		required: true,
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
	}
});

const emit = defineEmits(['update:modelValue']);
const $attrs = useAttrs();

function onInput(event) {
	emit('update:modelValue', event.target.value);
}
</script>

<template>
	<div :class="{'mb-3': !props.noMb}">
		<div class="form-floating">
			<input
				:id="props.id"
				:name="props.name ?? props.id"
				:type="props.type"
				class="form-control"
				:class="{'is-invalid': props.error}"
				:placeholder="props.label"
				:value="props.modelValue"
				@input="onInput"
				v-bind="$attrs"
			/>
			<label :for="props.id">{{ props.label }}</label>
		</div>
		<div v-if="props.error" class="invalid-feedback d-block">
			{{ props.error }}
		</div>
	</div>
</template>