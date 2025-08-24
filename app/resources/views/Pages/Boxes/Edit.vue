<script setup>
import Input from '@/Components/Form/Input.vue';
import Switch from '@/Components/Form/Switch.vue';
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
	move: {
		type: Object,
		required: true,
	},
	box: {
		type: Object,
		required: false,
		default: null,
	},
});

const title = computed(() => (props.box ? 'Edit Box' : 'Add Box'));
</script>

<template>
	<Head :title="title" />

	<h1>{{ title }}</h1>
	<Form
		:action="`/moves/${move.id}/boxes/${props.box ? props.box.id : 'new'}`"
		method="post"
		#default="{ errors }"
	>
		<h2 class="text-center">Box #{{ props.box ? props.box.number : '---' }}</h2>
		<Switch
			id="heavy"
			label="Heavy"
			:model-value="props.box?.heavy"
			:error="errors.heavy"
		/>
		<Switch
			id="fragile"
			label="Fragile"
			:model-value="props.box?.fragile"
			:error="errors.fragile"
		/>
		<button type="submit" class="btn btn-primary">{{ props.box ? 'Update Box' : 'Add Box' }}</button>
	</Form>
</template>