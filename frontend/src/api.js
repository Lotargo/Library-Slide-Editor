
const API_BASE = '/api';

export const api = {
    // Workspaces
    getWorkspaces: async () => {
        const res = await fetch(`${API_BASE}/workspaces`);
        return res.json();
    },
    createWorkspace: async (name) => {
        const res = await fetch(`${API_BASE}/workspaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return res.json();
    },
    getWorkspace: async (id) => {
        const res = await fetch(`${API_BASE}/workspaces/${id}`);
        if (!res.ok) return null;
        return res.json();
    },
    deleteWorkspace: async (id) => {
        await fetch(`${API_BASE}/workspaces/${id}`, { method: 'DELETE' });
    },

    // Pages
    createPage: async (workspaceId, title) => {
        const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        return res.json();
    },
    getPage: async (id) => {
        const res = await fetch(`${API_BASE}/pages/${id}`);
        if (!res.ok) return null;
        return res.json();
    },
    updatePage: async (id, data) => {
        const res = await fetch(`${API_BASE}/pages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    deletePage: async (id) => {
        await fetch(`${API_BASE}/pages/${id}`, { method: 'DELETE' });
    },

    // Fonts
    getFonts: async () => {
        const res = await fetch(`${API_BASE}/fonts`);
        return res.json();
    },

    // Files
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    }
};
