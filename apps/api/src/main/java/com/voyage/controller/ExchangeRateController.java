package com.voyage.controller;

import com.voyage.service.ExchangeRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/exchange-rates")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    public ExchangeRateController(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    @GetMapping
    public ResponseEntity<Map<String, BigDecimal>> getRates(
        @RequestParam String base,
        @RequestParam String targets
    ) {
        return ResponseEntity.ok(exchangeRateService.getRates(base.toUpperCase(), targets.toUpperCase()));
    }
}
