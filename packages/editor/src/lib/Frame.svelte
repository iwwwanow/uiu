<script lang="ts">
	let { html }: { html: string } = $props();

	let wrapper: HTMLDivElement;
	let bodyEl: HTMLElement | null = null;

	$effect(() => {
		if (!wrapper) return;

		// a real <body> tag, so that `body { ... }` rules in the site's own
		// stylesheet match it the same way they would in a real browser tab
		bodyEl?.remove();
		bodyEl = document.createElement('body');

		const parsed = new DOMParser().parseFromString(html, 'text/html');
		for (const attr of Array.from(parsed.body.attributes)) {
			bodyEl.setAttribute(attr.name, attr.value);
		}
		for (const node of Array.from(parsed.body.childNodes)) {
			bodyEl.appendChild(document.importNode(node, true));
		}

		wrapper.appendChild(bodyEl);
	});
</script>

<div class="frame" bind:this={wrapper}></div>

<style>
	.frame {
		display: inline-block;
		background: #fff;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
	}
</style>
