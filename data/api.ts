/**
 * data/api.ts
 *
 * Capa única de acceso a la API REST del backend (SoftFairies/Backend, rama feature/).
 * Generado y verificado 1:1 contra el OpenAPI real desplegado en:
 *   https://users-production-2f97.up.railway.app/v3/api-docs
 *
 * Módulos: auth, user, author, badge, format, gender, picture, readingStatus,
 *   book, library, preferences (recommendation-routing).
 *
 * Notas importantes confirmadas por el spec:
 *   - Los IDs de author/badge/format/gender/picture/readingStatus son Long (number).
 *   - Los IDs de user/book/library/preferences son UUID (string).
 *   - GET /api/v1/library devuelve un array plano (UserLibrary[]), no paginado.
 *   - GET /api/v1/preferences devuelve un RecommendationResponse (tus preferencias
 *     actuales); GET /api/v1/preferences/recommendations devuelve BookResponse[]
 *     (las recomendaciones calculadas a partir de esas preferencias).
 *
 * Configuración requerida:
 *   - Define NEXT_PUBLIC_API_URL en tu .env.local
 *     Ej: NEXT_PUBLIC_API_URL=https://users-production-2f97.up.railway.app
 *     Si no se define, se usa http://localhost:8080 por defecto.
 *
 * Uso:
 *   import { api } from "@/data/api";
 *   const { token } = await api.auth.login({ email, password });
 *   const libros = await api.authors.getAll({ page: 0, size: 10 });
 */

// ============================================================
// Configuración base
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
// ⚠️ Por defecto es "" (ruta relativa). El navegador llama a
// /api/v1/... en TU MISMO dominio (localhost:3000), y next.config.js
// se encarga de reenviar esas peticiones al backend real (Railway)
// server-to-server, evitando CORS por completo sin tocar el backend.
//
// Si prefieres llamar directo al backend (sin proxy), define
// NEXT_PUBLIC_API_URL en .env.local — en ese caso el backend SÍ
// necesita CORS configurado para tu origen.

const API_PREFIX = "/api/v1";

// ============================================================
// Tipos compartidos
// ============================================================

/** Respuesta paginada de Spring Data (org.springframework.data.domain.Page) */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string; // ej: "name,asc"
}

export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
  errors?: Record<string, string>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;
  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ============================================================
// Manejo del token (JWT)
// ============================================================

const TOKEN_KEY = "lecturametrica_token";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

// ============================================================
// Cliente HTTP base
// ============================================================

function buildQuery<T extends object>(params?: T): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) usp.append(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown; // se serializa a JSON
  formData?: FormData; // si viene, se envía como multipart/form-data
  query?: object;
  /** Adjunta el header Authorization: Bearer <token>. Default: true */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, auth = true } = options;

  const url = `${API_BASE_URL}${API_PREFIX}${path}${buildQuery(query)}`;

  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStorage.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data && (data.message as string)) || response.statusText,
      data
    );
  }

  return data as T;
}

function toFormData<T extends object>(fields: T): FormData {
  const fd = new FormData();
  Object.entries(fields as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value as string | Blob);
  });
  return fd;
}

// ============================================================
// Módulo: auth  (/api/v1/auth)  — público, sin token
// ============================================================

export interface RegisterRequest {
  name: string;
  lastname?: string;
  email: string;
  password: string;
  roleId?: string; // UUID
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string; // UUID
  email: string;
  role: string;
  token: string;
}

// ============================================================
// Módulo: user  (/api/v1/users)
// ============================================================

export interface UpdateUserRequest {
  name: string;
  lastname?: string;
  email?: string;
  password?: string;
  pictureId?: number;
}

export interface UserResponse {
  id: string; // UUID
  name: string;
  lastname?: string;
  email: string;
  roleName: string;
  pictureId?: number;
  pictureUrl?: string;
  active: boolean;
}

// ============================================================
// Catálogos "planos" (name + description): author, format,
// gender, readingStatus
// ============================================================

export interface CatalogPlainRequest {
  name: string;
  description?: string;
}

export interface UpdateCatalogPlainRequest {
  name?: string;
  description?: string;
}

export interface AuthorResponse {
  id: number;
  name: string;
  description?: string;
}

export interface FormatResponse {
  id: number;
  name: string;
  description?: string;
}

export interface GenderResponse {
  id: number;
  name: string;
  description?: string;
}

export interface ReadingStatusResponse {
  id: number;
  name: string;
  description?: string;
}

// ============================================================
// Catálogos con imagen (multipart): badge, picture
// ============================================================

export interface BadgeResponse {
  id: number;
  name: string;
  description?: string;
  url: string;
}

export interface PictureResponse {
  id: number;
  name: string;
  url: string;
}

export interface CatalogMultipartCreate {
  file: File;
  name: string;
  description?: string;
}

export interface CatalogMultipartUpdate {
  file?: File;
  name?: string;
  description?: string;
}

// ============================================================
// Helpers genéricos de CRUD (evitan repetir lo mismo 4 veces)
// ============================================================

// ============================================================
// Módulo: book  (/api/v1/books) — catálogo de libros
// ✅ Tipos confirmados con el OpenAPI real (id = UUID, no number)
// ============================================================

export interface BookRequest {
  isbn?: string;
  title: string;
  defaultChapters?: number;
  defaultPages?: number;
  origin: string;
  coverType: string;
  coverValue: string;
  formatId: number;
  authorIds?: number[];
  genreIds?: number[];
}

export interface BookResponse {
  id: string; // UUID
  isbn?: string;
  title: string;
  defaultChapters?: number;
  defaultPages?: number;
  origin?: string;
  coverType?: string;
  coverValue?: string;
  format: FormatResponse;
  authors: AuthorResponse[];
  genres: GenderResponse[];
}

// ============================================================
// Módulo: library  (/api/v1/library) — biblioteca personal del
// usuario autenticado. ✅ Tipos confirmados con el OpenAPI real.
// ============================================================

/** POST /api/v1/library — agrega un libro (existente o nuevo) a tu biblioteca */
export interface LibraryEnrollmentRequest {
  /** UUID de un libro ya existente en el catálogo */
  bookId?: string;
  /** Datos para crear el libro sobre la marcha si no existe en el catálogo */
  bookData?: BookRequest;
  readingStatusId?: number;
  currentPage?: number;
}

/** POST /api/v1/library/{id}/customization */
export interface BookCustomizationRequest {
  customTitle?: string;
  customChapters?: number;
  customPages?: number;
  customCoverType?: string;
  customCoverValue?: string;
}

/** PATCH /api/v1/library/{id} — progreso de lectura */
export interface LibraryProgressRequest {
  readingStatusId?: number;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

/** Entrada de la biblioteca del usuario (GET /api/v1/library) */
export interface UserLibrary {
  id: string; // UUID
  user: UserResponse;
  book: BookResponse;
  readingStatus: ReadingStatusResponse;
  currentChapter?: number;
  currentPage?: number;
  favorite?: boolean;
}

/** Respuesta de POST /api/v1/library/{id}/customization */
export interface UserBookCustomization {
  id: string; // UUID
  user: UserResponse;
  book: BookResponse;
  customTitle?: string;
  customChapters?: number;
  customPages?: number;
  customCoverType?: string;
  customCoverValue?: string;
}

// ============================================================
// Módulo: preferences / recommendation (/api/v1/preferences)
// ✅ Tipos confirmados con el OpenAPI real.
// ============================================================

export interface PreferenceItem {
  id: number;
  name: string;
}

/** PUT y POST /api/v1/preferences */
export interface RecommendationRequest {
  formatIds?: number[];
  genreIds?: number[];
}

/** GET /api/v1/preferences */
export interface RecommendationResponse {
  id: string; // UUID
  userId: string; // UUID
  formats: PreferenceItem[];
  genres: PreferenceItem[];
}

// ============================================================
// Helpers genéricos de CRUD (evitan repetir lo mismo 4 veces)
// ============================================================

/** CRUD para catálogos simples: { name, description } sin imagen */
function crudPlain<T>(basePath: string) {
  return {
    getAll: (params?: PageParams) => request<Page<T>>(basePath, { query: params }),
    getById: (id: number) => request<T>(`${basePath}/${id}`),
    /** Requiere rol ADMIN en el backend */
    create: (data: CatalogPlainRequest) =>
      request<T>(basePath, { method: "POST", body: data }),
    /** Requiere rol ADMIN en el backend */
    update: (id: number, data: UpdateCatalogPlainRequest) =>
      request<T>(`${basePath}/${id}`, { method: "PUT", body: data }),
    /** Requiere rol ADMIN en el backend */
    remove: (id: number) => request<void>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

/** CRUD para catálogos con imagen (multipart/form-data) */
function crudMultipart<T>(basePath: string) {
  return {
    getAll: (params?: PageParams) => request<Page<T>>(basePath, { query: params }),
    getById: (id: number) => request<T>(`${basePath}/${id}`),
    /** Requiere rol ADMIN en el backend */
    create: (data: CatalogMultipartCreate) =>
      request<T>(basePath, { method: "POST", formData: toFormData(data) }),
    /** Requiere rol ADMIN en el backend */
    update: (id: number, data: CatalogMultipartUpdate) =>
      request<T>(`${basePath}/${id}`, { method: "PUT", formData: toFormData(data) }),
    /** Requiere rol ADMIN en el backend */
    remove: (id: number) => request<void>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

// ============================================================
// API pública — todos los recursos que el frontend consume
// ============================================================

export const api = {
  auth: {
    /** POST /api/v1/auth/register */
    register: (data: RegisterRequest) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: data, auth: false }),
    /** POST /api/v1/auth/login */
    login: (data: LoginRequest) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: data, auth: false }),
  },

  users: {
    /** GET /api/v1/users/me — usuario autenticado actual */
    getMe: () => request<UserResponse>("/users/me"),
    /** PUT /api/v1/users/me — actualiza al usuario autenticado */
    updateMe: (data: UpdateUserRequest) =>
      request<UserResponse>("/users/me", { method: "PUT", body: data }),
    /** DELETE /api/v1/users/me — elimina (soft delete) al usuario autenticado */
    deleteMe: () => request<void>("/users/me", { method: "DELETE" }),
    /** GET /api/v1/users — requiere rol ADMIN */
    getAll: (params?: PageParams) => request<Page<UserResponse>>("/users", { query: params }),
    /** GET /api/v1/users/{id} — requiere rol ADMIN */
    getById: (id: string) => request<UserResponse>(`/users/${id}`),
    /** POST /api/v1/users — crea usuario, requiere rol ADMIN */
    create: (data: RegisterRequest) =>
      request<AuthResponse>("/users", { method: "POST", body: data }),
  },

  /** /api/v1/authors */
  authors: crudPlain<AuthorResponse>("/authors"),

  /** /api/v1/formats */
  formats: crudPlain<FormatResponse>("/formats"),

  /** /api/v1/genders */
  genders: crudPlain<GenderResponse>("/genders"),

  /** /api/v1/reading-status */
  readingStatus: crudPlain<ReadingStatusResponse>("/reading-status"),

  /** /api/v1/badges (con imagen) */
  badges: crudMultipart<BadgeResponse>("/badges"),

  /** /api/v1/pictures (con imagen) */
  pictures: crudMultipart<PictureResponse>("/pictures"),

  /** /api/v1/books (catálogo de libros, CRUD completo) — id = UUID */
  books: {
    getAll: (params?: PageParams) => request<Page<BookResponse>>("/books", { query: params }),
    getById: (id: string) => request<BookResponse>(`/books/${id}`),
    create: (data: BookRequest) => request<BookResponse>("/books", { method: "POST", body: data }),
    update: (id: string, data: BookRequest) =>
      request<BookResponse>(`/books/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<void>(`/books/${id}`, { method: "DELETE" }),
  },

  /** /api/v1/library — biblioteca personal del usuario autenticado (ids = UUID) */
  library: {
    /** GET /api/v1/library — devuelve un array plano, no paginado */
    getAll: (params?: PageParams) =>
      request<UserLibrary[]>("/library", { query: params }),
    /** POST /api/v1/library — agrega un libro (existente o nuevo) a la biblioteca */
    add: (data: LibraryEnrollmentRequest) =>
      request<void>("/library", { method: "POST", body: data }),
    /** POST /api/v1/library/{id}/customization */
    customize: (id: string, data: BookCustomizationRequest) =>
      request<UserBookCustomization>(`/library/${id}/customization`, {
        method: "POST",
        body: data,
      }),
    /** PATCH /api/v1/library/{id} — actualiza el progreso de lectura */
    updateProgress: (id: string, data: LibraryProgressRequest) =>
      request<void>(`/library/${id}`, { method: "PATCH", body: data }),
    /** DELETE /api/v1/library/{id} */
    remove: (id: string) => request<void>(`/library/${id}`, { method: "DELETE" }),
  },

  /** /api/v1/preferences — preferencias de lectura del usuario autenticado */
  preferences: {
    /** GET /api/v1/preferences */
    get: () => request<RecommendationResponse>("/preferences"),
    /** PUT /api/v1/preferences */
    update: (data: RecommendationRequest) =>
      request<void>("/preferences", { method: "PUT", body: data }),
    /** POST /api/v1/preferences */
    create: (data: RecommendationRequest) =>
      request<void>("/preferences", { method: "POST", body: data }),
    /** GET /api/v1/preferences/recommendations */
    getRecommendations: () => request<BookResponse[]>("/preferences/recommendations"),
  },
};

export default api;
