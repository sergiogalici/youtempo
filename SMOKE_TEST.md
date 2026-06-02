# 🧪 YouTempo — Smoke Test (Windows + Chrome/Brave)

Guida per testare l'MVP a mano. La build gira su VPS (dev env); il browser gira
su Windows. Chrome e Brave condividono il motore Chromium → stessi passaggi.

> Obiettivo: in ~5 minuti verificare che count-in, loop A-B e markers funzionino
> e persistano.

---

## Spec per agenti — cosa vogliamo dallo smoke test

Questa sezione è il **contratto**. Chi esegue lo smoke test (umano o agente) deve
produrre l'esito secondo questi criteri. Non interpretare: applica i criteri come
scritti.

### Scopo

Verificare che l'MVP **funzioni nel browser reale**, non solo che compili. Lo
smoke test conferma comportamento osservabile end-to-end, non copre qualità del
codice né edge case esotici.

### Definition of Done (DoD)

Lo smoke test è **PASS** solo se **tutti** i criteri 4.1–4.5 sono PASS e
l'estensione carica senza errori. Anche un solo criterio FAIL → esito **FAIL**
complessivo, con report del/i criterio/i rotto/i.

### Criteri di accettazione (misurabili)

Ogni criterio è binario. "Atteso" = condizione da osservare; "FAIL se" = sintomo
che invalida.

| ID | Cosa | PASS = osservi | FAIL se |
|----|------|----------------|---------|
| LOAD | Caricamento | Card "YouTempo 0.1.0", **zero** errori rossi | Errori sulla card, o estensione assente |
| BAR | Barra in-page | Barra visibile in basso al centro su pagina `/watch` | Barra assente dopo reload, o sovrapposta/illeggibile |
| 4.1 | Count-in | pausa → overlay conta da N a 1 (N = valore popup) → play automatico | Non va in pausa, countdown saltato/errato, non riparte |
| 4.2 | Loop A-B | A/B mostrati come `m:ss`; con Loop ON il rewind da B ad A avviene **entro ~1 frame** e si ripete stabile | Supera B di >0,5s prima del rewind, rewind assente, scatti continui, loop attivabile con B≤A |
| 4.3 | Markers | chip `m:ss · nome`; click timestamp → seek al punto; × → rimozione | Chip non creato, click non fa seek, × non rimuove |
| 4.4 | Persistenza | dopo F5: stessi marker + A/B; popup mantiene durata count-in | Dati persi al reload, o durata count-in resettata |
| 4.5 | SPA nav | dopo click su video correlato (no reload): dati seguono il **nuovo** videoId; ritorno → dati del primo | Barra non si riaggancia, o mostra marker del video sbagliato |

### Fuori scope (non testare, non segnalare come bug)

- Estetica/pixel-perfect della barra (placeholder).
- Icone (cerchi rossi placeholder — intenzionale).
- Shorts come superficie primaria (testa `/watch`; Shorts è best-effort).
- Performance, memoria, multi-tab simultanei.
- Vulnerabilità npm dev-deps (note, non runtime).

### Formato report richiesto

Chi esegue restituisce **esattamente** questo, niente prosa extra:

```
ESITO: PASS | FAIL
Browser: Chrome <ver> | Brave <ver>
LOAD: pass|fail
BAR:  pass|fail
4.1:  pass|fail
4.2:  pass|fail
4.3:  pass|fail
4.4:  pass|fail
4.5:  pass|fail
NOTE: <solo per i FAIL: cosa osservato vs atteso, 1 riga ciascuno>
```

Per ogni FAIL allegare, se possibile: screenshot, output console (`F12`), e
`window.__youtempo.markers.list()`. Vedi §5.

### Confine decisionale

- Un agente **non** modifica il codice durante lo smoke test: osserva e
  riporta. Fix → task separato, dopo il report.
- Dubbio se un comportamento è bug o scelta: confronta con la tabella criteri.
  Se non coperto → marcare come **fuori scope** in NOTE, non come FAIL.

---

## 0. Prerequisiti

- Windows con **Chrome** o **Brave** aggiornato.
- Accesso alla VPS (SSH/SFTP) dove sta `~/projects/youtempo`.
- Sulla VPS la cartella `dist/` deve esistere. Se manca:
  ```bash
  cd ~/projects/youtempo
  npm install
  npm run build
  ```

---

## 1. Portare `dist/` dalla VPS a Windows

Serve solo la cartella `dist/` (l'estensione compilata). Tre opzioni — scegli una.

### Opzione A — `scp` da PowerShell (consigliata)

Sul PC Windows, apri **PowerShell**:

```powershell
scp -r utente@IP_VPS:~/projects/youtempo/dist "$env:USERPROFILE\Downloads\youtempo-dist"
```

Risultato: `C:\Users\<tuo-utente>\Downloads\youtempo-dist`.

### Opzione B — zip + download (SFTP/WinSCP)

Sulla VPS:
```bash
cd ~/projects/youtempo
zip -r youtempo-dist.zip dist
```
Scarica `youtempo-dist.zip` con WinSCP/FileZilla, poi **estrai** su Windows
(es. in `Downloads\youtempo-dist`). Carica la cartella `dist` estratta, non lo zip.

### Opzione C — VS Code Remote / drag&drop

Se usi VS Code collegato alla VPS (Remote-SSH): tasto destro su `dist/` →
**Download...** → salva su Windows.

> ⚠️ Carica **una copia locale su Windows**. Caricare una cartella montata da
> rete può dare errori di lettura a Chrome.

---

## 2. Caricare l'estensione

Identico su Chrome e Brave.

1. Barra indirizzi:
   - Chrome → `chrome://extensions`
   - Brave → `brave://extensions`
2. In alto a destra attiva **Modalità sviluppatore** / **Developer mode**.
3. Click **Carica estensione non pacchettizzata** / **Load unpacked**.
4. Seleziona la cartella `dist` copiata al passo 1.
5. Compare la card **YouTempo 0.1.0**. Verifica:
   - nessun **Errori** rosso sulla card;
   - icona (cerchio rosso placeholder) visibile nella toolbar (eventualmente
     fissala dal menu puzzle 🧩).

> Brave: se i contenuti non caricano, controlla che lo **Shield** sul sito
> YouTube non blocchi script (di norma non serve toccarlo).

---

## 3. Aprire YouTube

1. Vai su un video con player normale, es. `https://www.youtube.com/watch?v=...`
   (no Shorts per il primo test).
2. Attendi che il video carichi.
3. **Atteso**: in basso al centro appare la barra **YouTempo** con i pulsanti
   `▶ Practice Start`, `Set A`, `Set B`, `⟳ Loop`, `+ Marker` e la riga
   "Nessun marker...".

Se la barra non appare → vedi **Troubleshooting**.

---

## 4. Test funzioni

### 4.1 Count-in

1. Click sull'icona YouTempo nella toolbar → si apre il **popup**.
2. Seleziona **3** secondi (per test rapido). Chiudi popup.
3. Sul video click **▶ Practice Start**.
4. **Atteso**:
   - video va in **pausa**;
   - overlay scuro a schermo con numero grande **3 → 2 → 1**;
   - all'azzeramento overlay sparisce e il video **parte**.

✅ Pass se la sequenza pausa → countdown → play è pulita.

### 4.2 Loop A-B

1. Porta il video a ~0:10, click **Set A**. La riga mostra `A 0:10`.
2. Porta il video a ~0:15, click **Set B**. La riga mostra `B 0:15`.
3. Click **⟳ Loop** → diventa verde **⟳ Loop ON**.
4. Lascia scorrere il video oltre 0:15.
5. **Atteso**: al raggiungimento di 0:15 il video **salta indietro a 0:10**,
   in modo ripetuto e stabile (rewind quasi istantaneo, niente scatti vistosi).
6. Click **⟳ Loop** di nuovo → torna grigio, riproduzione normale.

✅ Pass se il rewind è preciso (~entro un frame) e ripetibile.

> Nota: `Set B` prima di `Set A`, o B < A, non attiva il loop (pulsante resta
> semi-trasparente). Comportamento atteso.

### 4.3 Markers

1. In vari punti del video click **+ Marker**.
2. Appare un campo nome: digita es. `Solo` e premi **Enter** (oppure **Esc**
   per annullare; **Enter** su campo vuoto = marker senza nome).
3. **Atteso**: compare un chip `m:ss · Solo` nella lista.
4. Click sul **timestamp** del chip → il video **salta** a quel punto.
5. Click sulla **×** del chip → il marker **sparisce**.

✅ Pass se i chip sono cliccabili e portano al punto giusto.

### 4.4 Persistenza

1. Crea 2-3 marker + imposta A/B.
2. **Ricarica la pagina** (F5).
3. **Atteso**: barra ricompare con **gli stessi marker e A/B** (persistiti per
   `videoId`).
4. Riapri il popup → la **durata count-in scelta** è ancora quella.

✅ Pass se tutto sopravvive al reload.

### 4.5 Resilienza navigazione SPA

1. Dalla pagina video, click su un **video correlato** (naviga senza reload).
2. **Atteso**: la barra si riaggancia al nuovo video; marker/A-B sono quelli del
   **nuovo** `videoId` (vuoti se mai usato), non quelli del video precedente.
3. Torna al primo video → ricompaiono i suoi marker.

✅ Pass se i dati seguono il `videoId` corretto.

---

## 5. Check via DevTools (opzionale, per debug)

1. Sul video premi **F12** → tab **Console**.
2. Digita:
   ```js
   window.__youtempo
   ```
   **Atteso**: oggetto con `video`, `markers`, `loop`, `countIn`, `panel`,
   `settings`, `videoId`.
3. Marker salvati:
   ```js
   window.__youtempo.markers.list()
   ```
4. Storage grezzo:
   ```js
   chrome.storage.local.get(console.log)
   ```
   Cerca chiavi `yt:settings` e `yt:video:<videoId>`.

---

## 6. Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| Barra non appare | content script non iniettato | Ricarica la pagina; verifica URL `youtube.com/watch`; controlla **Errori** sulla card estensione |
| Card estensione con errori | `dist` incompleta o da rete | Ricopia `dist` in locale su Windows; rifai `npm run build` su VPS |
| Popup vuoto/non salva | storage bloccato | Verifica permesso `storage` nel manifest (già incluso); riapri popup |
| Loop scatta o non torna | A/B non validi (B≤A) | Reimposta A prima, B dopo; controlla riga `A m:ss · B m:ss` |
| Count-in non parte | un count-in già attivo | Attendi fine countdown; doppio click ignorato di proposito |
| Niente su Shorts | path diverso | Supportato `/shorts/<id>`, ma testa prima su `/watch` |
| Modifiche al codice non viste | è caricata la vecchia build | Rifai `npm run build`, ricopia `dist`, poi su `extensions` click **Ricarica** (↻) sulla card |

---

## 7. Aggiornare dopo modifiche

Loop tipico dev → test:

```bash
# su VPS
cd ~/projects/youtempo
npm run build
```
Poi ricopia `dist` su Windows (passo 1) e su `chrome://extensions` click l'icona
**Ricarica** (↻) sulla card YouTempo. Infine **F5** sulla pagina YouTube.

> `npm run dev` (HMR) è utile solo se sviluppi sulla stessa macchina del
> browser. In setup VPS→Windows usa `npm run build` + copia.

---

## Esito

Compila per tracciare:

- [ ] Estensione carica senza errori
- [ ] Barra appare sul video
- [ ] 4.1 Count-in
- [ ] 4.2 Loop A-B preciso
- [ ] 4.3 Markers cliccabili
- [ ] 4.4 Persistenza dopo reload
- [ ] 4.5 Resilienza navigazione SPA
