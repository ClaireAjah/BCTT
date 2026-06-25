let currentUser = null;
let vitalsChartInstance = null;

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

async function fetchMe() {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success) {
            currentUser = data.data;
            document.getElementById('userName').textContent = currentUser.full_name;
        } else {
            window.location.href = '/login.html';
        }
    } catch (err) {
        window.location.href = '/login.html';
    }
}

document.getElementById('btnLogout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
});

async function loadDoctors() {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    if (data.success) {
        const select = document.getElementById('doctorSelect');
        select.innerHTML = '<option value="">Pilih Dokter</option>';
        data.data.forEach(doc => {
            select.innerHTML += `<option value="${doc.id}">${doc.full_name} - ${doc.specialization || 'Umum'}</option>`;
        });
    }
}

async function loadAppointments() {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    if (data.success) {
        const tbody = document.getElementById('appointmentTableBody');
        tbody.innerHTML = '';
        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Belum ada janji temu</td></tr>';
            return;
        }
        data.data.forEach(app => {
            const date = new Date(app.appointment_date).toLocaleString('id-ID');
            const statusClass = `status-${app.status.toLowerCase()}`;
            tbody.innerHTML += `
                <tr>
                    <td>${escapeHTML(date)}</td>
                    <td>${escapeHTML(app.doctor ? app.doctor.full_name : 'Unknown')}</td>
                    <td><span class="status-badge ${statusClass}">${escapeHTML(app.status)}</span></td>
                </tr>
            `;
        });
    }
}

async function loadVitals() {
    const res = await fetch('/api/vitals');
    const data = await res.json();
    if (data.success) {
        const labels = data.data.map(v => new Date(v.recorded_at).toLocaleDateString('id-ID'));
        const hrData = data.data.map(v => v.heart_rate);
        const sugarData = data.data.map(v => v.blood_sugar);

        const ctx = document.getElementById('vitalsChart').getContext('2d');
        if (vitalsChartInstance) vitalsChartInstance.destroy();
        
        vitalsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Detak Jantung (bpm)',
                        data: hrData,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Gula Darah (mg/dL)',
                        data: sugarData,
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#f8fafc' } }
                }
            }
        });
    }
}

async function loadRecords() {
    const res = await fetch('/api/records');
    const data = await res.json();
    if (data.success) {
        const list = document.getElementById('recordsList');
        list.innerHTML = '';
        if (data.data.length === 0) {
            list.innerHTML = '<li class="list-item">Belum ada rekam medis</li>';
            return;
        }
        data.data.forEach(rec => {
            const date = new Date(rec.created_at).toLocaleDateString('id-ID');
            list.innerHTML += `
                <li class="list-item">
                    <div class="list-item-title">${escapeHTML(date)} - ${escapeHTML(rec.doctor ? rec.doctor.full_name : 'Unknown')}</div>
                    <div class="list-item-desc"><strong>Diagnosis:</strong> ${escapeHTML(rec.diagnosis)}</div>
                    <div class="list-item-desc" style="margin-top:5px;"><strong>Resep:</strong> ${escapeHTML(rec.prescription)}</div>
                </li>
            `;
        });
    }
}

async function loadAnnouncements() {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    if (data.success) {
        const list = document.getElementById('announcementList');
        list.innerHTML = '';
        if (data.data.length === 0) {
            list.innerHTML = '<li class="list-item">Belum ada pengumuman</li>';
            return;
        }
        data.data.forEach(ann => {
            const date = new Date(ann.created_at).toLocaleDateString('id-ID');
            let badgeClass = 'status-completed';
            if (ann.type === 'alert') badgeClass = 'status-cancelled';
            if (ann.type === 'info') badgeClass = 'status-confirmed';
            
            list.innerHTML += `
                <li class="list-item">
                    <div class="list-item-title">${escapeHTML(ann.title)}</div>
                    <div class="list-item-desc">${escapeHTML(ann.content)}</div>
                    <span class="status-badge ${badgeClass}" style="margin-top:8px;">${escapeHTML(ann.type.toUpperCase())}</span>
                    <span style="float:right; font-size:0.8rem; color:#94a3b8; margin-top:8px;">${escapeHTML(date)}</span>
                </li>
            `;
        });
    }
}

document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const doctor_id = document.getElementById('doctorSelect').value;
    const appointment_date = document.getElementById('appointmentDate').value;
    const reason = document.getElementById('reason').value;

    const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id, appointment_date, reason })
    });
    const data = await res.json();
    if (data.success) {
        closeModal('appointmentModal');
        document.getElementById('appointmentForm').reset();
        loadAppointments();
    } else {
        alert(data.message || 'Gagal membuat janji');
    }
});

document.getElementById('vitalsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bp = document.getElementById('bp').value;
    const hr = document.getElementById('hr').value;
    const sugar = document.getElementById('sugar').value;
    const weight = document.getElementById('weight').value;

    const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blood_pressure: bp, heart_rate: hr, blood_sugar: sugar, weight })
    });
    const data = await res.json();
    if (data.success) {
        closeModal('vitalsModal');
        document.getElementById('vitalsForm').reset();
        loadVitals();
    } else {
        alert(data.message || 'Gagal menyimpan vital sign');
    }
});

async function init() {
    await fetchMe();
    loadDoctors();
    loadAppointments();
    loadVitals();
    loadRecords();
    loadAnnouncements();
}

init();
