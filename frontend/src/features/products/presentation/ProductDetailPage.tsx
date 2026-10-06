import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import AddShoppingCartRounded from '@mui/icons-material/AddShoppingCartRounded'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { addCartItem } from '../../cart/application/cartSlice'
import { getApiErrorMessage } from '../../../shared/api/client'
import type { Product } from '../../admin/products/domain/product'
import { getCatalogProduct } from '../infrastructure/productCatalogApi'

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function ProductDetailPage() {
  const dispatch = useAppDispatch()
  const { id: productIdParam } = useParams()
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurantsStatus = useAppSelector((state) => state.restaurants.status)
  const [loadedResult, setLoadedResult] = useState<{
    requestId: string
    product: Product | null
    error: string | null
  } | null>(null)
  const [addedProductId, setAddedProductId] = useState<number | null>(null)
  const productId = Number(productIdParam)
  const validProductId = Number.isSafeInteger(productId) && productId > 0
  const loading = validProductId && loadedResult?.requestId !== productIdParam
  const product =
    loadedResult && loadedResult.requestId === productIdParam
      ? loadedResult.product
      : null
  const error =
    loadedResult && loadedResult.requestId === productIdParam
      ? loadedResult.error
      : null

  useEffect(() => {
    if (!validProductId || !productIdParam) return

    let active = true
    void getCatalogProduct(productId)
      .then((loadedProduct) => {
        if (active) {
          setLoadedResult({
            requestId: productIdParam,
            product: loadedProduct,
            error: null,
          })
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadedResult({
            requestId: productIdParam,
            product: null,
            error: getApiErrorMessage(cause),
          })
        }
      })

    return () => {
      active = false
    }
  }, [productId, productIdParam, validProductId])

  const belongsToActiveRestaurant =
    product !== null && product.restaurant_id === activeRestaurant?.id
  const canAdd =
    belongsToActiveRestaurant &&
    product?.is_available === true &&
    activeRestaurant?.is_open === true

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: { xs: 4, md: 7 } }}>
      <Button component={RouterLink} sx={{ mb: 2 }} to="/produits" variant="text">
        Retour au catalogue
      </Button>

      {loading || restaurantsStatus === 'loading' ? (
        <Box sx={{ display: 'grid', minHeight: 320, placeItems: 'center' }}>
          <CircularProgress aria-label="Chargement du produit" />
        </Box>
      ) : !validProductId ? (
        <Alert severity="error">Identifiant de produit invalide.</Alert>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !activeRestaurant ? (
        <Alert severity="info">
          Sélectionnez un restaurant avant de consulter sa carte.
        </Alert>
      ) : !product ? (
        <Alert severity="error">Produit introuvable.</Alert>
      ) : !belongsToActiveRestaurant ? (
        <Alert severity="warning">
          Ce produit ne fait pas partie de la carte de {activeRestaurant.name}.
          Sélectionnez son restaurant puis ouvrez à nouveau sa fiche depuis le catalogue.
        </Alert>
      ) : (
        <Card>
          {product.image ? (
            <CardMedia
              alt={product.name}
              component="img"
              image={product.image}
              sx={{ height: { xs: 240, sm: 360 }, objectFit: 'cover' }}
            />
          ) : (
            <Box
              aria-label="Image non disponible"
              role="img"
              sx={{
                alignItems: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'flex',
                height: { xs: 240, sm: 360 },
                justifyContent: 'center',
                typography: 'h2',
              }}
            >
              Ytasty
            </Box>
          )}
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack
              sx={{
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box>
                <Typography color="secondary.main" variant="overline">
                  {product.category} · {activeRestaurant.name}
                </Typography>
                <Typography component="h1" sx={{ mt: 0.5 }} variant="h2">
                  {product.name}
                </Typography>
              </Box>
              <Chip
                color={product.is_available ? 'success' : 'default'}
                label={product.is_available ? 'Disponible' : 'Indisponible'}
              />
            </Stack>

            <Typography sx={{ mt: 2 }} variant="body1">
              {product.description || 'Aucune description disponible.'}
            </Typography>
            {product.ingredients.length > 0 && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Ingrédients : {product.ingredients.join(', ')}
              </Typography>
            )}

            {!activeRestaurant.is_open && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                {activeRestaurant.name} est fermé. La commande est indisponible.
              </Alert>
            )}
            {!product.is_available && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Ce produit ne peut pas être ajouté au panier pour le moment.
              </Alert>
            )}

            <Stack
              sx={{
                alignItems: { xs: 'stretch', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                gap: 2,
                mt: 4,
              }}
            >
              <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="h4">
                {currency.format(product.price)}
              </Typography>
              <Button
                disabled={!canAdd}
                onClick={() => {
                  if (!activeRestaurant) return
                  dispatch(
                    addCartItem({
                      restaurantId: activeRestaurant.id,
                      restaurantOpen: activeRestaurant.is_open,
                      item: {
                        productId: product.id,
                        name: product.name,
                        image: product.image,
                        unitPrice: product.price,
                        quantity: 1,
                        isAvailable: product.is_available,
                      },
                    }),
                  )
                  setAddedProductId(product.id)
                }}
                startIcon={<AddShoppingCartRounded />}
                variant="contained"
              >
                {!activeRestaurant.is_open
                  ? 'Restaurant fermé'
                  : product.is_available
                    ? 'Ajouter au panier'
                    : 'Indisponible'}
              </Button>
            </Stack>
            {addedProductId === product.id && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Produit ajouté au panier.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
