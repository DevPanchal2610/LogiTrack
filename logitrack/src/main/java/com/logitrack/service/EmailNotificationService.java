package com.logitrack.service;

import com.logitrack.entity.Shipment;
import com.logitrack.enums.ShipmentStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Async
    public void sendStatusUpdateEmail(Shipment shipment, ShipmentStatus newStatus, String location) {
        try {
            // Notify customer
            sendEmail(
                    shipment.getCustomer().getEmail(),
                    buildSubject(shipment.getTrackingNumber(), newStatus),
                    buildCustomerBody(shipment, newStatus, location)
            );

            // Notify vendor
            sendEmail(
                    shipment.getVendor().getEmail(),
                    buildSubject(shipment.getTrackingNumber(), newStatus),
                    buildVendorBody(shipment, newStatus, location)
            );

            logger.info("Status update emails sent for shipment: {}", shipment.getTrackingNumber());

        } catch (Exception e) {
            logger.error("Failed to send email for shipment {}: {}", shipment.getTrackingNumber(), e.getMessage());
        }
    }

    @Async
    public void sendShipmentCreatedEmail(Shipment shipment) {
        try {
            sendEmail(
                    shipment.getCustomer().getEmail(),
                    "Your Shipment Has Been Created - " + shipment.getTrackingNumber(),
                    "Dear " + shipment.getCustomer().getFullName() + ",\n\n"
                    + "A new shipment has been created for you.\n\n"
                    + "Tracking Number : " + shipment.getTrackingNumber() + "\n"
                    + "Description     : " + shipment.getDescription() + "\n"
                    + "From            : " + shipment.getOriginAddress() + "\n"
                    + "To              : " + shipment.getDestinationAddress() + "\n"
                    + (shipment.getEstimatedDelivery() != null
                        ? "Est. Delivery   : " + shipment.getEstimatedDelivery() + "\n" : "")
                    + "\nYou can track your shipment anytime using the tracking number above.\n\n"
                    + "Regards,\nLogiTrack Team"
            );
        } catch (Exception e) {
            logger.error("Failed to send creation email for shipment {}: {}", shipment.getTrackingNumber(), e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private String buildSubject(String trackingNumber, ShipmentStatus status) {
        return "Shipment Update [" + trackingNumber + "] - " + formatStatus(status);
    }

    private String buildCustomerBody(Shipment shipment, ShipmentStatus status, String location) {
        return "Dear " + shipment.getCustomer().getFullName() + ",\n\n"
                + "Your shipment status has been updated.\n\n"
                + "Tracking Number : " + shipment.getTrackingNumber() + "\n"
                + "New Status      : " + formatStatus(status) + "\n"
                + "Current Location: " + location + "\n"
                + (status == ShipmentStatus.DELIVERED
                    ? "\nYour shipment has been delivered. Thank you for using LogiTrack!\n"
                    : "\nWe will notify you of any further updates.\n")
                + "\nRegards,\nLogiTrack Team";
    }

    private String buildVendorBody(Shipment shipment, ShipmentStatus status, String location) {
        return "Dear " + shipment.getVendor().getFullName() + ",\n\n"
                + "Status update recorded for your shipment.\n\n"
                + "Tracking Number : " + shipment.getTrackingNumber() + "\n"
                + "Customer        : " + shipment.getCustomer().getFullName() + "\n"
                + "New Status      : " + formatStatus(status) + "\n"
                + "Current Location: " + location + "\n\n"
                + "Regards,\nLogiTrack Team";
    }

    private String formatStatus(ShipmentStatus status) {
        return status.name().replace("_", " ");
    }
}
