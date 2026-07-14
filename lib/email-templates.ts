type ProspectMailInput = {
  locale: "fr" | "en";
  firstName?: string;
  organization: string;
  city?: string;
  demoUrl: string;
};

export function prospectMail(input: ProspectMailInput) {
  if (input.locale === "en") {
    const subject = `I prepared ${input.organization}’s registration form`;
    const text = `Hi ${input.firstName || "there"},\n\nI reviewed ${input.organization}’s website and prepared a much simpler registration experience using your own activities, schedules and information.\n\nPeople select what they need, register, and you instantly receive a clean email summary. Their details can also be added to your Google Sheet.\n\nYour private demo stays online for 7 days. There is nothing to install.\n\nI want this: ${input.demoUrl}\n\nVincent Letort\nSpectra Media AI`;
    return { subject, text, button: "I want this" };
  }

  const subject = `J’ai préparé le formulaire d’inscription de ${input.organization}`;
  const text = `Bonjour ${input.firstName || ""},\n\nJ’ai regardé le site de ${input.organization} et préparé un formulaire d’inscription beaucoup plus simple avec vos propres activités, horaires et informations.\n\nLa personne choisit, s’inscrit, puis vous recevez immédiatement un récapitulatif clair par email. Les données peuvent aussi arriver dans votre Google Sheet.\n\nLa démonstration privée reste disponible 7 jours. Il n’y a rien à installer.\n\nJe veux ça : ${input.demoUrl}\n\nVincent Letort\nSpectra Media AI`;
  return { subject, text, button: "Je veux ça" };
}

export function activationMail(organization: string, formUrl: string) {
  const subject = `Votre formulaire ${organization} est prêt`;
  const text = `Bonjour,\n\nVotre formulaire HyperInscription est activé.\n\nURL à ajouter à votre site : ${formUrl}\n\nChaque inscription sera conservée dans votre tableau de suivi et envoyée par email. La connexion Google Sheet peut être ajoutée depuis votre configuration.\n\nVincent Letort\nSpectra Media AI`;
  return { subject, text };
}
