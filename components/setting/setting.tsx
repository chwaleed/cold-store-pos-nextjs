'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductTypeManager } from '@/components/setting/product-type-manager';
import { ProductSubTypeManager } from '@/components/setting/product-subtype-manager';
import { RoomManager } from '@/components/setting/room-manager';
import { PackTypeManager } from '@/components/setting/pack-type-manager';
import { Settings2 } from 'lucide-react';

export function Setting() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="flex w-full  flex-col">
      <div className="flex rounded-xl  flex-1 flex-col gap-4   md:gap-8 p-6 ">
        <div className="mx-auto w-full  space-y-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage system configuration and master data
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Product Types</TabsTrigger>
              <TabsTrigger value="subtypes">Subtypes</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="packs">Pack Types</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <ProductTypeManager />
            </TabsContent>

            <TabsContent value="subtypes" className="space-y-4">
              <ProductSubTypeManager />
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4">
              <RoomManager />
            </TabsContent>

            <TabsContent value="packs" className="space-y-4">
              <PackTypeManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
