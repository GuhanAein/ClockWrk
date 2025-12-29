package com.task.clockwrk.clockWork.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RefreshTokenRequest {
    
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
