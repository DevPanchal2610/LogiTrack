package com.logitrack.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.logitrack.dto.ChatRequest;
import com.logitrack.entity.Shipment;
import com.logitrack.entity.User;
import com.logitrack.enums.Role;
import com.logitrack.repository.ShipmentRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ShipmentRepository shipmentRepository;
    private final RestClient restClient = RestClient.create();

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String model;

    public String chat(ChatRequest request, User currentUser) {

        // 1. Fetch live shipment data
        List<Shipment> shipments = currentUser.getRole() == Role.ADMIN
                ? shipmentRepository.findAll()
                : currentUser.getRole() == Role.VENDOR
                ? shipmentRepository.findByVendor(currentUser)
                : shipmentRepository.findByCustomer(currentUser);

        // 2. Build messages list
        List<Map<String, String>> messages = new ArrayList<>();

        // System message with live shipment context
        messages.add(Map.of(
                "role", "system",
                "content", buildSystemPrompt(currentUser, shipments)
        ));

        // Add conversation history
        if (request.getHistory() != null) {
            for (ChatRequest.MessageDto h : request.getHistory()) {
                messages.add(Map.of("role", h.getRole(), "content", h.getContent()));
            }
        }

        // Add current user message
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        // 3. Build request body — clean, no extra fields
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("max_tokens", 1000);
        body.put("temperature", 0.7);

        // 4. Call Groq API directly
        Map<String, Object> response = restClient.post()
                .uri("https://api.groq.com/openai/v1/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);

        // 5. Extract reply
        if (response != null && response.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        }
        return "Sorry, I could not generate a response.";
    }

    private String buildSystemPrompt(User user, List<Shipment> shipments) {
        String role = user.getRole().name().toLowerCase();
        String firstName = user.getFullName().split(" ")[0];

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("""
            You are LogiBot, a friendly AI assistant for LogiTrack \
            — a shipment and supply chain tracking platform.
            You are speaking with %s, who is logged in as a %s.
            
            """, user.getFullName(), role));

        sb.append("CURRENT SHIPMENT DATA FOR THIS USER:\n");

        if (shipments.isEmpty()) {
            sb.append("No shipments found for this user.\n");
        } else {
            for (Shipment s : shipments) {
                sb.append(String.format("""
                    - Tracking: %s | Status: %s | Description: %s
                      From: %s → To: %s | Weight: %.1f kg
                      Vendor: %s | Customer: %s (%s) | Created: %s
                    """,
                        s.getTrackingNumber(), s.getCurrentStatus(), s.getDescription(),
                        s.getOriginAddress(), s.getDestinationAddress(), s.getWeightKg(),
                        s.getVendor().getFullName(), s.getCustomer().getFullName(),
                        s.getCustomer().getEmail(), s.getCreatedAt().format(FMT)
                ));
                if (s.getEstimatedDelivery() != null)
                    sb.append("  Est. Delivery: ").append(s.getEstimatedDelivery().format(FMT)).append("\n");
                if (!s.getStatusHistory().isEmpty()) {
                    var last = s.getStatusHistory().get(s.getStatusHistory().size() - 1);
                    sb.append("  Last Update: ").append(last.getStatus())
                            .append(" at ").append(last.getLocation()).append("\n");
                }
            }
        }

        sb.append(String.format("""
            
            RULES:
            - Keep responses concise and friendly — 2-4 sentences unless more detail is needed
            - Always address the user by their first name (%s)
            - Never make up tracking numbers or data not listed above
            - Format tracking numbers in backticks like `LGT-XXXXXX`
            """, firstName));

        return sb.toString();
    }
}