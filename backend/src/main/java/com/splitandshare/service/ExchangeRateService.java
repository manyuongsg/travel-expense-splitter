package com.splitandshare.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExchangeRateService {

    private static final String FRANKFURTER_URL = "https://api.frankfurter.app/latest?from={base}&to={targets}";
    private static final long CACHE_TTL_MS = 3_600_000; // 1 hour

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory cache: base -> {target -> rate, _fetchedAt -> timestamp}
    private final Map<String, Map<String, Object>> cache = new HashMap<>();

    public Map<String, BigDecimal> getRates(String base, String targets) {
        String cacheKey = base + "_" + targets;
        Map<String, Object> cached = cache.get(cacheKey);

        if (cached != null) {
            long fetchedAt = (long) cached.get("_fetchedAt");
            if (System.currentTimeMillis() - fetchedAt < CACHE_TTL_MS) {
                return extractRates(cached);
            }
        }

        return fetchAndCache(base, targets, cacheKey);
    }

    private Map<String, BigDecimal> fetchAndCache(String base, String targets, String cacheKey) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                FRANKFURTER_URL, Map.class, base, targets
            );
            if (response == null) throw new RuntimeException("Empty response from exchange rate API");

            @SuppressWarnings("unchecked")
            Map<String, Object> rates = (Map<String, Object>) response.get("rates");
            rates.put("_fetchedAt", System.currentTimeMillis());
            cache.put(cacheKey, rates);
            return extractRates(rates);
        } catch (Exception e) {
            // Return cached (stale) data if fetch fails
            Map<String, Object> stale = cache.get(cacheKey);
            if (stale != null) return extractRates(stale);
            throw new RuntimeException("Exchange rate fetch failed and no cache available: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 3_600_000)
    public void evictCache() {
        long now = System.currentTimeMillis();
        cache.entrySet().removeIf(e -> {
            Object ts = e.getValue().get("_fetchedAt");
            return ts != null && (now - (long) ts) > CACHE_TTL_MS * 2;
        });
    }

    @SuppressWarnings("unchecked")
    private Map<String, BigDecimal> extractRates(Map<String, Object> raw) {
        Map<String, BigDecimal> result = new HashMap<>();
        for (Map.Entry<String, Object> entry : raw.entrySet()) {
            if (entry.getKey().startsWith("_")) continue;
            Object val = entry.getValue();
            if (val instanceof Number num) {
                result.put(entry.getKey(), BigDecimal.valueOf(num.doubleValue()));
            }
        }
        return result;
    }
}
