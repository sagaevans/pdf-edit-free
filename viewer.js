let pdfDoc = null;
let pdfBytes = null;
let selectedPages = [];
let pageRotation = {};
let fileInput = document.getElementById("fileInput");
let viewer = document.getElementById("pdfContainer");

function selectFile(){ fileInput.click(); }

// ======================= LOAD PDF ==========================
async function openPDF(e){
    const file = e.target.files[0];
    if(!file) return;
    pdfBytes = await file.arrayBuffer();

    pdfDoc = await pdfjsLib.getDocument({data:pdfBytes}).promise;
    renderPDF();
}

// ======================= RENDER VIEWER ======================
async function renderPDF(){
    viewer.innerHTML = "";
    selectedPages = [];

    for(let i=1; i<=pdfDoc.numPages; i++){
        const page = await pdfDoc.getPage(i);

        let rotationAngle = pageRotation[i] || 0;
        let viewport = page.getViewport({scale:0.35, rotation:rotationAngle});

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({canvasContext:ctx, viewport:viewport}).promise;

        let box = document.createElement("div");
        box.className="pageBox";
        box.innerHTML = `<img src="${canvas.toDataURL()}"><div>Halaman ${i}</div>`;
        box.onclick = ()=> toggle(i,box);

        viewer.appendChild(box);
    }
}

// ======================= SELECT PAGE ========================
function toggle(i, box){
    if(selectedPages.includes(i)){
        selectedPages = selectedPages.filter(p=>p!=i);
        box.classList.remove("selected");
    }else{
        selectedPages.push(i);
        box.classList.add("selected");
    }
}

// ======================= ROTATE =============================
async function rotatePage(){
    if(selectedPages.length==0){ alert("Pilih halaman dulu"); return; }

    selectedPages.forEach(p=>{
        pageRotation[p] = (pageRotation[p]||0) + 90;
    });

    renderPDF();
}

// ======================= DELETE =============================
async function deletePages(){
    if(selectedPages.length==0){ alert("Tidak ada halaman dipilih"); return; }

    const {PDFDocument} = PDFLib;
    const newPDF = await PDFDocument.create();
    const original = await PDFDocument.load(pdfBytes);

    for(let i=1;i<=pdfDoc.numPages;i++){
        if(!selectedPages.includes(i)){
            const [pg] = await newPDF.copyPages(original,[i-1]);
            newPDF.addPage(pg);
        }
    }

    pdfBytes = await newPDF.save();
    pdfDoc   = await pdfjsLib.getDocument({data:pdfBytes}).promise;

    selectedPages = [];
    renderPDF();
}

// ======================= EXPORT =============================
async function downloadPDF(){
    const {PDFDocument} = PDFLib;
    const newPDF = await PDFDocument.create();
    const original = await PDFDocument.load(pdfBytes);

    for(let i=1;i<=pdfDoc.numPages;i++){
        const [pg] = await newPDF.copyPages(original,[i-1]);
        if(pageRotation[i]) pg.setRotation(pageRotation[i]);
        newPDF.addPage(pg);
    }

    const data = await newPDF.save();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data],{type:"application/pdf"}));
    a.download = "edited.pdf";
    a.click();
}

// ======================= INSERT / MERGE PDF =================
async function insertPDF(){
    const picker = document.createElement("input");
    picker.type="file"; picker.accept="application/pdf";
    picker.onchange = async(e)=>{

        const file = e.target.files[0];
        if(!file) return;

        const addBytes = await file.arrayBuffer();
        const {PDFDocument} = PDFLib;

        const base = await PDFDocument.load(pdfBytes);
        const mergePDF = await PDFDocument.load(addBytes);

        const pages = await base.copyPages(mergePDF,
            mergePDF.getPageIndices()
        );
        pages.forEach(p=> base.addPage(p)); // 🔥 Tambah ke belakang

        pdfBytes = await base.save();
        pdfDoc = await pdfjsLib.getDocument({data:pdfBytes}).promise;

        renderPDF();
        alert("PDF berhasil digabung");
    }
    picker.click();
}
