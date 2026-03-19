import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useRoute } from "wouter";

export function TransitionContainer({
	children,
	className,
}: {
	children: ReactNode;
	className: string;
}) {
	const [match] = useRoute("/.+");
	return (
		<div
			className={cn(
				`grid ${match ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} transition-[grid-template-rows] duration-600 ease-in-out`,
				className
			)}
		>
			<div className="overflow-hidden">{children}</div>
		</div>
	);
}
