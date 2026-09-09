// Box Cricket League - Interactive Script

// Tab Switching Functionality (Login / Sign Up)
function switchAuthTab(tab) {
    const loginBtn = document.getElementById('login-tab-btn');
    const signupBtn = document.getElementById('signup-tab-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (!loginBtn || !signupBtn || !loginForm || !signupForm) return;

    // Clear previous error messages
    document.getElementById('login-error-box')?.classList.add('hidden');
    document.getElementById('signup-error-box')?.classList.add('hidden');

    if (tab === 'login') {
        // Activate Login Tab
        loginBtn.classList.add('text-lime-400', 'bg-slate-900', 'shadow-sm');
        loginBtn.classList.remove('text-slate-400', 'hover:text-slate-200');

        signupBtn.classList.remove('text-lime-400', 'bg-slate-900', 'shadow-sm');
        signupBtn.classList.add('text-slate-400', 'hover:text-slate-200');

        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else if (tab === 'signup') {
        // Activate Signup Tab
        signupBtn.classList.add('text-lime-400', 'bg-slate-900', 'shadow-sm');
        signupBtn.classList.remove('text-slate-400', 'hover:text-slate-200');

        loginBtn.classList.remove('text-lime-400', 'bg-slate-900', 'shadow-sm');
        loginBtn.classList.add('text-slate-400', 'hover:text-slate-200');

        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// Make switchAuthTab accessible globally for inline onclick handlers
window.switchAuthTab = switchAuthTab;

// Modal Manager
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    // Restore scrolling if no other modals are open
    const anyModalOpen = document.querySelector('[id$="-modal"]:not(.hidden)');
    if (!anyModalOpen) {
        document.body.style.overflow = '';
    }
}

window.openModal = openModal;
window.closeModal = closeModal;

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Modal Open / Toggle Triggers
    const modalTriggers = document.querySelectorAll('[data-modal-target], [data-modal-toggle]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = trigger.getAttribute('data-modal-target') || trigger.getAttribute('data-modal-toggle');
            if (targetId) {
                openModal(targetId);

                // Handle target tab if specified (e.g. data-tab-target="signup")
                const tabTarget = trigger.getAttribute('data-tab-target');
                if (tabTarget) {
                    switchAuthTab(tabTarget);
                }
            }
        });
    });

    // Modal Close Triggers
    const closeButtons = document.querySelectorAll('[data-modal-hide]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-modal-hide');
            if (targetId) {
                closeModal(targetId);
            }
        });
    });

    // Close on backdrop click
    const modals = document.querySelectorAll('#auth-modal, #rules-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
            openModals.forEach(m => closeModal(m.id));
        }
    });

    // =========================================================================
    // ATHLETE SESSION & EXPIRATION CONFIGURATION
    // =========================================================================
    // Default short session timeout: 15 minutes (configurable via window.UniBoxConfig)
    const DEFAULT_SHORT_SESSION_DURATION = 15 * 60 * 1000;
    function getShortSessionDuration() {
        return (window.UniBoxConfig && typeof window.UniBoxConfig.SHORT_SESSION_DURATION === 'number')
            ? window.UniBoxConfig.SHORT_SESSION_DURATION
            : DEFAULT_SHORT_SESSION_DURATION;
    }

    let sessionExpiryTimer = null;
    let toastTimeout = null;

    function showSessionToast(msg, type = 'info') {
        const toast = document.getElementById('session-toast');
        const text = document.getElementById('session-toast-text');
        const icon = document.getElementById('session-toast-icon');
        if (!toast || !text) return;

        if (toastTimeout) clearTimeout(toastTimeout);

        text.textContent = msg;
        if (type === 'warning' || type === 'error') {
            toast.className = 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-amber-400 text-amber-400 text-xs font-bold pointer-events-auto';
            if (icon) icon.textContent = '⏳';
        } else {
            toast.className = 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-lime-400 text-lime-400 text-xs font-bold pointer-events-auto';
            if (icon) icon.textContent = '✓';
        }

        toastTimeout = setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            toast.classList.remove('pointer-events-auto');
            toast.classList.add('pointer-events-none');
        }, 5000);
    }

    function updateSessionBadge(staySignedIn, expiresAt) {
        const badge = document.getElementById('dash-session-badge');
        const icon = document.getElementById('dash-session-badge-icon');
        const text = document.getElementById('dash-session-badge-text');
        if (!badge || !text) return;

        if (staySignedIn) {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            if (icon) icon.textContent = '🔒';
            text.textContent = 'Stay Signed In: Active';
            badge.classList.remove('hidden');
        } else if (expiresAt) {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20';
            if (icon) icon.textContent = '⏳';
            const remainingMs = Math.max(0, expiresAt - Date.now());
            const mins = Math.max(1, Math.round(remainingMs / 60000));
            text.textContent = `Temporary Session (~${mins}m left)`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function handleSessionExpired(reason = 'Your temporary session has expired. Check "Stay signed in" to keep your session active.') {
        exitDashboard();
        showSessionToast(reason, 'warning');
        openModal('auth-modal');
        switchAuthTab('login');
        const errorBox = document.getElementById('login-error-box');
        const errorText = document.getElementById('login-error-text');
        if (errorBox && errorText) {
            errorText.textContent = reason;
            errorBox.classList.remove('hidden');
        }
    }

    // Enter Dashboard & Show Top Navigation Logout Button
    function enterDashboard(user, staySignedIn = true, existingExpiresAt = null) {
        // Add logged-in class to html root to guarantee zero visual flash
        document.documentElement.classList.add('is-athlete-logged-in');

        // Clear any previous expiry timer
        if (sessionExpiryTimer) {
            clearTimeout(sessionExpiryTimer);
            sessionExpiryTimer = null;
        }

        const isStaySignedIn = Boolean(staySignedIn);
        let expiresAt = null;

        if (!isStaySignedIn) {
            expiresAt = existingExpiresAt || (Date.now() + getShortSessionDuration());
        }

        // 1. Persist student session and profile
        if (user && user.email) {
            const sessionData = {
                email: user.email,
                name: user.name || '',
                staySignedIn: isStaySignedIn,
                loginTimestamp: Date.now(),
                expiresAt: expiresAt
            };
            localStorage.setItem('unibox_student_session', JSON.stringify(sessionData));
            localStorage.setItem('unibox_cached_profile', JSON.stringify(user));
            sessionStorage.setItem('unibox_active_email', user.email);
            sessionStorage.setItem('unibox_session_active', '1');
        }

        // Setup timer if temporary session
        if (!isStaySignedIn && expiresAt) {
            const remaining = Math.max(0, expiresAt - Date.now());
            if (remaining === 0) {
                handleSessionExpired();
                return;
            }
            sessionExpiryTimer = setTimeout(() => {
                handleSessionExpired('Your temporary session has expired. Check "Stay signed in" to keep your session active.');
            }, remaining);
        }

        // Update session badge indicator on player dashboard
        updateSessionBadge(isStaySignedIn, expiresAt);

        // 2. Hide navbar Login button & show navbar Logout button
        const navLoginBtn = document.getElementById('nav-login-btn');
        if (navLoginBtn) navLoginBtn.classList.add('hidden');

        const navLogoutBtn = document.getElementById('nav-logout-btn');
        if (navLogoutBtn) navLogoutBtn.classList.remove('hidden');

        // 3. Close the Auth modal cleanly
        closeModal('auth-modal');
        const modalElement = document.getElementById('auth-modal');
        if (modalElement) {
            modalElement.classList.add('hidden');
            modalElement.classList.remove('flex');
        }
        document.querySelector('[modal-backdrop]')?.remove();
        document.body.classList.remove('overflow-hidden');

        // 4. Hide landing hero section and reveal the dashboard
        document.querySelector('main')?.classList.add('hidden');
        document.getElementById('player-dashboard')?.classList.remove('hidden');

        // 5. Update clearance status badge based on admin's decision (Approved / Rejected / Pending)
        updateDashboardClearanceBadge(user?.status || 'Registered');

        // Re-fetch latest clearance and auction decision live from database
        const userEmail = user?.email || sessionStorage.getItem('unibox_active_email');
        if (userEmail && window.UniBoxDb) {
            window.UniBoxDb.getPlayerByEmail(userEmail).then(({ data: freshPlayer }) => {
                if (freshPlayer) {
                    applyProfileToUI(freshPlayer);
                }
            });
        }
    }

    // Dynamic Dashboard Clearance Badge Renderer
    function updateDashboardClearanceBadge(status) {
        const badge = document.getElementById('dash-clearance-status');
        if (!badge) return;

        if (status === 'Approved') {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Approved`;
        } else if (status === 'Rejected') {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-400/10 text-rose-400 border border-rose-400/20';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Rejected`;
        } else {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pending Approval`;
        }
    }

    // Exit Dashboard & Restore Top Navigation Login Button
    function exitDashboard() {
        if (sessionExpiryTimer) {
            clearTimeout(sessionExpiryTimer);
            sessionExpiryTimer = null;
        }

        // Clear saved athlete session so page returns to default
        document.documentElement.classList.remove('is-athlete-logged-in');
        localStorage.removeItem('unibox_student_session');
        localStorage.removeItem('unibox_cached_profile');
        sessionStorage.removeItem('unibox_active_email');
        sessionStorage.removeItem('unibox_session_active');

        // Hide session badge
        const badge = document.getElementById('dash-session-badge');
        if (badge) badge.classList.add('hidden');

        // 1. Restore landing hero layouts and hide dashboard
        document.querySelector('main')?.classList.remove('hidden');
        document.getElementById('player-dashboard')?.classList.add('hidden');

        // 2. Show navbar Login button & hide navbar Logout button
        const navLoginBtn = document.getElementById('nav-login-btn');
        if (navLoginBtn) navLoginBtn.classList.remove('hidden');

        const navLogoutBtn = document.getElementById('nav-logout-btn');
        if (navLogoutBtn) navLogoutBtn.classList.add('hidden');
    }

    // Form Submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value?.trim() || '';
            const password = document.getElementById('login-password')?.value || '';
            const staySignedInCheckbox = document.getElementById('login-stay-signed-in');
            const staySignedIn = Boolean(staySignedInCheckbox?.checked);
            const errorBox = document.getElementById('login-error-box');
            const errorText = document.getElementById('login-error-text');

            if (errorBox) errorBox.classList.add('hidden');

            const fallbackName = email ? email.split('@')[0] : 'Registered Athlete';
            let userProfile = { name: fallbackName, email, status: 'Registered' };

            // Fetch existing player record from database (Supabase / localStorage)
            if (window.UniBoxDb) {
                const { data: dbPlayer } = await window.UniBoxDb.getPlayerByEmail(email);

                if (!dbPlayer) {
                    if (errorBox && errorText) {
                        errorText.textContent = 'No registered athlete found with this email. Please sign up first.';
                        errorBox.classList.remove('hidden');
                    }
                    return;
                }

                // Verify Hashed Password Credential
                if (dbPlayer.password_hash) {
                    const inputHash = await window.UniBoxDb.hashPassword(password);
                    if (dbPlayer.password_hash !== inputHash) {
                        if (errorBox && errorText) {
                            errorText.textContent = 'Incorrect password. Please verify credentials.';
                            errorBox.classList.remove('hidden');
                        }
                        return;
                    }
                }

                userProfile = {
                    name: dbPlayer.full_name || dbPlayer.name || fallbackName,
                    email: dbPlayer.email,
                    enrollment_no: dbPlayer.enrollment_no || '---',
                    department: dbPlayer.department || '---',
                    gender: dbPlayer.gender || '---',
                    player_role: dbPlayer.player_role || '---',
                    certificate: dbPlayer.certificate_name || dbPlayer.certificate || 'None attached',
                    certificate_name: dbPlayer.certificate_name || dbPlayer.certificate || 'None attached',
                    certificate_data: dbPlayer.certificate_data || null,
                    photo_data: dbPlayer.photo_data || null,
                    status: dbPlayer.status || 'Registered',
                    base_price: dbPlayer.base_price,
                    sold_price: dbPlayer.sold_price,
                    sold_to_team: dbPlayer.sold_to_team,
                    sold_to_team_id: dbPlayer.sold_to_team_id,
                    auction_status: dbPlayer.auction_status
                };

                // Populate credentials table & auction status
                applyProfileToUI(userProfile);
            }

            sessionStorage.setItem('unibox_active_email', email);
            enterDashboard(userProfile, staySignedIn);
            loginForm.reset();
            if (staySignedInCheckbox) staySignedInCheckbox.checked = false;
        });
    }

    // Certificate Upload Display & Data URL Conversion
    let pendingCertData = null;
    let pendingCertName = null;
    const certInput = document.getElementById('signup-certificate');
    const certFileName = document.getElementById('certificate-filename');
    if (certInput && certFileName) {
        certInput.addEventListener('change', () => {
            if (certInput.files && certInput.files.length > 0) {
                const file = certInput.files[0];
                const sizeKb = (file.size / 1024).toFixed(1);
                pendingCertName = file.name;
                certFileName.textContent = `📎 ${file.name} (${sizeKb} KB)`;
                certFileName.classList.add('text-lime-400');

                const reader = new FileReader();
                reader.onload = (e) => {
                    pendingCertData = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                pendingCertData = null;
                pendingCertName = null;
                certFileName.textContent = 'Upload Certificate / Proof';
                certFileName.classList.remove('text-lime-400');
            }
        });
    }

    // Dynamic Profile Registration Router Handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const signupErrorBox = document.getElementById('signup-error-box');
            const signupErrorText = document.getElementById('signup-error-text');
            if (signupErrorBox) signupErrorBox.classList.add('hidden');

            // 1. Gather profile data attributes from the input fields
            const deptSelect = document.getElementById('signup-department');
            const deptText = deptSelect ? (deptSelect.options[deptSelect.selectedIndex]?.text || deptSelect.value || '') : '';
            const rawPassword = document.getElementById('signup-password')?.value || '';
            const passwordHash = window.UniBoxDb ? await window.UniBoxDb.hashPassword(rawPassword) : rawPassword;

            // Ensure certificate file is read asynchronously if user submits immediately
            const certFile = certInput?.files?.[0];
            if (certFile && !pendingCertData) {
                pendingCertData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(certFile);
                });
                pendingCertName = certFile.name;
            }

            const selectedRole = signupForm.querySelector('input[name="player_role"]:checked')?.value || document.getElementById('signup-role')?.value || 'All-Rounder';
            const defaultBase = window.UniBoxDb ? window.UniBoxDb.getDefaultBasePriceForRole(selectedRole) : 15;
            const certDisplayStr = pendingCertName ? `📎 ${pendingCertName}` : 'None attached';
            const playerData = {
                name: document.getElementById('signup-name')?.value?.trim() || '',
                enrollment_no: document.getElementById('signup-enrollment')?.value?.trim() || '',
                department: deptText,
                email: document.getElementById('signup-email')?.value?.trim() || '',
                gender: signupForm.querySelector('input[name="gender"]:checked')?.value || document.getElementById('signup-gender')?.value || 'Not specified',
                player_role: selectedRole,
                base_price: defaultBase,
                auction_status: 'Upcoming',
                certificate: certDisplayStr,
                certificate_name: certDisplayStr,
                certificate_data: pendingCertData,
                password_hash: passwordHash,
                status: 'Registered'
            };

            // 2. Persist to Database (Supabase / local fallback)
            sessionStorage.setItem('unibox_active_email', playerData.email);
            let finalProfile = playerData;
            if (window.UniBoxDb) {
                const dbResult = await window.UniBoxDb.savePlayer(playerData);
                if (dbResult.error) {
                    if (signupErrorBox && signupErrorText) {
                        signupErrorText.textContent = (dbResult.error.code === '23505' || dbResult.error.message?.includes('unique'))
                            ? 'An athlete with this email or enrollment number already exists.'
                            : (dbResult.error.message || 'Registration failed.');
                        signupErrorBox.classList.remove('hidden');
                        return;
                    }
                }
                if (dbResult.data) {
                    finalProfile = { ...playerData, ...dbResult.data };
                }
                console.log('Player registration persisted:', dbResult);
            }

            // 3. Populate all profile and auction fields on the dashboard
            applyProfileToUI(finalProfile);

            // 4. Switch to dashboard view & hide header login button
            enterDashboard(finalProfile);
            updateCertViewerButton(playerData.certificate, playerData.certificate_data);

            console.log('Successfully initialized arena profile node.', playerData);

            signupForm.reset();
            pendingCertData = null;
            pendingCertName = null;
            if (certFileName) {
                certFileName.textContent = 'Upload Certificate / Proof';
                certFileName.classList.remove('text-lime-400');
            }
        });
    }

    // Dashboard Player Photo Upload Handler
    const photoInput = document.getElementById('dash-photo-input');
    const playerPhoto = document.getElementById('dash-player-photo');
    const photoPlaceholder = document.getElementById('dash-photo-placeholder');
    const photoStatusBadge = document.getElementById('photo-status-badge');
    const photoBtnText = document.getElementById('photo-btn-text');

    if (photoInput && playerPhoto) {
        photoInput.addEventListener('change', () => {
            if (photoInput.files && photoInput.files.length > 0) {
                const file = photoInput.files[0];
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file (JPG, PNG, or WEBP).');
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    playerPhoto.src = e.target.result;
                    playerPhoto.classList.remove('hidden');
                    if (photoPlaceholder) photoPlaceholder.classList.add('hidden');
                    if (photoStatusBadge) {
                        photoStatusBadge.classList.remove('hidden');
                        photoStatusBadge.classList.add('flex');
                    }
                    if (photoBtnText) photoBtnText.textContent = 'Change Photo';

                    // Persist photo to database for active player
                    const activeEmail = sessionStorage.getItem('unibox_active_email') || document.getElementById('dash-player-email')?.innerText;
                    if (activeEmail && activeEmail !== '---' && window.UniBoxDb) {
                        await window.UniBoxDb.updatePlayerPhoto(activeEmail, e.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 6. Bind standard user logout button behavior controls (both in dashboard & header)
    document.getElementById('logout-btn')?.addEventListener('click', exitDashboard);
    document.getElementById('nav-logout-btn')?.addEventListener('click', exitDashboard);

    // Helper to immediately apply player profile to UI elements
    function applyProfileToUI(profile) {
        if (!profile) return;
        const setInnerText = (id, val) => {
            const el = document.getElementById(id);
            if (el && val) el.innerText = val;
        };
        setInnerText('dash-player-name', profile.name || profile.full_name);
        setInnerText('dash-player-name-full', profile.name || profile.full_name);
        setInnerText('dash-player-email', profile.email);
        setInnerText('dash-player-roll', profile.enrollment_no);
        setInnerText('dash-player-roll-detail', profile.enrollment_no);
        setInnerText('dash-player-dept', profile.department);
        setInnerText('dash-player-dept-detail', profile.department);
        setInnerText('dash-player-gender', profile.gender);
        setInnerText('dash-player-gender-detail', profile.gender);
        setInnerText('dash-player-role', profile.player_role);
        setInnerText('dash-player-role-detail', profile.player_role);
        setInnerText('dash-player-cert', profile.certificate || profile.certificate_name);

        updateCertViewerButton(profile.certificate || profile.certificate_name, profile.certificate_data);

        // Render Auction Base Price and Sold Status
        const role = profile.player_role || 'All-Rounder';
        const defaultRoleBasePrice = window.UniBoxDb ? window.UniBoxDb.getDefaultBasePriceForRole(role) : 15;
        const basePrice = (profile.base_price !== undefined && profile.base_price !== null && profile.base_price !== '') 
            ? Number(profile.base_price) 
            : defaultRoleBasePrice;
        setInnerText('dash-player-base-price', `₹${basePrice.toFixed(1)} Lakh`);

        const auctionStatusContainer = document.getElementById('dash-auction-status-container');
        if (auctionStatusContainer) {
            const isSold = profile.auction_status === 'Sold' || Boolean(profile.sold_to_team);
            if (isSold) {
                const soldPrice = profile.sold_price !== undefined ? Number(profile.sold_price) : basePrice;
                auctionStatusContainer.innerHTML = `
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                        <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Sold to ${profile.sold_to_team} (₹${soldPrice.toFixed(1)} Lakh)
                    </span>
                `;
            } else {
                auctionStatusContainer.innerHTML = `
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-950 text-slate-400 border border-slate-800">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Available for Bidding
                    </span>
                `;
            }
        }

        if (profile.photo_data) {
            const playerPhoto = document.getElementById('dash-player-photo');
            const photoPlaceholder = document.getElementById('dash-photo-placeholder');
            const photoStatusBadge = document.getElementById('photo-status-badge');
            const photoBtnText = document.getElementById('photo-btn-text');
            if (playerPhoto) {
                playerPhoto.src = profile.photo_data;
                playerPhoto.classList.remove('hidden');
            }
            if (photoPlaceholder) photoPlaceholder.classList.add('hidden');
            if (photoStatusBadge) {
                photoStatusBadge.classList.remove('hidden');
                photoStatusBadge.classList.add('flex');
            }
            if (photoBtnText) photoBtnText.textContent = 'Change Photo';
        }
        updateDashboardClearanceBadge(profile.status || 'Registered');
    }

    // 7. Auto-Restore Student Session on Page Load / Refresh (0ms Zero-Flicker)
    async function restoreStudentSession() {
        const savedSessionRaw = localStorage.getItem('unibox_student_session');
        if (!savedSessionRaw) return;

        try {
            const session = JSON.parse(savedSessionRaw);
            if (!session || !session.email) return;

            // Enforce temporary session checks if "Stay signed in" was NOT checked
            if (session.staySignedIn === false) {
                // Check 1: Was the browser / tab closed?
                const isTabActive = sessionStorage.getItem('unibox_session_active') === '1';
                if (!isTabActive) {
                    console.log('Temporary session ended: browser tab was closed.');
                    exitDashboard();
                    return;
                }

                // Check 2: Has the short session expired?
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    console.log('Temporary session expired after timeout.');
                    handleSessionExpired('Your temporary session has expired. Check "Stay signed in" to keep your session active.');
                    return;
                }
            }

            const email = session.email;
            const isStaySignedIn = session.staySignedIn !== false;
            const expiresAt = session.expiresAt || null;

            // Phase 1: Immediately render cached profile (0ms, zero lag!)
            const cachedProfileRaw = localStorage.getItem('unibox_cached_profile');
            if (cachedProfileRaw) {
                try {
                    const cached = JSON.parse(cachedProfileRaw);
                    if (cached && cached.email === email) {
                        applyProfileToUI(cached);
                        enterDashboard(cached, isStaySignedIn, expiresAt);
                    }
                } catch (e) {}
            }

            // Phase 2: Asynchronously fetch latest data from database in background
            let userProfile = { name: session.name || email.split('@')[0], email, status: 'Registered' };
            if (window.UniBoxDb) {
                const { data: dbPlayer } = await window.UniBoxDb.getPlayerByEmail(email);
                if (dbPlayer) {
                    userProfile = {
                        name: dbPlayer.full_name || dbPlayer.name || userProfile.name,
                        email: dbPlayer.email,
                        enrollment_no: dbPlayer.enrollment_no || '---',
                        department: dbPlayer.department || '---',
                        gender: dbPlayer.gender || '---',
                        player_role: dbPlayer.player_role || '---',
                        certificate: dbPlayer.certificate_name || dbPlayer.certificate || 'None attached',
                        certificate_name: dbPlayer.certificate_name || dbPlayer.certificate || 'None attached',
                        certificate_data: dbPlayer.certificate_data || localStorage.getItem(`unibox_cert_${email}`) || null,
                        photo_data: dbPlayer.photo_data || null,
                        status: dbPlayer.status || 'Registered',
                        base_price: dbPlayer.base_price,
                        sold_price: dbPlayer.sold_price,
                        sold_to_team: dbPlayer.sold_to_team,
                        sold_to_team_id: dbPlayer.sold_to_team_id,
                        auction_status: dbPlayer.auction_status
                    };

                    applyProfileToUI(userProfile);
                    enterDashboard(userProfile, isStaySignedIn, expiresAt);
                }
            }
        } catch (err) {
            console.warn('Session restoration error:', err);
        }
    }

    // Certificate Viewer Logic & State
    let currentAthleteCert = { name: null, data: null };

    function updateCertViewerButton(certName, certData) {
        const activeEmail = sessionStorage.getItem('unibox_active_email') || document.getElementById('dash-player-email')?.innerText;
        const cached = (activeEmail && activeEmail !== '---') ? localStorage.getItem(`unibox_cert_${activeEmail}`) : null;
        const resolvedData = certData || cached;
        const hasCert = certName && certName !== 'None' && certName !== 'None attached';

        currentAthleteCert = { name: certName, data: resolvedData };

        if (resolvedData && activeEmail && activeEmail !== '---') {
            localStorage.setItem(`unibox_cert_${activeEmail}`, resolvedData);
        }

        const btn = document.getElementById('dash-view-cert-btn');
        if (btn) {
            if (hasCert || resolvedData) {
                btn.classList.remove('hidden');
                btn.classList.add('inline-flex');
            } else {
                btn.classList.add('hidden');
                btn.classList.remove('inline-flex');
            }
        }
    }

    function openCertViewerModal(name, data) {
        const activeEmail = sessionStorage.getItem('unibox_active_email') || document.getElementById('dash-player-email')?.innerText;
        const cached = (activeEmail && activeEmail !== '---') ? localStorage.getItem(`unibox_cert_${activeEmail}`) : null;
        const resolvedData = data || currentAthleteCert.data || cached;
        const resolvedName = name || currentAthleteCert.name || 'Sports Certificate';

        const modal = document.getElementById('cert-viewer-modal');
        const title = document.getElementById('cert-viewer-title');
        const sub = document.getElementById('cert-viewer-sub');
        const img = document.getElementById('cert-viewer-img');
        const pdf = document.getElementById('cert-viewer-pdf');
        const empty = document.getElementById('cert-viewer-empty');
        const dlLink = document.getElementById('cert-download-link');

        if (!modal) {
            console.error('Certificate modal element not found!');
            return;
        }

        title.textContent = resolvedName;
        sub.textContent = resolvedData ? 'Verified Athlete Document Proof' : 'No preview available';

        img.classList.add('hidden');
        pdf.classList.add('hidden');
        empty.classList.add('hidden');

        if (resolvedData) {
            dlLink.href = resolvedData;
            dlLink.classList.remove('hidden');

            if (resolvedData.startsWith('data:application/pdf') || resolvedData.endsWith('.pdf')) {
                pdf.src = resolvedData;
                pdf.classList.remove('hidden');
            } else {
                img.src = resolvedData;
                img.classList.remove('hidden');
            }
        } else {
            dlLink.classList.add('hidden');
            empty.classList.remove('hidden');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeCertViewerModal() {
        const modal = document.getElementById('cert-viewer-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        const pdf = document.getElementById('cert-viewer-pdf');
        if (pdf) pdf.src = '';
        document.body.classList.remove('overflow-hidden');
    }

    window.openCertViewerModal = openCertViewerModal;
    window.closeCertViewerModal = closeCertViewerModal;

    document.getElementById('dash-view-cert-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openCertViewerModal(currentAthleteCert.name, currentAthleteCert.data);
    });

    // Realtime Auction Reflection on Player Dashboard
    if (window.UniBoxDb && window.UniBoxDb.subscribeToAuctionUpdates) {
        window.UniBoxDb.subscribeToAuctionUpdates(async (event) => {
            const activeEmail = sessionStorage.getItem('unibox_active_email');
            const savedSessionRaw = localStorage.getItem('unibox_student_session');
            let email = activeEmail;
            if (!email && savedSessionRaw) {
                try {
                    const session = JSON.parse(savedSessionRaw);
                    email = session?.email;
                } catch (e) {}
            }

            if (email && window.UniBoxDb) {
                const { data: freshPlayer } = await window.UniBoxDb.getPlayerByEmail(email);
                if (freshPlayer) {
                    applyProfileToUI(freshPlayer);
                }
            }
        });
    }

    // Run auto-restore
    restoreStudentSession();
});

