# CyberTools (my-tools-website)

A small client-side collection of privacy-first tools. All processing happens in the browser — no uploads.

How to run locally

1. Clone the repository

   git clone https://github.com/Shivraj-Gurjar/my-tools-website.git
   cd my-tools-website

2. Start a simple HTTP server (recommended)

   Python 3:
   python3 -m http.server 3000

   or using Node (http-server):
   npx http-server -p 3000

   Then open http://localhost:3000

3. Or open index.html directly in a browser (some features may require serving over HTTP).

Deploy to GitHub Pages

1. Go to the repository Settings → Pages
2. Select branch: `main` and folder: `/ (root)`
3. Save and wait a minute, then visit `https://Shivraj-Gurjar.github.io/my-tools-website/`

Notes

- The Image Compressor supports selecting output format (Auto / JPEG / PNG / WEBP). WEBP support depends on the browser.
- Max upload 50MB. Large files may be slow or hit browser memory limits.
