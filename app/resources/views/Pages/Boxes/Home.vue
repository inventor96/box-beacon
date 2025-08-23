<script setup>
import Head from '@/Components/Head.vue';
import { Form } from '@inertiajs/vue3';

const props = defineProps({
	move_id: Number,
	moves: Array,
	boxes: Array,
});
</script>

<template>
	<Head title="Boxes" />

	<h1>Boxes</h1>
	<p>View and manage your boxes.</p>

	<div class="input-group mb-3">
		<span class="input-group-text bg-secondary-subtle">Viewing Move:</span>
		<select class="form-select">
			<option v-for="move in moves" :key="move.id" :value="move.id">
				{{ move.name }}
			</option>
		</select>
	</div>

	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Name</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="boxes.length" v-for="box in boxes" :key="box.id">
				<td class="align-middle">
					{{ box.name }}
				</td>
				<td class="align-middle">
					<div class="hstack gap-1 justify-content-end">
						<a :href="`/boxes/${box.id}`" class="btn btn-secondary">View/Edit</a>
						<Form :action="`/boxes/${box.id}`" method="delete" class="m-0">
							<button type="submit" class="btn btn-danger">Delete</button>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="2" class="text-center">No boxes yet!</td>
			</tr>
		</tbody>
	</table>
</template>