import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download } from 'lucide-react';
import { api } from '../api';

export default function ContextMenu() {
    const [position, setPosition] = useState(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleContextMenu = (e) => {
             const editor = document.getElementById('editor-content-area');
             if (editor && editor.contains(e.target)) {
                 e.preventDefault();
                 setPosition({ x: e.clientX, y: e.clientY });
             } else {
                 setPosition(null);
             }
        };

        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setPosition(null);
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('scroll', () => setPosition(null));

        return () => {
             document.removeEventListener('contextmenu', handleContextMenu);
             document.removeEventListener('click', handleClick);
             document.removeEventListener('scroll', () => setPosition(null));
        };
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await api.uploadFile(file);
            insertAttachment(data.url, data.filename, file.type);
            setPosition(null);
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
        e.target.value = '';
    }

    const insertAttachment = (url, filename, mimeType) => {
        const isImage = mimeType.startsWith('image/');
        let html = '';
        if (isImage) {
             html = `<img src="${url}" alt="${filename}" style="max-width: 100%; height: auto; display: block; margin: 0.5rem 0;" />`;
        } else {
             html = `<a href="${url}" target="_blank" class="text-blue-600 underline hover:text-blue-800 mx-1 inline-flex items-center gap-1 bg-gray-50 px-1 rounded border border-gray-200" contenteditable="false"><span class="opacity-70">📄</span>${filename}</a>`;
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            document.execCommand('insertHTML', false, html);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    if (!position) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-50 bg-white shadow-xl border border-gray-200 rounded-lg py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
            style={{ top: position.y, left: position.x }}
        >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                Actions
            </div>
            <button
                onClick={triggerUpload}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <Upload size={16} />
                <span>Import File / Image</span>
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 opacity-50 cursor-not-allowed">
                <Download size={16} />
                <span>Export (Coming Soon)</span>
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .zip, .txt"
            />
        </div>,
        document.body
    );
}
