'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface Hotel {
  value: string;
  label: string;
  shortLabel: string;
}

interface HotelContextType {
  selectedHotel: string;
  hotels: Hotel[];
  setSelectedHotel: (hotelValue: string) => void;
  getCurrentHotel: () => Hotel | undefined;
  refreshHotelData: () => void;
  isLoading: boolean;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

const defaultHotels: Hotel[] = [
  { value: 'africanVillage', label: 'Kuriftu African Village', shortLabel: 'African Village' },
  { value: 'bishoftu', label: 'Kuriftu Bishoftu', shortLabel: 'Bishoftu' },
  { value: 'entoto', label: 'Kuriftu Entoto', shortLabel: 'Entoto' },
  { value: 'laketana', label: 'Kuriftu Lake Tana', shortLabel: 'Lake Tana' },
  { value: 'awashfall', label: 'Kuriftu Awash Fall', shortLabel: 'Awash Fall' }
];

export function HotelProvider({ children }: { children: ReactNode }) {
  const [selectedHotel, setSelectedHotelState] = useState<string>('africanVillage');
  const [isLoading, setIsLoading] = useState(false);

  const hotels = defaultHotels;

  const setSelectedHotel = (hotelValue: string) => {
    const hotel = hotels.find(h => h.value === hotelValue);
    if (hotel) {
      setSelectedHotelState(hotelValue);
      toast.success(`Switched to ${hotel.label}`);
      
      // Trigger data refresh when hotel changes
      refreshHotelData();
    }
  };

  const getCurrentHotel = () => {
    return hotels.find(h => h.value === selectedHotel);
  };

  const refreshHotelData = () => {
    setIsLoading(true);
    
    // Simulate data refresh - in real implementation, this would trigger API calls
    setTimeout(() => {
      setIsLoading(false);
      // You can add actual API calls here to refresh data based on selected hotel
      console.log(`Refreshing data for hotel: ${selectedHotel}`);
    }, 500);
  };

  // Load selected hotel from localStorage on mount
  useEffect(() => {
    const savedHotel = localStorage.getItem('selectedHotel');
    if (savedHotel && hotels.find(h => h.value === savedHotel)) {
      setSelectedHotelState(savedHotel);
    }
  }, []);

  // Save selected hotel to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedHotel', selectedHotel);
  }, [selectedHotel]);

  const value = {
    selectedHotel,
    hotels,
    setSelectedHotel,
    getCurrentHotel,
    refreshHotelData,
    isLoading
  };

  return (
    <HotelContext.Provider value={value}>
      {children}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
}
