import React, { useRef, useEffect } from 'react';
import katex from 'katex';

export default function TextBlock({ block, onUpdate, onAddNext }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    // Helper to escape HTML special characters
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Helper to process LaTeX
    const processLatex = (html) => {
        return html;
    };

    const handleInput = (e) => {
        let content = e.target.innerHTML;
        const text = e.target.innerText; // Plain text for commands
        const trimmedText = text.trim();

        // Simple Slash Commands (MVP)
        if (trimmedText === '/slide') {
            onUpdate({ type: 'slide_wrapper', children: [], content: undefined });
            return;
        }
        if (trimmedText === '/table') {
            onUpdate({ type: 'table', content: undefined });
            return;
        }
        if (trimmedText === '/board') {
            onUpdate({ type: 'board', content: undefined });
            return;
        }
        if (trimmedText === '/calendar') {
            onUpdate({ type: 'calendar', content: undefined });
            return;
        }
        if (trimmedText === '/mermaid') {
             onUpdate({ type: 'mermaid', content: 'graph TD; A-->B;' });
             return;
        }
        if (trimmedText === '/code') {
             onUpdate({ type: 'code', content: '' });
             return;
        }
        if (trimmedText === '/divider') {
             onUpdate({ type: 'divider', content: '' });
             return;
        }
        if (trimmedText === '/quote') {
            onUpdate({ type: 'quote', content: '' });
            return;
        }
        if (trimmedText === '/check' || trimmedText === '/todo') {
             onUpdate({ type: 'checklist', content: '' });
             return;
        }

        onUpdate({ content: e.target.innerHTML });
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');

        let processed = escapeHtml(text)
            .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
                // Note: latex here is already escaped by escapeHtml above.
                // We need unescaped latex for renderToString?
                // Yes. katex expects raw latex.
                // But we escaped it first!
                // We should unescape it for katex, or change order.
                // Changing order is better.
                return match;
            });

        // Redoing logic:
        // We want to process patterns on the RAW text, then escape the REST.
        // But replacing patterns is easier on raw text.
        // If we replace `**bold**` -> `<b>bold</b>`, we want `bold` to be escaped?
        // Yes.

        // Let's use a tokenizer approach or simpler: replace with callbacks that escape content.

        processed = text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
             // 1. LaTeX $$...$$
            .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
                // `latex` here is HTML-escaped because we did replace above.
                // We need to unescape for KaTeX?
                // Example: text is `$$a < b$$`.
                // Escaped: `$$a &lt; b$$`.
                // match is `$$a &lt; b$$`. latex is `a &lt; b`.
                // KaTeX might choke on `&lt;`.

                // Better approach: Don't escape everything first.
                // Escape only parts that are NOT replaced.
                // Or: match patterns on raw text, capture content, escape content, render.

                // But we must prevent XSS in the text that is NOT a pattern.
                return match;
            });

        // Correct approach:
        // 1. Split text by patterns? Hard.
        // 2. Escape everything.
        // 3. Unescape patterns?

        // Let's try:
        // iterate over regex matches.
        // But JS regex replace is good.

        // Let's go back to basics.
        // We can match patterns in raw text.
        // For each match, we process it.
        // For non-matches, we escape.
        // But `replace` string logic is sequential.

        // Helper to unescape just for KaTeX?
        const unescapeHtml = (html) => {
             const doc = new DOMParser().parseFromString(html, "text/html");
             return doc.documentElement.textContent;
        }

        // But `DOMParser` might not be available or slow? It is available in browser.
        // But let's stick to string manip if possible.

        // Let's restart the handlePaste logic to be clean and safe.
        // We will execute replacements on the escaped text?
        // If user types `**<script>**`, we want `<b>&lt;script&gt;</b>`.
        // So:
        // 1. Escape HTML. `**<script>**` -> `**&lt;script&gt;**`.
        // 2. Run regex. `\*\*([^\*]+)\*\*`.
        // It matches `&lt;script&gt;`.
        // We wrap it in `<b>`. Result: `<b>&lt;script&gt;</b>`.
        // This renders as bold text "<script>". Safe.

        // Problem: LaTeX `$$a < b$$` -> `$$a &lt; b$$`.
        // KaTeX needs `a < b`.
        // We need to unescape the content passed to KaTeX.
        // `a &lt; b` -> `a < b`.
        // Simple string replace for the entities we just added.

        const unescapeForKatex = (str) => {
            return str
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&") // Last to avoid double decoding
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'");
        };

        processed = escapeHtml(text)
            .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
                const rawLatex = unescapeForKatex(latex);
                try {
                    const rendered = katex.renderToString(rawLatex, { throwOnError: false });
                    // We need `data-latex` to handle XSS. `latex` variable here is the ESCAPED version (from step 1).
                    // So `latex` is `a &lt; b`.
                    // data-latex="a &lt; b" is safe.
                    // If raw was `"` -> escaped `&quot;`. data-latex="&quot;" is safe.
                    return `<span contenteditable="false" class="katex-render" data-latex="${latex}">${rendered}</span>&nbsp;`;
                } catch (err) {
                    return match;
                }
            })
            .replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^\*]+)\*/g, '<i>$1</i>')
            .replace(/_([^_]+)_/g, '<i>$1</i>')
            .replace(/~~([^~]+)~~/g, '<s>$1</s>');

        document.execCommand('insertHTML', false, processed);
    };

    const replaceWithFormat = (selection, node, start, end, innerText, command) => {
        const newRange = document.createRange();
        newRange.setStart(node, start);
        newRange.setEnd(node, end);
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Replace with text
        document.execCommand('insertText', false, innerText);

        const anchorNode = selection.anchorNode;
        const anchorOffset = selection.anchorOffset;

        if (!anchorNode) return;

        const reSelectRange = document.createRange();
        const newStart = Math.max(0, anchorOffset - innerText.length);
        reSelectRange.setStart(anchorNode, newStart);
        reSelectRange.setEnd(anchorNode, anchorOffset);

        selection.removeAllRanges();
        selection.addRange(reSelectRange);

        document.execCommand(command);
        selection.collapseToEnd();
        document.execCommand('insertText', false, '\u00A0');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAddNext();
            return;
        }

        if (e.key === ' ') {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const node = range.startContainer;

            if (node.nodeType === Node.TEXT_NODE) {
                 const textBefore = node.textContent.slice(0, range.startOffset);

                 if (textBefore.endsWith('#')) {
                      const match = textBefore.match(/^#{1,6}$/);
                      if (match) {
                           const level = match[0].length;
                           e.preventDefault();
                           const tag = `H${level}`;
                           document.execCommand('formatBlock', false, tag);
                           node.textContent = node.textContent.slice(range.startOffset);
                           return;
                      }
                 }

                 if (textBefore.endsWith('>')) {
                      if (textBefore.trim() === '>') {
                           e.preventDefault();
                           document.execCommand('formatBlock', false, 'BLOCKQUOTE');
                           node.textContent = node.textContent.slice(0, range.startOffset - 1) + node.textContent.slice(range.startOffset);
                           return;
                      }
                      if (textBefore.trim() === '-') {
                           e.preventDefault();
                           document.execCommand('insertUnorderedList');
                           node.textContent = node.textContent.slice(0, range.startOffset - 1) + node.textContent.slice(range.startOffset);
                           return;
                      }
                 }

                 const boldMatch = textBefore.match(/\*\*([^*]+)\*\*$/);
                 if (boldMatch) {
                     e.preventDefault();
                     replaceWithFormat(selection, node, range.startOffset - boldMatch[0].length, range.startOffset, boldMatch[1], 'bold');
                     return;
                 }

                 const strikeMatch = textBefore.match(/~~([^~]+)~~$/);
                 if (strikeMatch) {
                     e.preventDefault();
                     replaceWithFormat(selection, node, range.startOffset - strikeMatch[0].length, range.startOffset, strikeMatch[1], 'strikeThrough');
                     return;
                 }

                 const italicMatch = textBefore.match(/(?<!\*)\*([^*]+)\*$/);
                 if (italicMatch) {
                     e.preventDefault();
                     replaceWithFormat(selection, node, range.startOffset - italicMatch[0].length, range.startOffset, italicMatch[1], 'italic');
                     return;
                 }

                 const italicMatchUnderscore = textBefore.match(/_([^_]+)_$/);
                 if (italicMatchUnderscore) {
                     e.preventDefault();
                     replaceWithFormat(selection, node, range.startOffset - italicMatchUnderscore[0].length, range.startOffset, italicMatchUnderscore[1], 'italic');
                     return;
                 }
            }
        }

        if (e.key === '$') {
             const selection = window.getSelection();
             if (!selection.rangeCount) return;
             const range = selection.getRangeAt(0);
             const node = range.startContainer;
             if (node.nodeType === Node.TEXT_NODE) {
                 const textBefore = node.textContent.slice(0, range.startOffset);
                 const match = textBefore.match(/\$\$([^\$]+)\$$/);
                 if (match) {
                     e.preventDefault();
                     const latex = match[1];
                     let rendered = '';
                     try {
                         rendered = katex.renderToString(latex, { throwOnError: false });
                     } catch (err) {
                         rendered = `<span style="color:red">Error: ${err.message}</span>`;
                     }

                     const matchLength = match[0].length;
                     const start = range.startOffset - matchLength;

                     const newRange = document.createRange();
                     newRange.setStart(node, start);
                     newRange.setEnd(node, range.startOffset);
                     selection.removeAllRanges();
                     selection.addRange(newRange);

                     // Handle XSS: latex variable is raw input. Escape it for attribute.
                     const safeLatex = escapeHtml(latex);

                     document.execCommand('insertHTML', false,
                        `<span contenteditable="false" class="katex-render" data-latex="${safeLatex}" title="Click to Edit (Not Implemented)">${rendered}</span>&nbsp;`
                     );

                     return;
                 }
             }
        }
    };

    return (
        <div
            ref={ref}
            className="outline-none min-h-[1.5em] empty:before:content-[attr(placeholder)] empty:before:text-gray-300 py-1 leading-relaxed text-gray-800"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type '/' for commands"
        />
    );
}
