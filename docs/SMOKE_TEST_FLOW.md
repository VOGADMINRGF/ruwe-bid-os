# RUWE Bid OS Smoke Test (Operational Core)

## Zweck
Pragmatischer End-to-End-Kernlauf ohne Live-Connector-Abhängigkeit:
- Treffer anreichern
- Opportunity erzeugen
- Fit/Decision anreichern
- Missing Variable beantworten
- Ergebnis prüfen

## Ausführen
```bash
npm run test:smoke
```

## Erwartetes Ergebnis
- JSON-Ausgabe mit `ok: true`
- `hits >= 1`
- `opportunities >= 1`
- `missingVariables >= 0`
- `answeredVariables >= 0`

## Hinweis
Der Smoke-Test nutzt eine isolierte temporäre Store-Umgebung und überschreibt den persistenten Bestand nicht dauerhaft.

