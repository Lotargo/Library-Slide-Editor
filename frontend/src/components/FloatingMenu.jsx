import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Scissors, Copy, Presentation } from 'lucide-react';

export default function FloatingMenu({ onConvertToSlide }) {
    const [position, setPosition] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();

            // Hide if no selection or collapsed
            if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
                setPosition(null);
                return;
            }

            // Simple check: Ensure we are inside the editor
            // const anchorNode = selection.anchorNode;
            // const editorElement = document.getElementById('editor-content-area');
            // For now, relying on valid selection in the document.

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
                 setPosition(null);
                 return;
            }

            setPosition({
                top: rect.top + window.scrollY - 50,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        };

        document.addEventListener('selectionchange', handleSelection);
        // Also handle scroll to update position? Or close?
        // document.addEventListener('scroll', handleSelection, true);

        return () => {
            document.removeEventListener('selectionchange', handleSelection);
        };
    }, []);

    const handleFormat = (cmd) => {
        document.execCommand(cmd, false, null);
    };

    if (!position) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-1.5 flex items-center gap-1 animate-in fade-in zoom-in duration-200"
            style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection/focus
        >
             <button
                onClick={onConvertToSlide}
                className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                title="Convert to Slide"
             >
                <Presentation size={18} />
                <span className="text-xs">Slide</span>
             </button>
             <div className="w-px h-5 bg-gray-200 mx-1"></div>
             <button onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Bold">
                 <Bold size={18}/>
             </button>
             <button onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Italic">
                 <Italic size={18}/>
             </button>
             <div className="w-px h-5 bg-gray-200 mx-1"></div>
             <button onClick={() => handleFormat('cut')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Cut">
                 <Scissors size={18}/>
             </button>
             <button onClick={() => handleFormat('copy')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Copy">
                 <Copy size={18}/>
             </button>
        </div>,
        document.body
    );
}
