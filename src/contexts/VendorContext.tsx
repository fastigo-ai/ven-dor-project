import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  fetchVendorProjects, 
  fetchProjectDetails, 
  BackendProject, 
  ProjectDetailsResponse, 
  ProjectCallRow 
} from '@/services/projectApi';

export type SupportType = 'pm activity' | 'breakfix' | 'on call';

export interface CallData {
  id: string;
  projectId: string;
  stateName: string;
  branchName: string;
  branchCategory: string;
  branchCode: string;
  address: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  assetsCount: number;
  supportType: string;
  assetType: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface ProjectData {
  id: string;
  vendorId: string;
  name: string;
  supportType: SupportType;
  l1SupportName?: string;
  l1SupportNumber?: string;
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

// Backend project converted to frontend format
export interface BackendProjectData {
  id: string;
  projectName: string;
  supportType: string;
  l1SupportName: string;
  l1SupportNumber: string;
  status: string;
  sla?: { priority: string; response_time_minutes: number } | null;
  createdAt: string;
  activatedAt?: string | null;
  vendorId: string;
  // Summary data (fetched from details)
  activeCalls?: number;
  totalCalls?: number;
  totalCost?: number;
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
  
  // Legacy local projects (for backward compatibility)
  projects: ProjectData[];
  addProject: (project: Omit<ProjectData, 'id' | 'createdAt' | 'totalCalls' | 'completedCalls' | 'totalAmount'>) => ProjectData;
  updateProject: (id: string, updates: Partial<ProjectData>) => void;
  calls: CallData[];
  addCalls: (calls: Omit<CallData, 'id' | 'createdAt' | 'status'>[], projectId: string) => void;
  addSingleCall: (call: Omit<CallData, 'id' | 'createdAt' | 'status'>) => void;
  deleteCall: (callId: string) => void;
  rateCards: RateCard[];
  updateRateCard: (id: string, updates: Partial<RateCard>) => void;

  // Backend projects state
  backendProjects: BackendProjectData[];
  backendProjectsLoading: boolean;
  backendProjectsError: string | null;
  loadBackendProjects: () => Promise<void>;
  
  // Selected project details
  selectedProjectDetails: ProjectDetailsResponse | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string | null;
  loadProjectDetails: (projectId: string) => Promise<ProjectDetailsResponse | null>;
  clearSelectedProject: () => void;
  
  // Add new project to backend list (after creation)
  addBackendProject: (project: BackendProjectData) => void;
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
    supportType: 'breakfix',
    l1SupportName: 'Amit Kumar',
    l1SupportNumber: '9876543210',
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
    supportType: 'on call',
    l1SupportName: 'Priya Sharma',
    l1SupportNumber: '9876543211',
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
    supportType: 'pm activity',
    l1SupportName: 'Rahul Singh',
    l1SupportNumber: '9876543212',
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
    stateName: 'Maharashtra',
    branchName: 'Andheri West Branch',
    branchCategory: 'Urban',
    branchCode: 'MH001',
    address: '123 MG Road, Andheri West',
    pincode: '400058',
    contactName: 'Amit Shah',
    contactPhone: '9876511111',
    assetsCount: 5,
    supportType: 'breakfix',
    assetType: 'Laptop',
    status: 'completed',
    createdAt: new Date('2024-01-21'),
  },
  {
    id: 'call-2',
    projectId: 'proj-1',
    stateName: 'Maharashtra',
    branchName: 'Bandra Branch',
    branchCategory: 'Urban',
    branchCode: 'MH002',
    address: '45 Link Road, Bandra',
    pincode: '400050',
    contactName: 'Priya Patel',
    contactPhone: '9876522222',
    assetsCount: 3,
    supportType: 'breakfix',
    assetType: 'Printer',
    status: 'assigned',
    createdAt: new Date('2024-01-22'),
  },
  {
    id: 'call-3',
    projectId: 'proj-2',
    stateName: 'Karnataka',
    branchName: 'Indiranagar Branch',
    branchCategory: 'Urban',
    branchCode: 'KA001',
    address: '78 Indiranagar, Bangalore',
    pincode: '560038',
    contactName: 'Rahul Sharma',
    contactPhone: '9876533333',
    assetsCount: 2,
    supportType: 'on call',
    assetType: 'Desktop',
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

  // Backend projects state
  const [backendProjects, setBackendProjects] = useState<BackendProjectData[]>([]);
  const [backendProjectsLoading, setBackendProjectsLoading] = useState(false);
  const [backendProjectsError, setBackendProjectsError] = useState<string | null>(null);

  // Selected project details state
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ProjectDetailsResponse | null>(null);
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false);
  const [selectedProjectError, setSelectedProjectError] = useState<string | null>(null);

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

  const addCalls = (newCalls: Omit<CallData, 'id' | 'createdAt' | 'status'>[], projectId: string) => {
    const callsWithIds: CallData[] = newCalls.map((call, index) => ({
      ...call,
      projectId,
      id: `call-${Date.now()}-${index}`,
      createdAt: new Date(),
      status: 'pending' as const,
    }));
    setCalls((prev) => [...prev, ...callsWithIds]);

    // Update project stats
    setProjects((prevProjects) => {
      return prevProjects.map((project) => {
        if (project.id === projectId) {
          const totalAssets = callsWithIds.reduce((sum, c) => sum + c.assetsCount, 0);
          return {
            ...project,
            totalCalls: project.totalCalls + callsWithIds.length,
            totalAmount: project.totalAmount + totalAssets * 100, // Placeholder rate
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

  const addSingleCall = (callData: Omit<CallData, 'id' | 'createdAt' | 'status'>) => {
    const newCall: CallData = {
      ...callData,
      id: `call-${Date.now()}`,
      createdAt: new Date(),
      status: 'pending',
    };
    setCalls((prev) => [...prev, newCall]);

    // Update project stats
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id === callData.projectId) {
          return {
            ...project,
            totalCalls: project.totalCalls + 1,
            totalAmount: project.totalAmount + (callData.assetsCount * 100),
          };
        }
        return project;
      })
    );
  };

  const deleteCall = (callId: string) => {
    const callToDelete = calls.find((c) => c.id === callId);
    if (!callToDelete) return;

    setCalls((prev) => prev.filter((c) => c.id !== callId));

    // Update project stats
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id === callToDelete.projectId) {
          return {
            ...project,
            totalCalls: Math.max(0, project.totalCalls - 1),
            totalAmount: Math.max(0, project.totalAmount - (callToDelete.assetsCount * 100)),
          };
        }
        return project;
      })
    );
  };

  // Fetch all projects from backend
  const loadBackendProjects = useCallback(async () => {
    setBackendProjectsLoading(true);
    setBackendProjectsError(null);
    
    try {
      const response = await fetchVendorProjects();
      
      if (response.error) {
        setBackendProjectsError(response.error);
        return;
      }
      
      if (response.data) {
        const converted: BackendProjectData[] = response.data.map((p) => ({
          id: p._id || p.project_id || '',
          projectName: p.project_name,
          supportType: p.support_type,
          l1SupportName: p.l1_support_name,
          l1SupportNumber: p.l1_support_number,
          status: p.status,
          sla: p.sla,
          createdAt: p.created_at,
          activatedAt: p.activated_at,
          vendorId: p.vendor_id,
        }));
        setBackendProjects(converted);
      }
    } catch (err) {
      setBackendProjectsError('Failed to load projects');
    } finally {
      setBackendProjectsLoading(false);
    }
  }, []);

  // Fetch single project details from backend
  const loadProjectDetails = useCallback(async (projectId: string): Promise<ProjectDetailsResponse | null> => {
    setSelectedProjectLoading(true);
    setSelectedProjectError(null);
    
    try {
      const response = await fetchProjectDetails(projectId);
      
      if (response.error) {
        setSelectedProjectError(response.error);
        return null;
      }
      
      if (response.data) {
        setSelectedProjectDetails(response.data);
        return response.data;
      }
      
      return null;
    } catch (err) {
      setSelectedProjectError('Failed to load project details');
      return null;
    } finally {
      setSelectedProjectLoading(false);
    }
  }, []);

  const clearSelectedProject = useCallback(() => {
    setSelectedProjectDetails(null);
    setSelectedProjectError(null);
  }, []);

  // Add a new project to backend list (after creation via wizard)
  const addBackendProject = useCallback((project: BackendProjectData) => {
    setBackendProjects((prev) => [...prev, project]);
  }, []);

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
        addSingleCall,
        deleteCall,
        rateCards,
        updateRateCard,
        // Backend projects
        backendProjects,
        backendProjectsLoading,
        backendProjectsError,
        loadBackendProjects,
        // Selected project details
        selectedProjectDetails,
        selectedProjectLoading,
        selectedProjectError,
        loadProjectDetails,
        clearSelectedProject,
        addBackendProject,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};
