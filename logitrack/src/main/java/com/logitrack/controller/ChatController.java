package com.logitrack.controller;

import com.logitrack.dto.ApiResponse;
import com.logitrack.dto.ChatRequest;
import com.logitrack.entity.User;
import com.logitrack.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * POST /api/chat/message
     * Authenticated users send a message and get an AI response
     * with full awareness of their live shipment data
     */
    @PostMapping("/message")
    public ResponseEntity<ApiResponse<String>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User currentUser) {

        String reply = chatService.chat(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Response generated", reply));
    }
}