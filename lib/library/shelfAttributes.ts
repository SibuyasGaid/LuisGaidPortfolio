// The attributes on <html> that say which home page shows and what the
// library is doing, shared by the inline boot script, the CSS and the code.

/** "scene" where the WebGL library runs, "flat" where the poster of it is the shelf. */
export const SHELF_VIEW_ATTRIBUTE = "data-shelf";
/** Set while the home page is the one in view. */
export const AT_LIBRARY_ATTRIBUTE = "data-at-library";
/** Set once the library has drawn, which fades its canvas up. */
export const SCENE_READY_ATTRIBUTE = "data-scene-ready";
/** A book is being taken off the shelf: the page's own text steps back. */
export const TAKING_ATTRIBUTE = "data-library-taking";
/** A book is between the shelf and its page: the library is raised over the page (under the navbar). */
export const TRANSIT_ATTRIBUTE = "data-library-transit";
/** Back on the shelf after a book was put away: the heading rises into place again. */
export const SETTLING_ATTRIBUTE = "data-library-settling";

// Runs in <head> before the first paint, so the library's layer is ready on
// the home page from the start.
export const SHELF_BOOT_SCRIPT = `if(location.pathname==="/")document.documentElement.setAttribute("${AT_LIBRARY_ATTRIBUTE}","");`;
