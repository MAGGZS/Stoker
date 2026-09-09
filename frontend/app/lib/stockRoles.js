export const ROLES = {
  OWNER: 'OWNER',
  GUEST: 'GUEST',
};

export function isOwner(role) {
  return role === ROLES.OWNER;
}

export function isGuest(role) {
  return role === ROLES.GUEST;
}

export function canManageStock(role) {
  return isOwner(role);
}

export function canMoveStock(role) {
  return isOwner(role) || isGuest(role);
}

export function canReconcileBatch(role) {
  return isOwner(role);
}

export function canManageMembers(role) {
  return isOwner(role);
}

export function roleLabel(role) {
  if (role === ROLES.OWNER) return 'Dono';
  if (role === ROLES.GUEST) return 'Convidado';
  return role || 'Sem papel';
}

