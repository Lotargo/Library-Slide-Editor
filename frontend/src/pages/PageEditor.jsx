import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import BlockList from '../components/BlockList';
import Toolbar from '../components/Toolbar';

export default function PageEditor() {
    const { pageId } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

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
        // API call deferred or immediate? For title, blur is fine, but lets do debounce logic later
        api.updatePage(pageId, { title: newTitle });
    };

    const updateBlocks = (newBlocks) => {
        setPage(prev => ({ ...prev, blocks: newBlocks }));
        // We should debounce this save
        saveBlocks(newBlocks);
    };

    // Simple debounce for now
    const saveBlocks = useCallback(debounce((blocks) => {
        api.updatePage(pageId, { blocks });
    }, 1000), [pageId]);

    if (loading) return <div className="p-10 text-gray-400">Loading...</div>;
    if (!page) return <div className="p-10 text-gray-400">Page not found</div>;

    return (
        <div className="flex flex-col h-full relative">
            <Toolbar />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-12 py-16 pb-32 min-h-full bg-white">
                     {/* Title */}
                     <div
                        className="text-4xl font-bold mb-8 outline-none text-gray-900 empty:before:content-[attr(placeholder)] empty:before:text-gray-300 cursor-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateTitle(e.target.innerText)}
                        placeholder="Untitled"
                     >
                        {page.title}
                     </div>

                     <BlockList blocks={page.blocks || []} onChange={updateBlocks} />
                </div>
            </div>
        </div>
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
