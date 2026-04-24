export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 401
export class TokenExpiredError extends AppError {
  constructor() {
    super("Oturum süresi doldu. Tekrar giriş yapın.", 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("Geçersiz oturum. Tekrar giriş yapın.", 401, "INVALID_TOKEN");
    this.name = "InvalidTokenError";
  }
}

// 403
export class ForbiddenError extends AppError {
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super("Hesabınız devre dışı bırakılmış.", 403, "ACCOUNT_DISABLED");
    this.name = "AccountDisabledError";
  }
}

// 404
export class UserNotFoundError extends AppError {
  constructor() {
    super("Kullanıcı bulunamadı.", 404, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class ListingNotFoundError extends AppError {
  constructor() {
    super("İlan bulunamadı.", 404, "LISTING_NOT_FOUND");
    this.name = "ListingNotFoundError";
  }
}

export class CategoryNotFoundError extends AppError {
  constructor() {
    super("Kategori bulunamadı.", 404, "CATEGORY_NOT_FOUND");
    this.name = "CategoryNotFoundError";
  }
}

// 409
export class SlugTakenError extends AppError {
  constructor() {
    super("Bu başlık zaten kullanımda, lütfen farklı bir başlık deneyin.", 409, "SLUG_TAKEN");
    this.name = "SlugTakenError";
  }
}

// 400
export class FileTooLargeError extends AppError {
  constructor() {
    super("Dosya 10 MB'dan küçük olmalıdır.", 400, "FILE_TOO_LARGE");
    this.name = "FileTooLargeError";
  }
}

export class InvalidFileTypeError extends AppError {
  constructor() {
    super("Yalnızca JPEG, PNG ve WebP görseller yüklenebilir.", 400, "INVALID_FILE_TYPE");
    this.name = "InvalidFileTypeError";
  }
}

export class TooManyPhotosError extends AppError {
  constructor() {
    super("İlan başına en fazla 6 fotoğraf yükleyebilirsiniz.", 400, "TOO_MANY_PHOTOS");
    this.name = "TooManyPhotosError";
  }
}

// 409
export class FavoriteAlreadyExistsError extends AppError {
  constructor() {
    super("Bu ilan zaten favorilerinizde.", 409, "FAVORITE_ALREADY_EXISTS");
    this.name = "FavoriteAlreadyExistsError";
  }
}

export class NoWhatsappError extends AppError {
  constructor() {
    super("İlan verebilmek için WhatsApp numarası gereklidir.", 422, "NO_WHATSAPP");
    this.name = "NoWhatsappError";
  }
}

// 502
export class OAuthError extends AppError {
  constructor(detail: string) {
    super(detail, 502, "OAUTH_ERROR");
    this.name = "OAuthError";
  }
}
