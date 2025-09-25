<script>
export default { layout: false }
</script>

<script setup>
import Head from '@/Components/Head.vue';
import QrCodeScanner from '@/Components/QrCodeScanner.vue';
import { Link } from '@inertiajs/vue3';
import { ref, watch } from 'vue';
import axios from 'axios';
import BoxNumber from '@/Components/BoxNumber.vue';
import CustomColorBadge from '@/Components/CustomColorBadge.vue';
import Modal from '@/Components/Modal.vue';

const props = defineProps({
	move: Object,
});

const scannedBox = ref({});
const loading = ref(false);

// toggling fullscreen
const isFullscreen = ref(false);
function toggleFullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
		isFullscreen.value = true;
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
		isFullscreen.value = false;
	}
}

// reset visual state to "waiting for scan" after a period of time
const resetTimer = ref(null);
function resetVisualState() {
	if (resetTimer.value) {
		clearTimeout(resetTimer.value);
	}
	resetTimer.value = setTimeout(() => {
		//scannedBox.value = {};
		codeValue.value = [];
		codeError.value = '';
		loading.value = false;
	}, 5000);
}

// scanner view
const hideScanner = ref(false);
const colNum = ref(4);
function zoomIn() {
	if (colNum.value < 12) {
		colNum.value++;
	}
}
function zoomOut() {
	if (colNum.value > 2) {
		colNum.value--;
	}
}

// code detection
const enabled = ref(true);
const codeValue = ref([]);
const codeError = ref('');
watch(codeValue, (newVal) => {
	// check if it's a valid box path in the current domain
	codeError.value = '';
	if (newVal.length) {
		// process the first code only
		const code = newVal[0];
		loading.value = true;
		const isByNumber = code.startsWith('by-number/');
		if (code.startsWith(`${window.location.origin}/moves/${props.move.id}/boxes/`) || isByNumber) {
			const boxId = code.split('/').pop();
			if (boxId && !isNaN(boxId) && Number(boxId) > 0) {
				// load box details via API
				axios.get(isByNumber ? `/moves/${props.move.id}/box-by-number/${boxId}/unload` : `/moves/${props.move.id}/boxes/${boxId}/unload`)
					.then((response) => {
						if (response.data && response.data.success) {
							// success
							codeError.value = '';
							scannedBox.value = response.data.box;
						} else if (response.data && response.data.error) {
							// error from server
							codeError.value = response.data.error;
							scannedBox.value = {};
						} else {
							// unknown error
							codeError.value = 'An unknown error occurred while finding the box.';
							scannedBox.value = {};
						}
						loading.value = false;
						resetVisualState();
					})
					.catch((error) => {
						if (error.response && error.response.data && error.response.data.error) {
							codeError.value = error.response.data.error;
							scannedBox.value = {};
						} else {
							codeError.value = 'An error occurred while communicating with the server.';
							scannedBox.value = {};
						}
						loading.value = false;
						resetVisualState();
					});
			} else {
				loading.value = false;
				codeError.value = 'Hmm... That doesn\'t look like a valid box QR code for this move.';
				scannedBox.value = {};
				resetVisualState();
			}
		} else {
			loading.value = false;
			codeError.value = 'Hmm... That doesn\'t look like a valid box QR code for this move.';
			scannedBox.value = {};
			resetVisualState();
		}
	}
});

// number entry modal
const numberEntry = ref('');
function submitNumberEntry() {
	if (numberEntry.value) {
		codeValue.value = [`by-number/${numberEntry.value}`];
		numberEntry.value = '';
	}
}
</script>

<template>
	<Head title="Unloading Portal" />

	<nav class="navbar navbar-expand-md bg-primary mb-3 p-1">
		<div class="container-fluid">
			<div class="collapse navbar-collapse" id="navbarSupportedContent" ref="collapseRef">
				<ul class="navbar-nav me-auto mb-0 d-none d-md-flex">
					<li class="nav-item">
						<Link href="/moves" class="nav-link text-light">
							<i class="bi bi-arrow-left"></i>
							Back to Moves
						</Link>
					</li>
				</ul>
			</div>
			<h3 class="navbar-brand text-light m-0">
				Box Beacon Unloading Portal
			</h3>
			<button
				class="navbar-toggler"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#navbarSupportedContent"
				aria-controls="navbarSupportedContent"
				aria-expanded="false"
				aria-label="Toggle navigation"
				ref="collapseRef"
			>
				<span class="navbar-toggler-icon"></span>
			</button>
			<div class="collapse navbar-collapse" id="navbarSupportedContent" ref="collapseRef">
				<ul class="navbar-nav ms-auto mb-0">
					<li class="nav-item d-md-none">
						<Link href="/moves" class="nav-link text-light">
							<i class="bi bi-arrow-left"></i>
							Back to Moves
						</Link>
					</li>
					<li class="nav-item">
						<a href="#" class="nav-link text-light" @click="toggleFullscreen">
							<i class="bi me-1" :class="{ 'bi-arrows-fullscreen': !isFullscreen, 'bi-fullscreen-exit': isFullscreen }"></i>
							{{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
						</a>
					</li>
				</ul>
			</div>
		</div>
	</nav>

	<div class="container-fluid">
		<div class="row g-3">
			<div class="order-1 order-md-0" :class="hideScanner ? 'col-auto' : `col-12 col-md-${colNum}`">
				<div class="card border-primary">
					<div class="card-body">
						<div class="alert alert-warning text-center" role="alert" v-if="!enabled && !hideScanner">
							Camera Disabled
						</div>
						<QrCodeScanner
							id="qrscanner"
							:class="{ 'd-none': hideScanner }"
							:enabled="enabled"
							v-model="codeValue"
						/>
						<div class="d-flex gap-1 justify-content-between flex-wrap" :class="{ 'mt-3': !hideScanner }">
							<button class="btn btn-secondary" @click="enabled = !enabled" :class="{ 'd-none': hideScanner }">
								<i class="bi" :class="!enabled ? 'bi-camera-video' : 'bi-camera-video-off'"></i>
								{{ enabled ? 'Disable' : 'Enable' }}
							</button>
							<div class="btn-group d-none d-md-flex" :class="{ 'd-md-none': hideScanner }" role="group">
								<button class="btn btn-outline-secondary" @click="zoomOut">
									<i class="bi bi-zoom-out lh-base"></i>
								</button>
								<button class="btn btn-outline-secondary" @click="zoomIn">
									<i class="bi bi-zoom-in lh-base"></i>
								</button>
							</div>
							<button class="btn btn-primary" @click="hideScanner = !hideScanner">
								<i class="bi lh-base" :class="!hideScanner ? 'bi-eye-slash' : 'bi-eye'"></i>
								{{ hideScanner ? '' : 'Hide Cam' }}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="col-12 col-md">
				<button class="btn btn-sm btn-primary mb-1 w-100 fw-bold" data-bs-toggle="modal" data-bs-target="#number-modal">
					<i class="bi bi-grid-3x3"></i>
					Enter Box Number
				</button>
				<div class="card border-primary">
					<div class="card-body">
						<h3 class="card-title">Box Details</h3>
						<p class="card-text">
							<!-- waiting alert -->
							<div class="alert alert-info mb-0 d-flex justify-content-center align-items-center" role="alert" v-if="codeValue.length === 0 && !codeError && enabled">
								<span class="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
								<h3 class="d-inline align-middle ms-2 mb-0">
									Waiting for label...
								</h3>
							</div>
							<!-- loading alert -->
							<div class="alert alert-secondary mb-0 d-flex justify-content-center align-items-center" role="alert" v-if="loading">
								<span class="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
								<h3 class="d-inline align-middle ms-2 mb-0">
									Loading...
								</h3>
							</div>
							<!-- found alert -->
							<div class="alert alert-success mb-0 d-flex justify-content-center align-items-center" role="alert" v-if="scannedBox.id && !codeError && !loading && codeValue.length > 0">
								<h3 class="d-inline align-middle ms-2 mb-0">
									Here it is!
								</h3>
							</div>
							<!-- error alert -->
							<div class="alert alert-danger mb-0 d-flex justify-content-center align-items-center" role="alert" v-if="codeError && !loading">
								<h3 class="d-inline align-middle ms-2 mb-0">
									{{ codeError }}
								</h3>
							</div>
							<!-- box details -->
							<div v-if="scannedBox.id && !codeError && !loading" class="row g-3 mt-2">
								<div class="col d-flex justify-content-between align-items-center flex-wrap gap-2">
									<BoxNumber :number="scannedBox.number" class="display-4" />
									<span class="display-1 ms-2">Room:</span>
									<span class="display-1">
										<CustomColorBadge :color="scannedBox.toRoom?.color ?? '#ffffff'">
											{{ scannedBox.toRoom?.name ?? '---' }}
										</CustomColorBadge>
									</span>
								</div>
								<div class="col-12">
									<hr class="my-2">
								</div>
								<div class="col-12 d-flex gap-2 flex-wrap">
									<div class="display-3" v-for="tag in scannedBox.tags" :key="tag.id">
										<CustomColorBadge :color="tag.color">
											{{ tag.name }}
										</CustomColorBadge>
									</div>
								</div>
							</div>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<Modal id="number-modal" title="Enter Box Number" close-text="" confirm-text="">
		<h2 class="text-center">
			{{ numberEntry || '---' }}
		</h2>
		<div class="row row-cols-3 g-0 justify-content-center">
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '1'">1</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '2'">2</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '3'">3</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '4'">4</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '5'">5</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '6'">6</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '7'">7</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '8'">8</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '9'">9</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry = numberEntry.slice(0, -1)">
				<i class="bi bi-backspace"></i>
			</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="numberEntry += '0'">0</button>
			<button class="col btn btn-outline-primary btn-lg fw-bold p-3" @click="submitNumberEntry()" data-bs-dismiss="modal">
				<i class="bi bi-check-circle-fill"></i>
			</button>
		</div>
	</Modal>
</template>

<style>
#qrscanner video, #qrscanner > div {
	height: unset !important;
}
</style>