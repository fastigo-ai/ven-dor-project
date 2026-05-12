import { 
  ProjectDetailsResponse, 
  RateCard as BackendRateCard
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
  proofImages?: string[];
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

export interface RateCard extends BackendRateCard {}

export interface VendorData {
  email: string;
  companyName: string;
  gstNumber: string;
  registrationNumber: string;
  businessAddress: string;
  contactPersonName: string;
  phoneNumber: string;
  websiteUrl: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  id: string;
  createdAt: Date;
}

export interface BackendProjectData {
  id: string;
  projectName: string;
  support_type: string;
  l1SupportName: string;
  l1SupportNumber: string;
  status: string;
  sla?: { priority: string; response_time_minutes: number } | null;
  createdAt: string;
  activatedAt?: string | null;
  vendorId: string;
  activeCalls?: number;
  totalCalls?: number;
  completedCalls?: number;
  totalCost?: number;
}

export interface ProjectsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
