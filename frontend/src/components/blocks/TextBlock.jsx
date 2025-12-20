import React, { useRef, useEffect } from 'react';
import katex from 'katex';

export default function TextBlock({ block, onUpdate, onAddNext }) {
    const ref = useRef(null);

    useEffect(() => {
        // Set initial content
        if (ref.current) {
            // Check if we need to re-render math on initial load?
            // The content is HTML, so if it was saved with rendered math, it shows.
            // If it has $$..$$, we might want to process it.
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    // Helper to process LaTeX
    const processLatex = (html) => {
        // Simple regex to find $$...$$ and render it
        // Note: handling cursor position after replacement is tough in contentEditable.
        // We will do "render on demand" logic or just use replacement when triggered.
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
            // Convert to quote block OR format current block
            // Let's use Quote Block for distinct styling
            onUpdate({ type: 'quote', content: '' });
            return;
        }
        if (trimmedText === '/check' || trimmedText === '/todo') {
             onUpdate({ type: 'checklist', content: '' });
             return;
        }

        // Markdown Shortcuts logic
        // We look for patterns at the start of the block or after space.
        // Note: Doing this on `input` can disrupt cursor. We should check if the last char was a trigger.
        // For MVP, we use specific triggers.

        // This is a naive implementation. For robust MD, use a library.
        // But for "bold" via `**`, we can try to intercept.

        onUpdate({ content: e.target.innerHTML });
    };

    const handleKeyDown = (e) => {
        // Handle triggers that might happen on 'Enter' (like Headers if user didn't type space?)
        // Standard MD is space triggered. User might be confused.
        // But let's check for 'Enter' logic just in case they want to convert line on Enter.
        if (e.key === 'Enter' && !e.shiftKey) {
            // Before adding next, check if we should convert MD?
            // E.g. "# Header<Enter>" -> Convert to H1 then add new block?
            // Or just add new block.
            // If the user typed "# Header" (no space), it stays text.
            // If we want to be nice, we can check.
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                 const range = selection.getRangeAt(0);
                 const node = range.startContainer;
                 // If text content starts with #, maybe convert?
                 // But be careful not to annoy.
            }

            e.preventDefault();
            onAddNext();
            return;
        }

        if (e.key === ' ') {
            // Check for Markdown shortcuts that trigger on space
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const node = range.startContainer;

            // Only if we are in a text node
            if (node.nodeType === Node.TEXT_NODE) {
                 const textBefore = node.textContent.slice(0, range.startOffset);

                 // Header: "# "
                 // We relax the check: if text matches `#{1,6}` at start.
                 // Actually, user might type `#` then space. `textBefore` ends with `#`.
                 if (textBefore.endsWith('#')) {
                      // Check if it is the start of the line
                      const match = textBefore.match(/^#{1,6}$/);
                      if (match) {
                           const level = match[0].length;
                           e.preventDefault();
                           // Execute format
                           // H1, H2, ...
                           const tag = `H${level}`;
                           document.execCommand('formatBlock', false, tag);

                           // Remove the hashes
                           // The node text is likely just "###".
                           // We need to clear it?
                           // Actually `formatBlock` keeps content.
                           // We want to remove the hashes.
                           // `node` is the text node.
                           // `range.startOffset` is length of textBefore (which is just hashes).
                           // So we remove valid range.
                           node.textContent = node.textContent.slice(range.startOffset);
                           return;
                      }
                 }

                 // Handle Blockquote ">"
                 if (textBefore.endsWith('>')) {
                      if (textBefore.trim() === '>') {
                           e.preventDefault();
                           // formatBlock BLOCKQUOTE is standard
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

                 // LaTeX: "$$formula$$"
                 // Check if we just finished a $$ pattern?
                 // Or better, check for `$$` ... `$$` and replace?
                 // Let's look for "$$ ... $$" ending right now.
                 // This is tricky.

                 // Alternative: Check for `**bold**`
                 // Regex: /\*\*([^*]+)\*\*$/
                 const boldMatch = textBefore.match(/\*\*([^*]+)\*\*$/);
                 if (boldMatch) {
                     e.preventDefault();
                     const matchText = boldMatch[0]; // "**word**"
                     const innerText = boldMatch[1]; // "word"

                     // We need to replace matchText with bolded innerText
                     // We can select the range and execCommand 'bold'
                     const start = range.startOffset - matchText.length;
                     const end = range.startOffset;

                     const newRange = document.createRange();
                     newRange.setStart(node, start);
                     newRange.setEnd(node, end);
                     selection.removeAllRanges();
                     selection.addRange(newRange);

                     // Replace with text
                     document.execCommand('insertText', false, innerText);

                     // Re-select to apply bold
                     newRange.setStart(node, start);
                     newRange.setEnd(node, start + innerText.length);
                     selection.removeAllRanges();
                     selection.addRange(newRange);
                     document.execCommand('bold');

                     // Move cursor to end and add space
                     selection.collapseToEnd();
                     // document.execCommand('insertText', false, '\u00A0'); // nbsp
                     return;
                 }
            }
        }

        // LaTeX Handling on specific key (e.g. '$') or just on Space?
        // User wants `$$...$$`.
        // If they type the second `$`, we could check.
        if (e.key === '$') {
             // Check if we are closing a block?
             const selection = window.getSelection();
             if (!selection.rangeCount) return;
             const range = selection.getRangeAt(0);
             const node = range.startContainer;
             if (node.nodeType === Node.TEXT_NODE) {
                 const textBefore = node.textContent.slice(0, range.startOffset);
                 // Check for `$$...$` (since we are about to add the last $)
                 // Also handle case where user pastes `$$...$$`? No, pasting is separate.
                 // This handles typing the CLOSING `$` of `$$formula$$`.
                 // Regex: look for `$$` followed by anything not `$` followed by `$` (last char before cursor).
                 // Actually, textBefore includes the first `$` of the closing pair?
                 // No, we haven't typed the last `$` yet. `textBefore` ends with `$`.
                 // So we have `$$formula$`. We type `$`.
                 const match = textBefore.match(/\$\$([^\$]+)\$$/);
                 if (match) {
                     e.preventDefault(); // Prevent inserting the last $ normally
                     const latex = match[1];

                     // Render LaTeX
                     let rendered = '';
                     try {
                         rendered = katex.renderToString(latex, { throwOnError: false });
                     } catch (err) {
                         rendered = `<span style="color:red">Error: ${err.message}</span>`;
                     }

                     // Replace `$$...$` + (implied last $) with rendered HTML
                     const matchLength = match[0].length; // "$$formula$"
                     const start = range.startOffset - matchLength;

                     const newRange = document.createRange();
                     newRange.setStart(node, start);
                     newRange.setEnd(node, range.startOffset);
                     selection.removeAllRanges();
                     selection.addRange(newRange);

                     // Insert HTML
                     document.execCommand('insertHTML', false,
                        `<span contenteditable="false" class="katex-render" data-latex="${latex}" title="Click to Edit (Not Implemented)">${rendered}</span>&nbsp;`
                     );

                     return;
                 }
             }
        }
    };

    // Also handle pasting or loose text that might contain markdown/latex
    // We can do this on Blur or on Input (debounced).
    // For MVP, let's just make sure "Space" works robustly.
    // The user issue "not rendering on the fly" might mean they expect pasting to work.
    // Let's add a check on Input to detect `$$...$$` if the user finished typing it without us catching it?
    // Or if they paste it.
    // But `handleInput` is messy.

    return (
        <div
            ref={ref}
            className="outline-none min-h-[1.5em] empty:before:content-[attr(placeholder)] empty:before:text-gray-300 py-1 leading-relaxed text-gray-800"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands"
        />
    );
}
