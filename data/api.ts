const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const API_PREFIX = "/api/v1";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPage: number;
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
  /** Búsqueda en /genders, /authors, /books (paginado) */
  query?: string;
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
  return qs ? "?" + qs : "";
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

  const url = API_BASE_URL + API_PREFIX + path + buildQuery(query);

  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStorage.get();
    if (token) headers["Authorization"] = "Bearer " + token;
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
  annualGoal?: string;
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
// El libro YA NO tiene páginas ni formato propio. Autores/géneros se mandan
// como "entidad" (EntityReferenceRequest): si ya existe, manda su id; si es
// nuevo, manda solo el name y el backend lo crea sobre la marcha.
// ---------------------------------------------------------------------------

export interface EntityReferenceRequest {
  /** Si el autor/género ya existe en catálogo */
  id?: number;
  /** Si es nuevo (el backend lo crea) */
  name?: string;
}

/** POST /api/v1/books — alta manual de un libro en el catálogo global */
export interface CreateBookRequest {
  isbn?: string;
  title: string;
  authors?: EntityReferenceRequest[];
  genres?: EntityReferenceRequest[];
  cover?: string;
}

export interface BookResponse {
  id: string; // UUID
  isbn?: string;
  title: string;
  authors: AuthorResponse[];
  genres: GenderResponse[];
  cover?: string;
}

// ---------------------------------------------------------------------------
// Library (librería personal del usuario autenticado)
// Ahora pagina, y formatId/readingStatusId son obligatorios al agregar un
// libro a tu biblioteca (antes vivían en el libro).
// ---------------------------------------------------------------------------

export interface AddLibraryEntryRequest {
  /** UUID de un libro que YA existe en el catálogo (/books) */
  bookId?: string;
  /** Para dar de alta un libro nuevo al mismo tiempo que se agrega */
  newBook?: CreateBookRequest;
  /** OBLIGATORIO */
  readingStatusId: number;
  /** OBLIGATORIO — antes vivía en el libro, ahora es de tu entrada personal */
  formatId: number;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

export interface UpdateLibraryEntryRequest {
  readingStatusId?: number;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

export interface LibraryEntryResponse {
  id: string; // UUID
  book: BookResponse;
  readingStatusName: string;
  formatName: string;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

/** POST/GET /api/v1/library/{libraryId}/notes — notas reales del backend */
export interface LibraryNoteRequest {
  content: string;
  chapter?: number;
  page?: number;
}

export interface LibraryNoteResponse {
  id: number;
  content: string;
  chapter?: number;
  page?: number;
  bookTitle: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Reading Sessions (registro de sesiones de lectura)
// ---------------------------------------------------------------------------

export interface ReadingSessionRequest {
  /** UUID de la entrada de biblioteca (LibraryEntryResponse.id) */
  libraryId: string;
  /** Fecha de la sesión, formato "YYYY-MM-DD" */
  date: string;
  secondsRead?: number;
  pagesRead?: number;
  chaptersRead?: number;
}

/**
 * ⚠️ El Swagger que revisamos no mostraba el schema de respuesta (solo el
 * request body de ejemplo). Esta forma es una suposición razonable — si el
 * backend regresa algo distinto, avísame y la ajusto.
 */
export interface ReadingSessionResponse {
  id: string;
  libraryId: string;
  date: string;
  secondsRead?: number;
  pagesRead?: number;
  chaptersRead?: number;
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

export interface SendLetterRequest {
  bookId: string;
  content: string;
}

export interface LetterResponse {
  id: number;
  bookId: string;
  senderId: string;
  content: string;
  sentAt: string;
  unlockAt: string;
}

// ---------------------------------------------------------------------------
// Gamification (insignias obtenidas por el usuario)
// ---------------------------------------------------------------------------

export interface UserBadgeResponse {
  badgeId: number;
  name: string;
  description?: string;
  url: string;
  earnedAt: string;
}

// ---------------------------------------------------------------------------
// Streaks (racha de actividad)
// ---------------------------------------------------------------------------

export interface UserStreakResponse {
  id: string;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate: string;
}


// ---------------------------------------------------------------------------
// Reports / Dashboard
// ---------------------------------------------------------------------------

export interface WeeklyReadingMinuteResponse {
  day: string;
  minutes: number;
}

export interface MonthlyPagesReadResponse {
  day: number;
  pages: number;
}

export interface LibraryDistributionResponse {
  completed: number;
  inProgress: number;
  toRead: number;
}

export interface AnnualProgressResponse {
  month: string;
  books: number;
}

export interface DashboardReportResponse {
  estimatedMinutesTotal: number;
  completedBooks: number;
  annualGoal: number;
  currentStreak: number;
  pagesPerDayAvg: number;
  weeklyReadingMinutes: WeeklyReadingMinuteResponse[];
  monthlyPagesRead: MonthlyPagesReadResponse[];
  libraryDistribution: LibraryDistributionResponse;
  annualProgress: AnnualProgressResponse[];
}

// ---------------------------------------------------------------------------
// Factories CRUD
// ---------------------------------------------------------------------------

function crudPlain<T>(basePath: string) {
  return {
    getAll: (params?: PageParams) => request<Page<T>>(basePath, { query: params }),
    getById: (id: number) => request<T>(basePath + "/" + id),
    create: (data: CatalogPlainRequest) =>
      request<T>(basePath, { method: "POST", body: data }),
    update: (id: number, data: UpdateCatalogPlainRequest) =>
      request<T>(basePath + "/" + id, { method: "PUT", body: data }),
    remove: (id: number) => request<void>(basePath + "/" + id, { method: "DELETE" }),
  };
}

function crudMultipart<T>(basePath: string) {
  return {
    getAll: (params?: PageParams) => request<Page<T>>(basePath, { query: params }),
    getById: (id: number) => request<T>(basePath + "/" + id),
    /** Requiere rol ADMIN en el backend */
    create: (data: CatalogMultipartCreate) =>
      request<T>(basePath, { method: "POST", formData: toFormData(data) }),
    /** Requiere rol ADMIN en el backend */
    update: (id: number, data: CatalogMultipartUpdate) =>
      request<T>(basePath + "/" + id, { method: "PUT", formData: toFormData(data) }),
    /** Requiere rol ADMIN en el backend */
    remove: (id: number) => request<void>(basePath + "/" + id, { method: "DELETE" }),
  };
}

// ---------------------------------------------------------------------------
// API — verificado contra el OpenAPI completo más reciente
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
    /** PUT /api/v1/users/me (ahora acepta annualGoal) */
    updateMe: (data: UpdateUserRequest) =>
      request<UserResponse>("/users/me", { method: "PUT", body: data }),
    /** DELETE /api/v1/users/me */
    deleteMe: () => request<void>("/users/me", { method: "DELETE" }),
    /** GET /api/v1/users — ADMIN */
    getAll: (params?: PageParams) => request<Page<UserResponse>>("/users", { query: params }),
    /** GET /api/v1/users/{id} — ADMIN */
    getById: (id: string) => request<UserResponse>("/users/" + id),
    /** PUT /api/v1/users/{id} — ADMIN */
    update: (id: string, data: UpdateUserRequest) =>
      request<UserResponse>("/users/" + id, { method: "PUT", body: data }),
    /** POST /api/v1/users — ADMIN */
    create: (data: RegisterRequest) =>
      request<AuthResponse>("/users", { method: "POST", body: data }),
  },

  /** /api/v1/authors — ahora con búsqueda opcional vía ?query= */
  authors: crudPlain<AuthorResponse>("/authors"),
  /** /api/v1/formats */
  formats: crudPlain<FormatResponse>("/formats"),
  /** /api/v1/genders — ahora con búsqueda opcional vía ?query= */
  genders: crudPlain<GenderResponse>("/genders"),
  /** /api/v1/reading-status */
  readingStatus: crudPlain<ReadingStatusResponse>("/reading-status"),
  /** /api/v1/badges (con imagen) */
  badges: crudMultipart<BadgeResponse>("/badges"),

  /** /api/v1/pictures (con imagen) */
  pictures: {
    getAll: (params?: PageParams) => request<Page<PictureResponse>>("/pictures", { query: params }),
    getById: (id: number) => request<PictureResponse>("/pictures/" + id),
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
      request<PictureResponse>("/pictures/" + id, {
        method: "PUT",
        formData: toFormData(data),
      }),
    remove: (id: number) => request<void>("/pictures/" + id, { method: "DELETE" }),
  },

  /** GET /api/v1/gamification/me/badges — insignias REALMENTE obtenidas por el usuario */
  gamification: {
    getMyBadges: () => request<UserBadgeResponse[]>("/gamification/me/badges"),
  },

  /** GET /api/v1/streaks/me — racha de actividad real del usuario */
  streaks: {
    getMine: () => request<UserStreakResponse>("/streaks/me"),
  },

  /** /api/v1/reports */
  reports: {
    /** GET /api/v1/reports/dashboard */
    getDashboard: () => request<DashboardReportResponse>("/reports/dashboard"),
  },

  /**
   * /api/v1/books — id = UUID. El libro YA NO tiene páginas ni formato
   * (eso ahora vive en la entrada de biblioteca, ver `library.add`).
   */
  books: {
    /** GET /api/v1/books — soporta ?query= para buscar en el catálogo ya cacheado */
    getAll: (params?: PageParams) => request<Page<BookResponse>>("/books", { query: params }),
    getById: (id: string) => request<BookResponse>("/books/" + id),
    /** GET /api/v1/books/search?q=... — búsqueda con caché local + API externa (Google Books, etc.) */
    search: (q: string) => request<BookResponse[]>("/books/search", { query: { q } }),
    /** POST /api/v1/books — 201 Created */
    create: (data: CreateBookRequest) =>
      request<BookResponse>("/books", { method: "POST", body: data }),
    remove: (id: string) => request<void>("/books/" + id, { method: "DELETE" }),
  },

  /** /api/v1/library — biblioteca personal del usuario autenticado (ids = UUID) */
  library: {
    /** GET /api/v1/library — pagina (Page<LibraryEntryResponse>) */
    getAll: (params?: PageParams) =>
      request<Page<LibraryEntryResponse>>("/library", { query: params }),
    /** POST /api/v1/library — formatId y readingStatusId son OBLIGATORIOS */
    add: (data: AddLibraryEntryRequest) =>
      request<void>("/library", { method: "POST", body: data }),
    /** PATCH /api/v1/library/{id} — progreso / estado / favorito */
    updateProgress: (id: string, data: UpdateLibraryEntryRequest) =>
      request<void>("/library/" + id, { method: "PATCH", body: data }),
    /** DELETE /api/v1/library/{id} */
    remove: (id: string) => request<void>("/library/" + id, { method: "DELETE" }),
    /** GET /api/v1/library/{libraryId}/notes */
    getNotes: (libraryId: string) =>
      request<LibraryNoteResponse[]>("/library/" + libraryId + "/notes"),
    /** POST /api/v1/library/{libraryId}/notes */
    addNote: (libraryId: string, data: LibraryNoteRequest) =>
      request<LibraryNoteResponse>("/library/" + libraryId + "/notes", {
        method: "POST",
        body: data,
      }),
  },

  /**
   * /api/v1/reading-sessions — registra una sesión de lectura (tiempo,
   * páginas y capítulos leídos en una fecha dada) para una entrada de
   * biblioteca (`libraryId`).
   */
  readingSessions: {
    /** POST /api/v1/reading-sessions */
    create: (data: ReadingSessionRequest) =>
      request<ReadingSessionResponse>("/reading-sessions", { method: "POST", body: data }),
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
    /** POST /api/v1/mailbox/send */
    send: (data: SendLetterRequest) =>
      request<void>("/mailbox/send", { method: "POST", body: data }),
    /** GET /api/v1/mailbox/received */
    getReceived: () => request<LetterResponse[]>("/mailbox/received"),
  },
};

export default api;
