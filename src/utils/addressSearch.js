// Free address search using OpenStreetMap data. No account or key needed.
// 1) Photon search. If that is refused or fails, 2) Nominatim search.
// Results are kept only if they are inside Mauritius (main island).
const BOX = { west: 57.2, south: -20.6, east: 57.9, north: -19.9 };
const CENTER = { lat: -20.25, lon: 57.55 };

// The free servers ask apps to say who they are
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'SalonGo-StudentApp/1.0 (university salon booking project)',
};

function unique(list) {
  return list.filter((item, index) => item && list.indexOf(item) === index);
}

function insideMauritius(lon, lat) {
  return lon >= BOX.west && lon <= BOX.east && lat >= BOX.south && lat <= BOX.north;
}

async function getJson(url, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: HEADERS, signal: controller.signal });
    console.log(`[addressSearch] ${label} status`, response.status);
    if (!response.ok) throw new Error(`${label} answered ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---- Server 1: Photon ----
async function searchPhoton(q) {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(`${q} Mauritius`)}` +
    `&limit=15&lat=${CENTER.lat}&lon=${CENTER.lon}`;
  const json = await getJson(url, 'photon');
  return (json.features || [])
    .filter((f) => f.geometry && f.geometry.coordinates && insideMauritius(...f.geometry.coordinates))
    .map((f, index) => {
      const p = f.properties || {};
      const [longitude, latitude] = f.geometry.coordinates;
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      const area = p.city || p.district || p.locality || p.county || '';
      const parts = unique([p.name, street, p.locality || p.district, p.city]);
      return {
        id: `p${p.osm_id || index}_${index}`,
        title: parts[0] || area || 'Unnamed place',
        subtitle: parts.slice(1).join(', ') || area,
        address: parts.join(', '),
        area,
        latitude,
        longitude,
      };
    });
}

// ---- Server 2: Nominatim ----
async function searchNominatim(q) {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
    `&format=jsonv2&addressdetails=1&limit=8&countrycodes=mu&accept-language=en`;
  const list = await getJson(url, 'nominatim');
  return (Array.isArray(list) ? list : [])
    .map((r) => ({ r, longitude: parseFloat(r.lon), latitude: parseFloat(r.lat) }))
    .filter((x) => !Number.isNaN(x.longitude) && insideMauritius(x.longitude, x.latitude))
    .map(({ r, longitude, latitude }, index) => {
      const a = r.address || {};
      const street = [a.house_number, a.road].filter(Boolean).join(' ');
      const area = a.city || a.town || a.village || a.suburb || a.municipality || a.county || '';
      const parts = unique([r.name, street, a.suburb || a.neighbourhood, area]);
      return {
        id: `n${r.place_id || index}_${index}`,
        title: parts[0] || area || 'Unnamed place',
        subtitle: parts.slice(1).join(', ') || area,
        address: parts.join(', '),
        area,
        latitude,
        longitude,
      };
    });
}

export async function searchAddress(text) {
  const q = (text || '').trim();
  if (q.length < 3) return [];

  try {
    const results = await searchPhoton(q);
    console.log('[addressSearch] photon results:', results.length);
    if (results.length > 0) return results.slice(0, 6);
  } catch (e) {
    console.log('[addressSearch] photon failed:', e.message);
  }

  // Photon was refused or found nothing: try the second server
  const results = await searchNominatim(q);
  console.log('[addressSearch] nominatim results:', results.length);
  return results.slice(0, 6);
}