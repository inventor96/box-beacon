<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import Head from '@/Components/Head.vue';
import { Form, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps({
	active_move_id: Number,
	move_id: Number,
	moves: Array,
	boxes: Array,
});

const moveId = ref(props.move_id);

function viewMove() {
	router.get(`/moves/${moveId.value}/boxes`);
}
</script>

<template>
	<Head title="Boxes" />

	<h1>Boxes</h1>
	<p>View and manage your boxes.</p>

	<Form :action="`/moves/${moveId}/set-active`" method="post" class="m-0">
		<div class="input-group mb-3">
			<span class="input-group-text bg-secondary-subtle">Move:</span>
			<select class="form-select" v-model="moveId" @change="viewMove">
				<option v-for="move in moves" :key="move.id" :value="move.id">
					{{ move.name }}
				</option>
			</select>
			<button
				v-if="moveId !== props.active_move_id"
				class="btn btn-primary"
				type="submit"
			>
				Set as Current Move
			</button>
		</div>
	</Form>

	<Link :href="`/moves/${moveId}/boxes/new`" class="btn btn-success mb-2">Add Box</Link>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Box #</th>
				<th>Tags</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="boxes.length" v-for="box in boxes" :key="box.id" class="align-middle">
				<th>
					<BoxNumber :number="box.number" />
				</th>
				<td>
					<div class="d-flex gap-1 flex-wrap">
						<span v-if="box.heavy" class="badge bg-secondary">Heavy</span>
						<span v-if="box.fragile" class="badge bg-secondary">Fragile</span>
					</div>
				</td>
				<td>
					<div class="hstack gap-1 justify-content-end">
						<a :href="`/moves/${moveId}/boxes/${box.id}`" class="btn btn-secondary">View/Edit</a>
						<Form :action="`/moves/${moveId}/boxes/${box.id}`" method="delete" class="m-0">
							<button type="submit" class="btn btn-danger">Delete</button>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="3" class="text-center">No boxes yet!</td>
			</tr>
		</tbody>
	</table>
</template>