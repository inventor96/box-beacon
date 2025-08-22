<script setup>
import { Dropdown } from 'bootstrap' // used by navbar
import NavLink from '@/Components/NavLink.vue';
import Alert from '@/Components/Alert.vue';

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
		type: [String, Array],
		default: null
	},
	_container_warning: {
		type: [String, Array],
		default: null
	},
	_container_success: {
		type: [String, Array],
		default: null
	}
});
</script>

<template>
	<!-- environment alert -->
	<div v-if="props._env !== 'prod'" id="env_alert" class="alert alert-warning m-0 p-1">
		<h5 class="alert-heading text-center m-0 text-dark">{{props._env}} environment</h5>
	</div>

	<!-- navigation bar -->
	<nav id="navbar" data-bs-theme="dark" class="navbar navbar-expand-lg bg-primary mb-3 shadow">
		<div class="container">
			<a class="navbar-brand fw-semibold" href="/">Box Beacon</a>
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
			v-if="props._container_error"
			:msgs="props._container_error"
			type="danger"
			:timeout="0"
		/>
		<Alert
			v-if="props._container_warning"
			:msgs="props._container_warning"
			type="warning"
			:timeout="0"
		/>
		<Alert
			v-if="props._container_success"
			:msgs="props._container_success"
			type="success"
		/>

		<!-- page content -->
		<slot />
	</div>
</template>
