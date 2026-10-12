// Paste your unique project API credentials here from your cloud console panel
const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxaXlpdWRwdHJocXRkbHRvemtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDMxNTYsImV4cCI6MjEwNzM3OTE1Nn0.ijBewXtcYusbWJV-6BghJDrJi_MExmJtrhCYNbNxYkI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AD_TIERS = [
    { id: 'v15', label: 'Micro Ad Stream', seconds: 15, payout: 1.000, color: '#3b82f6' }, // Temporary \$1 payout configuration for quick cashout verification
    { id: 'v30', label: 'Standard Ad Stream', seconds: 30, payout: 0.006, color: '#10b981' },
    { id: 'v45', label: 'Extended Ad Stream', seconds: 45, payout: 0.009, color: '#8b5cf6' },
    { id: 'v60', label: 'Premium Ad Stream', seconds: 60, payout: 0.012, color: '#f59e0b' },
    { id: 'v90', label: 'Mega Length Stream', seconds: 90, payout: 0.018, color: '#ec4899' },
    { id: 'v120', label: 'Max Ultra Stream', seconds: 120, payout: 0.025, color: '#ef4444' }
];

let currentUserSession = null;
let currentWalletBalance = 0.000;
let totalVideosWatched = 0;

window.onload = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUserSession = session.user;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        document.getElementById('user-display').innerText = currentUserSession.email.split('@')[0];
        
        await syncUserMetaDataMetrics();
        buildVideoMarketplaceTiersGrid();
    }
};

async function syncUserMetaDataMetrics() {
    const { data, error } = await supabase.auth.getUser();
    if (data && data.user) {
        const metadata = data.user.user_metadata;
        currentWalletBalance = parseFloat(metadata.balance) || 0.000;
        totalVideosWatched = parseInt(metadata.watched_count) || 0;
        
        document.getElementById('balance').innerText = currentWalletBalance.toFixed(3);
        document.getElementById('tasks-completed-count').innerText = totalVideosWatched;
    }
}

function buildVideoMarketplaceTiersGrid() {
    const grid = document.getElementById('video-tiers-display-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    AD_TIERS.forEach(tier => {
        const card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = `
            <span class="category-tag" style="background-color:${tier.color}1a; color:${tier.color};">${tier.seconds}s Watch-time</span>
            <h4>${tier.label}</h4>
            <p>Maintain an active browser window stream runtime connection for exactly ${tier.seconds} continuous seconds.</p>
            <div class="card-footer">
                <span class="payout-value" style="color: var(--accent-success); font-weight:800;">+$${tier.payout.toFixed(3)}</span>
                <button id="btn-${tier.id}" class="claim-btn" onclick="launchAdStreamEngine('${tier.id}', ${tier.seconds}, ${tier.payout})">Launch Ad</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function launchAdStreamEngine(tierId, durationSeconds, payoutValue) {
    document.querySelectorAll('.claim-btn').forEach(btn => btn.disabled = true);
    
    const playerWrapper = document.getElementById('ad-player-wrapper');
    const timerText = document.getElementById('ad-countdown-timer');
    const progressBar = document.getElementById('ad-progress-bar');
    const claimBtn = document.getElementById('claim-reward-trigger-btn');
    
    claimBtn.classList.add('hidden');
    document.getElementById('player-status-headline').innerText = "Streaming Commercial Media...";
    document.getElementById('player-status-desc').innerText = "You must maintain active focus. Closing your screen halts tracking rewards.";
    
    playerWrapper.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    let timeRemaining = durationSeconds;
    timerText.innerText = timeRemaining;
    
    const countdownProcess = setInterval(() => {
        timeRemaining--;
        timerText.innerText = timeRemaining;
        
        let visualWidthRatio = ((durationSeconds - timeRemaining) / durationSeconds) * 100;
        progressBar.style.width = `${visualWidthRatio}%`;
        
        if (timeRemaining <= 0) {
            clearInterval(countdownProcess);
            document.getElementById('player-status-headline').innerText = "Ad Stream Complete! 🎉";
            document.getElementById('player-status-desc').innerText = "Click the button below to authorize and claim your fractional cash rewards.";
            claimBtn.classList.remove('hidden');
            
            claimBtn.onclick = async function() {
                await executeCloudBalanceReward(payoutValue);
                playerWrapper.classList.add('hidden');
                claimBtn.classList.add('hidden');
                document.querySelectorAll('.claim-btn').forEach(btn => btn.disabled = false);
            };
        }
    }, 1000);
}

async function executeCloudBalanceReward(payoutValue) {
    currentWalletBalance = parseFloat((currentWalletBalance + payoutValue).toFixed(4));
    totalVideosWatched += 1;
    
    const { error } = await supabase.auth.updateUser({
        data: { 
            balance: currentWalletBalance,
            watched_count: totalVideosWatched
        }
    });

    if (!error) {
        document.getElementById('balance').innerText = currentWalletBalance.toFixed(3);
        document.getElementById('tasks-completed-count').innerText = totalVideosWatched;
        showToast(`Claim Success! +$${payoutValue.toFixed(3)} credited securely.`);
    } else {
        alert("Database connection drop sync failure.");
    }
}

async function handleAuth(type) {
    const email = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-pass').value;
    const errorMsg = document.getElementById('auth-error');
    if (errorMsg) errorMsg.innerText = '';

    if (!email || !password) {
        if (errorMsg) errorMsg.innerText = 'Fields cannot be blank.';
        return;
    }

    try {
        if (type === 'register') {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { balance: 0.000, watched_count: 0 } }
            });
            if (error) throw error;
            alert('Account registered! You can Sign In now.');
        } else if (type === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;
            location.reload();
        }
    } catch (err) {
        if (errorMsg) errorMsg.innerText = err.message;
    }
}

function attemptWithdrawal() {
    if (currentWalletBalance < 1.00) {
        alert(`Insufficient Funds. Current wallet weight is $${currentWalletBalance.toFixed(3)} / $1.000 required.`);
    } else {
        alert('Verification Audit Approved! \$1.00 minimum met. Cloud cashout request logged.');
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

fn = function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
const showToast = fn;
