import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useAppDispatch } from '../../../../app/hooks'
import { loadRestaurants } from '../../../restaurants/application/restaurantsSlice'
import type { Restaurant } from '../../../restaurants/domain/restaurant'
import {
  createRestaurant,
  getRestaurants,
  updateRestaurant,
  updateRestaurantAvailability,
  type RestaurantInput,
} from '../../../restaurants/infrastructure/restaurantApi'
import { getApiErrorMessage } from '../../../../shared/api/client'

const emptyForm: RestaurantInput = {
  name: '',
  city: '',
  address: '',
  is_open: true,
  opening_hours: '',
  contact: '',
}

export function RestaurantAdminPage() {
  const dispatch = useAppDispatch()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [form, setForm] = useState<RestaurantInput>(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function refreshRestaurants() {
    setError(null)
    try {
      setRestaurants(await getRestaurants())
    } catch (cause) {
      setError(getApiErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    void getRestaurants()
      .then((data) => {
        if (mounted) setRestaurants(data)
      })
      .catch((cause: unknown) => {
        if (mounted) setError(getApiErrorMessage(cause))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setNotice(null)
    setDialogOpen(true)
  }

  function startEdit(restaurant: Restaurant) {
    setEditing(restaurant)
    setForm({
      name: restaurant.name,
      city: restaurant.city,
      address: restaurant.address,
      is_open: restaurant.is_open,
      opening_hours: restaurant.opening_hours,
      contact: restaurant.contact,
    })
    setError(null)
    setNotice(null)
    setDialogOpen(true)
  }

  async function saveRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const { is_open: isOpen, ...restaurantDetails } = form
        await updateRestaurant(editing.id, restaurantDetails)
        if (isOpen !== editing.is_open) {
          await updateRestaurantAvailability(editing.id, isOpen)
        }
      } else {
        await createRestaurant(form)
      }
      setDialogOpen(false)
      setEditing(null)
      setNotice(editing ? 'Restaurant modifié.' : 'Restaurant créé.')
      await refreshRestaurants()
      await dispatch(loadRestaurants()).unwrap()
    } catch (cause) {
      setError(getApiErrorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailability(restaurant: Restaurant) {
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      await updateRestaurantAvailability(restaurant.id, !restaurant.is_open)
      setNotice(
        `${restaurant.name} est maintenant ${restaurant.is_open ? 'fermé' : 'ouvert'}.`,
      )
      await refreshRestaurants()
      await dispatch(loadRestaurants()).unwrap()
    } catch (cause) {
      setError(getApiErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        sx={{
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            color="secondary.main"
            sx={{ fontWeight: 700 }}
            variant="overline"
          >
            Administration
          </Typography>
          <Typography component="h1" variant="h2">
            Restaurants
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Modifiez les informations et gérez l’ouverture de vos établissements.
          </Typography>
        </Box>
        <Button onClick={startCreate} variant="contained">
          Ajouter un restaurant
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'grid', minHeight: 220, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement des restaurants" />
        </Box>
      ) : restaurants.length === 0 ? (
        <Alert severity="info">Aucun restaurant. Vous pouvez en ajouter un.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardContent>
                <Stack
                  sx={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {restaurant.city}
                    </Typography>
                    <Typography component="h2" sx={{ mt: 0.5 }} variant="h4">
                      {restaurant.name}
                    </Typography>
                  </Box>
                  <Chip
                    color={restaurant.is_open ? 'success' : 'default'}
                    label={restaurant.is_open ? 'Ouvert' : 'Fermé'}
                    size="small"
                  />
                </Stack>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="body2">{restaurant.address}</Typography>
                  <Typography variant="body2">{restaurant.contact}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {restaurant.opening_hours}
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={restaurant.is_open}
                      onChange={() => void toggleAvailability(restaurant)}
                    />
                  }
                  label={restaurant.is_open ? 'Commandes ouvertes' : 'Fermé'}
                />
                <Button onClick={() => startEdit(restaurant)} variant="outlined">
                  Modifier
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => !saving && setDialogOpen(false)}
        open={dialogOpen}
      >
        <Box component="form" onSubmit={saveRestaurant}>
          <DialogTitle>
            {editing ? 'Modifier le restaurant' : 'Ajouter un restaurant'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Nom"
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                value={form.name}
              />
              <TextField
                label="Ville"
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                required
                value={form.city}
              />
              <TextField
                label="Adresse"
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                required
                value={form.address}
              />
              <TextField
                label="Contact"
                onChange={(event) =>
                  setForm((current) => ({ ...current, contact: event.target.value }))
                }
                required
                value={form.contact}
              />
              <TextField
                label="Horaires d’ouverture"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    opening_hours: event.target.value,
                  }))
                }
                required
                value={form.opening_hours}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_open}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_open: event.target.checked,
                      }))
                    }
                  />
                }
                label="Restaurant ouvert aux commandes"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button disabled={saving} onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button disabled={saving} type="submit" variant="contained">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
