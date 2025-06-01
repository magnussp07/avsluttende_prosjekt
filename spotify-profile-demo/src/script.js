console.log("✅ script.js is running");

const clientId = "c14eecb38eba4ff9a8f09782c98543dc"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

/* function allowDrop(even) {
    even.preventDefault();
}

function drag(even) {
    even.dataTransfer.setData("text", even.target.id);
}

function drop(even) {
    even.preventDefault();
    var fetchData = even.dataTransfer.getData("text");
    even.target.appendChild(document.getElementById(fetchData));
}
 */

if (!code) {
    console.log("🚀 Redirecting to Spotify login...");
    redirectToAuthCodeFlow(clientId);
} else {
    console.log("✅ Got code, getting token...");
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const topsongs = await fetchTopTracks(accessToken)
    console.log(topsongs)
    populateUI(profile, topsongs);
}



export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    console.log("🔎 Code:", code);
    console.log("🔑 Verifier:", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/");
    params.append("code_verifier", verifier);

    console.log("📦 Token Request Params:", params.toString());

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    
    
    console.log("🛑 Token Response:", result);

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchTopTracks(accessToken) {
  const result = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term&offset=0", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!result.ok) {
    throw new Error("Failed to fetch top tracks");
  }

  const data = await result.json();
  return data.items; }


function populateUI(profile, topsongs) {
    

    for (let i = 0; i < 15; i++) {
        const box = document.createElement("div");
        box.className = "songBox";
        box.id = `songBox${i}`;
        const newImg = document.createElement("img");
        const newsong = document.createElement("p");
        
        newImg.src = topsongs[i].album.images[0].url;
        newsong.innerText = topsongs[i].name;
        document.getElementById("hylle1").appendChild(box);
        
        document.getElementById(`songBox${i}`).style.left =  i * 55 + 15 + "px";
        
        
        document.getElementById(`songBox${i}`).appendChild(newImg);
        document.getElementById(`songBox${i}`).appendChild(newsong);
        
        
    }

 
}