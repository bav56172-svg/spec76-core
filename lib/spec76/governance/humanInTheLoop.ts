type RiskLevel = "low" | "medium" | "high" | "critical";

type Action = {
  taskId: string;
  description: string;
  cost?: number;
  impact?: string;
};

type ApprovalRequest = {
  id: string;
  action: Action;
  risk: RiskLevel;
  reason: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
};

// 🟢 SIMPLE GOVERNANCE STORE
const approvalQueue: ApprovalRequest[] = [];

// 🟢 RISK ANALYZER (AI + rules)
export function evaluateRisk(action: Action): RiskLevel {
  if ((action.cost || 0) > 100000) return "critical";
  if ((action.cost || 0) > 10000) return "high";
  if ((action.cost || 0) > 1000) return "medium";
  return "low";
}

// 🟢 CREATE APPROVAL REQUEST
export function createApprovalRequest(action: Action): ApprovalRequest | null {
  const risk = evaluateRisk(action);

  // ❗ low risk → auto approve
  if (risk === "low") {
    return null;
  }

  const request: ApprovalRequest = {
    id: Math.random().toString(36),
    action,
    risk,
    reason: `Action requires human approval due to ${risk} risk level`,
    createdAt: Date.now(),
    status: "pending",
  };

  approvalQueue.push(request);

  return request;
}

// 🟢 HUMAN DECISION HANDLER
export function resolveApproval(
  id: string,
  decision: "approved" | "rejected"
) {
  const request = approvalQueue.find((r) => r.id === id);

  if (!request) return null;

  request.status = decision;

  return request;
}

// 🟢 GET PENDING APPROVALS
export function getPendingApprovals() {
  return approvalQueue.filter((r) => r.status === "pending");
}