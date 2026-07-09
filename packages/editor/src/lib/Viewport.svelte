<script lang="ts">
	import type { Snippet } from 'svelte';

	let { fileName, children }: { fileName: string; children: Snippet } = $props();

	const MIN_SCALE = 0.1;
	const MAX_SCALE = 8;

	let scale = $state(1);
	let panX = $state(0);
	let panY = $state(0);

	let container: HTMLDivElement;
	let panning = false;
	let lastX = 0;
	let lastY = 0;

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = container.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		const factor = Math.exp(-e.deltaY * 0.001);
		const newScale = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
		panX = cx - ((cx - panX) * newScale) / scale;
		panY = cy - ((cy - panY) * newScale) / scale;
		scale = newScale;
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.target !== container) return;
		panning = true;
		lastX = e.clientX;
		lastY = e.clientY;
		container.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!panning) return;
		panX += e.clientX - lastX;
		panY += e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function handlePointerUp(e: PointerEvent) {
		panning = false;
		container.releasePointerCapture(e.pointerId);
	}

	function resetZoom() {
		scale = 1;
		panX = 0;
		panY = 0;
	}
</script>

<div class="topbar">
	<span class="filename">{fileName}</span>
	<button class="zoom" onclick={resetZoom}>{Math.round(scale * 100)}%</button>
</div>

<div
	class="viewport"
	bind:this={container}
	onwheel={handleWheel}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
>
	<div
		class="content"
		style="transform: translate({panX}px, {panY}px) scale({scale}); transform-origin: 0 0;"
	>
		{@render children()}
	</div>
</div>

<style>
	.topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 40px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 12px;
		background: #1a1a1a;
		color: #e0e0e0;
		font: 13px sans-serif;
		z-index: 10;
	}

	.zoom {
		background: none;
		border: 1px solid #444;
		color: inherit;
		border-radius: 4px;
		padding: 2px 8px;
		cursor: pointer;
		font: inherit;
	}

	.viewport {
		position: fixed;
		top: 40px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		background: #0d0d0d;
		touch-action: none;
		cursor: grab;
	}

	.content {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
