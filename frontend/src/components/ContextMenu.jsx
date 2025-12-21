import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download, Image as ImageIcon, Maximize, Minimize, ClipboardPaste, Trash2, Save, Scissors, Copy, Copy as CopyBlock } from 'lucide-react';
import { api } from '../api';
import { exportSlideToPng, exportCanvasToPng, exportToPdf } from '../utils/exportHelper';

export default function ContextMenu({ onMoveToSlide, onExtractFromSlide }) {
    const [position, setPosition] = useState(null);
    const [targetSlideId, setTargetSlideId] = useState(null);
    const [targetBlockId, setTargetBlockId] = useState(null);
    const [isInsideSlide, setIsInsideSlide] = useState(false);

    // New state for extended actions
    const [canSaveAs, setCanSaveAs] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [canCopyCut, setCanCopyCut] = useState(false);

    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleContextMenu = (e) => {
             const editor = document.getElementById('editor-content-area');
             if (editor && editor.contains(e.target)) {
                 e.preventDefault();

                 // Detect clicked block
                 const blockEl = e.target.closest('[data-block-id]');
                 const blockId = blockEl ? blockEl.getAttribute('data-block-id') : null;

                 // Detect if inside a slide
                 const slideEl = e.target.closest('[data-block-type="slide_wrapper"]');
                 const slideId = slideEl ? slideEl.getAttribute('data-block-id') : null;

                 setTargetBlockId(blockId);
                 setTargetSlideId(slideId);

                 // Inside slide check
                 if (slideId && blockId && slideId !== blockId) {
                     setIsInsideSlide(true);
                 } else {
                     setIsInsideSlide(false);
                 }

                 // --- Detection for extended actions ---

                 // 1. Check for Image (Save As)
                 if (e.target.tagName === 'IMG') {
                     setCanSaveAs(true);
                     setImageSrc(e.target.src);
                 } else {
                     setCanSaveAs(false);
                     setImageSrc(null);
                 }

                 // 2. Check for Text Selection (Copy/Cut)
                 const selection = window.getSelection();
                 const hasSelection = selection && selection.toString().length > 0;
                 setCanCopyCut(hasSelection);

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
             html = `<img src="${url}" alt="${filename}" style="max-width: 100%; height: auto; display: block; margin: 0.5rem auto;" />`;
        } else {
             html = `<a href="${url}" target="_blank" class="text-blue-600 underline hover:text-blue-800 mx-1 inline-flex items-center gap-1 bg-gray-50 px-1 rounded border border-gray-200" contenteditable="false"><span class="opacity-70">📄</span>${filename}</a>`;
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            document.execCommand('insertHTML', false, html);
        }
    };

    const handleExport = (format) => {
        if (format === 'png') {
            if (targetSlideId) {
                exportSlideToPng(`slide-content-${targetSlideId}`, 'slide');
            } else {
                exportCanvasToPng('page-content-root', 'canvas');
            }
        } else if (format === 'pdf') {
            const id = targetSlideId ? `slide-content-${targetSlideId}` : 'page-content-root';
            const name = targetSlideId ? 'slide' : 'canvas';
            const type = targetSlideId ? 'slide' : 'canvas';
            exportToPdf(id, name, type);
        }
        setPosition(null);
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                document.execCommand('insertText', false, text);
            }
            setPosition(null);
        } catch (err) {
            console.error("Paste failed:", err);
            alert("Failed to read clipboard. Please ensure you have granted permission.");
        }
    };

    const handleCopy = () => {
        document.execCommand('copy');
        setPosition(null);
    };

    const handleCut = () => {
        document.execCommand('cut');
        setPosition(null);
    };

    const handleSaveAs = async () => {
        if (!imageSrc) return;
        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Guess filename
            const name = imageSrc.split('/').pop() || 'download.png';
            a.download = name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Save As failed:", err);
            alert("Failed to download image.");
        }
        setPosition(null);
    };

    const handleMoveToSlide = () => {
        if (onMoveToSlide && targetBlockId) {
            onMoveToSlide(targetBlockId);
        }
        setPosition(null);
    };

    const handleExtract = () => {
        if (onExtractFromSlide && targetBlockId) {
            onExtractFromSlide(targetBlockId);
        }
        setPosition(null);
    };

    const handleInsertMermaid = () => {
        window.dispatchEvent(new CustomEvent('editor:insert-block', {
            detail: { afterId: targetBlockId, type: 'mermaid' }
        }));
        setPosition(null);
    };

    const handleDelete = () => {
        if (targetBlockId) {
            window.dispatchEvent(new CustomEvent('editor:delete-block', {
                detail: { id: targetBlockId }
            }));
        }
        setPosition(null);
    };

    const handleCopyBlock = () => {
        if (targetBlockId) {
            window.dispatchEvent(new CustomEvent('editor:copy-block', {
                detail: { id: targetBlockId }
            }));
        }
        setPosition(null);
    };

    const handleCutBlock = () => {
        if (targetBlockId) {
            window.dispatchEvent(new CustomEvent('editor:cut-block', {
                detail: { id: targetBlockId }
            }));
        }
        setPosition(null);
    };

    if (!position) return null;

    const exportLabel = targetSlideId ? 'Export Slide' : 'Export Canvas';

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-50 bg-white shadow-xl border border-gray-200 rounded-lg py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
            style={{ top: position.y, left: position.x }}
        >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                Actions
            </div>

            {/* Copy / Cut - Only if selection exists */}
            {canCopyCut && (
                <>
                    <button
                        onClick={handleCopy}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                    >
                        <Copy size={16} />
                        <span>Copy Text</span>
                    </button>
                    <button
                        onClick={handleCut}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                    >
                        <Scissors size={16} />
                        <span>Cut Text</span>
                    </button>
                </>
            )}

            <button
                onClick={handlePaste}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <ClipboardPaste size={16} />
                <span>Paste</span>
            </button>

            {/* Save As - Only for images */}
            {canSaveAs && (
                <button
                    onClick={handleSaveAs}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 border-t border-gray-100 mt-1 pt-1.5"
                >
                    <Save size={16} />
                    <span>Save Image As...</span>
                </button>
            )}

            <div className="border-t border-gray-100 my-1"></div>

            <button
                onClick={triggerUpload}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <Upload size={16} />
                <span>Import File / Image</span>
            </button>

            <button
                onClick={handleInsertMermaid}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <code className="text-xs border border-gray-300 rounded px-1">M</code>
                <span>Insert Mermaid Diagram</span>
            </button>

            {/* Context Actions for Blocks */}
            {targetBlockId && (
                <>
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Copy Block Buttons */}
                    <button
                        onClick={handleCopyBlock}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                    >
                        <CopyBlock size={16} />
                        <span>Copy Block</span>
                    </button>
                    <button
                        onClick={handleCutBlock}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                    >
                        <Scissors size={16} />
                        <span>Cut Block</span>
                    </button>

                     {isInsideSlide ? (
                        <button
                            onClick={handleExtract}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                        >
                            <Minimize size={16} />
                            <span>Extract from Slide</span>
                        </button>
                     ) : (
                         targetBlockId !== targetSlideId && (
                            <button
                                onClick={handleMoveToSlide}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                            >
                                <Maximize size={16} />
                                <span>Move to Slide</span>
                            </button>
                         )
                     )}
                     <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
                    >
                        <Trash2 size={16} />
                        <span>Delete Block</span>
                    </button>
                </>
            )}

            <div className="border-t border-gray-100 my-1"></div>

            <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {exportLabel}
            </div>
            <button
                onClick={() => handleExport('png')}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <ImageIcon size={16} />
                <span>PNG (High Quality)</span>
            </button>
            <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
            >
                <Download size={16} />
                <span>PDF</span>
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
