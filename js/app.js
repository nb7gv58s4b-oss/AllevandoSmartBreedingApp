
const client = window.supabaseClient;

const loginForm = document.getElementById("login-form");
const loginArea = document.getElementById("login-area");
const appArea = document.getElementById("app-area");
const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

const listaCoppie = document.getElementById("lista-coppie");
const numeroCoppie = document.getElementById("numero-coppie");

const annoDashboard = document.getElementById("anno-dashboard");
const statSoggetti = document.getElementById("stat-soggetti");
const statUova = document.getElementById("stat-uova");
const statPulli = document.getElementById("stat-pulli");
const listaPromemoria = document.getElementById("lista-promemoria");

let coppieArchivio = [];
let annoSelezionato = new Date().getFullYear();

// --------------------------------------------------
// LOGIN E SESSIONE
// --------------------------------------------------

function mostraLogin() {
    loginArea.hidden = false;
    appArea.hidden = true;
}

async function mostraUtente(user) {
    loginArea.hidden = true;
    appArea.hidden = false;

    userEmail.textContent = "Account: " + user.email;

    await caricaCoppie();
    await caricaAnniDashboard();
    await caricaDashboard();
}

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    authMessage.textContent = "Accesso in corso...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        authMessage.textContent = "Errore di accesso: " + error.message;
        return;
    }

    authMessage.textContent = "";
    await mostraUtente(data.user);
});

logoutButton.addEventListener("click", async function() {
    const { error } = await client.auth.signOut();

    if (error) {
        authMessage.textContent = "Errore durante l'uscita: " + error.message;
        return;
    }

    mostraLogin();
});

// --------------------------------------------------
// FUNZIONI GENERALI
// --------------------------------------------------

function creaElemento(tag, classe, testo) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (testo !== undefined) elemento.textContent = testo;

    return elemento;
}

function campoSoggetto(contenitore, etichetta, valore) {
    const riga = creaElemento("div", "bird-detail");

    riga.append(
        creaElemento("span", "", etichetta),
        creaElemento("strong", "", valore || "Non inserito")
    );

    contenitore.appendChild(riga);
}

function formattaData(data) {
    if (!data) return "";

    const parti = data.split("-");
    if (parti.length !== 3) return data;

    return parti[2] + "/" + parti[1] + "/" + parti[0];
}

// --------------------------------------------------
// ARCHIVIO COPPIE E SMART CARD
// --------------------------------------------------

async function caricaCoppie() {
    listaCoppie.textContent = "Caricamento coppie...";

    const { data, error } = await client
        .from("coppie")
        .select("id, codice, maschio_anello, maschio_mutazione, femmina_anello, femmina_mutazione, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        listaCoppie.textContent = "Errore nel caricamento: " + error.message;
        console.error("Errore coppie:", error);
        return;
    }

    coppieArchivio = data || [];

    const totale = coppieArchivio.length;

    numeroCoppie.textContent =
        totale + (totale === 1 ? " coppia" : " coppie");

    listaCoppie.replaceChildren();

    if (totale === 0) {
        listaCoppie.appendChild(
            creaElemento("p", "empty-state", "Non hai ancora coppie registrate.")
        );
        return;
    }

    // Recupera le Smart Card attive associate alle coppie.
    const { data: tags, error: erroreTags } = await client
        .from("tag_smart")
        .select("coppia_id, codice")
        .eq("attivo", true);

    if (erroreTags) {
        console.error("Errore caricamento Smart Card:", erroreTags);
    }

    const tagsPerCoppia = new Map();

    (tags || []).forEach(tag => {
        tagsPerCoppia.set(tag.coppia_id, tag.codice);
    });

    coppieArchivio.forEach(coppia => {
        const card = creaElemento("article", "coppia-card");

        const intestazione = creaElemento("div", "coppia-card-header");

        intestazione.append(
            creaElemento("h3", "", coppia.codice),
            creaElemento("span", "status-label", "Coppia registrata")
        );

        const soggetti = creaElemento("div", "birds-grid");

        const maschio = creaElemento("div", "bird-card male-card");
        maschio.appendChild(creaElemento("h4", "", "♂ Maschio"));

        campoSoggetto(maschio, "Anello", coppia.maschio_anello);
        campoSoggetto(maschio, "Mutazione", coppia.maschio_mutazione);

        const femmina = creaElemento("div", "bird-card female-card");
        femmina.appendChild(creaElemento("h4", "", "♀ Femmina"));

        campoSoggetto(femmina, "Anello", coppia.femmina_anello);
        campoSoggetto(femmina, "Mutazione", coppia.femmina_mutazione);

        soggetti.append(maschio, femmina);

        const azioni = creaElemento("div", "card-actions");

        const codiceTag = tagsPerCoppia.get(coppia.id);

        if (codiceTag) {
            const apriButton = creaElemento(
                "button",
                "open-card-button",
                "Apri scheda digitale"
            );

            apriButton.type = "button";

            apriButton.addEventListener("click", function() {
                const destinazione = new URL("coppia.html", window.location.href);

                destinazione.searchParams.set("tag", codiceTag);

                window.location.href = destinazione.toString();
            });

            azioni.appendChild(apriButton);
        } else {
            const statoTag = creaElemento(
                "p",
                "empty-state",
                "Smart Card non ancora assegnata a questa coppia."
            );

            azioni.appendChild(statoTag);
        }

        card.append(intestazione, soggetti, azioni);

        listaCoppie.appendChild(card);
    });
}

// --------------------------------------------------
// DASHBOARD: ANNI DISPONIBILI
// --------------------------------------------------

async function caricaAnniDashboard() {
    const { data, error } = await client
        .from("anni_riproduttivi")
        .select("anno")
        .order("anno", { ascending: false });

    if (error) {
        console.error("Errore caricamento anni:", error);

        annoDashboard.replaceChildren();

        const opzione = document.createElement("option");
        opzione.value = String(new Date().getFullYear());
        opzione.textContent = String(new Date().getFullYear());

        annoDashboard.appendChild(opzione);

        annoSelezionato = Number(opzione.value);
        return;
    }

    const anni = [...new Set((data || []).map(item => Number(item.anno)))]
        .filter(Number.isFinite)
        .sort((a, b) => b - a);

    const annoCorrente = new Date().getFullYear();

    if (!anni.includes(annoCorrente) && anni.length === 0) {
        anni.push(annoCorrente);
    }

    annoDashboard.replaceChildren();

    anni.forEach(anno => {
        const opzione = document.createElement("option");
        opzione.value = String(anno);
        opzione.textContent = String(anno);

        annoDashboard.appendChild(opzione);
    });

    if (anni.includes(annoCorrente)) {
        annoSelezionato = annoCorrente;
    } else if (anni.length > 0) {
        annoSelezionato = anni[0];
    } else {
        annoSelezionato = annoCorrente;
    }

    annoDashboard.value = String(annoSelezionato);
}

annoDashboard.addEventListener("change", async function() {
    annoSelezionato = Number(annoDashboard.value);
    await caricaDashboard();
});

// --------------------------------------------------
// DASHBOARD: CONTATORI
// --------------------------------------------------

async function caricaDashboard() {
    statSoggetti.textContent = "...";
    statUova.textContent = "...";
    statPulli.textContent = "...";

    await caricaNumeroSoggetti();
    await caricaStatisticheStagione();
    await caricaPromemoria();
}

async function caricaNumeroSoggetti() {
    const { data, error } = await client
        .from("coppie")
        .select("maschio_anello, femmina_anello");

    if (error) {
        statSoggetti.textContent = "!";
        console.error("Errore conteggio soggetti:", error);
        return;
    }

    const anelli = new Set();

    (data || []).forEach(coppia => {
        const maschio = (coppia.maschio_anello || "").trim();
        const femmina = (coppia.femmina_anello || "").trim();

        if (maschio) anelli.add(maschio.toLowerCase());
        if (femmina) anelli.add(femmina.toLowerCase());
    });

    statSoggetti.textContent = anelli.size;
}

async function caricaStatisticheStagione() {
    const { data: stagioni, error: erroreStagioni } = await client
        .from("anni_riproduttivi")
        .select("id")
        .eq("anno", annoSelezionato);

    if (erroreStagioni) {
        statUova.textContent = "!";
        statPulli.textContent = "!";
        console.error("Errore stagioni statistiche:", erroreStagioni);
        return;
    }

    const idsStagioni = (stagioni || []).map(item => item.id);

    if (idsStagioni.length === 0) {
        statUova.textContent = "0";
        statPulli.textContent = "0";
        return;
    }

    const { data: covate, error: erroreCovate } = await client
        .from("covate")
        .select("id")
        .in("anno_id", idsStagioni);

    if (erroreCovate) {
        statUova.textContent = "!";
        statPulli.textContent = "!";
        console.error("Errore covate statistiche:", erroreCovate);
        return;
    }

    const idsCovate = (covate || []).map(item => item.id);

    if (idsCovate.length === 0) {
        statUova.textContent = "0";
        statPulli.textContent = "0";
        return;
    }

    const { count: conteggioUova, error: erroreUova } = await client
        .from("uova")
        .select("*", { count: "exact", head: true })
        .in("covata_id", idsCovate);

    const { count: conteggioPulli, error: errorePulli } = await client
        .from("pulli")
        .select("*", { count: "exact", head: true })
        .in("covata_id", idsCovate);

    statUova.textContent = erroreUova ? "!" : (conteggioUova ?? 0);
    statPulli.textContent = errorePulli ? "!" : (conteggioPulli ?? 0);

    if (erroreUova) console.error("Errore conteggio uova:", erroreUova);
    if (errorePulli) console.error("Errore conteggio pulli:", errorePulli);
}

// --------------------------------------------------
// DASHBOARD: PROMEMORIA
// --------------------------------------------------

async function caricaPromemoria() {
    listaPromemoria.replaceChildren();

    const { data: stagioni, error: erroreStagioni } = await client
        .from("anni_riproduttivi")
        .select("id")
        .eq("anno", annoSelezionato);

    if (erroreStagioni) {
        listaPromemoria.textContent = "Impossibile caricare i promemoria.";
        console.error(erroreStagioni);
        return;
    }

    const idsStagioni = (stagioni || []).map(item => item.id);

    if (idsStagioni.length === 0) {
        listaPromemoria.appendChild(
            creaElemento("p", "empty-state", "Nessun promemoria per questa stagione.")
        );
        return;
    }

    const { data: covate, error: erroreCovate } = await client
        .from("covate")
        .select("id, numero, data_speratura_prevista, data_schiusa_prevista")
        .in("anno_id", idsStagioni);

    if (erroreCovate) {
        listaPromemoria.textContent = "Errore nel caricamento delle covate.";
        console.error(erroreCovate);
        return;
    }

    const archivioCovate = covate || [];
    const idsCovate = archivioCovate.map(item => item.id);

    const promemoria = [];

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    archivioCovate.forEach(covata => {
        if (covata.data_speratura_prevista) {
            promemoria.push({
                tipo: "Speratura",
                data: covata.data_speratura_prevista,
                testo: "Speratura della covata " + covata.numero
            });
        }

        if (covata.data_schiusa_prevista) {
            promemoria.push({
                tipo: "Schiusa",
                data: covata.data_schiusa_prevista,
                testo: "Controllo schiusa della covata " + covata.numero
            });
        }
    });

    if (idsCovate.length > 0) {
        const { data: pulli, error: errorePulli } = await client
            .from("pulli")
            .select("id, anello, data_nascita, data_inanellamento, covata_id")
            .in("covata_id", idsCovate);

        if (errorePulli) {
            console.error("Errore promemoria inanellamento:", errorePulli);
        } else {
            (pulli || []).forEach(pullo => {
                if (!pullo.data_inanellamento && pullo.data_nascita) {
                    promemoria.push({
                        tipo: "Inanellamento",
                        data: pullo.data_nascita,
                        testo: "Inanellamento da registrare" +
                            (pullo.anello ? " - " + pullo.anello : "")
                    });
                }
            });
        }
    }

    promemoria.sort((a, b) => a.data.localeCompare(b.data));

    const promemoriaVisibili = promemoria.filter(item => {
        const dataItem = new Date(item.data + "T00:00:00");
        return !Number.isNaN(dataItem.getTime());
    });

    if (promemoriaVisibili.length === 0) {
        listaPromemoria.appendChild(
            creaElemento("p", "empty-state", "Nessun promemoria registrato per questa stagione.")
        );
        return;
    }

    promemoriaVisibili.forEach(item => {
        const dataItem = new Date(item.data + "T00:00:00");
        const scaduto = dataItem < oggi;
        const oggiStesso = dataItem.getTime() === oggi.getTime();

        const card = creaElemento("article", "reminder-card");

        if (scaduto) card.classList.add("reminder-overdue");
        if (oggiStesso) card.classList.add("reminder-today");

        const contenuto = creaElemento("div", "reminder-content");

        contenuto.append(
            creaElemento("strong", "", item.testo),
            creaElemento("small", "", item.tipo)
        );

        const data = creaElemento("span", "reminder-date", formattaData(item.data));

        if (scaduto) {
            data.textContent += " · Da verificare";
        } else if (oggiStesso) {
            data.textContent += " · Oggi";
        }

        card.append(contenuto, data);
        listaPromemoria.appendChild(card);
    });
}

// --------------------------------------------------
// AVVIO APPLICAZIONE
// --------------------------------------------------

async function inizializzaApplicazione() {
    if (!client) {
        authMessage.textContent =
            "Errore: collegamento Supabase non disponibile.";
        return;
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
        authMessage.textContent = "Errore sessione: " + error.message;
        return;
    }

    if (data.session) {
        await mostraUtente(data.session.user);
    } else {
        mostraLogin();
    }
}

inizializzaApplicazione();
