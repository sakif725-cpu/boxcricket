// ==============================================================================
// UniBox League 2026 - Tournament Admin Command Center Controller
// ==============================================================================

let allPlayers = [];
let filteredPlayers = [];
let activeModalPlayer = null;

// DOM Elements
const rosterTableBody = document.getElementById('roster-table-body');
const searchInput = document.getElementById('filter-search');
const deptFilter = document.getElementById('filter-dept');
const roleFilter = document.getElementById('filter-role');
const statusFilter = document.getElementById('filter-status');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const exportCsvBtn = document.getElementById('export-csv-btn');
const tableSummaryCount = document.getElementById('table-summary-count');

// KPI Counter Elements
const statTotal = document.getElementById('stat-total');
const statApproved = document.getElementById('stat-approved');
const statPending = document.getElementById('stat-pending');
const statDepts = document.getElementById('stat-depts');
const statApprovedBar = document.getElementById('stat-approved-bar');
const statPendingBar = document.getElementById('stat-pending-bar');

// Modal Elements
const athleteModal = document.getElementById('athlete-modal');
const modalPhoto = document.getElementById('modal-photo');
const modalPhotoPlaceholder = document.getElementById('modal-photo-placeholder');
const modalName = document.getElementById('modal-name');
const modalEmail = document.getElementById('modal-email');
const modalEnrollment = document.getElementById('modal-enrollment');
const modalDept = document.getElementById('modal-dept');
const modalGender = document.getElementById('modal-gender');
const modalRole = document.getElementById('modal-role');
const modalCert = document.getElementById('modal-cert');
const modalCreated = document.getElementById('modal-created');
const modalStatusBadge = document.getElementById('modal-status-badge');
const modalApproveBtn = document.getElementById('modal-approve-btn');
const modalRejectBtn = document.getElementById('modal-reject-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');

// Toast Elements
const toastBanner = document.getElementById('toast-banner');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    initDbStatus();
    await loadRosterData();
    bindEventListeners();
});

// 1. Connection Status Badge
function initDbStatus() {
    const dbStatusBadge = document.getElementById('db-status-badge');
    const dbStatusText = document.getElementById('db-status-text');

    if (window.UniBoxDb && window.UniBoxDb.isReady()) {
        dbStatusText.textContent = 'Supabase Live';
        dbStatusBadge.classList.remove('hidden');
    } else {
        dbStatusText.textContent = 'Local Storage Mode';
        dbStatusBadge.classList.remove('hidden');
    }
}

// 2. Load Athletes from Supabase / UniBoxDb
async function loadRosterData() {
    // Show spinner if empty
    if (!allPlayers.length) {
        rosterTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center justify-center gap-3">
                        <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-xs">Fetching tournament athletes from Supabase...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    if (refreshIcon) refreshIcon.classList.add('animate-spin');

    try {
        if (window.UniBoxDb) {
            const { data, error } = await window.UniBoxDb.getAllPlayers();
            if (error) throw error;
            allPlayers = Array.isArray(data) ? data : [];
        } else {
            allPlayers = JSON.parse(localStorage.getItem('unibox_players') || '[]');
        }

        updateMetrics();
        applyFilters();
    } catch (err) {
        console.error('Error loading roster data:', err);
        showToast('Error loading roster data. Check database connection.', 'error');
        rosterTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-rose-400">
                    <p class="text-sm font-bold">Failed to load athletes from database.</p>
                    <p class="text-xs text-slate-500 mt-1">${err.message || 'Please check your Supabase credentials'}</p>
                </td>
            </tr>
        `;
    } finally {
        if (refreshIcon) {
            setTimeout(() => refreshIcon.classList.remove('animate-spin'), 400);
        }
    }
}

// 3. Compute and Update KPI Metrics
function updateMetrics() {
    const total = allPlayers.length;
    const approved = allPlayers.filter(p => p.status === 'Approved').length;
    const pending = allPlayers.filter(p => p.status === 'Registered' || !p.status).length;
    
    // Distinct departments
    const depts = new Set(allPlayers.map(p => (p.department || '').trim()).filter(Boolean));

    statTotal.textContent = total;
    statApproved.textContent = approved;
    statPending.textContent = pending;
    statDepts.textContent = depts.size;

    const approvedPct = total > 0 ? (approved / total) * 100 : 0;
    const pendingPct = total > 0 ? (pending / total) * 100 : 0;

    statApprovedBar.style.width = `${approvedPct}%`;
    statPendingBar.style.width = `${pendingPct}%`;
}

// 4. Filtering and Search Logic
function applyFilters() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const dept = deptFilter?.value || 'ALL';
    const role = roleFilter?.value || 'ALL';
    const status = statusFilter?.value || 'ALL';

    filteredPlayers = allPlayers.filter(player => {
        const name = (player.full_name || player.name || '').toLowerCase();
        const roll = (player.enrollment_no || '').toLowerCase();
        const email = (player.email || '').toLowerCase();
        const playerDept = (player.department || '').toLowerCase();
        const playerRole = player.player_role || '';
        const playerStatus = player.status || 'Registered';

        // Search match
        const matchesQuery = !query || 
            name.includes(query) || 
            roll.includes(query) || 
            email.includes(query) || 
            playerDept.includes(query);

        // Department match
        const matchesDept = dept === 'ALL' || (player.department || '').toUpperCase() === dept.toUpperCase();

        // Role match
        const matchesRole = role === 'ALL' || playerRole === role;

        // Status match
        const matchesStatus = status === 'ALL' || 
            (status === 'Registered' && (playerStatus === 'Registered' || !playerStatus)) ||
            playerStatus === status;

        return matchesQuery && matchesDept && matchesRole && matchesStatus;
    });

    renderRosterTable();
    updateTableSummary();
}

// 5. Render Dynamic Roster Table Rows
function renderRosterTable() {
    if (!filteredPlayers.length) {
        rosterTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-slate-500">
                    <div class="flex flex-col items-center justify-center gap-2">
                        <span class="text-3xl">🔍</span>
                        <p class="text-sm font-bold text-slate-300">No matching athletes found</p>
                        <p class="text-xs text-slate-500">Try adjusting your search or clear the filters.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    rosterTableBody.innerHTML = filteredPlayers.map((player, index) => {
        const id = player.id || player.email;
        const name = player.full_name || player.name || 'Athlete';
        const email = player.email || '---';
        const enrollment = player.enrollment_no || '---';
        const department = player.department || '---';
        const role = player.player_role || 'All-Rounder';
        const cert = player.certificate_name || player.certificate || 'None';
        const hasCert = cert && cert !== 'None' && cert !== 'None attached';
        const status = player.status || 'Registered';
        const photo = player.photo_data || null;

        // Status pill classes
        let statusBadge = '';
        if (status === 'Approved') {
            statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Approved
            </span>`;
        } else if (status === 'Rejected') {
            statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-400/10 text-rose-400 border border-rose-400/20">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Rejected
            </span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Registered
            </span>`;
        }

        // Role badge colors
        let roleBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">${role}</span>`;
        if (role === 'All-Rounder') {
            roleBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">⚡ ${role}</span>`;
        } else if (role === 'Batter') {
            roleBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-400/10 text-sky-400 border border-sky-400/20">🏏 ${role}</span>`;
        } else if (role === 'Bowler') {
            roleBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-400/10 text-teal-400 border border-teal-400/20">🎯 ${role}</span>`;
        }

        // Avatar Image or Fallback initials
        const avatarHtml = photo
            ? `<img src="${photo}" alt="${name}" class="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0">`
            : `<div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">${name.substring(0, 2).toUpperCase()}</div>`;

        return `
            <tr class="hover:bg-slate-900/80 transition-colors group">
                <!-- Athlete Profile -->
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div class="overflow-hidden">
                            <p class="font-bold text-white text-sm truncate group-hover:text-lime-400 transition-colors cursor-pointer" onclick="openAthleteModal('${id}')">${name}</p>
                            <p class="text-xs text-slate-500 font-mono truncate">${email}</p>
                        </div>
                    </div>
                </td>

                <!-- Enrollment ID -->
                <td class="py-4 px-4 font-mono text-xs text-slate-300">
                    <span class="bg-slate-950 px-2 py-1 rounded-md border border-slate-800 font-bold">${enrollment}</span>
                </td>

                <!-- Department -->
                <td class="py-4 px-4">
                    <span class="text-xs font-semibold text-slate-300">${department}</span>
                </td>

                <!-- Playing Role -->
                <td class="py-4 px-4">
                    ${roleBadge}
                </td>

                <!-- Certificate Status -->
                <td class="py-4 px-4 text-xs">
                    ${hasCert 
                        ? `<button type="button" onclick="openCertViewerFromRow('${id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/20 font-semibold transition-all cursor-pointer text-xs" title="Click to view: ${cert}">
                                👁️ <span>View Doc</span>
                           </button>` 
                        : `<span class="text-slate-600">None</span>`}
                </td>

                <!-- Clearance Status -->
                <td class="py-4 px-4">
                    ${statusBadge}
                </td>

                <!-- Actions -->
                <td class="py-4 px-6 text-right no-print">
                    <div class="flex items-center justify-end gap-1.5">
                        <!-- Quick Approve -->
                        <button type="button" onclick="handleStatusUpdate('${id}', 'Approved')"
                            class="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer" title="Approve Athlete">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>

                        <!-- Quick Reject -->
                        <button type="button" onclick="handleStatusUpdate('${id}', 'Rejected')"
                            class="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer" title="Reject / Flag Registration">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <!-- View Modal -->
                        <button type="button" onclick="openAthleteModal('${id}')"
                            class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer" title="View Full Details">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>

                        <!-- Delete -->
                        <button type="button" onclick="handleDeletePlayer('${id}')"
                            class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer" title="Delete Registration">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateTableSummary() {
    if (tableSummaryCount) {
        tableSummaryCount.textContent = `Showing ${filteredPlayers.length} of ${allPlayers.length} athletes`;
    }
}

// 6. Action Handlers: Update Clearance Status
async function handleStatusUpdate(playerId, newStatus) {
    try {
        const player = allPlayers.find(p => (p.id === playerId || p.email === playerId));
        const playerName = player ? (player.full_name || player.name) : 'Athlete';

        if (window.UniBoxDb) {
            await window.UniBoxDb.updatePlayerStatus(playerId, newStatus);
        }

        // Update local state immediately
        if (player) {
            player.status = newStatus;
        }

        updateMetrics();
        applyFilters();

        // If modal is open for this player, update modal badge
        if (activeModalPlayer && (activeModalPlayer.id === playerId || activeModalPlayer.email === playerId)) {
            activeModalPlayer.status = newStatus;
            updateModalBadges();
        }

        showToast(`${playerName} marked as ${newStatus}!`, 'success');
    } catch (err) {
        console.error('Error updating player status:', err);
        showToast('Failed to update status in database', 'error');
    }
}

// 7. Action Handlers: Delete Player
async function handleDeletePlayer(playerId) {
    const player = allPlayers.find(p => (p.id === playerId || p.email === playerId));
    const playerName = player ? (player.full_name || player.name) : 'Athlete';

    if (!confirm(`Are you sure you want to delete the registration record for ${playerName}? This action cannot be undone.`)) {
        return;
    }

    try {
        if (window.UniBoxDb) {
            await window.UniBoxDb.deletePlayer(playerId);
        }

        allPlayers = allPlayers.filter(p => p.id !== playerId && p.email !== playerId);
        updateMetrics();
        applyFilters();

        if (activeModalPlayer && (activeModalPlayer.id === playerId || activeModalPlayer.email === playerId)) {
            closeAthleteModal();
        }

        showToast(`Registration for ${playerName} deleted.`, 'info');
    } catch (err) {
        console.error('Error deleting player:', err);
        showToast('Failed to delete player from database', 'error');
    }
}

// 8. Athlete Inspection Modal
function openAthleteModal(playerId) {
    const player = allPlayers.find(p => (p.id === playerId || p.email === playerId));
    if (!player) return;

    activeModalPlayer = player;

    modalName.textContent = player.full_name || player.name || '---';
    modalEmail.textContent = player.email || '---';
    modalEnrollment.textContent = player.enrollment_no || '---';
    modalDept.textContent = player.department || '---';
    modalGender.textContent = player.gender || '---';
    modalRole.textContent = player.player_role || '---';
    modalCert.textContent = player.certificate_name || player.certificate || 'None attached';

    // Toggle certificate viewer button in inspection modal
    const modalViewCertBtn = document.getElementById('modal-view-cert-btn');
    if (modalViewCertBtn) {
        const certName = player.certificate_name || player.certificate || '';
        const hasCertDoc = certName && certName !== 'None' && certName !== 'None attached';
        if (player.certificate_data || hasCertDoc) {
            modalViewCertBtn.classList.remove('hidden');
            modalViewCertBtn.onclick = () => openCertViewerModal(certName, player.certificate_data);
        } else {
            modalViewCertBtn.classList.add('hidden');
        }
    }

    // Format date
    if (player.created_at) {
        const dateObj = new Date(player.created_at);
        modalCreated.textContent = dateObj.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } else {
        modalCreated.textContent = 'Session Record';
    }

    // Photo Preview
    if (player.photo_data) {
        modalPhoto.src = player.photo_data;
        modalPhoto.classList.remove('hidden');
        modalPhotoPlaceholder.classList.add('hidden');
    } else {
        modalPhoto.src = '';
        modalPhoto.classList.add('hidden');
        modalPhotoPlaceholder.classList.remove('hidden');
    }

    updateModalBadges();

    athleteModal.classList.remove('hidden');
    athleteModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function updateModalBadges() {
    if (!activeModalPlayer) return;
    const status = activeModalPlayer.status || 'Registered';

    if (status === 'Approved') {
        modalStatusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 mb-1';
        modalStatusBadge.textContent = 'Approved for Matchday';
    } else if (status === 'Rejected') {
        modalStatusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-400/10 text-rose-400 border border-rose-400/20 mb-1';
        modalStatusBadge.textContent = 'Clearance Rejected';
    } else {
        modalStatusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-1';
        modalStatusBadge.textContent = 'Pending Clearance';
    }
}

function closeAthleteModal() {
    activeModalPlayer = null;
    athleteModal.classList.add('hidden');
    athleteModal.classList.remove('flex');
    document.body.style.overflow = '';
}

// 9. Export to CSV Feature
function exportRosterToCsv() {
    if (!allPlayers.length) {
        showToast('No athlete data available to export.', 'info');
        return;
    }

    const dataToExport = filteredPlayers.length ? filteredPlayers : allPlayers;

    const headers = ['Full Name', 'Enrollment No', 'Department', 'Email', 'Gender', 'Player Role', 'Sports Certificate', 'Clearance Status', 'Registration Date'];
    
    const rows = dataToExport.map(p => [
        `"${(p.full_name || p.name || '').replace(/"/g, '""')}"`,
        `"${(p.enrollment_no || '').replace(/"/g, '""')}"`,
        `"${(p.department || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        `"${(p.gender || '').replace(/"/g, '""')}"`,
        `"${(p.player_role || '').replace(/"/g, '""')}"`,
        `"${(p.certificate_name || p.certificate || 'None').replace(/"/g, '""')}"`,
        `"${(p.status || 'Registered').replace(/"/g, '""')}"`,
        `"${(p.created_at || new Date().toISOString()).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unibox_tournament_roster_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${dataToExport.length} athlete records to CSV!`, 'success');
}

// 10. Toast Notification Manager
let toastTimeout = null;
function showToast(message, type = 'success') {
    if (!toastBanner) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    toastMessage.textContent = message;

    if (type === 'success') {
        toastBanner.className = 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-emerald-500/40 text-emerald-400';
        toastIcon.textContent = '✓';
    } else if (type === 'error') {
        toastBanner.className = 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-rose-500/40 text-rose-400';
        toastIcon.textContent = '✕';
    } else {
        toastBanner.className = 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-lime-500/40 text-lime-400';
        toastIcon.textContent = 'ℹ';
    }

    toastTimeout = setTimeout(() => {
        toastBanner.classList.add('translate-y-20', 'opacity-0');
    }, 3200);
}

// 11. Event Listeners Binding
function bindEventListeners() {
    searchInput?.addEventListener('input', applyFilters);
    deptFilter?.addEventListener('change', applyFilters);
    roleFilter?.addEventListener('change', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
    refreshBtn?.addEventListener('click', loadRosterData);
    exportCsvBtn?.addEventListener('click', exportRosterToCsv);

    // Modal Actions
    modalApproveBtn?.addEventListener('click', () => {
        if (activeModalPlayer) {
            handleStatusUpdate(activeModalPlayer.id || activeModalPlayer.email, 'Approved');
        }
    });

    modalRejectBtn?.addEventListener('click', () => {
        if (activeModalPlayer) {
            handleStatusUpdate(activeModalPlayer.id || activeModalPlayer.email, 'Rejected');
        }
    });

    modalDeleteBtn?.addEventListener('click', () => {
        if (activeModalPlayer) {
            handleDeletePlayer(activeModalPlayer.id || activeModalPlayer.email);
        }
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !athleteModal.classList.contains('hidden')) {
            closeAthleteModal();
        }
    });
}

// Make functions globally accessible
window.openAthleteModal = openAthleteModal;
window.closeAthleteModal = closeAthleteModal;
window.handleStatusUpdate = handleStatusUpdate;
window.handleDeletePlayer = handleDeletePlayer;

// 12. Coordinator Session Logout
function adminLogout() {
    sessionStorage.removeItem('unibox_admin_session');
    window.location.replace('login.html');
}

window.adminLogout = adminLogout;

// 13. Certificate Viewer Modal Controls
function openCertViewerModal(name, data) {
    const modal = document.getElementById('cert-viewer-modal');
    const title = document.getElementById('cert-viewer-title');
    const sub = document.getElementById('cert-viewer-sub');
    const img = document.getElementById('cert-viewer-img');
    const pdf = document.getElementById('cert-viewer-pdf');
    const empty = document.getElementById('cert-viewer-empty');
    const dlLink = document.getElementById('cert-download-link');

    if (!modal) return;

    title.textContent = name || 'Sports Certificate';
    sub.textContent = data ? 'Verified Athlete Document Proof' : 'No preview available';

    img.classList.add('hidden');
    pdf.classList.add('hidden');
    empty.classList.add('hidden');

    if (data) {
        dlLink.href = data;
        dlLink.classList.remove('hidden');

        if (data.startsWith('data:application/pdf') || data.endsWith('.pdf')) {
            pdf.src = data;
            pdf.classList.remove('hidden');
        } else {
            img.src = data;
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

function openCertViewerFromRow(playerId) {
    const player = allPlayers.find(p => (p.id === playerId || p.email === playerId));
    if (player) {
        openCertViewerModal(player.certificate_name || player.certificate || 'Sports Certificate', player.certificate_data);
    }
}

window.openCertViewerModal = openCertViewerModal;
window.closeCertViewerModal = closeCertViewerModal;
window.openCertViewerFromRow = openCertViewerFromRow;

