import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import RemoveRounded from '@mui/icons-material/RemoveRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import { Link as RouterLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  decrementCartItem,
  incrementCartItem,
  removeCartItem,
  selectCartTotal,
} from '../application/cartSlice'

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const dispatch = useAppDispatch()
  const { items, restaurantId } = useAppSelector((state) => state.cart)
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurants = useAppSelector((state) => state.restaurants.items)
  const restaurant = restaurants.find((item) => item.id === restaurantId)
  const total = useAppSelector(selectCartTotal)
  const cartMatchesActiveRestaurant =
    restaurantId !== null && activeRestaurant?.id === restaurantId
  const canCheckout =
    items.length > 0 &&
    cartMatchesActiveRestaurant &&
    activeRestaurant?.is_open === true

  return (
    <Drawer anchor="right" onClose={onClose} open={open}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: { xs: '100vw', sm: 420 },
        }}
      >
        <Stack
          sx={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            p: 2.5,
          }}
        >
          <Box>
            <Typography component="h2" variant="h5">
              Votre panier
            </Typography>
            {restaurant && (
              <Typography color="text.secondary" variant="body2">
                {restaurant.name}
              </Typography>
            )}
          </Box>
          <IconButton aria-label="Fermer le panier" onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {items.length === 0 ? (
            <Alert severity="info">Votre panier est encore vide.</Alert>
          ) : (
            <Stack spacing={2}>
              {!cartMatchesActiveRestaurant && (
                <Alert severity="warning">
                  Ce panier appartient à {restaurant?.name ?? 'un autre restaurant'}.
                  Sélectionnez-le dans l’en-tête pour poursuivre.
                </Alert>
              )}
              {cartMatchesActiveRestaurant && !activeRestaurant?.is_open && (
                <Alert severity="warning">
                  Le restaurant est fermé. La commande ne peut pas être validée.
                </Alert>
              )}
              {items.map((item) => (
                <Stack
                  key={item.productId}
                  sx={{ alignItems: 'center', flexDirection: 'row', gap: 1.5 }}
                >
                  <Avatar
                    alt=""
                    src={item.image ?? undefined}
                    variant="rounded"
                  >
                    {item.name.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {currency.format(item.unitPrice * item.quantity)}
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label={`Diminuer ${item.name}`}
                    onClick={() => dispatch(decrementCartItem(item.productId))}
                    size="small"
                  >
                    <RemoveRounded fontSize="small" />
                  </IconButton>
                  <Typography aria-label={`Quantité ${item.name}`}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    aria-label={`Ajouter ${item.name}`}
                    disabled={
                      !cartMatchesActiveRestaurant ||
                      !activeRestaurant?.is_open ||
                      !item.isAvailable
                    }
                    onClick={() =>
                      dispatch(
                        incrementCartItem({
                          productId: item.productId,
                          restaurantId: activeRestaurant?.id ?? null,
                          restaurantOpen: activeRestaurant?.is_open === true,
                        }),
                      )
                    }
                    size="small"
                  >
                    <AddRounded fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label={`Supprimer ${item.name}`}
                    color="error"
                    onClick={() => dispatch(removeCartItem(item.productId))}
                    size="small"
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>

        <Divider />
        <Box sx={{ p: 2.5 }}>
          <Stack
            sx={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 800 }}>
              {currency.format(total)}
            </Typography>
          </Stack>
          <Button
            component={RouterLink}
            disabled={!canCheckout}
            fullWidth
            onClick={onClose}
            to="/checkout"
            variant="contained"
          >
            Valider ma commande
          </Button>
          <Button
            component={RouterLink}
            fullWidth
            onClick={onClose}
            sx={{ mt: 1 }}
            to="/produits"
            variant="text"
          >
            Continuer mes achats
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
