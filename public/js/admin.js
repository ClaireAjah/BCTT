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
        if (data.success && (data.data.role === 'doctor' || data.data.role === 'admin')) {
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

async function loadAppointments() {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    if (data.success) {
        const tbody = document.getElementById('appointmentTableBody');
        tbody.innerHTML = '';
        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Belum ada janji temu</td></tr>';
            return;
        }
        const patientsMap = {};
        
        data.data.forEach(app => {
            const date = new Date(app.appointment_date).toLocaleString('id-ID');
            const statusClass = `status-${app.status.toLowerCase()}`;
            const patientName = app.patient ? app.patient.full_name : 'Unknown';
            const patientId = app.patient_id;
            
            if (patientName !== 'Unknown') {
                patientsMap[patientId] = patientName;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${escapeHTML(date)}</td>
                    <td>${escapeHTML(patientName)}</td>
                    <td>${escapeHTML(app.reason)}</td>
                    <td><span class="status-badge ${statusClass}">${escapeHTML(app.status)}</span></td>
                    <td style="display:flex; gap:5px; flex-wrap:wrap;">
                        <select onchange="updateStatus('${app.id}', this.value)" style="padding:4px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #334155;">
                            <option value="">Status</option>
                            <option value="Confirmed">Konfirmasi</option>
                            <option value="Completed">Selesai</option>
                            <option value="Cancelled">Batal</option>
                        </select>
                        <button class="btn-outline" style="padding:4px 8px; font-size:0.8rem;" onclick="openRecordModal('${app.id}', '${patientId}', '${escapeHTML(patientName).replace(/'/g, "\\'")}')">Input Rekam Medis</button>
                    </td>
                </tr>
            `;
        });

        const patientSelect = document.getElementById('patientSelectSearch');
        const recordPatientSelect = document.getElementById('recordPatientSelect');
        
        patientSelect.innerHTML = '<option value="">Pilih Pasien untuk Telemonitoring</option>';
        recordPatientSelect.innerHTML = '<option value="">Pilih Pasien...</option>';
        
        Object.entries(patientsMap).forEach(([id, name]) => {
            patientSelect.innerHTML += `<option value="${id}">${name}</option>`;
            recordPatientSelect.innerHTML += `<option value="${id}">${name}</option>`;
        });
    }
}

async function updateStatus(id, status) {
    if(!status) return;
    const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
        loadAppointments();
    } else {
        alert(data.message || 'Gagal mengubah status');
    }
}

async function fetchPatientVitals() {
    const patientId = document.getElementById('patientSelectSearch').value;
    if (!patientId) {
        alert('Pilih pasien terlebih dahulu dari dropdown');
        return;
    }
    const res = await fetch(`/api/vitals?patient_id=${patientId}`);
    const data = await res.json();
    if (data.success) {
        if(data.data.length === 0) {
            alert('Tidak ada data vital sign untuk pasien ini');
            return;
        }
        const labels = data.data.map(v => new Date(v.recorded_at).toLocaleDateString('id-ID'));
        const hrData = data.data.map(v => v.heart_rate);
        const sugarData = data.data.map(v => v.blood_sugar);
        const bpData = data.data.map(v => parseInt(v.blood_pressure.split('/')[0]));

        const ctx = document.getElementById('vitalsChart').getContext('2d');
        if (vitalsChartInstance) vitalsChartInstance.destroy();
        
        vitalsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Detak Jantung (bpm)', data: hrData, borderColor: '#06b6d4', tension: 0.4 },
                    { label: 'Gula Darah (mg/dL)', data: sugarData, borderColor: '#0d9488', tension: 0.4 },
                    { label: 'Tekanan Darah Sistolik', data: bpData, borderColor: '#ef4444', tension: 0.4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { labels: { color: '#f8fafc' } } }
            }
        });
    }
}

document.getElementById('announcementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const content = document.getElementById('content').value;

    const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, content })
    });
    const data = await res.json();
    if (data.success) {
        closeModal('announcementModal');
        document.getElementById('announcementForm').reset();
        alert('Pengumuman berhasil dipublikasikan');
    } else {
        alert(data.message || 'Gagal membuat pengumuman');
    }
});

function openRecordModal(apptId = '', patientId = '', patientName = '') {
    const select = document.getElementById('recordPatientSelect');
    if (patientId && select.querySelector(`option[value="${patientId}"]`)) {
        select.value = patientId;
    } else {
        select.value = '';
    }
    document.getElementById('recordApptId').value = apptId;
    openModal('recordModal');
}

document.getElementById('recordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const patient_id = document.getElementById('recordPatientSelect').value;
    const appointment_id = document.getElementById('recordApptId').value;
    const diagnosis = document.getElementById('diagnosis').value;
    const prescription = document.getElementById('prescription').value;

    const payload = { patient_id, diagnosis, prescription };
    if(appointment_id) payload.appointment_id = appointment_id;

    const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
        closeModal('recordModal');
        document.getElementById('recordForm').reset();
        alert('Rekam Medis berhasil disimpan');
        loadRecords();
    } else {
        alert(data.message || 'Gagal menyimpan rekam medis');
    }
});

async function loadRecords() {
    const res = await fetch('/api/records');
    const data = await res.json();
    if (data.success) {
        const list = document.getElementById('recordsList');
        list.innerHTML = '';
        if (data.data.length === 0) {
            list.innerHTML = '<li class="list-item">Belum ada riwayat rekam medis</li>';
            return;
        }
        data.data.forEach(rec => {
            const date = new Date(rec.created_at).toLocaleDateString('id-ID');
            const patientName = rec.patient ? rec.patient.full_name : 'Unknown';
            list.innerHTML += `
                <li class="list-item">
                    <div class="list-item-title">${escapeHTML(date)} - Pasien: ${escapeHTML(patientName)}</div>
                    <div class="list-item-desc"><strong>Diagnosis:</strong> ${escapeHTML(rec.diagnosis)}</div>
                    <div class="list-item-desc" style="margin-top:5px;"><strong>Resep:</strong> ${escapeHTML(rec.prescription)}</div>
                </li>
            `;
        });
    }
}

function filterRecords() {
    const input = document.getElementById('recordFilter');
    const filter = input.value.toLowerCase();
    const list = document.getElementById('recordsList');
    const items = list.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        const titleDiv = items[i].querySelector('.list-item-title');
        if (titleDiv) {
            const txtValue = titleDiv.textContent || titleDiv.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }
}

async function init() {
    await fetchMe();
    loadAppointments();
    loadRecords();
}

init();
