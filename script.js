let intervalId;

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    fetchMenuData();
    startPolling();
    loadLogs();
});

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    loadSettingsToForm();
}

function loadSettingsToForm() {
    document.getElementById('logo-url').value = localStorage.getItem('logo_url') || '';
    document.getElementById('csv-url').value = localStorage.getItem('csv_url') || '';
    document.getElementById('video-url').value = localStorage.getItem('video_url') || '';
    document.getElementById('update-interval').value = (parseInt(localStorage.getItem('update_interval')) / 1000) || '';
    document.getElementById('restaurant-name-input').value = localStorage.getItem('restaurant_name') || '';
    document.getElementById('operational-hours-input').value = localStorage.getItem('operational_hours') || '';
    document.getElementById('reservation-info').value = localStorage.getItem('reservation_info') || '';
    document.getElementById('copyright-year').value = localStorage.getItem('copyright_year') || '';
}

function applySettings(settings) {
    Object.keys(settings).forEach(key => localStorage.setItem(key, settings[key]));
    document.getElementById('logo').src = settings.logo_url || '';
    document.getElementById('logo').style.display = settings.logo_url ? 'inline' : 'none';
    document.getElementById('restaurant-name').textContent = settings.restaurant_name || 'Angkringan Kembang';
    document.getElementById('operational-hours').textContent = `Jam Operasional: ${settings.operational_hours || '10:00 - 22:00'}`;
    document.getElementById('reservation-text').textContent = `Informasi pemesanan dan reservasi: ${settings.reservation_info || '088216562558'}`;
    document.getElementById('copyright-text').textContent = `&copy; ${settings.restaurant_name || 'Angkringan Kembang'} ${settings.copyright_year || '2025'}`;

    const videoId = extractVideoId(settings.video_url) || 'VIDEO_ID_HERE';
    document.getElementById('youtube-video').src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
}

function loadSettings() {
    const settingsCsvUrl = 'YOUR_SETTINGS_CSV_URL_HERE'; // Ganti dengan URL CSV tab Settings
    fetch(settingsCsvUrl)
        .then(response => response.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                complete: (results) => {
                    const settings = {};
                    results.data.forEach(item => {
                        if (item.Key && item.Value) {
                            settings[item.Key] = item.Value;
                        }
                    });
                    applySettings(settings);
                    logMessage('Pengaturan dimuat dari Google Sheets.');
                },
                error: (error) => {
                    console.error('Error parsing settings CSV:', error);
                    logMessage('Error parsing settings CSV: ' + error.message);
                    applySettings({});
                }
            });
        })
        .catch(error => {
            console.error('Error fetching settings CSV:', error);
            logMessage('Error fetching settings CSV: ' + error.message);
            applySettings({});
        });
}

function startPolling() {
    const interval = parseInt(localStorage.getItem('update_interval')) || 5000;
    intervalId = setInterval(() => {
        fetchMenuData();
        loadSettings();
    }, interval);
}

function extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : '';
}

function fetchMenuData() {
    const csvUrl = localStorage.getItem('csv_url') || 'YOUR_CSV_URL_HERE';
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
