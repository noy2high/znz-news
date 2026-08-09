const DISCORD_CLIENT_ID = '1472930195324534787';
const ZNZ_GUILD_ID = '1448366518328099004';
const ZNZ_REQUIRED_ROLE_ID = '1472941196556107959';
const REDIRECT_URI = 'https://znz-community.vercel.app/login/';

function loginWithDiscord() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20guilds%20guilds.members.read`;
    window.location.href = authUrl;
}

async function checkAuthSession() {
    let token = localStorage.getItem('znz_user_token');

    // Parse Discord hash return (#access_token=...)
    if (window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const newToken = params.get('access_token');
        if (newToken) {
            token = newToken;
            localStorage.setItem('znz_user_token', token);
            // Clean hash from URL bar
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
    }

    const isLoginPage = window.location.pathname.includes('/login');

    // Redirect to login page if unauthenticated
    if (!token) {
        if (!isLoginPage) {
            window.location.replace('/login/');
        }
        return;
    }

    try {
        const [userRes, memberRes] = await Promise.all([
            fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`https://discord.com/api/users/@me/guilds/${ZNZ_GUILD_ID}/member`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        if (!userRes.ok || !memberRes.ok) throw new Error('Session invalid or expired');

        const userData = await userRes.json();
        const memberData = await memberRes.json();

        // Check if user possesses the required verified role
        const hasRole = memberData.roles && memberData.roles.includes(ZNZ_REQUIRED_ROLE_ID);

        if (hasRole) {
            // Store user profile details for UI access
            localStorage.setItem('znz_user', userData.global_name || userData.username);
            localStorage.setItem('znz_avatar', userData.avatar 
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png'
            );

            // If verified & currently on /login/, auto-redirect to main web terminal
            if (isLoginPage) {
                window.location.replace('/');
                return;
            }

            renderLoggedInState(userData);
        } else {
            alert('Access Denied: You must possess the verified member role in the ZNZ Discord server.');
            logout();
        }
    } catch (err) {
        console.error("Auth Session Error:", err);
        logout();
    }
}

function renderLoggedInState(user) {
    // 1. Populate Main Web Terminal Sidebar (index.html)
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl) nameEl.innerText = user.global_name || user.username;
    if (avatarEl) {
        avatarEl.src = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
    }

    // 2. Populate fallback header element if present
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        authBtn.innerHTML = `
            <div class="flex items-center gap-3">
                <a href="/replay.html" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-znz-purple text-white hover:bg-znz-purple/80 transition flex items-center gap-1.5">
                    Replay Engine
                </a>
                <div class="flex items-center gap-2 pl-2 border-l border-znz-border">
                    <img src="${avatarUrl}" class="w-7 h-7 rounded-full border border-znz-purple" alt="${user.username}">
                    <span class="text-xs font-bold text-white hidden sm:inline">${user.username}</span>
                    <button onclick="logout()" class="text-[10px] text-znz-muted hover:text-znz-red underline ml-1">Sign Out</button>
                </div>
            </div>
        `;
    }
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login/');
}

document.addEventListener('DOMContentLoaded', checkAuthSession);
