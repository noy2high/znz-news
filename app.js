async function loadNewsDatabase() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('upcoming-container').innerHTML = '<p class="text-xs text-znz-muted">No news data found.</p>';
            document.getElementById('past-container').innerHTML = '<p class="text-xs text-znz-muted">No news data found.</p>';
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
    const losses = completedTrades.filter(item => item.result.toUpperCase() === 'LOSS').length;
    
    // Winrate calculation
    const winrate = completedTrades.length > 0 ? Math.round((wins / completedTrades.length) * 100) : 0;
    document.getElementById('stat-winrate').innerText = `${winrate}%`;

    // Wins | Losses display
    document.getElementById('stat-wins-losses').innerText = `${wins} | ${losses}`;

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
        upcomingContainer.innerHTML = '<div class="text-xs text-znz-muted p-4 bg-znz-card border border-znz-border rounded-xl">No scheduled upcoming news events.</div>';
    } else {
        upcoming.forEach(item => {
            upcomingContainer.appendChild(createNewsCard(item, true));
        });
    }

    if (past.length === 0) {
        pastContainer.innerHTML = '<div class="text-xs text-znz-muted p-4 bg-znz-card border border-znz-border rounded-xl">No past news events recorded yet.</div>';
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
    const trendColor = item.trend && item.trend.toUpperCase() === 'UP' ? 'text-znz-green' : 'text-znz-red';

    // Format pips
    let formattedPips = '-';
    if (item.pips) {
        const cleanPips = item.pips.toString().replace(/[^0-9-]/g, '');
        formattedPips = cleanPips ? `${cleanPips}+` : '-';
    }

    // Dynamic Actual value coloring (Green for Buy wins / Red for Sell wins)
    let actualColorClass = 'text-white';
    if (!isUpcoming && item.actual) {
        actualColorClass = isBuy ? 'text-znz-green' : 'text-znz-red';
    }

    // Card wrapper with side glow
    card.className = `glow-card bg-znz-card border ${isUpcoming ? 'border-znz-purple/40' : 'border-znz-border'} rounded-xl p-5 hover:border-znz-border/80 transition`;

    card.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pr-4">
            
            <!-- Left Info: Event & Strategy Badges -->
            <div class="space-y-1.5">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-base font-bold text-white">${item.event || 'News Event'}</span>
                    <span class="${trendColor} font-bold text-base">${trendArrow}</span>
                    ${item.strategy ? `<span class="px-2.5 py-0.5 text-xs font-bold ${isBuy ? 'bg-znz-green/10 text-znz-green border border-znz-green/20' : 'bg-znz-red/10 text-znz-red border border-znz-red/20'} rounded">${item.strategy}</span>` : ''}
                    ${isUpcoming ? `<span class="px-2.5 py-0.5 text-xs font-bold bg-znz-purple/20 text-znz-purple border border-znz-purple/30 rounded">SCHEDULED</span>` : `<span class="px-2.5 py-0.5 text-xs font-bold ${isWin ? 'bg-znz-green text-white' : 'bg-znz-red text-white'} rounded">${item.result}</span>`}
                </div>
                <p class="text-xs text-znz-muted">${item.date || 'TBD'}</p>
            </div>

            <!-- Right Info: Clean Borderless Data Grid & Pips -->
            <div class="flex items-center gap-8">
                
                <div class="grid grid-cols-3 gap-x-6 text-left">
                    <div>
                        <p class="text-[10px] font-semibold text-znz-muted uppercase tracking-wider">ACTUAL</p>
                        <p class="text-sm font-semibold ${actualColorClass} mt-0.5">${item.actual || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold text-znz-muted uppercase tracking-wider">FORECAST</p>
                        <p class="text-sm font-semibold text-white mt-0.5">${item.forecast || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold text-znz-muted uppercase tracking-wider">PREVIOUS</p>
                        <p class="text-sm font-semibold text-white mt-0.5">${item.previous || '-'}</p>
                    </div>
                </div>

                <div class="text-right min-w-[60px]">
                    <p class="text-[10px] font-semibold text-znz-muted uppercase tracking-wider">PIPS</p>
                    <p class="text-sm font-bold ${isUpcoming ? 'text-znz-muted' : 'text-znz-green'} mt-0.5">${formattedPips}</p>
                </div>

            </div>
        </div>
        ${item.notes ? `<div class="mt-4 pt-3 border-t border-znz-border/50 text-xs text-znz-muted">${item.notes}</div>` : ''}
    `;

    return card;
}

loadNewsDatabase();
