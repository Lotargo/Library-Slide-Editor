import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import { FileText, Table, Layout, Calendar, Share2, Code, Minus, Quote, CheckSquare, Check } from 'lucide-react';
import { api } from '../../api';

export default function TextBlock({ block, onUpdate, onAddNext, autoFocus }) {
    const ref = useRef(null);
    const [showMenu, setShowMenu] = useState(false);
    const [menuQuery, setMenuQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showToast, setShowToast] = useState(false);

    const menuItems = [
        { id: 'slide', label: 'Slide', icon: <FileText size={16} />, type: 'slide_wrapper', content: undefined },
        { id: 'table', label: 'Table', icon: <Table size={16} />, type: 'table', content: undefined },
        { id: 'board', label: 'Board', icon: <Layout size={16} />, type: 'board', content: undefined },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} />, type: 'calendar', content: undefined },
        { id: 'mermaid', label: 'Mermaid', icon: <Share2 size={16} />, type: 'mermaid', content: 'graph TD; A-->B;' },
        { id: 'code', label: 'Code', icon: <Code size={16} />, type: 'code', content: '' },
        { id: 'divider', label: 'Divider', icon: <Minus size={16} />, type: 'divider', content: '' },
        { id: 'quote', label: 'Quote', icon: <Quote size={16} />, type: 'quote', content: '' },
        { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} />, type: 'checklist', content: '' },
    ];

    const filteredItems = menuItems.filter(item =>
        item.label.toLowerCase().includes(menuQuery.toLowerCase()) ||
        item.id.includes(menuQuery.toLowerCase())
    );

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
            const range = document.createRange();
            range.selectNodeContents(ref.current);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }, [autoFocus]);

    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const handleInput = (e) => {
        const text = e.target.innerText;
        const trimmed = text.trim();

        if (trimmed.startsWith('/')) {
            const query = trimmed.substring(1).trim();
            if (!query.includes(' ') && !query.includes('\n')) {
                 setMenuQuery(query);
                 setShowMenu(true);
                 setSelectedIndex(0);
            } else {
                 setShowMenu(false);
            }
        } else {
            setShowMenu(false);
        }

        onUpdate({ content: e.target.innerHTML });
    };

    const executeCommand = (item) => {
        onUpdate({ type: item.type, content: item.content, children: item.type === 'slide_wrapper' ? [] : undefined });
        setShowMenu(false);
    };

    const handleKeyDown = (e) => {
        if (showMenu) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    executeCommand(filteredItems[selectedIndex]);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMenu(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAddNext();
            return;
        }

        // Handle Backtick wrapping for selection
        if (e.key === '`') {
             const selection = window.getSelection();
             if (selection.rangeCount > 0 && !selection.isCollapsed) {
                 e.preventDefault();
                 const range = selection.getRangeAt(0);
                 const selectedText = range.toString();

                 // Wrap in code tag with style and pointer cursor
                 // Changed color to blue (#2563eb)
                 const codeHtml = `<code style="color: #2563eb; background-color: rgba(0,0,0,0.05); border-radius: 3px; padding: 0 2px; font-family: monospace; cursor: pointer;">${escapeHtml(selectedText)}</code>`;
                 document.execCommand('insertHTML', false, codeHtml);
                 return;
             }
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

                 const codeMatch = textBefore.match(/`([^`]+)`$/);
                 if (codeMatch) {
                     e.preventDefault();
                     const content = codeMatch[1];
                     // Changed color to blue (#2563eb)
                     const codeHtml = `<code style="color: #2563eb; background-color: rgba(0,0,0,0.05); border-radius: 3px; padding: 0 2px; font-family: monospace; cursor: pointer;">${escapeHtml(content)}</code>`;

                     const newRange = document.createRange();
                     const start = range.startOffset - codeMatch[0].length;
                     newRange.setStart(node, start);
                     newRange.setEnd(node, range.startOffset);
                     selection.removeAllRanges();
                     selection.addRange(newRange);

                     document.execCommand('insertHTML', false, codeHtml + '&nbsp;');
                     return;
                 }
            }
        }

        if (e.key === '$') {
             const selection = window.getSelection();
             if (selection.rangeCount > 0) return;
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

                     const safeLatex = escapeHtml(latex);

                     document.execCommand('insertHTML', false,
                        `<span contenteditable="false" class="katex-render" data-latex="${safeLatex}" title="Click to Edit (Not Implemented)">${rendered}</span>&nbsp;`
                     );

                     return;
                 }
             }
        }
    };

    const replaceWithFormat = (selection, node, start, end, innerText, command) => {
        const newRange = document.createRange();
        newRange.setStart(node, start);
        newRange.setEnd(node, end);
        selection.removeAllRanges();
        selection.addRange(newRange);

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

    const handlePaste = async (e) => {
        e.preventDefault();

        // Check for images in clipboard
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                // Insert placeholder
                const placeholderId = `loading-${Date.now()}`;
                const placeholderHtml = `<span id="${placeholderId}" class="inline-flex items-center gap-1 bg-gray-100 text-gray-500 rounded px-2 py-0.5 text-xs animate-pulse">Uploading image...</span>`;
                document.execCommand('insertHTML', false, placeholderHtml);

                for (const file of files) {
                    try {
                        const data = await api.uploadFile(file);
                        const imgHtml = `<img src="${data.url}" alt="${file.name}" style="max-width: 100%; height: auto; display: block; margin: 0.5rem 0;" />`;

                        // Replace placeholder (we only support 1 placeholder for now for simplicity, or we should have tracked range)
                        // A better way is to select the placeholder by ID and replace it.
                        const placeholderEl = document.getElementById(placeholderId);
                        if (placeholderEl) {
                            placeholderEl.outerHTML = imgHtml;
                            // Trigger update
                            onUpdate({ content: ref.current.innerHTML });
                        }
                    } catch (err) {
                        console.error("Paste upload failed", err);
                         const placeholderEl = document.getElementById(placeholderId);
                         if (placeholderEl) {
                             placeholderEl.innerText = "Upload failed";
                             placeholderEl.classList.add("text-red-500");
                         }
                    }
                }
                return;
            }
        }

        const text = e.clipboardData.getData('text/plain');

        const unescapeForKatex = (str) => {
            return str
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'");
        };

        let processed = escapeHtml(text)
            .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
                const rawLatex = unescapeForKatex(latex);
                try {
                    const rendered = katex.renderToString(rawLatex, { throwOnError: false });
                    return `<span contenteditable="false" class="katex-render" data-latex="${latex}">${rendered}</span>&nbsp;`;
                } catch (err) {
                    return match;
                }
            })
            .replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^\*]+)\*/g, '<i>$1</i>')
            .replace(/_([^_]+)_/g, '<i>$1</i>')
            .replace(/~~([^~]+)~~/g, '<s>$1</s>')
            // Changed color to blue (#2563eb)
            .replace(/`([^`]+)`/g, '<code style="color: #2563eb; background-color: rgba(0,0,0,0.05); border-radius: 3px; padding: 0 2px; font-family: monospace; cursor: pointer;">$1</code>');

        document.execCommand('insertHTML', false, processed);
    };

    const handleClick = (e) => {
        if (e.target.tagName === 'CODE') {
             const text = e.target.innerText;
             navigator.clipboard.writeText(text).then(() => {
                 const originalBg = e.target.style.backgroundColor;
                 const originalTransition = e.target.style.transition;

                 e.target.style.transition = 'background-color 0.1s ease';
                 // Changed to light blue (#bfdbfe)
                 e.target.style.backgroundColor = '#bfdbfe';

                 // Show Toast
                 setShowToast(true);
                 setTimeout(() => setShowToast(false), 2000);

                 // Faster feedback (200ms)
                 setTimeout(() => {
                     e.target.style.backgroundColor = originalBg;
                     setTimeout(() => {
                        e.target.style.transition = originalTransition;
                     }, 200);
                 }, 200);
             }).catch(err => {
                 console.error("Failed to copy:", err);
             });
        }
    };

    return (
        <div className="relative">
            <div
                ref={ref}
                className="outline-none min-h-[1.5em] empty:before:content-[attr(placeholder)] empty:before:text-gray-300 py-1 leading-relaxed text-gray-800"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onClick={handleClick}
                placeholder="Type '/' for commands"
            />
            {showMenu && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-64 max-h-64 overflow-y-auto mt-1">
                    {filteredItems.map((item, index) => (
                        <button
                            key={item.id}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            onClick={() => executeCommand(item)}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <span className="text-gray-500">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {showToast && createPortal(
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                         <Check size={14} className="text-green-400" />
                         <span>Copied to clipboard</span>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
