import React, { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BlockWrapper from './BlockWrapper';

export default function BlockList({ blocks, onChange }) {

    // Ensure there's always at least one block if the page is empty?
    // Notion allows completely empty pages, but clicking usually creates a block.

    const updateBlock = (id, updates) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
        onChange(newBlocks);
    };

    const addBlock = (afterId, type = 'text') => {
        const newBlock = { id: uuidv4(), type, content: '' };
        const index = blocks.findIndex(b => b.id === afterId);
        const newBlocks = [...blocks];
        if (index === -1) {
            newBlocks.push(newBlock);
        } else {
            newBlocks.splice(index + 1, 0, newBlock);
        }
        onChange(newBlocks);
    };

    const deleteBlock = (id) => {
        const newBlocks = blocks.filter(b => b.id !== id);
        onChange(newBlocks);
    };

    if (!blocks || blocks.length === 0) {
        return (
            <div
                className="py-2 text-gray-400 cursor-text hover:bg-gray-50 rounded px-2"
                onClick={() => addBlock(null)}
            >
                Type '/' for commands or just start writing...
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {blocks.map(block => (
                <BlockWrapper
                    key={block.id}
                    block={block}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onAddNext={() => addBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                />
            ))}

            {/* Click area at bottom to append */}
            <div
                className="h-32 cursor-text"
                onClick={() => addBlock(blocks[blocks.length-1].id)}
            ></div>
        </div>
    );
}
