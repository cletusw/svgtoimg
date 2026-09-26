
import JSZip from 'jszip';

const fileInput = document.querySelector('#file-input');
const browseButton = document.querySelector('#browse-files');
const dropZone = document.querySelector('#drop-zone');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const downloadAllButton = document.querySelector('#download-all');
let convertedFiles = [];
let isProcessing = false;

browseButton.addEventListener('click', () => fileInput.click());

downloadAllButton.addEventListener('click', async () => {
  if (!convertedFiles.length) return;

  downloadAllButton.disabled = true;
  try {
    const zip = new JSZip();
    for (const { filename, blob } of convertedFiles) {
      zip.file(filename, blob);
    }
    const archive = await zip.generateAsync({ type: 'blob' });
    downloadBlob(archive, 'converted-images.zip');
  } catch (error) {
    status.textContent = `Unable to create ZIP: ${error.message}`;
  } finally {
    downloadAllButton.disabled = convertedFiles.length === 0;
  }
});

fileInput.addEventListener('change', () => {
  processFiles(Array.from(fileInput.files));
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('is-dragging');
});

dropZone.addEventListener('dragleave', (event) => {
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove('is-dragging');
  }
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dragging');
  processFiles(Array.from(event.dataTransfer.files));
});

async function processFiles(files) {
  if (isProcessing || !files.length) return;

  isProcessing = true;
  browseButton.disabled = true;
  convertedFiles = [];
  downloadAllButton.disabled = true;
  results.replaceChildren();
  status.textContent = `Converting ${files.length} file(s)...`;

  const items = files.map((file) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = file.name;
    item.append(name);
    results.append(item);
    return { item, name };
  });

  let converted = 0;
  try {
    for (const [index, file] of files.entries()) {
      const { item, name } = items[index];

      try {
        const blob = await convertSvgToPng(file);
        const baseName = file.name.replace(/\.svg$/i, '') || 'image';
        const filename = `${String(index + 1).padStart(3, '0')}-${baseName}.png`;
        convertedFiles.push({ filename, blob });
        converted++;
      } catch (error) {
        item.classList.add('error');
        name.textContent = `${file.name}: ${error.message}`;
      }
    }
  } finally {
    status.textContent = `Converted ${converted} of ${files.length} file(s).`;
    downloadAllButton.disabled = convertedFiles.length === 0;
    fileInput.value = '';
    browseButton.disabled = false;
    isProcessing = false;
  }
}

async function convertSvgToPng(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = new OffscreenCanvas(3840, 2160);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create a 2D canvas context.');
    }

    const outputScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const scaledWidth = img.naturalWidth * outputScale;
    const scaledHeight = img.naturalHeight * outputScale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    context.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
