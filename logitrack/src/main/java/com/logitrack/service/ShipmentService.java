package com.logitrack.service;

import com.logitrack.dto.CreateShipmentRequest;
import com.logitrack.dto.ShipmentResponse;
import com.logitrack.dto.UpdateStatusRequest;
import com.logitrack.entity.User;

import java.util.List;

public interface ShipmentService {
    ShipmentResponse createShipment(CreateShipmentRequest request, User vendor);
    ShipmentResponse updateStatus(Long shipmentId, UpdateStatusRequest request, User updatedBy);
    ShipmentResponse trackByTrackingNumber(String trackingNumber);
    ShipmentResponse getById(Long id);
    List<ShipmentResponse> getMyShipments(User user);
    List<ShipmentResponse> getAllShipments();
    void deleteShipment(Long id);
}
