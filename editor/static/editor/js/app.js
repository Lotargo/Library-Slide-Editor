
let currentSession = {
    id: null,
    name: "New Session",
    slides: []
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupSidebar();
    setupToolbar();
    setupFonts();

    await loadSessionList();

    // Check URL or local storage for last session?
    // For now, if list is not empty, load first. Else create new.
    const sessions = await fetchSessions();
    if (sessions.length > 0) {
        loadSession(sessions[0].id);
    } else {
        createNewSession();
    }
}

/* ================= API ================= */
async function fetchSessions() {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    return data.sessions || [];
}

async function fetchSession(id) {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) return await res.json();
    return null;
}

async function saveSessionApi(session) {
    let url = '/api/sessions';
    let method = 'POST';
    if (session.id) {
        url = `/api/sessions/${session.id}`;
        method = 'PUT';
    }

    // Prepare data
    // We need to scrape the DOM to get latest content if we are not binding 100% live
    // But better to bind data.
    // Let's rely on `currentSession` state being updated on input events.

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
    });
    return await res.json();
}

async function fetchFonts() {
    const res = await fetch('/api/fonts');
    const data = await res.json();
    return data.fonts || [];
}

async function uploadFontApi(file, name) {
    const formData = new FormData();
    formData.append('font_file', file);
    formData.append('font_name', name);

    const res = await fetch('/api/fonts', {
        method: 'POST',
        body: formData
    });
    return await res.json();
}

/* ================= Sidebar ================= */
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const showBtn = document.getElementById('show-sidebar-btn');

    function toggle() {
        sidebar.classList.toggle('hidden');
        if (sidebar.classList.contains('hidden')) {
            showBtn.style.display = 'block';
        } else {
            showBtn.style.display = 'none';
        }
    }

    toggleBtn.addEventListener('click', toggle);
    showBtn.addEventListener('click', toggle);

    document.getElementById('new-session-btn').addEventListener('click', createNewSession);
}

async function loadSessionList() {
    const sessions = await fetchSessions();
    const list = document.getElementById('session-list');
    list.innerHTML = '';

    sessions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s.name || 'Untitled';
        li.dataset.id = s.id;
        li.onclick = () => loadSession(s.id);
        list.appendChild(li);
    });
}

async function loadSession(id) {
    const session = await fetchSession(id);
    if (session) {
        currentSession = session;
        // Fix _id mapping
        currentSession.id = session.id || session._id;
        renderSession();
        updateActiveSessionInSidebar(id);
    }
}

async function createNewSession() {
    currentSession = {
        name: "New Session " + new Date().toLocaleTimeString(),
        slides: [
            { ratio: "16/9", blocks: [{type: 'text', content: '<h2>Hello World</h2><p>Edit me...</p>'}] }
        ]
    };
    // Save immediately to get ID
    const saved = await saveSessionApi(currentSession);
    currentSession.id = saved.id;
    await loadSessionList();
    updateActiveSessionInSidebar(currentSession.id);
    renderSession();
}

function updateActiveSessionInSidebar(id) {
    document.querySelectorAll('#session-list li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.id === id) li.classList.add('active');
    });
}


/* ================= Editor ================= */

function renderSession() {
    const container = document.getElementById('editor-container');
    container.innerHTML = '';

    if (!currentSession.slides) currentSession.slides = [];

    currentSession.slides.forEach((slide, index) => {
        const el = createSlideElement(slide, index);
        container.appendChild(el);
    });

    // Add Slide Button
    document.getElementById('add-slide-btn').onclick = () => {
        currentSession.slides.push({
            ratio: "16/9",
            blocks: [{type: 'text', content: '<p>New Slide</p>'}]
        });
        renderSession();
        triggerSave();
    };

    // Initialize Mermaid
    runMermaid();
}

function createSlideElement(slide, slideIndex) {
    const template = document.getElementById('slide-template');
    const clone = template.content.cloneNode(true);
    const wrapper = clone.querySelector('.slide-wrapper');

    // Controls
    const ratioSelect = wrapper.querySelector('.aspect-ratio-select');
    ratioSelect.value = slide.ratio || '16/9';
    ratioSelect.onchange = (e) => {
        slide.ratio = e.target.value;
        updateSlideRatio(contentDiv, slide.ratio);
        triggerSave();
    };

    wrapper.querySelector('.delete-slide-btn').onclick = () => {
        if(confirm('Delete this slide?')) {
            currentSession.slides.splice(slideIndex, 1);
            renderSession();
            triggerSave();
        }
    };

    wrapper.querySelector('.export-slide-btn').onclick = () => {
        exportSlide(contentDiv);
    };

    // Content
    const contentDiv = wrapper.querySelector('.slide-content');
    updateSlideRatio(contentDiv, slide.ratio);

    slide.blocks.forEach((block, blockIndex) => {
        const blockEl = createBlockElement(block, slideIndex, blockIndex);
        contentDiv.appendChild(blockEl);
    });

    // Add Blocks Buttons
    wrapper.querySelector('.add-text-btn').onclick = () => {
        slide.blocks.push({ type: 'text', content: '<p>New text</p>' });
        renderSession();
        triggerSave();
    };
    wrapper.querySelector('.add-mermaid-btn').onclick = () => {
        slide.blocks.push({ type: 'mermaid', content: 'graph TD; A-->B;' });
        renderSession();
        triggerSave();
    };

    return wrapper;
}

function updateSlideRatio(el, ratio) {
    if (ratio === 'auto') {
        el.style.aspectRatio = 'unset';
        el.style.minHeight = '200px';
    } else {
        el.style.aspectRatio = ratio;
        el.style.minHeight = 'unset'; // Let aspect-ratio drive it
        // Note: content might overflow.
    }
}

function createBlockElement(block, slideIndex, blockIndex) {
    const div = document.createElement('div');
    div.classList.add('block-wrapper');

    if (block.type === 'text') {
        const content = document.createElement('div');
        content.classList.add('content-block');
        content.contentEditable = true;
        content.innerHTML = block.content;

        // Save on blur or input
        content.addEventListener('input', () => {
            block.content = content.innerHTML;
            triggerAutoSave();
        });

        div.appendChild(content);

    } else if (block.type === 'mermaid') {
        const container = document.createElement('div');
        container.classList.add('mermaid-block');

        const preview = document.createElement('div');
        preview.classList.add('mermaid-preview');
        preview.classList.add('mermaid'); // Class for mermaid to pick up? No, we run manually.
        preview.innerHTML = block.content; // Logic to render happens later

        const editor = document.createElement('div');
        editor.classList.add('mermaid-editor');
        editor.style.display = 'none';

        const textarea = document.createElement('textarea');
        textarea.value = block.content;

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.onclick = (e) => {
            e.stopPropagation();
            block.content = textarea.value;
            editor.style.display = 'none';
            preview.style.display = 'block';
            renderSingleMermaid(preview, block.content);
            triggerSave();
        };

        editor.appendChild(textarea);
        editor.appendChild(updateBtn);

        container.appendChild(preview);
        container.appendChild(editor);
        div.appendChild(container);

        // Toggle Edit
        container.onclick = () => {
            if (editor.style.display === 'none') {
                editor.style.display = 'flex';
                preview.style.display = 'none';
            }
        };
    }

    return div;
}

/* ================= Mermaid ================= */
async function runMermaid() {
    // Re-render all mermaid blocks
    // In our manual approach, we render individually
    const blocks = document.querySelectorAll('.mermaid-preview');
    for (let block of blocks) {
        // If it doesn't have an SVG yet, try to render.
        // Actually, we store raw text in block.content.
        // wait, createBlockElement put innerHTML = block.content
        // We need to render it.
        const code = block.textContent; // or from data
        if (!block.querySelector('svg')) {
           await renderSingleMermaid(block, code);
        }
    }
}

async function renderSingleMermaid(element, code) {
    try {
        const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), code);
        element.innerHTML = svg;
    } catch (e) {
        element.innerHTML = `<span style="color:red">Syntax Error: ${e.message}</span>`;
    }
}

/* ================= Fonts & Toolbar ================= */
async function setupFonts() {
    const fonts = await fetchFonts();
    const select = document.getElementById('font-family-select');

    // Add fonts to document
    fonts.forEach(f => {
        const fontFace = new FontFace(f.name, `url(${f.url})`);
        fontFace.load().then(loaded => {
            document.fonts.add(loaded);
        });

        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = f.name;
        select.appendChild(opt);
    });

    // Listeners
    select.onchange = () => {
        document.execCommand('fontName', false, select.value);
    };

    document.getElementById('font-upload').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const res = await uploadFontApi(file, file.name);
        if (res.success) {
            // Add to list
            const opt = document.createElement('option');
            opt.value = res.filename.split('.')[0]; // approximate name
            opt.textContent = res.filename;
            select.appendChild(opt);

            // Load font
            const fontFace = new FontFace(opt.value, `url(${res.url})`);
            fontFace.load().then(loaded => {
                document.fonts.add(loaded);
                select.value = opt.value;
                document.execCommand('fontName', false, opt.value);
            });
            alert('Font uploaded!');
        }
    };
}

function setupToolbar() {
    document.getElementById('bold-btn').onclick = () => document.execCommand('bold');
    document.getElementById('italic-btn').onclick = () => document.execCommand('italic');

    const sizeInput = document.getElementById('font-size-input');
    sizeInput.onchange = () => {
        // execCommand fontSize uses 1-7 scale, which sucks.
        // We should use span with inline style.
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const span = document.createElement('span');
            span.style.fontSize = sizeInput.value + 'px';
            const range = selection.getRangeAt(0);
            range.surroundContents(span);
        }
    };

    document.getElementById('save-btn').onclick = () => triggerSave(true);
}

/* ================= Saving & Export ================= */
let saveTimer = null;
function triggerAutoSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => triggerSave(), 2000);
}

async function triggerSave(force = false) {
    const status = document.getElementById('save-status');
    status.textContent = 'Saving...';
    try {
        await saveSessionApi(currentSession);
        status.textContent = 'Saved';
        setTimeout(() => status.textContent = '', 2000);
        if (force) loadSessionList(); // Update sidebar name if changed
    } catch (e) {
        status.textContent = 'Error saving';
        console.error(e);
    }
}

function exportSlide(element) {
    html2canvas(element, {
        scale: 2, // High res
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `slide.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
