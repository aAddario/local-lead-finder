"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Lead } from "@/types/lead";
import { Card } from "@/components/ui/card";

export function LeadMap({ leads }: { leads: Lead[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    async function render() {
      if (!ref.current || leads.length === 0) return;
      const L = await import("leaflet");
      if (disposed || !ref.current) return;
      ref.current.replaceChildren();
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([leads[0].lat, leads[0].lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const lead of leads) {
        bounds.push([lead.lat, lead.lng]);
        L.marker([lead.lat, lead.lng], { icon: markerIcon(L, lead.score) })
          .addTo(map)
          .bindPopup(`<strong>${escapeHtml(lead.name)}</strong><br>${escapeHtml(lead.category)}<br>${lead.score}/100 · ${escapeHtml(lead.scoreLabel)}`);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
    }

    render();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [leads]);

  if (leads.length === 0) return null;
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Mapa</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">A cor do pin segue o score de oportunidade.</p>
        </div>
      </div>
      <div ref={ref} />
    </Card>
  );
}

function markerIcon(L: typeof import("leaflet"), score: number) {
  const color = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : score >= 40 ? "#64748b" : "#dc2626";
  return L.divIcon({
    className: "",
    html: `<div class="lead-marker" style="width:18px;height:18px;background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
}
