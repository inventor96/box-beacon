<script setup>
import ColorSquare from '@/Components/ColorSquare.vue';
import DeleteConfirmButton from '@/Components/Form/DeleteConfirmButton.vue';
import Head from '@/Components/Head.vue';
import MoveSwitcher from '@/Components/MoveSwitcher.vue';
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
	tags: {
		type: Array,
		required: true,
	},
});
</script>

<template>
	<Head title="Tags" />

	<h1>Tags</h1>

	<MoveSwitcher
		path="/tags"
		:moves="props.moves"
		:activeMoveId="props.active_move_id"
		:moveId="props.move_id"
	/>

	<Link :href="`/moves/${props.move_id}/tags/new`" class="btn btn-success mb-2">
		<i class="bi bi-plus-circle"></i>
		Add Tag
	</Link>

	<table class="table table-striped table-hover">
		<thead>
			<tr>
				<th>Color</th>
				<th>Name</th>
				<th class="text-end">Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr
				v-if="props.tags.length"
				v-for="tag in props.tags"
				:key="tag.id"
				class="align-middle"
			>
				<td>
					<ColorSquare :color="tag.color" />
				</td>
				<td>{{ tag.name }}</td>
				<td>
					<div class="hstack gap-1 justify-content-end">
						<Link :href="`/moves/${props.move_id}/tags/${tag.id}`" class="btn btn-secondary">
							<i class="bi bi-eye"></i>
							<span class="d-none d-md-inline-block ms-1">View/Edit</span>
						</Link>
						<Form :action="`/moves/${props.move_id}/tags/${tag.id}`" method="delete" class="m-0" #default="{ processing }">
							<DeleteConfirmButton
								:id="`delete-tag-${tag.id}`"
								:item-text="`the '${tag.name}' tag`"
								:processing="processing"
							/>
						</Form>
					</div>
				</td>
			</tr>
			<tr v-else>
				<td colspan="3" class="text-center">No tags yet!</td>
			</tr>
		</tbody>
	</table>
</template>