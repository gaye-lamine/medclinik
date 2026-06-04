import { Patient } from '../types/billing';

export class PatientService {
  constructor(private apiFetch: (path: string, options?: RequestInit) => Promise<any>) {}

  async searchPatients(query: string): Promise<Patient[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.apiFetch(`/patients/search?q=${encodeURIComponent(query)}`);
  }
}
