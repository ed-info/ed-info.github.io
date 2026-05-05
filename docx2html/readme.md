# DOCX to HTML Converter — User Manual

A browser-based tool that converts Microsoft Word documents (`.docx`) into clean, self-contained HTML files. All processing happens locally — no files are sent to any server.

---

## Requirements

- A modern browser (Chrome, Firefox, Edge, Safari)
- A `.docx` file created in Microsoft Word or a compatible editor
- Internet connection on first load (to fetch the two JavaScript libraries used for rendering)

---

## Step-by-Step Usage

### 1. Choose a file

Click **📁 Choose DOCX file** and select a `.docx` file, or drag and drop a file anywhere onto the toolbar area.

The app will:
- Render the document in the **Preview** pane
- Extract all embedded images
- Generate a ZIP archive containing the HTML file and a `media/` folder with all images

The status bar shows progress through each stage: *Rendering document → Fixing table of contents links → Processing images → Creating ZIP archive.*

### 2. Preview the result

The **Preview** pane shows the converted document rendered in an iframe. Use it to verify that formatting, images, and the table of contents look correct before downloading.

The image counter in the top-right of the preview area shows how many images were extracted (e.g. `🖼️ Images: 12 (in media folder)`).

### 3. Optimize HTML *(optional)*

Click **⚡ Optimize HTML** to reduce the size of the generated HTML file.

The optimizer performs three passes:

| Pass | What it does |
|------|-------------|
| Remove empty tags | Deletes `<span>` elements with no attributes and no content |
| Style deduplication | Removes inline `style` from `<span>` elements whose style is identical to the preceding sibling — CSS inheritance takes over |
| CSS class extraction | Collects inline styles that appear 2+ times and replaces them with shared utility classes (`.docx-content ._o1`, etc.) |

After optimization, a stats panel appears showing:

- **before / after** — HTML file size in KB
- **reduction** — percentage size decrease
- **CSS classes** — number of utility classes generated
- **tags removed** — number of empty `<span>` elements deleted

> The ZIP downloaded after optimization contains the optimized HTML and carries `_optimized` in the archive filename.

### 4. Download ZIP

Click **📦 Download ZIP (HTML + media/)** to save the archive.

The archive contains:

```
your-document.zip
├── your-document.html      ← the converted HTML file
└── media/
    ├── image_001.png
    ├── image_002.png
    └── ...
```

To view the HTML file correctly, always keep the `media/` folder in the **same directory** as the `.html` file. Moving the HTML without the folder will break all images.

### 5. Clear

Click **🗑️ Clear** to reset the app and load a new file.

---

## Table of Contents (TOC)

If your Word document contains an **automatically generated table of contents** (inserted via *References → Table of Contents* in Word), the converter handles it specially:

- The original TOC block is **hidden** in the document body — it is replaced by an interactive floating button
- A **📖 Contents** button appears in the top-right corner of the converted HTML page
- Clicking the button opens a modal panel listing all TOC entries without page numbers
- Clicking any entry closes the panel and **scrolls** to the corresponding heading
- The panel closes when you click outside it or press `Escape`

> **Note:** TOC detection relies on the presence of tab-stop spans and page number spans that Word generates automatically. Manually typed tables of contents are not detected.

---

## Mobile Viewing

The generated HTML is responsive:

- Page margins are reduced on screens ≤ 600 px wide (`.docx-content` padding is set to `10px` instead of the original `~75px`)
- Images scale to fit the screen width
- Wide tables scroll horizontally within their own container — the rest of the page does not scroll sideways
- The **📖 Contents** button stays within the visible screen area and the modal expands to full width on small screens

---

## Output HTML Structure

The generated HTML file is a single self-contained page:

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document title</title>
  <style>
    /* Base responsive styles */
    /* TOC modal styles (if TOC was detected) */
    /* Optimizer utility classes (if optimized) */
  </style>
</head>
<body>
  <!-- Rendered document content -->

  <!-- TOC button + modal (if TOC was detected) -->
  <button id="toc-fab">📖 Contents</button>
  <div id="toc-overlay">...</div>
</body>
</html>
```

Images are referenced as relative paths: `src="media/image_001.png"`.

---

## Limitations

| Limitation | Details |
|-----------|---------|
| File format | Only `.docx` files are supported. `.doc`, `.odt`, `.rtf` are not accepted |
| Page breaks | The output is a single scrollable page — Word page breaks are not preserved |
| Complex layouts | Text boxes, WordArt, SmartArt, and some drawing objects may not render correctly |
| Fonts | Custom fonts not available in the browser fall back to system fonts |
| Headers & footers | Page headers and footers are not included in the output |
| Comments & tracked changes | Not rendered |
| TOC detection | Only auto-generated Word TOCs are supported (must contain tab-stop + page number structure) |

---

## Privacy

All conversion happens **entirely in your browser**. No document content, text, or images are uploaded to any external server. The only network requests made are to load the two open-source libraries on startup:

- [`jszip`](https://stuk.github.io/jszip/) — for creating the ZIP archive
- [`docx-preview`](https://github.com/VolodymyrBaydalka/docx-preview) — for rendering the DOCX document
