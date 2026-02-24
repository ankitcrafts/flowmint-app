import { FinancialParser, CreditAccount } from '../../types';

export class ManualFinancialParser implements FinancialParser {
  async parseCreditStatement(file: Buffer): Promise<Partial<CreditAccount>> {
    // MOCK IMPLEMENTATION: In a real app, use pdf-parse or an LLM-based vision/text extractor
    console.log('Mock parsing PDF of size:', file.length);
    
    return {
      issuer_name: 'Mock Bank',
      masked_card_number: 'XXXX-XXXX-XXXX-9999',
      credit_limit: 150000,
      total_outstanding: 25400,
      minimum_due: 1270,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }
}
