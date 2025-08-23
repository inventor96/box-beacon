<script setup>
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form } from '@inertiajs/vue3';

const props = defineProps({
	move: {
		type: Object,
		required: true,
	},
});
</script>

<template>
	<Head title="Add Participant" />

	<h1>Add Participant</h1>
	<p>Add a participant to the move.</p>
	<Form
		:action="`/moves/${move.id}/add-user`"
		method="post"
		#default="{ errors }"
	>
		<Input
			id="email"
			label="Email"
			:errors="errors.email"
		/>
		<button type="submit" class="btn btn-primary">Add Participant</button>
	</Form>
</template>