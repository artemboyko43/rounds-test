import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import type { ScreenshotItem, TrackedApp } from '../api/types';
import { captureApp, getApps } from '../api/appsApi';
import { getAppScreenshots } from '../api/screenshotsApi';
import { API_BASE_URL } from '../api/client';
import { formatUtcGmt } from '../lib/formatUtcGmt';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

export default function MonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const appId = id ? Number(id) : null;

  const [app, setApp] = useState<TrackedApp | null>(null);
  const [items, setItems] = useState<ScreenshotItem[] | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const PAGE_LIMIT = 10;

  const appTitle = useMemo(() => (app ? app.name ?? app.packageId ?? `App ${app.id}` : 'Monitoring'), [app]);

  const reload = useCallback(async () => {
    if (!appId) return;
    setError(null);
    try {
      const [appsRes, screenshotsRes] = await Promise.all([
        getApps(),
        getAppScreenshots(appId, PAGE_LIMIT),
      ]);
      setApp(appsRes.items.find((a) => a.id === appId) ?? null);
      setItems(screenshotsRes.items);
      setNextCursor(screenshotsRes.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [appId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCapture = async () => {
    if (!appId) return;
    setCapturing(true);
    setError(null);
    try {
      await captureApp(appId);
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to capture screenshot');
    } finally {
      setCapturing(false);
    }
  };

  const loadMore = async (): Promise<void> => {
    if (!appId || loadingMore || nextCursor === null) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await getAppScreenshots(appId, PAGE_LIMIT, nextCursor);
      setItems((prev) => (prev ? [...prev, ...res.items] : res.items));
      setNextCursor(res.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load more screenshots');
    } finally {
      setLoadingMore(false);
    }
  };

  if (!appId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Invalid app id</Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const startTimeGMT = app?.createdAt ? formatUtcGmt(app.createdAt) : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }} />
        <Typography variant="h4" sx={{ flex: 1, textAlign: 'center' }}>
          {appTitle}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleCapture} disabled={capturing || !app?.isActive}>
            {capturing ? 'Capturing...' : 'Capture Now'}
          </Button>
          <Button component={RouterLink} to="/" variant="outlined">
            Back
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Link:
              </Typography>
              {app?.url ? (
                <Link
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'underline',
                    wordBreak: 'break-word',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {app.url}
                </Link>
              ) : (
                <Skeleton variant="text" width={300} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Start time
              </Typography>
              {startTimeGMT ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {startTimeGMT}
                </Typography>
              ) : (
                <Skeleton variant="text" width={220} />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Screenshot timeline
      </Typography>

      {!items ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={420} />
          <Skeleton variant="rectangular" height={420} />
        </Stack>
      ) : items.length === 0 ? (
        <Alert severity="info">No screenshots yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {items.map((s, idx) => (
            <Box key={s.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="baseline" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Screenshot time: {formatUtcGmt(s.capturedAt)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: s.status === 'SUCCESS' ? 'success.main' : 'error.main' }}>
                      {s.status}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                </CardContent>
                 <Box
                   sx={{
                     width: '100%',
                     maxHeight: '70vh',
                     overflowY: 'auto',
                     overflowX: 'hidden',
                     bgcolor: 'grey.50',
                     border: 1,
                     borderColor: 'divider',
                   }}
                 >
                   <Box
                     component="img"
                     src={s.imageUrl.startsWith('http') ? s.imageUrl : `${API_BASE_URL}${s.imageUrl}`}
                     alt={`Screenshot captured at ${new Date(s.capturedAt).toLocaleString()}`}
                     sx={{
                       width: '100%',
                       height: 'auto',
                       display: 'block',
                       minHeight: '100%',
                     }}
                   />
                 </Box>
              </Card>
              {idx < items.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      )}

      {items && items.length > 0 && nextCursor !== null && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
