import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface VendorData {
  email: string;
  companyName: string;
  gstNumber: string;
  registrationNumber: string;
  businessAddress: string;
  contactPersonName: string;
  phoneNumber: string;
  websiteUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  id: string;
  createdAt: Date;
}

interface VendorContextType {
  currentEmail: string;
  setCurrentEmail: (email: string) => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  vendors: VendorData[];
  addVendor: (vendor: Omit<VendorData, 'id' | 'createdAt' | 'status'>) => void;
  updateVendorStatus: (id: string, status: 'pending' | 'approved' | 'rejected') => void;
  currentVendor: VendorData | null;
  setCurrentVendor: (vendor: VendorData | null) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [vendors, setVendors] = useState<VendorData[]>([
    {
      id: '1',
      email: 'demo@company.com',
      companyName: 'TechFlow Solutions',
      gstNumber: '27AABCU9603R1ZM',
      registrationNumber: 'U72200MH2020PTC123456',
      businessAddress: '123 Tech Park, Whitefield, Bangalore 560066',
      contactPersonName: 'Rajesh Kumar',
      phoneNumber: '+91 98765 43210',
      websiteUrl: 'https://techflow.com',
      status: 'pending',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      email: 'logistics@fastship.in',
      companyName: 'FastShip Logistics',
      gstNumber: '29AABCF1234R1ZP',
      registrationNumber: 'U60300KA2019PTC654321',
      businessAddress: '45 Industrial Estate, Electronic City, Bangalore 560100',
      contactPersonName: 'Priya Sharma',
      phoneNumber: '+91 87654 32109',
      websiteUrl: 'https://fastship.in',
      status: 'approved',
      createdAt: new Date('2024-01-10'),
    },
  ]);
  const [currentVendor, setCurrentVendor] = useState<VendorData | null>(null);

  const addVendor = (vendorData: Omit<VendorData, 'id' | 'createdAt' | 'status'>) => {
    const newVendor: VendorData = {
      ...vendorData,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date(),
    };
    setVendors((prev) => [...prev, newVendor]);
    setCurrentVendor(newVendor);
  };

  const updateVendorStatus = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === id ? { ...vendor, status } : vendor
      )
    );
  };

  return (
    <VendorContext.Provider
      value={{
        currentEmail,
        setCurrentEmail,
        isVerified,
        setIsVerified,
        vendors,
        addVendor,
        updateVendorStatus,
        currentVendor,
        setCurrentVendor,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};
