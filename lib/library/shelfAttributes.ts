// The attributes on <html> that say which home page shows and what the
// library is doing, shared by the inline boot script, the CSS and the code.

/** "scene" for the WebGL library, "flat" for the HTML bookcase. */
export const SHELF_VIEW_ATTRIBUTE = "data-shelf";
/** Set while the home page is the one in view. */
export const AT_LIBRARY_ATTRIBUTE = "data-at-library";
/** Set once the library has drawn, which fades its canvas up. */
export const SCENE_READY_ATTRIBUTE = "data-scene-ready";
/** A book is being taken off the shelf: the page's own text steps back. */
export const TAKING_ATTRIBUTE = "data-library-taking";
/** Its page is loading underneath: the library is raised over everything until it fades. */
export const TRANSIT_ATTRIBUTE = "data-library-transit";
export const LEAVING_ATTRIBUTE = "data-library-leaving";

export const SHELF_VIEW_STORAGE_KEY = "library:shelf";
/** If the library has not drawn by then on a hard load of the home page, the flat bookcase shows, even if no script ever runs. */
const BOOT_FALLBACK_MS = 12_000;

// Runs in <head> before the first paint: a returning reader whose device runs
// the library sees the dark room straight away instead of the flat bookcase
// flashing first. Without a remembered choice the flat bookcase shows.
export const SHELF_BOOT_SCRIPT = `(function(){
var root=document.documentElement,shelf=null;
try{shelf=localStorage.getItem("${SHELF_VIEW_STORAGE_KEY}")}catch(error){}
if(shelf==="scene"||shelf==="flat")root.setAttribute("${SHELF_VIEW_ATTRIBUTE}",shelf);
if(location.pathname!=="/")return;
root.setAttribute("${AT_LIBRARY_ATTRIBUTE}","");
if(shelf==="scene")setTimeout(function(){if(root.getAttribute("${SHELF_VIEW_ATTRIBUTE}")==="scene"&&!root.hasAttribute("${SCENE_READY_ATTRIBUTE}"))root.setAttribute("${SHELF_VIEW_ATTRIBUTE}","flat")},${BOOT_FALLBACK_MS});
})();`;
