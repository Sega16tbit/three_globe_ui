import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	// DrawerDescription,
	DrawerFooter,
	// DrawerHeader,
	// DrawerTitle,
	// DrawerTrigger,
} from "@/components/ui/drawer";
import type { ReactNode } from "react";
import { useLocation, useRoute } from "wouter";

type Props = {
	children: ReactNode;
};

export function CountryDrawer({ children }: Props) {
	const [location, navigate] = useLocation();
	const [match] = useRoute("/.+");
	// const regex = /^\/.+/;

	return (
		<Drawer
			direction="bottom"
			open={match}
			// open={regex.test(location)}
			onOpenChange={(value) => (value ? null : navigate(`/`))}
		>
			<DrawerContent className="max-w-md mx-auto sm:mb-10 sm:p-2 sm:before:inset-0">
				{/* <DrawerHeader>
					<DrawerTitle>{location}</DrawerTitle>
				</DrawerHeader> */}
				<div className="no-scrollbar overflow-y-auto px-4">{children}</div>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Cancel</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
