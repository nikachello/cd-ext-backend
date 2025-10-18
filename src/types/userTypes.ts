// backend/src/types/user.ts
export interface SafeMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    createdAt: Date;
  };
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  isGlobalAdmin: boolean;
  members: SafeMember[]; // This should never be undefined
  createdAt: Date;
  updatedAt: Date;
}
