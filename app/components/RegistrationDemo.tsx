"use client";

import { FormEvent, useMemo, useState } from "react";

export type DemoOption = {
  id: string;
  title: string;
  category: string;
  schedule: string;
  price: number;
  remaining: number;
};

export type DemoConfig = {
  slug?: string;
  organization: string;
  subtitle: string;
  initials: string;
  accent: string;
  intro: string;
  options: DemoOption[];
  recipientEmail?: string;
  googleSheetEnabled?: boolean;
};

export const sampleDemoConfig: DemoConfig = {
  organization: "Compagnie Éclats",
  subtitle: "Inscriptions ateliers 2026–2027",
  initials: "CÉ",
  accent: "#6d5dfc",
  intro: "Choisissez un atelier. Les créneaux, le total et les places disponibles sont calculés automatiquement.",
  googleSheetEnabled: true,
  options: [
    { id: "theatre-adulte", title: "Théâtre adulte", category: "Adultes", schedule: "Mardi · 19h00–21h00", price: 240, remaining: 8 },
    { id: "theatre-ado", title: "Atelier ados", category: "13–17 ans", schedule: "Mercredi · 17h30–19h00", price: 195, remaining: 3 },
    { id: "impro", title: "Improvisation", category: "Tous niveaux", schedule: "Jeudi · 19h30–21h00", price: 210, remaining: 12 },
    { id: "jeunesse", title: "Atelier jeunesse", category: "8–12 ans", schedule: "Samedi · 10h30–12h00", price: 180, remaining: 6 },
  ],
};

const euro = (value: number) => `${value.toLocaleString("fr-FR")} €`;

export default function RegistrationDemo({ config }: { config: DemoConfig }) {
  const [selected, setSelected] = useState<string[]>([config.options[0]?.id].filter(Boolean));
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedOptions = useMemo(() => config.options.filter((option) => selected.includes(option.id)), [config.options, selected]);
  const total = selectedOptions.reduce((sum, option) => sum + option.price, 0);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { slug: config.slug, organization: config.organization, fields, selectedOptions, total };
    try {
      if (config.slug) {
        await fetch("/api/registrations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 550));
      }
      setSubmitted(true);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="registration-demo" style={{ "--demo-accent": config.accent } as React.CSSProperties}>
      <div className="demo-sidebar">
        <div className="client-brand"><span>{config.initials}</span><div><b>{config.organization}</b><small>{config.subtitle}</small></div></div>
        <div className="demo-steps">
          <button className={step >= 1 ? "active" : ""} onClick={() => setStep(1)}><i>{step > 1 ? "✓" : "1"}</i><span><b>Votre activité</b><small>Choix et créneau</small></span></button>
          <button className={step >= 2 ? "active" : ""} disabled={!selected.length} onClick={() => setStep(2)}><i>{step > 2 ? "✓" : "2"}</i><span><b>Vos coordonnées</b><small>Inscription rapide</small></span></button>
          <button className={step >= 3 ? "active" : ""} disabled={!submitted}><i>3</i><span><b>Confirmation</b><small>Email et feuille de suivi</small></span></button>
        </div>
        <div className="data-destination"><small>La demande sera transmise par</small><span>✉ Récapitulatif email</span>{config.googleSheetEnabled && <span>▦ Google Sheet</span>}</div>
      </div>

      <div className="demo-main">
        {step === 1 && <>
          <div className="demo-main-head"><div><p>ÉTAPE 1 SUR 2</p><h2>Choisissez votre activité</h2><span>{config.intro}</span></div><div className="selection-total"><small>Total actuel</small><b>{euro(total)}</b></div></div>
          <div className="option-grid">
            {config.options.map((option) => {
              const active = selected.includes(option.id);
              return <button key={option.id} className={active ? "active" : ""} onClick={() => toggle(option.id)}><div className="option-top"><span>{option.category}</span><i>{active ? "✓" : "+"}</i></div><h3>{option.title}</h3><p>{option.schedule}</p><div className="option-bottom"><b>{euro(option.price)}</b><small className={option.remaining <= 3 ? "urgent" : ""}>{option.remaining} places</small></div></button>;
            })}
          </div>
          <div className="demo-actionbar"><div><small>{selected.length} choix sélectionné{selected.length > 1 ? "s" : ""}</small><b>{selectedOptions.map((item) => item.title).join(" · ") || "Choisissez au moins une activité"}</b></div><button disabled={!selected.length} onClick={() => setStep(2)}>Continuer <span>→</span></button></div>
        </>}

        {step === 2 && <form className="registration-form" onSubmit={submit}>
          <div className="demo-main-head"><div><p>ÉTAPE 2 SUR 2</p><h2>Finalisez votre pré-inscription</h2><span>Les informations sont envoyées immédiatement à {config.organization}.</span></div><div className="selection-total"><small>Total indicatif</small><b>{euro(total)}</b></div></div>
          <div className="form-grid">
            <label><span>Prénom et nom</span><input name="name" required placeholder="Camille Martin" /></label>
            <label><span>Email</span><input name="email" type="email" required placeholder="camille@email.fr" /></label>
            <label><span>Téléphone</span><input name="phone" type="tel" required placeholder="06 00 00 00 00" /></label>
            <label><span>Date de naissance</span><input name="birthDate" type="date" /></label>
            <label className="full"><span>Message ou précision</span><textarea name="message" placeholder="Niveau, question, besoin particulier…" /></label>
            <label className="consent full"><input type="checkbox" required/><span>J’accepte que ces informations soient utilisées pour traiter ma demande d’inscription.</span></label>
          </div>
          <div className="demo-actionbar"><button className="back" type="button" onClick={() => setStep(1)}>← Modifier mes choix</button><button disabled={submitting} type="submit">{submitting ? "Envoi…" : "Envoyer ma pré-inscription"} <span>→</span></button></div>
        </form>}

        {step === 3 && <div className="success-screen"><div className="success-check">✓</div><p>INSCRIPTION TRANSMISE</p><h2>Merci, votre demande est bien arrivée.</h2><span>{config.organization} vient de recevoir le récapitulatif complet et pourra vous recontacter.</span><div className="success-destinations"><div>✉<span><small>Email</small><b>Récapitulatif envoyé</b></span><i>✓</i></div>{config.googleSheetEnabled && <div>▦<span><small>Google Sheet</small><b>Nouvelle ligne ajoutée</b></span><i>✓</i></div>}</div><button onClick={() => { setSubmitted(false); setSelected([config.options[0]?.id].filter(Boolean)); setStep(1); }}>Faire une autre inscription</button></div>}
      </div>
    </div>
  );
}
