import type { PortalPageMeta } from "@arcade/shared";

export function updatePortalMeta(meta: PortalPageMeta): void {
  document.title = meta.title;
  const set = (name: string, content: string): void => {
    let element = document.querySelector(`meta[name="${name}"]`);
    if (!element) { element = document.createElement("meta"); element.setAttribute("name", name); document.head.appendChild(element); }
    element.setAttribute("content", content);
  };
  set("description", meta.description);
  set("robots", meta.robots ?? "index,follow");
  let canonical = document.querySelector<HTMLLinkElement>("link[rel=canonical]");
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
  canonical.href = meta.canonical ?? window.location.href;
}
