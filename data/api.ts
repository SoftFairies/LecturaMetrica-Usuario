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
  id: string; 
  name: string;
  lastname?: string;
  email: string;
  roleName: string;
  pictureId?: number;
  pictureUrl?: string;
  active: boolean;
}

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

export interface EntityReferenceRequest {
  
  id?: number;
  
  name?: string;
}

export interface CreateBookRequest {
  isbn?: string;
  title: string;
  authors?: EntityReferenceRequest[];
  genres?: EntityReferenceRequest[];
  cover?: string;
}

export interface BookResponse {
  id: string; 
  isbn?: string;
  title: string;
  authors: AuthorResponse[];
  genres: GenderResponse[];
  cover?: string;
}

export interface AddLibraryEntryRequest {
  
  bookId?: string;
  
  newBook?: CreateBookRequest;
  
  readingStatusId: number;
  
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
  id: string; 
  book: BookResponse;
  readingStatusName: string;
  formatName: string;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

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

export interface ReadingSessionRequest {
  
  libraryId: string;
  
  date: string;
  secondsRead?: number;
  pagesRead?: number;
  chaptersRead?: number;
}

export interface ReadingSessionResponse {
  id: string;
  libraryId: string;
  date: string;
  secondsRead?: number;
  pagesRead?: number;
  chaptersRead?: number;
}

export interface PreferenceItem {
  id: number;
  name: string;
}

export interface RecommendationRequest {
  formatIds?: number[];
  genreIds?: number[];
}

export interface RecommendationResponse {
  id: string; 
  userId: string; 
  formats: PreferenceItem[];
  genres: PreferenceItem[];
}

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

export interface UserBadgeResponse {
  badgeId: number;
  name: string;
  description?: string;
  url: string;
  earnedAt: string;
}

export interface UserStreakResponse {
  id: string;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate: string;
}

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
    
    create: (data: CatalogMultipartCreate) =>
      request<T>(basePath, { method: "POST", formData: toFormData(data) }),
    
    update: (id: number, data: CatalogMultipartUpdate) =>
      request<T>(basePath + "/" + id, { method: "PUT", formData: toFormData(data) }),
    
    remove: (id: number) => request<void>(basePath + "/" + id, { method: "DELETE" }),
  };
}

export const api = {
  auth: {
    
    register: (data: RegisterRequest) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: data, auth: false }),
    
    login: (data: LoginRequest) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: data, auth: false }),
  },

  users: {
    
    getMe: () => request<UserResponse>("/users/me"),
    
    updateMe: (data: UpdateUserRequest) =>
      request<UserResponse>("/users/me", { method: "PUT", body: data }),
    
    deleteMe: () => request<void>("/users/me", { method: "DELETE" }),
    
    getAll: (params?: PageParams) => request<Page<UserResponse>>("/users", { query: params }),
    
    getById: (id: string) => request<UserResponse>("/users/" + id),
    
    update: (id: string, data: UpdateUserRequest) =>
      request<UserResponse>("/users/" + id, { method: "PUT", body: data }),
    
    create: (data: RegisterRequest) =>
      request<AuthResponse>("/users", { method: "POST", body: data }),
  },

  
  authors: crudPlain<AuthorResponse>("/authors"),
  
  formats: crudPlain<FormatResponse>("/formats"),
  
  genders: crudPlain<GenderResponse>("/genders"),
  
  readingStatus: crudPlain<ReadingStatusResponse>("/reading-status"),
  
  badges: crudMultipart<BadgeResponse>("/badges"),

  
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

  
  gamification: {
    getMyBadges: () => request<UserBadgeResponse[]>("/gamification/me/badges"),
  },

  
  streaks: {
    getMine: () => request<UserStreakResponse>("/streaks/me"),
  },

  
  reports: {
    
    getDashboard: () => request<DashboardReportResponse>("/reports/dashboard"),
  },

  
  books: {
    
    getAll: (params?: PageParams) => request<Page<BookResponse>>("/books", { query: params }),
    getById: (id: string) => request<BookResponse>("/books/" + id),
    
    search: (q: string) => request<BookResponse[]>("/books/search", { query: { q } }),
    
    create: (data: CreateBookRequest) =>
      request<BookResponse>("/books", { method: "POST", body: data }),
    remove: (id: string) => request<void>("/books/" + id, { method: "DELETE" }),
  },

  
  library: {
    
    getAll: (params?: PageParams) =>
      request<Page<LibraryEntryResponse>>("/library", { query: params }),
    
    add: (data: AddLibraryEntryRequest) =>
      request<void>("/library", { method: "POST", body: data }),
    
    updateProgress: (id: string, data: UpdateLibraryEntryRequest) =>
      request<void>("/library/" + id, { method: "PATCH", body: data }),
    
    remove: (id: string) => request<void>("/library/" + id, { method: "DELETE" }),
    
    getNotes: (libraryId: string) =>
      request<LibraryNoteResponse[]>("/library/" + libraryId + "/notes"),
    
    addNote: (libraryId: string, data: LibraryNoteRequest) =>
      request<LibraryNoteResponse>("/library/" + libraryId + "/notes", {
        method: "POST",
        body: data,
      }),
  },

  
  readingSessions: {
  
    create: (data: ReadingSessionRequest) =>
      request<ReadingSessionResponse>("/reading-sessions", { method: "POST", body: data }),
  },

  preferences: {
    get: () => request<RecommendationResponse>("/preferences"),
    update: (data: RecommendationRequest) =>
      request<void>("/preferences", { method: "PUT", body: data }),
    create: (data: RecommendationRequest) =>
      request<void>("/preferences", { method: "POST", body: data }),
    getRecommendations: () => request<BookResponse[]>("/preferences/recommendations"),
  },

  mailbox: {
    send: (data: SendLetterRequest) =>
      request<void>("/mailbox/send", { method: "POST", body: data }),
    getReceived: () => request<LetterResponse[]>("/mailbox/received"),
  },
};

export default api;
