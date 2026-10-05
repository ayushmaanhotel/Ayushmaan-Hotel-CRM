import type { ActiveTab } from '../components/layout/Sidebar';
import type { UserRole } from '../hooks/useHotelStore';

/* ============================================================
   ROLE-BASED ACCESS CONTROL
   Single source of truth for which navigation tabs each role
   may access. The sidebar, bottom nav and App shell all read
   from this map so a role can never see (or land on) a module
   outside its scope.

   housekeeper -> dedicated CleanerMobileModule (no tabs)
   guest       -> dedicated GuestPortalModule   (no tabs)
   ============================================================ */

export const ROLE_TABS: Record<UserRole, ActiveTab[]> = {
  owner: ['front-desk', 'rooms', 'guests', 'finance', 'operations', 'owner-analytics', 'admin-scopes', 'ai-assistant', 'settings'],
  manager: ['front-desk', 'rooms', 'guests', 'finance', 'operations', 'owner-analytics', 'ai-assistant', 'settings'],
  receptionist: ['front-desk', 'rooms', 'guests', 'finance', 'operations', 'ai-assistant'],
  housekeeper: [],
  guest: []
};

export function getAllowedTabs(role: UserRole): ActiveTab[] {
  return ROLE_TABS[role] ?? [];
}

export function canAccessTab(role: UserRole, tab: ActiveTab): boolean {
  return getAllowedTabs(role).includes(tab);
}

/** Landing tab for a role when its current tab becomes unavailable. */
export function getDefaultTab(role: UserRole): ActiveTab {
  return getAllowedTabs(role)[0] ?? 'front-desk';
}

/** Roles that may see hotel-wide revenue figures in the sidebar footer. */
export function canViewRevenue(role: UserRole): boolean {
  return role === 'owner' || role === 'manager' || role === 'receptionist';
}
