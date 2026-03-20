package com.logitrack.repository;

import com.logitrack.entity.Shipment;
import com.logitrack.entity.User;
import com.logitrack.enums.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    List<Shipment> findByCustomer(User customer);

    List<Shipment> findByVendor(User vendor);

    List<Shipment> findByCurrentStatus(ShipmentStatus status);

    boolean existsByTrackingNumber(String trackingNumber);
}
