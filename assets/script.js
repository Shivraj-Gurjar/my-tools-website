// Global state
let originalFile = null;
let compressedBlob = null;
let compressedFileName = '';
let originalObjectUrl = null;
let compressedObjectUrl = null;

// DOM refs
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const maxWidthSlider = document.getElementById('maxWidth');
const maxWidthValue = document.getElementById('maxWidthValue');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('formatSelect');

// init UI
qualitySlider.addEventListener('input', () => qualityValue.textContent = qualitySlider.value);
maxWidthSlider.addEventListener('input', () => maxWidthValue.textContent = maxWidthSlider.value);

// Drag & drop
['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFile(f);
});
fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

function handleFile(file){
  if (!file.type.startsWith('image/')) return alert('Please upload an image file (JPG, PNG, WEBP)');
  if (file.size > 50 * 1024 * 1024) return alert('File size must be less than 50MB');
  originalFile = file;
  compressImage();
}

function compressImage(){
  showSection('processingSection');
  // revoke old URLs
  if (originalObjectUrl){ URL.revokeObjectURL(originalObjectUrl); originalObjectUrl = null; }
  if (compressedObjectUrl){ URL.revokeObjectURL(compressedObjectUrl); compressedObjectUrl = null; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const quality = parseInt(qualitySlider.value)/100;
      const maxWidth = parseInt(maxWidthSlider.value);
      const maxHeight = maxWidth;
      let width = img.width, height = img.height;
      if (width > maxWidth || height > maxHeight){ const ratio = Math.min(maxWidth/width, maxHeight/height); width = Math.round(width*ratio); height = Math.round(height*ratio); }

      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      let selected = formatSelect.value; // 'auto' or mime
      let outType = 'image/jpeg';
      if (selected === 'auto'){
        outType = originalFile.type === 'image/png' ? 'image/png' : (originalFile.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
      } else {
        outType = selected;
      }

      // For PNG keep quality ignored by toBlob in many browsers; for JPEG/WEBP use quality
      const blob = await new Promise((resolve) => {
        if (outType === 'image/png') return canvas.toBlob(resolve, 'image/png');
        // Some browsers don't support webp in toBlob; try and fallback
        if (outType === 'image/webp'){
          try { return canvas.toBlob((b)=>{ if (b) resolve(b); else canvas.toBlob(resolve, 'image/jpeg', quality); }, 'image/webp', quality); }
          catch(e){ return canvas.toBlob(resolve, 'image/jpeg', quality); }
        }
        canvas.toBlob(resolve, outType, quality);
      });

      compressedBlob = blob || null;
      compressedFileName = 'compressed_' + (originalFile.name.replace(/\.[^/.]+$/, '')) + (outType === 'image/png' ? '.png' : (outType === 'image/webp' ? '.webp' : '.jpg'));

      displayResults(img, width, height);
    };
    img.onerror = () => { alert('Failed to read image'); showSection('uploadSection'); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(originalFile);
}

function displayResults(originalImg, compressedWidth, compressedHeight){
  const originalPreview = document.getElementById('originalPreview');
  const compressedPreview = document.getElementById('compressedPreview');

  originalObjectUrl = URL.createObjectURL(originalFile);
  originalPreview.innerHTML = `<img src="${originalObjectUrl}" alt="Original">`;

  if (compressedBlob){
    compressedObjectUrl = URL.createObjectURL(compressedBlob);
    compressedPreview.innerHTML = `<img src="${compressedObjectUrl}" alt="Compressed">`;
  } else { compressedPreview.innerHTML = '<div class="text-gray-400">Compression failed</div>'; }

  document.getElementById('originalSize').textContent = formatFileSize(originalFile.size);
  document.getElementById('originalDimensions').textContent = `${originalImg.width} × ${originalImg.height}`;

  document.getElementById('compressedSize').textContent = compressedBlob ? formatFileSize(compressedBlob.size) : '-';
  document.getElementById('compressedDimensions').textContent = `${compressedWidth} × ${compressedHeight}`;

  const savedBytes = compressedBlob ? (originalFile.size - compressedBlob.size) : 0;
  const savedPercentage = compressedBlob ? ((savedBytes / originalFile.size) * 100).toFixed(1) : '0.0';
  document.getElementById('savedPercentage').textContent = compressedBlob ? `${savedPercentage}% (${formatFileSize(savedBytes)})` : '-';

  showSection('resultsSection');
}

function formatFileSize(bytes){ if (bytes === 0) return '0 Bytes'; const k=1024; const sizes=['Bytes','KB','MB','GB']; const i=Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i]; }

function downloadCompressedImage(){ if (!compressedBlob) return; const url = compressedObjectUrl || URL.createObjectURL(compressedBlob); const a=document.createElement('a'); a.href=url; a.download=compressedFileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); if (!compressedObjectUrl) URL.revokeObjectURL(url); }

function resetTool(){ originalFile=null; compressedBlob=null; compressedFileName=''; fileInput.value=''; if (originalObjectUrl){ URL.revokeObjectURL(originalObjectUrl); originalObjectUrl=null; } if (compressedObjectUrl){ URL.revokeObjectURL(compressedObjectUrl); compressedObjectUrl=null; } showSection('uploadSection'); }

function showSection(id){ document.getElementById('uploadSection').classList.add('hidden'); document.getElementById('processingSection').classList.add('hidden'); document.getElementById('resultsSection').classList.add('hidden'); document.getElementById(id).classList.remove('hidden'); }

// Utility functions used elsewhere
function scrollToTools(){ document.getElementById('tools-section').scrollIntoView({behavior:'smooth'}); }
function activateTool(id){ console.log('activate', id); if (id==='image-compressor') { document.getElementById('image-compressor').scrollIntoView({behavior:'smooth'}); } }
