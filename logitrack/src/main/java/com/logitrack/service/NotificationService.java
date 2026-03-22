package com.logitrack.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    // Map of userId -> list of active SSE emitters (multiple tabs support)
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // Clean up on completion/timeout/error
        Runnable cleanup = () -> {
            List<SseEmitter> userEmitters = emitters.get(userId);
            if (userEmitters != null) {
                userEmitters.remove(emitter);
                if (userEmitters.isEmpty()) emitters.remove(userId);
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to LogiTrack notifications"));
        } catch (IOException e) {
            cleanup.run();
        }

        log.info("User {} subscribed to notifications. Active connections: {}",
                userId, emitters.getOrDefault(userId, List.of()).size());

        return emitter;
    }

    @Async
    public void sendToUser(Long userId, String type, String message, Long shipmentId) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        String payload = "{\"type\":\"" + type + "\",\"message\":\"" + message
                + "\",\"shipmentId\":" + (shipmentId != null ? shipmentId : "null")
                + ",\"time\":\"" + java.time.LocalDateTime.now() + "\"}";

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(payload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }
        userEmitters.removeAll(deadEmitters);
    }

    @Async
    public void sendToAll(String type, String message, Long shipmentId) {
        emitters.keySet().forEach(userId -> sendToUser(userId, type, message, shipmentId));
    }

    public int getActiveConnections() {
        return emitters.values().stream().mapToInt(List::size).sum();
    }
}