package com.task.clockwrk.clockWork.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    
    private final HttpStatus status;
    private final String code;

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.code = status.name();
    }

    public ApiException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    // Common exceptions
    public static ApiException notFound(String message) {
        return new ApiException(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static ApiException badRequest(String message) {
        return new ApiException(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static ApiException forbidden(String message) {
        return new ApiException(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public static ApiException conflict(String message) {
        return new ApiException(message, HttpStatus.CONFLICT, "CONFLICT");
    }

    public static ApiException internalError(String message) {
        return new ApiException(message, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR");
    }
}
