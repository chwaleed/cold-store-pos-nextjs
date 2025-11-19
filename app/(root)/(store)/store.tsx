import { create } from 'zustand';

interface StoreState {
  types: any[];
  subType: any[];
  rooms: any[];
  packTypes: any[];
  loading: boolean;

  setTypes: (typesData: any[]) => void;
  setSubTypes: (subTypesData: any[]) => void;
  setRooms: (roomsData: any[]) => void;
  setPackTypes: (packTypesData: any[]) => void;
  setLoading: (loading: boolean) => void;

  handleType: (typeData: any, operation: 'add' | 'remove' | 'edit') => void;
  handleSubType: (
    subTypeData: any,
    operation: 'add' | 'remove' | 'edit'
  ) => void;
  handleRoom: (roomData: any, operation: 'add' | 'remove' | 'edit') => void;
  handlePackType: (
    packTypeData: any,
    operation: 'add' | 'remove' | 'edit'
  ) => void;
}

const useStore = create<StoreState>((set, get) => ({
  types: [],
  subType: [],
  rooms: [],
  packTypes: [],
  loading: true,

  setTypes: (typesData) => set(() => ({ types: typesData })),
  setSubTypes: (subTypesData) => set(() => ({ subType: subTypesData })),
  setRooms: (roomsData) => set(() => ({ rooms: roomsData })),
  setPackTypes: (packTypesData) => set(() => ({ packTypes: packTypesData })),
  setLoading: (loading) => set(() => ({ loading })),

  // ---------------- TYPE ----------------
  handleType: (typeData, operation) => {
    if (operation === 'add') {
      set((state) => ({ types: [...state.types, typeData] }));
    }

    if (operation === 'remove') {
      set((state) => ({
        types: state.types.filter((type) => type.id !== typeData),
      }));
    }

    if (operation === 'edit') {
      set((state) => ({
        types: state.types.map((type) =>
          type.id === typeData.id ? { ...type, ...typeData } : type
        ),
      }));
    }
  },

  // ---------------- SUB-TYPE ----------------
  handleSubType: (subTypeData, operation) => {
    if (operation === 'add') {
      set((state) => ({
        subType: [...state.subType, subTypeData],
        types: state.types.map((type) =>
          subTypeData.productTypeId == type.id
            ? { ...type, _count: { subTypes: type._count.subTypes + 1 } }
            : type
        ),
      }));
    }

    if (operation === 'remove') {
      set((state) => ({
        subType: state.subType.filter(
          (subType) => subType.id !== subTypeData.id
        ),
        types: state.types.map((type) =>
          subTypeData.typeId == type.id
            ? {
                ...type,
                _count: { subTypes: type._count.subTypes - 1 },
              }
            : type
        ),
      }));
    }

    if (operation === 'edit') {
      set((state) => ({
        subType: state.subType.map((subType) =>
          subType.id === subTypeData.id
            ? { ...subType, ...subTypeData }
            : subType
        ),
      }));
    }
  },

  // ---------------- ROOM ----------------
  handleRoom: (roomData, operation) => {
    if (operation === 'add') {
      set((state) => ({
        rooms: [...state.rooms, roomData],
      }));
    }

    if (operation === 'remove') {
      set((state) => ({
        rooms: state.rooms.filter((room) => room.id !== roomData),
      }));
    }

    if (operation === 'edit') {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomData.id ? { ...room, ...roomData } : room
        ),
      }));
    }
  },

  // ---------------- PACK TYPES ----------------
  handlePackType: (packTypeData, operation) => {
    if (operation === 'add') {
      set((state) => ({
        packTypes: [...state.packTypes, packTypeData],
      }));
    }

    if (operation === 'remove') {
      set((state) => ({
        packTypes: state.packTypes.filter(
          (packType) => packType.id !== packTypeData
        ),
      }));
    }

    if (operation === 'edit') {
      set((state) => ({
        packTypes: state.packTypes.map((packType) =>
          packType.id === packTypeData.id
            ? { ...packType, ...packTypeData }
            : packType
        ),
      }));
    }
  },
}));

export default useStore;
