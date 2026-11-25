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

// Registro generale
const listaNati = document.getElementById("lista-nati");
const numeroNati = document.getElementById("numero-nati");
const messaggioRegistro = document.getElementById("registro-nati-message");
const ricercaNati = document.getElementById("ricerca-nati");
const filtroAnnoNati = document.getElementById("filtro-anno-nati");
const filtroCoppiaNati = document.getElementById("filtro-coppia-nati");

let coppieArchivio = [];
let archivioNati = [];
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
    await caricaRegistroNati();
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

function creaCella(riga, testo, classe = "") {
    const cella = document.createElement("td");

    if (classe) cella.className = classe;

    cella.textContent =
        testo !== null && testo !== undefined && testo !== ""
            ? String(testo)
            : "—";

    riga.appendChild(cella);

    return cella;
}

function formattaData(data) {
    if (!data) return "";

    const parti = data.split("-");

    if (parti.length !== 3) return data;

    return parti[2] + "/" + parti[1] + "/" + parti[0];
}

function creaTabella(classe, intestazioni) {
    const contenitore = creaElemento("div", "table-responsive");

    const tabella = creaElemento("table", "responsive-table " + classe);

    const thead = document.createElement("thead");
    const rigaIntestazione = document.createElement("tr");

    intestazioni.forEach(titolo => {
        const th = document.createElement("th");
        th.textContent = titolo;
        th.scope = "col";
        rigaIntestazione.appendChild(th);
    });

    thead.appendChild(rigaIntestazione);

    const tbody = document.createElement("tbody");

    tabella.append(thead, tbody);
    contenitore.appendChild(tabella);

    return {
        contenitore,
        tabella,
        tbody
    };
}

// --------------------------------------------------
// ARCHIVIO COPPIE - TABELLA IN SOLA VISUALIZZAZIONE
// --------------------------------------------------

async function caricaCoppie() {
    listaCoppie.textContent = "Caricamento coppie...";

    const { data, error } = await client
        .from("coppie")
        .select(`
            id,
            codice,
            maschio_anello,
            maschio_mutazione,
            femmina_anello,
            femmina_mutazione,
            created_at
        `)
        .order("created_at", { ascending: false });

    if (error) {
        listaCoppie.textContent =
            "Errore nel caricamento: " + error.message;

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
            creaElemento(
                "p",
                "empty-state",
                "Non hai ancora coppie registrate."
            )
        );

        return;
    }

    const { contenitore, tbody } = creaTabella(
        "tabella-coppie",
        [
            "Coppia",
            "Maschio - Anello",
            "Maschio - Mutazione",
            "Femmina - Anello",
            "Femmina - Mutazione"
        ]
    );

    coppieArchivio.forEach(coppia => {
        const riga = document.createElement("tr");

        creaCella(
            riga,
            coppia.codice || "Coppia",
            "table-code"
        );

        creaCella(riga, coppia.maschio_anello);
        creaCella(riga, coppia.maschio_mutazione);
        creaCella(riga, coppia.femmina_anello);
        creaCella(riga, coppia.femmina_mutazione);

        tbody.appendChild(riga);
    });

    listaCoppie.appendChild(contenitore);
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
    }

    const anniPresenti = (data || [])
        .map(item => Number(item.anno))
        .filter(anno => Number.isInteger(anno) && anno > 0);

    const anni = [...new Set([
        ...Array.from({ length: 10 }, (_, indice) => 2026 + indice),
        ...anniPresenti
    ])].sort((a, b) => b - a);

    const annoCorrente = new Date().getFullYear();

    annoDashboard.replaceChildren();

    anni.forEach(anno => {
        const opzione = document.createElement("option");

        opzione.value = String(anno);
        opzione.textContent = String(anno);

        annoDashboard.appendChild(opzione);
    });

    if (anni.includes(annoCorrente)) {
        annoSelezionato = annoCorrente;
    } else {
        annoSelezionato = anni[0];
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

    statUova.textContent =
        erroreUova ? "!" : (conteggioUova ?? 0);

    statPulli.textContent =
        errorePulli ? "!" : (conteggioPulli ?? 0);

    if (erroreUova) {
        console.error("Errore conteggio uova:", erroreUova);
    }

    if (errorePulli) {
        console.error("Errore conteggio pulli:", errorePulli);
    }
}

// --------------------------------------------------
// REGISTRO GENERALE DEI NATI
// --------------------------------------------------

async function caricaRegistroNati() {
    listaNati.replaceChildren();

    messaggioRegistro.textContent = "Caricamento soggetti...";

    archivioNati = [];

    try {
        let tuttiIPulli = [];
        let offset = 0;
        const dimensionePagina = 1000;

        while (true) {
            const { data, error } = await client
                .from("pulli")
                .select(`
                    id,
                    covata_id,
                    uovo_id,
                    anello,
                    sesso,
                    mutazione,
                    data_nascita,
                    data_inanellamento,
                    data_svezzamento,
                    stato,
                    note
                `)
                .order("data_nascita", {
                    ascending: false,
                    nullsFirst: false
                })
                .range(offset, offset + dimensionePagina - 1);

            if (error) throw error;

            const pagina = data || [];

            tuttiIPulli = tuttiIPulli.concat(pagina);

            if (pagina.length < dimensionePagina) break;

            offset += dimensionePagina;
        }

        if (tuttiIPulli.length === 0) {
            messaggioRegistro.textContent =
                "Non risultano ancora soggetti nati registrati.";

            numeroNati.textContent = "0 soggetti";

            popolaFiltriRegistro([]);

            return;
        }

        // Recupera le covate di provenienza.

        const idsCovate = [
            ...new Set(
                tuttiIPulli
                    .map(p => p.covata_id)
                    .filter(Boolean)
            )
        ];

        const mappaCovate = new Map();

        if (idsCovate.length > 0) {
            const { data: covate, error: erroreCovate } = await client
                .from("covate")
                .select("id, numero, anno_id")
                .in("id", idsCovate);

            if (erroreCovate) throw erroreCovate;

            (covate || []).forEach(covata => {
                mappaCovate.set(covata.id, covata);
            });
        }

        // Recupera le stagioni riproduttive.

        const idsAnni = [
            ...new Set(
                [...mappaCovate.values()]
                    .map(covata => covata.anno_id)
                    .filter(Boolean)
            )
        ];

        const mappaAnni = new Map();

        if (idsAnni.length > 0) {
            const { data: stagioni, error: erroreStagioni } = await client
                .from("anni_riproduttivi")
                .select("id, anno, coppia_id")
                .in("id", idsAnni);

            if (erroreStagioni) throw erroreStagioni;

            (stagioni || []).forEach(stagione => {
                mappaAnni.set(stagione.id, stagione);
            });
        }

        // Recupera le coppie di provenienza.

        const idsCoppie = [
            ...new Set(
                [...mappaAnni.values()]
                    .map(stagione => stagione.coppia_id)
                    .filter(Boolean)
            )
        ];

        const mappaCoppie = new Map();

        if (idsCoppie.length > 0) {
            const { data: coppie, error: erroreCoppie } = await client
                .from("coppie")
                .select("id, codice")
                .in("id", idsCoppie);

            if (erroreCoppie) throw erroreCoppie;

            (coppie || []).forEach(coppia => {
                mappaCoppie.set(coppia.id, coppia);
            });
        }

        // Costruisce l'archivio generale con i riferimenti.

        archivioNati = tuttiIPulli.map(pullo => {
            const covata = mappaCovate.get(pullo.covata_id) || null;

            const stagione = covata
                ? mappaAnni.get(covata.anno_id) || null
                : null;

            const coppia = stagione
                ? mappaCoppie.get(stagione.coppia_id) || null
                : null;

            return {
                ...pullo,
                numero_covata: covata ? covata.numero : null,
                anno: stagione ? stagione.anno : null,
                coppia_codice: coppia ? coppia.codice : null,
                coppia_id: coppia ? coppia.id : null
            };
        });

        popolaFiltriRegistro(archivioNati);

        applicaFiltriRegistro();

    } catch (error) {
        console.error("Errore registro generale dei nati:", error);

        numeroNati.textContent = "!";

        messaggioRegistro.textContent =
            "Errore nel caricamento del registro: " + error.message;
    }
}

// --------------------------------------------------
// FILTRI REGISTRO GENERALE
// --------------------------------------------------

function popolaFiltriRegistro(elenco) {
    const anniPresenti = elenco
        .map(p => Number(p.anno))
        .filter(anno => Number.isInteger(anno) && anno > 0);

    const anni = [...new Set([
        ...Array.from({ length: 10 }, (_, indice) => 2026 + indice),
        ...anniPresenti
    ])].sort((a, b) => b - a);

    const coppie = [...new Map(
        elenco
            .filter(p => p.coppia_id)
            .map(p => [
                p.coppia_id,
                {
                    id: p.coppia_id,
                    codice: p.coppia_codice
                }
            ])
    ).values()].sort((a, b) =>
        String(a.codice || "").localeCompare(
            String(b.codice || ""),
            "it"
        )
    );

    const annoPrecedente = filtroAnnoNati.value;
    const coppiaPrecedente = filtroCoppiaNati.value;

    filtroAnnoNati.replaceChildren();

    const tutteLeStagioni = creaElemento(
        "option",
        "",
        "Tutte le stagioni"
    );

    tutteLeStagioni.value = "";

    filtroAnnoNati.appendChild(tutteLeStagioni);

    anni.forEach(anno => {
        const opzione = creaElemento(
            "option",
            "",
            String(anno)
        );

        opzione.value = String(anno);

        filtroAnnoNati.appendChild(opzione);
    });

    filtroCoppiaNati.replaceChildren();

    const tutteLeCoppie = creaElemento(
        "option",
        "",
        "Tutte le coppie"
    );

    tutteLeCoppie.value = "";

    filtroCoppiaNati.appendChild(tutteLeCoppie);

    coppie.forEach(coppia => {
        const opzione = creaElemento(
            "option",
            "",
            coppia.codice || "Coppia"
        );

        opzione.value = coppia.id;

        filtroCoppiaNati.appendChild(opzione);
    });

    if (anni.some(anno => String(anno) === annoPrecedente)) {
        filtroAnnoNati.value = annoPrecedente;
    }

    if (coppie.some(coppia => coppia.id === coppiaPrecedente)) {
        filtroCoppiaNati.value = coppiaPrecedente;
    }
}

function applicaFiltriRegistro() {
    const testo = ricercaNati.value.trim().toLowerCase();
    const anno = filtroAnnoNati.value;
    const coppia = filtroCoppiaNati.value;

    const filtrati = archivioNati.filter(pullo => {
        const corrispondeTesto = !testo || [
            pullo.anello,
            pullo.sesso,
            pullo.mutazione,
            pullo.stato,
            pullo.coppia_codice,
            pullo.numero_covata,
            pullo.anno
        ].some(valore =>
            String(valore || "").toLowerCase().includes(testo)
        );

        const corrispondeAnno =
            !anno || String(pullo.anno) === anno;

        const corrispondeCoppia =
            !coppia || pullo.coppia_id === coppia;

        return (
            corrispondeTesto &&
            corrispondeAnno &&
            corrispondeCoppia
        );
    });

    mostraNatiRegistro(filtrati);
}

// --------------------------------------------------
// VISUALIZZAZIONE NATI - TABELLA COMPATTA
// --------------------------------------------------

function mostraNatiRegistro(elenco) {
    listaNati.replaceChildren();

    numeroNati.textContent =
        elenco.length +
        (elenco.length === 1 ? " soggetto" : " soggetti");

    messaggioRegistro.textContent =
        elenco.length === 0
            ? "Nessun soggetto corrisponde ai filtri selezionati."
            : "Soggetti trovati: " + elenco.length;

    if (elenco.length === 0) {
        listaNati.appendChild(
            creaElemento(
                "p",
                "empty-state",
                "Nessun risultato da visualizzare."
            )
        );

        return;
    }

    const { contenitore, tbody } = creaTabella(
        "tabella-nati",
        [
            "Anello",
            "Stato",
            "Sesso",
            "Mutazione",
            "Nascita",
            "Inanellamento",
            "Svezzamento",
            "Coppia",
            "Stagione",
            "Covata",
            "Note"
        ]
    );

    elenco.forEach(pullo => {
        const riga = document.createElement("tr");

        creaCella(
            riga,
            pullo.anello || "Senza anello",
            "table-code"
        );

        const cellaStato = creaCella(
            riga,
            pullo.stato || "Registrato"
        );

        const etichettaStato = creaElemento(
            "span",
            "table-status",
            pullo.stato || "Registrato"
        );

        cellaStato.replaceChildren(etichettaStato);

        creaCella(riga, pullo.sesso);
        creaCella(riga, pullo.mutazione);
        creaCella(riga, formattaData(pullo.data_nascita));
        creaCella(riga, formattaData(pullo.data_inanellamento));
        creaCella(riga, formattaData(pullo.data_svezzamento));
        creaCella(riga, pullo.coppia_codice || "Non disponibile");
        creaCella(riga, pullo.anno || "Non disponibile");
        creaCella(
            riga,
            pullo.numero_covata !== null &&
            pullo.numero_covata !== undefined
                ? pullo.numero_covata
                : "Non disponibile"
        );
        creaCella(riga, pullo.note || "—");

        tbody.appendChild(riga);
    });

    listaNati.appendChild(contenitore);
}

ricercaNati.addEventListener("input", applicaFiltriRegistro);
filtroAnnoNati.addEventListener("change", applicaFiltriRegistro);
filtroCoppiaNati.addEventListener("change", applicaFiltriRegistro);

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
        listaPromemoria.textContent =
            "Impossibile caricare i promemoria.";

        console.error(erroreStagioni);

        return;
    }

    const idsStagioni = (stagioni || []).map(item => item.id);

    if (idsStagioni.length === 0) {
        listaPromemoria.appendChild(
            creaElemento(
                "p",
                "empty-state",
                "Nessun promemoria per questa stagione."
            )
        );

        return;
    }

    const { data: covate, error: erroreCovate } = await client
        .from("covate")
        .select(`
            id,
            numero,
            data_speratura_prevista,
            data_schiusa_prevista
        `)
        .in("anno_id", idsStagioni);

    if (erroreCovate) {
        listaPromemoria.textContent =
            "Errore nel caricamento delle covate.";

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
            .select(`
                id,
                anello,
                data_nascita,
                data_inanellamento,
                covata_id
            `)
            .in("covata_id", idsCovate);

        if (errorePulli) {
            console.error(
                "Errore promemoria inanellamento:",
                errorePulli
            );
        } else {
            (pulli || []).forEach(pullo => {
                if (
                    !pullo.data_inanellamento &&
                    pullo.data_nascita
                ) {
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

    promemoria.sort((a, b) =>
        a.data.localeCompare(b.data)
    );

    const promemoriaVisibili = promemoria.filter(item => {
        const dataItem = new Date(item.data + "T00:00:00");

        return !Number.isNaN(dataItem.getTime());
    });

    if (promemoriaVisibili.length === 0) {
        listaPromemoria.appendChild(
            creaElemento(
                "p",
                "empty-state",
                "Nessun promemoria registrato per questa stagione."
            )
        );

        return;
    }

    promemoriaVisibili.forEach(item => {
        const dataItem = new Date(item.data + "T00:00:00");

        const scaduto = dataItem < oggi;

        const oggiStesso =
            dataItem.getTime() === oggi.getTime();

        const card = creaElemento("article", "reminder-card");

        if (scaduto) {
            card.classList.add("reminder-overdue");
        }

        if (oggiStesso) {
            card.classList.add("reminder-today");
        }

        const contenuto = creaElemento(
            "div",
            "reminder-content"
        );

        contenuto.append(
            creaElemento("strong", "", item.testo),
            creaElemento("small", "", item.tipo)
        );

        const data = creaElemento(
            "span",
            "reminder-date",
            formattaData(item.data)
        );

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
        authMessage.textContent =
            "Errore sessione: " + error.message;

        return;
    }

    if (data.session) {
        await mostraUtente(data.session.user);
    } else {
        mostraLogin();
    }
}

inizializzaApplicazione();
