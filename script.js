
let allData = [];
let times = [];
let map;
let playing = false;
let interval;
let slider = null;

function getColor(windSpeed) {
  return windSpeed > 8 ? '#ff0000' :
         windSpeed > 6 ? '#ff8000' :
         windSpeed > 4 ? '#ffff00' :
         windSpeed > 2 ? '#80ff00' : '#00ffff';
}

function updateMap(time) {
  map.eachLayer(layer => {
    if (layer.options && layer.options.pane === "markerPane") {
      map.removeLayer(layer);
    }
  });

  const filtered = allData.filter(d => d.datetime === time);
  filtered.forEach(d => {
    const icon = L.divIcon({
      className: 'custom-icon',
      html: `<div style="transform: rotate(${d.direction}deg); font-size: 20px; color: ${getColor(d.wind_speed)};">🧭</div>`,
      iconSize: [30, 30]
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
  btn.textContent = playing ? "⏸ 停止" : "▶︎ 自動再生";

  if (playing) {
    interval = setInterval(() => {
      slider.value = (parseInt(slider.value) + 1) % times.length;
      updateMap(times[slider.value]);
    }, 3000);
  } else {
    clearInterval(interval);
  }
}

function setManualTime() {
  const text = document.getElementById('manualTime').value.trim();
  const match = text.match(/(\d{4})年(\d{2})月(\d{2})日 (\d{2})時(\d{2})分/);
  if (!match) {
    alert("形式が正しくありません（例: 2024年09月01日 12時01分）");
    return;
  }
  const dt = \`\${match[1]}-\${match[2]}-\${match[3]} \${match[4]}:\${match[5]}:00\`;
  if (!times.includes(dt)) {
    alert("その時刻のデータは存在しません");
    return;
  }
  updateMap(dt);
  slider.value = times.indexOf(dt);
}

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

    updateMap(times[0]);
    slider.value = 0;
  });
