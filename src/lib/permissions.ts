import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// MANAGER can manage organization settings and members
export const MANAGER = ac.newRole({
  organization: ["update", "delete"], // cannot "view" or "create" organization
  member: ["create", "update", "delete"], // can manage members
});

// DISPATCHER can view members (maybe later manage loads, etc.)
export const DISPATCHER = ac.newRole({
  member: [],
});

// DRIVER can only view their own member info
export const DRIVER = ac.newRole({
  member: [],
});
