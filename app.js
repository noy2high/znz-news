let countdownIntervals = [];

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

    // Wins & Losses
    document.getElementById('stat-wins').innerText = wins;
    document.getElementById('stat-losses').innerText = losses;

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

    // Clear old timer intervals
    countdownIntervals.forEach(clearInterval);
    countdownIntervals = [];

    upcomingContainer.innerHTML = '';
    pastContainer.innerHTML = '';

    const upcoming = data.filter(item => !item.result || item.result.toUpperCase() === 'PENDING');
    const past = data.filter(item => item.result && item.result.toUpperCase() !== 'PENDING');

    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<div class="text-xs text-znz-muted p-4 bg-znz-card border border-znz-border rounded-xl">No scheduled upcoming news events.</div>';
    } else {
        upcoming.forEach((item, index) => {
            upcomingContainer.appendChild(createNewsCard(item, true, index));
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

function createNewsCard(item, isUpcoming, index = 0) {
    const card = document.createElement('div');
    const isWin = item.result && item.result.toUpperCase() === 'WIN';
    const isBuy = item.strategy && item.strategy.toUpperCase() === 'BUY';
    const hasStrategy = item.strategy && item.strategy !== '-' && item.strategy.trim() !== '';
    const hasTrend = item.trend && item.trend !== '-' && item.trend.trim() !== '';
    
    const trendArrow = item.trend && item.trend.toUpperCase() === 'UP' ? '↑' : (item.trend && item.trend.toUpperCase() === 'DOWN' ? '↓' : '');
    const trendColor = item.trend && item.trend.toUpperCase() === 'UP' ? 'text-znz-green' : 'text-znz-red';

    // Format pips
    let formattedPips = '-';
    if (item.pips) {
        const cleanPips = item.pips.toString().replace(/[^0-9-]/g, '');
        formattedPips = cleanPips ? `${cleanPips}+` : '-';
    }

    // Dynamic Actual value coloring
    let actualColorClass = 'text-white';
    if (!isUpcoming && item.actual) {
        actualColorClass = isBuy ? 'text-znz-green' : 'text-znz-red';
    }

    // Dynamic Side Glow Class Determination
    let glowClass = 'glow-card-purple';
    if (!isUpcoming) {
        glowClass = isWin ? 'glow-card-green' : 'glow-card-red';
    }

    const timerId = `timer-${index}`;

    card.className = `${glowClass} bg-znz-card border ${isUpcoming ? 'border-znz-purple/50' : 'border-znz-border'} rounded-xl p-4 sm:p-5 hover:border-znz-border/80 transition`;

    card.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pr-3 sm:pr-4">
            
            <!-- Left Info Header -->
            <div class="space-y-1">
                <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span class="text-sm sm:text-base font-bold text-white">${item.event || 'News Event'}</span>
                    
                    ${hasTrend && trendArrow ? `<span class="${trendColor} font-bold text-sm sm:text-base">${trendArrow}</span>` : ''}
                    ${hasStrategy ? `<span class="px-2 py-0.5 text-[10px] sm:text-xs font-bold ${isBuy ? 'bg-znz-green/10 text-znz-green border border-znz-green/20' : 'bg-znz-red/10 text-znz-red border border-znz-red/20'} rounded">${item.strategy}</span>` : ''}
                    
                    ${isUpcoming 
                        ? `<span id="${timerId}" class="px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold bg-znz-purple/20 text-znz-purple border border-znz-purple/30 rounded">SCHEDULED</span>` 
                        : `<span class="px-2 py-0.5 text-[10px] sm:text-xs font-bold ${isWin ? 'bg-znz-green text-white' : 'bg-znz-red text-white'} rounded">${item.result}</span>`
                    }
                </div>
                <p class="text-[11px] sm:text-xs text-znz-muted">${item.date || 'TBD'}</p>
            </div>

            <!-- Right Info Grid & Pips (Responsive Layout) -->
            <div class="flex items-center justify-between lg:justify-end gap-4 sm:gap-8 pt-2 lg:pt-0 border-t border-znz-border/30 lg:border-t-0">
                <div class="grid grid-cols-3 gap-x-4 sm:gap-x-6 text-left">
                    <div>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-znz-muted uppercase tracking-wider">ACTUAL</p>
                        <p class="text-xs sm:text-sm font-semibold ${actualColorClass} mt-0.5">${item.actual || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-znz-muted uppercase tracking-wider">FORECAST</p>
                        <p class="text-xs sm:text-sm font-semibold text-white mt-0.5">${item.forecast || '-'}</p>
                    </div>
                    <div>
                        <p class="text-[9px] sm:text-[10px] font-semibold text-znz-muted uppercase tracking-wider">PREVIOUS</p>
                        <p class="text-xs sm:text-sm font-semibold text-white mt-0.5">${item.previous || '-'}</p>
                    </div>
                </div>

                <div class="text-right min-w-[50px] sm:min-w-[60px]">
                    <p class="text-[9px] sm:text-[10px] font-semibold text-znz-muted uppercase tracking-wider">PIPS</p>
                    <p class="text-xs sm:text-sm font-bold ${isUpcoming ? 'text-znz-muted' : 'text-znz-green'} mt-0.5">${formattedPips}</p>
                </div>
            </div>

        </div>
        ${item.notes ? `<div class="mt-3 pt-2 sm:pt-3 border-t border-znz-border/50 text-[11px] sm:text-xs text-znz-muted">${item.notes}</div>` : ''}
    `;

    // Initialize Countdown Timer for Upcoming Events
    if (isUpcoming && item.isoDate) {
        startTimer(item.isoDate, timerId);
    }

    return card;
}

function startTimer(targetIsoDate, elementId) {
    const targetTime = new Date(targetIsoDate).getTime();

    function updateTimer() {
        const now = new Date().getTime();
        const difference = targetTime - now;

        const el = document.getElementById(elementId);
        if (!el) return;

        if (difference <= 0) {
            el.className = "px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-znz-red/20 text-znz-red border border-znz-red/30 rounded animate-pulse";
            el.innerText = "LIVE NOW";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const pad = n => n.toString().padStart(2, '0');
        el.innerText = `SCHEDULED • ${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    countdownIntervals.push(interval);
}

loadNewsDatabase();
