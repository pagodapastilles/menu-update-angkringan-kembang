let intervalId;  // Untuk menyimpan ID interval polling

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();  // Muat pengaturan dari LocalStorage
    fetchMenuData();  // Fetch pertama kali
    startPolling();  // Mulai polling berdasarkan interval
    loadLogs();  // Muat log dari LocalStorage
});

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function saveSettings() {
    const settings = {
        logo: document.getElementById('logo-upload').files[0] ? getBase64(document.getElementById('logo-upload').files[0]) : localStorage.getItem('logo'),
        csvUrl: document.getElementById('csv-url').value || localStorage.getItem('csvUrl') || 'YOUR_CSV_URL_HERE',
        videoId: extractVideoId(document.getElementById('video-id').value) || localStorage.getItem('videoId') || 'VIDEO_ID_HERE',
        updateInterval: parseInt(document.getElementById('update-interval').value) * 1000 || parseInt(localStorage.getItem('updateInterval')) || 5000,
        restaurantName: document.getElementById('restaurant-name-input').value || localStorage.getItem('restaurantName') || 'Angkringan Kembang',
        operationalHours: document.getElementById('operational-hours-input').value || localStorage.getItem('operationalHours') || '10:00 - 22:00',
        reservationInfo: document.getElementById('reservation-info').value || localStorage.getItem('reservationInfo') || '088216562558',
        copyrightYear: document.getElementById('copyright-year').value || localStorage.getItem('copyrightYear') || '2025'
    };

    // Simpan ke LocalStorage (promise karena base64 async)
    if (typeof settings.logo === 'function') {
        settings.logo.then(base64 => {
            localStorage.setItem('logo', base64);
            applySettings(settings);
        });
    } else {
        applySettings(settings);
    }

    toggleSettings();
    logMessage('Pengaturan disimpan.');
}

function applySettings(settings) {
    Object.keys(settings).forEach(key => localStorage.setItem(key, settings[key]));

    // Terapkan ke UI
    document.getElementById('logo').src = localStorage.getItem('logo') || '';
    document.getElementById('logo').style.display = localStorage.getItem('logo') ? 'inline' : 'none';
    document.getElementById('restaurant-name').textContent = settings.restaurantName;
    document.getElementById('operational-hours').textContent = `Jam Operasional: ${settings.operationalHours}`;
    document.getElementById('reservation-text').textContent = `Informasi pemesanan dan reservasi: ${settings.reservationInfo}`;
    document.getElementById('copyright-text').textContent = `&copy; ${settings.restaurantName} ${settings.copyrightYear}`;

    // Update video
    const videoId = settings.videoId;
    document.getElementById('youtube-video').src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;

    // Restart polling dengan interval baru
    clearInterval(intervalId);
    startPolling();
}

function loadSettings() {
    const settings = {
        logo: localStorage.getItem('logo'),
        csvUrl: localStorage.getItem('csvUrl') || 'YOUR_CSV_URL_HERE',
        videoId: localStorage.getItem('videoId') || 'VIDEO_ID_HERE',
        updateInterval: parseInt(localStorage.getItem('updateInterval')) || 5000,
        restaurantName: localStorage.getItem('restaurantName') || 'Angkringan Kembang',
        operationalHours: localStorage.getItem('operationalHours') || '10:00 - 22:00',
        reservationInfo: localStorage.getItem('reservationInfo') || '088216562558',
        copyrightYear: localStorage.getItem('copyrightYear') || '2025'
    };
    applySettings(settings);
}

function startPolling() {
    const interval = parseInt(localStorage.getItem('updateInterval')) || 5000;
    intervalId = setInterval(fetchMenuData, interval);
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : url;  // Jika sudah ID, return langsung
}

function fetchMenuData() {
    const csvUrl = localStorage.getItem('csvUrl') || 'YOUR_CSV_URL_HERE';
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                complete: (results) => {
                    const data = results.data.filter(item => item['nama menu']);
                    const updateList = document.getElementById('menu-update-list');
                    const habisList = document.getElementById('menu-habis-list');
                    updateList.innerHTML = '';
                    habisList.innerHTML = '';

                    data.forEach(item => {
                        let displayText = item['nama menu'];
                        const status = (item.status || '').toLowerCase().trim();
                        let statusClass = '';

                        if (status === 'tersedia') {
                            displayText += ' (Tersedia)';
                            statusClass = 'status-tersedia';
                        } else if (status === 'tersisa') {
                            const stok = item.stok ? item.stok.trim() : '0';
                            displayText += ` (Tersisa ${stok})`;
                            statusClass = 'status-tersisa';
                        } else if (status === 'habis') {
                            displayText += ' (Habis)';
                            statusClass = 'status-habis';
                        }

                        const li = document.createElement('li');
                        li.textContent = displayText;
                        li.classList.add(statusClass);

                        if (status === 'habis') {
                            habisList.appendChild(li);
                        } else {
                            updateList.appendChild(li);
                        }
                    });
                    logMessage('Data menu berhasil diupdate.');
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    logMessage('Error parsing CSV: ' + error.message);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching CSV:', error);
            logMessage('Error fetching CSV: ' + error.message);
        });
}

function logMessage(message) {
    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push(`${new Date().toLocaleString('id-ID')}: ${message}`);
    localStorage.setItem('logs', JSON.stringify(logs));
    loadLogs();
}

function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        li.textContent = log;
        logList.appendChild(li);
    });
}

function clearLogs() {
    localStorage.removeItem('logs');
    loadLogs();
    logMessage('Log dihapus.');
}
