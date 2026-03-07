import { UserType } from './userType.entity';

export class User {
  public id: string;
  public name: string;
  public surname: string;
  public email: string;
  public street: string;
  public streetNumber: string;
  public apartment?: string;
  public additionalInfo?: string;
  public address?: string;
  public latitude?: number;
  public longitude?: number;
  public creditBalance?: number;
  public userType: UserType;
}

export interface LoginResponse {
  user: User;
  token: string;
}
