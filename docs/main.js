
document.querySelector('input').addEventListener('change', async (event) => {
  const file = await event.target.files[0];
  const canvas = document.getElementById("the-canvas");
  await renderFileToCanvas(file, canvas);
});

document.querySelector('#download-png').addEventListener('click', async () => {
  const canvas = document.getElementById("the-canvas");
  await downloadPNG(canvas);
});

async function renderFileToCanvas(file, canvas) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    renderImageToCanvas(img, canvas);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function renderImageToCanvas(img, canvas) {
  const context = canvas.getContext("2d");
  const desiredOutputWidth = 3840;
  const desiredOutputHeight = 2160;

  canvas.width = desiredOutputWidth;
  canvas.height = desiredOutputHeight;
  canvas.style.width = desiredOutputWidth + "px";
  canvas.style.height = desiredOutputHeight + "px";

  const outputScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const scaledWidth = img.naturalWidth * outputScale;
  const scaledHeight = img.naturalHeight * outputScale;
  const offsetX = (canvas.width - scaledWidth) / 2;
  const offsetY = (canvas.height - scaledHeight) / 2;

  context.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
}

async function downloadPNG(canvas) {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Unable to render selected file.');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'page.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
