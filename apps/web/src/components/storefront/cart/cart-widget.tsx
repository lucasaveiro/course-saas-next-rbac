'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './use-cart'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { calculateFreightCostWithAddresses } from '@/lib/google-maps'

export function CartWidget() {
  const { data, isLoading, error, updateItem, removeItem, updateDeliveryAddress } = useCart()
  const [open, setOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [freightInfo, setFreightInfo] = useState<{ cost: number; trips: number } | null>(null)

  const count = data?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0

  return (
    <div>
      <button
        aria-label="Abrir carrinho"
        className="relative inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <ShoppingCart className="size-4" />
        <span>{count}</span>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[1200px] rounded-t-md border bg-background p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm">Seu carrinho</strong>
            <button className="text-xs text-muted-foreground" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {error && (
            <p className="text-sm text-red-500">Erro ao carregar o carrinho</p>
          )}

          <ul className="space-y-3">
            {data?.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qtd: {item.quantity} • Estoque:{' '}
                    {item.inventoryQuantity ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="rounded-md border px-2 py-1 text-xs text-red-600"
                    onClick={() => removeItem(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {data?.items.length > 0 && (
            <div className="mt-4 space-y-3 border-t pt-3">
              <div className="space-y-2">
                <Label htmlFor="delivery-address">Endereço de entrega</Label>
                <AddressAutocomplete
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(address) => {
                    setDeliveryAddress(address);
                    if (updateDeliveryAddress) {
                      updateDeliveryAddress(address);
                    }
                  }}
                  placeholder="Digite seu endereço para cálculo de frete"
                  className="w-full"
                />
                {deliveryAddress && (
                  <Button 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={async () => {
                      if (!data?.storeSettings) return;
                      
                      try {
                        const totalQuantity = data.items.reduce((acc, item) => {
                          const product = item.product;
                          return acc + (item.quantity * (product?.qtPerPallet ? 1 : 1));
                        }, 0);
                        
                        const result = await calculateFreightCostWithAddresses({
                          originAddress: data.storeSettings.storeAddress || '',
                          destinationAddress: deliveryAddress,
                          costPerKm: data.storeSettings.costPerKm || 1,
                          totalQuantity,
                          qtPerPallet: data.storeSettings.qtPerPallet || 100,
                          maxTruckPallets: data.storeSettings.maxTruckPallets || 10
                        });
                        
                        setFreightInfo(result);
                      } catch (err) {
                        console.error('Erro ao calcular frete:', err);
                      }
                    }}
                  >
                    Calcular frete
                  </Button>
                )}
              </div>
              
              {freightInfo && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Informações de frete:</p>
                  <p>Custo total: R$ {freightInfo.cost.toFixed(2)}</p>
                  <p>Serão necessárias {freightInfo.trips} viagens para entregar todo o seu pedido.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}