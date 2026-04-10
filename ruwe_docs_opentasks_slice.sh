#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

mkdir -p docs

cat > docs/RUWE_BID_OS_TARGET_SCHEMA.md <<'MD'
# RUWE Bid OS — Target Schema / Sollbild

## Ziel
RUWE Bid OS soll nicht nur Treffer sammeln, sondern belastbar live abrufen, operativ vorsortieren, Ausschreibungen fachlich verstehen, No-Bid/Bid begründen und fehlende Variablen gezielt an den zuständigen Owner zurückspielen.

---

## 1. Zielkette

### Phase A — Quellenabruf
Das System muss pro Quelle einzeln und gesammelt:
- live abrufen können
- sichtbaren Abrufstatus führen
- Trefferzahl je Quelle zeigen
- Deep-Link-Qualität prüfen
- Suchwörter je Quelle ausführen
- manuelle Einzelabfrage erlauben

### Phase B — Ausschreibungsverständnis
Jeder Treffer soll nach Möglichkeit strukturiert verstanden werden:
- Region
- Gewerk
- Auftragstyp
- Losstruktur
- Frist / Angebotsfrist
- Laufzeit
- Volumen
- Kalkulationsmodus:
  - Stunden
  - Fläche
  - Turnus
  - Pauschale
  - Mischmodell
- Betreiber / Vergabestelle
- Linkvalidität
- operative Nutzbarkeit

### Phase C — operative Entscheidung
Jeder Treffer soll in genau eine operative Klasse laufen:
- Bid
- Prüfen
- No-Bid
- No-Go

Zusätzlich braucht jeder Fall:
- Fit-Score
- 2-Satz-Begründung
- Owner
- Support-Owner
- offene Variablen
- nächster Schritt

### Phase D — Lernsystem
Wenn Admin oder Owner eine KI-Entscheidung korrigiert:
- soll dies als Lernregel gespeichert werden
- ähnliche Fälle sollen künftig anders priorisiert werden
- regionale Parameter sollen wiederverwendet werden

---

## 2. Live-Anforderungen

### 2.1 Quellen
Primär relevant:
- service.bund.de
- TED
- Vergabeplattform Berlin
- DTVP

Optional später:
- weitere legale Plattformen mit Benutzername / Passwort / Connector-Logik

### 2.2 Je Quelle sichtbar
- letzter Abruf
- Status
- Trefferzahl
- wie viele verwertbar
- wie viele ohne belastbaren Link
- wie viele mit Volumen
- wie viele mit Frist
- Suchmodus
- Einzelabruf möglich
- Run-All möglich

### 2.3 Wortsuche
Das System muss echte Suchbegriffe auf Quellenebene ausführen können.
Nicht nur globale Aggregation, sondern:
- welche Quelle
- welcher Suchbegriff
- wie viele Treffer
- welche Treffer neu
- welche Dubletten
- welche verwertbar

---

## 3. Zielbild Datenmodell

### 3.1 Source Hit
Ein Source Hit braucht mindestens:
- id
- sourceId
- title
- regionRaw
- regionNormalized
- tradeRaw
- tradeNormalized
- buyer / vergabestelle
- url
- externalResolvedUrl
- directLinkValid
- directLinkReason
- dueDate
- durationMonths
- estimatedValue
- lotInfo
- dataMode
- sourceQuality
- sourceQualityReasons
- operationallyUsable

### 3.2 Opportunity
Eine Opportunity braucht mindestens:
- id
- sourceHitId
- title
- region
- trade
- decision
- fitScore
- fitBucket
- fitReasonShort
- fitReasonList
- calcMode
- ownerId
- supportOwnerId
- stage
- missingVariableCount
- nextQuestion
- noBidReason
- overrideReason
- externalResolvedUrl

### 3.3 Missing Variable
Eine Missing Variable braucht mindestens:
- id
- opportunityId
- question
- type
- region
- trade
- priority
- ownerId
- supportOwnerId
- status
- answeredValue
- answeredAt

### 3.4 Parameter Memory
Parameter müssen wiederverwendbar gespeichert werden:
- id
- type
- parameterKey
- region
- trade
- value
- status
- source
- createdAt
- updatedAt

### 3.5 Learning Rule
- id
- region
- trade
- action
- reason
- createdAt

---

## 4. Dashboard-Sollbild

Das Dashboard soll Managementfragen beantworten:

### 4.1 Was ist aktuell im Markt?
- Ausschreibungsvolumen gesamt
- Volumen je Gewerk
- Volumen je Region
- Volumen je Region × Gewerk
- Fristen in 7 / 14 / 30 Tagen
- längste Laufzeiten
- größte Volumen
- höchste Fit-Scores

### 4.2 Was lohnt sich für RUWE?
- Bid-Potenzial je Region
- Bid-Potenzial je Gewerk
- No-Bid-Blocker je Region
- fehlende Abdeckung je Standort / Gewerk
- Owner-Auslastung
- offene Variablen

### 4.3 Was muss jetzt getan werden?
- Fristen kurz vor Ablauf
- Fälle mit hoher Relevanz aber fehlenden Variablen
- Fälle mit gutem Fit und validem Link
- Fälle mit KI-Unsicherheit / manuellem Review

---

## 5. UI-Sollbild

### 5.1 Grundsätze
- weniger Tabellenfriedhof
- mehr priorisierte Arbeitslisten
- klickbare Highlights
- sortierbar
- filterbar
- überall gleiche Begriffe

### 5.2 Wichtige Flächen
- Dashboard
- Treffer & Marktbild
- Opportunities
- Missing Variables
- Quellen & Abrufstatus
- Rules + Keywords zusammengeführt
- Learning / Overrides
- Owner Workload

### 5.3 Regeln + Keywords
Site-Rules und Keywords sollen in einer operativen Fläche zusammenkommen:
- Betriebslogik
- Radius
- Priorität
- Kapazität
- positive Keywords
- negative Keywords
- Regionhinweis

---

## 6. KI-Sollbild

### 6.1 Nicht nur Label, sondern Begründung
Für jeden Fall:
- Empfehlung
- Confidence
- 2-Satz-Kurzbegründung
- wichtigste Risiken
- nächster Schritt

### 6.2 Primär- / Sekundärmodell
Wenn möglich:
- GPT primär
- Claude Second Opinion oder Fallback
- sichtbar, welches Modell entschieden hat
- sichtbar, wenn Fallback genutzt wurde

### 6.3 Ausschreibungsverständnis
Die KI soll nicht nur Titel lesen, sondern so weit wie möglich:
- Umfang erkennen
- Losstruktur erkennen
- Stunden / Fläche / Turnus erkennen
- unklare Kalkulationsfaktoren identifizieren
- gezielte Rückfragen erzeugen

---

## 7. Nicht akzeptabel
Folgendes soll als Fehler gelten:
- Treffer ohne belastbaren Link als normaler operativer Treffer
- AI-Entscheidung ohne Begründung
- alles pauschal auf No-Go
- Regionen als ungefilterter Freitextblock
- fehlende Owner-Logik
- Demo/Teststand ohne klare Kennzeichnung
- Quelle läuft, aber UI zeigt 0 / unklar / nichts passiert

---

## 8. Reifegrad-Ziel
Das System soll in wenigen Schritten auf Vorzeige-Niveau kommen:

### Reifegrad 1
- stabile Live-Abrufe
- Quellenstatus klar
- Treffer nachvollziehbar

### Reifegrad 2
- Ausschreibungsverständnis strukturiert
- Opportunities + Missing Variables brauchbar

### Reifegrad 3
- Bid/Prüfen/No-Bid/No-Go fachlich belastbar
- Learning Rules wirksam

### Reifegrad 4
- Angebotsvorbereitung mit Parametern und Kalkulationslogik

### Reifegrad 5
- echte operative Vertriebssteuerung mit Forecast, Lastverteilung und Angebotsvorbereitung
MD

cat > docs/CODEX_RUWE_BID_OS_BRIEFING.md <<'MD'
# Codex Briefing — RUWE Bid OS

Arbeite nicht kosmetisch, sondern entlang des Sollbilds in `docs/RUWE_BID_OS_TARGET_SCHEMA.md`.

## Priorität
1. Live-Quellenabruf stabilisieren
2. Quellenstatus + Einzelabruf + Wortsuche sichtbar machen
3. Deep-Link-Validität hart prüfen
4. Ausschreibungsverständnis verbessern
5. Bid / Prüfen / No-Bid / No-Go fachlich kalibrieren
6. Missing Variables + Parameter Memory + Learning Rules operativ nutzbar machen
7. Dashboard auf Managementfragen statt Tabellenoptik ausrichten

## Wichtige Regeln
- Keine Demo-Logik verstecken
- Kein Treffer ohne belastbaren Link als operativ nutzbar markieren
- Keine `href`-Crashes
- Keine unnormalisierten Regionen im operativen Kern
- No-Bid / No-Go immer mit kurzer, lesbarer Begründung
- Admin-Korrektur muss lernfähig sein

## Arbeitsweise
- lieber vollständige vertikale Slices als halbe Oberflächen
- vorhandene Drift reduzieren
- API und UI zusammen denken
- zuerst Live-Funktion, dann Optik
MD

python3 - <<'PY'
from pathlib import Path

p = Path("docs/OpenTasks.md")
if not p.exists():
    p.write_text("# OpenTasks\n\n")

text = p.read_text()

block = """
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
"""

if "## RUWE-BID-OS-P0 — Kernstabilisierung Live-Betrieb" not in text:
    text += "\n\n" + block.strip() + "\n"
    p.write_text(text)

print("OpenTasks aktualisiert.")
PY

git add docs/RUWE_BID_OS_TARGET_SCHEMA.md docs/CODEX_RUWE_BID_OS_BRIEFING.md docs/OpenTasks.md
git commit -m "docs: define ruwe bid os target schema and opentasks for codex guidance" || true
git push origin main || true

echo "✅ Docs + OpenTasks Slice eingebaut."
