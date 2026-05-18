package com.voyage.service;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class ExchangeRateServiceTest {

    @Test
    void extractRates_fromCache_returnsCorrectMap() throws Exception {
        ExchangeRateService svc = new ExchangeRateService();

        // populate private cache via reflection
        Field cacheField = ExchangeRateService.class.getDeclaredField("cache");
        cacheField.setAccessible(true);
        Map<String, Map<String, Object>> cache = new HashMap<>();
        Map<String, Object> rates = new HashMap<>();
        rates.put("EUR", 0.85);
        rates.put("_fetchedAt", System.currentTimeMillis());
        cache.put("USD_EUR", rates);
        cacheField.set(svc, cache);

        Map<String, BigDecimal> result = svc.getRates("USD", "EUR");
        assertEquals(new BigDecimal("0.85"), result.get("EUR"));
    }
}
