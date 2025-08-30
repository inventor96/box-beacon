<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import ColorSquare from '@/Components/ColorSquare.vue';
import Input from '@/Components/Form/Input.vue';
import Select from '@/Components/Form/Select.vue';
import Switch from '@/Components/Form/Switch.vue';
import Head from '@/Components/Head.vue';
import QrScanModal from '@/Components/QrScanModal.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

const props = defineProps({
	move: {
		type: Object,
		required: true,
	},
	box: {
		type: Object,
		required: false,
		default: null,
	},
	rooms: {
		type: Array,
		required: true,
	},
});

const title = computed(() => (props.box ? 'Edit Box' : 'Add Box'));

// separate lists
const fromRooms = computed(() => props.rooms.filter((room) => room.location === 'from'));
const toRooms = computed(() => props.rooms.filter((room) => room.location === 'to'));

// color square updating
const fromRoom = ref(props.box?.from_room_id ?? null);
const toRoom = ref(props.box?.to_room_id ?? null);
const fromRoomColor = computed(() => fromRooms.value.find(room => parseInt(room.id) === parseInt(fromRoom.value))?.color ?? '#ffffff');
const toRoomColor = computed(() => toRooms.value.find(room => parseInt(room.id) === parseInt(toRoom.value))?.color ?? '#ffffff');
</script>

<template>
	<Head :title="title" />

	<Link :href="`/moves/${move.id}/boxes`" class="mb-3">&lt; Back to Boxes</Link>
	<h1>{{ title }}</h1>
	<div class="d-flex justify-content-between">
		<Link :href="`/print/${props.box.id}`" class="btn btn-secondary">Print Label</Link>
		<button type="button" class="btn btn-primary" data-bs-toggle="modal" :data-bs-target="`#qr-scan-modal-${props.move.id}`">Scan Another Box</button>
	</div>
	<Form
		:action="`/moves/${move.id}/boxes/${props.box ? props.box.id : 'new'}`"
		method="post"
		#default="{ errors }"
	>
		<h2 class="text-center">
			Box #
			<BoxNumber :number="props.box?.number ?? '---'" />
		</h2>
		<Select
			id="from_room_id"
			label="From Room"
			v-model="fromRoom"
			:error="errors.from_room_id"
			outer-class="input-group"
		>
			<template #before>
				<span class="input-group-text bg-secondary-subtle">
					<ColorSquare :color="fromRoomColor" />
				</span>
			</template>
			<option value="">Unassigned</option>
			<option v-for="value in fromRooms" :key="value.id" :value="value.id">
				{{ value.name }}
			</option>
		</Select>
		<Select
			id="to_room_id"
			label="To Room"
			v-model="toRoom"
			:error="errors.to_room_id"
			outer-class="input-group"
		>
			<template #before>
				<span class="input-group-text bg-secondary-subtle">
					<ColorSquare :color="toRoomColor" />
				</span>
			</template>
			<option value="">Unassigned</option>
			<option v-for="value in toRooms" :key="value.id" :value="value.id">
				{{ value.name }}
			</option>
		</Select>
		<Switch
			id="heavy"
			label="Heavy"
			:model-value="props.box?.heavy"
			:error="errors.heavy"
		/>
		<Switch
			id="fragile"
			label="Fragile"
			:model-value="props.box?.fragile"
			:error="errors.fragile"
		/>
		<button type="submit" class="btn btn-primary">{{ props.box ? 'Update Box' : 'Add Box' }}</button>

		<hr class="mt-5">
		<h2>Items</h2>
		<ul class="list-group mb-3">
			<li
				v-if="props.box?.items?.length"
				v-for="(item, index) in props.box?.items"
				:key="item.id"
				class="list-group-item"
			>
				<Input
					:id="`item-${item.id}-name`"
					:name="`items[${item.id}][name]`"
					label="Item Name/Description"
					:model-value="item.name"
					:error="errors.items && errors.items[item.id] ? errors.items[item.id].name : undefined"
					:no-mb="true"
					outer-class="input-group"
				>
					<template #before>
						<span class="input-group-text bg-secondary-subtle">{{ index + 1 }}.</span>
					</template>
					<template #after>
						<Form
							:action="`/moves/${move.id}/boxes/${props.box.id}/items/${item.id}`"
							method="delete"
							class="d-inline m-0"
							id="delete-item-form-{{ item.id }}"
							:options="{ preserveScroll: true }"
						/>
						<button type="submit" class="btn btn-outline-danger" form="delete-item-form-{{ item.id }}">Delete Item</button>
					</template>
				</Input>
			</li>
			<li v-else class="list-group-item">No items in this box yet!</li>
			<li class="list-group-item bg-secondary-subtle">
				<Form
					v-if="props.box"
					:action="`/moves/${move.id}/boxes/${props.box.id}/items/new`"
					method="post"
					class="mb-0"
					:options="{ preserveScroll: true }"
				>
					<button type="submit" class="btn btn-success">Add Item</button>
				</Form>
			</li>
		</ul>
		<button type="submit" class="btn btn-primary">{{ props.box ? 'Update Box' : 'Add Box' }}</button>
	</Form>

	<QrScanModal
		:id="`qr-scan-modal-${props.move.id}`"
		:moveId="props.move.id"
	/>
</template>