<script setup>
import BoxNumber from '@/Components/BoxNumber.vue';
import DeleteConfirmButton from '@/Components/Form/DeleteConfirmButton.vue';
import Head from '@/Components/Head.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
import Pager from '@/Components/Pager.vue';
import { Form, Link } from '@inertiajs/vue3';

const props = defineProps({
	active_move_id: {
		type: Number,
		required: true,
	},
	move_id: {
		type: Number,
		required: true,
	},
	moves: {
		type: Array,
		required: true,
	},
	items: {
		type: Object, // paginated
		required: true,
	},
	q: {
		type: String,
		required: false,
	},
});
</script>

<template>
	<Head title="Items" />

	<h1>Items</h1>

	<MoveSwitcher
		path="/items"
		:moves="props.moves"
		:activeMoveId="props.active_move_id"
		:moveId="props.move_id"
	/>

	<hr>
	<Form :action="`/moves/${props.move_id}/items`" method="get">
		<div class="input-group mb-3">
			<span class="input-group-text bg-secondary-subtle"><i class="bi bi-search"></i></span>
			<input type="text" class="form-control" placeholder="Search items..." name="q" v-model="props.q" />
			<button class="btn btn-primary" type="submit">Search</button>
			<Link :href="`/moves/${props.move_id}/items`" v-if="props.q" class="btn btn-outline-warning">Clear</Link>
		</div>
	</Form>
	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Name/Description</th>
				<th>Box</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr
				v-if="props.items.data.length"
				v-for="item in props.items.data"
				:key="item.id"
				class="align-middle"
			>
				<td>{{ item.name }}</td>
				<td>
					<BoxNumber :number="item.box.number" />
				</td>
				<td>
					<div class="hstack gap-1 justify-content-end">
						<Link :href="`/moves/${props.move_id}/boxes/${item.box.id}`" class="btn btn-secondary">
							<i class="bi bi-box"></i>
							<span class="d-none d-md-inline-block ms-1">Go to Box</span>
						</Link>
						<Form :action="`/moves/${props.move_id}/boxes/${item.box.id}/items/${item.id}`" method="delete" class="m-0" #default="{ processing }">
							<DeleteConfirmButton
								:id="`delete-item-${item.id}`"
								:item-text="`'${item.name}' from box #${item.box.number}`"
								:processing="processing"
							/>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td v-if="props.q" colspan="3" class="text-center">No items match your search.</td>
				<td v-else colspan="3" class="text-center">No items yet! Add some to a <Link :href="`/moves/${props.move_id}/boxes`">box</Link>.</td>
			</tr>
		</tbody>
	</table>
	<Pager :pagination="props.items.pagination" />
</template>