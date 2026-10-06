import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import { useAppSelector } from '../../../../app/hooks'
import { getApiErrorMessage } from '../../../../shared/api/client'
import type { Order, OrderStatus } from '../../../orders/domain/order'
import type { Product } from '../../products/domain/product'
import { getCatalogProducts } from '../../../products/infrastructure/productCatalogApi'
import {
  cancelOrder,
  getRestaurantOrders,
  updateOrderStatus,
} from '../infrastructure/orderAdminApi'

type StatusFilter = 'all' | OrderStatus
type OrderChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning'

const statusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  validated: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  collected: 'Récupérée',
  cancelled: 'Annulée',
}

const nextStatuses: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'validated',
  validated: 'preparing',
  preparing: 'ready',
  ready: 'collected',
}

const nextStatusLabels: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmer',
  validated: 'Commencer la préparation',
  preparing: 'Marquer prête',
  ready: 'Marquer récupérée',
}

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

const overduePendingThresholdMs = 10 * 60 * 1000

function getStatusColor(status: OrderStatus): OrderChipColor {
  if (status === 'cancelled') return 'error'
  if (status === 'collected') return 'success'
  if (status === 'ready') return 'warning'
  if (status === 'pending') return 'default'
  return 'primary'
}

export function OrderManagementPage() {
  const user = useAppSelector((state) => state.auth.user)
  const restaurants = useAppSelector((state) => state.restaurants.items)
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurantLoadStatus = useAppSelector(
    (state) => state.restaurants.status,
  )
  const [restaurantSelection, setRestaurantSelection] = useState<number | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loadedData, setLoadedData] = useState<{
    queryKey: string
    orders: Order[]
    productNames: Record<number, string>
  } | null>(null)
  const [loadResult, setLoadResult] = useState<{
    requestKey: string
    queryKey: string
    error: string | null
    productError: string | null
  } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  const availableRestaurants = useMemo(
    () =>
      user?.role === 'staff'
        ? restaurants.filter((restaurant) => restaurant.id === user.restaurant_id)
        : restaurants,
    [restaurants, user],
  )
  const selectedRestaurantId = useMemo(() => {
    const selectedRestaurant = availableRestaurants.find(
      (restaurant) => restaurant.id === restaurantSelection,
    )
    if (selectedRestaurant) return selectedRestaurant.id
    const preferredId =
      user?.role === 'staff'
        ? user.restaurant_id
        : activeRestaurant?.id ?? availableRestaurants[0]?.id
    return availableRestaurants.some(
      (restaurant) => restaurant.id === preferredId,
    )
      ? preferredId
      : (availableRestaurants[0]?.id ?? null)
  }, [activeRestaurant?.id, availableRestaurants, restaurantSelection, user])
  const queryKey = JSON.stringify([selectedRestaurantId])
  const requestKey = JSON.stringify([queryKey, refreshVersion])
  const loading =
    selectedRestaurantId !== null && loadResult?.queryKey !== queryKey
  const error =
    loadResult?.requestKey === requestKey ? loadResult.error : null
  const productError =
    loadResult?.requestKey === requestKey ? loadResult.productError : null
  const refreshing =
    selectedRestaurantId !== null && loadResult?.requestKey !== requestKey
  const orders = loadedData?.queryKey === queryKey ? loadedData.orders : []
  const visibleOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((order) => order.status === statusFilter)
  const productNames =
    loadedData?.queryKey === queryKey ? loadedData.productNames : {}
  const overduePendingOrders = orders.filter(
    (order) =>
      order.status === 'pending' &&
      now - Date.parse(order.created_at) >= overduePendingThresholdMs,
  )

  useEffect(() => {
    if (selectedRestaurantId === null) return

    let active = true

    void Promise.allSettled([
      getRestaurantOrders(selectedRestaurantId),
      getCatalogProducts({ restaurant_id: selectedRestaurantId }),
      ])
      .then(([ordersResult, productsResult]) => {
        if (!active) return
        setLoadedData((previous) => {
          const previousForQuery = previous?.queryKey === queryKey ? previous : null
          return {
            queryKey,
            orders:
              ordersResult.status === 'fulfilled'
                ? ordersResult.value
                : (previousForQuery?.orders ?? []),
            productNames:
              productsResult.status === 'fulfilled'
                ? Object.fromEntries(
                    productsResult.value.map((product: Product) => [
                      product.id,
                      product.name,
                    ]),
                  )
                : (previousForQuery?.productNames ?? {}),
          }
        })
        setLoadResult({
          requestKey,
          queryKey,
          error:
            ordersResult.status === 'rejected'
              ? getApiErrorMessage(ordersResult.reason)
              : null,
          productError:
            productsResult.status === 'rejected'
              ? getApiErrorMessage(productsResult.reason)
              : null,
        })
      })

    return () => {
      active = false
    }
  }, [queryKey, requestKey, selectedRestaurantId])

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        setRefreshVersion((version) => version + 1)
        setNow(Date.now())
      },
      10_000,
    )
    return () => window.clearInterval(interval)
  }, [])

  const canManageOrders = user?.role === 'admin' || user?.role === 'staff'

  async function runOrderAction(
    orderNumber: string,
    action: () => Promise<Order>,
    successMessage: string,
  ) {
    setBusyOrder(orderNumber)
    setActionError(null)
    setNotice(null)
    try {
      await action()
      setNotice(successMessage)
      setRefreshVersion((version) => version + 1)
    } catch (cause) {
      setActionError(getApiErrorMessage(cause))
    } finally {
      setBusyOrder(null)
    }
  }

  const selectedRestaurant = restaurants.find(
    (restaurant) => restaurant.id === selectedRestaurantId,
  )

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
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
            Commandes
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Suivez les commandes et faites avancer leur préparation.
          </Typography>
        </Box>
        <Button
          onClick={() => setRefreshVersion((version) => version + 1)}
          startIcon={<RefreshRounded />}
          variant="outlined"
        >
          Actualiser
        </Button>
      </Stack>

      <Stack
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl fullWidth disabled={availableRestaurants.length === 0}>
          <InputLabel id="orders-restaurant-label">Restaurant</InputLabel>
          <Select
            label="Restaurant"
            labelId="orders-restaurant-label"
            onChange={(event) => setRestaurantSelection(Number(event.target.value))}
            value={selectedRestaurantId === null ? '' : String(selectedRestaurantId)}
          >
            {availableRestaurants.map((restaurant) => (
              <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                {restaurant.name} — {restaurant.city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="orders-status-label">Statut</InputLabel>
          <Select
            label="Statut"
            labelId="orders-status-label"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <MenuItem value="all">Tous les statuts</MenuItem>
            {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
              <MenuItem key={status} value={status}>
                {statusLabels[status]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {user?.role === 'staff' && availableRestaurants.length === 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Aucun restaurant n’est associé à ce compte staff.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      {productError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Les noms des produits n’ont pas pu être chargés ; leurs identifiants sont affichés.
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {overduePendingOrders.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Commandes en attente depuis plus de 10 minutes</AlertTitle>
          {overduePendingOrders.length} commande
          {overduePendingOrders.length > 1 ? 's' : ''} nécessite
          {overduePendingOrders.length > 1 ? 'nt' : ''} une attention :
          <Stack component="ul" spacing={0.25} sx={{ mb: 0, mt: 0.75, pl: 2.5 }}>
            {overduePendingOrders.map((order) => (
              <li key={order.order_number}>
                <Typography component="span" variant="body2">
                  {order.order_number} — en attente depuis{' '}
                  {Math.floor((now - Date.parse(order.created_at)) / 60_000)} min
                </Typography>
              </li>
            ))}
          </Stack>
        </Alert>
      )}

      {restaurantLoadStatus === 'failed' ? (
        <Alert severity="error">Impossible de charger les restaurants.</Alert>
      ) : restaurantLoadStatus === 'loading' ? (
        <Box sx={{ display: 'grid', minHeight: 240, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement des restaurants" />
        </Box>
      ) : selectedRestaurantId === null ? (
        <Alert severity="info">Aucun restaurant disponible pour afficher les commandes.</Alert>
      ) : loading ? (
        <Box sx={{ display: 'grid', minHeight: 240, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement des commandes" />
        </Box>
      ) : visibleOrders.length === 0 ? (
        <Alert severity="info">
          {selectedRestaurant
            ? `Aucune commande ${statusFilter === 'all' ? '' : `au statut « ${statusLabels[statusFilter]} » `}pour ${selectedRestaurant.name}.`
            : 'Aucune commande à afficher.'}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {visibleOrders.map((order) => {
            const nextStatus = nextStatuses[order.status]
            const isBusy = busyOrder === order.order_number
            const actionDisabled = isBusy || refreshing
            const canCancel =
              canManageOrders &&
              order.status !== 'collected' &&
              order.status !== 'cancelled'

            return (
              <Card key={order.order_number}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Stack
                    sx={{
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography color="text.secondary" variant="body2">
                        Commande · {new Date(order.created_at).toLocaleString('fr-FR')}
                      </Typography>
                      <Typography
                        component="h2"
                        sx={{ overflowWrap: 'anywhere', mt: 0.5, fontWeight: 750 }}
                        variant="h6"
                      >
                        {order.order_number}
                      </Typography>
                    </Box>
                    <Chip
                      color={getStatusColor(order.status)}
                      label={statusLabels[order.status]}
                    />
                  </Stack>

                  <Stack
                    sx={{
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: { xs: 2, md: 4 },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>
                        Produits
                      </Typography>
                      <Stack spacing={0.5}>
                        {order.items.map((item, index) => (
                          <Typography key={`${item.product_id}-${index}`} variant="body2">
                            {item.quantity} ×{' '}
                            {productNames[item.product_id] ?? `Produit #${item.product_id}`}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                    <Box sx={{ minWidth: { md: 220 } }}>
                      <Typography>
                        Client : <strong>{order.customer.name}</strong>
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {order.pickup_mode === 'onsite' ? 'Sur place' : 'À emporter'}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, mt: 1 }}>
                        {currency.format(order.total_price)}
                      </Typography>
                    </Box>
                  </Stack>

                  {canManageOrders && (nextStatus || canCancel) && (
                    <Stack
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        justifyContent: 'flex-end',
                        mt: 2.5,
                      }}
                    >
                      {canCancel && (
                        <Button
                          color="error"
                          disabled={actionDisabled}
                          onClick={() => {
                            if (window.confirm(`Annuler la commande ${order.order_number} ?`)) {
                              void runOrderAction(
                                order.order_number,
                                () => cancelOrder(order.order_number),
                                'La commande a été annulée.',
                              )
                            }
                          }}
                          variant="outlined"
                        >
                          Annuler la commande
                        </Button>
                      )}
                      {nextStatus && (
                        <Button
                          disabled={actionDisabled}
                          onClick={() =>
                            void runOrderAction(
                              order.order_number,
                              () => updateOrderStatus(order.order_number, nextStatus),
                              `Statut mis à jour : ${statusLabels[nextStatus]}.`,
                            )
                          }
                          variant="contained"
                        >
                          {isBusy ? 'Mise à jour…' : nextStatusLabels[order.status]}
                        </Button>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
