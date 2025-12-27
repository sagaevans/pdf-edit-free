let pdfDoc = null;
let pdfBytes = null;
let selectedPages = [];
let pageRotation = {};
let viewer = document.getElementById("pdfContainer");
let fileInput = document.getElementById("fileInput");

// ================= OPEN FILE =================
function selectFile(){ fileInput.click(); }

async function openPDF(e){
    const file = e.target.files[0];
    if(!file) return;

    pdfBytes = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({data:pdfBytes}).promise;

    renderPDF();
}

// ================= RENDER VIEW =================
async function renderPDF(){
    viewer.innerHTML="";
    selectedPages=[];

    for(let i=1;i<=pdfDoc.numPages;i++){
        const page = await pdfDoc.getPage(i);
        const rotation = pageRotation[i]||0;
        const viewport = page.getViewport({scale:0.35,rotation});

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width; canvas.height = viewport.height;

        await page.render({canvasContext:ctx,viewport}).promise;

        const box = document.createElement("div");
        box.className="pageBox";
        box.innerHTML=`<img src="${canvas.toDataURL()}"><div>Halaman ${i}</div>`;
        box.onclick=()=>selectPage(i,box);

        viewer.appendChild(box);
    }
}

// ============= SELECT PAGES =============
function selectPage(i,box){
    if(selectedPages.includes(i)){
        selectedPages = selectedPages.filter(p=>p!==i);
        box.classList.remove("selected");
    }else{
        selectedPages.push(i);
        box.classList.add("selected");
    }
}

// ============= ROTATE =============
async function rotatePage(){
    if(selectedPages.length==0) return alert("Pilih halaman dulu");

    selectedPages.forEach(p=> pageRotation[p]=(pageRotation[p]||0)+90);
    renderPDF();
}

// ============= DELETE =============
async function deletePages(){
    if(selectedPages.length==0) return alert("Pilih halaman yang akan dihapus");

    const {PDFDocument}=PDFLib;
    const newPdf=await PDFDocument.create();
    const src=await PDFDocument.load(pdfBytes);

    for(let i=1;i<=src.getPageCount();i++){
        if(!selectedPages.includes(i)){
            const [pg]=await newPdf.copyPages(src,[i-1]);
            newPdf.addPage(pg);
        }
    }

    pdfBytes=await newPdf.save();
    pdfDoc=await pdfjsLib.getDocument({data:pdfBytes}).promise;

    selectedPages=[];
    renderPDF();
}

// ============= EXPORT (FULL ROTATION FIX) =============
async function downloadPDF(){
    const {PDFDocument,degrees}=PDFLib;
    const original=await PDFDocument.load(pdfBytes);
    const newPDF=await PDFDocument.create();

    for(let i=0;i<original.getPageCount();i++){
        const [pg]=await newPDF.copyPages(original,[i]);

        if(pageRotation[i+1]) pg.setRotation(degrees(pageRotation[i+1] % 360));
        newPDF.addPage(pg);
    }

    const out=await newPDF.save();
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([out],{type:"application/pdf"}));
    a.download="edited.pdf";
    a.click();
}

// ============= INSERT / MERGE PDF =============
async function insertPDF(){
    const pick=document.createElement("input");
    pick.type="file"; pick.accept="application/pdf";

    pick.onchange=async(e)=>{
        const file=e.target.files[0];
        if(!file) return;

        const add=await file.arrayBuffer();
        const {PDFDocument}=PDFLib;

        const base=await PDFDocument.load(pdfBytes);
        const src=await PDFDocument.load(add);

        const pages=await base.copyPages(src,src.getPageIndices());
        pages.forEach(p=>base.addPage(p));

        pdfBytes=await base.save();
        pdfDoc=await pdfjsLib.getDocument({data:pdfBytes}).promise;

        renderPDF();
        alert("Berhasil menambahkan PDF!");
    };
    pick.click();
}
