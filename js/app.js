
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

async function caricaCoppie() {
    listaCoppie.textContent = "Caricamento coppie...";

    const { data, error } = await client
        .from("coppie")
        .select("id, codice, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        listaCoppie.textContent = "Errore nel caricamento: " + error.message;
        console.error(error);
        return;
    }

    listaCoppie.replaceChildren();

    if (!data || data.length === 0) {
        listaCoppie.textContent = "Non hai ancora registrato coppie.";
        return;
    }

    data.forEach(coppia => {
        const elemento = document.createElement("div");
        elemento.className = "coppia-item";

        const nome = document.createElement("strong");
        nome.textContent = coppia.codice;

        elemento.appendChild(nome);
        listaCoppie.appendChild(elemento);
    });
}

coppiaForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const codice = document
        .getElementById("codice-coppia")
        .value.trim();

    if (!codice) {
        coppiaMessage.textContent = "Inserisci il codice della coppia.";
        return;
    }

    salvaCoppiaButton.disabled = true;
    coppiaMessage.textContent = "Salvataggio in corso...";

    try {
        const { data: userData, error: userError } =
            await client.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("Sessione non valida. Accedi nuovamente.");
        }

        const { error } = await client
            .from("coppie")
            .insert({
                user_id: userData.user.id,
                codice: codice
            });

        if (error) {
            throw error;
        }

        coppiaMessage.textContent = "Coppia registrata correttamente.";
        coppiaForm.reset();

        await caricaCoppie();
        await caricaStatistiche();

    } catch (error) {
        coppiaMessage.textContent = "Errore: " + error.message;
        console.error(error);
    } finally {
        salvaCoppiaButton.disabled = false;
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
