package com.task.clockwrk.clockWork.dtos;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {
    
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;
    
    @URL(message = "Profile picture URL must be a valid URL")
    private String profilePictureUrl;
}
