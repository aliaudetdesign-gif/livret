// Génère un aperçu PNG de la première page d'un PDF, entièrement côté
// navigateur (canvas). Utilisé pour les logos déposés uniquement en PDF ainsi
// que pour tout document PDF ajouté dans une section complémentaire, afin
// d'afficher une vraie miniature plutôt qu'une icône générique. Best effort :
// une erreur ici ne doit jamais empêcher l'ajout du fichier.
export async function generatePdfPreview(file: File): Promise<Blob | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } catch {
    return null;
  }
}
