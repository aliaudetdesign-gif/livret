// Délai de rétention avant suppression définitive automatique de la
// corbeille. Isolé dans un module à part (plutôt que dans actions.ts) car un
// fichier "use server" ne peut exporter que des fonctions async : une
// constante ordinaire y ferait échouer le build.
export const TRASH_RETENTION_DAYS = 7;
