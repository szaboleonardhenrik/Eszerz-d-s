import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1","h2","h3","h4","h5","h6","p","br","hr","ul","ol","li",
      "strong","em","u","s","b","i","a","span","div","blockquote",
      "table","thead","tbody","tr","th","td","img","sub","sup",
      "pre","code",
    ],
    ALLOWED_ATTR: [
      "href","target","rel","src","alt","width","height",
      "style","class","colspan","rowspan","align",
    ],
    ALLOW_DATA_ATTR: false,
  });
}
