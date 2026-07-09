<script lang="ts">
	import { onMount } from 'svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Frame from '$lib/Frame.svelte';

	const fileName = 'index.html';
	let html = $state('');

	onMount(async () => {
		const res = await fetch(`/api/files?path=${encodeURIComponent(fileName)}`);
		html = await res.text();

		const parsed = new DOMParser().parseFromString(html, 'text/html');
		const stylesheetHrefs = Array.from(parsed.head.querySelectorAll('link[rel="stylesheet"]'))
			.map((el) => el.getAttribute('href'))
			.filter((href): href is string => !!href);

		for (const href of stylesheetHrefs) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `/api/files?path=${encodeURIComponent(href)}`;
			document.head.appendChild(link);
		}
	});
</script>

<Viewport {fileName}>
	{#if html}
		<Frame {html} />
	{/if}
</Viewport>
