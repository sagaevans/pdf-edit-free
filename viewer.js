let pdfDoc = null;
let selectedPages = new Set();
let currentFileBytes = null;

// buka dialog pilih file
function selectFile(){
    document.getElementById("fileInput").click();
}

// Load dan render PDF
async function openPDF(event){
    let file = event.target.files[0];
    currentFileBytes = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(currentFileBytes);
    pdfDoc = await loadingTask.promise;

    const container = document.getElementById('pdfContainer');
    container.innerHTML = ""; // reset

    for (let i = 1; i <= pdfDoc.numPages; i++){
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({scale: 0.5});
        
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({canvasContext: context, viewport: viewport}).promise;

        let div = document.createElement("div");
        div.className = "pageBox";
        div.onclick = ()=> toggleSelect(i, div);

        let img = document.createElement("img");
        img.src = canvas.toDataURL();

        let text = document.createElement("p");
        text.innerHTML = "Halaman " + i;

        div.appendChild(img);
        div.appendChild(text);
        container.appendChild(div);
    }
}

// pilih halaman
function toggleSelect(num, elem){
    if(selectedPages.has(num)){
        selectedPages.delete(num);
        elem.classList.remove("selected");
    } else {
        selectedPages.add(num);
        elem.classList.add("selected");
    }
}

// Rotate halaman yang dipilih
async function rotatePage(){
    if(selectedPages.size === 0) return alert("Pilih halaman dulu!");

    const pdf = await PDFLib.PDFDocument.load(currentFileBytes);
    selectedPages.forEach(num=>{
        let page = pdf.getPage(num-1);
        let angle = (page.getRotation().angle + 90) % 360;
        page.setRotation(PDFLib.degrees(angle));
    });

    const out = await pdf.save();
    currentFileBytes = out; // update PDF hasil rotate
    refreshPreview(out);
}

// Delete halaman yang dipilih
async function deletePages(){
    if(selectedPages.size === 0) return alert("Pilih halaman dulu!");

    const pdf = await PDFLib.PDFDocument.load(currentFileBytes);
    const total = pdf.getPageCount();
    const newPdf = await PDFLib.PDFDocument.create();

    for(let i=0;i<total;i++){
        if(!selectedPages.has(i+1)){
            const [page] = await newPdf.copyPages(pdf,[i]);
            newPdf.addPage(page);
        }
    }

    const out = await newPdf.save();
    currentFileBytes = out;
    selectedPages.clear();
    refreshPreview(out);
}

// Refresh viewer setelah edit
function refreshPreview(bytes){
    const blob = new Blob([bytes],{type:"application/pdf"});
    let file = new File([blob],"edited.pdf");
    document.getElementById("fileInput").files = createFileList(file);
    openPDF({target:{files:[file]}})
}

// Trick untuk update input file
function createFileList(file){
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
}

// Download PDF
function downloadPDF(){
    if(!currentFileBytes) return alert("Belum ada PDF!");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([currentFileBytes],{type:"application/pdf"}));
    a.download = "edited.pdf";
    a.click();
}
