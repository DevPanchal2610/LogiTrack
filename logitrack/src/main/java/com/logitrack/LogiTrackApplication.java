package com.logitrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LogiTrackApplication {
    public static void main(String[] args) {
        SpringApplication.run(LogiTrackApplication.class, args);
    }
}
