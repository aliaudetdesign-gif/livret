// Structure fixe des questions posées lors du premier rendez-vous client.
// Les réponses sont stockées dans projects.brief (jsonb), une clé par champ.

export type BriefFieldType = "text" | "textarea";

export interface BriefField {
  key: string;
  label: string;
  type: BriefFieldType;
}

export interface BriefSection {
  title: string;
  icon: string;
  fields: BriefField[];
}

export const briefSections: BriefSection[] = [
  {
    title: "Informations générales",
    icon: "🧾",
    fields: [
      { key: "nom_client", label: "Nom du client / entreprise", type: "text" },
      { key: "contact", label: "Contact (email / téléphone)", type: "text" },
      { key: "date_brief", label: "Date du brief", type: "text" },
      { key: "personne_en_charge", label: "Personne en charge du projet", type: "text" },
    ],
  },
  {
    title: "À propos du projet",
    icon: "🏪",
    fields: [
      { key: "age_marque", label: "L'âge de votre marque", type: "textarea" },
      { key: "avenir", label: "Avenir moyen et long terme", type: "textarea" },
      { key: "objectifs", label: "Quels sont vos objectifs avec ce projet ?", type: "textarea" },
    ],
  },
  {
    title: "Cible et positionnement",
    icon: "👥",
    fields: [
      { key: "perception_actuelle", label: "Comment êtes-vous perçu aujourd'hui ?", type: "textarea" },
      { key: "perception_future", label: "Comment souhaitez-vous être perçu demain ?", type: "textarea" },
    ],
  },
  {
    title: "Identité et univers visuel",
    icon: "💡",
    fields: [
      { key: "mots_cles", label: "Quels mots décriraient le mieux votre marque ?", type: "textarea" },
      {
        key: "garder_changer",
        label: "Que souhaitez-vous garder, changer ou améliorer dans l'identité actuelle ?",
        type: "textarea",
      },
      {
        key: "emotion",
        label: "Quelle émotion ou impression souhaitez-vous provoquer au premier regard ?",
        type: "textarea",
      },
    ],
  },
  {
    title: "Supports et usages",
    icon: "⚙️",
    fields: [
      { key: "supports_existants", label: "Supports déjà existants", type: "textarea" },
      { key: "nouveaux_supports", label: "Nouveaux supports", type: "textarea" },
    ],
  },
  {
    title: "Budget & offres",
    icon: "💰",
    fields: [
      { key: "budget", label: "Avez-vous un budget défini pour ce projet ?", type: "textarea" },
    ],
  },
  {
    title: "Organisation du projet",
    icon: "📆",
    fields: [
      {
        key: "periode_importante",
        label: "Avez-vous une période importante (lancement, événement) à respecter ?",
        type: "textarea",
      },
      { key: "decideur", label: "Qui prend les décisions finales sur le projet ?", type: "textarea" },
    ],
  },
  {
    title: "Ressources à transmettre",
    icon: "📎",
    fields: [
      { key: "ressources", label: "Ressources à transmettre (une par ligne)", type: "textarea" },
    ],
  },
  {
    title: "Remarques supplémentaires",
    icon: "✏️",
    fields: [{ key: "remarques", label: "Remarques supplémentaires", type: "textarea" }],
  },
];

export const briefFieldKeys = briefSections.flatMap((section) =>
  section.fields.map((field) => field.key)
);
