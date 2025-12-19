import React, { useRef, useEffect } from 'react';

export default function TextBlock({ block, onUpdate, onAddNext }) {
    const ref = useRef(null);

    useEffect(() => {
        // Set initial content
        if (ref.current) {
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    const handleInput = (e) => {
        const text = e.target.innerText;

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

        onUpdate({ content: e.target.innerHTML });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAddNext();
        }
        // Handle Backspace to merge with previous block? (Later)
    };

    return (
        <div
            ref={ref}
            className="outline-none min-h-[1.5em] empty:before:content-[attr(placeholder)] empty:before:text-gray-300 py-1 leading-relaxed text-gray-800"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type '/'"
        />
    );
}
