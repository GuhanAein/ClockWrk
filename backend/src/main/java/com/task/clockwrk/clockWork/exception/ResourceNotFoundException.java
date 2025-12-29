package com.task.clockwrk.clockWork.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String resource) {
        super(resource + " not found", HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String resource, String identifier) {
        super(resource + " not found with identifier: " + identifier, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}

