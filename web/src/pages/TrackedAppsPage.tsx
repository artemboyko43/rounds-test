import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TrackedApp } from '../api/types';
import {
  createApp,
  deactivateApp,
  getApps,
  type CreateAppInput,
  type UpdateAppInput,
  updateApp,
} from '../api/appsApi';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { parseOptionalPositiveInt } from '../lib/parseOptionalPositiveInt';

export default function TrackedAppsPage() {
  const [items, setItems] = useState<TrackedApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newPackageId, setNewPackageId] = useState('');
  const [newCaptureInterval, setNewCaptureInterval] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editName, setEditName] = useState('');
  const [editPackageId, setEditPackageId] = useState('');
  const [editCaptureInterval, setEditCaptureInterval] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    setError(null);
    const res = await getApps();
    setItems(res.items);
  };

  useEffect(() => {
    reload().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const submitCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const interval = parseOptionalPositiveInt(newCaptureInterval);
      if (!interval.ok) {
        setError(interval.error);
        return;
      }

      const payload: CreateAppInput = {
        url: newUrl,
        name: newName.trim().length ? newName.trim() : undefined,
        packageId: newPackageId.trim().length ? newPackageId.trim() : undefined,
        captureIntervalMinutes: interval.value,
      };

      await createApp(payload);

      setNewUrl('');
      setNewName('');
      setNewPackageId('');
      setNewCaptureInterval('');
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create app');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (app: TrackedApp) => {
    setEditingId(app.id);
    setEditUrl(app.url);
    setEditName(app.name ?? '');
    setEditPackageId(app.packageId ?? '');
    setEditCaptureInterval(app.captureIntervalMinutes ? String(app.captureIntervalMinutes) : '');
    setEditActive(app.isActive);
    setSavingEdit(false);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingId(null);
    setSavingEdit(false);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    setError(null);
    try {
      const interval = parseOptionalPositiveInt(editCaptureInterval);
      if (!interval.ok) {
        setError(interval.error);
        setSavingEdit(false);
        return;
      }

      const payload: UpdateAppInput = {
        url: editUrl.trim().length ? editUrl.trim() : undefined,
        name: editName.trim().length ? editName.trim() : undefined,
        packageId: editPackageId.trim().length ? editPackageId.trim() : undefined,
        captureIntervalMinutes: interval.value,
        isActive: editActive,
      };

      await updateApp(editingId, payload);
      closeEdit();
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update app');
      setSavingEdit(false);
    }
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setDeleteOpen(true);
    setDeleting(false);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeletingId(null);
    setDeleting(false);
  };

  const submitDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deactivateApp(deletingId);
      closeDelete();
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete app');
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!items) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Tracked apps
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add app
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField
              label="Google Play URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Capture interval minutes (optional)"
              value={newCaptureInterval}
              onChange={(e) => setNewCaptureInterval(e.target.value)}
              fullWidth
            />
            <TextField label="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <TextField
              label="Package ID (optional)"
              value={newPackageId}
              onChange={(e) => setNewPackageId(e.target.value)}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={submitCreate} disabled={creating || !newUrl.trim()}>
              {creating ? 'Adding...' : 'Add'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>App</TableCell>
              <TableCell>URL</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((app) => (
              <TableRow key={app.id}>
                <TableCell sx={{ width: 260 }}>
                  <Typography variant="subtitle1" noWrap>
                    {app.name ?? app.packageId ?? `App ${app.id}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', color: 'text.secondary' }}>
                    {app.url}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ width: 250 }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button size="small" variant="outlined" component={Link} to={`/apps/${app.id}`}>
                      View
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => openEdit(app)}>
                      Edit
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => openDelete(app.id)}>
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit app</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Google Play URL" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} fullWidth />
            <TextField label="Name (optional)" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField
              label="Package ID (optional)"
              value={editPackageId}
              onChange={(e) => setEditPackageId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Capture interval minutes (optional)"
              value={editCaptureInterval}
              onChange={(e) => setEditCaptureInterval(e.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />}
              label={editActive ? 'Active' : 'Inactive'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={savingEdit}>
            Cancel
          </Button>
          <Button onClick={submitEdit} variant="contained" disabled={savingEdit || !editUrl.trim()}>
            {savingEdit ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete app?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            This will deactivate the app in the tracker.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={submitDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
