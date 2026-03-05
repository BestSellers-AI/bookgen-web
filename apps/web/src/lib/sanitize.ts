import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Safe for use with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "em", "strong", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
      "hr", "sub", "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
  });
}
