<script setup>
import ColorSquare from '@/Components/ColorSquare.vue';
import Input from '@/Components/Form/Input.vue';
import Head from '@/Components/Head.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { TwitterPicker } from 'vue-color';

const props = defineProps({
	move: {
		type: Object,
		required: true,
	},
	room: {
		type: Object,
		required: false,
		default: null,
	},
});

const title = computed(() => (props.room ? 'Edit Room' : 'Add Room'));

const showColorPicker = ref(false);
const color = ref(props.room ? props.room.color : '#ffffff');
</script>

<template>
	<Head :title="title" />

	<Link :href="`/moves/${move.id}/rooms`" class="mb-3">&lt; Back to Rooms</Link>
	<h1>{{ title }}</h1>
	<Form
		:action="`/moves/${move.id}/rooms/${props.room ? props.room.id : 'new'}`"
		method="post"
		#default="{ errors }"
	>
		<Input
			id="name"
			label="Name"
			:model-value="props.room?.name"
			:error="errors.name"
		/>
		<div class="mb-4">
			<div class="form-label"><b>Location:</b></div>
			<div class="btn-group d-block">
				<input
					type="radio"
					class="btn-check"
					name="location"
					value="from"
					id="from"
					autocomplete="off"
					:checked="props.room?.location === 'from'"
					:disabled="props.room"
					:class="{'is-invalid': errors.location}"
				>
				<label class="btn btn-outline-secondary" for="from">
					<i class="bi bi-box-arrow-right"></i>
					"From" House
				</label>
	
				<input
					type="radio"
					class="btn-check"
					name="location"
					value="to"
					id="to"
					autocomplete="off"
					:checked="props.room?.location === 'to'"
					:disabled="props.room"
					:class="{'is-invalid': errors.location}"
				>
				<label class="btn btn-outline-secondary" for="to">
					<i class="bi bi-box-arrow-in-right"></i>
					"To" House
				</label>
			</div>
			<div v-if="errors.location" class="invalid-feedback d-block">
				{{ errors.location }}
			</div>
			<div class="form-text">Changing the location is not supported after creating the room.</div>
		</div>
		<div class="mb-4">
			<div class="form-label hstack gap-2">
				<span><b>Color:</b></span>
				<ColorSquare :color="color" />
				<button type="button" class="btn btn-outline-secondary btn-sm" @click="showColorPicker = !showColorPicker">
					<i class="bi" :class="showColorPicker ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
					{{ showColorPicker ? 'Hide Color Picker' : 'Show Color Picker' }}
				</button>
				<input type="hidden" name="color" :value="color" />
			</div>
			<TwitterPicker class="mb-3 ms-5 mt-3" :class="{ 'd-none': !showColorPicker }" v-model="color" />
			<div v-if="errors.color" class="invalid-feedback d-block">
				{{ errors.color }}
			</div>
		</div>

		<button type="submit" class="btn btn-primary">
			<i class="bi bi-check-circle"></i>
			{{ props.room ? 'Update Room' : 'Add Room' }}
		</button>
	</Form>
</template>