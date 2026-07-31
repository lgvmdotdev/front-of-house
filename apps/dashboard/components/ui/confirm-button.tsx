"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { useState } from "react";

/**
 * Destructive actions in this panel delete rows the AI receptionist depends on,
 * so none of them fire on a single click. Composed from the existing `Dialog`
 * rather than adding a Radix AlertDialog primitive — the only thing that buys us
 * is focusing Cancel by default, which we do explicitly below.
 */
export function ConfirmButton({
	label,
	title,
	description,
	confirmLabel,
	onConfirm,
	disabled,
}: {
	confirmLabel: string;
	description: string;
	disabled?: boolean;
	label: string;
	onConfirm: () => void;
	title: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				disabled={disabled}
				onClick={() => setOpen(true)}
				size="sm"
				type="button"
				variant="ghost"
			>
				{label}
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent role="alertdialog">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							autoFocus
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Cancelar
						</Button>
						<Button
							onClick={() => {
								setOpen(false);
								onConfirm();
							}}
							type="button"
							variant="destructive"
						>
							{confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
