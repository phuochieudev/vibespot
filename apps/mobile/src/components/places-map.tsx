import type { Place } from '@vibespot/shared';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { MAP_HTML } from './places-map-html';

// Bản đồ OpenStreetMap (Leaflet trong WebView). Không dùng Google Maps nên không cần khoá API,
// và chạy được trong Expo Go. Giao diện (props) giữ độc lập với engine để sau này có thể
// thay bằng MapLibre native mà không phải sửa màn hình gọi nó.

export interface PlacesMapHandle {
  flyTo: (lat: number, lng: number) => void;
}

interface Props {
  center: { lat: number; lng: number };
  places: Place[];
  selectedId: string | null;
  me: { lat: number; lng: number } | null;
  onSelect: (id: string | null) => void;
  onMove: (area: { lat: number; lng: number; radius: number }) => void;
}

type WebMessage =
  | { type: 'ready' }
  | { type: 'select'; id: string | null }
  | { type: 'move'; lat: number; lng: number; radius: number };

export const PlacesMap = forwardRef<PlacesMapHandle, Props>(function PlacesMap(
  { center, places, selectedId, me, onSelect, onMove },
  ref,
) {
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const pendingFly = useRef<{ lat: number; lng: number } | null>(null);

  const run = useCallback((js: string) => web.current?.injectJavaScript(`${js};true;`), []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat, lng) => {
        if (ready) run(`window.flyTo(${lat},${lng},16)`);
        else pendingFly.current = { lat, lng };
      },
    }),
    [ready, run],
  );

  useEffect(() => {
    if (!ready) return;
    const slim = places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng }));
    run(`window.setPlaces(${JSON.stringify(JSON.stringify(slim))})`);
    run(`window.setSelected(${JSON.stringify(selectedId)})`);
  }, [ready, places, selectedId, run]);

  useEffect(() => {
    if (ready && me) run(`window.setMe(${me.lat},${me.lng})`);
  }, [ready, me, run]);

  const onMessage = (e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data) as WebMessage;
    if (msg.type === 'ready') {
      setReady(true);
      const start = pendingFly.current ?? center;
      run(`window.setView(${start.lat},${start.lng},15)`);
      pendingFly.current = null;
    } else if (msg.type === 'select') {
      onSelect(msg.id);
    } else if (msg.type === 'move') {
      onMove({ lat: msg.lat, lng: msg.lng, radius: Math.min(5000, Math.max(300, msg.radius)) });
    }
  };

  return (
    <WebView
      ref={web}
      style={StyleSheet.absoluteFill}
      source={{ html: MAP_HTML, baseUrl: 'https://localhost' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      overScrollMode="never"
      onMessage={onMessage}
    />
  );
});
