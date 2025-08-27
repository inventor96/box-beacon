<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import ColorSquare from '@/Components/ColorSquare.vue';
import Head from '@/Components/Head.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
import { Form, Link, router } from '@inertiajs/vue3';
import { ref, watch } from 'vue';

const props = defineProps({
	active_move_id: Number,
	move_id: Number,
	moves: Array,
	boxes: Array,
});

// move switcher
const activeMoveId = ref(props.active_move_id);
const moveId = ref(props.move_id);
watch(moveId, (newVal) => router.get(`/moves/${newVal}/boxes`), { immediate: false });

function getBoxItems(box) {
	return box.items.slice(0, 2).map(item => item.name).join(', ');
}
</script>

<template>
	<Head title="Boxes" />

	<h1>Boxes</h1>
	<p>View and manage your boxes.</p>

	<MoveSwitcher
		:moves="props.moves"
		v-model:activeMoveId="activeMoveId"
		v-model:moveId="moveId"
	/>

	<Form :action="`/moves/${moveId}/boxes/new`" method="post" class="mb-2">
		<button type="submit" class="btn btn-success">Add a Box</button>
	</Form>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Box #</th>
				<th>Items <span class="d-md-none">/ Tags</span></th>
				<th class="d-none d-md-table-cell">Tags</th>
				<th class="d-none d-lg-table-cell">From Room</th>
				<th class="d-none d-lg-table-cell">To Room</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="boxes.length" v-for="box in boxes" :key="box.id" class="align-middle">
				<th>
					<BoxNumber :number="box.number" />
				</th>
				<td>
					<span v-if="box.items.length">
						{{ box.items.slice(0, 2).map(item => item.name).join(', ') }}<span v-if="box.items.length > 2">, and {{ box.items.length - 2 }} more...</span>
					</span>
					<span v-else class="text-muted">No items</span>
					<div class="d-flex d-md-none gap-1 flex-wrap mt-1">
						<span v-if="box.heavy" class="badge bg-secondary">Heavy</span>
						<span v-if="box.fragile" class="badge bg-secondary">Fragile</span>
					</div>
				</td>
				<td class="d-none d-md-table-cell">
					<div class="d-flex gap-1 flex-wrap">
						<span v-if="box.heavy" class="badge bg-secondary">Heavy</span>
						<span v-if="box.fragile" class="badge bg-secondary">Fragile</span>
					</div>
				</td>
				<td class="d-none d-lg-table-cell">
					<div class="hstack gap-2">
						<ColorSquare :color="box.fromRoom?.color ?? '#ffffff'" />
						{{ box.fromRoom?.name ?? '---' }}
					</div>
				</td>
				<td class="d-none d-lg-table-cell">
					<div class="hstack gap-2">
						<ColorSquare :color="box.toRoom?.color ?? '#ffffff'" />
						{{ box.toRoom?.name ?? '---' }}
					</div>
				</td>
				<td>
					<div class="hstack gap-1 justify-content-end">
						<Link :href="`/moves/${moveId}/boxes/${box.id}`" class="btn btn-secondary">View/Edit</Link>
						<Form :action="`/moves/${moveId}/boxes/${box.id}`" method="delete" class="m-0">
							<button type="submit" class="btn btn-danger">Delete</button>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="5" class="text-center">No boxes yet!</td>
			</tr>
		</tbody>
	</table>
</template>