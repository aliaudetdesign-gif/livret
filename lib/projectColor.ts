// Attribue une couleur stable (mais visuellement "aléatoire") à un projet,
// dérivée de son id. Même projet = toujours la même couleur, deux projets
// différents = très probablement deux couleurs différentes.

export function getProjectColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return {
    background: `hsl(${hue} 70% 90%)`,
    text: `hsl(${hue} 55% 30%)`,
  };
}
