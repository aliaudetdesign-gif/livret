// Déclenche un vrai téléchargement (et non une ouverture d'onglet) même pour
// des fichiers cross-origin (storage Supabase) : l'attribut download seul est
// ignoré par les navigateurs sur ce type d'URL. On récupère le fichier en
// blob puis on télécharge depuis une URL locale (même origine).
export async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

// Devine une extension de fichier plausible à partir de l'URL, pour nommer le
// fichier téléchargé (l'URL de storage porte déjà le nom d'origine).
export function guessFilename(label: string, url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? match[1] : "";
  return ext ? `${label}.${ext}` : label;
}
