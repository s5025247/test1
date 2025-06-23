
fetch('wind_mock_data.csv')
  .then(response => response.text())
  .then(csvText => {
    const rows = csvText.trim().split('\n').slice(1);
    const data = rows.map(row => {
      const [name, datetime, lat, lng, direction, wind_speed] = row.split(',');
      return { name, datetime, lat: parseFloat(lat), lng: parseFloat(lng), direction: parseFloat(direction), wind_speed: parseFloat(wind_speed) };
    });

    const map = L.map('map').setView([35.285, 136.245], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    data.forEach(d => {
      const icon = L.divIcon({
        className: 'custom-icon',
        html: '<div style="transform: rotate(' + d.direction + 'deg); font-size: 20px;">🧭</div>',
        iconSize: [30, 30]
      });

      L.marker([d.lat, d.lng], { icon: icon })
        .bindPopup(`<b>${d.name}</b><br>${d.datetime}<br>風速: ${d.wind_speed} m/s<br>風向: ${d.direction}°`)
        .addTo(map);
    });
  });
