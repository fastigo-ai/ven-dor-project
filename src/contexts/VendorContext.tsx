import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportType = 'Breakfix' | 'PM Activity' | 'On Call Support' | 'Server Call' | 'Desktop Installation';

export interface CallData {
  id: string;
  projectId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pincode: string;
  orderAmount: number;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface ProjectData {
  id: string;
  vendorId: string;
  name: string;
  supportType: SupportType;
  createdAt: Date;
  status: 'active' | 'completed' | 'on-hold';
  totalCalls: number;
  completedCalls: number;
  totalAmount: number;
}

export interface RateCard {
  id: string;
  serviceType: string;
  baseRate: number;
  perKmRate: number;
  urgentMultiplier: number;
  isActive: boolean;
}

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
  setVendorPassword: (email: string, password: string) => void;
  getVendorPassword: (email: string) => string | undefined;
  projects: ProjectData[];
  addProject: (project: Omit<ProjectData, 'id' | 'createdAt' | 'totalCalls' | 'completedCalls' | 'totalAmount'>) => ProjectData;
  updateProject: (id: string, updates: Partial<ProjectData>) => void;
  calls: CallData[];
  addCalls: (calls: Omit<CallData, 'id' | 'createdAt' | 'status'>[]) => void;
  rateCards: RateCard[];
  updateRateCard: (id: string, updates: Partial<RateCard>) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

const initialRateCards: RateCard[] = [
  { id: '1', serviceType: 'Standard Delivery', baseRate: 50, perKmRate: 5, urgentMultiplier: 1.5, isActive: true },
  { id: '2', serviceType: 'Express Delivery', baseRate: 100, perKmRate: 8, urgentMultiplier: 2.0, isActive: true },
  { id: '3', serviceType: 'Same Day Delivery', baseRate: 150, perKmRate: 10, urgentMultiplier: 2.5, isActive: true },
  { id: '4', serviceType: 'Bulk Shipment', baseRate: 200, perKmRate: 3, urgentMultiplier: 1.3, isActive: true },
  { id: '5', serviceType: 'Fragile Items', baseRate: 100, perKmRate: 7, urgentMultiplier: 1.8, isActive: true },
];

const initialProjects: ProjectData[] = [
  {
    id: 'proj-1',
    vendorId: '2',
    name: 'Mumbai Metro Deliveries',
    supportType: 'Breakfix',
    createdAt: new Date('2024-01-20'),
    status: 'active',
    totalCalls: 45,
    completedCalls: 32,
    totalAmount: 125000,
  },
  {
    id: 'proj-2',
    vendorId: '2',
    name: 'Bangalore Express',
    supportType: 'On Call Support',
    createdAt: new Date('2024-01-25'),
    status: 'active',
    totalCalls: 28,
    completedCalls: 15,
    totalAmount: 78000,
  },
  {
    id: 'proj-3',
    vendorId: '2',
    name: 'Delhi NCR Support',
    supportType: 'PM Activity',
    createdAt: new Date('2024-01-28'),
    status: 'on-hold',
    totalCalls: 12,
    completedCalls: 0,
    totalAmount: 35000,
  },
];

const initialCalls: CallData[] = [
  {
    id: 'call-1',
    projectId: 'proj-1',
    customerName: 'Amit Shah',
    customerPhone: '+91 98765 11111',
    customerAddress: '123 MG Road, Andheri West',
    pincode: '400058',
    orderAmount: 2500,
    status: 'completed',
    createdAt: new Date('2024-01-21'),
  },
  {
    id: 'call-2',
    projectId: 'proj-1',
    customerName: 'Priya Patel',
    customerPhone: '+91 98765 22222',
    customerAddress: '45 Link Road, Bandra',
    pincode: '400050',
    orderAmount: 3200,
    status: 'assigned',
    createdAt: new Date('2024-01-22'),
  },
  {
    id: 'call-3',
    projectId: 'proj-2',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 33333',
    customerAddress: '78 Indiranagar, Bangalore',
    pincode: '560038',
    orderAmount: 4500,
    status: 'pending',
    createdAt: new Date('2024-01-26'),
  },
];

const initialVendors: VendorData[] = [
  {
    id: '1',
    email: 'vendor@example.com',
    companyName: 'Example Logistics',
    gstNumber: 'GST123456789',
    registrationNumber: 'REG001',
    businessAddress: '123 Business Street, Mumbai',
    contactPersonName: 'John Doe',
    phoneNumber: '+91 98765 43210',
    websiteUrl: 'https://example.com',
    status: 'pending',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    email: 'logistics@fastship.in',
    companyName: 'FastShip Logistics Pvt Ltd',
    gstNumber: '27AABCU9603R1ZM',
    registrationNumber: 'REG002',
    businessAddress: '456 Industrial Area, Andheri East, Mumbai - 400093',
    contactPersonName: 'Rajesh Kumar',
    phoneNumber: '+91 98765 12345',
    websiteUrl: 'https://fastshiplogistics.in',
    status: 'approved',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    email: 'contact@speedycourier.com',
    companyName: 'Speedy Courier Services',
    gstNumber: '29AABCS1234R1ZP',
    registrationNumber: 'REG003',
    businessAddress: '789 Delivery Hub, Koramangala, Bangalore - 560034',
    contactPersonName: 'Priya Sharma',
    phoneNumber: '+91 98765 67890',
    websiteUrl: 'https://speedycourier.com',
    status: 'pending',
    createdAt: new Date('2024-01-18'),
  },
];

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [vendors, setVendors] = useState<VendorData[]>(initialVendors);
  const [currentVendor, setCurrentVendor] = useState<VendorData | null>(null);
  const [vendorPasswords, setVendorPasswords] = useState<Record<string, string>>({
    'logistics@fastship.in': 'FastShip@123',
  });
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [calls, setCalls] = useState<CallData[]>(initialCalls);
  const [rateCards, setRateCards] = useState<RateCard[]>(initialRateCards);

  const addVendor = (vendorData: Omit<VendorData, 'id' | 'createdAt' | 'status'>) => {
    const newVendor: VendorData = {
      ...vendorData,
      id: String(vendors.length + 1),
      createdAt: new Date(),
      status: 'pending',
    };
    setVendors((prev) => [...prev, newVendor]);
  };

  const updateVendorStatus = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === id ? { ...vendor, status } : vendor
      )
    );
  };

  const setVendorPassword = (email: string, password: string) => {
    setVendorPasswords((prev) => ({
      ...prev,
      [email]: password,
    }));
  };

  const getVendorPassword = (email: string) => {
    return vendorPasswords[email];
  };

  const addProject = (projectData: Omit<ProjectData, 'id' | 'createdAt' | 'totalCalls' | 'completedCalls' | 'totalAmount'>) => {
    const newProject: ProjectData = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date(),
      totalCalls: 0,
      completedCalls: 0,
      totalAmount: 0,
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<ProjectData>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const addCalls = (newCalls: Omit<CallData, 'id' | 'createdAt' | 'status'>[]) => {
    const callsWithIds: CallData[] = newCalls.map((call, index) => ({
      ...call,
      id: `call-${Date.now()}-${index}`,
      createdAt: new Date(),
      status: 'pending' as const,
    }));
    setCalls((prev) => [...prev, ...callsWithIds]);

    // Update project stats using functional update to avoid stale state
    setProjects((prevProjects) => {
      const projectUpdates: Record<string, { totalCalls: number; totalAmount: number }> = {};
      
      callsWithIds.forEach((call) => {
        if (!projectUpdates[call.projectId]) {
          const existingProject = prevProjects.find((p) => p.id === call.projectId);
          projectUpdates[call.projectId] = {
            totalCalls: existingProject?.totalCalls || 0,
            totalAmount: existingProject?.totalAmount || 0,
          };
        }
        projectUpdates[call.projectId].totalCalls += 1;
        projectUpdates[call.projectId].totalAmount += call.orderAmount;
      });

      return prevProjects.map((project) => {
        if (projectUpdates[project.id]) {
          return {
            ...project,
            totalCalls: projectUpdates[project.id].totalCalls,
            totalAmount: projectUpdates[project.id].totalAmount,
          };
        }
        return project;
      });
    });
  };

  const updateRateCard = (id: string, updates: Partial<RateCard>) => {
    setRateCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, ...updates } : card
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
        setVendorPassword,
        getVendorPassword,
        projects,
        addProject,
        updateProject,
        calls,
        addCalls,
        rateCards,
        updateRateCard,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};
