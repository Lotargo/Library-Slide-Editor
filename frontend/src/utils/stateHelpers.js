
export const normalizePage = (nestedBlocks) => {
    const blocks = {};
    const rootIds = [];

    const traverse = (nodes, parentId = null) => {
        return nodes.map(node => {
            // Shallow copy to avoid mutating original immediately, though we will mutate 'children' field
            const newNode = { ...node };

            // Add parent pointer for easier state updates (moving blocks)
            if (parentId) {
                newNode.parentId = parentId;
            }

            const childrenIds = [];
            if (newNode.children && Array.isArray(newNode.children)) {
                childrenIds.push(...traverse(newNode.children, newNode.id));
                newNode.children = childrenIds; // Replace object array with ID array
            }

            blocks[newNode.id] = newNode;
            return newNode.id;
        });
    };

    if (nestedBlocks && Array.isArray(nestedBlocks)) {
        rootIds.push(...traverse(nestedBlocks));
    }

    return { blocks, rootIds };
};

export const denormalizePage = (blocksMap, rootIds) => {
    const buildTree = (ids) => {
        return ids.map(id => {
            const block = blocksMap[id];
            if (!block) return null;

            const newBlock = { ...block };

            // Remove internal metadata
            delete newBlock.parentId;

            if (newBlock.children && Array.isArray(newBlock.children)) {
                 // Recursively build children
                 newBlock.children = buildTree(newBlock.children).filter(b => b !== null);
            }

            return newBlock;
        }).filter(b => b !== null);
    };

    return buildTree(rootIds || []);
};
