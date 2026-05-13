package com.voyage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VoyageApplication {
    public static void main(String[] args) {
        SpringApplication.run(VoyageApplication.class, args);
    }
}
