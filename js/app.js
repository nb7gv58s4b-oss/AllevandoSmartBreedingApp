
const client = window.supabaseClient;

const loginForm = document.getElementById("login-form");
const loginArea = document.getElementById("login-area");
const appArea = document.getElementById("app-area");
const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

const coppiaForm = document.getElementById("coppia-form");
const coppiaMessage = document.getElementById("coppia-message");
const listaCoppie = document.getElementById("lista-coppie");
const salvaCoppiaButton = document.getElementById("salva-coppia");
const annullaModificaButton = document.getElementById("annulla-modifica");
const titoloFormCoppia = document.getElementById("titolo-form-coppia");
const numeroCoppie = document.getElementById("numero-coppie");

const stagioneForm = document.getElementById("stagione-form");
const stagioneMessage = document.getElementById("stagione-message");
const listaStagioni = document.getElementById("lista-stagioni");
const stagioneCoppia = document.getElementById("stagione-coppia");
const stagioneAnno = document.getElementById("stagione-anno");
const creaStagioneButton = document.getElementById("crea-stagione");
const numeroStagioni = document.getElementById("numero-stagioni");

let coppiaInModifica = null;
let coppieArchivio = [];

stagioneAnno.value = new Date().getFullYear();

function mostraLogin() {
    loginArea.hidden = false;
    appArea.hidden = true;
}

async function mostraUtente(user) {
    loginArea.hidden = true;
    appArea.hidden = false;
    userEmail.textContent = "Account: " + user.email;

    await caricaStatistiche();
    await caricaCoppie();
    await caricaStagioni();
}

async function caricaStatistiche() {
    const statistiche = [
        { tabella: "coppie", elemento: "stat-coppie" },
        { tabella: "covate", elemento: "stat-covate" },
        { tabella: "uova", elemento: "stat-uova" },
        { tabella: "pulli", elemento: "stat-pulli" }
    ];

    for (const voce of statistiche) {
        const elemento = document.getElementById(voce.elemento);
        elemento.textContent = "...";

        const { count, error } = await client
            .from(voce.tabella)
            .select("*", { count: "exact", head: true });

        elemento.textContent = error ? "!" : count;

        if (error) {
            console.error("Errore statistiche:", voce.tabella, error);
        }
    }
}

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

async function caricaCoppie() {
    listaCoppie.textContent = "Caricamento coppie...";

    const { data, error } = await client
        .from("coppie")
        .select("id, codice, maschio_anello, maschio_mutazione, femmina_anello, femmina_mutazione, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        listaCoppie.textContent = "Errore nel caricamento: " + error.message;
        console.error(error);
        return;
    }

    coppieArchivio = data || [];
    listaCoppie.replaceChildren();

    const totale = coppieArchivio.length;
    numeroCoppie.textContent = totale + (totale === 1 ? " coppia" : " coppie");

    aggiornaSelettoreCoppie();

    if (totale === 0) {
        listaCoppie.appendChild(
            creaElemento("p", "empty-state", "Non hai ancora registrato coppie.")
        );
        return;
    }

    coppieArchivio.forEach(coppia => {
        const card = creaElemento("article", "coppia-card");
        const intestazione = creaElemento("div", "coppia-card-header");

        intestazione.append(
            creaElemento("h3", "", coppia.codice),
            creaElemento("span", "status-label", "Registrata")
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

        const modificaButton = creaElemento("button", "edit-button", "Modifica");
        modificaButton.type = "button";
        modificaButton.addEventListener("click", () => modificaCoppia(coppia));

        const eliminaButton = creaElemento("button", "delete-button", "Elimina");
        eliminaButton.type = "button";
        eliminaButton.addEventListener("click", () => eliminaCoppia(coppia));

        azioni.append(modificaButton, eliminaButton);
        card.append(intestazione, soggetti, azioni);
        listaCoppie.appendChild(card);
    });
}

function aggiornaSelettoreCoppie() {
    const valorePrecedente = stagioneCoppia.value;

    stagioneCoppia.replaceChildren();

    const primaOpzione = document.createElement("option");
    primaOpzione.value = "";
    primaOpzione.textContent = "Seleziona una coppia";
    stagioneCoppia.appendChild(primaOpzione);

    coppieArchivio.forEach(coppia => {
        const opzione = document.createElement("option");
        opzione.value = coppia.id;
        opzione.textContent = coppia.codice;
        stagioneCoppia.appendChild(opzione);
    });

    if (coppieArchivio.some(c => c.id === valorePrecedente)) {
        stagioneCoppia.value = valorePrecedente;
    }
}

function modificaCoppia(coppia) {
    coppiaInModifica = coppia.id;

    document.getElementById("codice-coppia").value = coppia.codice || "";
    document.getElementById("maschio-anello").value = coppia.maschio_anello || "";
    document.getElementById("maschio-mutazione").value = coppia.maschio_mutazione || "";
    document.getElementById("femmina-anello").value = coppia.femmina_anello || "";
    document.getElementById("femmina-mutazione").value = coppia.femmina_mutazione || "";

    titoloFormCoppia.textContent = "Modifica coppia " + coppia.codice;
    salvaCoppiaButton.textContent = "Aggiorna coppia";
    annullaModificaButton.hidden = false;
    coppiaMessage.textContent = "";

    document.getElementById("coppie-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function resetFormCoppia() {
    coppiaInModifica = null;
    coppiaForm.reset();
    titoloFormCoppia.textContent = "Registra una nuova coppia";
    salvaCoppiaButton.textContent = "Salva coppia";
    annullaModificaButton.hidden = true;
}

annullaModificaButton.addEventListener("click", () => {
    resetFormCoppia();
    coppiaMessage.textContent = "";
});

async function eliminaCoppia(coppia) {
    const conferma = confirm(
        "Vuoi eliminare definitivamente la coppia " + coppia.codice + "?"
    );

    if (!conferma) return;

    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError || !userData.user) {
        alert("Sessione non valida. Accedi nuovamente.");
        return;
    }

    const { error } = await client
        .from("coppie")
        .delete()
        .eq("id", coppia.id)
        .eq("user_id", userData.user.id);

    if (error) {
        alert("Errore durante l'eliminazione: " + error.message);
        console.error(error);
        return;
    }

    if (coppiaInModifica === coppia.id) resetFormCoppia();

    await caricaCoppie();
    await caricaStatistiche();
}

coppiaForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const dati = {
        codice: document.getElementById("codice-coppia").value.trim(),
        maschio_anello: document.getElementById("maschio-anello").value.trim(),
        maschio_mutazione: document.getElementById("maschio-mutazione").value.trim(),
        femmina_anello: document.getElementById("femmina-anello").value.trim(),
        femmina_mutazione: document.getElementById("femmina-mutazione").value.trim()
    };

    if (!dati.codice) {
        coppiaMessage.textContent = "Inserisci il codice identificativo.";
        return;
    }

    salvaCoppiaButton.disabled = true;
    coppiaMessage.textContent = "Verifica e salvataggio in corso...";

    try {
        const { data: userData, error: userError } = await client.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("Sessione non valida. Accedi nuovamente.");
        }

        const userId = userData.user.id;
        let coppiaEsistente = null;

        if (coppiaInModifica) {
            const { data, error } = await client
                .from("coppie")
                .select("id")
                .eq("id", coppiaInModifica)
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw error;
            coppiaEsistente = data;
        } else {
            const { data, error } = await client
                .from("coppie")
                .select("id")
                .eq("codice", dati.codice)
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw error;
            coppiaEsistente = data;
        }

        if (coppiaEsistente) {
            const { error } = await client
                .from("coppie")
                .update(dati)
                .eq("id", coppiaEsistente.id)
                .eq("user_id", userId);

            if (error) throw error;

            coppiaMessage.textContent =
                "Coppia " + dati.codice + " aggiornata correttamente.";
        } else {
            const { error } = await client
                .from("coppie")
                .insert({ ...dati, user_id: userId });

            if (error) throw error;

            coppiaMessage.textContent =
                "Coppia " + dati.codice + " registrata correttamente.";
        }

        resetFormCoppia();
        await caricaCoppie();
        await caricaStatistiche();

    } catch (error) {
        coppiaMessage.textContent = "Errore: " + error.message;
        console.error(error);
    } finally {
        salvaCoppiaButton.disabled = false;
    }
});

async function caricaStagioni() {
    listaStagioni.textContent = "Caricamento stagioni...";

    const { data: stagioni, error } = await client
        .from("anni_riproduttivi")
        .select("id, coppia_id, anno, created_at")
        .order("anno", { ascending: false });

    if (error) {
        listaStagioni.textContent = "Errore nel caricamento: " + error.message;
        console.error("Errore stagioni:", error);
        return;
    }

    const { data: covate, error: covateError } = await client
        .from("covate")
        .select("id, anno_id, numero");

    if (covateError) {
        listaStagioni.textContent = "Errore nel caricamento delle covate: " + covateError.message;
        console.error(covateError);
        return;
    }

    const archivio = stagioni || [];
    const archivioCovate = covate || [];

    numeroStagioni.textContent =
        archivio.length + (archivio.length === 1 ? " stagione" : " stagioni");

    listaStagioni.replaceChildren();

    if (archivio.length === 0) {
        listaStagioni.appendChild(
            creaElemento("p", "empty-state", "Non hai ancora creato stagioni riproduttive.")
        );
        return;
    }

    archivio.forEach(stagione => {
        const coppia = coppieArchivio.find(item => item.id === stagione.coppia_id);
        const nomeCoppia = coppia ? coppia.codice : "Coppia non disponibile";

        const covateStagione = archivioCovate.filter(
            covata => covata.anno_id === stagione.id
        );

        const card = creaElemento("article", "coppia-card");
        const intestazione = creaElemento("div", "coppia-card-header");

        intestazione.append(
            creaElemento("h3", "", nomeCoppia),
            creaElemento("span", "status-label", "Anno " + stagione.anno)
        );

        const dettagli = creaElemento("div", "bird-detail");
        dettagli.append(
            creaElemento("span", "", "Stagione riproduttiva"),
            creaElemento("strong", "", String(stagione.anno))
        );

        const riepilogo = creaElemento("div", "bird-detail");
        riepilogo.append(
            creaElemento("span", "", "Covate associate"),
            creaElemento("strong", "", String(covateStagione.length))
        );

        const elencoCovate = creaElemento("div", "season-clutches");

        covateStagione
            .sort((a, b) => a.numero - b.numero)
            .forEach(covata => {
                elencoCovate.appendChild(
                    creaElemento("span", "status-label", "Covata " + covata.numero)
                );
            });

        card.append(intestazione, dettagli, riepilogo, elencoCovate);
        listaStagioni.appendChild(card);
    });
}

stagioneForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const coppiaId = stagioneCoppia.value;
    const anno = Number.parseInt(stagioneAnno.value, 10);

    if (!coppiaId || !Number.isInteger(anno) || anno < 2000 || anno > 2100) {
        stagioneMessage.textContent = "Seleziona una coppia e inserisci un anno valido.";
        return;
    }

    creaStagioneButton.disabled = true;
    stagioneMessage.textContent = "Creazione della stagione in corso...";

    try {
        const { data: userData, error: userError } = await client.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("Sessione non valida. Accedi nuovamente.");
        }

        const { error } = await client.rpc("crea_anno_riproduttivo", {
            p_coppia_id: coppiaId,
            p_anno: anno
        });

        if (error) {
            if (error.code === "23505") {
                throw new Error("Questa coppia ha già una stagione registrata per il " + anno + ".");
            }
            throw error;
        }

        stagioneMessage.textContent =
            "Stagione " + anno + " creata correttamente. Le prime tre covate sono state generate.";

        await caricaStagioni();
        await caricaStatistiche();

    } catch (error) {
        stagioneMessage.textContent = "Errore: " + error.message;
        console.error("Errore creazione stagione:", error);
    } finally {
        creaStagioneButton.disabled = false;
    }
});

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

async function inizializzaApplicazione() {
    if (!client) {
        authMessage.textContent = "Errore: collegamento Supabase non disponibile.";
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
