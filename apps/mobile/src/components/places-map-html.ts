// Trang HTML chạy trong WebView: bản đồ Leaflet với ô OpenStreetMap.
// Giao tiếp với React Native bằng postMessage (đi ra) và các hàm window.* (đi vào).
// Chỉ truyền id + toạ độ vào trang, không chèn tên quán vào HTML.
export const MAP_HTML = `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#eef1f0}
.leaflet-tile-pane{filter:grayscale(.65) saturate(.75) brightness(1.07) contrast(.9)}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([10.7769, 106.7009], 15);
// Ô OpenStreetMap chuẩn (không cần khoá API). Làm nhạt bằng bộ lọc màu CSS ở .leaflet-tile-pane
// để ghim quán nổi bật hơn. Ô công khai của OSM chỉ hợp để demo, xem docs/PLAN.md.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

var layer = L.layerGroup().addTo(map);
var markers = {};
var selected = null;
var meDot = null;

function style(isSelected) {
  return {
    radius: isSelected ? 13 : 10,
    color: '#ffffff',
    weight: 3,
    fillColor: isSelected ? '#3730A3' : '#4F46E5',
    fillOpacity: 1
  };
}

window.setPlaces = function (json) {
  var list = JSON.parse(json);
  layer.clearLayers();
  markers = {};
  list.forEach(function (p) {
    var m = L.circleMarker([p.lat, p.lng], style(p.id === selected)).addTo(layer);
    m.on('click', function (e) { L.DomEvent.stopPropagation(e); post({ type: 'select', id: p.id }); });
    markers[p.id] = m;
  });
};

window.setSelected = function (id) {
  selected = id;
  Object.keys(markers).forEach(function (k) { markers[k].setStyle(style(k === id)); });
  if (id && markers[id]) markers[id].bringToFront();
};

window.setMe = function (lat, lng) {
  if (meDot) map.removeLayer(meDot);
  // Vòng sáng mờ bên ngoài + chấm xanh viền trắng ở giữa.
  meDot = L.layerGroup([
    L.circleMarker([lat, lng], { radius: 20, stroke: false, fillColor: '#2563EB', fillOpacity: 0.18, interactive: false }),
    L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1, interactive: false })
  ]).addTo(map);
};

window.setView = function (lat, lng, zoom) { map.setView([lat, lng], zoom || 15); };
window.flyTo = function (lat, lng, zoom) { map.flyTo([lat, lng], zoom || 16, { duration: 0.6 }); };

map.on('click', function () { post({ type: 'select', id: null }); });
map.on('moveend', function () {
  var c = map.getCenter();
  var b = map.getBounds();
  post({ type: 'move', lat: c.lat, lng: c.lng, radius: Math.round(map.distance(c, [b.getNorth(), c.lng])) });
});

post({ type: 'ready' });
</script></body></html>`;
