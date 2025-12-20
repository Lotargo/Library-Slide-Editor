import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Scissors, Copy, Presentation, AlignLeft, AlignCenter, AlignRight, AlignJustify, Upload } from 'lucide-react';
import { api } from '../api';

export default function FloatingMenu({ onConvertToSlide }) {
    const [position, setPosition] = useState(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);
    const savedRange = useRef(null);

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();

            // Hide if no selection or collapsed
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

    const triggerFileUpload = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedRange.current = selection.getRangeAt(0);
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await api.uploadFile(file);

            // Restore selection
            if (savedRange.current) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedRange.current);
            }

            const isImage = file.type.startsWith('image/');
            let html = '';
            if (isImage) {
                 html = `<img src="${data.url}" alt="${data.filename}" style="max-width: 100%; height: auto; display: inline-block;" />`;
            } else {
                 // Insert a link. We wrap the selection or insert at selection?
                 // insertHTML replaces selection with HTML.
                 // So if I selected "text", it gets replaced by the link.
                 // If I want to KEEP the text as the link text?
                 // If I uploaded a file, usually the file HAS a name.
                 // If I select "Here is the report" and upload "report.pdf".
                 // Do I want <a href...>report.pdf</a> or <a href...>Here is the report</a>?
                 // User said: "others will be as attached objects in text".
                 // Usually implies an object with filename.
                 // So I will use filename.
                 html = `<a href="${data.url}" target="_blank" class="text-blue-600 underline hover:text-blue-800 mx-1" contenteditable="false">${data.filename}</a>`;
            }

            document.execCommand('insertHTML', false, html);
            setPosition(null);
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }

        e.target.value = '';
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

             <div className="w-px h-5 bg-gray-200 mx-1"></div>

             <button onClick={triggerFileUpload} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600" title="Import Attachment">
                 <Upload size={18}/>
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>,
        document.body
    );
}
