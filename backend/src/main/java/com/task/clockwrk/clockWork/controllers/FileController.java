package com.task.clockwrk.clockWork.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.task.clockwrk.clockWork.exception.ApiException;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/upload")
@Slf4j
public class FileController {

    @Value("${file.upload.max-size:2097152}")
    private long maxFileSize;

    @Value("${file.upload.allowed-types:image/jpeg,image/png,image/gif,image/webp,image/svg+xml}")
    private String allowedTypesString;

    private List<String> allowedTypes;
    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        // Parse allowed types
        this.allowedTypes = List.of(allowedTypesString.split(","));
        
        // Initialize storage location
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("File upload directory created at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Could not create upload directory", ex);
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw ApiException.badRequest("Please select a file to upload");
        }

        // Validate file size
        if (file.getSize() > maxFileSize) {
            throw ApiException.badRequest("File size exceeds maximum allowed size of " + (maxFileSize / 1024 / 1024) + "MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw ApiException.badRequest("File type not allowed. Allowed types: " + String.join(", ", allowedTypes));
        }

        String originalFilename = file.getOriginalFilename();
        String fileName = StringUtils.cleanPath(originalFilename != null ? originalFilename : "file");
        
        // Check for path traversal attack
        if (fileName.contains("..")) {
            throw ApiException.badRequest("Invalid filename");
        }

        try {
            // Generate unique name to avoid collisions
            String fileExtension = "";
            int i = fileName.lastIndexOf('.');
            if (i > 0) {
                fileExtension = fileName.substring(i).toLowerCase();
            }
            
            // Validate extension matches content type
            if (!isExtensionValid(fileExtension, contentType)) {
                throw ApiException.badRequest("File extension does not match content type");
            }

            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(uniqueFileName)
                    .toUriString();

            log.info("File uploaded successfully: {}", uniqueFileName);
            
            return ResponseEntity.ok(Map.of("url", fileDownloadUri));

        } catch (IOException ex) {
            log.error("Could not store file: {}", fileName, ex);
            throw ApiException.internalError("Could not store file. Please try again!");
        }
    }

    private boolean isExtensionValid(String extension, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> extension.equals(".jpg") || extension.equals(".jpeg");
            case "image/png" -> extension.equals(".png");
            case "image/gif" -> extension.equals(".gif");
            case "image/webp" -> extension.equals(".webp");
            case "image/svg+xml" -> extension.equals(".svg");
            default -> false;
        };
    }
}
