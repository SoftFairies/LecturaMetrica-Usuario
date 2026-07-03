const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const API_PREFIX = "/api/v1";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  [key: string]: string | number | boolean | undefined;
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
  body?: unknown;
  formData?: FormData;
  query?: object;
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

// ---------------------------------------------------------------------------
// Auth / Users
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  name: string;
  lastname?: string;
  email: string;
  password: string;
  roleId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
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
  profilePicture?: PictureResponse | null;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Catálogos simples (authors, formats, genders, reading-status)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Catálogos con imagen (badges, pictures)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Library (librería personal del usuario autenticado)
// ---------------------------------------------------------------------------

export interface LibraryEnrollmentRequest {
  /** Para agregar un libro que YA existe en el catálogo (/books). */
  bookId?: string;
  /** Para dar de alta un libro nuevo al mismo tiempo que se enrola. */
  bookData?: BookRequest;
  readingStatusId?: number;
  currentPage?: number;
}

export interface BookCustomizationRequest {
  customTitle?: string;
  customChapters?: number;
  customPages?: number;
  customCoverType?: string;
  customCoverValue?: string;
}

export interface LibraryProgressRequest {
  readingStatusId?: number;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

export interface UserLibrary {
  id: string; // UUID
  user: UserResponse;
  book: BookResponse;
  readingStatus: ReadingStatusResponse;
  currentChapter?: number;
  currentPage?: number;
  /** En la respuesta el campo se llama "favorite", no "isFavorite". */
  favorite?: boolean;
}

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

// ---------------------------------------------------------------------------
// Preferences / Recommendations
// ---------------------------------------------------------------------------

export interface PreferenceItem {
  id: number;
  name: string;
}

export interface RecommendationRequest {
  formatIds?: number[];
  genreIds?: number[];
}

export interface RecommendationResponse {
  id: string; // UUID
  userId: string; // UUID
  formats: PreferenceItem[];
  genres: PreferenceItem[];
}


// ---------------------------------------------------------------------------
// Mailbox (cartas anónimas)
// ---------------------------------------------------------------------------

export interface MailboxSendRequest {
  bookId: string;
  content: string;
}

export interface MailboxLetterResponse {
  id: number;
  bookId: string;
  senderId: string;
  content: string;
  sentAt: string;
  unlockAt: string;
}

// ---------------------------------------------------------------------------
// Factories CRUD
// ---------------------------------------------------------------------------

function crudPlain<T>(basePath: string) {
  return {
    getAll: (params?: PageParams) => request<Page<T>>(basePath, { query: params }),
    getById: (id: number) => request<T>(`${basePath}/${id}`),
    create: (data: CatalogPlainRequest) =>
      request<T>(basePath, { method: "POST", body: data }),
    update: (id: number, data: UpdateCatalogPlainRequest) =>
      request<T>(`${basePath}/${id}`, { method: "PUT", body: data }),
    remove: (id: number) => request<void>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

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

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

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
    /** GET /api/v1/users/me */
    getMe: () => request<UserResponse>("/users/me"),
    /** PUT /api/v1/users/me */
    updateMe: (data: UpdateUserRequest) =>
      request<UserResponse>("/users/me", { method: "PUT", body: data }),
    /** DELETE /api/v1/users/me */
    deleteMe: () => request<void>("/users/me", { method: "DELETE" }),
    /** GET /api/v1/users — ADMIN */
    getAll: (params?: PageParams) => request<Page<UserResponse>>("/users", { query: params }),
    /** GET /api/v1/users/{id} — ADMIN */
    getById: (id: string) => request<UserResponse>(`/users/${id}`),
    /** POST /api/v1/users — ADMIN */
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
  pictures: {
    getAll: (params?: PageParams) => request<Page<PictureResponse>>("/pictures", { query: params }),
    getById: (id: number) => request<PictureResponse>(`/pictures/${id}`),
    create: (data: CatalogMultipartCreate) =>
      request<PictureResponse>("/pictures", {
        method: "POST",
        formData: toFormData({
          file: data.file,
          name: data.name,
          description: data.description ?? "Foto de perfil",
        }),
      }),
    update: (id: number, data: CatalogMultipartUpdate) =>
      request<PictureResponse>(`/pictures/${id}`, {
        method: "PUT",
        formData: toFormData(data),
      }),
    remove: (id: number) => request<void>(`/pictures/${id}`, { method: "DELETE" }),
  },

  /**
   * ⚠️ No confirmado contra el Swagger que revisamos juntos (no aparecía en
   * las 10 capturas). Si al probarlo te da 404, avísame la ruta real que
   * veas en Swagger y la corrijo.
   */
  gamification: {
    getMyBadges: () => request<BadgeResponse[]>("/gamification/me/badges"),
  },

  /** /api/v1/books — id = UUID */
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
    getAll: (params?: PageParams) => request<UserLibrary[]>("/library", { query: params }),
    /** POST /api/v1/library */
    add: (data: LibraryEnrollmentRequest) =>
      request<void>("/library", { method: "POST", body: data }),
    /** POST /api/v1/library/{id}/customization */
    customize: (id: string, data: BookCustomizationRequest) =>
      request<UserBookCustomization>(`/library/${id}/customization`, {
        method: "POST",
        body: data,
      }),
    /** PATCH /api/v1/library/{id} */
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

  /** /api/v1/mailbox */
  mailbox: {
  send: (data: { bookId: string; content: string }) =>
    request<void>("/mailbox/send", {
      method: "POST",
      body: data,
    }),

  getReceived: () =>
    request<any[]>("/mailbox/received"),
},
};

export default api;
