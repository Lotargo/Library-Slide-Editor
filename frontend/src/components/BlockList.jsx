import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import BlockWrapper from './BlockWrapper';
import { api } from '../api';
import { serializeBlocks, parseBlockData } from '../utils/clipboardUtils';
import ProgressBar from './ProgressBar';

export default function BlockList({ blocks, onChange, listId = 'root' }) {
    const listRef = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [focusId, setFocusId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({ active: false, current: 0, total: 0, index: null });

    const updateBlock = (id, updates) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
        onChange(newBlocks);
    };

    const addBlock = (afterId, type = 'text', content = '') => {
        const newBlock = { id: uuidv4(), type, content };
        const index = blocks.findIndex(b => b.id === afterId);
        const newBlocks = [...blocks];
        if (index === -1) {
            newBlocks.push(newBlock);
        } else {
            newBlocks.splice(index + 1, 0, newBlock);
        }
        onChange(newBlocks);
        setFocusId(newBlock.id);
    };

    const insertBlockAtIndex = (index, type, content) => {
        const newBlock = { id: uuidv4(), type, content };
        const newBlocks = [...blocks];
        newBlocks.splice(index, 0, newBlock);
        onChange(newBlocks);
        setFocusId(newBlock.id);
    }

    const deleteBlock = (id) => {
        const newBlocks = blocks.filter(b => b.id !== id);
        onChange(newBlocks);
    };

    // Listen for custom events (e.g. from ContextMenu, Paste)
    React.useEffect(() => {
        const handleInsert = (e) => {
            const { afterId, type, content } = e.detail;
            if (!afterId) return;

            const index = blocks.findIndex(b => b.id === afterId);
            if (index !== -1) {
                addBlock(afterId, type, content);
            }
        };

        const handleDelete = (e) => {
            const { id } = e.detail;
            if (!id) return;
            if (blocks.some(b => b.id === id)) {
                deleteBlock(id);
            }
        };

        const handleCopyBlock = (e) => {
            const { id } = e.detail;
            const block = blocks.find(b => b.id === id);
            if (block) {
                const serialized = serializeBlocks(block);
                // We use a temporary textarea to put data into clipboard if navigator.clipboard is blocked?
                // But navigator.clipboard is better.
                // We want to set text/plain AND custom format?
                // For now, let's put it in text/plain as JSON string.
                navigator.clipboard.writeText(serialized).then(() => {
                    console.log("Block copied to clipboard");
                }).catch(err => console.error("Copy failed", err));
            }
        };

        const handleCutBlock = (e) => {
             const { id } = e.detail;
             const block = blocks.find(b => b.id === id);
             if (block) {
                 const serialized = serializeBlocks(block);
                 navigator.clipboard.writeText(serialized).then(() => {
                     deleteBlock(id);
                 }).catch(err => console.error("Cut failed", err));
             }
        };

        const handleInsertBlocksData = (e) => {
            // This event is dispatched when TextBlock detects block data in clipboard
            const { blocks: newBlocksData, afterId } = e.detail;
            if (newBlocksData && newBlocksData.length > 0) {
                 const index = afterId ? blocks.findIndex(b => b.id === afterId) : blocks.length - 1;
                 const currentBlocks = [...blocks];

                 // Insert after
                 currentBlocks.splice(index + 1, 0, ...newBlocksData);
                 onChange(currentBlocks);

                 // Focus the first inserted block
                 if (newBlocksData[0]) {
                     setFocusId(newBlocksData[0].id);
                 }
            }
        };

        window.addEventListener('editor:insert-block', handleInsert);
        window.addEventListener('editor:delete-block', handleDelete);
        window.addEventListener('editor:copy-block', handleCopyBlock);
        window.addEventListener('editor:cut-block', handleCutBlock);
        window.addEventListener('editor:insert-blocks-data', handleInsertBlocksData);

        return () => {
            window.removeEventListener('editor:insert-block', handleInsert);
            window.removeEventListener('editor:delete-block', handleDelete);
            window.removeEventListener('editor:copy-block', handleCopyBlock);
            window.removeEventListener('editor:cut-block', handleCutBlock);
            window.removeEventListener('editor:insert-blocks-data', handleInsertBlocksData);
        };
    }, [blocks, onChange]);

    // --- File Drag & Drop Handlers ---

    const handleDragOver = (e) => {
        if (!e.dataTransfer.types.includes('Files')) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);

        const listRect = listRef.current?.getBoundingClientRect();
        if (!listRect) return;

        const children = Array.from(listRef.current.querySelectorAll('[data-block-id]'));

        let closestIndex = children.length;
        let minDistance = Infinity;

        if (children.length > 0) {
            const firstRect = children[0].getBoundingClientRect();
            const distToFirstTop = Math.abs(e.clientY - firstRect.top);
            if (distToFirstTop < minDistance) {
                minDistance = distToFirstTop;
                closestIndex = 0;
            }
        }

        children.forEach((child, idx) => {
            const rect = child.getBoundingClientRect();
            const distToBottom = Math.abs(e.clientY - rect.bottom);
            if (distToBottom < minDistance) {
                minDistance = distToBottom;
                closestIndex = idx + 1;
            }
        });

        setDragOverIndex(closestIndex);
    };

    const handleDragLeave = (e) => {
         if (listRef.current && !listRef.current.contains(e.relatedTarget)) {
            setIsDraggingFile(false);
            setDragOverIndex(null);
         }
    };

    const handleDrop = async (e) => {
        if (!e.dataTransfer.types.includes('Files')) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
        const index = dragOverIndex === null ? blocks.length : dragOverIndex;
        setDragOverIndex(null);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (files.length === 0) return;

        // Init Progress
        setUploadProgress({ active: true, current: 0, total: files.length, index });

        const uploadedImages = [];
        const uploadedVideos = [];
        let completed = 0;

        for (const file of files) {
            try {
                const data = await api.uploadFile(file);
                if (file.type.startsWith('image/')) {
                    uploadedImages.push({
                        url: data.url,
                        thumbnail_url: data.thumbnail_url || data.url
                    });
                } else if (file.type.startsWith('video/')) {
                    uploadedVideos.push(data.url);
                }
            } catch (err) {
                console.error("Upload failed for file", file.name, err);
            }
            completed++;
            setUploadProgress(prev => ({ ...prev, current: completed }));
        }

        // Batch insertion to prevent state race conditions
        if (uploadedImages.length > 0 || uploadedVideos.length > 0) {
            const newBlocks = [...blocks];
            let insertPos = index;

            if (uploadedImages.length > 0) {
                const galleryBlock = { id: uuidv4(), type: 'gallery', content: uploadedImages };
                newBlocks.splice(insertPos, 0, galleryBlock);
                insertPos++;
                setFocusId(galleryBlock.id);
            }

            for (const videoUrl of uploadedVideos) {
                const videoBlock = { id: uuidv4(), type: 'video', content: videoUrl };
                newBlocks.splice(insertPos, 0, videoBlock);
                setFocusId(videoBlock.id); // Focus the last inserted
                insertPos++;
            }

            onChange(newBlocks);
        }

        // Reset
        setUploadProgress({ active: false, current: 0, total: 0, index: null });
    };

    if (!blocks || blocks.length === 0) {
        if (uploadProgress.active) {
             return (
                 <div className="py-2 px-2">
                     <ProgressBar current={uploadProgress.current} total={uploadProgress.total} />
                 </div>
             );
        }
        return (
            <div
                className="py-2 text-gray-400 cursor-text hover:bg-gray-50 rounded px-2"
                onClick={() => addBlock(null)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                ref={listRef}
            >
                Type '/' for commands or just start writing...
            </div>
        )
    }

    return (
        <div
            ref={listRef}
            className="relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDraggingFile && dragOverIndex !== null && (
                <div
                    className="absolute left-0 right-0 h-1 bg-blue-500 z-50 pointer-events-none transition-all duration-100"
                    style={{
                        display: 'none'
                    }}
                />
            )}

            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy} id={listId}>
                <div className="space-y-2">
                    {blocks.map((block, idx) => (
                        <React.Fragment key={block.id}>
                            {isDraggingFile && dragOverIndex === idx && (
                                <div className="h-1 bg-blue-500 rounded my-1 animate-pulse" />
                            )}

                            {uploadProgress.active && uploadProgress.index === idx && (
                                <ProgressBar current={uploadProgress.current} total={uploadProgress.total} />
                            )}

                            <BlockWrapper
                                block={block}
                                onUpdate={(updates) => updateBlock(block.id, updates)}
                                onAddNext={() => addBlock(block.id)}
                                onDelete={() => deleteBlock(block.id)}
                                autoFocus={block.id === focusId}
                            />

                            {isDraggingFile && dragOverIndex === blocks.length && idx === blocks.length - 1 && (
                                <div className="h-1 bg-blue-500 rounded my-1 animate-pulse" />
                            )}
                        </React.Fragment>
                    ))}

                    {uploadProgress.active && uploadProgress.index === blocks.length && (
                        <ProgressBar current={uploadProgress.current} total={uploadProgress.total} />
                    )}

                    <div
                        className="h-32 cursor-text"
                        onClick={() => addBlock(blocks[blocks.length-1].id)}
                    ></div>
                </div>
            </SortableContext>
        </div>
    );
}
