<script setup>
import ColorSquare from '@/Components/ColorSquare.vue';
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { CompactPicker } from 'vue-color';

const props = defineProps({
	move: {
		type: Object,
		required: true,
	},
	tag: {
		type: Object,
		required: false,
		default: null,
	},
});

const title = computed(() => (props.tag ? 'Edit Tag' : 'Add Tag'));

const showColorPicker = ref(false);
const color = ref(props.tag ? props.tag.color : '#ffffff');
</script>

<template>
	<Head :title="title" />

	<Link :href="`/moves/${move.id}/tags`" class="mb-3">&lt; Back to Tags</Link>
	<h1>{{ title }}</h1>
	<Form
		:action="`/moves/${move.id}/tags/${props.tag ? props.tag.id : 'new'}`"
		method="post"
		#default="{ errors }"
	>
		<Input
			id="name"
			label="Name"
			:model-value="props.tag?.name"
			:error="errors.name"
		/>
		<div class="mb-4">
			<div class="form-label hstack gap-2">
				<span><b>Color:</b></span>
				<ColorSquare :color="color" />
				<button type="button" class="btn btn-outline-secondary btn-sm" @click="showColorPicker = !showColorPicker">
					<i class="bi" :class="showColorPicker ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
					{{ showColorPicker ? 'Hide Color Picker' : 'Show Color Picker' }}
				</button>
				<input type="hidden" name="color" :value="color" />
			</div>
			<CompactPicker class="mb-3 ms-5" :class="{ 'd-none': !showColorPicker }" v-model="color" />
			<div v-if="errors.color" class="invalid-feedback d-block">
				{{ errors.color }}
			</div>
		</div>

		<button type="submit" class="btn btn-primary">
			<i class="bi bi-check-circle"></i>
			{{ props.tag ? 'Update Tag' : 'Add Tag' }}
		</button>
	</Form>
</template>