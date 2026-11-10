// Tipe bersama untuk seluruh modul auth.
// Sesuaikan nilai enum Role dengan isi kolom `role` di tabel users.
export enum Role {
  Admin = 'admin',
  Editor = 'editor',
  Scheduler = 'scheduler',
  Viewer = 'viewer',
}

// Bentuk objek yang ditempel ke request.user setelah token valid.
export interface AuthUser {
  userId: number;
  email: string;
  role: Role;
}

// Isi (klaim) di dalam JWT. `sub` adalah standar JWT untuk ID user.
export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
