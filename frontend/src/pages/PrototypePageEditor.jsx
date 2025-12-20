import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import VirtualizedBlockList from '../components/VirtualizedBlockList';
import Toolbar from '../components/Toolbar';
import { PageProvider } from '../contexts/PageContext';

const EditorContent = ({ page, updateTitle }) => {
    // Header component for Virtuoso
    // Note: We move the padding/sizing here to match the items
    const Header = () => (
         <div className="max-w-4xl mx-auto px-12 py-16">
             <div
                className="text-4xl font-bold mb-8 outline-none text-gray-900 empty:before:content-[attr(placeholder)] empty:before:text-gray-300 cursor-text"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateTitle(e.target.innerText)}
                placeholder="Untitled"
             >
                {page.title}
             </div>
         </div>
    );

    return (
        <div className="flex flex-col h-full relative" id="prototype-editor">
            <Toolbar />
            <div className="flex-1 overflow-hidden bg-white">
                <VirtualizedBlockList Header={Header} />
            </div>
        </div>
    );
}

export default function PrototypePageEditor() {
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

    const handleSave = async (tree) => {
        await api.updatePage(pageId, { blocks: tree });
    };

    // Simple debounce wrapper
    const debouncedSave = useCallback(debounce(handleSave, 1000), [pageId, handleSave]);

    const updateTitle = (newTitle) => {
        setPage(prev => ({ ...prev, title: newTitle }));
        api.updatePage(pageId, { title: newTitle });
    };

    if (loading) return <div className="p-10 text-gray-400">Loading...</div>;
    if (!page) return <div className="p-10 text-gray-400">Page not found</div>;

    return (
        <PageProvider initialData={page.blocks} onSave={debouncedSave}>
            <EditorContent page={page} updateTitle={updateTitle} />
        </PageProvider>
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
