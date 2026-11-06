
const API = "/api";

let currentUser = null;
let authMode = "login";

const eventList = document.getElementById("eventList");
const authSection = document.getElementById("authSection");
const authForm = document.getElementById("authForm");

// Load events
async function loadEvents() {
    try {
        const response = await fetch(`${API}/events`);
        const events = await response.json();

        eventList.innerHTML = "";

        events.forEach(event => {
            const card = document.createElement("div");
            card.className = "event-card";

            card.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p><strong>Date:</strong> ${event.event_date}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p><strong>Capacity:</strong> ${event.registered_count}/${event.capacity}</p>
                <button onclick="registerForEvent(${event.id})">
                    Register
                </button>
            `;

            eventList.appendChild(card);
        });
    } catch (error) {
        eventList.textContent = "Unable to load events.";
    }
}

// Show login form
document.getElementById("loginBtn").addEventListener("click", () => {
    authMode = "login";
    document.getElementById("authTitle").textContent = "Student Login";
    document.getElementById("authSubmit").textContent = "Login";
    document.getElementById("name").hidden = true;
    document.getElementById("name").required = false;
    authSection.hidden = false;
});

// Show registration form
document.getElementById("registerBtn").addEventListener("click", () => {
    authMode = "register";
    document.getElementById("authTitle").textContent = "Student Registration";
    document.getElementById("authSubmit").textContent = "Sign Up";
    document.getElementById("name").hidden = false;
    document.getElementById("name").required = true;
    authSection.hidden = false;
});

// Login and registration
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    if (authMode === "register") {
        data.name = document.getElementById("name").value;
    }

    try {
        const response = await fetch(`${API}/${authMode}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        document.getElementById("authMessage").textContent = result.message;

        if (response.ok) {
            await checkUser();
            authForm.reset();
            authSection.hidden = true;
        }
    } catch (error) {
        document.getElementById("authMessage").textContent =
            "Something went wrong. Please try again.";
    }
});

// Check current user
async function checkUser() {
    const response = await fetch(`${API}/me`);
    const result = await response.json();

    currentUser = result.user || null;

    document.getElementById("loginBtn").hidden = !!currentUser;
    document.getElementById("registerBtn").hidden = !!currentUser;
    document.getElementById("logoutBtn").hidden = !currentUser;

    document.getElementById("adminSection").hidden =
        !currentUser || currentUser.role !== "admin";

    if (currentUser) {
        loadMyRegistrations();

        if (currentUser.role === "admin") {
            loadParticipants();
        }
    } else {
        document.getElementById("myRegistrationList").innerHTML = "";
        document.getElementById("participantsList").innerHTML = "";
    }
}

// Register for an event
async function registerForEvent(id) {
    if (!currentUser) {
        alert("Please login first to register for an event.");
        authSection.hidden = false;
        return;
    }

    try {
        const response = await fetch(`${API}/events/${id}/register`, {
            method: "POST"
        });

        const result = await response.json();
        alert(result.message || result.error || "Something went wrong.");

        loadEvents();
        loadMyRegistrations();
    } catch (error) {
        alert("Registration failed.");
    }
}

// Load student registrations
async function loadMyRegistrations() {
    const response = await fetch(`${API}/my-registrations`);
    const registrations = await response.json();

    const container = document.getElementById("myRegistrationList");
    container.innerHTML = "";

    registrations.forEach(item => {
        const p = document.createElement("p");
        p.textContent = `${item.title} - ${item.event_date} - ${item.venue}`;
        container.appendChild(p);
    });
}

// Admin: view participants
async function loadParticipants() {
    const response = await fetch(`${API}/admin/participants`);
    const participants = await response.json();

    const container = document.getElementById("participantsList");
    container.innerHTML = "";

    participants.forEach(item => {
        const p = document.createElement("p");
        p.textContent = `${item.name} - ${item.email} - ${item.title}`;
        container.appendChild(p);
    });
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await fetch(`${API}/logout`, { method: "POST" });
    currentUser = null;
    await checkUser();
    loadEvents();
});

// Initial loading
async function initialize() {
    await checkUser();
    await loadEvents();
}

initialize();
