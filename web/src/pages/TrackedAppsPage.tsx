import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TrackedApp } from '../api/types';
import { getApps } from '../api/appsApi';

export default function TrackedAppsPage() {
  const [items, setItems] = useState<TrackedApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApps()
      .then((res) => setItems(res.items))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  if (error) {
    return <div>Failed: {error}</div>;
  }

  if (!items) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Tracked apps</h1>
      <ul>
        {items.map((app) => (
          <li key={app.id}>
            <Link to={`/apps/${app.id}`}>{app.name ?? app.packageId ?? `App ${app.id}`}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
