import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Step,
  StepLabel,
  Stepper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../shared/api/client'
import type { Order, OrderStatus } from '../domain/order'
import { getOrder } from '../infrastructure/orderApi'
import { createOrderStatusSocket } from '../infrastructure/orderStatusSocket'
import { getCatalogProducts } from '../../products/infrastructure/productCatalogApi'
import type { Product } from '../../admin/products/domain/product'

const orderedStatuses: OrderStatus[] = [
  'pending',
  'validated',
  'preparing',
  'ready',
  'collected',
]

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'validated' ||
    value === 'preparing' ||
    value === 'ready' ||
    value === 'collected' ||
    value === 'cancelled'
  )
}

function isOrderStatusUpdate(
  payload: unknown,
  expectedOrderNumber: string,
): payload is { order_number: string; status: OrderStatus } {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('order_number' in payload) ||
    !('status' in payload)
  ) {
    return false
  }

  return (
    payload.order_number === expectedOrderNumber && isOrderStatus(payload.status)
  )
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  validated: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  collected: 'Récupérée',
  cancelled: 'Annulée',
}

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function OrderTrackingPage() {
  const theme = useTheme()
  const compactStepper = useMediaQuery(theme.breakpoints.down('sm'))
  const { order_number: orderNumber } = useParams()
  const [orderState, setOrderState] = useState<{
    orderNumber: string
    order: Order
  } | null>(null)
  const [productNames, setProductNames] = useState<Record<number, string>>({})
  const [productLookupError, setProductLookupError] = useState<string | null>(
    null,
  )
  const [loadError, setLoadError] = useState<{
    orderNumber: string
    message: string
  } | null>(null)
  const realtimeRevision = useRef(0)
  const latestRealtimeStatus = useRef<OrderStatus | null>(null)
  const order =
    orderNumber !== undefined && orderState?.orderNumber === orderNumber
      ? orderState.order
      : null
  const error = orderNumber
    ? loadError?.orderNumber === orderNumber
      ? loadError.message
      : null
    : 'Le numéro de commande est manquant.'
  const loading = order === null && error === null
  const trackingRestaurantId = order?.restaurant_id

  useEffect(() => {
    let active = true
    let socket: ReturnType<typeof createOrderStatusSocket> | null = null
    realtimeRevision.current = 0
    latestRealtimeStatus.current = null

    const refresh = async () => {
      if (!orderNumber) return
      const revisionAtRequestStart = realtimeRevision.current
      try {
        const result = await getOrder(orderNumber)
        if (active) {
          if (revisionAtRequestStart === realtimeRevision.current) {
            setOrderState({ orderNumber, order: result })
          } else {
            setOrderState((currentState) => {
              const currentOrder =
                currentState?.orderNumber === orderNumber
                  ? currentState.order
                  : null
              return {
                orderNumber,
                order: {
                  ...result,
                  status:
                    currentOrder?.order_number === orderNumber
                      ? currentOrder.status
                      : (latestRealtimeStatus.current ?? result.status),
                },
              }
            })
          }
          setLoadError(null)
        }
      } catch (requestError) {
        if (active) {
          setLoadError({
            orderNumber,
            message: getApiErrorMessage(requestError),
          })
        }
      }
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), 10_000)

    if (orderNumber) {
      socket = createOrderStatusSocket()
      const joinTrackedOrder = () => {
        socket?.emit('join_order_tracking', { order_number: orderNumber })
      }
      const applyRealtimeStatus = (payload: unknown) => {
        if (!isOrderStatusUpdate(payload, orderNumber)) return
        if (latestRealtimeStatus.current === payload.status) return

        latestRealtimeStatus.current = payload.status
        realtimeRevision.current += 1
        setOrderState((currentState) => {
          const currentOrder =
            currentState?.orderNumber === orderNumber
              ? currentState.order
              : null
          if (
            currentOrder === null ||
            currentOrder.order_number !== payload.order_number ||
            currentOrder.status === payload.status
          ) {
            return currentState
          }
          return {
            orderNumber,
            order: { ...currentOrder, status: payload.status },
          }
        })
        setLoadError(null)
      }

      socket.on('connect', joinTrackedOrder)
      socket.on('order_status_updated', applyRealtimeStatus)
      socket.connect()
    }

    return () => {
      active = false
      window.clearInterval(interval)
      if (socket) {
        socket.off('connect')
        socket.off('order_status_updated')
        socket.disconnect()
      }
    }
  }, [orderNumber])

  useEffect(() => {
    if (trackingRestaurantId === undefined) return
    let active = true
    void getCatalogProducts({ restaurant_id: trackingRestaurantId })
      .then((products: Product[]) => {
        if (active) {
          setProductNames(
            Object.fromEntries(
              products.map((product) => [product.id, product.name]),
            ),
          )
          setProductLookupError(null)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setProductNames({})
          setProductLookupError(getApiErrorMessage(requestError))
        }
      })
    return () => {
      active = false
    }
  }, [trackingRestaurantId])

  if (loading && !order) {
    return (
      <Box sx={{ display: 'grid', minHeight: 360, placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!order) {
    return (
      <Box sx={{ maxWidth: 680, mx: 'auto', py: 6 }}>
        <Alert severity="error">{error ?? 'Commande introuvable.'}</Alert>
      </Box>
    )
  }

  const activeStep = orderedStatuses.indexOf(order.status)

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto', py: { xs: 4, md: 7 } }}>
      <Typography color="secondary.main" sx={{ fontWeight: 700 }} variant="overline">
        Merci pour votre commande
      </Typography>
      <Typography component="h1" variant="h2">
        Suivi de commande
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Référence : {order.order_number}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Le suivi n’a pas pu être actualisé. Nouvelle tentative automatique.
        </Alert>
      )}
      {productLookupError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Les noms des produits ne sont pas disponibles : {productLookupError}
        </Alert>
      )}
      {order.status === 'cancelled' ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Cette commande a été annulée.
        </Alert>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack
              sx={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Typography component="h2" variant="h5">
                État de la commande
              </Typography>
              <Chip
                color={order.status === 'collected' ? 'success' : 'primary'}
                label={statusLabels[order.status]}
              />
            </Stack>
            <Stepper
              activeStep={Math.max(activeStep, 0)}
              alternativeLabel={!compactStepper}
              orientation={compactStepper ? 'vertical' : 'horizontal'}
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                },
              }}
            >
              {orderedStatuses.map((status) => (
                <Step key={status}>
                  <StepLabel>{statusLabels[status]}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography component="h2" sx={{ mb: 2 }} variant="h5">
            Récapitulatif
          </Typography>
          <Stack spacing={1.5}>
            {order.items.map((item, index) => (
              <Stack
                key={`${item.product_id}-${index}`}
                sx={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Typography>
                  {productNames[item.product_id] ?? `Produit #${item.product_id}`} ×{' '}
                  {item.quantity}
                </Typography>
                <Typography>
                  {currency.format(item.unit_price * item.quantity)}
                </Typography>
              </Stack>
            ))}
            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderTop: 1,
                borderColor: 'divider',
                pt: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800 }}>
                {currency.format(order.total_price)}
              </Typography>
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Retrait :{' '}
              {order.pickup_mode === 'onsite' ? 'sur place' : 'à emporter'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Client : {order.customer.name}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
