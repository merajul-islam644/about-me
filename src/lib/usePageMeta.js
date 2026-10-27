import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Per-route page metadata for the SPA: the tab title, the meta description
// and the social-share tags follow whatever page is on screen. index.html
// only covers the first paint and the very first URL — everything after a
// client-side navigation is this hook's job, so a shared deep link previews
// as the page it opens.

const ensureMeta = (key, attribute) => {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  return tag;
};

// Rich-text fields carry **accent markers** that mean nothing to a search
// snippet — strip them, collapse the whitespace, cap the length on a word
// boundary.
export const metaText = (text, cap = 158) => {
  const clean = String(text ?? "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= cap) return clean;
  return `${clean.slice(0, cap - 1).replace(/\s+\S*$/, "")}…`;
};

export const usePageMeta = ({ title, description }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (title) document.title = title;
    // The share tags mirror the tab pair — a preview that disagrees with
    // the page it opens reads as a broken link.
    if (title) ensureMeta("og:title", "property").setAttribute("content", title);
    if (description) {
      ensureMeta("description", "name").setAttribute("content", description);
      ensureMeta("og:description", "property").setAttribute(
        "content",
        description
      );
    }
    ensureMeta("og:url", "property").setAttribute(
      "content",
      window.location.origin + pathname
    );
  }, [title, description, pathname]);
};
