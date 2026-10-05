import { lazy, Suspense, useEffect, useState } from 'react'
import {
  AppBar,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Card,
  CardActions,
  CardContent,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { signOut } from './features/auth/application/authSlice'
import { roleLabels } from './features/auth/domain/auth'
import { RoleGuard } from './features/auth/presentation/RoleGuard'
import { selectActiveRestaurant, loadRestaurants } from './features/restaurants/application/restaurantsSlice'
import { selectCartItemCount, clearCart } from './features/cart/application/cartSlice'
import { CartDrawer } from './features/cart/presentation/CartDrawer'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import PhoneOutlined from '@mui/icons-material/PhoneOutlined'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

const ProductCatalogPage = lazy(() =>
  import('./features/products/presentation/ProductCatalogPage').then(
    (module) => ({ default: module.ProductCatalogPage }),
  ),
)
const CheckoutPage = lazy(() =>
  import('./features/orders/presentation/CheckoutPage').then((module) => ({
    default: module.CheckoutPage,
  })),
)
const OrderTrackingPage = lazy(() =>
  import('./features/orders/presentation/OrderTrackingPage').then((module) => ({
    default: module.OrderTrackingPage,
  })),
)

const LoginPage = lazy(() =>
  import('./features/auth/presentation/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)
const ProductAdminPage = lazy(() =>
  import('./features/admin/products/presentation/ProductAdminPage').then(
    (module) => ({ default: module.ProductAdminPage }),
  ),
)

function HomePage({ canManageProducts }: { canManageProducts: boolean }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items: restaurants, activeRestaurant, status, error } =
    useAppSelector((state) => state.restaurants)
  const cart = useAppSelector((state) => state.cart)

  async function chooseRestaurant(restaurantId: number): Promise<boolean> {
    if (
      cart.items.length > 0 &&
      cart.restaurantId !== null &&
      cart.restaurantId !== restaurantId &&
      !window.confirm(
        'Changer de restaurant effacera le panier actuel. Voulez-vous continuer ?',
      )
    ) {
      return false
    }
    try {
      await dispatch(selectActiveRestaurant(restaurantId)).unwrap()
      if (cart.restaurantId !== null && cart.restaurantId !== restaurantId) {
        dispatch(clearCart())
      }
      return true
    } catch {
      // L’erreur est affichée depuis l’état partagé des restaurants.
      return false
    }
  }

  return (
    <Box sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ mb: 5, textAlign: { xs: 'left', md: 'center' } }}>
        <Typography
          color="secondary.main"
          sx={{ fontWeight: 700 }}
          variant="overline"
        >
          Ytasty Crousty
        </Typography>
        <Typography component="h1" sx={{ mt: 1 }} variant="h1">
          Choisissez votre restaurant
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 650, mx: { md: 'auto' }, my: 2 }}
          variant="h6"
        >
          Aix-en-Provence, Lyon ou Paris : retrouvez notre adresse, nos horaires
          et commandez auprès de votre établissement.
        </Typography>
        {canManageProducts && (
          <Button
            component={RouterLink}
            sx={{ mt: 1 }}
            to="/admin/products"
            variant="outlined"
          >
            Gérer les produits
          </Button>
        )}
      </Box>

      {error && (
        <Alert
          action={
            <Button
              color="inherit"
              onClick={() => void dispatch(loadRestaurants())}
            >
              Réessayer
            </Button>
          }
          severity="error"
          sx={{ mb: 3 }}
        >
          Impossible de charger les restaurants : {error}
        </Alert>
      )}

      {status === 'loading' && (
        <Box sx={{ display: 'grid', minHeight: 220, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement des restaurants" />
        </Box>
      )}

      {status === 'ready' && restaurants.length === 0 && (
        <Alert severity="info">Aucun restaurant n’est disponible.</Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {restaurants.map((restaurant) => {
          const isActive = activeRestaurant?.id === restaurant.id
          return (
            <Card
              key={restaurant.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                outline: isActive ? '2px solid' : 'none',
                outlineColor: 'secondary.main',
              }}
            >
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Stack
                  sx={{
                    alignItems: 'flex-start',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
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
                <Stack sx={{ gap: 1.5, mt: 3 }}>
                  <Stack
                    sx={{ alignItems: 'flex-start', flexDirection: 'row', gap: 1 }}
                  >
                    <LocationOnOutlined color="action" fontSize="small" />
                    <Typography variant="body2">{restaurant.address}</Typography>
                  </Stack>
                  <Stack
                    sx={{ alignItems: 'flex-start', flexDirection: 'row', gap: 1 }}
                  >
                    <PhoneOutlined color="action" fontSize="small" />
                    <Typography
                      component="a"
                      href={`tel:${restaurant.contact.replace(/[^\d+]/g, '')}`}
                      sx={{ color: 'text.primary', textDecoration: 'none' }}
                      variant="body2"
                    >
                      {restaurant.contact}
                    </Typography>
                  </Stack>
                  <Stack
                    sx={{ alignItems: 'flex-start', flexDirection: 'row', gap: 1 }}
                  >
                    <AccessTimeRounded color="action" fontSize="small" />
                    <Typography variant="body2">
                      {restaurant.opening_hours}
                    </Typography>
                  </Stack>
                </Stack>
                {!restaurant.is_open && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Établissement fermé : commande indisponible.
                  </Alert>
                )}
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                <Button
                  disabled={!restaurant.is_open}
                  fullWidth
                  onClick={async () => {
                    if (await chooseRestaurant(restaurant.id)) {
                      navigate('/produits')
                    }
                  }}
                  variant={isActive ? 'outlined' : 'contained'}
                >
                  {!restaurant.is_open
                    ? 'Commandes fermées'
                    : isActive
                      ? 'Restaurant sélectionné · Voir la carte'
                      : 'Choisir et voir la carte'}
                </Button>
              </CardActions>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}

function NotFoundPage() {
  return (
    <Box sx={{ py: 12, textAlign: 'center' }}>
      <Typography component="h1" variant="h2">
        Page introuvable
      </Typography>
      <Button component={RouterLink} sx={{ mt: 3 }} to="/" variant="outlined">
        Retour à l’accueil
      </Button>
    </Box>
  )
}

function App() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const restaurants = useAppSelector((state) => state.restaurants.items)
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurantStatus = useAppSelector((state) => state.restaurants.status)
  const restaurantError = useAppSelector((state) => state.restaurants.error)
  const cart = useAppSelector((state) => state.cart)
  const cartCount = useAppSelector(selectCartItemCount)
  const canManageProducts = user?.role === 'admin' || user?.role === 'staff'
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    void dispatch(loadRestaurants())
  }, [dispatch])

  async function changeRestaurant(restaurantId: number) {
    if (
      cart.items.length > 0 &&
      cart.restaurantId !== null &&
      cart.restaurantId !== restaurantId &&
      !window.confirm(
        'Changer de restaurant effacera le panier actuel. Voulez-vous continuer ?',
      )
    ) {
      return
    }

    try {
      await dispatch(selectActiveRestaurant(restaurantId)).unwrap()
      if (cart.restaurantId !== null && cart.restaurantId !== restaurantId) {
        dispatch(clearCart())
      }
    } catch {
      // Le message d’échec est exposé dans l’état restaurants et affiché ci-dessous.
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar
          component={Container}
          maxWidth="lg"
          sx={{
            alignItems: { xs: 'stretch', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1.5,
            py: 1.5,
          }}
        >
          <Typography
            component={RouterLink}
            sx={{
              color: 'primary.main',
              flexGrow: 1,
              fontSize: '1.1rem',
              fontWeight: 800,
              textDecoration: 'none',
            }}
            to="/"
            variant="h6"
          >
            Ytasty Crousty
          </Typography>
          <FormControl
            disabled={restaurantStatus !== 'ready' || restaurants.length === 0}
            size="small"
            sx={{ minWidth: { xs: 160, sm: 220 } }}
          >
            <InputLabel id="restaurant-active-label">Restaurant</InputLabel>
            <Select
              label="Restaurant"
              labelId="restaurant-active-label"
              onChange={(event) => {
                const restaurantId = Number(event.target.value)
                if (Number.isSafeInteger(restaurantId)) {
                  void changeRestaurant(restaurantId)
                }
              }}
              value={activeRestaurant ? String(activeRestaurant.id) : ''}
            >
              {restaurants.map((restaurant) => (
                <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                  {restaurant.city}
                  {!restaurant.is_open ? ' · Fermé' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack sx={{ alignItems: 'center', flexDirection: 'row', gap: 1 }}>
            <Button
              component={RouterLink}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              to="/"
              variant="text"
            >
              Accueil
            </Button>
            <Button component={RouterLink} to="/produits" variant="text">
              Carte
            </Button>
            {canManageProducts && (
              <Button
                component={RouterLink}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                to="/admin/products"
                variant="text"
              >
                Produits
              </Button>
            )}
            <Button
              aria-label={`Ouvrir le panier, ${cartCount} article${cartCount === 1 ? '' : 's'}`}
              onClick={() => setCartOpen(true)}
              sx={{ minWidth: 44, px: 1 }}
              variant="text"
            >
              <Badge badgeContent={cartCount} color="primary" showZero>
                <ShoppingBagOutlined />
              </Badge>
            </Button>
            {user ? (
              <>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34 }}>
                  {user.role.slice(0, 1).toUpperCase()}
                </Avatar>
                <Typography
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                  variant="body2"
                >
                  {`Compte #${user.id}`}
                  <br />
                  <Chip
                    color="secondary"
                    label={roleLabels[user.role]}
                    size="small"
                    sx={{ height: 20 }}
                  />
                </Typography>
                <Button
                  onClick={() => void dispatch(signOut())}
                  variant="outlined"
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Déconnexion
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    Sortir
                  </Box>
                </Button>
              </>
            ) : (
              <Button component={RouterLink} to="/login" variant="contained">
                Connexion
              </Button>
            )}
          </Stack>
        </Toolbar>
        {restaurantError && (
          <Container maxWidth="lg" sx={{ pb: 1.5 }}>
            <Alert severity="error">{restaurantError}</Alert>
          </Container>
        )}
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1 }}>
        <Suspense
          fallback={
            <Box sx={{ display: 'grid', minHeight: 320, placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          }
        >
          <Routes>
            <Route
              element={<HomePage canManageProducts={canManageProducts} />}
              path="/"
            />
            <Route element={<LoginPage />} path="/login" />
            <Route
              element={<Navigate replace to="/login" />}
              path="/connexion"
            />
            <Route
              element={<ProductCatalogPage />}
              path="/produits"
            />
            <Route element={<CheckoutPage />} path="/checkout" />
            <Route
              element={<OrderTrackingPage />}
              path="/suivi/:order_number"
            />
            <Route
              element={
                <RoleGuard allowedRoles={['admin', 'staff']}>
                  <ProductAdminPage />
                </RoleGuard>
              }
              path="/admin/products"
            />
            <Route element={<NotFoundPage />} path="*" />
          </Routes>
        </Suspense>
      </Container>

      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          color: 'text.secondary',
          mt: 6,
          py: 2.5,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          Ytasty Crousty · Espace de gestion
        </Typography>
      </Box>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </Box>
  )
}

export default App
