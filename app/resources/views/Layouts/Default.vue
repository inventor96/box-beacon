<script setup>
import { Dropdown } from 'bootstrap' // used by navbar
import NavLink from '@/Components/NavLink.vue';
import Alert from '@/Components/Alert.vue';
import { Link } from '@inertiajs/vue3';

const props = defineProps({
	_env: {
		type: String,
		default: 'unknown'
	},
	_left_navlinks: {
		type: Array,
		default: () => []
	},
	_right_navlinks: {
		type: Array,
		default: () => []
	},
	_container_error: {
		type: [Array, Object],
		default: () => []
	},
	_container_warning: {
		type: [Array, Object],
		default: () => []
	},
	_container_success: {
		type: [Array, Object],
		default: () => []
	}
});
</script>

<template>
	<!-- environment alert -->
	<div v-if="props._env !== 'prod'" id="env_alert" class="alert alert-warning m-0 p-1 text-center">
		{{props._env}} environment
	</div>

	<!-- navigation bar -->
	<nav id="navbar" data-bs-theme="dark" class="navbar navbar-expand-lg bg-primary mb-3 shadow">
		<div class="container">
			<Link class="navbar-brand fw-semibold" href="/">Box Beacon</Link>
			<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
				<span class="navbar-toggler-icon"></span>
			</button>
			<div class="collapse navbar-collapse fw-normal" id="navbarNav">
				<ul class="navbar-nav">
					<NavLink
						v-for="link in props._left_navlinks"
						:key="link.path"
						:path="link.path"
						:name="link.name"
						:icon="link.icon ?? ''"
						:active="link.active"
						:dropdowns="link.dropdowns"
					/>
				</ul>
				<ul class="navbar-nav ms-auto">
					<NavLink
						v-for="link in props._right_navlinks"
						:key="link.path"
						:path="link.path"
						:name="link.name"
						:icon="link.icon ?? ''"
						:active="link.active"
						:dropdowns="link.dropdowns"
					/>
				</ul>
			</div>
		</div>
	</nav>

	<div id="container" class="container pb-5">
		<!-- page alerts -->
		<Alert
			v-for="(msg, index) in props._container_error"
			:key="index"
			:msgs="msg"
			type="danger"
			:timeout="0"
		/>
		<Alert
			v-for="(msg, index) in props._container_warning"
			:key="index"
			:msgs="msg"
			type="warning"
			:timeout="0"
		/>
		<Alert
			v-for="(msg, index) in props._container_success"
			:key="index"
			:msgs="msg"
			type="success"
		/>

		<!-- page content -->
		<slot />
	</div>
</template>
