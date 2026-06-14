export function closeOnClickOutisde(node: HTMLDialogElement) {
	const handleClick = (event: PointerEvent) => {
		if (event.target == node) {
			node.close();
		}
	};

	document.addEventListener('pointerdown', handleClick);

	return {
		destroy() {
			document.removeEventListener('pointerdown', handleClick);
		}
	};
}
