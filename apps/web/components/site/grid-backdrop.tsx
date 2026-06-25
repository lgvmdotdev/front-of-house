/**
 * Atmospheric backdrop for the page. Renders a faint grid masked to the center
 * of the viewport so it never competes with the foreground typography, plus a
 * tiny noise overlay for grain. Pure CSS, no JS.
 */
export function GridBackdrop() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
		>
			<div className="mask-radial-fade absolute inset-0 bg-grid opacity-50" />
			<div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay" />
		</div>
	);
}
