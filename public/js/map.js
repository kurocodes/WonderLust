const map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/streets/style.json?key=X5TDKi1x8OUBEh82iwVo",
  center: listing.geometry.coordinates, // [Lng, lat]
  zoom: 9,
});

// create the popup
const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
  `<h4>${listing.title}</h4><p>Exact location will be provided after booking.</p>`
);

// create the marker
const marker = new maplibregl.Marker({ color: "#fe424d" })
  .setLngLat(listing.geometry.coordinates)
  .setPopup(popup) // sets a popup on this marker
  .addTo(map);