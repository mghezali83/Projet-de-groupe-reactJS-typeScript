import { useState } from 'react'
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuRounded from '@mui/icons-material/MenuRounded'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { signOut } from '../../features/auth/application/authSlice'
import { roleLabels } from '../../features/auth/domain/auth'
import { selectCartItemCount } from '../../features/cart/application/cartSlice'

export function Header({
  onOpenCart,
  onRestaurantChange,
}: {
  onOpenCart: () => void
  onRestaurantChange: (restaurantId: number) => Promise<boolean>
}) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const restaurants = useAppSelector((state) => state.restaurants.items)
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurantStatus = useAppSelector((state) => state.restaurants.status)
  const restaurantError = useAppSelector((state) => state.restaurants.error)
  const cartCount = useAppSelector(selectCartItemCount)
  const canManageProducts = user?.role === 'admin' || user?.role === 'staff'
  const canAdminister = user?.role === 'admin'
  const canViewOrders =
    user?.role === 'admin' || user?.role === 'staff' || user?.role === 'direction'
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(
    null,
  )

  return (
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
          alignItems: 'center',
          columnGap: { xs: 1, md: 2 },
          flexWrap: 'wrap',
          rowGap: 1,
          py: { xs: 1, md: 1.25 },
        }}
      >
        <Stack
          component={RouterLink}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            textDecoration: 'none',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
          }}
          to="/"
        >
          <Box
            aria-hidden="true"
            sx={{
              alignItems: 'center',
              bgcolor: 'secondary.main',
              borderRadius: 2.5,
              color: 'secondary.contrastText',
              display: 'flex',
              flex: '0 0 auto',
              height: 38,
              justifyContent: 'center',
              width: 38,
              fontSize: '0.85rem',
              fontWeight: 900,
            }}
          >
            YC
          </Box>
          <Typography 
            color="primary.main"
            noWrap
            sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 850 }}
            variant="h6"
          >
            Ytasty Crousty
          </Typography>
        </Stack>

        <Stack
          sx={{
            alignItems: 'center',
            display: { xs: 'flex', lg: 'none' },
            flexDirection: 'row',
            gap: 0.5,
          }}
        >
          <IconButton
            aria-label={`Ouvrir le panier, ${cartCount} article${cartCount === 1 ? '' : 's'}`}
            onClick={onOpenCart}
          >
            <Badge badgeContent={cartCount} color="primary" showZero>
              <ShoppingBagOutlined />
            </Badge>
          </IconButton>
          <IconButton
            aria-label="Ouvrir le menu"
            aria-expanded={Boolean(mobileMenuAnchor)}
            aria-haspopup="true"
            onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
          >
            {user ? (
              <Avatar sx={{ bgcolor: 'secondary.main', width: 30, height: 30 }}>
                {user.role.slice(0, 1).toUpperCase()}
              </Avatar>
            ) : (
              <MenuRounded />
            )}
          </IconButton>
        </Stack>

        <FormControl
          disabled={restaurantStatus !== 'ready' || restaurants.length === 0}
          size="small"
          sx={{
            flex: { xs: '1 0 100%', lg: '0 0 auto' },
            minWidth: { xs: 0, lg: 190 },
            order: { xs: 3, lg: 0 },
            maxWidth: { lg: 230 },
          }}
        >
          <InputLabel id="restaurant-active-label">Restaurant</InputLabel>
          <Select
            label="Restaurant"
            labelId="restaurant-active-label"
            onChange={(event) => {
              const restaurantId = Number(event.target.value)
              if (Number.isSafeInteger(restaurantId)) {
                void onRestaurantChange(restaurantId)
              }
            }}
            value={activeRestaurant ? String(activeRestaurant.id) : ''}
          >
            {restaurants.map((restaurant) => (
              <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                <Stack
                  sx={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 1,
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Typography noWrap variant="body2">
                    {restaurant.city}
                  </Typography>
                  <Chip
                    color={restaurant.is_open ? 'success' : 'default'}
                    label={restaurant.is_open ? 'Ouvert' : 'Fermé'}
                    size="small"
                    sx={{ height: 22 }}
                  />
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack
          sx={{
            alignItems: 'center',
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'row',
            gap: 0.5,
          }}
        >
          <Button component={RouterLink} to="/" variant="text">
            Accueil
          </Button>
          <Button component={RouterLink} to="/produits" variant="text">
            Carte
          </Button>
          {canManageProducts && (
            <Button component={RouterLink} to="/admin/products" variant="text">
              Produits
            </Button>
          )}
          {canViewOrders && (
            <Button component={RouterLink} to="/admin/orders" variant="text">
              Commandes
            </Button>
          )}
          {canAdminister && (
            <Button component={RouterLink} to="/admin/restaurants" variant="text">
              Restaurants
            </Button>
          )}
          {canAdminister && (
            <Button component={RouterLink} to="/admin/users" variant="text">
              Utilisateurs
            </Button>
          )}
          <Button
            aria-label={`Ouvrir le panier, ${cartCount} article${cartCount === 1 ? '' : 's'}`}
            onClick={onOpenCart}
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
              <Typography color="text.secondary" variant="body2">
                {`Compte #${user.id}`}
                <br />
                <Chip
                  color="secondary"
                  label={roleLabels[user.role]}
                  size="small"
                  sx={{ height: 20 }}
                />
              </Typography>
              <Button onClick={() => void dispatch(signOut())} variant="outlined">
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/register" variant="text">
                Créer un compte
              </Button>
              <Button component={RouterLink} to="/login" variant="contained">
                Connexion
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
      <Menu
        anchorEl={mobileMenuAnchor}
        onClose={() => setMobileMenuAnchor(null)}
        open={Boolean(mobileMenuAnchor)}
        slotProps={{ paper: { sx: { minWidth: 230, mt: 1 } } }}
      >
        {user && (
          <MenuItem disabled sx={{ opacity: '1 !important', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34 }}>
              {user.role.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2">Compte #{user.id}</Typography>
              <Typography color="text.secondary" variant="caption">
                {roleLabels[user.role]}
              </Typography>
            </Box>
          </MenuItem>
        )}
        <MenuItem
          component={RouterLink}
          onClick={() => setMobileMenuAnchor(null)}
          to="/"
        >
          Accueil
        </MenuItem>
        <MenuItem
          component={RouterLink}
          onClick={() => setMobileMenuAnchor(null)}
          to="/produits"
        >
          Notre carte
        </MenuItem>
        {canManageProducts && (
          <MenuItem
            component={RouterLink}
            onClick={() => setMobileMenuAnchor(null)}
            to="/admin/products"
          >
            Gérer les produits
          </MenuItem>
        )}
        {canViewOrders && (
          <MenuItem
            component={RouterLink}
            onClick={() => setMobileMenuAnchor(null)}
            to="/admin/orders"
          >
            Gérer les commandes
          </MenuItem>
        )}
        {canAdminister && (
          <MenuItem
            component={RouterLink}
            onClick={() => setMobileMenuAnchor(null)}
            to="/admin/restaurants"
          >
            Gérer les restaurants
          </MenuItem>
        )}
        {canAdminister && (
          <MenuItem
            component={RouterLink}
            onClick={() => setMobileMenuAnchor(null)}
            to="/admin/users"
          >
            Gérer les utilisateurs
          </MenuItem>
        )}
        {user ? (
          <MenuItem
            onClick={() => {
              setMobileMenuAnchor(null)
              void dispatch(signOut())
            }}
          >
            Déconnexion
          </MenuItem>
        ) : (
          <>
            <MenuItem
              component={RouterLink}
              onClick={() => setMobileMenuAnchor(null)}
              to="/login"
            >
              Connexion
            </MenuItem>
            <MenuItem
              component={RouterLink}
              onClick={() => setMobileMenuAnchor(null)}
              to="/register"
            >
              Créer un compte
            </MenuItem>
          </>
        )}
      </Menu>
      {restaurantError && (
        <Container maxWidth="lg" sx={{ pb: 1.5 }}>
          <Alert severity="error">{restaurantError}</Alert>
        </Container>
      )}
    </AppBar>
  )
}
