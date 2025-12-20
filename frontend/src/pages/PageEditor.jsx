import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import BlockList from '../components/BlockList';
import Toolbar from '../components/Toolbar';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import FloatingMenu from '../components/FloatingMenu';
import ContextMenu from '../components/ContextMenu';

export default function PageEditor() {
    const { pageId } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
             activationConstraint: {
                distance: 5,
             },
        })
    );

    useEffect(() => {
        loadPage();
    }, [pageId]);

    const loadPage = async () => {
        setLoading(true);
        const data = await api.getPage(pageId);
        setPage(data);
        setLoading(false);
    };

    const updateTitle = (newTitle) => {
        setPage(prev => ({ ...prev, title: newTitle }));
        api.updatePage(pageId, { title: newTitle });
    };

    const saveBlocks = useCallback(debounce((blocks) => {
        api.updatePage(pageId, { blocks });
    }, 1000), [pageId]);

    const updateBlocks = (newBlocks) => {
        setPage(prev => ({ ...prev, blocks: newBlocks }));
        saveBlocks(newBlocks);
    };

    const handleConvertToSlide = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const getBlockId = (node) => {
             const el = node.nodeType === 1 ? node : node.parentElement;
             const blockEl = el.closest('[data-block-id]');
             return blockEl ? blockEl.getAttribute('data-block-id') : null;
        };

        const startId = getBlockId(range.startContainer);
        const endId = getBlockId(range.endContainer);

        if (!startId || !endId) return;

        // Deep clone to mutate
        const newBlocks = JSON.parse(JSON.stringify(page.blocks));

        const findList = (blocks, id) => {
            const idx = blocks.findIndex(b => b.id === id);
            if (idx !== -1) return { list: blocks, index: idx };
            for (const b of blocks) {
                if (b.children) {
                    const res = findList(b.children, id);
                    if (res) return res;
                }
            }
            return null;
        };

        const startRes = findList(newBlocks, startId);
        const endRes = findList(newBlocks, endId);

        if (!startRes || !endRes || startRes.list !== endRes.list) {
            // Cannot group blocks from different lists
            return;
        }

        const minIndex = Math.min(startRes.index, endRes.index);
        const maxIndex = Math.max(startRes.index, endRes.index);
        const count = maxIndex - minIndex + 1;

        const blocksToMove = startRes.list.splice(minIndex, count);

        const newSlide = {
            id: uuidv4(),
            type: 'slide_wrapper',
            children: blocksToMove,
            ratio: '16/9'
        };

        startRes.list.splice(minIndex, 0, newSlide);
        updateBlocks(newBlocks);

        selection.removeAllRanges();
    };

    const handleUngroup = (slideId) => {
        const newBlocks = JSON.parse(JSON.stringify(page.blocks));

        const findList = (blocks, id) => {
            const idx = blocks.findIndex(b => b.id === id);
            if (idx !== -1) return { list: blocks, index: idx };
            for (const b of blocks) {
                if (b.children) {
                    const res = findList(b.children, id);
                    if (res) return res;
                }
            }
            return null;
        };

        const res = findList(newBlocks, slideId);
        if (!res) return;

        const { list, index } = res;
        const slideBlock = list[index];
        const children = slideBlock.children || [];

        // Remove slide, insert children
        list.splice(index, 1, ...children);

        updateBlocks(newBlocks);
        window.getSelection().removeAllRanges();
    };

    // DnD Helpers
    const findContainer = (id) => {
        if (page.blocks.find(b => b.id === id)) return 'root';
        const findInBlocks = (blocks) => {
            for (const b of blocks) {
                if (b.children) {
                    if (b.children.find(child => child.id === id)) return b.id;
                    const found = findInBlocks(b.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInBlocks(page.blocks);
    };

    const getItems = (containerId) => {
        if (containerId === 'root') return page.blocks;
        const findBlock = (blocks) => {
             for (const b of blocks) {
                 if (b.id === containerId) return b.children || [];
                 if (b.children) {
                     const found = findBlock(b.children);
                     if (found) return found;
                 }
             }
             return [];
        }
        return findBlock(page.blocks);
    };

    const deepUpdate = (blocks, targetId, updates) => {
        return blocks.map(b => {
            if (b.id === targetId) return { ...b, ...updates };
            if (b.children) return { ...b, children: deepUpdate(b.children, targetId, updates) };
            return b;
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
             const items = getItems(activeContainer);
             const oldIndex = items.findIndex(i => i.id === activeId);
             const newIndex = items.findIndex(i => i.id === overId);

             if (oldIndex !== newIndex) {
                 const newItems = arrayMove(items, oldIndex, newIndex);
                 if (activeContainer === 'root') {
                     updateBlocks(newItems);
                 } else {
                     const newBlocks = deepUpdate(page.blocks, activeContainer, { children: newItems });
                     updateBlocks(newBlocks);
                 }
             }
        } else {
            // Move across containers
            const activeItems = getItems(activeContainer);
            const overItems = getItems(overContainer);

            const oldIndex = activeItems.findIndex(i => i.id === activeId);
            const newIndex = overItems.findIndex(i => i.id === overId);

            const itemToMove = activeItems[oldIndex];
            const newActiveItems = [...activeItems];
            newActiveItems.splice(oldIndex, 1);

            const newOverItems = [...overItems];

            // Insert at new index
            // If overId is a container (not an item), we might default to end?
            // But overId usually is an item in SortableContext.
            let insertIndex = newIndex;
            if (insertIndex === -1) insertIndex = newOverItems.length;

            newOverItems.splice(insertIndex, 0, itemToMove);

            let currentBlocks = [...page.blocks];

            // 1. Remove from source
            if (activeContainer === 'root') {
                currentBlocks = newActiveItems;
            } else {
                currentBlocks = deepUpdate(currentBlocks, activeContainer, { children: newActiveItems });
            }

            // 2. Add to target
            if (overContainer === 'root') {
                 const newRoot = [...currentBlocks];
                 newRoot.splice(insertIndex, 0, itemToMove);
                 currentBlocks = newRoot;
            } else {
                 currentBlocks = deepUpdate(currentBlocks, overContainer, { children: newOverItems });
            }

            updateBlocks(currentBlocks);
        }
    };

    if (loading) return <div className="p-10 text-gray-400">Loading...</div>;
    if (!page) return <div className="p-10 text-gray-400">Page not found</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full relative" id="editor-content-area">
                <FloatingMenu onConvertToSlide={handleConvertToSlide} onUngroup={handleUngroup} />
                <ContextMenu />
                <Toolbar />
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-12 py-16 pb-32 min-h-full bg-white">
                         <div
                            className="text-4xl font-bold mb-8 outline-none text-gray-900 empty:before:content-[attr(placeholder)] empty:before:text-gray-300 cursor-text"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateTitle(e.target.innerText)}
                            placeholder="Untitled"
                         >
                            {page.title}
                         </div>

                         <BlockList blocks={page.blocks || []} onChange={updateBlocks} listId="root" />
                    </div>
                </div>
            </div>
        </DndContext>
    );
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
