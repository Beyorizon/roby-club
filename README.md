# Roby Club v2

Gestionale per Roby Club (React + Vite + Firebase).

## Requisiti

- Node.js (v18+)
- Firebase Project

## Installazione

```bash
npm install
```

## Sviluppo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Script & Tooling

### Gestione Admin Claims

Imposta i claim di amministratore per un utente (email o UID).

```bash
# Esempio
node scripts/set-admin-claim.mjs admin@example.com
```

Richiede che la variabile d'ambiente `FIREBASE_SERVICE_ACCOUNT` sia impostata con il percorso del file JSON delle credenziali, oppure che il file `serviceAccountKey.json` sia presente nella root (solo per sviluppo locale).

### Pulizia Dati Runtime

Svuota le collezioni `payments` e `logs` (utile per reset periodici o test).
**Attenzione: I dati verranno cancellati permanentemente.**

```bash
node scripts/clean-runtime-data.mjs
```
