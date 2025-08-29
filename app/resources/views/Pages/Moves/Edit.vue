<script setup>
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import Modal from '@/Components/Modal.vue';
import { Form, Link, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

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

const inviteForm = useForm({
	email: '',
	move_id: props.move?.id,
});

const inviteModal = ref(null);

function submitInvite() {
	inviteForm.post(`/invites/new`, {
		onSuccess: () => {
			inviteModal.value.hide();
			inviteForm.reset('email');
		},
	});
}
</script>

<template>
	<Head :title="title" />

	<Link href="/moves" class="mb-3">&lt; Back to Moves</Link>
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
			:error="errors.name"
		/>
		<button type="submit" class="btn btn-primary">{{ props.move ? 'Update Move' : 'Create Move' }}</button>
	</Form>

	<hr class="mt-5">
	<h2>Participants</h2>
	<button v-if="move" data-bs-toggle="modal" data-bs-target="#invite-participant" class="btn btn-success mb-3">Invite Participant</button>
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
				<tr v-if="move && move.moveInvites?.length" v-for="invite in move.moveInvites" :key="invite.id">
					<td class="align-middle">{{ invite.email }}</td>
					<td class="align-middle text-end">
						<Form :action="`/invites/${invite.id}`" method="delete" class="m-0" :options="{ preserveScroll: true }">
							<button type="submit" class="btn btn-danger">Remove</button>
						</Form>
					</td>
				</tr>
				<tr v-else>
					<td colspan="2" class="text-center">No pending invitations.</td>
				</tr>
			</tbody>
		</table>
	</div>

	<Modal
		ref="inviteModal"
		id="invite-participant"
		title="Invite Participant"
		close-text="Cancel"
		confirmText=""
	>
		<form id="invite-form" @submit.prevent="submitInvite">
			<p>Please enter the email address of the person you want to invite. By submitting their email address, you agree that you have their permission to invite them.</p>
			<Input
				id="invite-email"
				type="email"
				label="Email Address"
				v-model="inviteForm.email"
				:error="inviteForm.errors.email"
				required
			/>
		</form>

		<template #footer>
			<button type="submit" class="btn btn-primary" form="invite-form" :disabled="inviteForm.processing">
				<span class="spinner-border spinner-border-sm" v-if="inviteForm.processing" role="status" aria-hidden="true"></span>
				Invite Participant
			</button>
		</template>
	</Modal>
</template>