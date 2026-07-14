"use client";

import { FormEvent, useMemo, useState } from "react";
import RegistrationDemo, { sampleDemoConfig } from "./components/RegistrationDemo";

type Screen = "landing" | "demo" | "hyperscript" | "emails" | "dashboard";
type Plan = "monthly" | "annual" | "oneshot";

const cities = [
  "Paris", "Pau", "Pantin", "Palaiseau", "Marseille", "Montpellier", "Milan",
  "Madrid", "Le Mans", "Lille", "Lyon", "Dublin", "Dubaï", "Bordeaux",
  "Bruxelles", "Nantes", "Nice", "New York", "Toulouse", "Tours",
];

const activities = [
  { name: "Danse", count: 184, trend: "+18%" },
  { name: "Théâtre", count: 92, trend: "+12%" },
  { name: "Pétanque", count: 147, trend: "+9%" },
  { name: "Football", count: 213, trend: "+7%" },
  { name: "Musique", count: 126, trend: "+15%" },
  { name: "Yoga", count: 166, trend: "+21%" },
  { name: "Formation", count: 109, trend: "+11%" },
  { name: "Loisirs", count: 239, trend: "+8%" },
];

const initialProspects = [
  { org: "Compagnie Éclats", city: "Paris", type: "Théâtre", status: "Démo prête", score: 94, signal: "Site actif · formulaire PDF" },
  { org: "Studio Mouvance", city: "Le Mans", type: "Danse", status: "Mail cliqué", score: 91, signal: "2 clics Mailjet" },
  { org: "Pétanque des Quais", city: "Nantes", type: "Pétanque", status: "À envoyer", score: 86, signal: "Email vérifié" },
  { org: "Chœur Accord", city: "Lyon", type: "Musique", status: "Démo visitée", score: 83, signal: "4 min sur la démo" },
  { org: "Atelier Point Zéro", city: "Tours", type: "Formation", status: "Réponse", score: 79, signal: "Demande tarif annuel" },
];

const emailTemplates = {
  fr: {
    language: "FR",
    subject: "J’ai préparé le formulaire d’inscription de {{organisation}}",
    preheader: "Une démonstration personnalisée, déjà remplie avec vos activités.",
    body: `Bonjour {{prénom}},

J’ai regardé le site de {{organisation}} et j’ai préparé un exemple de formulaire d’inscription beaucoup plus simple pour vos adhérents.

Vos activités, horaires et tarifs sont déjà présentés. La personne choisit, s’inscrit, puis vous recevez immédiatement un récapitulatif clair par email. Les données peuvent aussi arriver dans votre Google Sheet.

La démonstration privée reste disponible pendant 7 jours. Il n’y a rien à installer : après activation, vous recevez une URL à ajouter à votre site.

Vincent Letort
Spectra Media AI`,
    button: "Je veux ça",
  },
  en: {
    language: "EN",
    subject: "I prepared {{organisation}}’s registration form",
    preheader: "A personalised demo using your own activities and information.",
    body: `Hi {{first_name}},

I reviewed {{organisation}}’s website and prepared a much simpler registration experience for your members.

Your activities, schedules and prices are already included. People select what they need, register, and you instantly receive a clean email summary. Their details can also be added to your Google Sheet.

Your private demo stays online for 7 days. There is nothing to install: after activation, you receive a simple URL to add to your website.

Vincent Letort
Spectra Media AI`,
    button: "I want this",
  },
};

const pipeline = [
  ["01", "HyperScript trouve", "Associations et entreprises ciblées par activité et par ville."],
  ["02", "Le site est compris", "Activités, horaires, tarifs, contacts et identité sont extraits."],
  ["03", "Une vraie démo est créée", "Le prospect voit son propre formulaire, pas une présentation générique."],
  ["04", "Le bon mail part", "FR ou EN, avec le bouton “Je veux ça” et le lien privé de 7 jours."],
  ["05", "L’achat active le service", "Le client reçoit son URL et les inscriptions commencent à arriver."],
];

function Icon({ name }: { name: "arrow" | "check" | "play" | "mail" | "sheet" | "bolt" }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    sheet: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7Z"/>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [emailLanguage, setEmailLanguage] = useState<"fr" | "en">("fr");
  const [cityQuery, setCityQuery] = useState("Le Mans");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["Danse", "Théâtre"]);
  const [runState, setRunState] = useState<"ready" | "running" | "stopped">("ready");
  const [runProgress, setRunProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [prospects, setProspects] = useState(initialProspects);
  const template = emailTemplates[emailLanguage];

  const suggestions = useMemo(() => {
    const q = cityQuery.trim().toLocaleLowerCase("fr");
    if (!q) return cities.slice(0, 6);
    return cities.filter((city) => city.toLocaleLowerCase("fr").startsWith(q)).slice(0, 6);
  }, [cityQuery]);

  const visibleProspects = statusFilter === "Tous"
    ? prospects
    : prospects.filter((prospect) => prospect.status === statusFilter);

  function go(next: Screen) {
    setScreen(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleActivity(activity: string) {
    setSelectedActivities((current) =>
      current.includes(activity)
        ? current.filter((item) => item !== activity)
        : [...current, activity]
    );
  }

  async function startCheckout(plan: Plan) {
    setNotice("Préparation du paiement sécurisé…");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, locale: "fr" }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.error === "stripe_not_configured"
        ? "Le parcours est prêt. Il ne manque que les identifiants Stripe de production."
        : "Le paiement n’a pas pu être ouvert pour le moment.");
    } catch {
      setNotice("Le paiement n’a pas pu être ouvert pour le moment.");
    }
  }

  function startRun(event: FormEvent) {
    event.preventDefault();
    if (!cityQuery.trim() || !selectedActivities.length) {
      setNotice("Choisis au moins une activité et une ville.");
      return;
    }
    setNotice("");
    setRunState("running");
    setRunProgress(12);
    const stages = [31, 52, 74, 89, 100];
    stages.forEach((value, index) => {
      window.setTimeout(() => {
        setRunProgress(value);
        if (value === 100) {
          setRunState("ready");
          setProspects((current) => [
            { org: "Association Nouvelle Vague", city: cityQuery, type: selectedActivities[0], status: "Démo prête", score: 88, signal: "Site crawlé · email vérifié" },
            ...current,
          ]);
          setNotice("Run terminé : 1 nouvelle démo prête et 6 prospects qualifiés.");
        }
      }, 420 * (index + 1));
    });
  }

  function stopRun() {
    setRunState("stopped");
    setNotice("Run arrêté. Les résultats déjà trouvés sont conservés.");
  }

  return (
    <main className="site-shell">
      <header className="main-header">
        <button className="brand" onClick={() => go("landing")} aria-label="Retour à l’accueil">
          <span className="brand-mark">H<span>+</span></span>
          <span className="brand-copy"><strong>HYPERINSCRIPTION</strong><small>SPECTRA MEDIA AI</small></span>
        </button>
        <nav className="main-nav" aria-label="Navigation principale">
          {([
            ["landing", "Présentation"], ["demo", "Démo"], ["hyperscript", "HyperScript"],
            ["emails", "Emails FR / EN"], ["dashboard", "Dashboard"],
          ] as [Screen, string][]).map(([id, label]) => (
            <button key={id} className={screen === id ? "active" : ""} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
        <button className="button button-compact" onClick={() => go("demo")}>Voir une démo <Icon name="arrow" /></button>
      </header>

      {screen === "landing" && (
        <>
          <section className="hero section-pad">
            <div className="hero-copy">
              <div className="eyebrow"><span className="live-dot" /> L’automatisation d’inscription qui se vend en démonstration</div>
              <h1>Chaque inscription arrive <em>déjà rangée.</em></h1>
              <p className="hero-lead">HyperInscription transforme les informations d’un site en un parcours d’inscription simple, personnalisé et prêt à être ajouté en un lien.</p>
              <div className="hero-actions">
                <button className="button" onClick={() => go("demo")}>Tester le formulaire <Icon name="arrow" /></button>
                <button className="button button-ghost" onClick={() => go("hyperscript")}><Icon name="play" /> Voir la machine commerciale</button>
              </div>
              <div className="trust-row">
                <span><Icon name="check" /> Aucun logiciel à installer</span>
                <span><Icon name="check" /> Email + Google Sheet</span>
                <span><Icon name="check" /> URL prête après achat</span>
              </div>
            </div>

            <div className="hero-product" aria-label="Aperçu du produit">
              <div className="product-glow" />
              <div className="browser-card">
                <div className="browser-top"><span/><span/><span/><div>inscriptions.club-horizon.fr</div></div>
                <div className="browser-content">
                  <div className="demo-brand-row"><div className="demo-avatar">CH</div><div><b>Club Horizon</b><small>Inscriptions 2026–2027</small></div><span className="open-pill">Ouvert</span></div>
                  <h3>Que souhaitez-vous pratiquer ?</h3>
                  <div className="mini-options"><span className="chosen"><i>✓</i> Théâtre adulte</span><span><i /> Atelier jeunesse</span><span><i /> Improvisation</span></div>
                  <div className="mini-summary"><div><small>Votre sélection</small><b>Théâtre adulte · Mardi 19h</b></div><strong>240 €</strong></div>
                  <button>Continuer l’inscription <Icon name="arrow" /></button>
                </div>
              </div>
              <div className="floating-card mail-float"><span className="float-icon"><Icon name="mail" /></span><div><small>Récap reçu</small><b>Nouvelle inscription</b></div><i>à l’instant</i></div>
              <div className="floating-card sheet-float"><span className="float-icon green"><Icon name="sheet" /></span><div><small>Google Sheet</small><b>Ligne ajoutée</b></div><i>✓</i></div>
            </div>
          </section>

          <section className="proof-strip">
            <div><strong>1 lien</strong><span>à ajouter au site</span></div>
            <div><strong>2 sorties</strong><span>email + Google Sheet</span></div>
            <div><strong>7 jours</strong><span>pour tester la démo privée</span></div>
            <div><strong>0 friction</strong><span>pour les adhérents</span></div>
          </section>

          <section className="section-pad story-section">
            <div className="section-heading">
              <div><p className="eyebrow">De la prospection à l’activation</p><h2>HyperScript vend une solution qu’il a déjà préparée.</h2></div>
              <p>Le prospect ne doit pas imaginer le résultat. Il clique et découvre ses propres activités, ses propres horaires et son identité.</p>
            </div>
            <div className="pipeline-grid">
              {pipeline.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
            </div>
          </section>

          <section className="section-pad dark-panel-section">
            <div className="dark-panel">
              <div className="dark-copy"><p className="eyebrow light">Pour toutes les structures qui inscrivent des personnes</p><h2>Un moteur unique. Des parcours adaptés à chaque activité.</h2><p>Danse, théâtre, pétanque, sport, musique, ateliers, formations, événements ou rendez-vous : les champs et les choix sont reconstruits à partir du site ciblé.</p><button className="button button-light" onClick={() => go("demo")}>Ouvrir la démo <Icon name="arrow" /></button></div>
              <div className="audience-grid">
                {activities.slice(0, 6).map((activity, index) => <div key={activity.name}><span>0{index + 1}</span><b>{activity.name}</b><small>Formulaire personnalisé</small></div>)}
              </div>
            </div>
          </section>

          <section className="section-pad pricing-section" id="tarifs">
            <div className="section-heading centered"><div><p className="eyebrow">Une mise en place rentable dès la première heure gagnée</p><h2>Simple à acheter. Simple à utiliser.</h2></div></div>
            <div className="pricing-grid">
              <article><p>Mensuel</p><h3>59 €<small>/ mois</small></h3><span>Souple, sans engagement annuel</span><ul><li><Icon name="check" /> URL personnalisée</li><li><Icon name="check" /> Récapitulatif email</li><li><Icon name="check" /> Google Sheet en option</li></ul><button className="button button-wide" onClick={() => startCheckout("monthly")}>Choisir le mensuel</button></article>
              <article className="featured"><div className="best-pill">–20 %</div><p>Annuel</p><h3>566,40 €<small>/ an</small></h3><span>Soit 47,20 € par mois</span><ul><li><Icon name="check" /> Tout le forfait mensuel</li><li><Icon name="check" /> 2 mois économisés</li><li><Icon name="check" /> Priorité de mise en place</li></ul><button className="button button-wide" onClick={() => startCheckout("annual")}>Choisir l’annuel</button></article>
              <article><p>Achat définitif</p><h3 className="quote-price">Sur devis</h3><span>Installation dédiée, sans abonnement</span><ul><li><Icon name="check" /> Licence permanente</li><li><Icon name="check" /> Configuration sur mesure</li><li><Icon name="check" /> Transfert et documentation</li></ul><button className="button button-wide button-ghost-dark" onClick={() => startCheckout("oneshot")}>Demander le tarif</button></article>
            </div>
            {notice && <p className="inline-notice" role="status">{notice}</p>}
          </section>

          <section className="founder section-pad">
            <div className="founder-sign">VL</div>
            <div><p className="eyebrow">Conçu et piloté par</p><h2>Vincent Letort</h2><p>Fondateur de Spectra Media AI. Automatisations métier, assistants et systèmes commerciaux orientés résultat.</p></div>
            <div className="spectra-lockup"><b>SPECTRA</b><span>MEDIA AI</span></div>
          </section>
        </>
      )}

      {screen === "demo" && (
        <section className="workspace-page demo-page section-pad">
          <div className="workspace-heading"><div><p className="eyebrow">Démo personnalisée</p><h1>Le prospect voit immédiatement son futur formulaire.</h1><p>Exemple généré à partir des informations d’un site fictif de théâtre.</p></div><div className="demo-expiry"><span>Démo privée</span><b>Expire dans 7 jours</b></div></div>
          <RegistrationDemo config={sampleDemoConfig} />
        </section>
      )}

      {screen === "hyperscript" && (
        <section className="workspace-page section-pad">
          <div className="workspace-heading"><div><p className="eyebrow">Raccord HyperScript</p><h1>Choisis les cases. Lance le run.</h1><p>HyperScript garde son rôle de scrape, crawl et envoi. HyperInscription lui fournit la démo et remonte les signaux.</p></div><div className="connection-card"><span className="live-dot"/><div><small>Connexion</small><b>Bridge prêt</b></div></div></div>
          <form className="run-layout" onSubmit={startRun}>
            <div className="run-builder">
              <div className="run-title"><span>1</span><div><h2>Activités ciblées</h2><p>Clique directement sur les cases à prospecter.</p></div></div>
              <div className="activity-picker">
                {activities.map((activity) => {
                  const selected = selectedActivities.includes(activity.name);
                  return <button type="button" key={activity.name} className={selected ? "selected" : ""} onClick={() => toggleActivity(activity.name)}><i>{selected ? "✓" : "+"}</i><span><b>{activity.name}</b><small>{activity.count} cibles estimées</small></span><em>{activity.trend}</em></button>;
                })}
              </div>
              <div className="run-title second"><span>2</span><div><h2>Ville</h2><p>Tape les premières lettres : Pa → Paris, Pau, Pantin…</p></div></div>
              <div className="city-combobox">
                <label htmlFor="city">Ville à explorer</label>
                <input id="city" value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} autoComplete="off" />
                <div className="city-suggestions">
                  {suggestions.map((city) => <button type="button" key={city} onClick={() => setCityQuery(city)}>{city}<span>France / International</span></button>)}
                </div>
              </div>
            </div>
            <aside className="run-console">
              <div className="console-head"><div><span className={runState === "running" ? "live-dot pulse" : "live-dot"}/><b>{runState === "running" ? "RUN EN COURS" : runState === "stopped" ? "RUN ARRÊTÉ" : "PRÊT À LANCER"}</b></div><small>HyperScript → HyperInscription</small></div>
              <div className="run-recap"><small>Ciblage</small><b>{selectedActivities.length || 0} activité{selectedActivities.length > 1 ? "s" : ""} · {cityQuery || "aucune ville"}</b><div><span>Exploration</span><strong>20 %</strong></div><div><span>Priorité Mailjet</span><strong>80 %</strong></div></div>
              <div className="progress-track"><span style={{ width: `${runProgress}%` }} /></div>
              <ol className="console-log">
                <li className={runProgress >= 12 ? "done" : ""}><i /> Recherche des sites ciblés</li>
                <li className={runProgress >= 31 ? "done" : ""}><i /> Vérification email et domaine</li>
                <li className={runProgress >= 52 ? "done" : ""}><i /> Crawl des activités et tarifs</li>
                <li className={runProgress >= 74 ? "done" : ""}><i /> Génération de la démo privée</li>
                <li className={runProgress >= 89 ? "done" : ""}><i /> Préparation du mail FR / EN</li>
                <li className={runProgress >= 100 ? "done" : ""}><i /> Envoi et suivi Mailjet</li>
              </ol>
              {runState === "running" ? <button type="button" className="stop-button" onClick={stopRun}>■ Arrêter immédiatement</button> : <button className="button button-wide" type="submit"><Icon name="bolt" /> Lancer ce run</button>}
              <p className="console-note">Les résultats sont sauvegardés à chaque étape. Un arrêt ne supprime rien.</p>
            </aside>
          </form>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
        </section>
      )}

      {screen === "emails" && (
        <section className="workspace-page section-pad">
          <div className="workspace-heading"><div><p className="eyebrow">Emails de prospection</p><h1>Courts, concrets et centrés sur la démo déjà créée.</h1><p>HyperScript choisit automatiquement la langue détectée sur le site.</p></div><div className="language-switch"><button className={emailLanguage === "fr" ? "active" : ""} onClick={() => setEmailLanguage("fr")}>FR</button><button className={emailLanguage === "en" ? "active" : ""} onClick={() => setEmailLanguage("en")}>EN</button></div></div>
          <div className="email-workspace">
            <div className="email-settings">
              <h2>Variables dynamiques</h2>
              <div className="variable-list"><span>{"{{prénom}}"}</span><span>{"{{organisation}}"}</span><span>{"{{ville}}"}</span><span>{"{{demo_url}}"}</span><span>{"{{expiration}}"}</span></div>
              <div className="email-rule"><Icon name="check"/><div><b>Pas de promesse abstraite</b><p>Le mail parle de la démo réellement préparée.</p></div></div>
              <div className="email-rule"><Icon name="check"/><div><b>Un seul appel à l’action</b><p>Le bouton mène à la démonstration et au choix du forfait.</p></div></div>
              <div className="email-rule"><Icon name="check"/><div><b>Expiration claire</b><p>Le lien privé s’éteint après 7 jours et peut être réactivé.</p></div></div>
            </div>
            <article className="email-preview">
              <div className="email-chrome"><span/><span/><span/><b>Aperçu {template.language}</b></div>
              <div className="email-meta"><span>De</span><b>Vincent Letort — Spectra Media AI</b><span>Objet</span><b>{template.subject}</b><span>Aperçu</span><p>{template.preheader}</p></div>
              <div className="email-body">
                {template.body.split("\n").map((line, index) => line ? <p key={index}>{line}</p> : <br key={index}/>) }
                <button>{template.button} <Icon name="arrow" /></button>
                <small>Démo privée : {"{{demo_url}}"} · disponible 7 jours</small>
              </div>
            </article>
          </div>
        </section>
      )}

      {screen === "dashboard" && (
        <section className="workspace-page dashboard-page section-pad">
          <div className="workspace-heading"><div><p className="eyebrow">Dashboard de contrôle</p><h1>Une vue claire de la recherche jusqu’à l’achat.</h1><p>Les suggestions remontent les vrais signaux Mailjet, pas l’ordre alphabétique.</p></div><button className="button" onClick={() => go("hyperscript")}><Icon name="play" /> Nouveau run</button></div>
          <div className="metric-grid">
            <article><span>Prospects trouvés</span><b>1 248</b><small>+126 cette semaine</small></article>
            <article><span>Démos générées</span><b>386</b><small>30,9 % des sites qualifiés</small></article>
            <article><span>Taux de clic</span><b>12,8 %</b><small className="positive">+3,4 points via Mailjet</small></article>
            <article><span>Achats</span><b>18</b><small>1 062 € de MRR</small></article>
          </div>
          <div className="dashboard-grid">
            <section className="prospect-panel">
              <div className="panel-header"><div><h2>Prospects les plus prometteurs</h2><p>Classés par score de rentabilité et signaux réels.</p></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer les prospects"><option>Tous</option><option>Démo prête</option><option>Mail cliqué</option><option>Démo visitée</option><option>Réponse</option><option>À envoyer</option></select></div>
              <div className="prospect-table">
                <div className="table-row table-head"><span>Organisation</span><span>Signal</span><span>Statut</span><span>Score</span></div>
                {visibleProspects.map((prospect) => <button className="table-row" key={`${prospect.org}-${prospect.city}`} onClick={() => setNotice(`${prospect.org} sélectionné : la démo peut être ouverte ou renvoyée.`)}><span><b>{prospect.org}</b><small>{prospect.type} · {prospect.city}</small></span><span>{prospect.signal}</span><span><i className={`status status-${prospect.status.toLowerCase().replaceAll(" ", "-").replace("é", "e")}`}>{prospect.status}</i></span><span><strong>{prospect.score}</strong>/100</span></button>)}
              </div>
            </section>
            <aside className="signals-panel">
              <div className="panel-header"><div><h2>Priorités automatiques</h2><p>Issues des clics et réponses.</p></div></div>
              <div className="signal-list">
                <div><span>01</span><b>Yoga · Montpellier</b><em>18,4 % CTR</em></div>
                <div><span>02</span><b>Danse · Le Mans</b><em>16,9 % CTR</em></div>
                <div><span>03</span><b>Théâtre · Paris</b><em>14,7 % CTR</em></div>
                <div><span>04</span><b>Pétanque · Toulouse</b><em>12,3 % CTR</em></div>
              </div>
              <div className="autopilot-card"><span className="live-dot pulse"/><div><b>Autopilote actif</b><p>80 % meilleurs signaux · 20 % exploration</p></div><button aria-label="Autopilote actif"><i/></button></div>
            </aside>
          </div>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
        </section>
      )}

      <footer className="main-footer"><div className="brand"><span className="brand-mark">H<span>+</span></span><span className="brand-copy"><strong>HYPERINSCRIPTION</strong><small>SPECTRA MEDIA AI</small></span></div><p>Une automatisation Spectra Media AI — Vincent Letort</p><span>Le Mans · France</span></footer>
    </main>
  );
}
