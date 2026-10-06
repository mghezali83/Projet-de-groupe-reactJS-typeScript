import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import { getApiErrorMessage } from '../../../../shared/api/client'
import type { Restaurant } from '../../../restaurants/domain/restaurant'
import { getRestaurants } from '../../../restaurants/infrastructure/restaurantApi'
import {
  managedRoleLabels,
  type CreateManagedUserInput,
  type ManagedUser,
  type ManagedUserCreationRole,
} from '../domain/user'
import {
  createManagedUser,
  getManagedUsers,
} from '../infrastructure/userApi'

interface UserFormValues {
  first_name: string
  last_name: string
  username: string
  password: string
  role: ManagedUserCreationRole
  restaurant_id: string
}

const initialForm: UserFormValues = {
  first_name: '',
  last_name: '',
  username: '',
  password: '',
  role: 'staff',
  restaurant_id: '',
}

const managedRoles: ManagedUserCreationRole[] = ['admin', 'staff', 'direction']

function isValidPassword(password: string): boolean {
  const characters = Array.from(password)
  return (
    characters.length >= 12 &&
    characters.length <= 64 &&
    characters.some((character) => /\p{Uppercase}/u.test(character)) &&
    characters.some((character) => /[\p{Nd}\p{No}]/u.test(character)) &&
    characters.some((character) => /[^\p{L}\p{N}\s]/u.test(character))
  )
}

export function UserAdminPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [form, setForm] = useState<UserFormValues>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const [loadedUsers, loadedRestaurants] = await Promise.all([
        getManagedUsers(),
        getRestaurants(),
      ])
      setError(null)
      setUsers(loadedUsers)
      setRestaurants(loadedRestaurants)
    } catch (cause) {
      setError(getApiErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([getManagedUsers(), getRestaurants()])
      .then(([loadedUsers, loadedRestaurants]) => {
        if (!active) return
        setUsers(loadedUsers)
        setRestaurants(loadedRestaurants)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (active) setError(getApiErrorMessage(cause))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function updateForm<K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)

    const username = form.username.trim()
    if (!/^[a-zA-Z0-9]{8,12}$/.test(username)) {
      setFormError('L’identifiant doit contenir 8 à 12 lettres ou chiffres.')
      return
    }
    const firstName = form.first_name.trim()
    const lastName = form.last_name.trim()
    if (!firstName || !lastName) {
      setFormError('Le prénom et le nom sont obligatoires.')
      return
    }
    if (!isValidPassword(form.password)) {
      setFormError(
        'Le mot de passe doit contenir 12 à 64 caractères, une majuscule, un chiffre et un symbole.',
      )
      return
    }
    if (form.role === 'staff' && !form.restaurant_id) {
      setFormError('Un restaurant doit être affecté à un compte staff.')
      return
    }

    const input: CreateManagedUserInput = {
      first_name: firstName,
      last_name: lastName,
      username,
      password: form.password,
      role: form.role,
      restaurant_id: form.restaurant_id ? Number(form.restaurant_id) : null,
    }

    setSaving(true)
    try {
      await createManagedUser(input)
      setForm(initialForm)
      setNotice('Le compte a été créé.')
      await refreshData()
    } catch (cause) {
      setFormError(getApiErrorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Typography color="secondary.main" sx={{ fontWeight: 700 }} variant="overline">
        Administration
      </Typography>
      <Typography component="h1" variant="h2">
        Utilisateurs
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Consultez les comptes et créez les accès de l’équipe.
      </Typography>

      {error && (
        <Alert
          action={
            <Button color="inherit" onClick={() => void refreshData()}>
              Réessayer
            </Button>
          }
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography component="h2" sx={{ mb: 2 }} variant="h5">
            Créer un compte équipe
          </Typography>
          <Stack component="form" onSubmit={handleSubmit} spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                autoComplete="given-name"
                fullWidth
                label="Prénom"
                onChange={(event) => updateForm('first_name', event.target.value)}
                required
                value={form.first_name}
              />
              <TextField
                autoComplete="family-name"
                fullWidth
                label="Nom"
                onChange={(event) => updateForm('last_name', event.target.value)}
                required
                value={form.last_name}
              />
            </Stack>
            <TextField
              autoComplete="username"
              helperText="8 à 12 lettres ou chiffres, sans espace."
              label="Identifiant"
              slotProps={{ htmlInput: { minLength: 8, maxLength: 12, pattern: '[a-zA-Z0-9]+' } }}
              onChange={(event) => updateForm('username', event.target.value)}
              required
              value={form.username}
            />
            <TextField
              autoComplete="new-password"
              helperText="12 à 64 caractères, avec une majuscule, un chiffre et un symbole."
              label="Mot de passe initial"
              onChange={(event) => updateForm('password', event.target.value)}
              required
              type="password"
              value={form.password}
            />
            <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="managed-user-role-label">Rôle</InputLabel>
                <Select
                  label="Rôle"
                  labelId="managed-user-role-label"
                  onChange={(event) =>
                    updateForm(
                      'role',
                      event.target.value as ManagedUserCreationRole,
                    )
                  }
                  value={form.role}
                >
                  {managedRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {managedRoleLabels[role]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required={form.role === 'staff'}>
                <InputLabel id="managed-user-restaurant-label">Restaurant</InputLabel>
                <Select
                  label="Restaurant"
                  labelId="managed-user-restaurant-label"
                  onChange={(event) =>
                    updateForm('restaurant_id', String(event.target.value))
                  }
                  value={form.restaurant_id}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {restaurants.map((restaurant) => (
                    <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                      {restaurant.name} — {restaurant.city}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {form.role === 'staff'
                    ? 'Obligatoire pour le staff.'
                    : 'Facultatif pour ce rôle.'}
                </FormHelperText>
              </FormControl>
            </Stack>
            <Box>
              <Button
                disabled={saving}
                startIcon={saving ? <CircularProgress color="inherit" size={18} /> : <AddRounded />}
                type="submit"
                variant="contained"
              >
                Créer le compte
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography component="h2" sx={{ mb: 2 }} variant="h5">
        Comptes existants
      </Typography>
      {loading ? (
        <Box sx={{ display: 'grid', minHeight: 200, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement des utilisateurs" />
        </Box>
      ) : users.length === 0 ? (
        <Alert severity="info">Aucun utilisateur à afficher.</Alert>
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
          {users.map((managedUser) => {
            const restaurant = restaurants.find(
              (item) => item.id === managedUser.restaurant_id,
            )
            return (
              <Card key={managedUser.id}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Compte #{managedUser.id}
                  </Typography>
                  <Typography component="h3" sx={{ mt: 0.5 }} variant="h6">
                    {managedUser.first_name} {managedUser.last_name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {managedUser.username}
                  </Typography>
                  <Stack
                    sx={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Chip
                      color={
                        managedUser.role === 'admin'
                          ? 'primary'
                          : managedUser.role === 'client'
                            ? 'info'
                            : 'default'
                      }
                      label={managedRoleLabels[managedUser.role]}
                      size="small"
                    />
                    {restaurant && (
                      <Chip label={restaurant.name} size="small" variant="outlined" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      <Snackbar
        autoHideDuration={3500}
        onClose={() => setNotice(null)}
        open={notice !== null}
      >
        <Alert onClose={() => setNotice(null)} severity="success" variant="filled">
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  )
}
