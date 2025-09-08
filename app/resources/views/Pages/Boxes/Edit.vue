<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import ColorSquare from '@/Components/ColorSquare.vue';
import CustomColorBadge from '@/Components/CustomColorBadge.vue';
import DeleteConfirmButton from '@/Components/Form/DeleteConfirmButton.vue';
import Input from '@/Components/Form/Input.vue';
import Select from '@/Components/Form/Select.vue';
import Switch from '@/Components/Form/Switch.vue';
import Head from '@/Components/Head.vue';
import QrScanModal from '@/Components/QrScanModal.vue';
import { Form, Link } from '@inertiajs/vue3';
import { computed, ref, watch, nextTick } from 'vue';

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
	tags: {
		type: Array,
		required: false,
		default: () => [],
	}
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

// track items locally
const items = ref(props.box?.items ?? []);
watch(() => props.box?.items, (newItems) => {
	// remove items that are no longer present
	items.value = items.value.filter(item => newItems.some(newItem => newItem.id === item.id));

	// add new items
	newItems.forEach((item) => {
		if (!items.value.some(existingItem => existingItem.id === item.id)) {
			items.value.push(item);
		}
	});
});

const itemNameRefs = ref([]);

// Watch for changes in items to focus last input and scroll
let prevItemsLength = props.box?.items?.length || 0;
watch(
	() => props.box?.items?.length,
	async (newLen, oldLen) => {
		if (newLen > oldLen) {
			await nextTick();

			// focus last input
			const lastInput = itemNameRefs.value[newLen - 1];
			if (lastInput) lastInput.focus();

			// also scroll window to bottom for full-page scroll
			window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
		}
		prevItemsLength = newLen;
	}
);
</script>

<template>
	<Head :title="title" />

	<Link :href="`/moves/${move.id}/boxes`" class="mb-3">&lt; Back to Boxes</Link>
	<h1>{{ title }}</h1>
	<div class="d-flex justify-content-between mb-3">
		<Link :href="`/print/${props.box.id}`" class="btn btn-secondary">
			<i class="bi bi-printer"></i>
			Print Label
		</Link>
		<button type="button" class="btn btn-primary" data-bs-toggle="modal" :data-bs-target="`#qr-scan-modal-${props.move.id}`">
			<i class="bi bi-qr-code-scan"></i>
			Scan Another Box
		</button>
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
		<div class="card mb-3">
			<div class="card-body">
				<h5 class="card-title mb-3">Tags</h5>
				<div v-if="tags.length" class="row mb-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
					<div v-for="tag in tags" class="col">
						<Switch
							:id="`tag-${tag.id}`"
							name="tags[]"
							:value="tag.id"
							:key="tag.id"
							:no-mb="true"
							:model-value="props.box?.tags?.some(t => t.id === tag.id) ?? false"
							:error="errors.tags && errors.tags[tag.id]"
							inner-class="hstack gap-1 align-items-center"
						>
							<template #label>
								<CustomColorBadge :color="tag.color" class="fs-6 form-check-label">{{ tag.name }}</CustomColorBadge>
							</template>
						</Switch>
					</div>
				</div>
				<div class="row">
					<div class="col text-center text-muted">
						Create and manage tags in the <Link :href="`/moves/${move.id}/tags`">Tags</Link> area.
					</div>
				</div>
			</div>
		</div>
		<button type="submit" class="btn btn-primary">
			<i class="bi bi-check-circle"></i>
			{{ props.box ? 'Update Box' : 'Add Box' }}
		</button>

		<hr class="mt-5">
		<h2>Items</h2>
		<ul class="list-group mb-3">
			<li
				v-if="items.length"
				v-for="(item, index) in items"
				:key="item.id"
				class="list-group-item"
			>
				<Input
					:id="`item-${item.id}-name`"
					:key="item.id"
					:name="`items[${item.id}][name]`"
					label="Item Name/Description"
					:model-value="item.name"
					@update:model-value="value => items[index].name = value"
					:error="errors.items && errors.items[item.id] ? errors.items[item.id].name : undefined"
					:no-mb="true"
					outer-class="input-group"
					:ref="el => itemNameRefs[index] = el ? el.inputRef : null"
				>
					<template #before>
						<span class="input-group-text bg-secondary-subtle">{{ index + 1 }}.</span>
					</template>
					<template #after>
						<Form
							:action="`/moves/${move.id}/boxes/${props.box.id}/items/${item.id}`"
							method="delete"
							class="d-inline m-0"
							:id="`delete-item-form-${item.id}`"
							:options="{ preserveScroll: true }"
						/>
						<DeleteConfirmButton
							:form="`delete-item-form-${item.id}`"
							button-class="btn-outline-danger"
							:id="`delete-item-${item.id}`"
							:item-text="`item #${index + 1}`"
						/>
					</template>
				</Input>
			</li>
			<li v-else class="list-group-item">No items in this box yet!</li>
			<li v-if="props.box" class="list-group-item bg-secondary-subtle">
				<Form
					v-if="props.box"
					:action="`/moves/${move.id}/boxes/${props.box.id}/items/new`"
					method="post"
					class="mb-0"
					:options="{ preserveScroll: true }"
					#default="{ processing }"
				>
					<button type="submit" class="btn btn-success" :disabled="processing">
						<i class="bi bi-plus-circle"></i>
						Add Item
					</button>
				</Form>
			</li>
		</ul>
		<button type="submit" class="btn btn-primary">
			<i class="bi bi-check-circle"></i>
			{{ props.box ? 'Update Box' : 'Add Box' }}
		</button>
	</Form>

	<QrScanModal
		:id="`qr-scan-modal-${props.move.id}`"
		:moveId="props.move.id"
	/>
</template>