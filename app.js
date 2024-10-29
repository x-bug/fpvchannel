const clientId = 'DEINE_CLIENT_ID'; // Ersetze mit deiner Mastodon-App Client ID
const clientSecret = 'DEIN_CLIENT_SECRET'; // Ersetze mit deinem Mastodon-App Client Secret
const redirectUri = 'https://username.github.io/repository_name'; // Ersetze mit deiner GitHub Pages URL
const mastodonInstance = 'https://mastodon.social'; // Deine Mastodon-Instanz
let userAccessToken = null;
let userName = null;
let selectedSpotId = null; // Die ID des ausgewählten Spots

// Benutzer-Authentifizierung starten
function startUserAuth() {
    const authUrl = `${mastodonInstance}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read`;
    window.location.href = authUrl;
}

// Nach Authentifizierungstoken für den Benutzer suchen und Name speichern
async function handleUserAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        const tokenResponse = await fetch(`${mastodonInstance}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&redirect_uri=${redirectUri}&code=${code}`
        });

        const tokenData = await tokenResponse.json();
        userAccessToken = tokenData.access_token;

        if (userAccessToken) {
            const userResponse = await fetch(`${mastodonInstance}/api/v1/accounts/verify_credentials`, {
                headers: { 'Authorization': `Bearer ${userAccessToken}` }
            });
            const userData = await userResponse.json();
            userName = userData.username;
            alert(`Erfolgreich angemeldet als ${userName}`);
        } else {
            alert("Fehler bei der Authentifizierung des Benutzers.");
        }
    }
}

// Bei Seitenladen prüfen, ob Auth-Code in URL vorhanden ist
window.onload = function() {
    if (window.location.search.includes("code=")) {
        handleUserAuthCallback();
    }
};

// Spots abrufen
async function fetchSpots() {
    const apiUrl = `${mastodonInstance}/api/v1/accounts/verify_credentials/statuses`;

    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });

    if (response.ok) {
        const statuses = await response.json();
        const spots = statuses.filter(status => status.content.includes("Spot"));

        document.getElementById('spot-list').innerHTML = '';
        spots.forEach(spot => {
            document.getElementById('spot-list').innerHTML += `
                <div>
                    <button onclick="selectSpot('${spot.id}')">Spot: ${spot.content}</button>
                </div>
            `;
        });
    } else {
        alert("Fehler beim Abrufen der Spot-Liste.");
    }
}

// Spot auswählen
function selectSpot(spotId) {
    selectedSpotId = spotId;
    fetchChannelSelections(spotId);
}

// Kanal auswählen und posten
async function selectChannel(spotId, channelName) {
    if (!userAccessToken || !userName) {
        alert("Bitte melde dich zuerst an, um einen Kanal zu wählen.");
        return;
    }

    const apiUrl = `${mastodonInstance}/api/v1/statuses`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: `${userName} hat den Kanal "${channelName}" gewählt.`,
            in_reply_to_id: spotId
        })
    });

    if (response.ok) {
        alert(`Kanal "${channelName}" erfolgreich ausgewählt!`);
        fetchChannelSelections(spotId);
    } else {
        alert('Fehler beim Posten der Kanalauswahl.');
    }
}

// Kanalauswahlen abrufen und anzeigen
async function fetchChannelSelections(spotId) {
    const apiUrl = `${mastodonInstance}/api/v1/statuses/${spotId}/context`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });

    if (response.ok) {
        const data = await response.json();
        const replies = data.descendants;

        document.getElementById('channel-selections').innerHTML = '';
        replies.forEach(reply => {
            document.getElementById('channel-selections').innerHTML += `
                <div>
                    ${reply.account.display_name} (@${reply.account.acct}): ${reply.content}
                </div>
            `;
        });
    } else {
        alert('Fehler beim Abrufen der Kanalauswahl.');
    }
}
