import { StoreForm } from '@/app/(app)/org/[slug]/create-store/store-form'
import { InterceptedSheetContent } from '@/components/intercepted-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function CreateStore() {
  return (
    <Sheet defaultOpen>
      <InterceptedSheetContent>
        <SheetHeader>
          <SheetTitle>Create store</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <StoreForm />
        </div>
      </InterceptedSheetContent>
    </Sheet>
  )
}
