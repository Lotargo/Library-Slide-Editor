import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { normalizePage, denormalizePage } from '../utils/stateHelpers';
import { v4 as uuidv4 } from 'uuid';

const PageContext = createContext(null);

export const usePage = () => {
    const context = useContext(PageContext);
    if (!context) {
        throw new Error("usePage must be used within a PageProvider");
    }
    return context;
};

export const PageProvider = ({ children, initialData, onSave }) => {
    const [pageState, setPageState] = useState({ blocks: {}, rootIds: [] });
    const [focusId, setFocusId] = useState(null);

    useEffect(() => {
        if (initialData) {
            setPageState(normalizePage(initialData));
        }
    }, [initialData]);

    const updateBlock = useCallback((id, updates) => {
        setPageState(prev => {
            if (!prev.blocks[id]) return prev;

            let newBlocks = { ...prev.blocks };
            let finalUpdates = { ...updates };

            // Handle children updates from nested BlockLists (e.g. inside Slide) which return objects
            if (updates.children && Array.isArray(updates.children) && updates.children.length > 0 && typeof updates.children[0] === 'object') {
                 const { blocks: childBlocks, rootIds: childIds } = normalizePage(updates.children);

                 // Merge child blocks into state
                 newBlocks = { ...newBlocks, ...childBlocks };

                 // Ensure parent pointers are correct
                 childIds.forEach(cid => {
                     if (newBlocks[cid]) {
                         newBlocks[cid] = { ...newBlocks[cid], parentId: id };
                     }
                 });

                 finalUpdates.children = childIds;
            }

            // Apply updates to the target block
            newBlocks[id] = { ...newBlocks[id], ...finalUpdates };

            const newState = { ...prev, blocks: newBlocks };
            if (onSave) onSave(denormalizePage(newState.blocks, newState.rootIds));
            return newState;
        });
    }, [onSave]);

    const addBlock = useCallback((afterId, type = 'text', content = '') => {
        const newId = uuidv4();
        const newBlock = { id: newId, type, content };
        let createdId = newId;

        setPageState(prev => {
            const newBlocks = { ...prev.blocks, [newId]: newBlock };
            let newRootIds = [...prev.rootIds];

            let inserted = false;

            // 1. Is afterId in root?
            if (afterId) {
                const rootIndex = newRootIds.indexOf(afterId);
                if (rootIndex !== -1) {
                    newRootIds.splice(rootIndex + 1, 0, newId);
                    inserted = true;
                } else {
                    // 2. Is it a child?
                    const afterBlock = prev.blocks[afterId];
                    if (afterBlock && afterBlock.parentId) {
                        const parentId = afterBlock.parentId;
                        const parent = { ...newBlocks[parentId] };
                        const children = [...(parent.children || [])];
                        const childIndex = children.indexOf(afterId);

                        if (childIndex !== -1) {
                            children.splice(childIndex + 1, 0, newId);
                            parent.children = children;
                            newBlocks[parentId] = parent;
                            newBlock.parentId = parentId;
                            inserted = true;
                        }
                    }
                }
            }

            if (!inserted) {
                newRootIds.push(newId);
            }

            const newState = { blocks: newBlocks, rootIds: newRootIds };
            if (onSave) onSave(denormalizePage(newState.blocks, newState.rootIds));
            return newState;
        });

        setFocusId(createdId);
        return createdId;
    }, [onSave]);

    const deleteBlock = useCallback((id) => {
        setPageState(prev => {
             const block = prev.blocks[id];
             if (!block) return prev;

             const newBlocks = { ...prev.blocks };
             let newRootIds = [...prev.rootIds];

             if (block.parentId) {
                 const parent = { ...newBlocks[block.parentId] };
                 if (parent.children) {
                     parent.children = parent.children.filter(cid => cid !== id);
                     newBlocks[block.parentId] = parent;
                 }
             } else {
                 newRootIds = newRootIds.filter(rid => rid !== id);
             }

             delete newBlocks[id];

             const newState = { blocks: newBlocks, rootIds: newRootIds };
             if (onSave) onSave(denormalizePage(newState.blocks, newState.rootIds));
             return newState;
        });
    }, [onSave]);

    const value = {
        blocks: pageState.blocks,
        rootIds: pageState.rootIds,
        focusId,
        updateBlock,
        addBlock,
        deleteBlock
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
