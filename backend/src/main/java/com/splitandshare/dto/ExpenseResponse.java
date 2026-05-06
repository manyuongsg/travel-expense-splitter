package com.splitandshare.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ExpenseResponse {
    private String id;
    private String description;
    private Long amountCents;
    private String currency;
    private BigDecimal exchangeRate;
    private String splitType;
    private LocalDateTime createdAt;
    private PaidByDto paidBy;
    private List<SplitDto> splits;

    public ExpenseResponse(String id, String description, Long amountCents, String currency,
                           BigDecimal exchangeRate, String splitType, LocalDateTime createdAt,
                           PaidByDto paidBy, List<SplitDto> splits) {
        this.id = id;
        this.description = description;
        this.amountCents = amountCents;
        this.currency = currency;
        this.exchangeRate = exchangeRate;
        this.splitType = splitType;
        this.createdAt = createdAt;
        this.paidBy = paidBy;
        this.splits = splits;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getAmountCents() { return amountCents; }
    public void setAmountCents(Long amountCents) { this.amountCents = amountCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getSplitType() { return splitType; }
    public void setSplitType(String splitType) { this.splitType = splitType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public PaidByDto getPaidBy() { return paidBy; }
    public void setPaidBy(PaidByDto paidBy) { this.paidBy = paidBy; }
    public List<SplitDto> getSplits() { return splits; }
    public void setSplits(List<SplitDto> splits) { this.splits = splits; }

    public static class PaidByDto {
        private String id;
        private String displayName;

        public PaidByDto(String id, String displayName) {
            this.id = id;
            this.displayName = displayName;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
    }

    public static class SplitDto {
        private String id;
        private String owedById;
        private String owedByName;
        private Long shareAmountCents;
        private boolean settled;

        public SplitDto(String id, String owedById, String owedByName, Long shareAmountCents, boolean settled) {
            this.id = id;
            this.owedById = owedById;
            this.owedByName = owedByName;
            this.shareAmountCents = shareAmountCents;
            this.settled = settled;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getOwedById() { return owedById; }
        public void setOwedById(String owedById) { this.owedById = owedById; }
        public String getOwedByName() { return owedByName; }
        public void setOwedByName(String owedByName) { this.owedByName = owedByName; }
        public Long getShareAmountCents() { return shareAmountCents; }
        public void setShareAmountCents(Long shareAmountCents) { this.shareAmountCents = shareAmountCents; }
        public boolean isSettled() { return settled; }
        public void setSettled(boolean settled) { this.settled = settled; }
    }
}
