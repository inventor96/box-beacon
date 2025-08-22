<script setup>
import { Link } from '@inertiajs/vue3';

const props = defineProps({
	path: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	active: {
		type: Boolean,
		default: false
	},
	dropdowns: {
		type: Array,
		default: () => []
	},
});
</script>

<template>
	<li class="nav-item" :class="{ 'dropdown': props.dropdowns.length > 0 }">
		<Link
			v-if="!props.dropdowns.length"
			class="nav-link"
			:href="props.path"
			:class="{ active: props.active }"
		>
			{{ props.name }}
		</Link>
		<a
			v-else
			class="nav-link dropdown-toggle"
			:class="{ active: props.active }"
			role="button"
			data-bs-toggle="dropdown"
			aria-expanded="false"
		>
			{{ props.name }}
		</a>
		<ul class="dropdown-menu">
			<li v-for="dropdown in props.dropdowns" :key="dropdown.path">
				<Link
					class="dropdown-item"
					:href="dropdown.path"
					:class="{ active: dropdown.active }"
				>
					{{ dropdown.name }}
				</Link>
			</li>
		</ul>
	</li>
</template>