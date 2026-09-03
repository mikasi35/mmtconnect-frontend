'use client';
import { useEffect, useRef } from 'react';
// Leaflet CSS is imported globally in app/layout.tsx.

const ICON_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images';

interface Props {
  lat: number;
  lng: number;
  label?: string;
  /** Map zoom. Lower = wider area (use for suburb-level). */
  zoom?: number;
  height?: number;
}

/** Read-only OpenStreetMap view of a single location. No API key needed. */
export function FacilityMap({ lat, lng, label, zoom = 14, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      // Fix marker icons broken by bundler asset hashing
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `${ICON_BASE}/marker-icon-2x.png`,
        iconUrl: `${ICON_BASE}/marker-icon.png`,
        shadowUrl: `${ICON_BASE}/marker-shadow.png`,
      });

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        attributionControl: true,
      }).setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (label) marker.bindPopup(label);

      mapRef.current = map;
      // Leaflet needs a size recalc once the container has laid out
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng, label, zoom]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 14, overflow: 'hidden', border: '0.5px solid #E5E7EB', background: '#F3F4F6' }}
    />
  );
}
