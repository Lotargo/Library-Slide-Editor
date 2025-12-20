import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const exportToPng = async (elementId, filename = 'export') => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        const dataUrl = await toPng(node, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed');
    }
};

export const exportToPdf = async (elementId, filename = 'export') => {
    const node = document.getElementById(elementId);
    if (!node) return;

    try {
        const dataUrl = await toPng(node, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff'
        });

        // Calculate dimensions
        // node.offsetWidth is CSS pixels.
        // We want PDF to match visual size.
        const width = node.offsetWidth;
        const height = node.offsetHeight;

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
