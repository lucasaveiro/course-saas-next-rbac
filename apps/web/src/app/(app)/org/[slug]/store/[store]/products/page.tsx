'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { queryClient } from '@/lib/react-query'
import { getProducts } from '@/http/get-products'
import { getStore } from '@/http/get-store'
import { createProduct } from '@/http/create-product'

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

  const { data: store } = useQuery({
    queryKey: [org, 'store', storeSlug],
    queryFn: () => getStore(org, storeSlug),
    enabled: !!org && !!storeSlug,
  })

  const { data, isLoading } = useQuery({
    queryKey: [org, storeSlug, 'products'],
    queryFn: () => getProducts({ org, storeSlug }),
    enabled: !!org && !!storeSlug,
  })

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
      await queryClient.invalidateQueries({
        queryKey: [org, storeSlug, 'products'],
      })
    },
  })

  async function handleCreateProduct() {
    await mutateCreateProduct()
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
              <TableHead>Weight</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Depth</TableHead>
              <TableHead>Quantity per pallet</TableHead>
              <TableHead>Created at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.description}
                </TableCell>
                <TableCell>{product.weight ?? '-'}</TableCell>
                <TableCell>{product.width ?? '-'}</TableCell>
                <TableCell>{product.length ?? '-'}</TableCell>
                <TableCell>{product.depth ?? '-'}</TableCell>
                <TableCell>{product.quantityPerPallet ?? '-'}</TableCell>
                <TableCell>
                  {new Date(product.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}