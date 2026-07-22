async function loadNewsDatabase() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('upcoming-container').innerHTML = '<p class="text-xs text-discord-muted">No news data found.</p>';
            document.getElementById('past-container').innerHTML = '<p class="text-xs text-discord-muted">No news data found.</p>';
            return;
        }

        renderMetrics(data);
        renderNewsFeeds(data);

    } catch (error) {
        console.error('Error loading data.json:', error);
    }
}

function renderMetrics(data) {
    const completedTrades = data.filter(item => item.result && item.result.toUpperCase() !== 'PENDING');
    const wins = completedTrades.filter(item => item.result.toUpperCase() === 'WIN').length;
    
    // Winrate calculation
    const winrate = completedTrades.length > 0 ? Math.round((wins / completedTrades.length) * 100) : 0;
    document.getElementById('stat-winrate').innerText = `${winrate}%`;

    // Total Pips sum
    const totalPips = completedTrades.reduce((sum, item) => sum + (parseInt(item.pips) || 0), 0);
    document.getElementById('stat-pips').innerText = `${totalPips}+`;

    // Streak calculation
    let streak = 0;
    for (let i = 0; i < completedTrades.length; i++) {
        if (completedTrades[i].result.toUpperCase() === 'WIN') {
            streak++;
        } else {
            break;
        }
    }
    document.getElementById('stat-streak').innerText = `${streak} Streak`;
}

function renderNewsFeeds(data) {
    const upcomingContainer = document.getElementById('upcoming-container');
    const pastContainer = document.getElementById('past-container');

    upcomingContainer.innerHTML = '';
    pastContainer.innerHTML = '';

    const upcoming = data.filter(item => !item.result || item.result.toUpperCase() === 'PENDING');
    const past = data.filter(item => item.result && item.result.toUpperCase() !== 'PENDING');

    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<div class="text-xs text-discord-muted p-4 bg-discord-card border border-discord-border rounded-xl">No scheduled upcoming news events.</div>';
    } else {
        upcoming.forEach(item => {
            upcomingContainer.appendChild(createNewsCard(item, true));
        });
    }

    if (past.length === 0) {
        pastContainer.innerHTML = '<div class="text-xs text-discord-muted p-4 bg-discord-card border border-discord-border rounded-xl">No past news events recorded yet.</div>';
    } else {
        past.forEach(item => {
            pastContainer.appendChild(createNewsCard(item, false));
        });
    }
}

function createNewsCard(item, isUpcoming) {
    const card = document.createElement('div');
    const isWin = item.result && item.result.toUpperCase() === 'WIN';
    const isBuy = item.strategy && item.strategy.toUpperCase() === 'BUY';
    const trendArrow = item.trend && item.trend.toUpperCase() === 'UP' ? '↑' : '↓';
    const trendColor = item.trend && item.trend.toUpperCase() === 'UP' ? 'text-discord-green' : 'text-discord-red';

    // Format pips with '+' at the end if valid number exists
    let formattedPips = '-';
    if (item.pips) {
        const cleanPips = item.pips.toString().replace(/[^0-9-]/g, '');
        formattedPips = cleanPips ? `${cleanPips}+` : '-';
    }

    card.className = `bg-discord-card border ${isUpcoming ? 'border-discord-blurple/50' : 'border-discord-border'} rounded-xl p-5 hover:border-discord-border/80 transition`;

    card.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <!-- Left Info: Event & Strategy Badges -->
            <div class="space-y-1.5">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-base font-bold text-white">${item.event || 'News Event'}</span>
                    <span class="${trendColor} font-bold text-base">${trendArrow}</span>
                    ${item.strategy ? `<span class="px-2.5 py-0.5 text-xs font-bold ${isBuy ? 'bg-discord-green/10 text-discord-green border border-discord-green/20' : 'bg-discord-red/10 text-discord-red border border-discord-red/20'} rounded">${item.strategy}</span>` : ''}
                    ${isUpcoming ? `<span class="px-2.5 py-0.5 text-xs font-bold bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 rounded">SCHEDULED</span>` : `<span class="px-2.5 py-0.5 text-xs font-bold ${isWin ? 'bg-discord-green text-white' : 'bg-discord-red text-white'} rounded">${item.result}</span>`}
                </div>
                <p class="text-xs text-discord-muted">${item.date || 'TBD'}</p>
            </div>

            <!-- Right Info: Borderless Data Grid & Pips -->
            <div class="flex items-center gap-8">
                
                <!-- Borderless Grid for Economic Data -->
                <div class="grid grid-cols-3 gap-x-6 text-left">
                    <div>
                        <p class="text-[10px] font-semibold text-discord-muted uppercase tracking-wider">ACTUAL</p>
                        <p class="text-sm font-semibold font-mono text-white mt-0.5">${item.actual || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold text-discord-muted uppercase tracking-wider">FORECAST</p>
                        <p class="text-sm font-semibold font-mono text-white mt-0.5">${item.forecast || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold text-discord-muted uppercase tracking-wider">PREVIOUS</p>
                        <p class="text-sm font-semibold font-mono text-white mt-0.5">${item.previous || '-'}</p>
                    </div>
                </div>

                <!-- Pips Display -->
                <div class="text-right min-w-[60px]">
                    <p class="text-[10px] font-semibold text-discord-muted uppercase tracking-wider">PIPS</p>
                    <p class="text-sm font-bold font-mono ${isUpcoming ? 'text-discord-muted' : 'text-discord-green'} mt-0.5">${formattedPips}</p>
                </div>

            </div>
        </div>
        ${item.notes ? `<div class="mt-4 pt-3 border-t border-discord-border/50 text-xs text-discord-muted">${item.notes}</div>` : ''}
    `;

    return card;
}

loadNewsDatabase();
