<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import ColorSquare from '@/Components/ColorSquare.vue';
import CustomColorBadge from '@/Components/CustomColorBadge.vue';
import DeleteConfirmButton from '@/Components/Form/DeleteConfirmButton.vue';
import Switch from '@/Components/Form/Switch.vue';
import Head from '@/Components/Head.vue';
import Modal from '@/Components/Modal.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
import Pager from '@/Components/Pager.vue';
import QrScanModal from '@/Components/QrScanModal.vue';
import { Form, Link, router, useForm } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

const props = defineProps({
	active_move_id: Number,
	move_id: Number,
	moves: Array,
	boxes: Object, // paginated
	tags: Array,
	rooms: Array,
	filters: {
		type: Object,
		required: false,
		default: () => ({}),
	},
});

const batchForm = useForm({
	pages: 1,
});

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
		selectedBoxes.value = props.boxes.data.map(box => box.id);
	} else {
		selectedBoxes.value = [];
	}
}

function printSelectedBoxes() {
	const ids = selectedBoxes.value.join(',');
	router.get(`/print/${ids}`);
}

function itemsText(items) {
	const nonEmptyItems = items.filter(item => item.name.trim() !== '');
	return nonEmptyItems
		.slice(0, 2)
		.map(item => item.name)
		.join(', ')
		+ (nonEmptyItems.length > 2
			? `, and ${nonEmptyItems.length - 2} more...`
			: ''
		);
}

// separate lists
const fromRooms = computed(() => props.rooms.filter((room) => room.location === 'from'));
const toRooms = computed(() => props.rooms.filter((room) => room.location === 'to'));

const hasFilters = computed(() => Object.keys(props.filters).length > 0);
const showFilter = ref(hasFilters.value);
</script>

<template>
	<Head title="Boxes" />

	<h1>Boxes</h1>

	<MoveSwitcher
		path="/boxes"
		:moves="props.moves"
		:activeMoveId="props.active_move_id"
		:moveId="props.move_id"
	/>

	<hr class="mb-0" />
	<div class="d-flex justify-content-between align-items-center my-2">
		<h5 class="d-inline-block mb-0">Filter</h5>
		<button type="button" class="btn btn-outline-secondary btn-sm" @click="showFilter = !showFilter">
			<i :class="showFilter ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
			{{ showFilter ? 'Hide' : 'Show' }} Filter
		</button>
	</div>
	<Form :action="`/moves/${props.move_id}/boxes`" method="get" class="mb-3" :class="{'d-none': !showFilter}" #default="{ processing }">
		<div class="row g-2">
			<div class="col-12 col-sm-4 col-lg">
				<div class="dropdown w-100">
					<button class="btn btn-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						<span v-if="props.filters.tags && props.filters.tags.length" class="badge bg-primary me-1">{{ props.filters.tags.length }}</span>
						<i class="bi bi-tags"></i>
						Tags
					</button>
					<ul class="dropdown-menu">
						<li
							v-if="props.tags.length"
							v-for="tag in props.tags"
							:key="tag.id"
							class="px-2 py-1"
						>
							<Switch
								:id="`filter-tag-${tag.id}`"
								name="tags[]"
								:value="tag.id"
								:model-value="props.filters.tags ? props.filters.tags.includes(tag.id.toString()) : false"
								:no-mb="true"
								inner-class="hstack gap-1 align-items-center"
							>
								<template #label>
									<CustomColorBadge :color="tag.color" class="form-check-label">{{ tag.name }}</CustomColorBadge>
								</template>
							</Switch>
						</li>
						<li v-else class="px-2 py-1 text-center text-muted">No tags yet!</li>
					</ul>
				</div>
			</div>
			<div class="col-12 col-sm-4 col-lg">
				<div class="dropdown w-100">
					<button class="btn btn-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						<span v-if="props.filters.from_rooms && props.filters.from_rooms.length" class="badge bg-primary me-1">{{ props.filters.from_rooms.length }}</span>
						<i class="bi bi-box-arrow-right"></i>
						From Room
					</button>
					<ul class="dropdown-menu">
						<li
							v-if="fromRooms.length"
							v-for="room in fromRooms"
							:key="room.id"
							class="px-2 py-1">
							<Switch
								:id="`filter-room-${room.id}`"
								name="from_rooms[]"
								:value="room.id"
								:model-value="props.filters.from_rooms ? props.filters.from_rooms.includes(room.id.toString()) : false"
								:no-mb="true"
								inner-class="hstack gap-1 align-items-center"
							>
								<template #label>
									<CustomColorBadge :color="room.color" class="form-check-label">{{ room.name }}</CustomColorBadge>
								</template>
							</Switch>
						</li>
						<li v-else class="px-2 py-1 text-center text-muted">No rooms yet!</li>
					</ul>
				</div>
			</div>
			<div class="col-12 col-sm-4 col-lg">
				<div class="dropdown w-100">
					<button class="btn btn-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						<span v-if="props.filters.to_rooms && props.filters.to_rooms.length" class="badge bg-primary me-1">{{ props.filters.to_rooms.length }}</span>
						<i class="bi bi-box-arrow-in-right"></i>
						To Room
					</button>
					<ul class="dropdown-menu">
						<li
							v-if="toRooms.length"
							v-for="room in toRooms"
							:key="room.id"
							class="px-2 py-1"
						>
							<Switch
								:id="`filter-room-${room.id}`"
								name="to_rooms[]"
								:value="room.id"
								:model-value="props.filters.to_rooms ? props.filters.to_rooms.includes(room.id.toString()) : false"
								:no-mb="true"
								inner-class="hstack gap-1 align-items-center"
							>
								<template #label>
									<CustomColorBadge :color="room.color" class="form-check-label">{{ room.name }}</CustomColorBadge>
								</template>
							</Switch>
						</li>
						<li v-else class="px-2 py-1 text-center text-muted">No rooms yet!</li>
					</ul>
				</div>
			</div>
			<div class="col-6 col-sm-6 col-lg">
				<button type="submit" class="btn btn-primary w-100" :disabled="processing">
					<span class="spinner-border spinner-border-sm" v-if="processing" role="status" aria-hidden="true"></span>
					<i class="bi bi-funnel-fill"></i>
					Search
				</button>
			</div>
			<div class="col-6 col-sm-6 col-lg">
				<Link :href="`/moves/${props.move_id}/boxes`" class="btn btn-outline-warning w-100">
					<i class="bi bi-x-circle"></i>
					Clear
				</Link>
			</div>
		</div>
	</Form>
	<hr class="mt-0">

	<div class="d-flex justify-content-between mb-2">
		<div class="dropdown">
			<button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
				<i class="bi bi-gear"></i>
				Actions
			</button>
			<ul class="dropdown-menu">
				<li><button type="button" class="dropdown-item" @click="printSelectedBoxes" :disabled="!selectedBoxes.length">Print Labels for Selected Boxes</button></li>
			</ul>
		</div>
		<button type="button" class="btn btn-primary" data-bs-toggle="modal" :data-bs-target="`#qr-scan-modal-${props.move_id}`">
			<i class="bi bi-qr-code-scan"></i>
			Scan
		</button>
		<div class="dropdown">
			<button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
				<i class="bi bi-plus-circle"></i>
				Add
			</button>
			<ul class="dropdown-menu dropdown-menu-end">
				<li><button type="button" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#add-boxes">Add Multiple Boxes w/ Labels</button></li>
				<li>
					<Form :action="`/moves/${props.move_id}/boxes/new`" method="post" class="d-inline m-0">
						<button type="submit" class="dropdown-item">Add a Single Box</button>
					</Form>
				</li>
			</ul>
		</div>
	</div>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>
					<input
						type="checkbox"
						class="form-check-input"
						:indeterminate="selectedBoxes.length > 0 && selectedBoxes.length < boxes.data.length"
						:checked="boxes.data.length > 0 && selectedBoxes.length === boxes.data.length"
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
			<tr v-if="props.boxes.data.length" v-for="box in props.boxes.data" :key="box.id" class="align-middle">
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
					<span v-if="itemsText(box.items)">
						{{ itemsText(box.items) }}
					</span>
					<span v-else class="text-muted">No items</span>
					<div class="d-flex d-md-none gap-1 flex-wrap mt-1">
						<CustomColorBadge
							v-for="tag in box.tags"
							:key="tag.id"
							:color="tag.color"
						>
							{{ tag.name }}
						</CustomColorBadge>
					</div>
				</td>
				<td class="d-none d-md-table-cell">
					<div class="d-flex gap-1 flex-wrap">
						<CustomColorBadge
							v-for="tag in box.tags"
							:key="tag.id"
							:color="tag.color"
						>
							{{ tag.name }}
						</CustomColorBadge>
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
						<Link :href="`/moves/${props.move_id}/boxes/${box.id}`" class="btn btn-secondary">
							<i class="bi bi-eye"></i>
							<span class="d-none d-md-inline-block ms-1">View/Edit</span>
						</Link>
						<Form :action="`/moves/${props.move_id}/boxes/${box.id}`" method="delete" class="m-0" #default="{ processing }">
							<DeleteConfirmButton
								:id="`delete-box-${box.id}`"
								:item-text="`box #${box.number}`"
								:processing="processing"
							/>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="7" class="text-center">{{ hasFilters ? 'No boxes match your search.' : 'No boxes yet!' }}</td>
			</tr>
		</tbody>
	</table>
	<Pager :pagination="props.boxes.pagination" />

	<Modal
		id="add-boxes"
		title="Add Multiple Boxes"
		closeText="Cancel"
		confirmText=""
	>
		<form id="pages-form" @submit.prevent="batchForm.post(`/moves/${props.move_id}/boxes/batch`)">
			<p>There are six (6) labels per page, and a box will be created for each label.</p>
			<label for="pages" class="form-label">How many pages do you need?</label>
			<input type="range" class="form-range" min="1" max="20" v-model="batchForm.pages" id="pages" name="pages" />
			<div v-if="batchForm.errors.pages" class="invalid-feedback d-block">
				{{ batchForm.errors.pages }}
			</div>
			<div class="text-center"><b>{{ batchForm.pages }}</b> page{{ batchForm.pages !== 1 ? 's' : '' }} (<b>{{ batchForm.pages * 6 }}</b> boxes/labels)</div>
		</form>

		<template #footer>
			<button type="submit" class="btn btn-success" form="pages-form" :disabled="batchForm.processing">
				<span class="spinner-border spinner-border-sm" v-if="batchForm.processing" role="status" aria-hidden="true"></span>
				Add Boxes &amp; Print Labels
			</button>
		</template>
	</Modal>

	<QrScanModal
		:id="`qr-scan-modal-${props.move_id}`"
		:moveId="props.move_id"
	/>
</template>