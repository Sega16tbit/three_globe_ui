import { useCallback } from "react";
import { mount } from "./3d";
import "./index.css";

export default function Globe() {
	const containerRef = useCallback(mount, []);
	return <div className="Globe-container" ref={containerRef}></div>;
}
