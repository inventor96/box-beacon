<script setup>
import ColorSquare from '@/Components/ColorSquare.vue';
import Head from '@/Components/Head.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
import { Form, Link, router } from '@inertiajs/vue3';
import { computed, ref, watch } from 'vue';

const props = defineProps({
	active_move_id: {
		type: Number,
		required: true,
	},
	move_id: {
		type: Number,
		required: true,
	},
	moves: {
		type: Array,
		required: true,
	},
	rooms: {
		type: Array,
		required: true,
	},
	location: {
		type: String,
		required: false,
		default: 'from',
	},
});

// move switcher
const activeMoveId = ref(props.active_move_id);
const moveId = ref(props.move_id);
watch(moveId, (newVal) => router.get(`/moves/${newVal}/rooms`), { immediate: false });

// separate lists
const fromRooms = computed(() => props.rooms.filter((room) => room.location === 'from'));
const toRooms = computed(() => props.rooms.filter((room) => room.location === 'to'));

const location = ref(props.location);
</script>

<template>
	<Head title="Rooms" />

	<h1>Rooms</h1>
	<p>View and manage your rooms.</p>

	<MoveSwitcher
		:moves="props.moves"
		v-model:activeMoveId="activeMoveId"
		v-model:moveId="moveId"
	/>

	<Link :href="`/moves/${moveId}/rooms/new?location=${location}`" class="btn btn-success mb-2">
		<i class="bi bi-plus-circle"></i>
		Add Room
	</Link>

	<ul class="nav nav-tabs nav-fill">
		<li class="nav-item">
			<button
				class="nav-link"
				:class="{'active': location === 'from'}"
				id="from-rooms-tab"
				data-bs-toggle="tab"
				data-bs-target="#from-rooms"
				type="button"
				@click="location = 'from'"
			>
				<i class="bi bi-box-arrow-right"></i>
				From Rooms
			</button>
		</li>
		<li class="nav-item">
			<button
				class="nav-link"
				:class="{'active': location === 'to'}"
				id="to-rooms-tab"
				data-bs-toggle="tab"
				data-bs-target="#to-rooms"
				type="button"
				@click="location = 'to'"
			>
				<i class="bi bi-box-arrow-in-right"></i>
				To Rooms
			</button>
		</li>
	</ul>

	<div class="tab-content">
		<div v-for="location in ['from', 'to']" class="tab-pane fade" :class="{'show active': location === props.location}" :id="`${location}-rooms`">
			<table class="table table-striped table-hover">
				<thead>
					<tr>
						<th>Color</th>
						<th>Name</th>
						<th class="text-end">Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-if="(location === 'from' ? fromRooms : toRooms).length"
						v-for="room in (location === 'from' ? fromRooms : toRooms)"
						:key="room.id"
						class="align-middle"
					>
						<td>
							<ColorSquare :color="room.color" />
						</td>
						<td>{{ room.name }}</td>
						<td>
							<div class="hstack gap-1 justify-content-end">
								<Link :href="`/moves/${moveId}/rooms/${room.id}`" class="btn btn-secondary">
									<i class="bi bi-eye"></i>
									<span class="d-none d-md-inline-block ms-1">View/Edit</span>
								</Link>
								<Form :action="`/moves/${moveId}/rooms/${room.id}`" method="delete" class="m-0">
									<button type="submit" class="btn btn-danger">
										<i class="bi bi-trash3"></i>
										<span class="d-none d-md-inline-block ms-1">Delete</span>
									</button>
								</Form>
							</div>
						</td>
					</tr>
					<tr v-else>
						<td colspan="3" class="text-center">No "{{ location }}" rooms yet!</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>