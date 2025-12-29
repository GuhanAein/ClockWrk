package com.task.clockwrk.clockWork.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends ApiException {
    public UnauthorizedException() {
        super("Unauthorized access", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }
}

