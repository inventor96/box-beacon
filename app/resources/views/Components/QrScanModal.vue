<script setup>
import { router } from '@inertiajs/vue3';
import { ref, watch } from 'vue';
import Modal from './Modal.vue';
import QrCodeScanner from './QrCodeScanner.vue';

const props = defineProps({
	id: {
		type: String,
		required: true
	},
	moveId: {
		type: Number,
		required: true
	},
});

// scan modal
const scanModal = ref(null);
const scanModalOpen = ref(false);
function scanModalOpened() {
	scanModalOpen.value = true;
}
function scanModalClosed() {
	scanModalOpen.value = false;
}

// code detection
const codeValue = ref([]);
const codeError = ref('');
watch(codeValue, (newVal) => {
	// check if it's a valid box path in the current domain
	codeError.value = '';
	if (newVal.length) {
		const code = newVal[0];
		if (code.startsWith(`${window.location.origin}/moves/${props.moveId}/boxes/`)) {
			const boxId = code.split('/').pop();
			if (boxId && !isNaN(boxId) && Number(boxId) > 0) {
				// redirect to box page
				scanModal.value.hide();
				router.get(`/moves/${props.moveId}/boxes/${boxId}`);
			} else {
				codeError.value = 'Hmm... That doesn\'t look like a valid box QR code for this move.';
			}
		} else {
			codeError.value = 'Hmm... That doesn\'t look like a valid box QR code for this move.';
		}
	}
});
</script>

<template>
	<Modal
		ref="scanModal"
		:id="props.id"
		title="Scan Box Label"
		closeText="Cancel"
		confirmText=""
		@shown="scanModalOpened"
		@closed="scanModalClosed"
	>
		<QrCodeScanner
			:enabled="scanModalOpen"
			v-model="codeValue"
		/>
		<div v-if="codeError" class="invalid-feedback d-block">
			{{ codeError }}
		</div>
	</Modal>
</template>