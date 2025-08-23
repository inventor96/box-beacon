<script setup>
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
	move: {
		type: Object,
		required: false,
		default: null
	},
	user: {
		type: Object,
		required: true,
	},
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
			:model-value="props.move?.name"
			:errors="errors.name"
		/>
		<button type="submit" class="btn btn-primary">{{ props.move ? 'Update Move' : 'Create Move' }}</button>
	</Form>

	<hr class="mt-5">
	<h2>Participants</h2>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Name</th>
				<th>Email</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="move && move.users?.length" v-for="user in move.users" :key="user.id">
				<td class="align-middle">
					{{ user.first_name }} {{ user.last_name }}
					<span class="badge bg-secondary">You</span>
				</td>
				<td class="align-middle">{{ user.email }}</td>
				<td class="align-middle text-end">
					<button v-if="user.id !== props.user.id" class="btn btn-danger" @click="removeUser(user.id)">Remove</button>
				</td>
			</tr>
			<tr v-else>
				<td colspan="3" class="text-center">No participants yet!</td>
			</tr>
		</tbody>
	</table>

</template>