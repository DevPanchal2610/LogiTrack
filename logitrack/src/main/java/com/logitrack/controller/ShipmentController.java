package com.logitrack.controller;

import com.logitrack.dto.ApiResponse;
import com.logitrack.dto.CreateShipmentRequest;
import com.logitrack.dto.ShipmentResponse;
import com.logitrack.dto.UpdateStatusRequest;
import com.logitrack.entity.User;
import com.logitrack.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    /**
     * POST /api/shipments/create
     * VENDOR or ADMIN creates a new shipment
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ShipmentResponse>> createShipment(
            @Valid @RequestBody CreateShipmentRequest request,
            @AuthenticationPrincipal User currentUser) {

        ShipmentResponse response = shipmentService.createShipment(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Shipment created successfully", response));
    }

    /**
     * PUT /api/shipments/{id}/status
     * VENDOR or ADMIN updates a shipment status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ShipmentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal User currentUser) {

        ShipmentResponse response = shipmentService.updateStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", response));
    }

    /**
     * GET /api/shipments/track/{trackingNumber}
     * Public endpoint — anyone can track a shipment by tracking number
     */
    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ApiResponse<ShipmentResponse>> trackShipment(
            @PathVariable String trackingNumber) {

        ShipmentResponse response = shipmentService.trackByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(ApiResponse.ok("Shipment found", response));
    }

    /**
     * GET /api/shipments/{id}
     * Get full shipment details by ID (authenticated users)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipmentResponse>> getById(@PathVariable Long id) {
        ShipmentResponse response = shipmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok("Shipment retrieved", response));
    }

    /**
     * GET /api/shipments/my
     * Get shipments relevant to the logged-in user
     * - CUSTOMER: their received shipments
     * - VENDOR: their sent shipments
     * - ADMIN: all shipments
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ShipmentResponse>>> getMyShipments(
            @AuthenticationPrincipal User currentUser) {

        List<ShipmentResponse> responses = shipmentService.getMyShipments(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Shipments retrieved", responses));
    }

    /**
     * DELETE /api/shipments/{id}
     * ADMIN only — delete a CREATED or CANCELLED shipment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.ok(ApiResponse.ok("Shipment deleted successfully"));
    }
}
