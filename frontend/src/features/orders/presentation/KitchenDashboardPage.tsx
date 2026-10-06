import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import { Link as RouterLink } from 'react-router-dom'
import { useAppSelector } from '../../../app/hooks'
import {
  updateProductAvailability,
} from '../../admin/products/infrastructure/productApi'
import type { Product } from '../../admin/products/domain/product'
import type { Order, OrderStatus } from '../domain/order'
import { cancelOrder, getRestaurantOrders, updateOrderStatus } from '../infrastructure/orderApi'
import { getApiErrorMessage } from '../../../shared/api/client'
import { getCatalogProducts } from '../../products/infrastructure/productCatalogApi'

const kitchenStatuses: OrderStatus[] = [
  'pending',
  'validated',
  'preparing',
  'ready',
]
const statusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  validated: 'Acceptée',
  preparing: 'En préparation',
  ready: 'Prête',
  collected: 'Récupérée',
  cancelled: 'Annulée',
}
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'validated',
  validated: 'preparing',
  preparing: 'ready',
  ready: 'collected',
}
const staleAfterMs = 15 * 60 * 1000

function orderAge(createdAt: string, now: number): number {
  const created = Date.parse(createdAt)
  return Number.isNaN(created) ? 0 : Math.max(0, now - created)
}

function formatAge(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000)
  return minutes < 1 ? 'À l’instant' : `Depuis ${minutes} min`
}

export function KitchenDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const restaurantId = user?.restaurant_id
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)
  const [busyProduct, setBusyProduct] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [now, setNow] = useState(0)

  const refresh = useCallback(async () => {
    if (restaurantId === null || restaurantId === undefined) return
    try {
      const [nextOrders, nextProducts] = await Promise.all([
        getRestaurantOrders(restaurantId),
        getCatalogProducts({ restaurant_id: restaurantId }),
      ])
      setOrders(nextOrders)
      setProducts(nextProducts)
      setError(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(initialLoad)
  }, [refresh])

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      window.clearTimeout(initialUpdate)
      window.clearInterval(timer)
    }
  }, [])

  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  )
  const visibleStatuses = filter ? [filter] : kitchenStatuses
  const activeOrders = orders.filter((order) => kitchenStatuses.includes(order.status))

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusyOrder(order.order_number)
    try {
      const updated = await updateOrderStatus(order.order_number, status)
      setOrders((current) =>
        current.map((item) =>
          item.order_number === updated.order_number ? updated : item,
        ),
      )
      setNotice({ message: `Commande ${statusLabels[status].toLowerCase()}.`, severity: 'success' })
    } catch (requestError) {
      setNotice({ message: getApiErrorMessage(requestError), severity: 'error' })
    } finally {
      setBusyOrder(null)
    }
  }

  async function handleCancel(order: Order) {
    if (!window.confirm(`Annuler la commande ${order.order_number} ?`)) return
    setBusyOrder(order.order_number)
    try {
      const updated = await cancelOrder(order.order_number)
      setOrders((current) =>
        current.map((item) =>
          item.order_number === updated.order_number ? updated : item,
        ),
      )
      setNotice({ message: 'Commande annulée.', severity: 'success' })
    } catch (requestError) {
      setNotice({ message: getApiErrorMessage(requestError), severity: 'error' })
    } finally {
      setBusyOrder(null)
    }
  }

  async function toggleAvailability(product: Product) {
    setBusyProduct(product.id)
    try {
      const updated = await updateProductAvailability(
        product.id,
        !product.is_available,
      )
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setNotice({
        message: `${updated.name} : ${updated.is_available ? 'disponible' : 'indisponible'}.`,
        severity: 'success',
      })
    } catch (requestError) {
      setNotice({ message: getApiErrorMessage(requestError), severity: 'error' })
    } finally {
      setBusyProduct(null)
    }
  }

  if (restaurantId === null || restaurantId === undefined) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error">
          Aucun restaurant n’est associé à ce compte. Contactez un administrateur.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 3, md: 6 } }}>
      <Stack
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography color="secondary.main" sx={{ fontWeight: 700 }} variant="overline">
            Espace équipe
          </Typography>
          <Typography component="h1" variant="h2">
            Cuisine
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Commandes et disponibilités de votre restaurant
          </Typography>
        </Box>
        <TextField
          label="Filtrer par statut"
          onChange={(event) => setFilter(event.target.value as OrderStatus | '')}
          select
          size="small"
          sx={{ minWidth: 190 }}
          value={filter}
        >
          <MenuItem value="">Toutes les commandes actives</MenuItem>
          {kitchenStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {statusLabels[status]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert
          action={<Button color="inherit" onClick={() => void refresh()}>Réessayer</Button>}
          severity="error"
          sx={{ mb: 2 }}
        >
          Impossible de charger les données de cuisine : {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography component="h2" sx={{ mb: 1.5 }} variant="h5">
          Disponibilité des produits
        </Typography>
        {loading ? (
          <Box sx={{ display: 'grid', minHeight: 80, placeItems: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : products.length === 0 ? (
          <Alert severity="info">Aucun produit n’est rattaché à ce restaurant.</Alert>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {products.map((product) => (
              <Stack
                key={product.id}
                direction="row"
                sx={{
                  alignItems: 'center',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  pl: 1.5,
                  pr: 0.5,
                }}
              >
                <Typography variant="body2">{product.name}</Typography>
                <Switch
                  checked={product.is_available}
                  disabled={busyProduct === product.id}
                  onChange={() => void toggleAvailability(product)}
                  size="small"
                  slotProps={{
                    input: { 'aria-label': `${product.name} disponible` },
                  }}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      <Typography component="h2" sx={{ mb: 1.5 }} variant="h5">
        Commandes en cours
      </Typography>
      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : activeOrders.length === 0 ? (
        <Alert severity="info">Aucune commande active pour le moment.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {visibleStatuses.map((status) => {
            const columnOrders = activeOrders
              .filter((order) => order.status === status)
              .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
            return (
              <Box key={status} sx={{ minWidth: 0 }}>
                <Stack
                  sx={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography component="h3" sx={{ fontWeight: 700 }} variant="subtitle1">
                    {statusLabels[status]}
                  </Typography>
                  <Chip label={columnOrders.length} size="small" />
                </Stack>
                <Stack spacing={1.5}>
                  {columnOrders.map((order) => {
                    const age = orderAge(order.created_at, now)
                    const stale = order.status === 'pending' && age >= staleAfterMs
                    const upcomingStatus = nextStatus[order.status]
                    return (
                      <Card
                        key={order.order_number}
                        sx={{
                          border: 1,
                          borderColor: stale ? 'error.main' : 'divider',
                        }}
                      >
                        <CardContent>
                          <Stack
                            sx={{
                              alignItems: 'flex-start',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontWeight: 800 }} variant="subtitle1">
                                #{order.order_number.slice(0, 8)}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                {order.customer.name}
                              </Typography>
                            </Box>
                            <Chip
                              color={stale ? 'error' : status === 'ready' ? 'success' : 'primary'}
                              icon={<AccessTimeRounded />}
                              label={formatAge(age)}
                              size="small"
                            />
                          </Stack>
                          {stale && (
                            <Alert severity="error" sx={{ mt: 1.5, py: 0 }}>
                              Commande en attente depuis plus de 15 minutes.
                            </Alert>
                          )}
                          <Stack spacing={0.5} sx={{ my: 1.5 }}>
                            {order.items.map((item, index) => (
                              <Typography key={`${item.product_id}-${index}`} variant="body2">
                                {item.quantity} × {productNames.get(item.product_id) ?? `Produit #${item.product_id}`}
                              </Typography>
                            ))}
                          </Stack>
                          <Typography color="text.secondary" variant="caption">
                            {order.pickup_mode === 'onsite' ? 'Sur place' : 'À emporter'}
                          </Typography>
                          <Stack spacing={1} sx={{ mt: 1.5 }}>
                            {upcomingStatus && (
                              <Button
                                disabled={busyOrder === order.order_number}
                                fullWidth
                                onClick={() => void changeStatus(order, upcomingStatus)}
                                size="small"
                                variant="contained"
                              >
                                {busyOrder === order.order_number ? (
                                  <CircularProgress color="inherit" size={18} />
                                ) : order.status === 'ready' ? (
                                  'Marquer récupérée'
                                ) : (
                                  `Passer : ${statusLabels[upcomingStatus]}`
                                )}
                              </Button>
                            )}
                            <Button
                              color="error"
                              disabled={busyOrder === order.order_number}
                              fullWidth
                              onClick={() => void handleCancel(order)}
                              size="small"
                              variant="text"
                            >
                              Annuler la commande
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {columnOrders.length === 0 && (
                    <Typography color="text.disabled" sx={{ py: 2, textAlign: 'center' }} variant="body2">
                      Aucune commande
                    </Typography>
                  )}
                </Stack>
              </Box>
            )
          })}
        </Box>
      )}
      <Button component={RouterLink} sx={{ mt: 3 }} to="/" variant="text">
        Retour à l’accueil
      </Button>
      <Snackbar
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        open={notice !== null}
      >
        <Alert
          onClose={() => setNotice(null)}
          severity={notice?.severity ?? 'success'}
          sx={{ width: '100%' }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
