import { useEffect, useState } from 'react'
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
import { getCatalogProducts } from '../../products/infrastructure/productCatalogApi'
import type { Product } from '../../admin/products/domain/product'

const orderedStatuses: OrderStatus[] = [
  'pending',
  'validated',
  'preparing',
  'ready',
  'collected',
]

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
  const [order, setOrder] = useState<Order | null>(null)
  const [productNames, setProductNames] = useState<Record<number, string>>({})
  const [productLookupError, setProductLookupError] = useState<string | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const trackingRestaurantId = order?.restaurant_id

  useEffect(() => {
    let active = true
    const refresh = async () => {
      if (!orderNumber) {
        if (active) {
          setError('Le numéro de commande est manquant.')
          setLoading(false)
        }
        return
      }
      try {
        const result = await getOrder(orderNumber)
        if (active) {
          setOrder(result)
          setError(null)
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), 10_000)
    return () => {
      active = false
      window.clearInterval(interval)
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
