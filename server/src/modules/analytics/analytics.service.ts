import { LoanAccount, CreditAccount, FinancialAnalytics } from '../../types';

export class AnalyticsService {
  static calculateAnalytics(
    creditAccounts: CreditAccount[],
    loanAccounts: LoanAccount[],
    monthlyIncome: number
  ): FinancialAnalytics {
    // 1. Credit Utilization
    const totalLimit = creditAccounts.reduce((sum, acc) => sum + acc.credit_limit, 0);
    const totalOutstanding = creditAccounts.reduce((sum, acc) => sum + acc.total_outstanding, 0);
    const utilization = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

    // 2. EMI Burden
    const totalEMI = loanAccounts.reduce((sum, acc) => sum + acc.emi_amount, 0);
    const emiBurden = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

    // 3. Debt-to-Income
    const totalDebt = totalOutstanding + loanAccounts.reduce((sum, acc) => sum + acc.remaining_balance, 0);
    const dti = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0;

    // 4. Interest Projection (Rough estimate: 3% monthly on outstanding)
    const projectedInterest = totalOutstanding * 0.03;

    // 5. Risk Level Engine
    let risk_level: FinancialAnalytics['risk_level'] = 'Low';
    
    const autopayDisabled = creditAccounts.some(acc => !acc.autopay_enabled);

    if (utilization > 70 || emiBurden > 50) {
      risk_level = 'High';
    } 
    
    if (emiBurden > 30 || utilization > 50) {
      risk_level = 'Moderate';
    }

    if (risk_level === 'High' && (autopayDisabled || utilization > 85)) {
      risk_level = 'Critical';
    }

    return {
      credit_utilization_ratio: Math.round(utilization),
      emi_burden_ratio: Math.round(emiBurden),
      debt_to_income_ratio: Math.round(dti),
      interest_projection: Math.round(projectedInterest),
      risk_level
    };
  }
}
