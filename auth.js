const DISCORD_CLIENT_ID = '1472930195324534787';
const ZNZ_GUILD_ID = '1448366518328099004';
const REDIRECT_URI = 'https://znz-community.vercel.app/';

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function loginWithDiscord() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20guilds`;
    window.location.href = authUrl;
}

async function checkAuthSession() {
    let token = localStorage.getItem('znz_user_token');

    // Extract access_token from URL fragment after Discord redirect
    if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const newToken = params.get('access_token');
        if (newToken) {
            token = newToken;
            localStorage.setItem('znz_user_token', token);
            window.location.hash = ''; // Clean address bar
        }
    }

    if (!token) {
        return;
    }

    try {
        // Fetch user profile and joined guilds in parallel
        const [userRes, guildsRes] = await Promise.all([
            fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        if (!userRes.ok || !guildsRes.ok) throw new Error('Session expired');

        const userData = await userRes.json();
        const guilds = await guildsRes.json();

        // Check if user belongs to the ZNZ Discord server
        const isMember = guilds.some(g => g.id === ZNZ_GUILD_ID);

        if (isMember) {
            renderLoggedInState(userData);
            closeLoginModal();
        } else {
            alert('Access Denied: You must be an active member of the ZNZ Discord server to access private tools.');
            logout();
        }
    } catch (err) {
        logout();
    }
}

function renderLoggedInState(user) {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;

    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

    authBtn.outerHTML = `
        <div class="flex items-center gap-3" id="user-profile-bar">
            <a href="replay.html" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-znz-purple text-white hover:bg-znz-purple/80 transition flex items-center gap-1.5">
                <span>📈</span> Replay Engine
            </a>
            <div class="flex items-center gap-2 pl-2 border-l border-znz-border">
                <img src="${avatarUrl}" class="w-7 h-7 rounded-full border border-znz-purple" alt="${user.username}">
                <span class="text-xs font-bold text-white hidden sm:inline">${user.username}</span>
                <button onclick="logout()" class="text-[10px] text-znz-muted hover:text-znz-red underline ml-1">Sign Out</button>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('znz_user_token');
    window.location.reload();
}

// Run auth check automatically on page load
document.addEventListener('DOMContentLoaded', checkAuthSession);
