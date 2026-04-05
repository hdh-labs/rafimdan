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
    super("Token has expired", 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("Invalid or malformed token", 401, "INVALID_TOKEN");
    this.name = "InvalidTokenError";
  }
}

// 403
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super("Account is disabled", 403, "ACCOUNT_DISABLED");
    this.name = "AccountDisabledError";
  }
}

// 404
export class UserNotFoundError extends AppError {
  constructor() {
    super("User not found", 404, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class ListingNotFoundError extends AppError {
  constructor() {
    super("Listing not found", 404, "LISTING_NOT_FOUND");
    this.name = "ListingNotFoundError";
  }
}

export class CategoryNotFoundError extends AppError {
  constructor() {
    super("Category not found", 404, "CATEGORY_NOT_FOUND");
    this.name = "CategoryNotFoundError";
  }
}

// 409
export class SlugTakenError extends AppError {
  constructor() {
    super("This slug is already taken", 409, "SLUG_TAKEN");
    this.name = "SlugTakenError";
  }
}

// 400
export class FileTooLargeError extends AppError {
  constructor() {
    super("File must be smaller than 10MB", 400, "FILE_TOO_LARGE");
    this.name = "FileTooLargeError";
  }
}

export class InvalidFileTypeError extends AppError {
  constructor() {
    super("Only JPEG, PNG and WebP images are allowed", 400, "INVALID_FILE_TYPE");
    this.name = "InvalidFileTypeError";
  }
}

export class TooManyPhotosError extends AppError {
  constructor() {
    super("Maximum 6 photos per listing", 400, "TOO_MANY_PHOTOS");
    this.name = "TooManyPhotosError";
  }
}

// 409
export class FavoriteAlreadyExistsError extends AppError {
  constructor() {
    super("Already in favorites", 409, "FAVORITE_ALREADY_EXISTS");
    this.name = "FavoriteAlreadyExistsError";
  }
}

// 502
export class OAuthError extends AppError {
  constructor(detail: string) {
    super(`OAuth error: ${detail}`, 502, "OAUTH_ERROR");
    this.name = "OAuthError";
  }
}
