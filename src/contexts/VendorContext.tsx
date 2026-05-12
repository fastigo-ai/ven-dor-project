import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  fetchVendorProjects, 
  fetchProjectDetails, 
  ProjectDetailsResponse, 
  fetchMyRateCards,
} from '@/services/projectApi';
import { 
  SupportType, 
  CallData, 
  ProjectData, 
  RateCard, 
  VendorData, 
  BackendProjectData, 
  ProjectsPagination 
} from '@/types/vendor';

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
  updateRateCard: (supportType: string, updates: Partial<RateCard>) => void;

  // Backend projects state (with pagination)
  backendProjects: BackendProjectData[];
  backendProjectsLoading: boolean;
  backendProjectsError: string | null;
  projectsPagination: ProjectsPagination;
  loadBackendProjects: (page?: number, pageSize?: number) => Promise<void>;
  loadRateCards: () => Promise<void>;
  rateCardsLoading: boolean;
  rateCardsError: string | null;
  
  // Selected project details
  selectedProjectDetails: ProjectDetailsResponse | null;
  selectedProjectLoading: boolean;
  selectedProjectError: string | null;
  loadProjectDetails: (projectId: string) => Promise<ProjectDetailsResponse | null>;
  clearSelectedProject: () => void;
  
  // Add new project to backend list (after creation)
  addBackendProject: (project: BackendProjectData) => void;
  
  // Registration flow state
  isGoogleUser: boolean;
  setIsGoogleUser: (value: boolean) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

// Empty initial states - all data comes from backend
const initialRateCards: RateCard[] = [];
const initialProjects: ProjectData[] = [];
const initialCalls: CallData[] = [];
const initialVendors: VendorData[] = [];

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [currentEmail, setCurrentEmail] = useState(() => localStorage.getItem('reg_email') || '');
  const [isVerified, setIsVerified] = useState(() => localStorage.getItem('reg_verified') === 'true');
  const [isGoogleUser, setIsGoogleUser] = useState(() => localStorage.getItem('reg_is_google') === 'true');
  
  const setPersistedEmail = (email: string) => {
    setCurrentEmail(email);
    localStorage.setItem('reg_email', email);
  };

  const setPersistedVerified = (verified: boolean) => {
    setIsVerified(verified);
    localStorage.setItem('reg_verified', String(verified));
  };
  
  const setPersistedGoogleUser = (value: boolean) => {
    setIsGoogleUser(value);
    localStorage.setItem('reg_is_google', String(value));
  };

  const [vendors, setVendors] = useState<VendorData[]>(initialVendors);
  const [currentVendor, setCurrentVendor] = useState<VendorData | null>(null);
  const [vendorPasswords, setVendorPasswords] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [calls, setCalls] = useState<CallData[]>(initialCalls);
  const [rateCards, setRateCards] = useState<RateCard[]>(initialRateCards);

  // Backend projects state with pagination
  const [backendProjects, setBackendProjects] = useState<BackendProjectData[]>([]);
  const [backendProjectsLoading, setBackendProjectsLoading] = useState(false);
  const [backendProjectsError, setBackendProjectsError] = useState<string | null>(null);
  const [projectsPagination, setProjectsPagination] = useState<ProjectsPagination>({
    page: 1,
    pageSize: 14,
    total: 0,
    totalPages: 1,
  });

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

  const [rateCardsLoading, setRateCardsLoading] = useState(false);
  const [rateCardsError, setRateCardsError] = useState<string | null>(null);

  const loadRateCards = useCallback(async () => {
    setRateCardsLoading(true);
    setRateCardsError(null);
    try {
      const response = await fetchMyRateCards();
      if (response.error) {
        setRateCardsError(response.error);
      } else if (response.data) {
        setRateCards(response.data);
      }
    } catch (err) {
      setRateCardsError('Failed to load rate cards');
    } finally {
      setRateCardsLoading(false);
    }
  }, []);

  const updateRateCard = (supportType: string, updates: Partial<RateCard>) => {
    setRateCards((prev) =>
      prev.map((card) =>
        card.support_type === supportType ? { ...card, ...updates } : card
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

  // Fetch paginated projects from backend
  const loadBackendProjects = useCallback(async (page: number = 1, pageSize: number = 14) => {
    setBackendProjectsLoading(true);
    setBackendProjectsError(null);
    
    try {
      const response = await fetchVendorProjects(page, pageSize);
      
      if (response.error) {
        setBackendProjectsError(response.error);
        return;
      }
      
      if (response.data) {
        const converted: BackendProjectData[] = response.data.data.map((p) => ({
          id: p.project_id || p._id || '',
          projectName: p.project_name,
          support_type: p.support_type,
          l1SupportName: p.l1_support_name || '',
          l1SupportNumber: p.l1_support_number || '',
          status: p.status,
          sla: p.sla,
          createdAt: p.created_at,
          activatedAt: p.activated_at,
          vendorId: p.vendor_id || '',
          activeCalls: p.active_calls,
          totalCalls: p.total_calls,
          completedCalls: p.completed_calls,
          totalCost: p.completed_cost || 0,
        }));
        setBackendProjects(converted);
        setProjectsPagination({
          page: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total_projects,
          totalPages: response.data.total_pages,
        });
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
        // Registration state - using new persisted setters
        currentEmail,
        setCurrentEmail: setPersistedEmail,
        isVerified,
        setIsVerified: setPersistedVerified,
        isGoogleUser,
        setIsGoogleUser: setPersistedGoogleUser,
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
        loadRateCards,
        rateCardsLoading,
        rateCardsError,
        // Backend projects with pagination
        backendProjects,
        backendProjectsLoading,
        backendProjectsError,
        projectsPagination,
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
