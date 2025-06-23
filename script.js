
let allData = [];
let times = [];
let map;
let slider;
let playing = false;
let interval;

function getColor(windSpeed) {
  const scale = Math.min(Math.max(windSpeed / 20, 0), 1);
  const r = Math.round(128 + scale * 127);
  const g = Math.round(200 - scale * 200);
  const b = Math.round(255 - scale * 255);
  return `rgb(${r},${g},${b})`;
}

function updateMap(time) {
  if (!map) return;
  // remove only markers (not tile layers)
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  const filtered = allData.filter(d => d.datetime === time);
  filtered.forEach(d => {
    const color = getColor(d.wind_speed);
    const icon = L.divIcon({
      html: `<div class="arrow" style="color: ${color}; transform: rotate(${d.direction}deg);"></div>`,
      iconSize: [30, 30],
      className: ''
    });

    L.marker([d.lat, d.lng], { icon: icon })
      .bindPopup(`<b>${d.name}</b><br>${d.datetime}<br>風速: ${d.wind_speed} m/s<br>風向: ${d.direction}°`)
      .addTo(map);
  });

  const index = times.indexOf(time);
  if (slider) slider.value = index;
}

function togglePlayback() {
  playing = !playing;
  const btn = document.querySelector("button[onclick='togglePlayback()']");
  btn.textContent = playing ? "⏸ 停止" : "▶︎ 再生";

  if (playing) {
    interval = setInterval(() => {
      slider.value = (parseInt(slider.value) + 1) % times.length;
      updateMap(times[slider.value]);
    }, 3000);
  } else {
    clearInterval(interval);
  }
}

function applyManualTime() {
  const yyyy = document.getElementById('yyyy').value;
  const mm = document.getElementById('mm').value.padStart(2, '0');
  const dd = document.getElementById('dd').value.padStart(2, '0');
  const hh = document.getElementById('hh').value.padStart(2, '0');
  const min = document.getElementById('min').value.padStart(2, '0');

  const datetime = \`\${yyyy}-\${mm}-\${dd} \${hh}:\${min}:00\`;
  if (!times.includes(datetime)) {
    alert("指定の時刻のデータが存在しません");
    return;
  }
  updateMap(datetime);
  slider.value = times.indexOf(datetime);
}

// 自動ステップ移動
['yyyy','mm','dd','hh','min'].forEach((id, i, arr) => {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    const maxLength = input.maxLength;
    if (input.value.length >= maxLength && arr[i+1]) {
      document.getElementById(arr[i+1]).focus();
    }
  });
});

fetch('wind_mock_data.csv')
  .then(response => response.text())
  .then(csvText => {
    const rows = csvText.trim().split('\n').slice(1);
    allData = rows.map(row => {
      const [name, datetime, lat, lng, direction, wind_speed] = row.split(',');
      return {
        name,
        datetime,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        direction: parseFloat(direction),
        wind_speed: parseFloat(wind_speed)
      };
    });

    times = [...new Set(allData.map(d => d.datetime))];
    slider = document.getElementById('timeSlider');
    slider.max = times.length - 1;
    slider.addEventListener("input", () => {
      updateMap(times[slider.value]);
    });

    map = L.map('map').setView([35.285, 136.245], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 最新のデータを表示（最後）
    updateMap(times[times.length - 1]);
    slider.value = times.length - 1;
  });
