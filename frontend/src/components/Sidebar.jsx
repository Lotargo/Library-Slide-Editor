import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, ChevronRight, ChevronDown, FileText, Trash2, PanelLeftClose } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ onClose }) {
    const [workspaces, setWorkspaces] = useState([]);
    const navigate = useNavigate();
    const { workspaceId, pageId } = useParams();

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        const data = await api.getWorkspaces();
        if (data.workspaces) {
            setWorkspaces(data.workspaces);
        }
    };

    const handleCreateWorkspace = async () => {
        const name = prompt("Workspace Name:");
        if (name) {
            const ws = await api.createWorkspace(name);
            setWorkspaces([ws, ...workspaces]);
            navigate(`/workspace/${ws.id}`);
        }
    };

    const handleDeleteWorkspace = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this workspace?")) {
            await api.deleteWorkspace(id);
            setWorkspaces(workspaces.filter(w => w.id !== id));
            if (workspaceId === id) navigate('/');
        }
    };

    return (
        <aside className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs font-bold">J</div>
                   <h2 className="font-semibold text-gray-700 text-sm">Jules Workspace</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleCreateWorkspace} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors" title="New Workspace">
                        <Plus size={16} />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors" title="Hide Sidebar">
                            <PanelLeftClose size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                 <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</div>
                 {workspaces.map(ws => (
                     <WorkspaceItem
                        key={ws.id}
                        workspace={ws}
                        isActive={ws.id === workspaceId}
                        activePageId={pageId}
                        onDelete={(e) => handleDeleteWorkspace(e, ws.id)}
                     />
                 ))}
                 {workspaces.length === 0 && (
                     <div className="text-sm text-gray-400 px-2">No workspaces</div>
                 )}
            </div>
        </aside>
    );
}

function WorkspaceItem({ workspace, isActive, activePageId, onDelete }) {
    const [expanded, setExpanded] = useState(isActive);
    const [pages, setPages] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (expanded) {
             loadPages();
        }
    }, [expanded]);

    useEffect(() => {
        if (isActive) setExpanded(true);
    }, [isActive]);

    const loadPages = async () => {
        const wsData = await api.getWorkspace(workspace.id);
        if (wsData && wsData.pages) {
            setPages(wsData.pages);
        }
    };

    const handleCreatePage = async (e) => {
        e.stopPropagation();
        const page = await api.createPage(workspace.id, "Untitled");
        setPages([...pages, page]);
        navigate(`/workspace/${workspace.id}/${page.id}`);
    };

    const handleDeletePage = async (e, id) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.confirm("Are you sure you want to delete this page?")) {
            await api.deletePage(id);
            setPages(pages.filter(p => p.id !== id));
        }
    }

    return (
        <div className="mb-1 select-none">
            <div
                className={clsx(
                    "group flex items-center px-2 py-1 rounded cursor-pointer transition-colors",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="p-0.5 rounded hover:bg-gray-300 mr-1 text-gray-400 transition-colors">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <span className="flex-grow text-sm font-medium truncate">{workspace.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center">
                    <button
                        onClick={handleCreatePage}
                        className="p-0.5 hover:bg-gray-300 rounded text-gray-500 transition-opacity mr-1"
                        title="Add Page"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-0.5 hover:bg-red-200 rounded text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Workspace"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="ml-2 pl-2 border-l border-gray-200 mt-0.5 space-y-0.5">
                    {pages.map(page => (
                        <div key={page.id} className="relative group">
                            <Link
                                to={`/workspace/${workspace.id}/${page.id}`}
                                className={clsx(
                                    "block px-2 py-1 text-sm rounded truncate transition-colors flex items-center gap-2 pr-6",
                                    activePageId === page.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                <FileText size={13} className="flex-shrink-0" />
                                <span className="truncate">{page.title}</span>
                            </Link>
                            <button
                                onClick={(e) => handleDeletePage(e, page.id)}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-200 rounded text-gray-400 hover:text-red-500 transition-all"
                                title="Delete Page"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {pages.length === 0 && <div className="text-xs text-gray-400 px-2 py-1 italic">Empty</div>}
                </div>
            )}
        </div>
    )
}
