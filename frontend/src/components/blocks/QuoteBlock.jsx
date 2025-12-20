import React, { useRef, useEffect } from 'react';

export default function QuoteBlock({ block, onUpdate, onAddNext }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    const handleInput = (e) => {
        onUpdate({ content: e.target.innerHTML });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAddNext();
        }
    };

    return (
        <div className="flex gap-3 my-2 text-gray-700">
            <div className="w-1 bg-gray-300 rounded-full shrink-0"></div>
            <div
                ref={ref}
                className="outline-none flex-grow italic text-lg leading-relaxed empty:before:content-['Empty_quote...'] empty:before:text-gray-300"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
}
