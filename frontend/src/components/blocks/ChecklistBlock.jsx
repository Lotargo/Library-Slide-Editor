import React, { useRef, useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

export default function ChecklistBlock({ block, onUpdate, onAddNext }) {
    const ref = useRef(null);
    const [checked, setChecked] = useState(block.checked || false);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = block.content || '';
        }
    }, []);

    const toggleCheck = () => {
        const newChecked = !checked;
        setChecked(newChecked);
        onUpdate({ checked: newChecked });
    };

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
        <div className="flex items-start gap-3 my-1 group">
            <button
                onClick={toggleCheck}
                className={`mt-1 text-gray-400 hover:text-blue-500 transition-colors ${checked ? 'text-blue-500' : ''}`}
                contentEditable={false}
            >
                {checked ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <div
                ref={ref}
                className={`outline-none flex-grow leading-relaxed ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="To-do item"
            />
        </div>
    );
}
