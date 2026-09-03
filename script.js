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

    // Enter Dashboard & Show Top Navigation Logout Button
    function enterDashboard(user) {
        // Add logged-in class to html root to guarantee zero visual flash
        document.documentElement.classList.add('is-athlete-logged-in');

        // 1. Persist student session and profile to localStorage
        if (user && user.email) {
            localStorage.setItem('unibox_student_session', JSON.stringify({
                email: user.email,
                name: user.name || '',
                timestamp: Date.now()
            }));
            localStorage.setItem('unibox_cached_profile', JSON.stringify(user));
            sessionStorage.setItem('unibox_active_email', user.email);
        }

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

        // Re-fetch latest clearance decision live from database
        const userEmail = user?.email || sessionStorage.getItem('unibox_active_email');
        if (userEmail && window.UniBoxDb) {
            window.UniBoxDb.getPlayerByEmail(userEmail).then(({ data: freshPlayer }) => {
                if (freshPlayer && freshPlayer.status) {
                    updateDashboardClearanceBadge(freshPlayer.status);
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
        // Clear saved athlete session so page returns to default
        document.documentElement.classList.remove('is-athlete-logged-in');
        localStorage.removeItem('unibox_student_session');
        localStorage.removeItem('unibox_cached_profile');
        sessionStorage.removeItem('unibox_active_email');

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
                    status: dbPlayer.status || 'Registered'
                };

                // Populate credentials table
                const setInnerText = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val) el.innerText = val;
                };
                setInnerText('dash-player-name', userProfile.name);
                setInnerText('dash-player-email', userProfile.email);
                setInnerText('dash-player-roll', userProfile.enrollment_no);
                setInnerText('dash-player-dept', userProfile.department);
                setInnerText('dash-player-gender', userProfile.gender);
                setInnerText('dash-player-role', userProfile.player_role);
                setInnerText('dash-player-cert', userProfile.certificate);

                // Update certificate viewer state
                updateCertViewerButton(userProfile.certificate, userProfile.certificate_data);

                // Restore photo if saved in database
                if (userProfile.photo_data) {
                    const playerPhoto = document.getElementById('dash-player-photo');
                    const photoPlaceholder = document.getElementById('dash-photo-placeholder');
                    const photoStatusBadge = document.getElementById('photo-status-badge');
                    const photoBtnText = document.getElementById('photo-btn-text');
                    if (playerPhoto) {
                        playerPhoto.src = userProfile.photo_data;
                        playerPhoto.classList.remove('hidden');
                    }
                    if (photoPlaceholder) photoPlaceholder.classList.add('hidden');
                    if (photoStatusBadge) {
                        photoStatusBadge.classList.remove('hidden');
                        photoStatusBadge.classList.add('flex');
                    }
                    if (photoBtnText) photoBtnText.textContent = 'Change Photo';
                }
            }

            sessionStorage.setItem('unibox_active_email', email);
            enterDashboard(userProfile);
            loginForm.reset();
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

            const certDisplayStr = pendingCertName ? `📎 ${pendingCertName}` : 'None attached';
            const playerData = {
                name: document.getElementById('signup-name')?.value?.trim() || '',
                enrollment_no: document.getElementById('signup-enrollment')?.value?.trim() || '',
                department: deptText,
                email: document.getElementById('signup-email')?.value?.trim() || '',
                gender: signupForm.querySelector('input[name="gender"]:checked')?.value || document.getElementById('signup-gender')?.value || 'Not specified',
                player_role: signupForm.querySelector('input[name="player_role"]:checked')?.value || document.getElementById('signup-role')?.value || 'Not selected',
                certificate: certDisplayStr,
                certificate_name: certDisplayStr,
                certificate_data: pendingCertData,
                password_hash: passwordHash,
                status: 'Registered'
            };

            // 2. Persist to Database (Supabase / local fallback)
            sessionStorage.setItem('unibox_active_email', playerData.email);
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
                console.log('Player registration persisted:', dbResult);
            }

            // 3. Inject form values directly into dashboard identity card text placeholders
            const setInnerText = (id, val) => {
                const el = document.getElementById(id);
                if (el && val) el.innerText = val;
            };

            setInnerText('dash-player-name', playerData.name);
            setInnerText('dash-player-name-full', playerData.name);
            setInnerText('dash-player-roll', playerData.enrollment_no);
            setInnerText('dash-player-roll-detail', playerData.enrollment_no);
            setInnerText('dash-player-dept', playerData.department);
            setInnerText('dash-player-dept-detail', playerData.department);
            setInnerText('dash-player-role', playerData.player_role);
            setInnerText('dash-player-role-detail', playerData.player_role);
            setInnerText('dash-player-email', playerData.email);
            setInnerText('dash-player-gender', playerData.gender);
            setInnerText('dash-player-gender-detail', playerData.gender);
            setInnerText('dash-player-cert', playerData.certificate);

            // 4. Switch to dashboard view & hide header login button
            enterDashboard(playerData);
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

            const email = session.email;

            // Phase 1: Immediately render cached profile (0ms, zero lag!)
            const cachedProfileRaw = localStorage.getItem('unibox_cached_profile');
            if (cachedProfileRaw) {
                try {
                    const cached = JSON.parse(cachedProfileRaw);
                    if (cached && cached.email === email) {
                        applyProfileToUI(cached);
                        enterDashboard(cached);
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
                        status: dbPlayer.status || 'Registered'
                    };

                    applyProfileToUI(userProfile);
                    enterDashboard(userProfile);
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

    // Run auto-restore
    restoreStudentSession();
});

