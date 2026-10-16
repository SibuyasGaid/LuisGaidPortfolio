"use client";

import { useEffect } from "react";

const DIALOG_COMMANDS: Record<string, (dialog: HTMLDialogElement) => void> = {
  "show-modal": (dialog) => {
    if (!dialog.open) dialog.showModal();
  },
  close: (dialog) => dialog.close(),
};

/** Runs a button's invoker command on its dialog, for browsers that don't. */
function runInvokerCommand(target: Element): void {
  const button = target.closest("button[commandfor]");
  const dialog = button ? document.getElementById(button.getAttribute("commandfor") ?? "") : null;
  const runCommand = DIALOG_COMMANDS[button?.getAttribute("command") ?? ""];
  if (dialog instanceof HTMLDialogElement && runCommand) runCommand(dialog);
}

/** Closes a project dialog on a click on its backdrop, which lands on the dialog itself but outside its box. */
function closeOnBackdropClick(event: MouseEvent): void {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open || !dialog.classList.contains("project-dialog")) return;
  const box = dialog.getBoundingClientRect();
  const isInsideBox =
    event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  if (!isInsideBox) dialog.close();
}

// The project dialogs open and close with HTML invoker commands and close on a
// backdrop click with closedby="any". Older browsers have neither, so this
// does both for them, and nothing at all where they're built in.
export function ProjectDialogFallback() {
  useEffect(() => {
    const isInvokerSupported = "commandForElement" in HTMLButtonElement.prototype;
    const isLightDismissSupported = "closedBy" in HTMLDialogElement.prototype;
    if (isInvokerSupported && isLightDismissSupported) return;

    function handleClick(event: MouseEvent): void {
      if (!isInvokerSupported && event.target instanceof Element) runInvokerCommand(event.target);
      if (!isLightDismissSupported) closeOnBackdropClick(event);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
