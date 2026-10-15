/** Resolves once the address bar shows the given path, or after the timeout if the route never arrives. */
export function waitForPathname(pathname: string, timeoutMs: number): Promise<void> {
  const startedAt = performance.now();
  return new Promise((resolve) => {
    function check(): void {
      if (window.location.pathname === pathname || performance.now() - startedAt > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    }
    check();
  });
}
