let pdfDoc = null;
let pdfBytes = null;
let selectedPages = [];
let pageRotation = {}; // 🔥 tracking rotasi per halaman
let fileInput = document.getElementById("fileInput");
let viewer = document.getElementById("pdfContainer");

// == OPEN PDF ==
function selectFile() {
    fileInput.click();
}

async function openPDF(event) {
    const file = event.target.files[0];
    if (!file) return;
    pdfBytes = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    pdfDoc = await loadingTask.promise;

    renderPDF();
}

// == RENDER PDF ==
async function renderPDF() {
    viewer.innerHTML = ""; 
    selectedPages = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);

        let rotationAngle = pageRotation[i] || 0;
        let scale = 0.3;
        let viewport = page.getViewport({ scale: scale, rotation: rotationAngle });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        let div = document.createElement("div");
        div.className = "pageBox";
        div.innerHTML = `<img src="${canvas.toDataURL()}"><div>Halaman ${i}</div>`;

        div.onclick = () => toggleSelect(i, div);

        viewer.appendChild(div);
    }
}

// == SELECT PAGE ==
function toggleSelect(i, div) {
    if (selectedPages.includes(i)) {
        selectedPages = selectedPages.filter(p => p !== i);
        div.classList.remove("selected");
    } else {
        selectedPages.push(i);
        div.classList.add("selected");
    }
}


// ==================== 🔥 ROTATE HANYA HALAMAN TERPILIH ====================

async function rotatePage() {
    if (selectedPages.length === 0) {
        alert("Pilih halaman yang ingin di-rotate!");
        return;
    }

    selectedPages.forEach(p => {
        pageRotation[p] = (pageRotation[p] || 0) + 90;
    });

    renderPDF();
}


// ==================== 🗑 DELETE HALAMAN TERPILIH ====================

async function deletePages() {
    if (!pdfDoc) return;
    if (selectedPages.length === 0) {
        alert("Pilih halaman terlebih dahulu");
        return;
    }

    const { PDFDocument } = PDFLib;
    const newPDF = await PDFDocument.create();
    const original = await PDFDocument.load(pdfBytes);

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (!selectedPages.includes(i)) {
            const [page] = await newPDF.copyPages(original, [i - 1]);
            newPDF.addPage(page);
        }
    }

    pdfBytes = await newPDF.save();
    pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

    selectedPages = [];
    renderPDF();
}


// ==================== 💾 EXPORT PDF ====================

async function downloadPDF() {
    if (!pdfDoc) return;

    const { PDFDocument } = PDFLib;
    const newPDF = await PDFDocument.create();
    const original = await PDFDocument.load(pdfBytes);

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const [page] = await newPDF.copyPages(original, [i - 1]);

        // apply rotation before export
        if (pageRotation[i]) page.setRotation(pageRotation[i]);

        newPDF.addPage(page);
    }

    const finalBytes = await newPDF.save();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([finalBytes], { type: "application/pdf" }));
    link.download = "edited.pdf";
    link.click();
}
