<script setup>
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';
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
	<Link v-if="move" :href="`/moves/${move.id}/users/new`" class="btn btn-primary mb-3">Add Participant</Link>
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
					<span v-if="user.id === props.user.id" class="badge bg-secondary">You</span>
				</td>
				<td class="align-middle">{{ user.email }}</td>
				<td class="align-middle text-end">
					<Form v-if="user.id !== props.user.id" :action="`/moves/${move.id}/users/${user.id}`" method="delete" class="m-0">
						<button type="submit" class="btn btn-danger">Remove</button>
					</Form>
				</td>
			</tr>
			<tr v-else>
				<td colspan="3" class="text-center">No participants yet!</td>
			</tr>
		</tbody>
	</table>
	<div v-if="move && move.moveInvites?.length">
		<h3>Pending Invitations</h3>
		<table class="table table-striped table-hover">
			<thead>
				<tr>
					<th>Email</th>
					<th class="text-end">Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="invite in move.moveInvites" :key="invite.id">
					<td class="align-middle">{{ invite.email }}</td>
					<td class="align-middle text-end">
						<Form :action="`/moves/${move.id}/invites/${invite.id}`" method="delete" class="m-0">
							<button type="submit" class="btn btn-danger">Remove</button>
						</Form>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>