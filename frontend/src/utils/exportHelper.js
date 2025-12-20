import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// Helper for single slide export (unchanged)
const getBoundingBox = (node) => {
    const rect = node.getBoundingClientRect();
    let minX = rect.left;
    let minY = rect.top;
    let maxX = rect.right;
    let maxY = rect.bottom;

    const children = node.querySelectorAll('*');
    children.forEach((child) => {
        const r = child.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;

        if (r.left < minX) minX = r.left;
        if (r.top < minY) minY = r.top;
        if (r.right > maxX) maxX = r.right;
        if (r.bottom > maxY) maxY = r.bottom;
    });

    return {
        width: maxX - minX,
        height: maxY - minY,
        offsetX: rect.left - minX,
        offsetY: rect.top - minY
    };
};

const captureFitContent = async (node) => {
    const box = getBoundingBox(node);
    const padding = 0;
    const width = box.width + (padding * 2);
    const height = box.height + (padding * 2);

    const style = {
        overflow: 'visible',
        height: 'auto',
        maxHeight: 'none',
        transform: `translate(${box.offsetX + padding}px, ${box.offsetY + padding}px)`
    };

    const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        style: style
    });

    return { dataUrl, width, height };
};

// New logic: Clone the DOM, remove scroll constraints, then capture.
const prepareClone = (node) => {
    const clone = node.cloneNode(true);
    const container = document.createElement('div');

    // Position off-screen but visible to the rendering engine
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    // Use the same width as the original to maintain layout, but allow height to grow
    container.style.width = `${node.offsetWidth}px`;
    container.style.height = 'auto';
    container.style.overflow = 'visible';

    // Append clone
    container.appendChild(clone);
    document.body.appendChild(container);

    // 1. Expand Root
    clone.style.height = 'auto';
    clone.style.minHeight = 'auto';
    clone.style.overflow = 'visible';
    clone.style.maxHeight = 'none';

    // 2. Expand Slides
    // Looking for elements that match the slide pattern.
    // In SlideBlock.jsx: id={`slide-content-${block.id}`}
    const slides = clone.querySelectorAll('[id^="slide-content-"]');
    slides.forEach(slide => {
        // Remove aspect ratio constraint
        slide.style.aspectRatio = 'unset';
        slide.style.height = 'auto';
        slide.style.maxHeight = 'none';

        // Find the inner scroller.
        // Based on SlideBlock.jsx: <div className="... overflow-y-auto ...">
        const scrollers = slide.querySelectorAll('.overflow-y-auto');
        scrollers.forEach(scroller => {
            scroller.style.overflow = 'visible';
            scroller.style.height = 'auto';
            scroller.style.maxHeight = 'none';
        });
    });

    return { container, clone };
};

const captureCanvasViaClone = async (originalNode) => {
    const { container, clone } = prepareClone(originalNode);

    // Force reflow
    const _ = clone.offsetHeight;

    // Calculate dimensions based on the expanded content
    const width = clone.scrollWidth;
    const height = clone.scrollHeight;

    // Ensure images are loaded in the clone
    // Since we cloned deep, the src attributes are there.
    // Browsers might re-request them or use cache.
    // We should wait a moment for the DOM to settle and images to be "ready".
    const images = clone.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if one fails
        });
    });

    await Promise.all(imagePromises);

    try {
        const dataUrl = await toPng(clone, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: width,
            height: height,
            cacheBust: true, // Forces reload if needed, can help with stale/missing images
        });
        return { dataUrl, width, height };
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

export const exportSlideToPng = async (elementId, filename = 'slide') => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        const result = await captureFitContent(node);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = result.dataUrl;
        link.click();
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed');
    }
};

export const exportCanvasToPng = async (elementId, filename = 'canvas') => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        // Use the new cloning method
        const result = await captureCanvasViaClone(node);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = result.dataUrl;
        link.click();
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed');
    }
};

export const exportToPdf = async (elementId, filename = 'export', type = 'slide') => {
    const node = document.getElementById(elementId);
    if (!node) return;

    try {
        let result;
        if (type === 'page' || type === 'canvas') {
            // Use the new cloning method for PDF canvas export as well
            result = await captureCanvasViaClone(node);
        } else {
            result = await captureFitContent(node);
        }

        const { dataUrl, width, height } = result;

        const pdf = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: 'px',
            format: [width, height]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`${filename}.pdf`);
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed');
    }
};
