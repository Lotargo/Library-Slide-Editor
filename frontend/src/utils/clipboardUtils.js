import { v4 as uuidv4 } from 'uuid';

const APP_SIGNATURE = "dj-cards-blocks-v1";

/**
 * Regenerates IDs for a block and all its children recursively.
 * Performs a deep clone to ensure no shared references.
 * @param {Object} block - The block to process.
 * @returns {Object} - A deep copy of the block with new IDs.
 */
export const regenerateIds = (block) => {
    // Deep clone first to break all references
    const clonedBlock = structuredClone(block);

    const processBlock = (blk) => {
        blk.id = uuidv4();
        if (blk.children && Array.isArray(blk.children)) {
            blk.children.forEach(child => processBlock(child));
        }
        return blk;
    };

    return processBlock(clonedBlock);
};

/**
 * Prepares blocks for clipboard by wrapping them in a signature object.
 * @param {Array|Object} blocks - Single block or array of blocks.
 * @returns {string} - JSON string.
 */
export const serializeBlocks = (blocks) => {
    const data = Array.isArray(blocks) ? blocks : [blocks];
    return JSON.stringify({
        signature: APP_SIGNATURE,
        blocks: data
    });
};

/**
 * Attempts to parse clipboard text as block data.
 * @param {string} text - Clipboard text.
 * @returns {Array|null} - Array of blocks with new IDs, or null if invalid.
 */
export const parseBlockData = (text) => {
    try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.signature === APP_SIGNATURE && Array.isArray(parsed.blocks)) {
            return parsed.blocks.map(regenerateIds);
        }
    } catch (e) {
        // Not JSON or not our format
    }
    return null;
};
