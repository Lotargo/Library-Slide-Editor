import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { usePage } from '../contexts/PageContext';
import BlockWrapper from './BlockWrapper';

export default function VirtualizedBlockList({ Header }) {
    const { blocks, rootIds, focusId, updateBlock, addBlock, deleteBlock } = usePage();

    // Recursive resolver to convert ID-based children back to objects for rendering
    const resolveBlock = (id) => {
        const block = blocks[id];
        if (!block) return null;

        const resolved = { ...block };
        // If children exists and are IDs, resolve them
        if (resolved.children && Array.isArray(resolved.children)) {
            if (resolved.children.length > 0 && typeof resolved.children[0] === 'string') {
                 resolved.children = resolved.children.map(cid => resolveBlock(cid)).filter(b => b);
            }
        }
        return resolved;
    };

    const Footer = () => (
        <div className="max-w-4xl mx-auto px-12">
            <div
                className="h-32 cursor-text w-full"
                onClick={() => {
                    const lastId = rootIds.length > 0 ? rootIds[rootIds.length - 1] : null;
                    addBlock(lastId);
                }}
            ></div>
        </div>
    );

    return (
        <Virtuoso
            style={{ height: '100%' }}
            data={rootIds}
            components={{
                Header: Header,
                Footer: Footer
            }}
            itemContent={(index, id) => {
                const block = resolveBlock(id);
                if (!block) return null;

                return (
                    <div className="pb-2 max-w-4xl mx-auto px-12">
                        <BlockWrapper
                            block={block}
                            onUpdate={(updates) => updateBlock(id, updates)}
                            onAddNext={() => addBlock(id)}
                            onDelete={() => deleteBlock(id)}
                            autoFocus={block.id === focusId}
                        />
                    </div>
                );
            }}
        />
    );
}
