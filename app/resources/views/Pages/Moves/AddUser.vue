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
		:action="`/moves/${move.id}/users/new`"
		method="post"
		#default="{ errors }"
	>
		<Input
			id="email"
			label="Email"
			:error="errors.email"
		/>
		<button type="submit" class="btn btn-primary">
			<i class="bi bi-person-plus"></i>
			Add Participant
		</button>
	</Form>
</template>