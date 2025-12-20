import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import BlockWrapper from './BlockWrapper';
import { api } from '../api';

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

    // Listen for custom insert events (e.g. from ContextMenu)
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
            // Check if block belongs to this list
            if (blocks.some(b => b.id === id)) {
                deleteBlock(id);
            }
        };

        window.addEventListener('editor:insert-block', handleInsert);
        window.addEventListener('editor:delete-block', handleDelete);
        return () => {
            window.removeEventListener('editor:insert-block', handleInsert);
            window.removeEventListener('editor:delete-block', handleDelete);
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

    const ProgressBar = () => (
        <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg text-blue-700 flex items-center gap-3 animate-pulse my-2">
            <Loader2 className="animate-spin" size={20} />
            <div className="flex-1">
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Uploading images...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                </div>
                <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );


    if (!blocks || blocks.length === 0) {
        if (uploadProgress.active) {
             return (
                 <div className="py-2 px-2">
                     <ProgressBar />
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
                                <ProgressBar />
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
                        <ProgressBar />
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
