<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import ColorSquare from '@/Components/ColorSquare.vue';
import Head from '@/Components/Head.vue';
import Modal from '@/Components/Modal.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
import { Form, Link, router, useForm } from '@inertiajs/vue3';
import { ref, watch } from 'vue';

const props = defineProps({
	active_move_id: Number,
	move_id: Number,
	moves: Array,
	boxes: Array,
});

const batchForm = useForm({
	pages: 1,
});

// move switcher
const activeMoveId = ref(props.active_move_id);
const moveId = ref(props.move_id);
watch(moveId, (newVal) => router.get(`/moves/${newVal}/boxes`), { immediate: false });

// track selected boxes
const selectedBoxes = ref([]);

// handler for individual checkbox change
function toggleBoxSelection(boxId, event) {
	if (event.target.checked) {
		if (!selectedBoxes.value.includes(boxId)) {
			selectedBoxes.value.push(boxId);
		}
	} else {
		selectedBoxes.value = selectedBoxes.value.filter(id => id !== boxId);
	}
}

// handler for "select all" checkbox
function toggleAllBoxes(event) {
	const checked = event.target.checked;
	if (checked) {
		selectedBoxes.value = props.boxes.map(box => box.id);
	} else {
		selectedBoxes.value = [];
	}
}

function printSelectedBoxes() {
	const ids = selectedBoxes.value.join(',');
	router.get(`/print/${ids}`);
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

	<div class="hstack gap-2 mb-2">
		<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#add-boxes">Add Multiple Boxes w/ Labels</button>
		<Form :action="`/moves/${moveId}/boxes/new`" method="post" class="d-inline-block m-0">
			<button type="submit" class="btn btn-outline-success">Add a Single Box</button>
		</Form>
	</div>
	<button type="button" class="btn btn-secondary" @click="printSelectedBoxes" :disabled="!selectedBoxes.length">Print Labels for Selected Boxes</button>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>
					<input
						type="checkbox"
						class="form-check-input"
						:indeterminate="selectedBoxes.length > 0 && selectedBoxes.length < boxes.length"
						:checked="selectedBoxes.length === boxes.length"
						@change="toggleAllBoxes($event)"
					/>
				</th>
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
				<td>
					<input
						type="checkbox"
						class="form-check-input"
						:value="box.id"
						:checked="selectedBoxes.includes(box.id)"
						@change="toggleBoxSelection(box.id, $event)"
					/>
				</td>
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
	<Modal
		id="add-boxes"
		title="Add Multiple Boxes"
		closeText="Cancel"
		confirmText=""
	>
		<form id="pages-form" @submit.prevent="batchForm.post(`/moves/${moveId}/boxes/batch`)">
			<p>There are six (6) labels per page, and a box will be created for each label.</p>
			<label for="pages" class="form-label">How many pages do you need?</label>
			<input type="range" class="form-range" min="1" max="20" v-model="batchForm.pages" id="pages" name="pages" />
			<div v-if="batchForm.errors.pages" class="invalid-feedback d-block">
				{{ batchForm.errors.pages }}
			</div>
			<div class="text-center"><b>{{ batchForm.pages }}</b> page{{ batchForm.pages !== 1 ? 's' : '' }} (<b>{{ batchForm.pages * 6 }}</b> boxes/labels)</div>
		</form>

		<template #footer>
			<button type="submit" class="btn btn-primary" form="pages-form" :disabled="batchForm.processing">
				<span class="spinner-border spinner-border-sm" v-if="batchForm.processing" role="status" aria-hidden="true"></span>
				Add Boxes &amp; Print Labels
			</button>
		</template>
	</Modal>
</template>