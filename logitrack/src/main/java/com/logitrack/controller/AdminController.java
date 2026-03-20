package com.logitrack.controller;

import com.logitrack.dto.ApiResponse;
import com.logitrack.dto.ShipmentResponse;
import com.logitrack.entity.User;
import com.logitrack.enums.Role;
import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.repository.UserRepository;
import com.logitrack.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ShipmentService shipmentService;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/shipments
     * Get all shipments in the system
     */
    @GetMapping("/shipments")
    public ResponseEntity<ApiResponse<List<ShipmentResponse>>> getAllShipments() {
        List<ShipmentResponse> shipments = shipmentService.getAllShipments();
        return ResponseEntity.ok(ApiResponse.ok("All shipments retrieved", shipments));
    }

    /**
     * GET /api/admin/users
     * Get all registered users
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok("All users retrieved", users));
    }

    /**
     * GET /api/admin/users/vendors
     * Get all vendors
     */
    @GetMapping("/users/vendors")
    public ResponseEntity<ApiResponse<List<User>>> getVendors() {
        return ResponseEntity.ok(ApiResponse.ok("Vendors retrieved",
                userRepository.findByRole(Role.VENDOR)));
    }

    /**
     * GET /api/admin/users/customers
     * Get all customers — accessible by VENDOR and ADMIN
     */
    @GetMapping("/users/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")  // ← ADD THIS LINE
    public ResponseEntity<ApiResponse<List<User>>> getCustomers() {
        return ResponseEntity.ok(ApiResponse.ok("Customers retrieved",
                userRepository.findByRole(Role.CUSTOMER)));
    }

    /**
     * DELETE /api/admin/users/{id}
     * Delete a user account
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully"));
    }
}
