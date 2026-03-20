package com.logitrack.dto;

import com.logitrack.enums.ShipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "New status is required")
    private ShipmentStatus newStatus;

    @NotBlank(message = "Location is required")
    private String location;

    private String remarks;
}
