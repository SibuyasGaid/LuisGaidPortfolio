"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ShelfLink } from "@/components/library/ShelfLink";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { BOOKS, LIBRARY, type BookId } from "@/content/portfolio";
import { getBook, getBookHref } from "@/lib/books";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly detail: string;
  readonly bookId: BookId | null;
}

const LIBRARY_ITEM: NavItem = { href: "/", label: LIBRARY.navLabel, detail: "The shelf", bookId: null };
const BOOK_ITEMS: readonly NavItem[] = BOOKS.filter((book) => book.id !== "contact").map((book) => ({
  href: getBookHref(book.id),
  label: book.navLabel,
  detail: book.kind,
  bookId: book.id,
}));
const CONTACT_BOOK = getBook("contact");
const CONTACT_ITEM: NavItem = {
  href: getBookHref(CONTACT_BOOK.id),
  label: CONTACT_BOOK.navLabel,
  detail: CONTACT_BOOK.kind,
  bookId: CONTACT_BOOK.id,
};
const MENU_ITEMS: readonly NavItem[] = [LIBRARY_ITEM, ...BOOK_ITEMS, CONTACT_ITEM];

// Closes the small-screen menu on Escape (returning focus to its button) or on
// a click anywhere outside it. Without JavaScript it is a plain disclosure.
function closeMenuOnDismiss(menu: HTMLDetailsElement): () => void {
  function closeOnEscape(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !menu.open) return;
    menu.open = false;
    menu.querySelector("summary")?.focus();
  }
  function closeOnOutsideClick(event: MouseEvent): void {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  }
  document.addEventListener("keydown", closeOnEscape);
  document.addEventListener("click", closeOnOutsideClick);
  return () => {
    document.removeEventListener("keydown", closeOnEscape);
    document.removeEventListener("click", closeOnOutsideClick);
  };
}

// A book chosen from the small-screen menu comes off the shelf behind it, so the menu gets out of the way first.
function closeMenu(): void {
  const menu = document.querySelector<HTMLDetailsElement>("[data-site-menu]");
  if (menu) menu.open = false;
}

export function SiteNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    if (!menuRef.current) return;
    return closeMenuOnDismiss(menuRef.current);
  }, []);

  const currentFor = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <nav aria-label="Main" className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
      <ul className="hidden items-center gap-1 lg:flex">
        {[LIBRARY_ITEM, ...BOOK_ITEMS].map((item) => (
          <li key={item.href}>
            <ShelfLink href={item.href} bookId={item.bookId} aria-current={currentFor(item.href)} className="site-nav-link">
              {item.label}
            </ShelfLink>
          </li>
        ))}
      </ul>
      <SoundToggle className="sound-toggle" />
      <ShelfLink href={CONTACT_ITEM.href} bookId={CONTACT_ITEM.bookId} aria-current={currentFor(CONTACT_ITEM.href)} className="site-nav-cta">
        {CONTACT_ITEM.label}
      </ShelfLink>

      <details ref={menuRef} data-site-menu className="site-menu lg:hidden">
        <summary className="site-menu-button">
          Menu
          <span aria-hidden="true" className="site-menu-icon" />
        </summary>
        <div className="site-menu-panel">
          <ul>
            {MENU_ITEMS.map((item) => (
              <li key={item.href}>
                <ShelfLink
                  href={item.href}
                  bookId={item.bookId}
                  onMoveStart={closeMenu}
                  aria-current={currentFor(item.href)}
                  data-book={item.bookId ?? undefined}
                  className="site-menu-link"
                >
                  <span aria-hidden="true" className={item.bookId ? "site-menu-swatch" : "site-menu-swatch is-library"} />
                  <span className="font-display text-[1.45rem] leading-none">{item.label}</span>
                  <span className="eyebrow ml-auto text-smoke">{item.detail}</span>
                </ShelfLink>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </nav>
  );
}
