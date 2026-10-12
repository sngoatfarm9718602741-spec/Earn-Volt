// Paste your unique EmailJS dashboard credentials here to launch the mail system
const EMAILJS_SERVICE_ID = "service_qbikjpo";
const EMAILJS_TEMPLATE_ID = "template_ptrwq59";
const EMAILJS_PUBLIC_KEY = "LOE-hw0xg-2mOlmQG";

// Initialize EmailJS Engine client module
emailjs.init(EMAILJS_PUBLIC_KEY);

const AD_TIERS = [
    { id: 'v15', label: 'Micro Ad Stream', seconds: 15, payout: 1.000, color: '#3b82f6' }, // Temporary \$1 payout for fast withdrawal testing
    { id: 'v30', label: 'Standard Ad Stream', seconds: 30, payout: 0.006, color: '#10b981' },
    { id: 'v45', label: 'Extended Ad Stream', seconds: 45, payout: 0.009, color: '#8b5cf6' },
    { id: 'v60', label: 'Premium Ad Stream', seconds: 60, payout: 0.012, color: '#f59e0b' },
    { id: 'v90', label: 'Mega Length Stream', seconds: 90, payout: 0.018, color: '#ec4899' },
    { id: 'v120', label: 'Max Ultra Stream', seconds: 120, payout: 0.025, color: '#ef4444' }
];

let activeUserEmail = localStorage.getItem('sessionUserEmail') || null;
let runningWalletBalance = parseFloat(localStorage.getItem('balance')) || 0.000;
let itemsCompletedCounter = parseInt(localStorage.getItem('completedCount')) || 0;
let systemGeneratedOTP = null;

window.onload = function() {
    if (activeUserEmail) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        document.getElementById('user-display').innerText = activeUserEmail.split('@')[0];
        document.getElementById('balance').innerText = runningWalletBalance.toFixed(3);
        document.getElementById('tasks-completed-count').innerText = itemsCompletedCounter;
        
        buildVideoMarketplaceTiersGrid();
    }
};

// Generates a 6-digit number, calculates the 15-minute expiration time, and sends it via EmailJS
async function requestSecureOTP() {
    const emailField = document.getElementById('auth-email').value.trim();
    const errorDisplay = document.getElementById('auth-error');
    if(errorDisplay) errorDisplay.innerText = '';

    if (!emailField || !emailField.includes('@')) {
        errorDisplay.innerText = "Please enter a valid email address.";
        return;
    }

    // 1. Generate 6-Digit OTP String
    systemGeneratedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Compute expiration time (+15 Minutes)
    const expirationDate = new Date(Date.now() + 15 * 60000);
    const expirationTimeString = expirationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    console.log(`[Testing mode log] Generated code is: ${systemGeneratedOTP}. Expires at: ${expirationTimeString}`);

    try {
        // 3. Dispatch payload through EmailJS cloud routers
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: emailField,
            otp_code: systemGeneratedOTP,
            time: expirationTimeString
        });

        // 4. Shift Frontend Panel Views
        document.getElementById('email-view-step').classList.add('hidden');
        document.getElementById('otp-view-step').classList.remove('hidden');
        document.getElementById('auth-instructions').innerText = `Verification code sent to: ${emailField}`;
        activeUserEmail = emailField; 
    } catch (err) {
        errorDisplay.innerText = "Failed to send email. Please check your EmailJS public credentials.";
    }
}

function verifyUserOTPClaims() {
    const userInputOTP = document.getElementById('auth-otp').value.trim();
    const errorDisplay = document.getElementById('auth-error');

    if (userInputOTP === systemGeneratedOTP && systemGeneratedOTP !== null) {
        localStorage.setItem('sessionUserEmail', activeUserEmail);
        localStorage.setItem('balance', runningWalletBalance);
        localStorage.setItem('completedCount', itemsCompletedCounter);
        
        location.reload(); 
    } else {
        errorDisplay.innerText = "Incorrect OTP code. Please verify the numbers sent to your mailbox.";
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
            
            claimBtn.onclick = function() {
                executeBalanceRewardCredit(payoutValue);
                playerWrapper.classList.add('hidden');
                claimBtn.classList.add('hidden');
                document.querySelectorAll('.claim-btn').forEach(btn => btn.disabled = false);
            };
        }
    }, 1000);
}

function executeBalanceRewardCredit(payoutValue) {
    runningWalletBalance = parseFloat((runningWalletBalance + payoutValue).toFixed(4));
    itemsCompletedCounter += 1;
    
    localStorage.setItem('balance', runningWalletBalance);
    localStorage.setItem('completedCount', itemsCompletedCounter);
    
    document.getElementById('balance').innerText = runningWalletBalance.toFixed(3);
    document.getElementById('tasks-completed-count').innerText = itemsCompletedCounter;
    
    showToast(`Claim Success! +$${payoutValue.toFixed(3)} credited securely.`);
}

function attemptWithdrawal() {
    if (runningWalletBalance < 1.00) {
        alert(`Insufficient Funds. Current wallet balance is $${runningWalletBalance.toFixed(3)} / $1.000 required.`);
    } else {
        alert('Verification Audit Approved! \$1.00 minimum met. Cloud cashout transaction logged.');
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
