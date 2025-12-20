import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Scissors, Copy, Presentation, AlignLeft, AlignCenter, AlignRight, AlignJustify, Ungroup } from 'lucide-react';

export default function FloatingMenu({ onConvertToSlide, onUngroup }) {
    const [position, setPosition] = useState(null);
    const [slideId, setSlideId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();

            if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
                setPosition(null);
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
                 setPosition(null);
                 return;
            }

            // Check if inside slide
            let el = range.commonAncestorContainer;
            if (el.nodeType === 3) el = el.parentElement;
            const slide = el.closest('[data-block-type="slide_wrapper"]');
            if (slide) {
                setSlideId(slide.getAttribute('data-block-id'));
            } else {
                setSlideId(null);
            }

            setPosition({
                top: rect.top + window.scrollY - 50,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        };

        document.addEventListener('selectionchange', handleSelection);

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
            onMouseDown={(e) => e.preventDefault()}
        >
             {!slideId && (
                 <button
                    onClick={onConvertToSlide}
                    className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                    title="Convert to Slide"
                 >
                    <Presentation size={18} />
                    <span className="text-xs">Slide</span>
                 </button>
             )}
             {slideId && (
                 <button
                    onClick={() => onUngroup(slideId)}
                    className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-red-600"
                    title="Ungroup Slide"
                 >
                    <Ungroup size={18} />
                    <span className="text-xs">Ungroup</span>
                 </button>
             )}

             <div className="w-px h-5 bg-gray-200 mx-1"></div>

             <button onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Bold">
                 <Bold size={18}/>
             </button>
             <button onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Italic">
                 <Italic size={18}/>
             </button>

             <div className="w-px h-5 bg-gray-200 mx-1"></div>

             <button onClick={() => handleFormat('justifyLeft')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Align Left">
                 <AlignLeft size={18}/>
             </button>
             <button onClick={() => handleFormat('justifyCenter')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Align Center">
                 <AlignCenter size={18}/>
             </button>
             <button onClick={() => handleFormat('justifyRight')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Align Right">
                 <AlignRight size={18}/>
             </button>
             <button onClick={() => handleFormat('justifyFull')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black" title="Justify">
                 <AlignJustify size={18}/>
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
