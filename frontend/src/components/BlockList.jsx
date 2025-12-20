import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BlockWrapper from './BlockWrapper';
import { api } from '../api';

export default function BlockList({ blocks, onChange, listId = 'root' }) {
    const listRef = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);

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
    };

    const insertBlockAtIndex = (index, type, content) => {
        const newBlock = { id: uuidv4(), type, content };
        const newBlocks = [...blocks];
        newBlocks.splice(index, 0, newBlock);
        onChange(newBlocks);
    }

    const deleteBlock = (id) => {
        const newBlocks = blocks.filter(b => b.id !== id);
        onChange(newBlocks);
    };

    // --- File Drag & Drop Handlers ---

    const handleDragOver = (e) => {
        // Only handle file drags, let dnd-kit handle internal sorting
        if (!e.dataTransfer.types.includes('Files')) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);

        // Calculate closest insertion point
        // We find the block whose center is closest to e.clientY
        // Or simply finding the gap.

        // Since we are inside a relative container, we need to be careful with coordinates.
        // Simple heuristic: find the child with bounding rect.
        const listRect = listRef.current?.getBoundingClientRect();
        if (!listRect) return;

        // Find children block wrappers
        // Note: SortableContext renders children directly. BlockWrapper renders a div with data-block-id.
        // We can query selector for them.
        const children = Array.from(listRef.current.querySelectorAll('[data-block-id]'));

        let closestIndex = children.length; // Default to end
        let minDistance = Infinity;

        // Check distance to the top of the first element
        if (children.length > 0) {
            const firstRect = children[0].getBoundingClientRect();
            const distToFirstTop = Math.abs(e.clientY - firstRect.top);
            if (distToFirstTop < minDistance) {
                minDistance = distToFirstTop;
                closestIndex = 0;
            }
        }

        // Check distance to bottom of each element
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
         // Check if we really left the list container
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

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // Process files
        const uploadedImages = [];

        // We'll upload all images
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    const data = await api.uploadFile(file);
                    uploadedImages.push(data.url);
                } catch (err) {
                    console.error("Upload failed for file", file.name, err);
                }
            } else {
                // Handle non-image files if needed?
                // For now, ignoring or we could insert them as text links.
                // Requirement only specified images for drag & drop with shrinking/gallery.
            }
        }

        if (uploadedImages.length > 0) {
            // Create a Gallery Block
            insertBlockAtIndex(index, 'gallery', uploadedImages);
        }
    };


    if (!blocks || blocks.length === 0) {
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
                        // We need to position this indicator.
                        // It's tricky with "absolute" relative to "listRef" if children have varying heights.
                        // However, we calculated index. Let's try to render it simply between items in the list flow.
                        // Actually, rendering it "absolutey" based on index is hard without knowing exact pixel offsets of children.
                        // A better way is to render the indicator IN the list based on index.
                        display: 'none' // We will render it inside the mapping logic below
                    }}
                />
            )}

            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy} id={listId}>
                <div className="space-y-2">
                    {blocks.map((block, idx) => (
                        <React.Fragment key={block.id}>
                            {/* Drop Indicator before block */}
                            {isDraggingFile && dragOverIndex === idx && (
                                <div className="h-1 bg-blue-500 rounded my-1 animate-pulse" />
                            )}

                            <BlockWrapper
                                block={block}
                                onUpdate={(updates) => updateBlock(block.id, updates)}
                                onAddNext={() => addBlock(block.id)}
                                onDelete={() => deleteBlock(block.id)}
                            />

                            {/* Drop Indicator after last block */}
                            {isDraggingFile && dragOverIndex === blocks.length && idx === blocks.length - 1 && (
                                <div className="h-1 bg-blue-500 rounded my-1 animate-pulse" />
                            )}
                        </React.Fragment>
                    ))}

                    {/* Click area at bottom to append */}
                    <div
                        className="h-32 cursor-text"
                        onClick={() => addBlock(blocks[blocks.length-1].id)}
                    ></div>
                </div>
            </SortableContext>
        </div>
    );
}
