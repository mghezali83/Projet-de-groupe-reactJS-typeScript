import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { signUp } from '../application/authSlice'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error, user } = useAppSelector((state) => state.auth)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (password !== confirmation) {
      setFormError('Les mots de passe ne correspondent pas.')
      return
    }

    const result = await dispatch(
      signUp({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username,
        password,
      }),
    )
    if (signUp.fulfilled.match(result)) {
      navigate('/', { replace: true })
    }
  }

  if (user) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', py: { xs: 6, md: 10 } }}>
        <Alert severity="info">
          Vous êtes déjà connecté.{' '}
          <Button component={RouterLink} to="/">
            Retour à l’accueil
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', py: { xs: 5, md: 8 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography color="secondary.main" sx={{ fontWeight: 700 }} variant="overline">
                Espace client
              </Typography>
              <Typography component="h1" variant="h2">
                Créer un compte
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Créez votre compte pour retrouver facilement votre espace client.
              </Typography>
            </Box>
            {(formError || error) && (
              <Alert severity="error">{formError ?? error}</Alert>
            )}
            <TextField
              autoComplete="given-name"
              autoFocus
              label="Prénom"
              onChange={(event) => setFirstName(event.target.value)}
              required
              value={firstName}
            />
            <TextField
              autoComplete="family-name"
              label="Nom"
              onChange={(event) => setLastName(event.target.value)}
              required
              value={lastName}
            />
            <TextField
              autoComplete="username"
              helperText="8 à 12 lettres ou chiffres, sans espace."
              label="Identifiant"
              slotProps={{
                htmlInput: {
                  minLength: 8,
                  maxLength: 12,
                  pattern: '[a-zA-Z0-9]+',
                },
              }}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
            <TextField
              autoComplete="new-password"
              helperText="12 caractères minimum, avec un chiffre et un symbole."
              label="Mot de passe"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <TextField
              autoComplete="new-password"
              label="Confirmer le mot de passe"
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
            <Button disabled={status === 'loading'} size="large" type="submit" variant="contained">
              {status === 'loading' ? 'Création…' : 'Créer mon compte'}
            </Button>
            <Button component={RouterLink} to="/login" variant="text">
              Déjà inscrit ? Se connecter
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
