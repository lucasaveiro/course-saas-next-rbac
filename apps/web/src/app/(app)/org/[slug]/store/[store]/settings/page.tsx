import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AddressAutocomplete } from '@/components/address-autocomplete'

export default function StoreSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Store & Domain Settings</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Store Settings</CardTitle>
            <CardDescription>Update store name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="store-name">Store name</Label>
              <Input id="store-name" placeholder="My awesome store" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="store-description">Description</Label>
              <Input id="store-description" placeholder="Short description" />
            </div>
            <Button size="sm">Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Settings</CardTitle>
            <CardDescription>Configure custom domain (soon)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="domain">Custom domain</Label>
              <Input id="domain" placeholder="store.example.com" />
            </div>
            <Button size="sm" disabled>
              Save domain
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Freight Settings</CardTitle>
            <CardDescription>Configure freight calculation parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete 
              id="store-address"
              label="Store Address"
              placeholder="Enter store address"
            />
            <div className="space-y-1">
              <Label htmlFor="cost-per-km">Cost per KM</Label>
              <Input id="cost-per-km" type="number" step="0.01" placeholder="10.00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qt-per-pallet">Quantity per Pallet</Label>
              <Input id="qt-per-pallet" type="number" placeholder="100" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max-truck-pallets">Max Truck Pallets</Label>
              <Input id="max-truck-pallets" type="number" placeholder="10" />
            </div>
            <Button size="sm">Save freight settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}