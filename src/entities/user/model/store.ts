import type { User } from '../../../shared/types';

export interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const initialUserState: UserStore = {
  user: null,
  isAuthenticated: false,
  loading: true,
};