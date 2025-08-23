<script setup>
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
	move: Object,
	required: false,
	default: null,
});

const title = computed(() => (props.move ? 'Edit Move' : 'Create Move'));
</script>

<template>
	<Head :title="title" />

	<h1>{{ title }}</h1>
	<Form
		:action="`/moves/${props.move ? props.move.id : 'new'}`"
		method="post"
		#default="{ errors }"
	>
		<Input
			id="name"
			label="Name"
			:errors="errors.name"
		/>
		<button type="submit" class="btn btn-primary">{{ props.move ? 'Update Move' : 'Create Move' }}</button>
	</Form>

</template>