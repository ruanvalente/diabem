export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
};
