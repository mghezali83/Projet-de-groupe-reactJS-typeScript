import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { useAppSelector } from '../../../../app/hooks'
import { getApiErrorMessage } from '../../../../shared/api/client'
import type { Restaurant } from '../../../restaurants/domain/restaurant'
import type { Product, ProductInput } from '../domain/product'
import {
  loadProductCatalog,
  removeProduct,
  saveProduct,
  setProductAvailability,
} from '../application/productService'

interface ProductFormValues {
  name: string
  image: string
  description: string
  category: string
  price: string
  is_available: boolean
  restaurant_id: string
  ingredients: string
}

const emptyForm: ProductFormValues = {
  name: '',
  image: '',
  description: '',
  category: '',
  price: '',
  is_available: true,
  restaurant_id: '',
  ingredients: '',
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    image: product.image ?? '',
    description: product.description,
    category: product.category,
    price: String(product.price),
    is_available: product.is_available,
    restaurant_id: String(product.restaurant_id),
    ingredients: product.ingredients.join(', '),
  }
}

function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    image: values.image.trim() || null,
    description: values.description.trim(),
    category: values.category.trim(),
    price: Number(values.price),
    is_available: values.is_available,
    restaurant_id: Number(values.restaurant_id),
    ingredients: values.ingredients
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean),
  }
}

function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function ProductAdminPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [availabilityUpdatingId, setAvailabilityUpdatingId] = useState<number | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormValues>(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const availableRestaurants = useMemo(
    () =>
      user?.role === 'staff'
        ? restaurants.filter(
            (restaurant) => restaurant.id === user.restaurant_id,
          )
        : restaurants,
    [restaurants, user],
  )
  const refreshData = useCallback(async () => {
    try {
      const catalog = await loadProductCatalog()
      setProducts(
        user?.role === 'staff'
          ? catalog.products.filter(
              (product) => product.restaurant_id === user.restaurant_id,
            )
          : catalog.products,
      )
      setRestaurants(catalog.restaurants)
      setLoadError(null)
    } catch (error) {
      setLoadError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let active = true
    void loadProductCatalog()
      .then((catalog) => {
        if (!active) return
        setProducts(
          user?.role === 'staff'
            ? catalog.products.filter(
                (product) => product.restaurant_id === user.restaurant_id,
              )
            : catalog.products,
        )
        setRestaurants(catalog.restaurants)
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  function openCreateDialog() {
    setSelectedProduct(null)
    setForm({
      ...emptyForm,
      restaurant_id:
        user?.role === 'staff' && user.restaurant_id
          ? String(user.restaurant_id)
          : '',
    })
    setSaveError(null)
    setDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setSelectedProduct(product)
    setForm(toFormValues(product))
    setSaveError(null)
    setDialogOpen(true)
  }

  function updateForm<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)

    if (!isValidImageUrl(form.image)) {
      setSaveError('L’image doit être une URL HTTP ou HTTPS valide.')
      return
    }

    const input = toProductInput(form)
    if (
      !input.name ||
      !input.category ||
      !input.restaurant_id ||
      !Number.isFinite(input.price) ||
      input.price <= 0
    ) {
      setSaveError('Vérifiez les champs obligatoires et le prix.')
      return
    }

    setSaving(true)
    try {
      if (selectedProduct) {
        await saveProduct(selectedProduct.id, input)
        setSnackbar('Produit modifié.')
      } else {
        await saveProduct(null, input)
        setSnackbar('Produit créé.')
      }
      setDialogOpen(false)
      await refreshData()
    } catch (error) {
      setSaveError(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await removeProduct(deleteTarget.id)
      setDeleteTarget(null)
      setSnackbar('Produit supprimé.')
      await refreshData()
    } catch (error) {
      setLoadError(getApiErrorMessage(error))
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvailabilityChange(
    product: Product,
    isAvailable: boolean,
  ) {
    const canUpdateAvailability =
      user?.role === 'admin' ||
      (user?.role === 'staff' &&
        user.restaurant_id === product.restaurant_id)
    if (!canUpdateAvailability || saving || availabilityUpdatingId !== null) {
      return
    }

    setAvailabilityUpdatingId(product.id)
    setAvailabilityError(null)
    try {
      const updatedProduct = await setProductAvailability(
        product.id,
        isAvailable,
      )
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id
            ? { ...currentProduct, is_available: updatedProduct.is_available }
            : currentProduct,
        ),
      )
      setSnackbar(
        updatedProduct.is_available
          ? 'Produit disponible à la commande.'
          : 'Produit indisponible à la commande.',
      )
    } catch (error) {
      setAvailabilityError(getApiErrorMessage(error))
    } finally {
      setAvailabilityUpdatingId(null)
    }
  }

  return (
    <Box sx={{ py: { xs: 4, md: 7 } }}>
      <Stack
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            color="secondary.main"
            sx={{ fontWeight: 700 }}
            variant="overline"
          >
            Administration
          </Typography>
          <Typography component="h1" variant="h2">
            Produits
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Gérez le catalogue et sa disponibilité par restaurant.
          </Typography>
        </Box>
        <Button
          onClick={openCreateDialog}
          startIcon={<AddRounded />}
          variant="contained"
        >
          Nouveau produit
        </Button>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {loadError}
        </Alert>
      )}
      {availabilityError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {availabilityError}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'grid', minHeight: 220, placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table aria-label="Catalogue des produits">
                <TableHead>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Restaurant</TableCell>
                    <TableCell align="right">Prix</TableCell>
                    <TableCell>Disponibilité</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow hover key={product.id}>
                      <TableCell>
                        <Stack
                          sx={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            alt=""
                            src={product.image ?? undefined}
                            variant="rounded"
                          >
                            {product.name.slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              {product.name}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 280 }}
                              variant="body2"
                            >
                              {product.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {restaurants.find(
                          (restaurant) =>
                            restaurant.id === product.restaurant_id,
                        )?.name ?? `#${product.restaurant_id}`}
                      </TableCell>
                      <TableCell align="right">
                        {product.price.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </TableCell>
                      <TableCell>
                        <Stack
                          sx={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: 0.5,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={product.is_available}
                                disabled={
                                  saving || availabilityUpdatingId !== null ||
                                  !(
                                    user?.role === 'admin' ||
                                    (user?.role === 'staff' &&
                                      user.restaurant_id === product.restaurant_id)
                                  )
                                }
                                onChange={(_, checked) =>
                                  void handleAvailabilityChange(product, checked)
                                }
                              />
                            }
                            label={
                              product.is_available ? 'Disponible' : 'Indisponible'
                            }
                          />
                          {availabilityUpdatingId === product.id && (
                            <CircularProgress
                              aria-label={`Mise à jour de la disponibilité de ${product.name}`}
                              size={18}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label={`Modifier ${product.name}`}
                          onClick={() => openEditDialog(product)}
                        >
                          <EditOutlined />
                        </IconButton>
                        <IconButton
                          aria-label={`Supprimer ${product.name}`}
                          color="error"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <DeleteOutlineRounded />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 7 }}>
                        Aucun produit à afficher.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => !saving && setDialogOpen(false)}
        open={dialogOpen}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedProduct ? 'Modifier le produit' : 'Créer un produit'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {saveError && <Alert severity="error">{saveError}</Alert>}
              <TextField
                label="Nom"
                slotProps={{ htmlInput: { maxLength: 50 } }}
                onChange={(event) => updateForm('name', event.target.value)}
                required
                value={form.name}
              />
              <TextField
                label="Description"
                slotProps={{ htmlInput: { maxLength: 500 } }}
                multiline
                minRows={2}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                value={form.description}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Catégorie"
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                  onChange={(event) =>
                    updateForm('category', event.target.value)
                  }
                  required
                  value={form.category}
                />
                <TextField
                  fullWidth
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                  label="Prix (€)"
                  onChange={(event) => updateForm('price', event.target.value)}
                  required
                  type="number"
                  value={form.price}
                />
              </Stack>
              <FormControl fullWidth required>
                <InputLabel id="restaurant-select-label">Restaurant</InputLabel>
                <Select
                  label="Restaurant"
                  labelId="restaurant-select-label"
                  onChange={(event) =>
                    updateForm('restaurant_id', event.target.value)
                  }
                  value={form.restaurant_id}
                >
                  {availableRestaurants.map((restaurant) => (
                    <MenuItem key={restaurant.id} value={String(restaurant.id)}>
                      {restaurant.name} — {restaurant.city}
                    </MenuItem>
                  ))}
                </Select>
                {availableRestaurants.length === 0 && (
                  <FormHelperText>
                    Aucun restaurant disponible pour votre compte.
                  </FormHelperText>
                )}
              </FormControl>
              <TextField
                label="URL de l’image"
                onChange={(event) => updateForm('image', event.target.value)}
                placeholder="https://exemple.fr/image.jpg"
                type="url"
                value={form.image}
              />
              <FormHelperText sx={{ mt: '-16px !important' }}>
                L’API accepte une URL d’image HTTP(S), pas le téléversement de
                fichiers.
              </FormHelperText>
              {form.image && isValidImageUrl(form.image) && (
                <Avatar
                  alt="Aperçu du produit"
                  src={form.image}
                  variant="rounded"
                  sx={{ width: 88, height: 88 }}
                />
              )}
              <TextField
                label="Ingrédients"
                onChange={(event) =>
                  updateForm('ingredients', event.target.value)
                }
                placeholder="Poulet, salade, sauce"
                value={form.ingredients}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_available}
                    onChange={(event) =>
                      updateForm('is_available', event.target.checked)
                    }
                  />
                }
                label="Disponible à la commande"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              disabled={saving}
              onClick={() => setDialogOpen(false)}
              variant="text"
            >
              Annuler
            </Button>
            <Button disabled={saving} type="submit" variant="contained">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        onClose={() => !saving && setDeleteTarget(null)}
        open={deleteTarget !== null}
      >
        <DialogTitle>Supprimer le produit ?</DialogTitle>
        <DialogContent>
          Le produit « {deleteTarget?.name} » sera supprimé définitivement.
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={saving} onClick={() => setDeleteTarget(null)}>
            Annuler
          </Button>
          <Button
            color="error"
            disabled={saving}
            onClick={() => void handleDelete()}
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        autoHideDuration={3500}
        onClose={() => setSnackbar(null)}
        open={snackbar !== null}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity="success"
          variant="filled"
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  )
}
