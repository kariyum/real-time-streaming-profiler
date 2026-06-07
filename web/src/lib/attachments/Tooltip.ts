let nextId = 0;

export function tooltip(content: string) {
	const id = `tooltip-${nextId++}`;
	const tooltipNode = document.createElement('div');
	tooltipNode.textContent = content;
	tooltipNode.id = id;
	tooltipNode.role = 'tooltip';
	tooltipNode.classList.add('tooltip');

	return (node: HTMLElement) => {
		document.body.appendChild(tooltipNode);
		node.setAttribute('aria-describedby', id);

		const onEnter = () => {
			tooltipNode.style.display = 'block';
		};
		const onMove = (event: MouseEvent) => {
			tooltipNode.style.left = event.clientX + 'px';
			tooltipNode.style.top = event.clientY + 'px';
		};
		const onLeave = () => {
			tooltipNode.style.display = 'none';
		};

		node.addEventListener('mouseenter', onEnter);
		node.addEventListener('mousemove', onMove);
		node.addEventListener('mouseleave', onLeave);

		return () => {
			node.removeEventListener('mouseenter', onEnter);
			node.removeEventListener('mousemove', onMove);
			node.removeEventListener('mouseleave', onLeave);
			node.removeAttribute('aria-describedby');
			tooltipNode.remove();
		};
	};
}
