import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Box, Crosshair, Flame, Layers, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCoordinates } from '../utils/geo';
import { DateScrubber, type ViewportMode } from './DateScrubber';

const Scene3DView = lazy(() =>
  import('./Scene3DView').then((mod) => ({ default: mod.Scene3DView }))
);

function createCrosshairIcon(): L.DivIcon {
  return L.divIcon({
    className: 'earthpulse-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="9" stroke="#5B9BFF" stroke-width="2" fill="rgba(11, 61, 145, 0.25)"/>
      <circle cx="14" cy="14" r="2.5" fill="#FFFFFF" stroke="#0B3D91" stroke-width="1.5"/>
      <path d="M14 1V6M14 22V27M1 14H6M22 14H27" stroke="#5B9BFF" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  });
}

function createFireIcon(frp: number): L.DivIcon {
  const size = frp >= 40 ? 22 : frp >= 15 ? 18 : 14;
  const fill = frp >= 40 ? '#FC3D21' : frp >= 15 ? '#F97316' : '#F59E0B';
  return L.divIcon({
    className: 'earthpulse-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" fill="${fill}" fill-opacity="0.3"/>
      <polygon points="10,3 16,15 4,15" fill="${fill}" stroke="#FFFFFF" stroke-width="1.2"/>
    </svg>`,
  });
}

function createEonetIcon(categoryId: string): L.DivIcon {
  const color =
    categoryId === 'wildfires'
      ? '#FC3D21'
      : categoryId === 'floods'
      ? '#3B82F6'
      : categoryId === 'severeStorms'
      ? '#F59E0B'
      : '#F97316';
  return L.divIcon({
    className: 'earthpulse-div-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="16" height="16" rx="3" transform="rotate(45 11 11)" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="2"/>
      <circle cx="11" cy="11" r="3" fill="${color}"/>
    </svg>`,
  });
}

const MapController: React.FC<{
  lat: number;
  lon: number;
  radiusKm: number;
  onMapClick: (lat: number, lon: number) => void;
}> = ({ lat, lon, radiusKm, onMapClick }) => {
  const map = useMap();
  const prevCenterRef = useRef<string>('');

  useEffect(() => {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)},${radiusKm}`;
    if (prevCenterRef.current !== key) {
      prevCenterRef.current = key;
      const zoom = radiusKm <= 25 ? 10 : radiusKm <= 50 ? 9 : 8;
      map.setView([lat, lon], zoom, { animate: true });
    }
  }, [lat, lon, radiusKm, map]);

  useMapEvents({
    click(e) {
      onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    },
  });

  return null;
};

export const MapView: React.FC = () => {
  const {
    location,
    radiusKm,
    mapLayers,
    toggleMapLayer,
    imageryDateIso,
    telemetry,
    setLocation,
    t,
  } = useApp();

  const [useModisFallback, setUseModisFallback] = useState(false);
  const [viewMode, setViewMode] = useState<ViewportMode>('3d');
  const [layersOpen, setLayersOpen] = useState(true);

  useEffect(() => {
    setUseModisFallback(false);
  }, [imageryDateIso]);

  const crosshairIcon = useMemo(() => createCrosshairIcon(), []);

  const firmsDetections = telemetry.firms.data?.detections || [];
  const eonetEvents = telemetry.eonet.data || [];

  const trueColorProduct = useModisFallback
    ? 'MODIS_Terra_CorrectedReflectance_TrueColor'
    : 'VIIRS_SNPP_CorrectedReflectance_TrueColor';

  const activeBaseLabel = mapLayers.streetBase
    ? 'OpenStreetMap'
    : mapLayers.trueColor
    ? useModisFallback
      ? 'NASA GIBS MODIS Terra'
      : 'NASA GIBS VIIRS SNPP'
    : 'Orbital Canvas';

  const handleMapClick = (lat: number, lon: number) => {
    setLocation({
      name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      lat,
      lon,
      timezone: 'UTC',
    });
  };

  // Combined tabular detections/events within 400 km (or FIRMS within radius)
  const tableRows = useMemo(() => {
    return [
      ...firmsDetections.map((d) => ({
        id: d.id,
        type: 'VIIRS Thermal',
        title: `Hotspot (${d.frp.toFixed(1)} MW FRP)`,
        distanceKm: d.distanceKm,
        bearing: `${d.bearingCardinal} (${d.bearingDeg.toFixed(0)}°)`,
        date: `${d.acqDate} ${d.acqTime.slice(0, 2)}:${d.acqTime.slice(2, 4)} UTC`,
      })),
      ...eonetEvents.map((e) => ({
        id: e.id,
        type: e.categoryTitle,
        title: e.title,
        distanceKm: e.distanceKm,
        bearing: `${e.bearingCardinal} (${e.bearingDeg.toFixed(0)}°)`,
        date: e.date.slice(0, 10),
      })),
    ].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [firmsDetections, eonetEvents]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--bg)]">
      {/* Top-left floating HUD: Active satellite layer + Coordinates (only in 2D Map / Table modes) */}
      {viewMode !== '3d' && (
        <div
          dir="ltr"
          className="pointer-events-none absolute start-3 top-3 z-[450] flex max-w-[60%] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--hud)] px-3.5 py-1.5 text-[11px] shadow-lg"
        >
          <Radio className="h-3.5 w-3.5 shrink-0 text-[var(--interactive)]" aria-hidden="true" />
          <span className="truncate font-medium text-[var(--text)]">
            {t.mapLayers.activeLayer}: {activeBaseLabel}
          </span>
          <span className="text-[var(--muted)]" aria-hidden="true">·</span>
          <Crosshair className="h-3 w-3 shrink-0 text-[var(--interactive)]" aria-hidden="true" />
          <span className="font-mono-tabular text-[var(--muted)]">
            {formatCoordinates(location.lat, location.lon)}
          </span>
        </div>
      )}

      {/* Top-right floating HUD: Layer toggles (2D Map) or quick 3D launch */}
      {viewMode !== '3d' && (
        <div className="absolute end-3 top-3 z-[450] flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--hud)] px-3.5 text-[12px] font-medium text-[var(--text)] shadow-lg hover:border-[var(--interactive)]"
            >
              <Box className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span>{t.mapLayers.threeDScene}</span>
            </button>
            <button
              type="button"
              onClick={() => setLayersOpen((o) => !o)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--hud)] px-3.5 text-[12px] font-medium text-[var(--text)] shadow-lg hover:border-[var(--interactive)]"
            >
              <Layers className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span>Layers</span>
            </button>
          </div>

          {layersOpen && viewMode === 'map' && (
            <div className="flex max-w-[235px] flex-wrap justify-end gap-1 rounded-[14px] border border-[var(--line)] bg-[var(--hud)] p-2 shadow-xl">
              {(
                [
                  ['trueColor', t.mapLayers.trueColor],
                  ['thermalFires', t.mapLayers.thermalFires],
                  ['imergRain', t.mapLayers.imergRain],
                  ['eonetEvents', t.mapLayers.eonetEvents],
                  ['radiusRing', t.mapLayers.radiusRing],
                  ['streetBase', t.mapLayers.streetBase],
                  ['referenceLabels', t.mapLayers.referenceLabels],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleMapLayer(key)}
                  className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-150 ${
                    mapLayers[key]
                      ? 'border-[var(--interactive)] bg-[var(--primary)] text-white'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3D Terrain & Orbit, Accessible Detections Table, or 2D Satellite Map */}
      {viewMode === '3d' ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[var(--bg)] text-[13px] text-[var(--muted)]">
              Loading 3D Terrain &amp; Orbital Telemetry…
            </div>
          }
        >
          <Scene3DView onSwitchTo2D={() => setViewMode('map')} />
        </Suspense>
      ) : viewMode === 'table' ? (
        <div className="h-full w-full overflow-auto bg-[var(--surface)] p-4 pb-20 pt-16 telemetry-scroll">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--text)]">
              {t.mapLayers.tableToggle} ({tableRows.length})
            </h2>
            <span className="font-mono-tabular text-[12px] text-[var(--muted)]">
              {formatCoordinates(location.lat, location.lon)}
            </span>
          </div>

          {tableRows.length === 0 ? (
            <div className="rounded-[6px] border border-[var(--line)] bg-[var(--bg)] p-6 text-center text-[13px] text-[var(--muted)]">
              {t.mapLayers.noEventsInTable}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[6px] border border-[var(--line)]">
              <table className="w-full text-start text-[13px]">
                <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[12px] text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2 text-start font-semibold">Category</th>
                    <th className="px-3 py-2 text-start font-semibold">Event / Detection</th>
                    <th className="px-3 py-2 text-end font-semibold">Distance</th>
                    <th className="px-3 py-2 text-end font-semibold">Bearing</th>
                    <th className="px-3 py-2 text-end font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[var(--raised)]">
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]">
                        {row.type}
                      </td>
                      <td className="px-3 py-2 text-[var(--text)]">{row.title}</td>
                      <td
                        dir="ltr"
                        className="whitespace-nowrap px-3 py-2 text-end font-mono-tabular text-[var(--text)]"
                      >
                        {row.distanceKm.toFixed(1)} km
                      </td>
                      <td
                        dir="ltr"
                        className="whitespace-nowrap px-3 py-2 text-end font-mono-tabular text-[var(--muted)]"
                      >
                        {row.bearing}
                      </td>
                      <td
                        dir="ltr"
                        className="whitespace-nowrap px-3 py-2 text-end font-mono-tabular text-[var(--muted)]"
                      >
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div dir="ltr" className="h-full w-full">
          <MapContainer
            center={[location.lat, location.lon]}
            zoom={9}
            zoomControl={false}
            className="h-full w-full cursor-crosshair"
            attributionControl={true}
          >
            <MapController
              lat={location.lat}
              lon={location.lon}
              radiusKm={radiusKm}
              onMapClick={handleMapClick}
            />

            {/* Primary Base: NASA GIBS True Color (auto-fallback to MODIS Terra on tileerror) */}
            {mapLayers.trueColor && !mapLayers.streetBase && (
              <TileLayer
                key={`gibs-truecolor-${trueColorProduct}-${imageryDateIso}`}
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${trueColorProduct}/default/${imageryDateIso}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
                maxNativeZoom={9}
                maxZoom={18}
                attribution="Imagery: NASA GIBS EOSDIS"
                eventHandlers={{
                  tileerror: () => {
                    if (!useModisFallback) {
                      setUseModisFallback(true);
                    }
                  },
                }}
              />
            )}

            {/* Toggleable Street Base: OpenStreetMap */}
            {mapLayers.streetBase && (
              <TileLayer
                key="osm-street"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution="&copy; OpenStreetMap contributors"
              />
            )}

            {/* NASA GIBS GPM IMERG Precipitation Rate */}
            {mapLayers.imergRain && (
              <TileLayer
                key={`gibs-imerg-${imageryDateIso}`}
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${imageryDateIso}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`}
                maxNativeZoom={6}
                maxZoom={18}
                opacity={0.65}
                attribution="NASA GPM IMERG"
              />
            )}

            {/* NASA GIBS VIIRS Thermal Anomalies */}
            {mapLayers.thermalFires && (
              <TileLayer
                key={`gibs-thermal-${imageryDateIso}`}
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/${imageryDateIso}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`}
                maxNativeZoom={8}
                maxZoom={18}
                opacity={0.85}
                attribution="NASA VIIRS Thermal"
              />
            )}

            {/* NASA GIBS Reference Place Labels */}
            {mapLayers.referenceLabels && !mapLayers.streetBase && (
              <TileLayer
                key="gibs-labels"
                url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Reference_Labels_15m/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"
                maxNativeZoom={9}
                maxZoom={18}
                opacity={0.85}
              />
            )}

            {/* Geodesic Search Radius Ring */}
            {mapLayers.radiusRing && (
              <Circle
                center={[location.lat, location.lon]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: '#5B9BFF',
                  weight: 1.5,
                  dashArray: '6 4',
                  fillColor: '#0B3D91',
                  fillOpacity: 0.08,
                }}
              />
            )}

            {/* Target Crosshair Pin */}
            <Marker position={[location.lat, location.lon]} icon={crosshairIcon}>
              <Popup className="earthpulse-popup">
                <div className="min-w-[160px] space-y-1 text-[12px]">
                  <div className="font-semibold text-[var(--text)]">{location.name}</div>
                  <div className="font-mono-tabular text-[11px] text-[var(--muted)]">
                    {formatCoordinates(location.lat, location.lon)}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* FIRMS Active Fire Markers */}
            {mapLayers.thermalFires &&
              firmsDetections.map((det) => (
                <Marker
                  key={det.id}
                  position={[det.lat, det.lon]}
                  icon={createFireIcon(det.frp)}
                >
                  <Popup className="earthpulse-popup">
                    <div className="min-w-[180px] space-y-1 text-[12px]">
                      <div className="flex items-center gap-1.5 font-semibold text-[#FC3D21]">
                        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>VIIRS Thermal Detection</span>
                      </div>
                      <div className="font-mono-tabular text-[11px]">
                        FRP: {det.frp.toFixed(1)} MW · Conf: {det.confidence}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-[var(--muted)]">
                        {det.distanceKm.toFixed(1)} km {det.bearingCardinal} · {det.acqDate}{' '}
                        {det.acqTime.slice(0, 2)}:{det.acqTime.slice(2, 4)} UTC
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* NASA EONET Open Natural Events */}
            {mapLayers.eonetEvents &&
              eonetEvents.map((ev) => (
                <Marker
                  key={ev.id}
                  position={[ev.lat, ev.lon]}
                  icon={createEonetIcon(ev.categoryId)}
                >
                  <Popup className="earthpulse-popup">
                    <div className="min-w-[200px] space-y-1.5 text-[12px]">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--interactive)]">
                        NASA EONET · {ev.categoryTitle}
                      </div>
                      <div className="font-semibold text-[var(--text)]">{ev.title}</div>
                      <div className="font-mono-tabular text-[11px] text-[var(--muted)]">
                        {ev.distanceKm.toFixed(1)} km {ev.bearingCardinal} · {ev.date.slice(0, 10)}
                      </div>
                      {ev.sourceUrl && (
                        <a
                          href={ev.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[11px] font-medium text-[var(--interactive)] underline"
                        >
                          NASA EONET Source
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}

      {/* Bottom floating HUD: 7-Day Satellite Imagery Date Scrubber (2D Map & Table modes) */}
      {viewMode !== '3d' && (
        <div className="absolute bottom-3 end-3 start-3 z-[450] space-y-1.5">
          <div className="hidden justify-center sm:flex">
            <span className="rounded-md bg-[var(--hud)] px-2.5 py-0.5 text-[11px] text-[var(--muted)] shadow-sm">
              {t.mapLayers.tapToInspect}
            </span>
          </div>
          <DateScrubber viewMode={viewMode} onChangeViewMode={setViewMode} />
        </div>
      )}
    </div>
  );
};
