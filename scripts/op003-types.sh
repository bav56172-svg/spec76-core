#!/usr/bin/env bash

set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
mkdir -p types

cat > types/common.ts <<'EOF'
export type EntityId = string;
export type IsoDateTime = string;

export type RecordStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "archived";

export interface TimestampedEntity {
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/user.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type UserRole =
  | "customer"
  | "contractor"
  | "company_admin"
  | "platform_admin";

export interface UserProfile {
  id: EntityId;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/company.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type CompanyStatus = "draft" | "active" | "suspended" | "archived";

export interface Company {
  id: EntityId;
  owner_id: EntityId;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: CompanyStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type CompanyCreateInput = Pick<Company, "name"> &
  Partial<Pick<Company, "description" | "phone" | "email" | "city">>;
EOF

cat > types/project.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type ProjectStatus =
  | "draft"
  | "published"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export interface Project {
  id: EntityId;
  company_id: EntityId;
  owner_id: EntityId;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type ProjectCreateInput = Pick<Project, "title"> &
  Partial<Pick<Project, "description" | "company_id">>;
EOF

cat > types/task.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

export interface Task {
  id: EntityId;
  project_id: EntityId;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/service.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface Service {
  id: EntityId;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/equipment.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface Equipment {
  id: EntityId;
  company_id: EntityId;
  name: string;
  category: string;
  description: string | null;
  is_available: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/offer.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type OfferStatus = "submitted" | "accepted" | "rejected" | "withdrawn";

export interface Offer {
  id: EntityId;
  project_id: EntityId;
  company_id: EntityId;
  price: number | null;
  message: string | null;
  status: OfferStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/chat.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface ChatMessage {
  id: EntityId;
  project_id: EntityId;
  sender_id: EntityId;
  body: string;
  created_at: IsoDateTime;
}
EOF

cat > types/review.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface Review {
  id: EntityId;
  project_id: EntityId;
  author_id: EntityId;
  company_id: EntityId;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: IsoDateTime;
}
EOF

cat > types/payment.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: EntityId;
  project_id: EntityId;
  payer_id: EntityId;
  amount: number;
  currency: "RUB";
  status: PaymentStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
EOF

cat > types/ai-recommendation.ts <<'EOF'
import type { EntityId, IsoDateTime } from "./common";

export interface AiRecommendation {
  id: EntityId;
  project_id: EntityId;
  summary: string;
  service_names: string[];
  equipment_categories: string[];
  suggested_company_ids: EntityId[];
  created_at: IsoDateTime;
}
EOF

cat > types/index.ts <<'EOF'
export * from "./ai-recommendation";
export * from "./chat";
export * from "./common";
export * from "./company";
export * from "./equipment";
export * from "./offer";
export * from "./payment";
export * from "./project";
export * from "./review";
export * from "./service";
export * from "./task";
export * from "./user";
EOF

printf '\nCreated domain types:\n'
find types -maxdepth 1 -type f | sort
