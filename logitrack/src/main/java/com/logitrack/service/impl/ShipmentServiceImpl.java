package com.logitrack.service.impl;

import com.logitrack.dto.CreateShipmentRequest;
import com.logitrack.dto.ShipmentResponse;
import com.logitrack.dto.StatusHistoryResponse;
import com.logitrack.dto.UpdateStatusRequest;
import com.logitrack.entity.Shipment;
import com.logitrack.entity.ShipmentStatusHistory;
import com.logitrack.entity.User;
import com.logitrack.enums.Role;
import com.logitrack.enums.ShipmentStatus;
import com.logitrack.exception.BadRequestException;
import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.repository.ShipmentRepository;
import com.logitrack.repository.ShipmentStatusHistoryRepository;
import com.logitrack.repository.UserRepository;
import com.logitrack.service.EmailNotificationService;
import com.logitrack.service.NotificationService;
import com.logitrack.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailService;
    private final NotificationService notificationService;

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request, User vendor) {
        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        if (customer.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("The specified user is not a customer");
        }

        Shipment shipment = Shipment.builder()
                .trackingNumber(generateTrackingNumber())
                .description(request.getDescription())
                .originAddress(request.getOriginAddress())
                .destinationAddress(request.getDestinationAddress())
                .weightKg(request.getWeightKg())
                .currentStatus(ShipmentStatus.CREATED)
                .vendor(vendor)
                .customer(customer)
                .estimatedDelivery(request.getEstimatedDelivery())
                .build();

        shipmentRepository.save(shipment);

        // Record initial status in history
        recordHistory(shipment, ShipmentStatus.CREATED, request.getOriginAddress(),
                "Shipment created and registered in the system", vendor);

        // Fire async email notification
        emailService.sendShipmentCreatedEmail(shipment);
        // Notify the customer in real time
        notificationService.sendToUser(
                customer.getId(),
                "SHIPMENT_CREATED",
                "New shipment created for you: " + shipment.getTrackingNumber(),
                shipment.getId()   // ← add shipmentId
        );
        // Notify all admins
        notificationService.sendToAll(
                "SHIPMENT_CREATED",
                "New shipment " + shipment.getTrackingNumber() + " created by " + vendor.getFullName(),
                shipment.getId()
        );
        return toResponse(shipment);
    }

    // ----------------------------------------------------------------
    // Update Status
    // ----------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse updateStatus(Long shipmentId, UpdateStatusRequest request, User updatedBy) {
        Shipment shipment = getShipmentById(shipmentId);

        validateStatusTransition(shipment.getCurrentStatus(), request.getNewStatus());

        shipment.setCurrentStatus(request.getNewStatus());

        // Set actual delivery time if delivered
        if (request.getNewStatus() == ShipmentStatus.DELIVERED) {
            shipment.setActualDelivery(LocalDateTime.now());
        }

        shipmentRepository.save(shipment);

        // Record history entry (audit trail)
        recordHistory(shipment, request.getNewStatus(), request.getLocation(),
                request.getRemarks(), updatedBy);

        // Fire async email notification
        emailService.sendStatusUpdateEmail(shipment, request.getNewStatus(), request.getLocation());
        String statusMsg = shipment.getTrackingNumber() + " is now "
                + request.getNewStatus().name().replace("_", " ");

        // Notify customer
        notificationService.sendToUser(
                shipment.getCustomer().getId(),
                "STATUS_UPDATE",
                "Your shipment " + statusMsg,
                shipment.getId()   // ← add shipmentId
        );

        //Notify Vendor
        notificationService.sendToUser(
                shipment.getVendor().getId(),
                "STATUS_UPDATE",
                "Shipment " + statusMsg,
                shipment.getId()   // ← add shipmentId
        );

        // Notify all admins
        notificationService.sendToAll("STATUS_UPDATE", "Shipment " + statusMsg, shipment.getId());
        return toResponse(shipment);
    }

    // ----------------------------------------------------------------
    // Read operations
    // ----------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse trackByTrackingNumber(String trackingNumber) {
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("No shipment found with tracking number: " + trackingNumber));
        return toResponse(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getById(Long id) {
        return toResponse(getShipmentById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> getMyShipments(User user) {
        List<Shipment> shipments = switch (user.getRole()) {
            case CUSTOMER -> shipmentRepository.findByCustomer(user);
            case VENDOR   -> shipmentRepository.findByVendor(user);
            case ADMIN    -> shipmentRepository.findAll();
        };
        return shipments.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> getAllShipments() {
        return shipmentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteShipment(Long id) {
        Shipment shipment = getShipmentById(id);
        if (shipment.getCurrentStatus() != ShipmentStatus.CREATED &&
            shipment.getCurrentStatus() != ShipmentStatus.CANCELLED) {
            throw new BadRequestException("Only CREATED or CANCELLED shipments can be deleted");
        }
        shipmentRepository.delete(shipment);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    private Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + id));
    }

    private void recordHistory(Shipment shipment, ShipmentStatus status,
                               String location, String remarks, User updatedBy) {
        ShipmentStatusHistory history = ShipmentStatusHistory.builder()
                .shipment(shipment)
                .status(status)
                .location(location)
                .remarks(remarks)
                .updatedBy(updatedBy)
                .build();
        historyRepository.save(history);
    }

    private void validateStatusTransition(ShipmentStatus current, ShipmentStatus next) {
        // Prevent going backward or into invalid states
        if (current == ShipmentStatus.DELIVERED || current == ShipmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot update status of a " + current + " shipment");
        }
        if (current == ShipmentStatus.RETURNED && next != ShipmentStatus.CANCELLED) {
            throw new BadRequestException("A RETURNED shipment can only be moved to CANCELLED");
        }
    }

    private String generateTrackingNumber() {
        String uuid = UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 12);
        String trackingNumber = "LGT-" + uuid;
        // Ensure uniqueness (extremely rare collision but safe)
        while (shipmentRepository.existsByTrackingNumber(trackingNumber)) {
            uuid = UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 12);
            trackingNumber = "LGT-" + uuid;
        }
        return trackingNumber;
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        List<StatusHistoryResponse> history = historyRepository
                .findByShipmentOrderByChangedAtAsc(shipment)
                .stream()
                .map(h -> StatusHistoryResponse.builder()
                        .status(h.getStatus().name())
                        .location(h.getLocation())
                        .remarks(h.getRemarks())
                        .updatedBy(h.getUpdatedBy().getFullName())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());

        return ShipmentResponse.builder()
                .id(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .description(shipment.getDescription())
                .originAddress(shipment.getOriginAddress())
                .destinationAddress(shipment.getDestinationAddress())
                .weightKg(shipment.getWeightKg())
                .currentStatus(shipment.getCurrentStatus().name())
                .vendorName(shipment.getVendor().getFullName())
                .customerName(shipment.getCustomer().getFullName())
                .customerEmail(shipment.getCustomer().getEmail())
                .vendorId(shipment.getVendor().getId())
                .customerId(shipment.getCustomer().getId())
                .createdAt(shipment.getCreatedAt())
                .estimatedDelivery(shipment.getEstimatedDelivery())
                .actualDelivery(shipment.getActualDelivery())
                .statusHistory(history)
                .build();
    }
}
