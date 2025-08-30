<script setup>
import { ref, watch, watchEffect } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import Select from './Form/Select.vue';

const props = defineProps({
	enabled: {
		type: Boolean,
		required: false,
		default: true,
	},
	modelValue: {
		type: Array,
		required: false,
		default: () => [],
	},
});

const loading = ref(true);
const result = ref(props.modelValue);
const error = ref('');
const torchAvailable = ref(false);
const torchEnabled = ref(false);

// update value
const emit = defineEmits([
	'update:modelValue',
	'detect',
	'error',
]);
watchEffect(() => {
	emit('update:modelValue', result.value);
});

// update result when a code is detected
function onDetect(detectedCodes) {
	result.value = detectedCodes.map((code) => code.rawValue);
	emit('detect', result.value);
}

// camera selection
const selectedConstraints = ref({ facingMode: 'environment' });
const defaultConstraintOptions = [
	{ label: 'Rear camera', constraints: { facingMode: 'environment' } },
	{ label: 'Front camera', constraints: { facingMode: 'user' } },
];
const constraintOptions = ref(defaultConstraintOptions);

// reset loading state
watch(
	[() => props.enabled, torchEnabled, selectedConstraints],
	() => {
		loading.value = true;
	}
);

// setups when the camera is ready
async function onCameraReady(capabilities) {
	/*
		NOTE: on iOS we can't invoke `enumerateDevices` before the user has given
		camera access permission. `QrcodeStream` internally takes care of
		requesting the permissions. The `camera-on` event should guarantee that this
		has happened.
	*/
	const devices = await navigator.mediaDevices.enumerateDevices();
	const videoDevices = devices.filter(({ kind }) => kind === 'videoinput');

	// update camera selection list
	constraintOptions.value = [
		...defaultConstraintOptions,
		...videoDevices.map(({ deviceId, label }) => ({
			label: `${label} (ID: ${deviceId})`,
			constraints: { deviceId },
		})),
	];

	// update torch support
	torchAvailable.value = capabilities.torch;

	// reset states
	error.value = '';
	loading.value = false;
}

// display outlines around detected codes
function paintOutline(detectedCodes, ctx) {
	for (const detectedCode of detectedCodes) {
		const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

		ctx.strokeStyle = 'red';

		ctx.beginPath();
		ctx.moveTo(firstPoint.x, firstPoint.y);
		for (const { x, y } of otherPoints) {
			ctx.lineTo(x, y);
		}
		ctx.lineTo(firstPoint.x, firstPoint.y);
		ctx.closePath();
		ctx.stroke();
	}
}

// update error message
function onError(err) {
	error.value = `[${err.name}]: `;

	if (err.name === 'NotAllowedError') {
		error.value += 'You need to grant permissions to access the camera.';
	} else if (err.name === 'NotFoundError') {
		error.value += 'It appears there is no camera on this device.';
	} else if (err.name === 'NotSupportedError') {
		error.value += 'Secure context required (HTTPS, localhost)';
	} else if (err.name === 'NotReadableError') {
		error.value += 'Is the camera already in use by another application?';
	} else if (err.name === 'OverconstrainedError') {
		error.value += 'The available camera(s) are not suitable for reading QR codes.';
	} else if (err.name === 'StreamApiNotSupportedError') {
		error.value += 'This browser does not support camera access.';
	} else if (err.name === 'InsecureContextError') {
		error.value += 'Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.';
	} else {
		error.value += err.message;
	}

	emit('error', err);
}
</script>

<template>
	<div>
		<div v-if="torchAvailable" class="btn-group w-100 mb-3" role="group">
			<button
				type="button"
				class="btn"
				:class="{ 'btn-warning': torchEnabled, 'btn-outline-warning': !torchEnabled }"
				@click="torchEnabled = true"
			>
				Flashlight On
			</button>
			<button
				type="button"
				class="btn"
				:class="{ 'btn-warning': !torchEnabled, 'btn-outline-warning': torchEnabled }"
				@click="torchEnabled = false"
			>
				Flashlight Off
			</button>
		</div>
		<QrcodeStream
			v-if="props.enabled"
			:constraints="selectedConstraints"
			:track="paintOutline"
			:formats="['qr_code']"
			:torch="torchEnabled"
			@error="onError"
			@detect="onDetect"
			@camera-on="onCameraReady"
		>
			<div v-if="loading" class="d-flex justify-content-center align-items-center h-100">
				<div class="spinner-border" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		</QrcodeStream>
		<Select
			id="camera-select"
			label="Camera"
			v-model="selectedConstraints"
			:noMb="true"
			outer-class="mt-3"
		>
			<option v-for="option in constraintOptions" :key="option.label" :value="option.constraints">
				{{ option.label }}
			</option>
		</Select>
		<div v-if="error" class="invalid-feedback d-block">
			{{ error }}
		</div>
	</div>
</template>