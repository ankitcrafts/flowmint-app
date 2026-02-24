export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreditAccount {
  id: string;
  issuer_name: string;
  masked_card_number: string;
  credit_limit: number;
  total_outstanding: number;
  minimum_due: number;
  due_date: string;
  autopay_enabled: boolean;
}

export interface LoanAccount {
  id: string;
  lender_name: string;
  loan_type: string;
  principal_amount: number;
  remaining_balance: number;
  emi_amount: number;
  emi_due_date: number;
}

export interface FinancialAnalytics {
  credit_utilization_ratio: number;
  emi_burden_ratio: number;
  debt_to_income_ratio: number;
  interest_projection: number;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface FinancialParser {
  parseCreditStatement(file: Buffer): Promise<Partial<CreditAccount>>;
}
