function exportCard(cardId) {
    const cardElement = document.getElementById(cardId);
    const content = cardElement.querySelector('.card-content').cloneNode(true);

    // Create the container wrapper
    const wrapper = document.getElementById('export-container-wrapper');
    wrapper.innerHTML = ''; // Clear previous

    // Create the export frame
    const exportFrame = document.createElement('div');
    exportFrame.classList.add('export-frame');

    // Add specific classes if needed for centering
    if (cardId === 'card-cta' || cardId === 'card-diagram') {
        exportFrame.classList.add('center-all');
    }

    // Inject content
    exportFrame.appendChild(content);

    // Add optional footer or watermark if desired
    // const footer = document.createElement('div');
    // footer.classList.add('export-footer');
    // footer.innerText = 'mysite.com';
    // exportFrame.appendChild(footer);

    wrapper.appendChild(exportFrame);

    // Wait for a tick to ensure styles are applied
    setTimeout(() => {
        html2canvas(exportFrame, {
            scale: 1, // 1080px is already large enough
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Create download link
            const link = document.createElement('a');
            link.download = `slide-${cardId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Cleanup (optional, useful for debugging to leave it)
            wrapper.innerHTML = '';
        });
    }, 100);
}
