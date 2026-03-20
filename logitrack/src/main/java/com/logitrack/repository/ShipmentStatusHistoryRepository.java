package com.logitrack.repository;

import com.logitrack.entity.Shipment;
import com.logitrack.entity.ShipmentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentStatusHistoryRepository extends JpaRepository<ShipmentStatusHistory, Long> {

    List<ShipmentStatusHistory> findByShipmentOrderByChangedAtAsc(Shipment shipment);
}
