import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { ScreenshotItem } from '../api/types';
import { getAppScreenshots } from '../api/screenshotsApi';

export default function MonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const appId = id ? Number(id) : null;

  const [items, setItems] = useState<ScreenshotItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return;
    getAppScreenshots(appId, 10)
      .then((res) => setItems(res.items))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [appId]);

  if (!appId) return <div>Invalid app id</div>;

  if (error) return <div>Failed: {error}</div>;
  if (!items) return <div>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Monitoring {appId}</h1>
      <ul>
        {items.map((s) => (
          <li key={s.id}>
            <div>{s.capturedAt}</div>
            <img
              src={s.imageUrl}
              alt=""
              style={{ width: 320, height: 'auto', border: '1px solid #ddd' }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
