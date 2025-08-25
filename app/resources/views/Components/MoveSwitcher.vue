<script setup>
import { useForm } from '@inertiajs/vue3';
import { ref, watchEffect } from 'vue';

const props = defineProps({
	moves: {
		type: Array,
		required: true,
	},
	activeMoveId: {
		type: Number,
		required: true,
	},
	moveId: {
		type: Number,
		required: false,
		default: null,
	},
	noMb: {
		type: Boolean,
		required: false,
		default: false,
	}
});

const moveId = ref(props.moveId);
const form = useForm();

const emit = defineEmits([
	'update:moveId',
	'update:activeMoveId',
]);

watchEffect(() => emit('update:moveId', moveId.value));

function setActiveMove() {
	form.post(`/moves/${moveId.value}/set-active`, {
		onSuccess: () => {
			emit('update:activeMoveId', moveId.value);
		},
	});
}
</script>

<template>
	<div class="input-group" :class="{'mb-3': !props.noMb}">
		<span class="input-group-text bg-secondary-subtle">Move:</span>
		<select class="form-select" v-model="moveId">
			<option v-for="move in props.moves" :key="move.id" :value="move.id">
				{{ move.name }}
			</option>
		</select>
		<button
			v-if="moveId !== props.activeMoveId"
			class="btn btn-primary"
			type="button"
			@click="setActiveMove"
		>
			Set as Current Move
		</button>
	</div>
</template>