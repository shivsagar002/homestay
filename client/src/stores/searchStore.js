import { create } from 'zustand';

const useSearchStore = create((set) => ({
  // Search parameters
  location: '',
  startDate: null,
  endDate: null,
  guests: 1,
  
  // UI state
  isSearchOpen: false,
  
  // Actions
  setLocation: (location) => set({ location }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setGuests: (guests) => set({ guests }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  
  // Reset search
  resetSearch: () => set({
    location: '',
    startDate: null,
    endDate: null,
    guests: 1
  }),
  
  // Set all search params at once
  setSearchParams: (params) => set(params),
}));

export default useSearchStore;