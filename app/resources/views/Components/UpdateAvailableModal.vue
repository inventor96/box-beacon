<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import Modal from '@/Components/Modal.vue';
import { usePwa } from 'inertia-offline/vue';

const SNOOZE_MS = 5 * 60 * 1000;

const modalRef = ref(null);
const isApplyingUpdate = ref(false);
const snoozedUntil = ref(0);

let snoozeTimerId = null;

const { showRefresh, updateSW } = usePwa();

function clearSnoozeTimer() {
	if (!snoozeTimerId) {
		return;
	}

	clearTimeout(snoozeTimerId);
	snoozeTimerId = null;
}

function showModal() {
	if (modalRef.value) {
		modalRef.value.show();
	}
}

function hideModal() {
	if (modalRef.value) {
		modalRef.value.hide();
	}
}

function scheduleSnoozeEndCheck() {
	clearSnoozeTimer();

	const delay = snoozedUntil.value - Date.now();
	if (delay <= 0) {
		showModalIfNeeded();
		return;
	}

	snoozeTimerId = setTimeout(() => {
		snoozeTimerId = null;
		showModalIfNeeded();
	}, delay);
}

function showModalIfNeeded() {
	if (!showRefresh.value) {
		return;
	}

	if (Date.now() < snoozedUntil.value) {
		scheduleSnoozeEndCheck();
		return;
	}

	showModal();
}

function snoozePrompt() {
	snoozedUntil.value = Date.now() + SNOOZE_MS;
	hideModal();
	scheduleSnoozeEndCheck();
}

async function applyUpdate() {
	if (isApplyingUpdate.value) {
		return;
	}

	isApplyingUpdate.value = true;
	try {
		await updateSW.value(true);
	} catch (error) {
		console.error('[PWA] Failed to apply update:', error);
		isApplyingUpdate.value = false;
	}
}

watch(
	() => showRefresh.value,
	(needsRefresh) => {
		if (!needsRefresh) {
			clearSnoozeTimer();
			return;
		}

		showModalIfNeeded();
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	clearSnoozeTimer();
});
</script>

<template>
	<Modal
		id="update-available-modal"
		ref="modalRef"
		title="Update Available"
		closeText=""
		confirmText=""
		:options="{ backdrop: 'static', keyboard: false }"
	>
		<p class="mb-2">A new version of the app is ready.</p>
		<p class="mb-0">Refresh now to apply the update, or snooze this reminder for 5 minutes.</p>

		<template #footer>
			<button
				type="button"
				class="btn btn-outline-secondary"
				:disabled="isApplyingUpdate"
				@click="snoozePrompt"
			>
				Later
			</button>
			<button
				type="button"
				class="btn btn-primary"
				:disabled="isApplyingUpdate"
				@click="applyUpdate"
			>
				<span class="spinner-border spinner-border-sm me-1" v-if="isApplyingUpdate" role="status" aria-hidden="true"></span>
				Refresh Now
			</button>
		</template>
	</Modal>
</template>
