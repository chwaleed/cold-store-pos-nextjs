import { create } from 'zustand';

interface StoreState {
  types: any[];
  subType: any[];
  rooms: any[];
  packTypes: any[];

  setTypes: (typesData: any[]) => void;
  setSubTypes: (subTypesData: any[]) => void;
  setRooms: (roomsData: any[]) => void;
  setPackTypes: (packTypesData: any[]) => void;

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

  setTypes: (typesData) => set(() => ({ types: typesData })),
  setSubTypes: (subTypesData) => set(() => ({ subType: subTypesData })),
  setRooms: (roomsData) => set(() => ({ rooms: roomsData })),
  setPackTypes: (packTypesData) => set(() => ({ packTypes: packTypesData })),

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
      }));
    }

    if (operation === 'remove') {
      set((state) => ({
        subType: state.subType.filter((subType) => subType.id !== subTypeData),
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
