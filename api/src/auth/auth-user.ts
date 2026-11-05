export type Role = 'passageiro' | 'motorista';

export interface AuthUser {
  userId: string;
  role: Role;
}
