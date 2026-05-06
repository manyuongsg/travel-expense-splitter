package com.splitandshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SplitAndShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(SplitAndShareApplication.class, args);
    }
}
