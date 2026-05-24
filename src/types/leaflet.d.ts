// Tipos mínimos do Leaflet carregado via CDN (window.L), só o que usamos.
interface LeafletLayer {
  addTo(map: LeafletMap): LeafletLayer;
  bindPopup(html: string): LeafletLayer;
}

interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  fitBounds(bounds: [number, number][], opts?: { padding?: [number, number] }): LeafletMap;
  remove(): void;
}

interface LeafletStatic {
  map(el: HTMLElement, opts?: { scrollWheelZoom?: boolean }): LeafletMap;
  tileLayer(url: string, opts?: { attribution?: string; maxZoom?: number }): LeafletLayer;
  circleMarker(
    latlng: [number, number],
    opts?: {
      radius?: number;
      color?: string;
      weight?: number;
      fillColor?: string;
      fillOpacity?: number;
    },
  ): LeafletLayer;
}

interface Window {
  L?: LeafletStatic;
}
