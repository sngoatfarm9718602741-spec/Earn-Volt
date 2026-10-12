// Generates a 6-digit number, attempts EmailJS transfer, and provides an automatic fallback popup if it fails
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

    activeUserEmail = emailField;

    try {
        // 3. Attempt to dispatch payload through EmailJS cloud routers
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: emailField,
            otp_code: systemGeneratedOTP,
            time: expirationTimeString
        });
        
        showToast("Verification code dispatched to your mailbox!");
    } catch (err) {
        // 4. EMERGENCY FALLBACK BYPASS: If EmailJS fails or blocks, alert the code on screen so you never get stuck!
        console.warn("EmailJS script blocked. Activating developer offline safety fallback mode.");
        alert(`[DEVELOPER BYPASS MODE]\n\nEmailJS connection failed, but your system generated this OTP code for you:\n\n👉 ${systemGeneratedOTP}\n\nCopy this code and paste it into the next screen to sign in!`);
    }

    // 5. Shift Frontend Panel Views (Always run this so the screen never freezes!)
    document.getElementById('email-view-step').classList.add('hidden');
    document.getElementById('otp-view-step').classList.remove('hidden');
    document.getElementById('auth-instructions').innerText = `Enter code to log into: ${emailField}`;
}
