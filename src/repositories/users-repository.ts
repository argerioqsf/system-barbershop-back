import { Prisma, Profile, User } from "@prisma/client";

export interface UsersRepository {
  findById(id: string): Promise<(Omit<User, "password"> & { profile: Omit<Profile, "userId"> | null }) | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  findMany(page: number, query?: string): Promise<(Omit<User, "password"> & { profile: Omit<Profile, "userId"> | null })[]>;
  count(query?: string): Promise<number>;
  findManyIndicator(page: number, query?: string): Promise<(Omit<User, "password"> & { profile: Omit<Profile, "userId"> | null })[]>;
  findManyConsultant(page: number, query?: string): Promise<(Omit<User, "password"> & { profile: Omit<Profile, "userId"> | null })[]>;
  countIndicator(query?: string): Promise<number>;
  countConsultant(query?: string): Promise<number>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  mountSelect(): Promise<Omit<User, "email" | "password" | "active">[]>;
  mountSelectIndicator(): Promise<Omit<User, "email" | "password" | "active">[]>;
}
