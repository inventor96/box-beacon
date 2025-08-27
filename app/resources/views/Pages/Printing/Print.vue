<script>
export default { layout: false }
</script>

<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import Head from '@/Components/Head.vue';
import { Link } from '@inertiajs/vue3';
import Qrcode from 'qrcode.vue';

const props = defineProps({
	boxes: {
		type: Array,
		required: true,
	},
});

function boxUrl(box) {
	return `${window.location.origin}/moves/${box.move_id}/boxes/${box.id}`;
}

function print() {
	window.print();
}
</script>

<template>
	<Head title="Print Labels" />

	<div class="container-fluid text-center">
		<div class="row d-print-none my-3">
			<div class="col d-flex justify-content-start">
				<Link href="/moves/0/boxes" class="btn btn-secondary">&lt; Go to Boxes List</Link>
			</div>
			<div class="col d-flex justify-content-end">
				<button type="button" class="btn btn-primary" @click="print">Print</button>
			</div>
		</div>
		<div class="row g-3 row-cols-2 row-cols-md-3">
			<div v-for="box in props.boxes" :key="box.id" class="col no-page-break">
				<div class="border border-black border-dashed p-2">
					<div>
						BoxBeacon
					</div>
					<BoxNumber :number="box.number" class="display-3" />
					<div class="mt-3">
						<Qrcode :value="boxUrl(box)" level="H" size="150" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>