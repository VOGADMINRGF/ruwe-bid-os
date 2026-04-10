# OpenTasks

## P2 Operational Core
- [ ] Betriebshof-Modell weiter schärfen
- [ ] Filter nach Quelle / Standort / Gewerk / Status
- [ ] Source Registry editierbar machen

## P3 Intelligence
- [ ] Nutzen-Score je Quelle verfeinern
- [ ] Explainability für Vorfilterung je Tender

## P4 Ingestion
- [ ] echter TED Connector
- [ ] echter service.bund Connector
- [ ] Berliner RSS / Bekanntmachungsconnector
- [ ] DTVP nur mit sauberem Partner-/Portalansatz
- [ ] Source Test automatisieren

## P5 Production
- [ ] Rollenmodell
- [ ] Audit Log
- [ ] Scheduler
- [ ] Reporting / Export


## RUWE-BID-OS-P0 — Kernstabilisierung Live-Betrieb

### RUWE-LIVE-01 Quellenabruf stabilisieren
- Einzelabruf je Quelle muss sichtbar und belastbar funktionieren
- Run-All muss sichtbar Fortschritt und Ergebnis zeigen
- Trefferzahl je Quelle muss nachvollziehbar sein
- Wortsuche je Quelle muss dokumentiert und sichtbar sein

### RUWE-LIVE-02 Quellenstatus / Monitoring zusammenführen
- Quellen, Monitoring und Ops in eine operative Fläche überführen
- Status, letzter Abruf, Treffer, verwertbare Treffer, Linkqualität zusammen anzeigen

### RUWE-LIVE-03 Deep-Link-Validität hart prüfen
- Nur belastbare Direktlinks als operativ nutzbar markieren
- Fallback auf Startseiten / Homepages nicht als valide Quelle akzeptieren
- Link-Status je Treffer sichtbar machen

### RUWE-AI-01 Ausschreibungsverständnis ausbauen
- Region, Gewerk, Frist, Volumen, Laufzeit, Losstruktur strukturierter erkennen
- Stunden / Fläche / Turnus / Pauschale / Mischmodell erkennen
- Missing Variables gezielt erzeugen

### RUWE-AI-02 Entscheidungslogik kalibrieren
- Nicht alles pauschal auf No-Go kippen
- Bid / Prüfen / No-Bid / No-Go fachlich schärfen
- kurze, lesbare Begründung je Fall
- Primärmodell / Fallback / Confidence sauber ausweisen

### RUWE-OPS-01 Opportunities operativ machen
- Fit-Score je Fall
- Owner + Support-Owner sinnvoll verteilen
- nächste Aktion klar ableiten
- Opportunity-Detailseite für Angebotsvorbereitung weiter ausbauen

### RUWE-OPS-02 Missing Variables operativ machen
- Antwort direkt speicherbar
- Parameter Memory wiederverwenden
- ähnliche Fälle nach Lernregel besser behandeln

### RUWE-UX-01 Dashboard auf Managementfragen trimmen
- Volumen je Gewerk
- Volumen je Region
- Region × Gewerk Potenziale
- Fristen / Laufzeiten / No-Bid-Blocker / Abdeckung
- weniger Tabellenfriedhof, mehr priorisierte Highlights

### RUWE-UX-02 Rules + Keywords zusammenführen
- Site-Rules und Keywords in einer Fläche bearbeiten
- pro Standort / Gewerk: Radius, Kapazität, Priorität, Keywords, Hinweise

### RUWE-DATA-01 Regionen normalisieren
- keine Adressblöcke im operativen Kern
- stattdessen klare Steuerregionen wie Berlin, Magdeburg, Potsdam/Stahnsdorf, Leipzig/Schkeuditz, Zeitz etc.

### RUWE-DATA-02 Lernregeln und Parameter persistent nutzen
- Overrides in Learning Rules überführen
- regionale Sätze und Kalkulationsparameter für spätere Fälle wiederverwenden
