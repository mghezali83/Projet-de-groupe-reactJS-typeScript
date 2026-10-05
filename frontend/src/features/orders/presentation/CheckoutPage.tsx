import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import TakeoutDiningOutlined from '@mui/icons-material/TakeoutDiningOutlined'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { getApiErrorMessage } from '../../../shared/api/client'
import { clearCart, selectCartTotal } from '../../cart/application/cartSlice'
import { createOrder } from '../infrastructure/orderApi'
import type { OrderCreateInput, PickupMode } from '../domain/order'

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function CheckoutPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, restaurantId } = useAppSelector((state) => state.cart)
  const restaurants = useAppSelector((state) => state.restaurants.items)
  const restaurant = restaurants.find((item) => item.id === restaurantId)
  const total = useAppSelector(selectCartTotal)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pickupMode, setPickupMode] = useState<PickupMode>('takeaway')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!restaurant || restaurant.id !== restaurantId || !restaurant.is_open) {
      setError('Le restaurant sélectionné est fermé ou n’est plus disponible.')
      return
    }
    if (items.length === 0) {
      setError('Ajoutez au moins un produit avant de valider la commande.')
      return
    }

    const payload: OrderCreateInput = {
      restaurant_id: restaurant.id,
      items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      pickup_mode: pickupMode,
      customer: { name: name.trim(), email: email.trim() },
    }

    setSubmitting(true)
    try {
      const order = await createOrder(payload)
      dispatch(clearCart())
      navigate(`/suivi/${encodeURIComponent(order.order_number)}`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', py: { xs: 4, md: 7 } }}>
      <Typography color="secondary.main" sx={{ fontWeight: 700 }} variant="overline">
        Dernière étape
      </Typography>
      <Typography component="h1" variant="h2">
        Finaliser la commande
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {restaurant?.name ?? 'Aucun restaurant sélectionné'}
      </Typography>

      {(!restaurant || !restaurant.is_open) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {restaurant
            ? 'Ce restaurant est fermé. La commande ne peut pas être envoyée.'
            : 'Le panier est vide ou son restaurant n’est plus sélectionné.'}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit} spacing={3}>
            <Box>
              <Typography component="h2" sx={{ mb: 2 }} variant="h5">
                Vos coordonnées
              </Typography>
              <Stack
                sx={{
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <TextField
                  autoComplete="name"
                  fullWidth
                  label="Nom"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
                <TextField
                  autoComplete="email"
                  fullWidth
                  label="Adresse e-mail"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </Stack>
            </Box>

            <FormControl>
              <Typography component="h2" sx={{ mb: 1 }} variant="h5">
                Mode de retrait
              </Typography>
              <RadioGroup
                aria-label="Mode de retrait"
                onChange={(event) =>
                  setPickupMode(
                    event.target.value === 'onsite' ? 'onsite' : 'takeaway',
                  )
                }
                value={pickupMode}
              >
                <Stack
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                  }}
                >
                  <Card
                    sx={{
                      flex: 1,
                      borderColor:
                        pickupMode === 'onsite' ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardActionArea
                      onClick={() => setPickupMode('onsite')}
                      sx={{ height: '100%' }}
                    >
                      <CardContent>
                        <FormControlLabel
                          control={<Radio />}
                          label={
                            <Stack
                              sx={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                gap: 1,
                              }}
                            >
                              <StorefrontOutlined />
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  Sur place
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                >
                                  À déguster au restaurant
                                </Typography>
                              </Box>
                            </Stack>
                          }
                          value="onsite"
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  <Card
                    sx={{
                      flex: 1,
                      borderColor:
                        pickupMode === 'takeaway'
                          ? 'primary.main'
                          : 'divider',
                    }}
                  >
                    <CardActionArea
                      onClick={() => setPickupMode('takeaway')}
                      sx={{ height: '100%' }}
                    >
                      <CardContent>
                        <FormControlLabel
                          control={<Radio />}
                          label={
                            <Stack
                              sx={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                gap: 1,
                              }}
                            >
                              <TakeoutDiningOutlined />
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>
                                  À emporter
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                >
                                  Prête à récupérer
                                </Typography>
                              </Box>
                            </Stack>
                          }
                          value="takeaway"
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Stack>
              </RadioGroup>
            </FormControl>

            <Stack spacing={1}>
              <Typography component="h2" variant="h5">
                Récapitulatif
              </Typography>
              {items.map((item) => (
                <Stack
                  key={item.productId}
                  sx={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography>
                    {item.quantity} × {item.name}
                  </Typography>
                  <Typography>
                    {currency.format(item.unitPrice * item.quantity)}
                  </Typography>
                </Stack>
              ))}
              <Stack
                sx={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderTop: 1,
                  borderColor: 'divider',
                  pt: 1,
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {currency.format(total)}
                </Typography>
              </Stack>
            </Stack>

            <Button
              disabled={
                submitting ||
                items.length === 0 ||
                !restaurant?.is_open ||
                restaurant.id !== restaurantId
              }
              size="large"
              type="submit"
              variant="contained"
            >
              {submitting ? (
                <CircularProgress color="inherit" size={22} />
              ) : (
                'Confirmer et commander'
              )}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
