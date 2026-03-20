package com.logitrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Long id;
    private String trackingNumber;
    private String description;
    private String originAddress;
    private String destinationAddress;
    private Double weightKg;
    private String currentStatus;
    private String vendorName;
    private String customerName;
    private String customerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime actualDelivery;
    private List<StatusHistoryResponse> statusHistory;
}
