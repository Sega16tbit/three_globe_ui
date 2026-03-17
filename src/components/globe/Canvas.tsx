import { useCallback } from "react";
import { mount } from "./3d";

export default function Canvas() {
	const containerRef = useCallback(mount, []);
	return (
		<div
			className="pointer-events-auto block h-full w-full touch-auto select-none"
			ref={containerRef}
		></div>
	);
}
