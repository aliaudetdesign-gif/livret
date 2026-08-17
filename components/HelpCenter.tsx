"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Mail, Phone, Send } from "lucide-react";

// Centre d'aide partagé agence/client : FAQ, fil de support (réponses
// simulées côté client, pas de vrai appel API pour l'instant) et bloc
// contact. Coordonnées de contact volontairement factices, à remplacer plus
// tard par les vraies.

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Comment modifier mon mot de passe ?",
    answer:
      "Rends-toi dans Mon profil > Sécurité, puis renseigne un nouveau mot de passe. Il est actif dès la validation.",
  },
  {
    question: "Comment télécharger un logo dans un format précis ?",
    answer:
      "Depuis la page Logos, sélectionne le ou les formats souhaités (SVG, PNG, PDF...) sous l'aperçu, puis clique sur Télécharger.",
  },
  {
    question: "Où trouver mes documents administratifs ?",
    answer:
      "Dans l'onglet Administratif de l'espace projet : contrats, factures et autres documents partagés y sont classés par catégorie.",
  },
  {
    question: "Comment suivre l'avancement d'un projet ?",
    answer:
      "La barre de progression en haut de la fiche projet indique l'étape en cours, de l'orientation à la livraison finale.",
  },
  {
    question: "Un élément supprimé par erreur peut-il être récupéré ?",
    answer:
      "Oui côté agence : les projets, fichiers et documents supprimés vont dans la Corbeille et peuvent être restaurés avant toute suppression définitive.",
  },
  {
    question: "Comment changer ma photo de profil ?",
    answer:
      "Dans Mon profil, clique sur Changer la photo. Si l'image a un fond transparent, un fond blanc est appliqué automatiquement.",
  },
  {
    question: "Comment contacter mon agence ou mon client directement ?",
    answer: "Utilise la Messagerie : chaque projet a son propre fil de discussion dédié.",
  },
  {
    question: "Comment me déconnecter ?",
    answer: "Depuis Mon profil, un bouton \"Se déconnecter\" est disponible en bas de page.",
  },
];

type ChatMessage = { id: string; from: "user" | "support"; text: string };

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  from: "support",
  text: "Bonjour, je suis l'assistant support de livret. Pose ta question, je te réponds tout de suite.",
};

// Petit set de réponses simulées par mots-clés, pas de vrai appel à un
// modèle pour l'instant. Suffisant pour démontrer le flux, à remplacer plus
// tard par une vraie intégration si besoin.
function buildReply(message: string): string {
  const text = message.toLowerCase();
  if (/mot de passe|connexion|login/.test(text)) {
    return "Tu peux modifier ton mot de passe depuis Mon profil > Sécurité. Si tu n'arrives plus à te connecter du tout, écris-nous par email, on te recontacte rapidement.";
  }
  if (/logo|format|svg|png|pdf|télécharg/.test(text)) {
    return "Les formats disponibles pour chaque logo sont listés sous l'aperçu, dans la page Logos. Sélectionne ceux qui t'intéressent puis clique sur Télécharger.";
  }
  if (/facture|paiement|abonnement|tarif/.test(text)) {
    return "Pour tout ce qui touche à la facturation ou à l'abonnement, le plus simple est de nous écrire directement par email : on te répond avec le détail.";
  }
  if (/projet|avancement|statut|étape/.test(text)) {
    return "L'avancement d'un projet est visible via la barre de progression en haut de la fiche projet, avec 5 étapes de l'orientation à la livraison.";
  }
  if (/document|contrat|administratif/.test(text)) {
    return "Tous les documents administratifs partagés sont regroupés dans l'onglet Administratif de l'espace projet.";
  }
  if (/corbeille|supprim|restaur/.test(text)) {
    return "Un élément supprimé va d'abord dans la Corbeille : tu peux le restaurer ou attendre la suppression définitive.";
  }
  return "Merci pour ton message ! Un membre de l'équipe prendra le relais si besoin. En attendant, n'hésite pas à jeter un œil à la FAQ ci-dessus.";
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="glass rounded-card divide-y divide-white/50 overflow-hidden">
      {FAQ_ITEMS.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/40 transition-colors"
            >
              <span className="text-sm font-medium">{item.question}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-ink-400 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            {open && (
              <div className="animate-fade-in px-5 pb-4 text-sm text-ink-500 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text }]);
    setInput("");
    setIsTyping(true);

    const delay = 700 + Math.random() * 600;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "support", text: buildReply(text) },
      ]);
      setIsTyping(false);
    }, delay);
  }

  return (
    <div className="glass rounded-card overflow-hidden flex flex-col h-[420px]">
      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`animate-fade-in max-w-[80%] text-sm px-3.5 py-2 rounded-field leading-relaxed ${
              m.from === "user"
                ? "self-end bg-gradient-terracotta text-white"
                : "self-start bg-white/70 text-ink-700"
            }`}
          >
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div className="animate-fade-in self-start bg-white/70 text-ink-400 text-sm px-3.5 py-2 rounded-field">
            En train d&apos;écrire...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-white/55">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris ta question..."
          className="flex-1 resize-none px-3 py-2 text-sm bg-white/70 border border-white/60 rounded-field focus:outline-none focus:border-clay-500 focus:bg-white/90 transition-colors"
        />
        <button
          type="submit"
          className="shrink-0 w-9 h-9 rounded-field bg-gradient-terracotta text-white flex items-center justify-center hover-lift"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export function HelpCenter() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
          Questions fréquentes
        </h2>
        <FaqAccordion />
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
          Support
        </h2>
        <SupportChat />
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400 mb-3">
          Nous contacter
        </h2>
        <div className="glass rounded-card p-5 flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:support@livret-agence.fr"
            className="flex items-center gap-3 flex-1 px-4 py-3 rounded-field bg-white/50 hover:bg-white/70 transition-colors"
          >
            <Mail className="w-4 h-4 text-clay-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-ink-400">Par email</div>
              <div className="text-sm font-medium truncate">support@livret-agence.fr</div>
            </div>
          </a>
          <a
            href="tel:+33123456789"
            className="flex items-center gap-3 flex-1 px-4 py-3 rounded-field bg-white/50 hover:bg-white/70 transition-colors"
          >
            <Phone className="w-4 h-4 text-clay-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-ink-400">Par téléphone</div>
              <div className="text-sm font-medium">01 23 45 67 89</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
