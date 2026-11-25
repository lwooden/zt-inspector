export const VERIFICATION_ROLES = [
  "project_manager",
  "product_manager",
  "zt_lead",
] as const;

export type VerificationRole = (typeof VERIFICATION_ROLES)[number];

export type StatementVerification = {
  projectManagerAt: Date | string | null;
  productManagerAt: Date | string | null;
  ztLeadAt: Date | string | null;
};

export const VERIFICATION_ROLE_META: Record<
  VerificationRole,
  { label: string; color: string; field: keyof StatementVerification }
> = {
  project_manager: {
    label: "Project Manager",
    color: "#1d9bf0",
    field: "projectManagerAt",
  },
  product_manager: {
    label: "Product Manager",
    color: "#16a34a",
    field: "productManagerAt",
  },
  zt_lead: {
    label: "ZT Lead",
    color: "#7c3aed",
    field: "ztLeadAt",
  },
};

export const EMPTY_VERIFICATION: StatementVerification = {
  projectManagerAt: null,
  productManagerAt: null,
  ztLeadAt: null,
};

export function isFullyVerified(verification: StatementVerification): boolean {
  return (
    verification.projectManagerAt != null &&
    verification.productManagerAt != null &&
    verification.ztLeadAt != null
  );
}

export function nextVerificationRole(
  verification: StatementVerification,
): VerificationRole | null {
  if (verification.projectManagerAt == null) return "project_manager";
  if (verification.productManagerAt == null) return "product_manager";
  if (verification.ztLeadAt == null) return "zt_lead";
  return null;
}

export function canAttestRole(
  verification: StatementVerification,
  role: VerificationRole,
): boolean {
  return nextVerificationRole(verification) === role;
}

export function canClearRole(
  verification: StatementVerification,
  role: VerificationRole,
): boolean {
  const field = VERIFICATION_ROLE_META[role].field;
  return verification[field] != null;
}

/** Set a role timestamp; rejects out-of-order attestations. */
export function applyVerificationAttest(
  current: StatementVerification,
  role: VerificationRole,
  at: Date,
):
  | { ok: true; verification: StatementVerification }
  | { ok: false; error: "out_of_order" | "already_verified" } {
  if (!canAttestRole(current, role)) {
    const field = VERIFICATION_ROLE_META[role].field;
    if (current[field] != null) {
      return { ok: false, error: "already_verified" };
    }
    return { ok: false, error: "out_of_order" };
  }

  return {
    ok: true,
    verification: {
      ...current,
      [VERIFICATION_ROLE_META[role].field]: at,
    },
  };
}

/** Clear a role and cascade-clear all later roles. */
export function applyVerificationClear(
  current: StatementVerification,
  role: VerificationRole,
):
  | { ok: true; verification: StatementVerification }
  | { ok: false; error: "not_verified" } {
  if (!canClearRole(current, role)) {
    return { ok: false, error: "not_verified" };
  }

  const next: StatementVerification = { ...current };
  if (role === "project_manager") {
    next.projectManagerAt = null;
    next.productManagerAt = null;
    next.ztLeadAt = null;
  } else if (role === "product_manager") {
    next.productManagerAt = null;
    next.ztLeadAt = null;
  } else {
    next.ztLeadAt = null;
  }

  return { ok: true, verification: next };
}

function toDbTimestamp(value: Date | string | null): Date | null {
  if (value == null) return null;
  return value instanceof Date ? value : new Date(value);
}

export function verificationColumns(verification: StatementVerification): {
  verifiedByProjectManagerAt: Date | null;
  verifiedByProductManagerAt: Date | null;
  verifiedByZtLeadAt: Date | null;
} {
  return {
    verifiedByProjectManagerAt: toDbTimestamp(verification.projectManagerAt),
    verifiedByProductManagerAt: toDbTimestamp(verification.productManagerAt),
    verifiedByZtLeadAt: toDbTimestamp(verification.ztLeadAt),
  };
}

export function clearVerificationColumns(): {
  verifiedByProjectManagerAt: null;
  verifiedByProductManagerAt: null;
  verifiedByZtLeadAt: null;
} {
  return {
    verifiedByProjectManagerAt: null,
    verifiedByProductManagerAt: null,
    verifiedByZtLeadAt: null,
  };
}
