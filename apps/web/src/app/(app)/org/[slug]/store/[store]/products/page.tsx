/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { defineAbilityFor } from '@saas/auth'
import { useMutation, useQuery } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { AlertTriangle, Loader2, Pencil, Plus, Trash } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { createProduct } from '@/http/create-product'
import { deleteProduct } from '@/http/delete-product'
import { getMembership } from '@/http/get-membership'
import { getProducts } from '@/http/get-products'
import { getStore } from '@/http/get-store'
import { updateProduct } from '@/http/update-product'
import { queryClient } from '@/lib/react-query'

export default function ProductsPage() {
  const { slug: org, store: storeSlug } = useParams<{
    slug: string
    store: string
  }>()

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [weight, setWeight] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [depth, setDepth] = useState('')
  const [qtPerPallet, setQtPerPallet] = useState<number | ''>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null)

  const { data: store } = useQuery({
    queryKey: [org, 'store', storeSlug],
    queryFn: () => getStore(org, storeSlug),
    enabled: !!org && !!storeSlug,
  })

  const { data, isLoading } = useQuery({
    queryKey: [org, storeSlug, 'products'],
    queryFn: () => getProducts({ org, storeSlug, perPage: 100 }),
    enabled: !!org && !!storeSlug,
    staleTime: 30_000,
  })

  const { data: membershipData } = useQuery({
    queryKey: [org, 'membership'],
    queryFn: () => getMembership(org),
    enabled: !!org,
  })

  const ability = membershipData
    ? defineAbilityFor({
        id: membershipData.membership.userId,
        role: membershipData.membership.role,
      })
    : null

  const { mutateAsync: mutateCreateProduct, isPending } = useMutation({
    mutationFn: async () => {
      if (!store) return
      await createProduct({
        org,
        storeId: store.id,
        name,
        description,
        price: price || undefined,
        weight: weight || undefined,
        width: width || undefined,
        length: length || undefined,
        depth: depth || undefined,
        qtPerPallet: typeof qtPerPallet === 'number' ? qtPerPallet : undefined,
      })
    },
    onError: async (err) => {
      if (err instanceof HTTPError) {
        const data = await err.response.json().catch(() => ({}))
        const message =
          typeof data?.message === 'string'
            ? data.message
            : 'Failed to create product.'
        setErrorMessage(message)
      } else {
        setErrorMessage('Unexpected error, try again in a few minutes.')
      }
    },
      onSuccess: async () => {
        setIsOpen(false)
        setName('')
        setDescription('')
        setPrice('')
        setWeight('')
        setWidth('')
        setLength('')
        setDepth('')
        setQtPerPallet('')
        setErrorMessage(null)
        // Atualiza explicitamente os dados sem invalidar para manter a listagem
        if (org && storeSlug) {
        const latest = await getProducts({ org, storeSlug, perPage: 100 })
        queryClient.setQueryData([org, storeSlug, 'products'], latest)
        }
      },
  })

  const { mutateAsync: mutateUpdateProduct, isPending: isUpdatePending } =
    useMutation({
      mutationFn: async () => {
        if (!editingProductId || !store?.id) return
        await updateProduct({
          org,
          storeId: store.id,
          productId: editingProductId,
          name: editName || undefined,
          description: editDescription || undefined,
        })
      },
      onError: async (err) => {
        if (err instanceof HTTPError) {
          const data = await err.response.json().catch(() => ({}))
          const message =
            typeof data?.message === 'string'
              ? data.message
              : 'Failed to update product.'
          setEditErrorMessage(message)
        } else {
          setEditErrorMessage('Unexpected error, try again in a few minutes.')
        }
      },
      onSuccess: async () => {
        setIsEditOpen(false)
        // Update products cache in-place to avoid refetch churn
        if (org && storeSlug && editingProductId) {
          queryClient.setQueryData(
            [org, storeSlug, 'products'],
            (prev: any) => {
              if (!prev || !Array.isArray(prev.products)) return prev
              const products = prev.products.map((p: any) =>
                p.id === editingProductId
                  ? {
                      ...p,
                      name: editName || p.name,
                      description: editDescription || p.description,
                    }
                  : p,
              )
              return { ...prev, products }
            },
          )
        }
        setEditingProductId(null)
        setEditName('')
        setEditDescription('')
        setEditErrorMessage(null)
      },
    })

  const { mutateAsync: mutateDeleteProduct, isPending: isDeletePending } =
    useMutation({
      mutationFn: async (productId: string) => {
        if (!store?.id) return
        await deleteProduct({ org, storeId: store.id, productId })
      },
      onError: async (err) => {
        if (err instanceof HTTPError) {
          const data = await err.response.json().catch(() => ({}))
          const message =
            typeof data?.message === 'string'
              ? data.message
              : 'Failed to delete product.'
          setErrorMessage(message)
        } else {
          setErrorMessage('Unexpected error, try again in a few minutes.')
        }
      },
      onSuccess: async (_data, productId) => {
        // Remove deleted product from cache without invalidating
        if (org && storeSlug && productId) {
          queryClient.setQueryData(
            [org, storeSlug, 'products'],
            (prev: any) => {
              if (!prev || !Array.isArray(prev.products)) return prev
              const products = prev.products.filter(
                (p: any) => p.id !== productId,
              )
              return { ...prev, products }
            },
          )
        }
      },
    })

  async function handleCreateProduct() {
    try {
      await mutateCreateProduct()
    } catch (err) {
      // handled in onError
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" /> New product
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create product</SheetTitle>
            </SheetHeader>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="size-4" />
                <AlertTitle>Creation failed</AlertTitle>
                <AlertDescription>
                  <p>{errorMessage}</p>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.001"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.001"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.001"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="depth">Depth</Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.001"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="qtPerPallet">Quantity per pallet</Label>
                <Input
                  id="qtPerPallet"
                  type="number"
                  value={qtPerPallet === '' ? '' : String(qtPerPallet)}
                  onChange={(e) => {
                    const val = e.target.value
                    setQtPerPallet(val === '' ? '' : Number(val))
                  }}
                />
              </div>
            </div>
            <SheetFooter>
              <Button onClick={handleCreateProduct} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit product sheet */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit product</SheetTitle>
            </SheetHeader>
            {editErrorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="size-4" />
                <AlertTitle>Update failed</AlertTitle>
                <AlertDescription>
                  <p>{editErrorMessage}</p>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>
            <SheetFooter>
              <Button
                onClick={() => mutateUpdateProduct()}
                disabled={isUpdatePending}
              >
                {isUpdatePending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading products...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Depth</TableHead>
              <TableHead>Quantity per pallet</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.description}
                </TableCell>
                <TableCell>{product.price ?? '-'}</TableCell>
                <TableCell>{product.weight ?? '-'}</TableCell>
                <TableCell>{product.width ?? '-'}</TableCell>
                <TableCell>{product.length ?? '-'}</TableCell>
                <TableCell>{product.depth ?? '-'}</TableCell>
                <TableCell>{product.quantityPerPallet ?? '-'}</TableCell>
                <TableCell>
                  {new Date(product.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {ability?.can('update', 'Product') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingProductId(product.id)
                          setEditName(product.name)
                          setEditDescription(product.description ?? '')
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Edit
                      </Button>
                    )}
                    {ability?.can('delete', 'Product') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            'Delete this product?',
                          )
                          if (!confirmed) return
                          await mutateDeleteProduct(product.id)
                        }}
                        disabled={isDeletePending}
                      >
                        <Trash className="mr-2 size-4" /> Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
