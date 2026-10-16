import "react";

// HTML invoker commands, which let a button open or close a dialog with no
// script. React passes the attributes through, but its types don't name them yet.
declare module "react" {
  // A merged declaration has to repeat React's type parameter, used or not.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ButtonHTMLAttributes<T> {
    /** The id of the element the button's command acts on. */
    commandfor?: string | undefined;
    command?: "show-modal" | "close" | "request-close" | "show-popover" | "hide-popover" | "toggle-popover" | undefined;
  }
}
