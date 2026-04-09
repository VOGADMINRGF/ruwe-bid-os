export function badgeTone(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  if (mode === "smoke") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export function modeLabel(mode?: string) {
  if (mode === "live") return "Live";
  if (mode === "smoke") return "Smoke";
  return "Demo";
}

export function executiveAssessment(db: any) {
  const hits = db.sourceHits || [];
  const pre = hits.filter((x: any) => x.status === "prefiltered").length;
  const manual = hits.filter((x: any) => x.status === "manual_review").length;
  const observed = hits.filter((x: any) => x.status === "observed").length;

  if (pre >= 5) return {
    tone: "gut",
    title: "Gute operative Lage",
    text: "Mehrere Treffer sind bereits bid-vorausgewählt. Fokus sollte jetzt auf Priorisierung und Angebotsbearbeitung liegen."
  };

  if (manual >= 3 || observed >= 5) return {
    tone: "gemischt",
    title: "Prüflage aktiv",
    text: "Es gibt relevante Treffer, aber ein Teil muss manuell oder regelbasiert weiter geschärft werden."
  };

  return {
    tone: "kritisch",
    title: "Noch kein belastbarer Operativstand",
    text: "Die Datenlage ist aktuell eher Demo-/Smoke-basiert oder es fehlen noch ausreichend verwertbare Treffer."
  };
}

export function emptyStateFor(module: string) {
  const map: Record<string, { title: string; text: string }> = {
    pipeline: {
      title: "Noch keine echte Pipeline",
      text: "Solange keine produktiven Vorgänge vorhanden sind, werden Demo-Chancen oder erste Live-Treffer als Arbeitsbasis genutzt."
    },
    tenders: {
      title: "Noch keine vollständige Ausschreibungsliste",
      text: "Die Treffer kommen aktuell aus Demo-/Smoke-/Live-Mix. Mit echten Connectoren wird hier die operative Hauptliste entstehen."
    },
    agents: {
      title: "Noch keine individuell gepflegten Agentenprofile",
      text: "Bis echte Rollen gepflegt werden, bleiben Demo-Agenten sichtbar, damit die Steuerlogik vorzeigbar bleibt."
    },
    buyers: {
      title: "Noch keine vollständig gepflegten Auftraggeber",
      text: "Öffentliche Auftraggeber werden aktuell nur als Beispiel- und Testbasis geführt."
    },
    references: {
      title: "Noch keine belastbaren Referenzen gepflegt",
      text: "Referenzen werden später für Bid-Entscheidung und Vertriebsargumentation je Gewerk genutzt."
    }
  };
  return map[module] || {
    title: "Noch keine Daten",
    text: "Dieses Modul ist vorbereitet, aber noch nicht produktiv befüllt."
  };
}
