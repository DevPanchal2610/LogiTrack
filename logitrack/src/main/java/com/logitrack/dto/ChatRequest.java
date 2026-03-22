package com.logitrack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    // Conversation history for multi-turn chat
    // Each entry: {"role": "user"/"assistant", "content": "..."}
    private List<MessageDto> history;

    @Data
    public static class MessageDto {
        private String role;
        private String content;
    }
}