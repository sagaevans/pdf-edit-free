async function getPDF(index=0){
 let files = document.getElementById("pdfFiles").files;
 if(files.length===0){ alert("Upload PDF!"); return; }
 return await files[index].arrayBuffer();
}

// ================= REMOVE PAGE =================
async function removePagesFunc(){
 let input=document.getElementById("removePages").value.split(",").map(n=>parseInt(n)-1);
 const pdfBytes = await getPDF();
 const pdf = await PDFLib.PDFDocument.load(pdfBytes);
 const newPdf = await PDFLib.PDFDocument.create();
 const total=pdf.getPageCount();

 for(let i=0;i<total;i++){
   if(!input.includes(i)){
     const [page] = await newPdf.copyPages(pdf,[i]);
     newPdf.addPage(page);
   }
 }
 const bytes=await newPdf.save();
 download(bytes,"edited-removed.pdf");
}

// ================= ROTATE PAGE =================
async function rotatePageFunc(){
 let pageNum=parseInt(document.getElementById("rotatePage").value)-1;
 let deg=parseInt(document.getElementById("rotateDeg").value);

 const pdfBytes = await getPDF();
 const pdf=await PDFLib.PDFDocument.load(pdfBytes);
 const page=pdf.getPage(pageNum);
 page.setRotation(PDFLib.degrees(deg));

 const bytes=await pdf.save();
 download(bytes,"rotated.pdf");
}

// ================= SPLIT PDF =================
async function splitPDF(){
 const pdfBytes=await getPDF();
 const pdf=await PDFLib.PDFDocument.load(pdfBytes);

 for(let i=0;i<pdf.getPageCount();i++){
   const newPdf=await PDFLib.PDFDocument.create();
   const [page] = await newPdf.copyPages(pdf,[i]);
   newPdf.addPage(page);
   const bytes=await newPdf.save();
   download(bytes,`split_page_${i+1}.pdf`);
 }
}

// ================= MERGE PDF =================
async function mergePDF(){
 let files=document.getElementById("pdfFiles").files;
 if(files.length<2){ alert("Upload minimal 2 PDF!"); return; }

 const merged=await PDFLib.PDFDocument.create();

 for(let f of files){
   let buffer=await f.arrayBuffer();
   let pdf=await PDFLib.PDFDocument.load(buffer);
   let pages=await merged.copyPages(pdf,pdf.getPageIndices());
   pages.forEach(p=>merged.addPage(p));
 }
 const bytes=await merged.save();
 download(bytes,"merged.pdf");
}

// ================= DOWNLOAD =================
function download(bytes,name){
 const a=document.createElement("a");
 a.href=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
 a.download=name;
 a.click();
}
