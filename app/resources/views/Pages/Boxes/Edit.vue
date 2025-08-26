<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import Select from '@/Components/Form/Select.vue';
import Switch from '@/Components/Form/Switch.vue';
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed } from 'vue';

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
</script>

<template>
	<Head :title="title" />

	<Link :href="`/moves/${move.id}/boxes`" class="mb-3">&lt; Back to Boxes</Link>
	<h1>{{ title }}</h1>
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
			:model-value="props.box?.from_room_id"
			:error="errors.from_room_id"
		>
			<option value="">Unassigned</option>
			<option v-for="value in fromRooms" :key="value.id" :value="value.id">
				{{ value.name }}
			</option>
		</Select>
		<Select
			id="to_room_id"
			label="To Room"
			:model-value="props.box?.to_room_id"
			:error="errors.to_room_id"
		>
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
	</Form>
</template>