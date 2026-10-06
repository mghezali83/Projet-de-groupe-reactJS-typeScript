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
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { signIn } from '../application/authSlice'

interface RedirectLocation {
  from?: Location
}

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error, user } = useAppSelector((state) => state.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await dispatch(signIn({ username, password }))
    if (signIn.fulfilled.match(result)) {
      const redirect = (location.state as RedirectLocation | null)?.from?.pathname
      navigate(redirect ?? (result.payload.user.role === 'admin' ? '/admin/products' : '/'), {
        replace: true,
      })
    }
  }

  if (user) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', py: { xs: 6, md: 10 } }}>
        <Alert severity="info">
          Vous êtes déjà connecté.{' '}
          <Button
            onClick={() =>
              navigate(
                user.role === 'admin'
                  ? '/admin/restaurants'
                  : user.role === 'staff'
                    ? '/admin/products'
                    : '/',
              )
            }
          >
            {user.role === 'client' ? 'Retour à l’accueil' : 'Accéder à la gestion'}
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: { xs: 6, md: 10 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography
                color="secondary.main"
                sx={{ fontWeight: 700 }}
                variant="overline"
              >
                Espace équipe
              </Typography>
              <Typography component="h1" variant="h2">
                Connexion
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Connectez-vous pour accéder aux outils de gestion.
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoComplete="username"
              autoFocus
              fullWidth
              label="Identifiant"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
            <TextField
              autoComplete="current-password"
              fullWidth
              label="Mot de passe"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <Button
              disabled={status === 'loading'}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
            >
              {status === 'loading' ? 'Connexion…' : 'Se connecter'}
            </Button>
            <Button component={RouterLink} to="/register" variant="text">
              Créer un compte client
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
