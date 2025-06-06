console.log("✅ script.js is running");

const clientId = "c14eecb38eba4ff9a8f09782c98543dc"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

let player;
let deviceId;
let accessToken

const antall = 40

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
    accessToken = await getAccessToken(clientId, code)
    const profile = await fetchProfile(accessToken);
    const topsongs = await fetchTopTracks(accessToken)
    const playlists = await fetchPlaylist(accessToken, profile.id)
    const liked = await fetchLiked(accessToken)
    console.log(profile)
    console.log(topsongs)
    //console.log(playlists)
    console.log(liked)

    
    populateUI(profile, topsongs, liked)

    window.onSpotifyWebPlaybackSDKReady = () => {
    player = new Spotify.Player({
      name: 'My Spotify Web Player',
      getOAuthToken: cb => { cb(accessToken); },
      volume: 0.5
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      deviceId = device_id;
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.connect();

    document.getElementById('pause').onclick = function() {
        player.togglePlay();
    };
  };

    const script = document.createElement('script');
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.head.appendChild(script);
}

// Function to play a track on the player device
async function playTrack(trackUri) {
  if (!deviceId) {
    console.log("Device ID not ready yet");
    return;
  }
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [trackUri] }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
  });
}




export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/");
    params.append("scope", "user-read-private user-read-email user-top-read user-library-read playlist-read-private streaming user-modify-playback-state");
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

async function fetchPlaylist(accessToken, id){
    const result = await fetch(`https://api.spotify.com/v1/users/${id}/playlists`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    const data = await result.json();
    return data.items; 
}

async function fetchLiked(accessToken){
    const result = await fetch(`https://api.spotify.com/v1/me/tracks?market=NO&limit=${antall}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    return await result.json()


}



async function fetchTopTracks(accessToken) {
  const result = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${antall}&time_range=short_term&offset=0`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!result.ok) {
    throw new Error("Failed to fetch top tracks");
  }

  const data = await result.json();
  return data.items; }


function populateUI(profile, topsongs, liked) {
    

    for (let i = 0; i < antall*2; i++) {
        const box = document.createElement("div");
        box.className = "songBox";
        box.id = `songBox${i}`;
        const newImg = document.createElement("img");
        const newsong = document.createElement("p");
        
        if (i < antall){
            newImg.src = topsongs[i].album.images[0].url;
            newsong.innerText = topsongs[i].name;
            document.getElementById("hylle1").appendChild(box);
            box.style.left =  i * 55 + 15 + "px"

            box.addEventListener('click', () => {
            playTrack(topsongs[i].uri);
            })
        }else{
            newImg.src = liked.items[i-antall].track.album.images[0].url;
            newsong.innerText = liked.items[i-antall].track.name;
            document.getElementById("hylle2").appendChild(box);
            box.style.left =  (i-antall) * 55 + 15 + "px"

            box.addEventListener('click', () => {
            playTrack(liked.items[i-antall].track.uri);
            })
        }
        
        
        
        
        
        box.appendChild(newImg)
        box.appendChild(newsong)


        
        
        
    }

 
}
