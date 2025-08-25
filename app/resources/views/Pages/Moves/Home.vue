<script setup>
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';

const props = defineProps({
	moves: Array,
	active_move_id: Number,
});
</script>

<template>
	<Head title="Moves" />

	<h1>Moves</h1>
	<p>View and manage your moves.</p>

	<Link href="/moves/new" class="btn btn-success mb-3">Create Move</Link>

	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Name</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="moves.length" v-for="move in moves" :key="move.id">
				<td class="align-middle">
					{{ move.name }}
					<span v-if="move.id === props.active_move_id" class="badge bg-success">Current</span>
				</td>
				<td class="align-middle">
					<div class="hstack gap-1 justify-content-end">
						<Form v-if="move.id !== props.active_move_id" :action="`/moves/${move.id}/set-active`" method="post" class="m-0">
							<button type="submit" class="btn btn-primary">Set as Current Move</button>
						</Form>
					<Link :href="`/moves/${move.id}`" class="btn btn-secondary">View/Edit</Link>
						<Form :action="`/moves/${move.id}`" method="delete" class="m-0">
							<button type="submit" class="btn btn-danger">Delete</button>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="2" class="text-center">No moves yet!</td>
			</tr>
		</tbody>
	</table>
</template>