'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  availableQuantity: number;
  unitPrice: number;
  hasKhaliJali: boolean;
  kjQuantity: number;
  kjUnitPrice: number;
  clearQuantity: number;
  clearKjQuantity: number;
  onClearQuantityChange: (value: number) => void;
  onClearKjQuantityChange: (value: number) => void;
  onConfirm: () => void;
  isEdit?: boolean;
}

export function QuantityDialog({
  open,
  onOpenChange,
  productName,
  availableQuantity,
  unitPrice,
  hasKhaliJali,
  kjQuantity,
  kjUnitPrice,
  clearQuantity,
  clearKjQuantity,
  onClearQuantityChange,
  onClearKjQuantityChange,
  onConfirm,
  isEdit = false,
}: QuantityDialogProps) {
  const clamp = (v: number, min: number, max: number) => {
    if (Number.isNaN(v)) return min;
    return Math.min(Math.max(v, min), max);
  };

  const calculateTotal = () => {
    const itemTotal = clearQuantity * unitPrice;
    const kjTotal = hasKhaliJali ? clearKjQuantity * kjUnitPrice : 0;
    return itemTotal + kjTotal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit' : 'Set'} Clearance Quantity
          </DialogTitle>
          <DialogDescription>
            At least one quantity (Product or KJ) must be greater than 0
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product</Label>
            <p className="text-sm">{productName}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Available Quantity</Label>
            <p className="text-sm font-semibold">
              {availableQuantity.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clear-qty">Clear Quantity</Label>
            <Input
              id="clear-qty"
              type="number"
              min="0"
              max={availableQuantity}
              step="0.01"
              value={clearQuantity}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onClearQuantityChange(
                  clamp(Number.isNaN(v) ? 0 : v, 0, availableQuantity)
                );
              }}
              onBlur={() =>
                onClearQuantityChange(
                  clamp(clearQuantity, 0, availableQuantity)
                )
              }
            />
          </div>

          {hasKhaliJali && (
            <div className="space-y-2">
              <Label htmlFor="clear-kj-qty">
                Khali Jali Quantity (Available: {kjQuantity || 0})
              </Label>
              <Input
                id="clear-kj-qty"
                type="number"
                min="0"
                max={kjQuantity || 0}
                step="1"
                value={clearKjQuantity}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onClearKjQuantityChange(
                    clamp(Number.isNaN(v) ? 0 : v, 0, kjQuantity)
                  );
                }}
                onBlur={() =>
                  onClearKjQuantityChange(clamp(clearKjQuantity, 0, kjQuantity))
                }
              />
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Item Total:</span>
              <span className="font-medium">
                PKR {(clearQuantity * unitPrice).toFixed(2)}
              </span>
            </div>
            {hasKhaliJali && kjUnitPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span>KJ Total:</span>
                <span className="font-medium">
                  PKR {(clearKjQuantity * kjUnitPrice).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Grand Total:</span>
              <span>PKR {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            {isEdit ? 'Update' : 'Add to Clearance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
