import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Card,
  CardActions,
  CardContent,
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
import { RoleGuard } from './features/auth/presentation/RoleGuard'
import { clearCart } from './features/cart/application/cartSlice'
import {
  loadRestaurants,
  selectActiveRestaurant,
} from './features/restaurants/application/restaurantsSlice'
import { CartDrawer } from './features/cart/presentation/CartDrawer'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import PhoneOutlined from '@mui/icons-material/PhoneOutlined'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import { Header } from './shared/components/Header'

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
const RegisterPage = lazy(() =>
  import('./features/auth/presentation/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
)
const ProductAdminPage = lazy(() =>
  import('./features/admin/products/presentation/ProductAdminPage').then(
    (module) => ({ default: module.ProductAdminPage }),
  ),
)
const RestaurantAdminPage = lazy(() =>
  import('./features/admin/restaurants/presentation/RestaurantAdminPage').then(
    (module) => ({ default: module.RestaurantAdminPage }),
  ),
)

function HomePage({
  canManageProducts,
  canAdminister,
  onChooseRestaurant,
}: {
  canManageProducts: boolean
  canAdminister: boolean
  onChooseRestaurant: (restaurantId: number) => Promise<boolean>
}) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items: restaurants, activeRestaurant, status, error } =
    useAppSelector((state) => state.restaurants)

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
        {canAdminister && (
          <Stack
            sx={{
              mt: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Button component={RouterLink} to="/admin/products" variant="outlined">
              Gérer les produits
            </Button>
            <Button component={RouterLink} to="/admin/restaurants" variant="outlined">
              Gérer les restaurants
            </Button>
          </Stack>
        )}
        {canManageProducts && !canAdminister && (
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
                    if (await onChooseRestaurant(restaurant.id)) {
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
  const cart = useAppSelector((state) => state.cart)
  const canManageProducts = user?.role === 'admin' || user?.role === 'staff'
  const canAdminister = user?.role === 'admin'
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    void dispatch(loadRestaurants())
  }, [dispatch])

  async function changeRestaurant(restaurantId: number): Promise<boolean> {
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
      return false
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onOpenCart={() => setCartOpen(true)}
        onRestaurantChange={changeRestaurant}
      />

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
              element={
                <HomePage
                  canAdminister={canAdminister}
                  canManageProducts={canManageProducts}
                  onChooseRestaurant={changeRestaurant}
                />
              }
              path="/"
            />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<RegisterPage />} path="/register" />
            <Route element={<RegisterPage />} path="/inscription" />
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
            <Route
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <RestaurantAdminPage />
                </RoleGuard>
              }
              path="/admin/restaurants"
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
