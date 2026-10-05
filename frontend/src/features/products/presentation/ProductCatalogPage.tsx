import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddShoppingCartRounded from '@mui/icons-material/AddShoppingCartRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { addCartItem } from '../../cart/application/cartSlice'
import type { Product } from '../../admin/products/domain/product'
import { getApiErrorMessage } from '../../../shared/api/client'
import { getCatalogProducts } from '../infrastructure/productCatalogApi'

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function ProductCatalogPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeRestaurant = useAppSelector(
    (state) => state.restaurants.activeRestaurant,
  )
  const restaurantsStatus = useAppSelector(
    (state) => state.restaurants.status,
  )
  const [products, setProducts] = useState<Product[]>([])
  const [loadedRequest, setLoadedRequest] = useState<string | null>(null)
  const [catalogCategories, setCatalogCategories] = useState<{
    restaurantId: number
    items: string[]
  } | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [productLoadError, setProductLoadError] = useState<{
    requestKey: string
    message: string
  } | null>(null)
  const [categoryLoadError, setCategoryLoadError] = useState<{
    restaurantId: number
    message: string
  } | null>(null)
  const query = searchParams.get('q') ?? ''
  const normalizedQuery = query.trim()
  const [categorySelection, setCategorySelection] = useState<{
    restaurantId: number | null
    value: string
  }>({ restaurantId: null, value: '' })
  const [availableOnly, setAvailableOnly] = useState(false)
  const restaurantId = activeRestaurant?.id
  const category =
    categorySelection.restaurantId === restaurantId
      ? categorySelection.value
      : ''

  const requestKey = JSON.stringify([
    restaurantId,
    normalizedQuery,
    category,
    availableOnly,
    retryToken,
  ])
  const loading = loadedRequest !== requestKey
  const error =
    productLoadError && productLoadError.requestKey === requestKey
      ? productLoadError.message
      : null
  const categoryError =
    categoryLoadError && categoryLoadError.restaurantId === restaurantId
      ? categoryLoadError.message
      : null

  useEffect(() => {
    if (restaurantId === undefined) return

    let active = true
    void getCatalogProducts({ restaurant_id: restaurantId })
      .then((data) => {
        if (active) {
          setCategoryLoadError(null)
          setCatalogCategories({
            restaurantId,
            items: [...new Set(data.map((product) => product.category))].sort(
              (a, b) => a.localeCompare(b, 'fr'),
            ),
          })
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setCategoryLoadError({
            restaurantId,
            message: getApiErrorMessage(requestError),
          })
          setCatalogCategories({ restaurantId, items: [] })
        }
      })

    return () => {
      active = false
    }
  }, [restaurantId, retryToken])

  useEffect(() => {
    if (restaurantId === undefined) return

    let active = true
    const timer = window.setTimeout(() => {
      void getCatalogProducts({
        restaurant_id: restaurantId,
        ...(normalizedQuery ? { q: normalizedQuery } : {}),
        ...(category ? { category } : {}),
        ...(availableOnly ? { is_available: true } : {}),
      })
        .then((data) => {
          if (active) {
            setProducts(data)
            setProductLoadError(null)
            setLoadedRequest(requestKey)
          }
        })
        .catch((requestError: unknown) => {
          if (active) {
            setProductLoadError({
              requestKey,
              message: getApiErrorMessage(requestError),
            })
            setLoadedRequest(requestKey)
          }
        })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [
    availableOnly,
    category,
    normalizedQuery,
    requestKey,
    restaurantId,
  ])

  const categories =
    catalogCategories && catalogCategories.restaurantId === restaurantId
      ? catalogCategories.items
      : []

  if (restaurantsStatus === 'failed') {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error">
          Impossible de charger les restaurants. Revenez à l’accueil et
          réessayez.
        </Alert>
      </Box>
    )
  }

  if (restaurantsStatus === 'loading') {
    return (
      <Box sx={{ py: 7 }}>
        <Skeleton height={60} width="40%" />
        <Skeleton height={40} width="65%" />
      </Box>
    )
  }

  if (!activeRestaurant) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="info">
          Aucun établissement n’est sélectionné ou disponible.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 4, md: 7 } }}>
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
            {activeRestaurant.city}
          </Typography>
          <Typography component="h1" variant="h2">
            Notre carte
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {activeRestaurant.name}
          </Typography>
        </Box>
        <Chip
          color={activeRestaurant.is_open ? 'success' : 'default'}
          label={activeRestaurant.is_open ? 'Ouvert aux commandes' : 'Fermé'}
        />
      </Stack>

      {!activeRestaurant.is_open && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {activeRestaurant.name} est fermé. Vous pouvez consulter la carte,
          mais l’ajout au panier et la commande sont désactivés.
        </Alert>
      )}

      {categoryError && (
        <Alert
          action={
            <Button
              color="inherit"
              onClick={() => setRetryToken((value) => value + 1)}
              size="small"
            >
              Réessayer
            </Button>
          }
          severity="warning"
          sx={{ mb: 3 }}
        >
          Les catégories n’ont pas pu être chargées : {categoryError}
        </Alert>
      )}

      <Stack
        sx={{
          alignItems: { xs: 'stretch', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          mb: 4,
        }}
      >
        <TextField
          fullWidth
          label="Rechercher un produit"
          onChange={(event) => {
            const nextParams = new URLSearchParams(searchParams)
            const value = event.target.value
            if (value.trim()) nextParams.set('q', value)
            else nextParams.delete('q')
            setSearchParams(nextParams, { replace: true })
          }}
          value={query}
          sx={{ maxWidth: { md: 420 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Catégorie"
          onChange={(event) => {
            if (restaurantId !== undefined) {
              setCategorySelection({
                restaurantId,
                value: event.target.value,
              })
            }
          }}
          select
          sx={{ minWidth: { md: 190 } }}
          value={category}
        >
          <MenuItem value="">Toutes les catégories</MenuItem>
          {categories.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />
          }
          label="Disponibles"
        />
      </Stack>

      {loading ? (
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
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <Skeleton height={220} variant="rectangular" />
              <CardContent>
                <Skeleton width="60%" />
                <Skeleton />
                <Skeleton width="35%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : error ? (
        <Alert
          action={
            <Button
              color="inherit"
              onClick={() => setRetryToken((value) => value + 1)}
              size="small"
            >
              Réessayer
            </Button>
          }
          severity="error"
        >
          Impossible de charger la carte : {error}
        </Alert>
      ) : products.length === 0 ? (
        <Alert severity="info">
          Aucun produit ne correspond à ces filtres.
        </Alert>
      ) : (
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
          {products.map((product) => (
            <ProductCard
              key={product.id}
              onAdd={() =>
                product.is_available && activeRestaurant.is_open
                  ? dispatch(
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
                  : undefined
              }
              product={product}
              restaurantOpen={activeRestaurant.is_open}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

function ProductCard({
  product,
  restaurantOpen,
  onAdd,
}: {
  product: Product
  restaurantOpen: boolean
  onAdd: () => void
}) {
  const canAdd = restaurantOpen && product.is_available

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {product.image ? (
        <CardMedia
          alt={product.name}
          component="img"
          height="220"
          image={product.image}
          sx={{ objectFit: 'cover' }}
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
            height: 220,
            justifyContent: 'center',
            typography: 'h3',
          }}
        >
          Ytasty
        </Box>
      )}
      <CardContent sx={{ flex: 1 }}>
        <Stack
          sx={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography component="h2" variant="h5">
            {product.name}
          </Typography>
          <Chip
            color={product.is_available ? 'success' : 'default'}
            label={product.is_available ? 'Disponible' : 'Épuisé'}
            size="small"
          />
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {product.description}
        </Typography>
        {product.ingredients.length > 0 && (
          <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
            Ingrédients : {product.ingredients.join(', ')}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2.5, pb: 2.5 }}>
        <Typography
          color="primary.main"
          sx={{ fontWeight: 750 }}
          variant="h6"
        >
          {euroFormatter.format(product.price)}
        </Typography>
        <Button
          disabled={!canAdd}
          onClick={onAdd}
          startIcon={<AddShoppingCartRounded />}
          variant="contained"
        >
          {!restaurantOpen
            ? 'Restaurant fermé'
            : product.is_available
              ? 'Ajouter'
              : 'Indisponible'}
        </Button>
      </CardActions>
    </Card>
  )
}
