/**
 * Local ESLint rule: the arcade DISPLAY font (Space Mono, via `sticker-text`,
 * `sticker-sm` or `font-mono-display`) is for short impact labels only.
 *
 * Long-form text — descriptions, helper copy, sentences — must use the readable
 * sans utilities (`ui-body`, `ui-body-tight`, `ui-prose`, `ui-title`).
 */

const DISPLAY_CLASSES = ["sticker-text", "sticker-sm", "font-mono-display"];
const READABLE = ["ui-body", "ui-body-tight", "ui-prose"];

/** Text longer than this is considered long-form. */
const MAX_DISPLAY_TEXT_LENGTH = 48;

function classesOf(value) {
  return String(value).split(/\s+/).filter(Boolean);
}

function displayClassIn(value) {
  const classes = classesOf(value);
  return DISPLAY_CLASSES.find((c) => classes.includes(c));
}

/** Collects literal JSX text children (expressions are ignored). */
function literalText(node) {
  let text = "";
  for (const child of node.children ?? []) {
    if (child.type === "JSXText") text += child.value;
    else if (child.type === "JSXElement") text += literalText(child);
  }
  return text.replace(/\s+/g, " ").trim();
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the arcade display font on long-form paragraphs and descriptions.",
    },
    schema: [],
    messages: {
      longForm:
        'Long-form text must not use the arcade display class "{{cls}}". Use ui-body, ui-body-tight or ui-prose instead ({{len}} characters of copy).',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const attr = node.attributes.find(
          (a) =>
            a.type === "JSXAttribute" &&
            (a.name.name === "className" || a.name.name === "class") &&
            a.value?.type === "Literal",
        );
        if (!attr) return;

        const value = attr.value.value;
        const cls = displayClassIn(value);
        if (!cls) return;
        if (READABLE.some((r) => classesOf(value).includes(r))) return;

        const element = node.parent;
        const text = element?.type === "JSXElement" ? literalText(element) : "";
        if (text.length > MAX_DISPLAY_TEXT_LENGTH) {
          context.report({
            node: attr,
            messageId: "longForm",
            data: { cls, len: String(text.length) },
          });
        }
      },
    };
  },
};
