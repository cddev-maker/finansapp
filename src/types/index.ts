// ─── Enums (mirror Prisma) ────────────────────────────────────────────────────

export type TransactionType = "INCOME" | "EXPENSE";
export type PaymentStatus   = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type BudgetPeriod    = "MONTHLY" | "YEARLY";
export type CardNetwork     = "VISA" | "MASTERCARD" | "AMEX" | "TROY" | "OTHER";
export type Role            = "USER" | "ADMIN";

export type Category =
  | "SALARY" | "RENT" | "GROCERIES" | "UTILITIES" | "FUEL"
  | "CREDIT_CARD" | "EDUCATION" | "HEALTHCARE" | "ENTERTAINMENT"
  | "INVESTMENT" | "TRANSFER" | "VEHICLE_MAINTENANCE"
  | "BUILDING_DUES" | "DEBT" | "EXPENSE_PAYMENT" | "LOAN_PAYMENT" | "OTHER";
// ─── Domain objects ───────────────────────────────────────────────────────────

export interface Transaction {
  id:           string;
  userId:       string;
  date:         string;
  description:  string;
  category:     Category;
  amount:       number;
  type:         TransactionType;
  notes?:       string | null;
  creditCardId?: string | null;
  creditCard?:  CreditCard | null;
  bankName?:    string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface Payment {
  id:              string;
  userId:          string;
  name:            string;
  description?:    string | null;
  amount:          number;
  dueDate:         string;
  startDate:       string;
  endDate?:        string | null;
  category:        Category;
  status:          PaymentStatus;
  completed:       boolean;
  completedAt?:    string | null;
  reminderSentAt?: string | null;
  notes?:          string | null;
  bankName?:       string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface CreditCard {
  id:              string;
  userId:          string;
  name:            string;
  lastFourDigits:  string;
  network:         CardNetwork;
  creditLimit:     number;
  currentBalance:  number;
  statementDate:   number;
  dueDate:         number;
  bankName?:       string | null;
  cardBrand?:      string | null;
  color:           string;
  isActive:        boolean;
  availableLimit?: number;
  utilizationPct?: number;
  statements?:     CardStatement[];
  createdAt:       string;
  updatedAt:       string;
}

export interface CardStatement {
  id:              string;
  creditCardId:    string;
  periodStart:     string;
  periodEnd:       string;
  statementAmount: number;
  minimumPayment:  number;
  dueDate:         string;
  isPaid:          boolean;
  paidAt?:         string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface Budget {
  id:          string;
  userId:      string;
  name:        string;
  category:    Category;
  amount:      number;
  period:      BudgetPeriod;
  year:        number;
  month?:      number | null;
  alertAt:     number;
  color:       string;
  spent?:      number;         // computed from transactions
  remaining?:  number;         // computed
  pct?:        number;         // computed %
  isOverBudget?: boolean;
  createdAt:   string;
  updatedAt:   string;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?:    T;
  error?:   string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data:     T[];
  total:    number;
  page:     number;
  pageSize: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface MonthlyData {
  label:   string;
  income:  number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdown {
  category:   Category;
  label:      string;
  amount:     number;
  percentage: number;
  color:      string;
}

export interface DashboardSummary {
  totalIncome:       number;
  totalExpense:      number;
  balance:           number;
  monthlyIncome:     number;
  monthlyExpense:    number;
  monthlySavings:    number;
  monthlyData:       MonthlyData[];
  categoryBreakdown: CategoryBreakdown[];
  balanceTrend:      { label: string; balance: number }[];
  upcomingPayments:  Payment[];
  overduePayments:   Payment[];
  forecastedBalance: number;
  budgetStatus:      BudgetStatus[];
}

export interface BudgetStatus {
  budget:  Budget;
  spent:   number;
  pct:     number;
  isAlert: boolean;
}

export interface ForecastMonth {
  label:             string;
  projectedIncome:   number;
  projectedExpense:  number;
  net:               number;
}

// ─── Filter params ────────────────────────────────────────────────────────────

export interface TransactionFilters {
  year?:        number;
  month?:       number;
  type?:        TransactionType;
  category?:    Category;
  search?:      string;
  creditCardId?: string;
  page?:        number;
  pageSize?:    number;
}

export interface PaymentFilters {
  filter?: "upcoming" | "overdue" | "this_month" | "completed" | "all";
  search?: string;
}

export interface BudgetFilters {
  year?:  number;
  month?: number;
}

// ─── Form input types ─────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  date:         string;
  description:  string;
  category:     Category;
  amount:       number;
  type:         TransactionType;
  notes?:       string;
  creditCardId?: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

export interface CreatePaymentInput {
  name:         string;
  description?: string;
  amount:       number;
  dueDate:      string;
  startDate:    string;
  endDate?:     string;
  category:     Category;
  status?:      PaymentStatus;
  notes?:       string;
}

export interface UpdatePaymentInput extends Partial<CreatePaymentInput> {
  id:           string;
  completed?:   boolean;
  completedAt?: string | null;
}

export interface CreateCreditCardInput {
  name:           string;
  lastFourDigits: string;
  network:        CardNetwork;
  creditLimit:    number;
  currentBalance: number;
  statementDate:  number;
  dueDate:        number;
  color:          string;
}

export interface UpdateCreditCardInput extends Partial<CreateCreditCardInput> {
  id: string;
}

export interface CreateBudgetInput {
  name:     string;
  category: Category;
  amount:   number;
  period:   BudgetPeriod;
  year:     number;
  month?:   number;
  alertAt?: number;
  color?:   string;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
}
// ─── Investments ──────────────────────────────────────────────────────────────

export type InvestmentType = "STOCK_TR" | "STOCK_US" | "GOLD" | "CURRENCY" | "FUND";

export interface Investment {
  id:             string;
  userId:         string;
  type:           InvestmentType;
  symbol:         string;
  name:           string;
  quantity:       number;
  buyPrice:       number;
  buyDate:        string;
  currentPrice?:  number | null;
  priceUpdatedAt?: string | null;
  notes?:         string | null;
  createdAt:      string;
  updatedAt:      string;
  // computed fields (API tarafında eklenir)
  totalCost?:     number;
  currentValue?:  number;
  profitLoss?:    number;
  profitLossPct?: number;
}

export interface CreateInvestmentInput {
  type:      InvestmentType;
  symbol:    string;
  name:      string;
  quantity:  number;
  buyPrice:  number;
  buyDate:   string;
  notes?:    string;
}

export interface UpdateInvestmentInput extends Partial<CreateInvestmentInput> {
  id: string;
}

export interface PriceHistoryPoint {
  date:  string;
  price: number;
}

