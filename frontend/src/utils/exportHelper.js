import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
        offsetX: rect.left - minX, // Positive if content extends left
        offsetY: rect.top - minY   // Positive if content extends top
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

const captureFullScroll = async (node) => {
    // For full page export, use the scroll dimensions
    const width = node.scrollWidth;
    const height = node.scrollHeight;

    const style = {
        overflow: 'visible',
        height: 'auto',
        maxHeight: 'none',
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

export const exportToPng = async (elementId, filename = 'export', type = 'slide') => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        let result;
        if (type === 'page') {
            result = await captureFullScroll(node);
        } else {
            result = await captureFitContent(node);
        }

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
        if (type === 'page') {
            result = await captureFullScroll(node);
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
