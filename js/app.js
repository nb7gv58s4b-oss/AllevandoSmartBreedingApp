
const client = window.supabaseClient;

const loginForm = document.getElementById("login-form");
const loginArea = document.getElementById("login-area");
const appArea = document.getElementById("app-area");
const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

function mostraUtente(user) {
    loginArea.hidden = true;
    appArea.hidden = false;
    userEmail.textContent = "Account: " + user.email;
    caricaStatistiche();
}

function mostraLogin() {
    loginArea.hidden = false;
    appArea.hidden = true;
}

async function caricaStatistiche() {
    const tabelle = ["coppie", "covate", "uova", "pulli"];
    const elementi = document.querySelectorAll(".stat-card strong");

    for (let i = 0; i < tabelle.length; i++) {
        const { count, error } = await client
            .from(tabelle[i])
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Errore conteggio " + tabelle[i], error);
            elementi[i].textContent = "!";
        } else {
            elementi[i].textContent = count;
        }
    }
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
    mostraUtente(data.user);
});

logoutButton.addEventListener("click", async function() {
    const { error } = await client.auth.signOut();

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    mostraLogin();
});

async function controllaSessione() {
    const { data, error } = await client.auth.getSession();

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    if (data.session) {
        mostraUtente(data.session.user);
    } else {
        mostraLogin();
    }
}

controllaSessione();
