import { escapeHtml } from './escapeHtml.js';

// Supported formatting (everything else is shown as typed):
//   *word* or **word**  -> bold
//   _word_              -> italic
//   # Heading           -> large heading     (own line)
//   ## Heading          -> smaller heading   (own line)
// Marks must hug the text, so "2 * 3 * 4" and snake_case_words are left alone.
// Input is escaped first, so this is safe for user-written text.
function formatInline(escaped) {
  return escaped
    .replace(/\*\*(\S(?:[^*\n]*\S)?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(\S(?:[^*\n]*\S)?)\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])_(\S(?:[^_\n]*\S)?)_(?!\w)/g, '$1<em>$2</em>');
}

const HEADING = /^(#{1,2})[ \t]+(\S.*)$/;

function renderLines(lines) {
  const out = [];
  let para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(l => formatInline(escapeHtml(l))).join('<br>')}</p>`);
    para = [];
  };
  for (const line of lines) {
    const h = line.match(HEADING);
    if (h) {
      flush();
      const tag = h[1].length === 1 ? 'h3' : 'h4';
      out.push(`<${tag}>${formatInline(escapeHtml(h[2].trim()))}</${tag}>`);
    } else {
      para.push(line);
    }
  }
  flush();
  return out.join('');
}

/** Turn plain written text into HTML (blank line = new paragraph) with bold, italic and heading support. */
export function renderParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .filter(p => p.trim())
    .map(p => renderLines(p.split('\n')))
    .join('');
}
