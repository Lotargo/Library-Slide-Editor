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

        // Simple Slash Commands (MVP)
        if (text === '/slide') {
            onUpdate({ type: 'slide_wrapper', children: [], content: undefined });
            return;
        }
        if (text === '/table') {
            onUpdate({ type: 'table', content: undefined });
            return;
        }
        if (text === '/board') {
            onUpdate({ type: 'board', content: undefined });
            return;
        }
        if (text === '/calendar') {
            onUpdate({ type: 'calendar', content: undefined });
            return;
        }
        if (text === '/mermaid') {
             onUpdate({ type: 'mermaid', content: 'graph TD; A-->B;' });
             return;
        }
        if (text === '/code') {
             onUpdate({ type: 'code', content: '' });
             return;
        }
        if (text === '/divider') {
             onUpdate({ type: 'divider', content: '' });
             return;
        }
        if (text === '/quote') {
            // Convert to quote block OR format current block
            // Let's use Quote Block for distinct styling
            onUpdate({ type: 'quote', content: '' });
            return;
        }
        if (text === '/check' || text === '/todo') {
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
        if (e.key === 'Enter' && !e.shiftKey) {
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
                 if (textBefore.endsWith('#')) {
                      // Check if it is the start of the line
                      // This is complex with contentEditable.
                      // Let's assume if the text is JUST "#", we format.
                      if (textBefore.trim() === '#') {
                           e.preventDefault();
                           document.execCommand('formatBlock', false, 'H1');
                           // Remove the #
                           // Exec command usually wraps.
                           // We need to delete the "#" text.
                           node.textContent = node.textContent.slice(0, range.startOffset - 1) + node.textContent.slice(range.startOffset);
                           return;
                      }
                       if (textBefore.trim() === '##') {
                           e.preventDefault();
                           document.execCommand('formatBlock', false, 'H2');
                           node.textContent = node.textContent.slice(0, range.startOffset - 2) + node.textContent.slice(range.startOffset);
                           return;
                      }
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
